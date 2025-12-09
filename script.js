/* PAGE FADE-IN */
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-loaded");
});

/* OPTIONAL: HOVER SMOOTHNESS FOR NAV IMAGES */
const navItems = document.querySelectorAll(".nav-item img");

navItems.forEach(img => {
  img.addEventListener("mouseenter", () => {
    img.style.transition = "transform 0.35s ease, filter 0.35s ease";
  });

  img.addEventListener("mouseleave", () => {
    img.style.transition = "transform 0.35s ease, filter 0.35s ease";
  });
});
