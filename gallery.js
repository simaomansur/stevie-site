// CATEGORY LOADER CONFIGURATION
// FOR STEVIE!!!!! Change the number here to match the number of pictures in the folders!
// WHEN YOU DOWNLOAD THE IMAGES CD TO THE FOLDER WHERE THEY ARE LOCATED THEN USE COMMAND UNDERNEATH
// in terminal:
// cd "folder name" until you get to images ex: cd desktop then cd images
// sips -Z 2000 *.jpg
const categories = {
  portraits: {
    folder: "portraits",
    prefix: "portrait",
    count: 10
  },
  events: {
    folder: "events",
    prefix: "events",
    count: 16
  },
  family: {
    folder: "family",
    prefix: "family",
    count: 20
  },
  boudoir: {
    folder: "boudoir",
    prefix: "boudoir",
    count: 0
  }
};

// AUTO-LOAD IMAGES (with safety net)
for (let cat in categories) {
  const { folder, prefix, count } = categories[cat];

  const container = document.querySelector(`#${cat} .horizontal-scroll`);
  if (!container) continue;

  for (let i = 1; i <= count; i++) {
    const img = document.createElement("img");
    img.src = `assets/${folder}/${prefix}${i}.jpg`;
    img.alt = `${cat} ${i}`;
    container.appendChild(img);
  }
}

// TAB SWITCHING (+ boudoir content warning)
const tabs = document.querySelectorAll(".tab-btn");
const sections = document.querySelectorAll(".gallery-section");

function activateTab(tab) {
  tabs.forEach(t => t.classList.remove("active"));
  sections.forEach(s => s.classList.remove("active"));

  tab.classList.add("active");
  const target = document.getElementById(tab.dataset.tab);
  if (target) target.classList.add("active");
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const isBoudoir = tab.dataset.tab === "boudoir";

    if (isBoudoir && !sessionStorage.getItem("boudoir_ok")) {
      const ok = window.confirm(
        "Content warning: This section contains sexual content / boudoir photography. Continue?"
      );

      if (!ok) return;

      sessionStorage.setItem("boudoir_ok", "1");
    }

    activateTab(tab);
  });
});