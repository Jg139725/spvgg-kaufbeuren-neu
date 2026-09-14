(() => {
  const el = document.getElementById("reachability-status");
  if (!el) return;

  // Always evaluate explicitly in German local time, regardless of visitor/browser timezone.
  const schedule = {
    1: [16*60, 20*60], // Monday
    2: [16*60, 20*60],
    3: [16*60, 20*60],
    4: [16*60, 20*60],
    5: [16*60, 18*60]  // Friday
  };

  function berlinParts() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());

    const obj = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const dayMap = {Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:0};
    return {
      day: dayMap[obj.weekday],
      hour: Number(obj.hour),
      minute: Number(obj.minute)
    };
  }

  function nextOpening(day, mins) {
    const names = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
    for (let offset = 0; offset < 8; offset++) {
      const d = (day + offset) % 7;
      const slot = schedule[d];
      if (!slot) continue;
      if (offset === 0 && mins < slot[0]) return `Heute ab ${String(Math.floor(slot[0]/60)).padStart(2,"0")}:00 Uhr`;
      if (offset === 0 && mins >= slot[1]) continue;
      if (offset > 0) return `${names[d]} ab ${String(Math.floor(slot[0]/60)).padStart(2,"0")}:00 Uhr`;
    }
    return "Nächste Erreichbarkeit wird angezeigt";
  }

  function update() {
    const t = berlinParts();
    const mins = t.hour * 60 + t.minute;
    const slot = schedule[t.day];
    const open = !!slot && mins >= slot[0] && mins < slot[1];

    el.classList.toggle("is-open", open);
    el.classList.toggle("is-closed", !open);

    if (open) {
      const until = `${String(Math.floor(slot[1]/60)).padStart(2,"0")}:${String(slot[1]%60).padStart(2,"0")} Uhr`;
      el.innerHTML = `<span class="reachability-dot"></span><div><strong>Derzeit erreichbar</strong><small>Heute bis ${until}</small></div>`;
    } else {
      el.innerHTML = `<span class="reachability-dot"></span><div><strong>Derzeit nicht erreichbar</strong><small>${nextOpening(t.day, mins)}</small></div>`;
    }
  }

  update();
  setInterval(update, 30000);
})();