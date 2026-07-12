
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
