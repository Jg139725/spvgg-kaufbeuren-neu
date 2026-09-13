
document.addEventListener("DOMContentLoaded", () => {
  const dot = document.getElementById("office-status-dot");
  const title = document.getElementById("office-status-title");
  const info = document.getElementById("office-status-info");

  if (!dot || !title || !info) return;

  const weekdayMap = {
    "So": 0,
    "Mo": 1,
    "Di": 2,
    "Mi": 3,
    "Do": 4,
    "Fr": 5,
    "Sa": 6
  };

  const hours = {
    1: { start: 16 * 60, end: 20 * 60 },
    2: { start: 16 * 60, end: 20 * 60 },
    3: { start: 16 * 60, end: 20 * 60 },
    4: { start: 16 * 60, end: 20 * 60 },
    5: { start: 16 * 60, end: 18 * 60 }
  };

  const names = [
    "Sonntag", "Montag", "Dienstag", "Mittwoch",
    "Donnerstag", "Freitag", "Samstag"
  ];

  function formatTime(minutes){
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  }

  function setOpen(end){
    dot.className = "office-dot office-dot--open";
    title.textContent = "Jetzt erreichbar";
    info.textContent = `Heute bis ${formatTime(end)} Uhr erreichbar`;
  }

  function findNextOpening(day, nowMinutes){
    for (let offset = 0; offset < 8; offset++){
      const candidate = (day + offset) % 7;
      const schedule = hours[candidate];

      if (!schedule) continue;

      if (offset === 0 && nowMinutes < schedule.start){
        return `Heute ab ${formatTime(schedule.start)} Uhr erreichbar`;
      }

      if (offset > 0){
        const dayText = offset === 1 ? "morgen" : `am ${names[candidate]}`;
        return `${dayText.charAt(0).toUpperCase() + dayText.slice(1)} ab ${formatTime(schedule.start)} Uhr erreichbar`;
      }
    }
    return "Nächste Erreichbarkeit wird angezeigt";
  }

  function updateStatus(){
    // Deutschland-Zeit verwenden; Intl liefert Wochentage je nach Browser mit Punkt ("Mo.").
    const parts = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin", weekday: "short", hour: "2-digit",
      minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const day = weekdayMap[values.weekday.replace(/\.$/, "")];
    if (day === undefined) return;
    const nowMinutes = Number(values.hour) * 60 + Number(values.minute);

    document.querySelectorAll(".office-hours-row").forEach(row => {
      row.classList.toggle("is-today", Number(row.dataset.day) === day);
    });

    const today = hours[day];
    if (today && nowMinutes >= today.start && nowMinutes < today.end){
      setOpen(today.end);
    } else {
      dot.className = "office-dot office-dot--closed";
      title.textContent = "Derzeit nicht erreichbar";
      info.textContent = findNextOpening(day, nowMinutes);
    }
  }

  updateStatus();
  setInterval(updateStatus, 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateStatus();
  });
});
