
document.addEventListener("DOMContentLoaded", () => {
  const buttons = [...document.querySelectorAll(".partner-filters button")];
  const cards = [...document.querySelectorAll(".partner-card-v2")];

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(item => item.classList.remove("active"));
      button.classList.add("active");

      const filter = button.dataset.filter;
      cards.forEach(card => {
        card.hidden = filter !== "all" && card.dataset.category !== filter;
      });
    });
  });
});
