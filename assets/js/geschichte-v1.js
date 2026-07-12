
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


document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".museum-grid details").forEach(item => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      document.querySelectorAll(".museum-grid details").forEach(other => {
        if (other !== item) other.open = false;
      });
    });
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const eraLinks = [...document.querySelectorAll(".history-era-nav a")];
  const eraSections = eraLinks
    .map(link => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const eraObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        eraLinks.forEach(link => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${entry.target.id}`
          );
        });
      });
    }, {rootMargin:"-30% 0px -60% 0px"});

    eraSections.forEach(section => eraObserver.observe(section));
  }
});
