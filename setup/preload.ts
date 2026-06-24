import cameraVideo from "assets/360.webm";
import cameraReverseVideo from "assets/360-reverse.webm";

for (const href of [cameraVideo, cameraReverseVideo]) {
  if (document.head.querySelector(`link[rel="preload"][href="${href}"]`)) {
    continue;
  }

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "video";
  link.href = href;
  link.type = "video/webm";
  document.head.appendChild(link);
}
