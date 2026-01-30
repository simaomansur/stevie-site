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
    count: 9
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
  }
};

// AUTO-LOAD IMAGES
for (let cat in categories) {
  const { folder, prefix, count } = categories[cat];
  const container = document.querySelector(`#${cat} .horizontal-scroll`);

  for (let i = 1; i <= count; i++) {
    const img = document.createElement("img");
    img.src = `assets/${folder}/${prefix}${i}.jpg`;
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
