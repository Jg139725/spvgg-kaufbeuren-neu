
(async () => {
  const grid = document.querySelector(".news-grid-v1");
  if (!grid) return;

  const esc = (s="") => String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  try {
    const res = await fetch(`data/news.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const items = await res.json();
    if (!Array.isArray(items) || !items.length) return;

    items
      .slice()
      .sort((a,b) => String(b.date).localeCompare(String(a.date)))
      .forEach(item => {
        const article = document.createElement("article");
        article.className = "news-card-v1 news-card-v1--editor";
        article.dataset.category = item.category || "verein";
        article.dataset.search = `${item.title || ""} ${item.teaser || ""}`.toLowerCase();

        const image = item.image || "assets/images/logo-top.png";
        const link = item.url || `news/${item.slug}.html`;
        const prettyDate = item.date ? item.date.split("-").reverse().join(".") : "";

        article.innerHTML = `
          <a class="news-card-image" href="${esc(link)}">
            <img src="${esc(image)}" alt="${esc(item.title || "SVK News")}" loading="lazy">
            <span>${esc(item.categoryLabel || item.category || "Verein")}</span>
          </a>
          <div class="news-card-content">
            <time datetime="${esc(item.date || "")}">${esc(prettyDate)}</time>
            <h3><a href="${esc(link)}">${esc(item.title || "")}</a></h3>
            <p>${esc(item.teaser || "")}</p>
            <a class="news-read-more" href="${esc(link)}">Weiterlesen →</a>
          </div>`;
        grid.prepend(article);
      });
  } catch (e) {
    console.warn("SVK News konnten nicht geladen werden.", e);
  }
})();
