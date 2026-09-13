
document.addEventListener("DOMContentLoaded", () => {
  const buttons = [...document.querySelectorAll(".news-filters button")];
  const cards = [...document.querySelectorAll(".news-card-v1")];
  const search = document.getElementById("news-search-input");
  const empty = document.querySelector(".news-empty");
  let filter = "all";

  function update() {
    const query = (search?.value || "").trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const matchesFilter = filter === "all" || card.dataset.category === filter;
      const matchesSearch = !query || card.dataset.search.includes(query);
      const show = matchesFilter && matchesSearch;
      card.hidden = !show;
      if (show) visible++;
    });
    if (empty) empty.hidden = visible !== 0;
  }

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      filter = button.dataset.filter;
      update();
    });
  });

  search?.addEventListener("input", update);

  document.getElementById("newsletter-form")?.addEventListener("submit", event => {
    event.preventDefault();
    const message = document.getElementById("newsletter-message");
    if (message) {
      message.textContent = "Danke! Die echte Newsletter-Anmeldung wird nach der Vereinsfreigabe aktiviert.";
    }
  });
});
