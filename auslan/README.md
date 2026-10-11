# Auslan Trainer

A personal web app for practising Australian Sign Language (Auslan) with webcam
feedback. Everything runs in the browser using Google MediaPipe; no video
leaves the device.

## Status

- [x] Chunk 1: webcam + MediaPipe Hand Landmarker drawing 21 landmarks per hand live
- [ ] Chunk 2: fingerspelling (two-handed Auslan alphabet)
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

## Credits

Hand tracking: [Google MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) (Apache 2.0).
`selftest.jpg` is MediaPipe's `victory.jpg` test image, used at start-up to check the graphics card (GPU) path really finds hands; if not, the app falls back to the CPU. Add `?cpu` to the address to skip the GPU entirely.
