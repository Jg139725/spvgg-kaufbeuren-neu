document.addEventListener("DOMContentLoaded", () => {
  const needle = "Die alte Website zeigte beide Standorte nur über eingebettete Karten";
  const nodes = [...document.querySelectorAll("body *")];
  const target = nodes.find(el =>
    el.children.length === 0 &&
    (el.textContent || "").includes(needle)
  );
  if (!target) return;

  let box = target;
  while (
    box.parentElement &&
    box.parentElement !== document.body &&
    box.parentElement.children.length === 1 &&
    (box.parentElement.textContent || "").includes(needle)
  ) {
    box = box.parentElement;
  }
  box.remove();
});
