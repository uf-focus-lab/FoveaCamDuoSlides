# Tracking Footage

Three synchronized videos of Jacob (`JacobAtHyatt_center.mp4`, `JacobAtHyatt_left-fovea.mp4`, `JacobAtHyatt_right-fovea.mp4`).

## Chapters

| Time            | Description                                  |
|-----------------|-----------------------------------------------|
| 0:03 – 0:31      | Walking left/right at a reasonable pace       |
| 0:31 – 0:37.5    | Bouncing around                               |
| ~0:47 – 1:00     | Jumping left/right, more aggressively         |

Time outside these ranges (0:00–0:03, 0:37.5–~0:47) is not relevant.

Left and right fovea are somewhat redundant. They are perspectives from side-cameras tracking Jacob, at higher resolution. JacobAtHyattCenter.mp4 is the wide angle shot.

## Per-chapter clips (web-ready)

`{center,left-fovea,right-fovea}_{walking,bouncing,jumping}.webm` are the chapters above cut from the mp4 originals (same 1440×1080, normalized to 30 fps CFR, no audio), encoded as VP9 (`libvpx-vp9 -crf 33 -b:v 0 -cpu-used 2 -row-mt 1`) for in-browser playback. Cuts at the same wall-clock timestamps per camera, so the three cameras stay synchronized within a chapter (walking 3–31 s = 28.03 s, bouncing 31–37.5 s = 6.53 s, jumping 47 s–end = 13.67 s).
