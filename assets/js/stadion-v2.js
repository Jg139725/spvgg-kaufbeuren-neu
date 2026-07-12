
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".stadium-fact-grid article, .matchday-grid article, .stadium-gallery figure")
    .forEach(element => element.setAttribute("tabindex", "0"));
});
