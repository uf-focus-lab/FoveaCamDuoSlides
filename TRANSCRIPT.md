# FoveaCam Duo — Talk Transcript (~12 min)

**Speakers:** **Yuxuan Zhang** — Slides 1–15 · **Jacob Carter** takes over at Slide 16 (Data Collection) through the end.
**Pace:** ~135 words/min (comfortable conference speed). Total ≈ **11:55**, leaving ~5 s slack.
`[mm:ss]` marks where each slide *begins*; `(~Ns)` is that slide's budget.
Slides after "Recap" (Calibration Intrinsic, Drift) are **backup / Q&A** and are not budgeted.

---

### [0:00] Slide 1 — Title *(~30s)*
Hello I'm Yuxuan. I'm excited to present **FoveaCam Duo** -- a stereo camera for long range depth sensing.

### [0:30] Slide 2 — How Nature Engineers Vision *(~45s)*
FoveaCam Duo is a biologically inspired system, as are many of the works we see recently. Across the animal kingdom, eyes are tuned for very different environments and jobs. When designing a system, it can be useful to look at biological systems attuned to the same task.Among the variete of naturally evolved eyes, Two properties keep recurring — and they're the two we build on today.

### [1:15] Slide 3 — Stereo and Foveation *(~40s)*
The first is **stereo vision**. Multiple eyes, viewing the same scene from slightly different viewpoints, let an animal *triangulate* where things are. The second is **foveation**: the eye concentrates photoreceptors into a small, high-resolution region — a fovea — pointing at whatever matters. Stereo gives you depth; foveation gives you detail exactly where you need it. FoveaCam Duo is what you get when you put *both* into one camera system.

### [1:55] Slide 4 — Related Work *(~30s)*
We're not the first to borrow these ideas. Prior work spans policy-driven foveation — deciding *where* to look — dynamic optical foveation like multi-resolution cameras, and active, vergence-based stereo going back to motorized gaze cameras. What's been missing is a *compact* system that does foveated stereo in real time, and does it well enough at long range to matter.

### [2:25] Slide 5 — Engineering Foveation *(~35s)*
Engineering foveation splits into two problems. One is **hardware** — actually building a stereo camera that can foveate fast enough to be useful. The other is **intelligence** — deciding how to spend your limited foveal pixels on the most valuable targets, in real time. Both are hard. Our contribution addresses the first.

### [3:00] Slide 6 — Foveal Tracking Preview *(~45s)*
As a trailer of what FoveaCam Duo can achieve. We start with a wide-angle view of a parking lot. For a small region of interest, if we just digitally crop and zoom, we run out of pixels almost immediately. Instead, a mechanically steered fovea points a high-resolution camera at that region — reaching roughly a **9× optical gain** — and because we have *two* of them, we get a stereo pair that contains disparity information which translates into depth.

### [3:45] Slide 7 — Crypsis *(~35s)*
Before diving into hardware design, we show an analysis on the relation between seeing and being seen. The distance within which a target can be observed is constrained by the size of the target and the angular resolution of an observer. The collection of locations where the observer can see its target without being seen comprises the feasibility region. The feasibility region can be proved to be monotonically increasing with the observer's detection capability.

### [4:20] Slide 8 — Stereo Geometry *(~50s)*
Stereo vision produces depth from geometry triangulation involving focal length, baseline distance and disparity. It's' differentiated form shows the sensitivity per disparity is inverse quarditical to disparity.

Since realworld cameras have descrete pixels, we can further derive the descrete form of this equation, quantizing depth uncertainty as a function of disparity. We can take one more step to cancel out disparity, making depth uncertainty a inverse quadratic function of depth itself.

As shown in the animated figure on the right, the depth error worzens quadratically along the Z axis. One natural mitigation is to simply add more pixel to your sensor. However, this solution takes the cost of daramatic increase of data bandwidth and workload of downstream inference tasks.

### [5:10] Slide 9 — Our Solution *(~45s)*
Our solution to this problem is, instead of adding pixels, we increase the focal length of the lenses. We then introduce foveation to steer the telephoto pair to regions of interest, achieving both resolution and coverage. We then add a wide angle periphal camera to ensure contextural awareness.

### [5:55] Slide 10 — The Device *(~30s)*
Based on this concept, we built the FoveaCam Duo. The left, center and wide cameras are annotated in the view. A MEMS mirror is mounted on the back of each fovea with the controller sitting next to it. We packed costum electronics on the back of the system for precise frame synchornization with the mirrors.

### [6:25] Slide 11 — Technical Details *(~40s)*
This is the cross section view into a fovea side, we annotate the virtual ray of a fovea view in red and it's entire actuation range in green. More technical details are listed on the right side.

### [7:05] Slide 12 — Calibration Setup *(~25s)*
The first problem for calibration is mapping between pointing angles to analog voltages. One natural intuition will be using a marker to correlate between center and foveas. However, since this is not a colocated camera system, there is an extra depth depency that needs to be carefully managed. We instead use 3 markers aligned to camera baselines to cancel out depth depency, and we rotate the camera to sample the markers in a grid pattern. 

### [7:30] Slide 13 — Calibration Process *(~25s)*
Here is a video on how the camera is calibrated in our lab.

### [7:55] Slide 14 — Calibration Results *(~25s)*
The calibration can achieve very high reprojection accuracy and good rectification matching between left and right fovea views.

Here is Jacob to tell you more.

---

> **▶ Handoff — Jacob Carter presents from here (Slides 16–22).**

---
