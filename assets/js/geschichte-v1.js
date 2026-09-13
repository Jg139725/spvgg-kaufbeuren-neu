
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".timeline-item, .honours-grid article, .people-history-grid article");
  items.forEach(item => item.setAttribute("tabindex", "0"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("history-visible");
      });
    }, {threshold: 0.12});

    document.querySelectorAll(".timeline-item").forEach(item => observer.observe(item));
  }
});
