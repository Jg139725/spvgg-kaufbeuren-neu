document.addEventListener("DOMContentLoaded", async () => {
  const motion = document.querySelector(".h2p-media.has-video");
  const video = motion?.querySelector("video");
  if (!motion || !video) return;

  const showPhoto = () => {
    motion.classList.remove("is-playing");
    video.pause();
  };

  video.addEventListener("ended", showPhoto, { once: true });
  video.addEventListener("error", showPhoto, { once: true });

  // Beim Öffnen des Spielerprofils läuft die Animation genau einmal automatisch.
  video.currentTime = 0;
  motion.classList.add("is-playing");
  try {
    await video.play();
  } catch (error) {
    // Falls ein Browser Autoplay blockiert, bleibt direkt das normale Spielerfoto sichtbar.
    showPhoto();
  }
});
