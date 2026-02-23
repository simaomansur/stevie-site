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
    count: 17
  },
  events: {
    folder: "events",
    prefix: "events",
    count: 17
  },
  family: {
    folder: "family",
    prefix: "family",
    count: 23
  },
  boudoir: {
    folder: "boudoir",
    prefix: "boudoir",
    count: 15
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

// Make mouse wheel scroll horizontal galleries (and allow click-drag)
document.querySelectorAll(".horizontal-scroll").forEach((row) => {
  // Wheel: vertical wheel -> horizontal scroll
  row.addEventListener(
    "wheel",
    (e) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // If user is already doing horizontal wheel, let it happen normally
      if (absX > absY) return;

      e.preventDefault();
      row.scrollLeft += e.deltaY;
    },
    { passive: false }
  );

  // Click + drag
  let down = false;
  let startX = 0;
  let startLeft = 0;

  row.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    down = true;
    startX = e.clientX;
    startLeft = row.scrollLeft;
    row.classList.add("is-dragging");
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!down) return;
    row.scrollLeft = startLeft - (e.clientX - startX);
  });

  window.addEventListener("mouseup", () => {
    down = false;
    row.classList.remove("is-dragging");
  });
});
