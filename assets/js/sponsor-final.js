
document.addEventListener("DOMContentLoaded", () => {
  const tracks = document.querySelectorAll(".home-sponsor-track, .sponsor-final-track");

  tracks.forEach(track => {
    track.addEventListener("pointerenter", () => track.style.animationPlayState = "paused");
    track.addEventListener("pointerleave", () => track.style.animationPlayState = "running");
    track.addEventListener("focusin", () => track.style.animationPlayState = "paused");
    track.addEventListener("focusout", () => track.style.animationPlayState = "running");
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    tracks.forEach(track => {
      track.style.animation = "none";
      track.style.flexWrap = "wrap";
      track.style.width = "auto";
      track.style.justifyContent = "center";
    });
  }
});
