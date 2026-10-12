# CLAUDE.md: Auslan Trainer

Personal Auslan (Australian Sign Language) trainer using webcam feedback.
Auslan only, never American Sign Language (ASL). The owner is a beginner:
spell out acronyms and prefer analogies.

## Rules

- **Exception to "no dependencies":** MediaPipe Tasks Vision is loaded from
  cdn.jsdelivr.net and its model from storage.googleapis.com. Keep both pinned
  to exact versions (currently `@mediapipe/tasks-vision@1.0.1`).
- **Privacy:** video never leaves the device. No uploads, no analytics.
- Camera only works over `https://` or `http://localhost`, never `file://`.
- Handedness: frames go to MediaPipe un-mirrored (mirroring is display-only)
  and its label is used as-is.
- Build in small, testable chunks; the roadmap is in `README.md`.
- Fingerspelling photos in `signbank/` are Auslan Signbank, CC BY-NC-ND 4.0:
  keep them unmodified (no crop, flip or recolour) and keep the attribution.
