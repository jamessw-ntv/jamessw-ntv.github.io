#!/usr/bin/env python3
"""Refresh personal/data.json from public, keyless sources.

Keep-last-good per source (a source that
errors leaves its existing data untouched), validate before accept, and only
write when the meaningful data changed. Runs in GitHub Actions (open internet),
NOT in the dev sandbox.

Sources:
  - weather  : Open-Meteo forecast (keyless)
  - markets  : CoinGecko (crypto, AUD) + Stooq (ASX daily closes)
  - dev      : GitHub REST API (jamessw-ntv public repos)
  - releases : RSS feeds (Trek/Wars news, game patch notes, film/TV)
"""
import json
import sys
import os
import time
import urllib.request
import urllib.parse
import datetime
import pathlib
import email.utils
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "personal" / "data.json"
UA = "jamessw-ntv-dashboard/1.0 (+https://github.com/jamessw-ntv/jamessw-ntv.github.io)"
LAT, LON = -37.88, 145.30  # Ferntree Gully, VIC


def _get(url, headers=None, timeout=30):
    h = {"User-Agent": UA, "Accept-Encoding": "identity"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def get_json(url, headers=None):
    body = _get(url, headers)
    try:
        return json.loads(body)
    except json.JSONDecodeError as e:
        raise ValueError(f"non-JSON ({len(body)}b) from {url}: {body[:120]!r}") from e


# --- weather via Open-Meteo (https://open-meteo.com) ------------------------
WMO = {
    0: ("Clear", "☀️"), 1: ("Mainly clear", "🌤️"), 2: ("Partly cloudy", "⛅"),
    3: ("Overcast", "☁️"), 45: ("Fog", "🌫️"), 48: ("Fog", "🌫️"),
    51: ("Drizzle", "🌦️"), 53: ("Drizzle", "🌦️"), 55: ("Drizzle", "🌦️"),
    56: ("Freezing drizzle", "🌧️"), 57: ("Freezing drizzle", "🌧️"),
    61: ("Rain", "🌧️"), 63: ("Rain", "🌧️"), 65: ("Heavy rain", "🌧️"),
    66: ("Freezing rain", "🌧️"), 67: ("Freezing rain", "🌧️"),
    71: ("Snow", "🌨️"), 73: ("Snow", "🌨️"), 75: ("Heavy snow", "🌨️"), 77: ("Snow grains", "🌨️"),
    80: ("Showers", "🌦️"), 81: ("Showers", "🌦️"), 82: ("Heavy showers", "🌦️"),
    85: ("Snow showers", "🌨️"), 86: ("Snow showers", "🌨️"),
    95: ("Thunderstorm", "⛈️"), 96: ("Thunderstorm", "⛈️"), 99: ("Thunderstorm", "⛈️"),
}


def wmo(code):
    try:
        return WMO[int(code)]
    except (KeyError, TypeError, ValueError):
        return ("—", "🌡️")


def refresh_weather(data):
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={LAT}&longitude={LON}"
        "&current=temperature_2m,weather_code,wind_speed_10m"
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
        "&timezone=Australia/Melbourne&forecast_days=3"
    )
    j = get_json(url)
    cur = j.get("current") or {}
    daily = j.get("daily") or {}
    times = daily.get("time") or []
    if not cur or not times:
        raise ValueError("Open-Meteo response missing current/daily")
    desc, icon = wmo(cur.get("weather_code"))
    days = []
    for i, _ in enumerate(times):
        dd, ic = wmo(daily["weather_code"][i])
        days.append({
            "day": "Today" if i == 0 else datetime.date.fromisoformat(times[i]).strftime("%a"),
            "min": round(float(daily["temperature_2m_min"][i])),
            "max": round(float(daily["temperature_2m_max"][i])),
            "icon": ic, "desc": dd,
            "rain": daily["precipitation_probability_max"][i],
        })
    w = data.setdefault("weather", {})
    w["now"] = {
        "temp": round(float(cur["temperature_2m"])),
        "icon": icon, "desc": desc,
        "wind": round(float(cur["wind_speed_10m"])),
    }
    w["days"] = days
    w["place"] = data.get("meta", {}).get("place", w.get("place", ""))
    return f"weather ({w['now']['temp']}°, {desc})"


# --- markets: CoinGecko (crypto) + Yahoo Finance (ASX) ----------------------
# Stooq serves an HTML block page to datacenter IPs, so it's unusable from CI.
# Yahoo's v8 chart endpoint is keyless and cloud-friendly; query1 with a query2
# fallback. meta carries the live price and the prior session close.
BROWSER_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"


def _yahoo_quote(sym):
    """Latest price + day-on-day % from Yahoo's v8 chart endpoint.

    Yahoo rate-limits GitHub's shared runner IPs (HTTP 429), but the throttle
    windows are short, so we retry across both hosts with a backoff. keep-last-
    good holds the prior price on the runs that don't get through.
    """
    last_err = None
    for host, delay in (("query1", 0.0), ("query2", 1.0), ("query1", 2.0), ("query2", 3.0)):
        if delay:
            time.sleep(delay)
        url = (f"https://{host}.finance.yahoo.com/v8/finance/chart/"
               + urllib.parse.quote(sym) + "?range=5d&interval=1d")
        try:
            j = get_json(url, {"User-Agent": BROWSER_UA})
            res = (j.get("chart") or {}).get("result") or []
            if not res:
                raise ValueError(f"no result ({(j.get('chart') or {}).get('error')})")
            meta = res[0].get("meta") or {}
            price = meta.get("regularMarketPrice")
            prev = meta.get("chartPreviousClose") or meta.get("previousClose")
            if price is None:
                raise ValueError("no regularMarketPrice in meta")
            price = float(price)
            pct = round((price - float(prev)) / float(prev) * 100, 2) if prev else None
            return round(price, 2), pct
        except Exception as e:  # noqa: BLE001 - back off and try the next host
            last_err = e
    raise ValueError(f"yahoo failed for {sym}: {last_err}")


def refresh_markets(data):
    m = data.setdefault("markets", {})
    notes = []
    # crypto: one call, clean 24h change
    try:
        cg = get_json(
            "https://api.coingecko.com/api/v3/simple/price"
            "?ids=bitcoin,ethereum&vs_currencies=aud&include_24hr_change=true"
        )
        ids = {"BTC": "bitcoin", "ETH": "ethereum"}
        for row in m.get("crypto", []):
            q = cg.get(ids.get(row["code"], ""))
            if q:
                row["price"] = round(float(q["aud"]), 2)
                ch = q.get("aud_24h_change")
                row["pct"] = round(float(ch), 2) if ch is not None else None
        notes.append("crypto")
    except Exception as e:  # noqa: BLE001
        print(f"::warning::crypto failed, keeping last-good: {e}", file=sys.stderr)
    # asx: per-symbol daily closes (per-symbol keep-last-good)
    ok = 0
    for row in m.get("asx", []):
        try:
            row["price"], row["pct"] = _yahoo_quote(row["code"] + ".AX")
            ok += 1
        except Exception as e:  # noqa: BLE001
            print(f"::warning::ASX {row['code']} failed, keeping last-good: {e}", file=sys.stderr)
    if ok:
        notes.append(f"asx({ok})")
    if not notes:
        raise ValueError("all market sources failed")
    return "markets " + "+".join(notes)


# --- dev via GitHub REST API ------------------------------------------------
def _rel_time(iso):
    try:
        dt = datetime.datetime.fromisoformat((iso or "").replace("Z", "+00:00"))
    except ValueError:
        return ""
    mins = (datetime.datetime.now(datetime.timezone.utc) - dt).total_seconds() / 60
    if mins < 60:
        return f"{int(mins)}m ago"
    if mins < 1440:
        return f"{int(mins / 60)}h ago"
    if mins < 43200:
        return f"{int(mins / 1440)}d ago"
    return dt.strftime("%b %Y")


def refresh_dev(data):
    headers = {"Accept": "application/vnd.github+json"}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    repos = get_json(
        "https://api.github.com/users/jamessw-ntv/repos?sort=pushed&per_page=20&type=owner",
        headers,
    )
    if not isinstance(repos, list):
        raise ValueError(f"unexpected repos payload: {str(repos)[:120]}")
    out = []
    for r in repos:
        if r.get("fork"):
            continue
        out.append({
            "repo": r["name"],
            "desc": (r.get("description") or "").strip(),
            "pushed": _rel_time(r.get("pushed_at", "")),
            "lang": r.get("language") or "repo",
            "commit": "",
        })
        if len(out) >= 8:
            break
    if not out:
        raise ValueError("no repos returned")
    data["dev"] = out
    return f"dev ({len(out)} repos)"


# --- releases via RSS -------------------------------------------------------
FEEDS = [
    ("Trek/Wars", "https://trekmovie.com/feed/", "TrekMovie", 3),
    ("Trek/Wars", "https://www.starwarsnewsnet.com/feed/", "SW News Net", 3),
    ("Games", "https://store.steampowered.com/feeds/news/app/526870/", "Satisfactory", 3),
    ("Film/TV", "https://variety.com/feed/", "Variety", 4),
]
ATOM = "{http://www.w3.org/2005/Atom}"


def _date_bits(s):
    s = (s or "").strip()
    if not s:
        return 0.0, ""
    dt = None
    try:
        dt = email.utils.parsedate_to_datetime(s)
    except (TypeError, ValueError):
        try:
            dt = datetime.datetime.fromisoformat(s.replace("Z", "+00:00"))
        except ValueError:
            dt = None
    if dt is None:
        return 0.0, ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    return dt.timestamp(), dt.strftime("%-d %b")


def _parse_feed(xml_text, cat, source, limit):
    root = ET.fromstring(xml_text)
    chan = root.find("channel")
    nodes = chan.findall("item") if chan is not None else root.findall(f"{ATOM}entry")
    items = []
    for n in nodes[:limit]:
        if n.tag == "item":
            title, raw_link = n.findtext("title"), n.findtext("link")
            date = n.findtext("pubDate")
        else:  # Atom
            title = n.findtext(f"{ATOM}title")
            le = n.find(f"{ATOM}link")
            raw_link = le.get("href") if le is not None else ""
            date = n.findtext(f"{ATOM}updated") or n.findtext(f"{ATOM}published")
        title = (title or "").strip()
        if not title:
            continue
        ts, when = _date_bits(date)
        items.append({"cat": cat, "title": title, "when": when,
                      "source": source, "url": (raw_link or "").strip(), "_ts": ts})
    return items


def refresh_releases(data):
    items, ok = [], 0
    for cat, url, source, limit in FEEDS:
        try:
            xml_text = _get(url, {"Accept": "application/rss+xml, application/xml, text/xml"})
            items.extend(_parse_feed(xml_text, cat, source, limit))
            ok += 1
        except Exception as e:  # noqa: BLE001
            print(f"::warning::feed {source} failed: {e}", file=sys.stderr)
    if not items:
        raise ValueError("all release feeds failed")
    items.sort(key=lambda x: x.get("_ts", 0), reverse=True)
    items = items[:12]
    for it in items:
        it.pop("_ts", None)
    data["releases"] = items
    return f"releases ({len(items)} from {ok} feeds)"


SOURCES = [
    ("weather", refresh_weather),
    ("markets", refresh_markets),
    ("dev", refresh_dev),
    ("releases", refresh_releases),
]


def _canon(d):
    """Structural fingerprint ignoring freshness stamps, so we only commit real changes."""
    c = json.loads(json.dumps(d))
    meta = c.get("meta", {})
    meta.pop("fetched", None)
    meta.pop("updated", None)
    return json.dumps(c, ensure_ascii=False, sort_keys=True)


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    before = _canon(data)
    results, errors = [], []
    for name, fn in SOURCES:
        try:
            results.append(fn(data))
        except Exception as e:  # noqa: BLE001 - one bad source must not sink the rest
            errors.append(f"{name}: {e}")
            print(f"::warning::{name} refresh failed, keeping last-good: {e}", file=sys.stderr)

    changed = _canon(data) != before
    if changed:
        now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()
        data["meta"]["fetched"] = now
        data["meta"]["updated"] = now[:10]
        data["meta"]["note"] = ("Live. weather Open-Meteo · crypto CoinGecko · "
                                "ASX Yahoo · dev GitHub · releases RSS.")
        DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"updated: {', '.join(results) or 'none'}")
    if errors:
        print(f"errors:  {'; '.join(errors)}")
    print(f"changed: {changed}")
    if errors and not results:
        sys.exit(1)


if __name__ == "__main__":
    main()
