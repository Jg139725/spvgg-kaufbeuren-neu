
document.addEventListener("DOMContentLoaded", () => {
  const motion = document.querySelector(".h2p-media.has-video");
  const video = motion?.querySelector("video");
  if (!motion || !video) return;

  async function playMotion(){
    motion.classList.add("is-playing");
    video.currentTime = 0;
    try { await video.play(); } catch {}
  }

  function stopMotion(){
    video.pause();
    video.currentTime = 0;
    motion.classList.remove("is-playing");
  }

  motion.addEventListener("mouseenter", playMotion);
  motion.addEventListener("mouseleave", stopMotion);
  motion.addEventListener("focusin", playMotion);
  motion.addEventListener("focusout", stopMotion);
  motion.addEventListener("click", () => {
    if (motion.classList.contains("is-playing")) stopMotion();
    else playMotion();
  });
});
