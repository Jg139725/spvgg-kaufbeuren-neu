
document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("office-live-status");
  if (!status) return;

  const now = new Date();
  const day = now.getDay(); // 0 Sonntag, 1 Montag ...
  const minutes = now.getHours() * 60 + now.getMinutes();

  let isOpen = false;
  let nextText = "";

  if (day >= 1 && day <= 4) {
    isOpen = minutes >= 16 * 60 && minutes < 20 * 60;
    nextText = isOpen ? "Jetzt geöffnet – bis 20:00 Uhr" : "Derzeit geschlossen";
  } else if (day === 5) {
    isOpen = minutes >= 16 * 60 && minutes < 18 * 60;
    nextText = isOpen ? "Jetzt geöffnet – bis 18:00 Uhr" : "Derzeit geschlossen";
  } else {
    nextText = "Derzeit geschlossen – Wochenende";
  }

  status.classList.add(isOpen ? "is-open" : "is-closed");
  const label = status.querySelector("strong");
  if (label) label.textContent = nextText;
});
