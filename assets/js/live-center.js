
document.addEventListener("DOMContentLoaded", () => {
  const card = document.getElementById("countdown-card");
  const output = document.getElementById("match-countdown");
  if (!card || !output || !card.dataset.matchDate) return;
  const target = new Date(card.dataset.matchDate).getTime();
  function tick(){
    const diff = target - Date.now();
    if(diff <= 0){ output.textContent = "Anpfiff"; return; }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    output.textContent = `${days} Tage · ${hours} Std. · ${mins} Min.`;
  }
  tick();
  setInterval(tick, 60000);
});
