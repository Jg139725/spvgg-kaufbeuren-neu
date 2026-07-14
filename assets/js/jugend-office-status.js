
(() => {
  const OFFICE_TIME_ZONE = "Europe/Berlin";

  const OFFICE_HOURS = {
    1: { start: 16 * 60, end: 20 * 60 },
    2: { start: 16 * 60, end: 20 * 60 },
    3: { start: 16 * 60, end: 20 * 60 },
    4: { start: 16 * 60, end: 20 * 60 },
    5: { start: 16 * 60, end: 18 * 60 }
  };

  const DAY_NAMES = [
    "Sonntag", "Montag", "Dienstag", "Mittwoch",
    "Donnerstag", "Freitag", "Samstag"
  ];

  const EN_DAY_TO_NUMBER = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  function getBerlinTime() {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: OFFICE_TIME_ZONE,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });

    const values = {};
    formatter.formatToParts(new Date()).forEach(part => {
      if (part.type !== "literal") values[part.type] = part.value;
    });

    return {
      day: EN_DAY_TO_NUMBER[values.weekday],
      minutes: Number(values.hour) * 60 + Number(values.minute)
    };
  }

  function formatTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function findNextOpening(day, nowMinutes) {
    const today = OFFICE_HOURS[day];

    if (today && nowMinutes < today.start) {
      return `Öffnet heute um ${formatTime(today.start)} Uhr`;
    }

    for (let offset = 1; offset <= 7; offset++) {
      const candidateDay = (day + offset) % 7;
      const schedule = OFFICE_HOURS[candidateDay];

      if (!schedule) continue;

      if (offset === 1) {
        return `Öffnet morgen um ${formatTime(schedule.start)} Uhr`;
      }

      return `Öffnet am ${DAY_NAMES[candidateDay]} um ${formatTime(schedule.start)} Uhr`;
    }

    return "Nächste Sprechzeit folgt";
  }

  function updateOfficeStatus() {
    const dot = document.getElementById("office-status-dot");
    const title = document.getElementById("office-status-title");
    const info = document.getElementById("office-status-info");

    if (!dot || !title || !info) return;

    const { day, minutes } = getBerlinTime();
    const today = OFFICE_HOURS[day];
    const isOpen = Boolean(
      today &&
      minutes >= today.start &&
      minutes < today.end
    );

    document.querySelectorAll(".office-hours-row").forEach(row => {
      row.classList.toggle("is-today", Number(row.dataset.day) === day);
    });

    if (isOpen) {
      dot.className = "office-dot office-dot--open";
      title.textContent = "Jetzt geöffnet";
      info.textContent = `Heute bis ${formatTime(today.end)} Uhr geöffnet`;
    } else {
      dot.className = "office-dot office-dot--closed";
      title.textContent = "Derzeit geschlossen";
      info.textContent = findNextOpening(day, minutes);
    }
  }

  function initializeOfficeStatus() {
    updateOfficeStatus();
    window.setInterval(updateOfficeStatus, 60000);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) updateOfficeStatus();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeOfficeStatus);
  } else {
    initializeOfficeStatus();
  }
})();
