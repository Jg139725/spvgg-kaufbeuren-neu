
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".bfv-widget-target").forEach((target) => {
    const placeholder = target.querySelector(".bfv-awaiting");
    const observer = new MutationObserver(() => {
      const realContent = [...target.children].some(
        (node) => node !== placeholder && (
          node.tagName === "IFRAME" ||
          node.tagName === "SCRIPT" ||
          node.querySelector?.("iframe")
        )
      );
      if (realContent && placeholder) placeholder.remove();
    });
    observer.observe(target, {childList:true, subtree:true});
  });
});
