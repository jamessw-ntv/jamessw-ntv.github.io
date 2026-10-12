# Auslan Trainer

A personal web app for practising Australian Sign Language (Auslan) with webcam
feedback. Everything runs in the browser using Google MediaPipe; no video
leaves the device.

## Status

- [x] Chunk 1: webcam + MediaPipe Hand Landmarker drawing 21 landmarks per hand live
- [x] Chunk 2a: fingerspelling the five vowels (A E I O U)
- [ ] Chunk 2b: the rest of the two-handed Auslan alphabet
- [ ] Chunk 3: offline landmark extraction from MM-WLAuslan reference videos
- [ ] Chunk 4: record + compare signs with Dynamic Time Warping (DTW), per-parameter scoring
- [ ] Chunk 5: facial expression scoring
- [ ] Chunk 6: spaced repetition
- [ ] Chunk 7 (optional): landmark classifier

## Run locally

Browsers only allow camera access on `https://` pages or `http://localhost`.

```sh
python3 -m http.server 8000   # from the repo root
# then open http://localhost:8000/auslan/
```

## Test chunk 1

1. Click **Start camera** and allow camera access.
2. Hold up one hand: 21 dots and connecting lines should follow it. The wrist dot is white; fingertips are larger.
3. Raise your **right** hand only: it should be labelled "Right hand" (green). Your left hand is blue.
4. Hold up both hands: **Hands** should read 2.
5. Touch or overlap your hands: expect tracking to flicker or drop. That is the known two-handed limitation chunk 2 will need to handle.
6. Untick **Mirror view**: the image flips like a photo instead of a mirror, and the dots should still sit on your hands.

## Test chunk 2a (vowels)

Auslan vowels: your dominant index finger touches a fingertip of your other hand.
A = thumb, E = index, I = middle, O = ring, U = little finger.

1. Start the camera and hold up both hands, the non-dominant one open with palm towards you.
2. Touch the highlighted fingertip. A yellow ring marks the target and a dashed line shows where to move.
3. Hold it for half a second: the panel turns green, **Letters signed** goes up, and a new vowel appears.
4. Touch the wrong fingertip: the hint names the finger you're on and the one you need.
5. Watch **Both hands seen**. If it drops when your fingers touch, the tracker is losing a hand.

Left-handed? Change **Dominant hand** to Left; it's remembered on this device.

## Credits

Hand tracking: [Google MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) (Apache 2.0).
Fingerspelling photos: [Auslan Signbank](https://www.auslan.org.au/spell/twohanded.html) (CC BY-NC-ND 4.0), unmodified; see `signbank/README.md`.
`selftest.jpg` is MediaPipe's `victory.jpg` test image, used at start-up to check the graphics card (GPU) path really finds hands; if not, the app falls back to the CPU. Add `?cpu` to the address to skip the GPU entirely.
