// Chunk 2: fingerspelling the five Auslan vowels.
// In the two-handed Auslan alphabet, vowels are made by touching a fingertip of the
// non-dominant hand with the dominant index finger: A = thumb, E = index, I = middle,
// O = ring, U = little finger. Think of the non-dominant hand as a keyboard with five
// keys, and the dominant index finger as the finger pressing them.

// MediaPipe landmark numbers for each fingertip, thumb first.
const TIPS = [4, 8, 12, 16, 20];
const FINGER_NAMES = ["thumb", "index finger", "middle finger", "ring finger", "little finger"];
export const VOWELS = ["A", "E", "I", "O", "U"]; // index = finger

const POINTER_TIP = 8; // dominant index fingertip
// Fingertips count as touching when closer than this fraction of the palm length
// (wrist to middle knuckle). Adjacent fingertips sit roughly 0.25 to 0.4 apart.
const TOUCH = 0.35;
const HOLD_MS = 500; // how long a match must be held to count

// Which detected hand is the signer's dominant one. MediaPipe sometimes labels both
// hands the same; then the more confident label wins and the other hand gets the rest.
export function splitHands(result, dominant) {
  const hands = result.landmarks.map((lm, i) => ({
    lm,
    label: result.handedness[i][0].categoryName,
    score: result.handedness[i][0].score,
  }));
  if (hands.length < 2) return null;
  const [a, b] = hands.sort((x, y) => y.score - x.score);
  if (a.label === b.label) b.label = a.label === "Left" ? "Right" : "Left";
  return a.label === dominant ? { dom: a.lm, non: b.lm } : { dom: b.lm, non: a.lm };
}

// Pure geometry: which non-dominant fingertip is the dominant index finger nearest to?
// width/height turn normalised coordinates back into square pixels.
export function assessVowel(dom, non, target, width, height) {
  const px = (p) => [p.x * width, p.y * height];
  const dist = (p, q) => {
    const [x1, y1] = px(p);
    const [x2, y2] = px(q);
    return Math.hypot(x1 - x2, y1 - y2);
  };
  const palm = dist(non[0], non[9]) || 1;
  const distances = TIPS.map((tip) => dist(dom[POINTER_TIP], non[tip]) / palm);
  const nearest = distances.indexOf(Math.min(...distances));
  const touching = distances[nearest] < TOUCH;
  return {
    nearest,
    distance: distances[target],
    touching,
    correct: touching && nearest === target,
  };
}

export function feedback(assessment, target, dominant) {
  if (!assessment) {
    return "I can only see one hand. Touching hands can hide one from the tracker: try tilting your pointing hand so both stay visible.";
  }
  const { nearest, touching, correct } = assessment;
  const domSide = dominant.toLowerCase();
  const nonSide = dominant === "Right" ? "left" : "right";
  if (correct) return `${VOWELS[target]}: that's it. Hold it…`;
  if (touching) {
    return `That's your ${FINGER_NAMES[nearest]} (${VOWELS[nearest]}). Move to your ${FINGER_NAMES[target]} for ${VOWELS[target]}.`;
  }
  return `Touch your ${nonSide} ${FINGER_NAMES[target]} tip with your ${domSide} index finger.`;
}

// ---------- UI (only runs in the browser) ----------------------------------------

if (typeof document !== "undefined") {
  const els = {
    panel: document.getElementById("practice"),
    letter: document.getElementById("targetLetter"),
    diagram: document.getElementById("diagram"),
    hint: document.getElementById("hint"),
    feedback: document.getElementById("feedback"),
    picks: document.getElementById("vowelPicks"),
    score: document.getElementById("practiceScore"),
    both: document.getElementById("bothSeen"),
    dominant: document.getElementById("dominantHand"),
    mirror: document.getElementById("mirrorToggle"),
    canvas: document.getElementById("coach"),
  };
  const ctx = els.canvas.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const colour = (name) => css.getPropertyValue(name).trim();

  let dominant = "Right";
  try {
    dominant = localStorage.getItem("auslan.dominant") || "Right";
  } catch {}
  els.dominant.value = dominant;

  let target = 0;
  let matchSince = 0;
  let done = 0;
  let celebrating = false;
  const recent = []; // true/false per frame: were both hands visible?

  function setTarget(i) {
    target = i;
    matchSince = 0;
    celebrating = false;
    els.letter.textContent = VOWELS[i];
    const nonSide = dominant === "Right" ? "left" : "right";
    els.hint.textContent = `${dominant} index finger touches your ${nonSide} ${FINGER_NAMES[i]} tip.`;
    els.diagram.innerHTML = diagramSvg(i, dominant === "Right");
    [...els.picks.children].forEach((b, j) => b.classList.toggle("active", j === i));
  }

  VOWELS.forEach((v, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "toggle";
    b.textContent = v;
    b.addEventListener("click", () => setTarget(i));
    els.picks.appendChild(b);
  });

  els.dominant.addEventListener("change", () => {
    dominant = els.dominant.value;
    try {
      localStorage.setItem("auslan.dominant", dominant);
    } catch {}
    setTarget(target);
  });

  document.addEventListener("auslan:hands", (e) => {
    const { result, width, height } = e.detail;
    if (els.canvas.width !== width) els.canvas.width = width;
    if (els.canvas.height !== height) els.canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const pair = splitHands(result, dominant);
    recent.push(Boolean(pair));
    if (recent.length > 60) recent.shift();
    els.both.textContent = `${Math.round((100 * recent.filter(Boolean).length) / recent.length)}%`;

    if (celebrating) return;
    if (result.landmarks.length === 0) {
      els.feedback.textContent = "Show both hands to the camera.";
      matchSince = 0;
      return;
    }
    const a = pair && assessVowel(pair.dom, pair.non, target, width, height);
    els.feedback.textContent = feedback(a, target, dominant);
    els.panel.classList.toggle("matching", Boolean(a?.correct));
    if (pair) drawCoach(pair, a, width, height);

    if (a?.correct) {
      matchSince ||= performance.now();
      if (performance.now() - matchSince >= HOLD_MS) celebrate();
    } else {
      matchSince = 0;
    }
  });

  function celebrate() {
    celebrating = true;
    done++;
    els.score.textContent = String(done);
    els.feedback.textContent = `✓ ${VOWELS[target]}! Next letter coming up.`;
    setTimeout(() => {
      els.panel.classList.remove("matching");
      // Next letter at random, never the same one twice in a row.
      let next;
      do next = Math.floor(Math.random() * VOWELS.length);
      while (next === target);
      setTarget(next);
    }, 1200);
  }

  // Ring the target fingertip and draw a guide line from the pointing finger.
  function drawCoach({ dom, non }, a, w, h) {
    const mirrored = els.mirror.checked;
    const px = (p) => [(mirrored ? 1 - p.x : p.x) * w, p.y * h];
    const [tx, ty] = px(non[TIPS[target]]);
    const [fx, fy] = px(dom[POINTER_TIP]);
    const r = Math.max(10, w / 40);
    const c = a.correct ? colour("--green") : colour("--yellow");
    ctx.lineWidth = Math.max(3, w / 250);
    ctx.strokeStyle = c;
    if (!a.correct) {
      ctx.setLineDash([r / 2, r / 2]);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.arc(tx, ty, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // A simple picture of the non-dominant hand, palm towards you, as you see it.
  // Each finger is labelled with its vowel; the target is highlighted.
  function diagramSvg(i, nonDominantIsLeft) {
    // Fingers from left to right for a left hand seen palm-on: little, ring, middle, index.
    const fingers = [
      { f: 4, x: 22, top: 44 },
      { f: 3, x: 42, top: 24 },
      { f: 2, x: 62, top: 16 },
      { f: 1, x: 82, top: 26 },
    ];
    const tip = (f, x, y) =>
      `<circle cx="${x}" cy="${y}" r="7" class="${f === i ? "tip target" : "tip"}"/>` +
      `<text x="${x}" y="${y + 3.5}" class="${f === i ? "lbl target" : "lbl"}"${flip(x)}>${VOWELS[f]}</text>`;
    // Text must not be mirrored when the whole hand is flipped for a right non-dominant hand.
    const flip = (x) => (nonDominantIsLeft ? "" : ` transform="translate(${2 * x} 0) scale(-1 1)"`);
    const parts = fingers.map(
      ({ f, x, top }) =>
        `<rect x="${x - 7}" y="${top}" width="14" height="${78 - top}" rx="7" class="finger"/>` + tip(f, x, top + 7),
    );
    const thumb =
      `<rect x="96" y="70" width="14" height="40" rx="7" class="finger" transform="rotate(35 103 110)"/>` +
      tip(0, 116, 76);
    const g = nonDominantIsLeft ? "" : ` transform="translate(130 0) scale(-1 1)"`;
    return `<svg viewBox="0 0 130 150" role="img" aria-label="Non-dominant hand, ${FINGER_NAMES[i]} highlighted">
      <g${g}><rect x="12" y="66" width="82" height="70" rx="18" class="finger"/>${parts.join("")}${thumb}</g></svg>`;
  }

  setTarget(0);
}
