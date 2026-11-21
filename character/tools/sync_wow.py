"""Regenerate character/forever.json for one WoW Forever character from addon save files.

Reads (never writes) the WoW folder: AutoBiographer (per-character) and Syndicator (account).
Writes character/forever.json, then commits and pushes ONLY that file, and only when the
numbers changed (synced/updated timestamps alone don't count).

Usage:
  python -I sync_wow.py              # regenerate, commit + push if changed
  python -I sync_wow.py --no-git     # regenerate the file only
  python -I sync_wow.py --dry-run    # print the JSON, write nothing

Privacy: no account folder name, BattleTag, email, file paths, guild or other players' names
are written to the output.
"""
import argparse, collections, datetime as dt, glob, json, os, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from luasv import load  # noqa: E402

WOW_ROOT = r"C:\Program Files (x86)\World of Warcraft"
FLAVOUR_DIR = "_forever_"
CHAR_FOLDER = "Capsiel-Deadset"          # WTF\Account\<acct>\<realm>\<this>
SYNDICATOR_NAME = "Capsiel Deadset"      # details.character in Syndicator
MAX_LEVEL = 60

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
OUT_REL = "character/forever.json"
OUT = os.path.join(REPO, *OUT_REL.split("/"))

# Vanilla XP needed to go from level N to N+1.
XP_TABLE = [0, 400, 900, 1400, 2100, 2800, 3600, 4500, 5400, 6500, 7600, 8800, 10100, 11400,
            12900, 14400, 16000, 17700, 19400, 21300, 23200, 25200, 27300, 29400, 31700, 34000,
            36400, 38900, 41400, 44300, 47400, 50800, 54500, 58600, 62800, 67100, 71600, 76100,
            80800, 85700, 90700, 95800, 101000, 106300, 111800, 117500, 123200, 129100, 135100,
            141200, 147500, 153900, 160400, 167100, 173900, 180800, 187900, 195000, 202300, 209800]

# AutoBiographer enums (Enum.lua)
EV_BG, EV_DEATH, EV_LEVEL, EV_ITEM, EV_KILL, EV_MAP, EV_SKILL, EV_REP, EV_STAT = 0, 1, 2, 6, 7, 8, 13, 18, 21
ST_BOSS, ST_FIRSTKILL, ST_LEVELUP, ST_DEATH, ST_SKILL, ST_ZONE, ST_REP, ST_BGLOST, ST_BGWON, ST_STAT, ST_EQUIP = 0, 2, 6, 7, 9, 12, 13, 15, 16, 21, 22
T_AFK, T_CAST, T_DEAD, T_COMBAT, T_LOGGEDIN, T_TAXI = 0, 1, 2, 3, 4, 5
MONEY_LOOT, MONEY_QUEST, MONEY_MERCHANT = 1, 3, 9
DMG_DEALT, DMG_TAKEN, HEAL_DEALT = 0, 1, 3
KILL_TYPES = (1, 2)  # tagged group kill / tagged killing blow


def die(msg):
    print("ERROR:", msg, file=sys.stderr)
    sys.exit(1)


def find_one(pattern):
    hits = glob.glob(pattern)
    if not hits:
        die(f"no file matches {os.path.basename(pattern)} for {FLAVOUR_DIR}/{CHAR_FOLDER}")
    return max(hits, key=os.path.getmtime)


def day(ts):
    return dt.datetime.fromtimestamp(ts).strftime("%Y-%m-%d")


def iso(ts):
    return dt.datetime.fromtimestamp(ts, dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fmt_played(sec):
    sec = int(sec)
    d, rem = divmod(sec, 86400)
    h, rem = divmod(rem, 3600)
    m = rem // 60
    return f"{d}d {h}h {m}m" if d else (f"{h}h {m}m" if h else f"{m}m")


def hrs(sec):
    return round((sec or 0) / 3600, 2)


def num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else 0


def sum_amounts(node):
    """Damage tables are {spell:{Amount}} or {unit:{spell:{Amount}}}; sum every Amount."""
    if not isinstance(node, dict):
        return 0
    if "Amount" in node:
        return num(node["Amount"])
    return sum(sum_amounts(v) for v in node.values())


def build():
    flav = os.path.join(WOW_ROOT, FLAVOUR_DIR, "WTF", "Account")
    ab_path = find_one(os.path.join(flav, "*", "*", CHAR_FOLDER, "SavedVariables", "AutoBiographer.lua"))
    acct_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(ab_path))))
    syn_path = os.path.join(acct_dir, "SavedVariables", "Syndicator.lua")

    ab = load(ab_path)
    info = ab.get("AUTOBIOGRAPHER_INFO_CHAR", {})
    levels = {k: v for k, v in ab.get("AUTOBIOGRAPHER_LEVELS_CHAR", {}).items() if isinstance(k, int)}
    events = sorted(ab.get("AUTOBIOGRAPHER_EVENTS_CHAR", {}).values(), key=lambda e: num(e.get("Timestamp")))
    cat = ab.get("AUTOBIOGRAPHER_CATALOGS_CHAR", {})
    units = cat.get("UnitCatalog", {})

    # --- Syndicator: identity + gold
    syn_char, gold = {}, None
    if os.path.exists(syn_path):
        syn = load(syn_path)
        for v in syn.values():
            if isinstance(v, dict) and isinstance(v.get("Characters"), dict):
                for c in v["Characters"].values():
                    det = c.get("details", {})
                    if det.get("character") == SYNDICATOR_NAME:
                        syn_char = det
                        gold = round(num(c.get("money")) / 10000, 2)

    played_sec = num(info.get("LastTotalTimePlayed"))
    level = max(levels) if levels else None

    # --- level-up timestamps
    level_ts = {}
    for e in events:
        if e.get("Type") == EV_LEVEL and e.get("SubType") == ST_LEVELUP:
            level_ts[e.get("LevelNum")] = e.get("Timestamp")

    def level_at(ts):
        lv = 1
        for L, t in sorted(level_ts.items(), key=lambda x: x[1]):
            if t <= ts:
                lv = L
        return lv

    def zone_part(area):
        return area.split("-", 1)[0]

    # --- per-level rows. Ding time/played come from level stats, falling back to level snapshots;
    # some levels were never recorded (addon not running), so those fields stay null.
    snaps = {k: v for k, v in (ab.get("AUTOBIOGRAPHER_SNAPSHOTS_CHAR", {}).get("Levels") or {}).items()
             if isinstance(k, int)}
    ding_played, ding_ts = {}, {}
    for L in set(levels) | set(snaps):
        p = num((levels.get(L) or {}).get("TotalTimePlayedAtDing")) or num((snaps.get(L) or {}).get("TotalTimePlayed"))
        if p or L == 1:
            ding_played[L] = p
        t = level_ts.get(L) or num((snaps.get(L) or {}).get("Timestamp"))
        if t:
            ding_ts[L] = t
            level_ts.setdefault(L, t)
    level_rows = []
    for L in sorted(set(levels) | set(snaps)):
        s = levels.get(L) or {}
        nxt = ding_played.get(L + 1)
        if L == level:
            this = played_sec - ding_played[L] if L in ding_played else None
        elif "TimePlayedThisLevel" in s:
            this = num(s["TimePlayedThisLevel"])
        elif L in ding_played and nxt:
            this = nxt - ding_played[L]
        else:
            this = None
        if this is not None and this < 0:
            this = None
        zt = collections.Counter()
        for area, t in (s.get("TimeStatisticsByArea") or {}).items():
            zt[zone_part(area)] += num(t.get(T_LOGGEDIN))
        level_rows.append({
            "level": L,
            "reachedAt": iso(ding_ts[L]) if L in ding_ts else None,
            "playedHoursAt": hrs(ding_played[L]) if L in ding_played else None,
            "hoursThisLevel": hrs(this) if this is not None else None,
            "zone": zt.most_common(1)[0][0] if zt else None,
        })

    # --- XP into current level (sum of XP gained since the last ding; AutoBiographer has no direct "current XP")
    xp = xp_max = None
    if level and level < MAX_LEVEL:
        es = levels[level].get("ExperienceStatistics") or {}
        xp = int(sum(num(es.get(k)) for k in (0, 1, 2, 4, 5)) - num(es.get(3)))
        xp_max = XP_TABLE[level] if level < len(XP_TABLE) else None

    # --- totals across all levels
    T = collections.Counter()
    kills_by_unit = collections.Counter()
    zone_time = collections.Counter()
    for s in levels.values():
        for uid, kt in (s.get("KillStatisticsByUnit") or {}).items():
            n = sum(num(kt.get(k)) for k in KILL_TYPES)
            T["kills"] += n
            u = units.get(uid) or units.get(str(uid)) or {}
            if n and u.get("UType", 0) == 0 and u.get("Name"):
                kills_by_unit[u["Name"]] += n
        T["questsCompleted"] += sum(num(q.get(0)) for q in (s.get("QuestStatisticsByQuest") or {}).values())
        T["deaths"] += sum(num(v) for v in (s.get("DeathStatistics") or {}).values())
        ms = s.get("MoneyStatistics") or {}
        T["goldLooted"] += num(ms.get(MONEY_LOOT))
        T["goldFromQuests"] += num(ms.get(MONEY_QUEST))
        T["goldFromVendors"] += num(ms.get(MONEY_MERCHANT))
        ds = s.get("DamageStatistics") or {}
        for key, cat_id in (("damageDealt", DMG_DEALT), ("damageTaken", DMG_TAKEN), ("healingDone", HEAL_DEALT)):
            T[key] += sum_amounts(ds.get(cat_id))
        for area, t in (s.get("TimeStatisticsByArea") or {}).items():
            zone_time[zone_part(area)] += num(t.get(T_LOGGEDIN))
            T["combat"] += num(t.get(T_COMBAT))
            T["afk"] += num(t.get(T_AFK))
            T["taxi"] += num(t.get(T_TAXI))
            T["dead"] += num(t.get(T_DEAD))
            T["casting"] += num(t.get(T_CAST))

    bosses = cat.get("BossCatalog", {})
    zones_cat = cat.get("ZoneCatalog", {})
    totals = {
        "kills": int(T["kills"]),
        "questsCompleted": int(T["questsCompleted"]),
        "deaths": int(T["deaths"]),
        "bossKills": sum(1 for b in bosses.values() if b.get("Killed")),
        "dungeons": None,
        "zonesDiscovered": sum(1 for z in zones_cat.values() if z.get("HasEntered")),
        "goldLooted": round(T["goldLooted"] / 10000, 2),
        "goldFromQuests": round(T["goldFromQuests"] / 10000, 2),
        "goldFromVendors": round(T["goldFromVendors"] / 10000, 2),
        "damageDealt": int(T["damageDealt"]),
        "damageTaken": int(T["damageTaken"]),
        "healingDone": int(T["healingDone"]),
        "combatHours": hrs(T["combat"]),
        "afkHours": hrs(T["afk"]),
        "taxiHours": hrs(T["taxi"]),
        "deadHours": hrs(T["dead"]),
        "castingHours": hrs(T["casting"]),
    }

    # --- map id -> zone name, from zone first-visit events
    # Only trust a map id that was seen with exactly one zone name.
    names_by_map = collections.defaultdict(set)
    for e in events:
        c = e.get("Coordinates") or {}
        if e.get("Type") == EV_MAP and e.get("SubType") == ST_ZONE and c.get("MapId") and not c.get("InstanceId"):
            names_by_map[c["MapId"]].add(e.get("ZoneName"))
    map_zone = {m: next(iter(n)) for m, n in names_by_map.items() if len(n) == 1}

    def killer_name(cuid):
        u = units.get(cuid) or units.get(str(cuid)) or {}
        if u.get("UType", 0) != 0:
            return "another player" if u.get("UType") == 2 else "unknown"
        return u.get("Name") or "unknown"

    # --- deaths + highlights
    deaths, hl = [], []
    items = cat.get("ItemCatalog", {})
    for e in events:
        ty, st, ts = e.get("Type"), e.get("SubType"), num(e.get("Timestamp"))
        if not ts:
            continue
        lv = level_at(ts)
        h = None
        if ty == EV_LEVEL and st == ST_LEVELUP and e.get("LevelNum", 0) > 1:
            h = ("levelup", f"Reached level {e['LevelNum']}")
            lv = e["LevelNum"]
        elif ty == EV_KILL and st == ST_BOSS:
            h = ("boss", f"Defeated {e.get('BossName') or 'a boss'}")
        elif ty == EV_KILL and st == ST_FIRSTKILL:
            u = units.get(e.get("CatalogUnitId")) or units.get(str(e.get("CatalogUnitId"))) or {}
            if u.get("UType", 0) == 0 and u.get("Clsfctn") in ("rare", "rareelite", "worldboss"):
                h = ("firstkill", f"Killed the rare {u.get('Name')}")
        elif ty == EV_DEATH and st == ST_DEATH:
            k = killer_name(e.get("KillerCuid"))
            z = map_zone.get((e.get("Coordinates") or {}).get("MapId"))
            deaths.append({"date": day(ts), "level": lv, "killer": k, "zone": z})
            h = ("death", ("Died (cause unknown)" if k == "unknown" else f"Died to {k}") + (f" in {z}" if z else ""))
        elif ty == EV_MAP and st == ST_ZONE:
            h = ("zone", f"Entered {e.get('ZoneName')} for the first time")
        elif ty == EV_SKILL and st == ST_SKILL:
            h = ("skill", f"{e.get('SkillName')} reached {e.get('SkillLevel')}")
        elif ty == EV_REP and st == ST_REP:
            h = ("other", f"Reached {e.get('ReputationLevel')} with {e.get('Faction')}")
        elif ty == EV_STAT and st == ST_STAT and e.get("Text"):
            t = e["Text"]
            h = ("other", t[:1].upper() + t[1:])
        elif ty == EV_ITEM and st == ST_EQUIP:
            it = items.get(e.get("CatalogItemId")) or items.get(str(e.get("CatalogItemId"))) or {}
            if num(it.get("Rarity")) >= 3:
                h = ("item", f"Equipped {it.get('Name')}")
        elif ty == EV_BG and st in (ST_BGWON, ST_BGLOST):
            h = ("other", "Won a battleground" if st == ST_BGWON else "Lost a battleground")
        if h:
            hl.append({"date": day(ts), "level": lv, "type": h[0], "text": h[1], "_ts": ts})
    hl.sort(key=lambda x: x["_ts"], reverse=True)
    for x in hl:
        del x["_ts"]
    deaths.reverse()

    last_seen = day(os.path.getmtime(ab_path))
    race = syn_char.get("race")
    race = {"Scourge": "Undead"}.get(race, race)
    character = {
        "name": SYNDICATOR_NAME,
        "realm": syn_char.get("realm"),
        "flavour": "Forever",
        "faction": syn_char.get("faction"),
        "race": race,
        "class": (syn_char.get("className") or "").title() or None,
        "level": level,
        "maxLevel": MAX_LEVEL,
        "xp": xp,
        "xpMax": xp_max,
        "gold": gold,
        "played": fmt_played(played_sec),
        "playedHours": hrs(played_sec),
        "zone": info.get("CurrentZone"),
        "lastSeen": last_seen,
    }
    return {
        "character": character,
        "levels": level_rows,
        "totals": totals,
        "highlights": hl[:80],
        "topKills": [{"name": n, "count": c} for n, c in kills_by_unit.most_common(10)],
        "zones": [{"name": n, "hours": hrs(s)} for n, s in zone_time.most_common(10)],
        "deaths": deaths,
    }


def git(*args, check=True):
    r = subprocess.run(["git", "-C", REPO, *args], capture_output=True, text=True)
    if check and r.returncode != 0:
        die(f"git {' '.join(args)} failed:\n{r.stdout}{r.stderr}")
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-git", action="store_true")
    a = ap.parse_args()

    data = build()
    now = dt.datetime.now(dt.timezone.utc)
    today = dt.datetime.now().strftime("%Y-%m-%d")

    old = {}
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            old = json.load(f)
    c = data["character"]
    history = [h for h in old.get("history", []) if h.get("date") != today]
    history.append({"date": today, "level": c["level"], "playedHours": c["playedHours"], "gold": c["gold"]})
    history.sort(key=lambda h: h["date"])

    out = {"synced": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "updated": today, **data, "history": history}

    def core(d):
        d = {k: v for k, v in d.items() if k not in ("synced", "updated", "history")}
        return json.dumps(d, sort_keys=True)

    changed = core(out) != core(old) or [h for h in old.get("history", []) if h.get("date") == today] != [history[-1]]

    if a.dry_run:
        print(json.dumps(out, indent=2, ensure_ascii=False))
        print(f"\nchanged vs repo: {changed}", file=sys.stderr)
        return
    if not changed:
        print("No change in numbers; nothing written.")
        return
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Wrote {OUT_REL}")
    if a.no_git:
        return
    git("add", "--", OUT_REL)
    if git("diff", "--cached", "--quiet", "--", OUT_REL, check=False).returncode == 0:
        print("Nothing staged.")
        return
    git("commit", "-m", f"data: WoW sync ({out['synced']})", "--", OUT_REL)
    git("pull", "--rebase", "--autostash")
    git("push")
    print("Pushed:", git("log", "-1", "--oneline").stdout.strip())


if __name__ == "__main__":
    main()
