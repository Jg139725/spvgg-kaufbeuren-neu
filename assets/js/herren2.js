
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".h2-menu");
  const nav = document.querySelector(".h2-nav");
  menu?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(Boolean(open)));
  });

  const video = document.getElementById("player-profile-video");
  const replay = document.getElementById("replay-player-video");

  replay?.addEventListener("click", async () => {
    if (!video) return;
    video.currentTime = 0;
    try {
      await video.play();
    } catch {
      video.controls = true;
    }
  });

  // On devices that block autoplay, expose browser controls.
  if (video) {
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        video.controls = true;
      });
    }
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const motion = document.querySelector(".profile-hover-motion");
  const motionVideo = motion?.querySelector(".profile-hover-video");
  if (!motion || !motionVideo) return;

  async function startMotion(){
    motion.classList.add("is-playing");
    motionVideo.currentTime = 0;
    try { await motionVideo.play(); } catch {}
  }

  function stopMotion(){
    motionVideo.pause();
    motionVideo.currentTime = 0;
    motion.classList.remove("is-playing");
  }

  motion.addEventListener("mouseenter", startMotion);
  motion.addEventListener("mouseleave", stopMotion);
  motion.addEventListener("focusin", startMotion);
  motion.addEventListener("focusout", stopMotion);

  motion.addEventListener("click", () => {
    if (motion.classList.contains("is-playing")) stopMotion();
    else startMotion();
  });
});
