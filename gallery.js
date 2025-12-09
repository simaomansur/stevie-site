// CATEGORY LOADER CONFIGURATION
const categories = {
  portraits: {
    folder: "portraits",
    prefix: "people",
    count: 23
  },
  events: {
    folder: "events",
    prefix: "events",
    count: 13
  }
};

// AUTO-LOAD IMAGES
for (let cat in categories) {
  const { folder, prefix, count } = categories[cat];
  const container = document.querySelector(`#${cat} .horizontal-scroll`);

  for (let i = 1; i <= count; i++) {
    const img = document.createElement("img");
    img.src = `assets/${folder}/${prefix}${i}.jpg`;  // <-- FIXED PATH
    img.alt = `${cat} ${i}`;
    container.appendChild(img);
  }
}

// TAB SWITCHING
const tabs = document.querySelectorAll(".tab-btn");
const sections = document.querySelectorAll(".gallery-section");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));

    tab.classList.add("active");
    const target = document.getElementById(tab.dataset.tab);
    target.classList.add("active");
  });
});
