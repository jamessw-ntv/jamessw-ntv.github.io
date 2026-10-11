// Chunk 1: webcam + MediaPipe Hand Landmarker, drawing 21 landmarks per hand live.
import {
  FilesetResolver,
  HandLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// Colour per hand, keyed by the signer's own hand, taken from the hub.css swatches.
const css = getComputedStyle(document.documentElement);
const HAND_COLOURS = {
  Right: css.getPropertyValue("--green").trim(),
  Left: css.getPropertyValue("--blue").trim(),
};

const els = {
  start: document.getElementById("startBtn"),
  mirror: document.getElementById("mirrorToggle"),
  status: document.getElementById("status"),
  stage: document.getElementById("stage"),
  video: document.getElementById("video"),
  canvas: document.getElementById("overlay"),
  handCount: document.getElementById("handCount"),
  handDetail: document.getElementById("handDetail"),
  fps: document.getElementById("fps"),
  delegate: document.getElementById("delegate"),
};
const ctx = els.canvas.getContext("2d");

let landmarker = null;
let lastVideoTime = -1;
let fpsFrames = 0;
let fpsSince = performance.now();

// Exposed for debugging in the browser console and for automated tests.
window.auslan = { lastResult: null };

function setStatus(text) {
  els.status.textContent = text;
}

async function createLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
  const options = (delegate) => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: "VIDEO",
    numHands: 2, // Auslan fingerspelling is two-handed.
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  try {
    const lm = await HandLandmarker.createFromOptions(vision, options("GPU"));
    els.delegate.textContent = "GPU";
    return lm;
  } catch (err) {
    console.warn("GPU delegate failed, falling back to CPU", err);
    const lm = await HandLandmarker.createFromOptions(vision, options("CPU"));
    els.delegate.textContent = "CPU";
    return lm;
  }
}

async function startCamera() {
  // Browsers only expose the camera on https:// pages or http://localhost.
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera is unavailable. Open this page over https:// or from http://localhost.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
    audio: false,
  });
  els.video.srcObject = stream;
  await els.video.play();
  els.canvas.width = els.video.videoWidth;
  els.canvas.height = els.video.videoHeight;
  els.stage.style.aspectRatio = `${els.video.videoWidth} / ${els.video.videoHeight}`;
}

// Which of the signer's hands this is. We feed MediaPipe the raw, un-mirrored camera
// frame (mirroring is display-only), and on un-mirrored test photos of known right
// hands it reports "Right", so its label is used as-is.
function handLabel(category) {
  return category.categoryName;
}

function draw(result) {
  const { width: w, height: h } = els.canvas;
  const mirrored = els.mirror.checked;
  const px = (lm) => [(mirrored ? 1 - lm.x : lm.x) * w, lm.y * h];

  ctx.clearRect(0, 0, w, h);
  const radius = Math.max(3, w / 200);

  result.landmarks.forEach((hand, i) => {
    const label = handLabel(result.handedness[i][0]);
    const colour = HAND_COLOURS[label];

    // Bones: the lines joining knuckles, like a stick-figure skeleton of the hand.
    ctx.strokeStyle = colour;
    ctx.lineWidth = radius * 0.8;
    ctx.lineCap = "round";
    for (const { start, end } of HandLandmarker.HAND_CONNECTIONS) {
      const [x1, y1] = px(hand[start]);
      const [x2, y2] = px(hand[end]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Joints: the 21 landmark points. Fingertips (4, 8, 12, 16, 20) drawn larger.
    hand.forEach((lm, idx) => {
      const [x, y] = px(lm);
      const tip = idx % 4 === 0 && idx !== 0;
      ctx.beginPath();
      ctx.arc(x, y, tip ? radius * 1.6 : radius, 0, Math.PI * 2);
      ctx.fillStyle = idx === 0 ? css.getPropertyValue("--text").trim() : colour;
      ctx.fill();
    });

    // Label beside the wrist (landmark 0).
    const [wx, wy] = px(hand[0]);
    ctx.font = `${Math.round(radius * 5)}px system-ui, sans-serif`;
    ctx.fillStyle = colour;
    ctx.textAlign = "center";
    ctx.fillText(`${label} hand`, wx, wy + radius * 8);
  });
}

function updateReadout(result) {
  const n = result.landmarks.length;
  els.handCount.textContent = String(n);
  els.handDetail.textContent = n
    ? result.handedness
        .map((h) => `${handLabel(h[0])} (${Math.round(h[0].score * 100)}%)`)
        .join(", ")
    : "None";
}

function loop() {
  const video = els.video;
  if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
    lastVideoTime = video.currentTime;
    const result = landmarker.detectForVideo(video, performance.now());
    window.auslan.lastResult = result;
    draw(result);
    updateReadout(result);

    fpsFrames++;
    const now = performance.now();
    if (now - fpsSince >= 1000) {
      els.fps.textContent = String(Math.round((fpsFrames * 1000) / (now - fpsSince)));
      fpsFrames = 0;
      fpsSince = now;
    }
  }
  requestAnimationFrame(loop);
}

function applyMirror() {
  els.stage.classList.toggle("mirrored", els.mirror.checked);
}

els.mirror.addEventListener("change", applyMirror);
applyMirror();

els.start.addEventListener("click", async () => {
  els.start.disabled = true;
  try {
    setStatus("Loading hand model…");
    landmarker ??= await createLandmarker();
    setStatus("Waiting for camera permission…");
    await startCamera();
    setStatus("Tracking. Hold your hands up to the camera.");
    requestAnimationFrame(loop);
  } catch (err) {
    console.error(err);
    const msg =
      err.name === "NotAllowedError"
        ? "Camera permission was blocked. Allow it in the address bar and try again."
        : `Could not start: ${err.message}`;
    setStatus(msg);
    els.start.disabled = false;
  }
});
