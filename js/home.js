const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.main-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.main-nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.18 });

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

document.querySelectorAll('#main-navigation a').forEach(link=>{
  link.addEventListener('click',()=>{
    const nav=document.getElementById('main-navigation');
    const button=document.querySelector('.menu-button');
    if(nav) nav.classList.remove('is-open');
    if(button) button.setAttribute('aria-expanded','false');
  });
});


/* Fanshop-Hardfix: alle alten oder lokalen Shoplinks direkt auf Textilstars setzen */
document.addEventListener("DOMContentLoaded", () => {
  const correctShopUrl = "https://textilstars.com/SpVgg-Kaufbeuren";

  document.querySelectorAll("a").forEach(link => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    const text = (link.textContent || "").trim().toLowerCase();

    if (
      text.includes("fanshop") ||
      href.includes("fanshop.html") ||
      href.includes("fan12.de") ||
      href.includes("textilstars.com/spvgg-kaufbeuren")
    ) {
      link.setAttribute("href", correctShopUrl);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  });
});
