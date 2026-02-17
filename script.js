// script.js
document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-mg]");
  if (!root) return;

  const viewport = root.querySelector("[data-viewport]");
  const track = root.querySelector("[data-track]");
  const prevBtn = root.querySelector("[data-prev]");
  const nextBtn = root.querySelector("[data-next]");
  const dotsWrap = root.closest(".mini-gallery")?.querySelector("[data-dots]");

  if (!viewport || !track) return;

  const images = [
    { src: "assets/nav/1.jpg", alt: "About" },
    { src: "assets/nav/2.jpg", alt: "About" },
    { src: "assets/nav/3.jpg", alt: "About" },
    { src: "assets/nav/4.jpg", alt: "About" },
    { src: "assets/nav/5.jpg", alt: "About" },
    { src: "assets/nav/6.jpg", alt: "About" },
    { src: "assets/nav/7.jpg", alt: "About" },
    { src: "assets/nav/8.jpg", alt: "About" },
    { src: "assets/nav/9.jpg", alt: "About" },
    { src: "assets/nav/10.jpg", alt: "About" },
    { src: "assets/nav/11.jpg", alt: "About" },
    { src: "assets/nav/12.jpg", alt: "About" },
    { src: "assets/nav/13.jpg", alt: "About" },
    { src: "assets/nav/14.jpg", alt: "About" },
  ];

  const SET = images.length;

  // How many clones on each side.
  // With 3 visible on desktop, 3 is a good buffer.
  const BUFFER = 5;

  const mod = (n, m) => ((n % m) + m) % m;

  function buildSlide(imgObj) {
    const slide = document.createElement("div");
    slide.className = "mg__slide";

    const img = document.createElement("img");
    img.src = imgObj.src;
    img.alt = imgObj.alt || "";
    img.loading = "lazy";
    img.decoding = "async";
    img.draggable = false;

    slide.appendChild(img);
    return slide;
  }

  // ---- build: [last BUFFER clones] + [real SET] + [first BUFFER clones]
  track.innerHTML = "";

  const leftClones = [];
  for (let i = SET - BUFFER; i < SET; i++) leftClones.push(images[mod(i, SET)]);
  leftClones.forEach((img) => track.appendChild(buildSlide(img)));

  images.forEach((img, i) => {
    const s = buildSlide(img);
    if (i === 0) s.querySelector("img").loading = "eager";
    track.appendChild(s);
  });

  const rightClones = [];
  for (let i = 0; i < BUFFER; i++) rightClones.push(images[i]);
  rightClones.forEach((img) => track.appendChild(buildSlide(img)));

  const getSlides = () => Array.from(track.querySelectorAll(".mg__slide"));

  function viewportCenterX() {
    return viewport.getBoundingClientRect().width / 2;
  }

  function physicalIndexFromScroll() {
    const slides = getSlides();
    if (!slides.length) return 0;

    const center = viewport.scrollLeft + viewportCenterX();

    let best = 0;
    let bestDist = Infinity;

    for (let i = 0; i < slides.length; i++) {
      const left = slides[i].offsetLeft;
      const w = slides[i].getBoundingClientRect().width;
      const c = left + w / 2;
      const d = Math.abs(c - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  function logicalFromPhysical(p) {
    // physical = BUFFER..BUFFER+SET-1 is the "real" region
    return mod(p - BUFFER, SET);
  }

  // ---- dots (logical)
  const dots = [];
  if (dotsWrap) dotsWrap.innerHTML = "";
  for (let i = 0; i < SET; i++) {
    const b = document.createElement("button");
    b.className = "mg__dot";
    b.type = "button";
    b.setAttribute("aria-label", `Go to photo ${i + 1}`);
    b.addEventListener("click", () => scrollToLogical(i));
    dotsWrap?.appendChild(b);
    dots.push(b);
  }

  function setActivePhysical(p) {
    const slides = getSlides();
    slides.forEach((el) => el.classList.remove("is-active"));
    if (slides[p]) slides[p].classList.add("is-active");
  }

  function setDotsForPhysical(p) {
    const real = logicalFromPhysical(p);
    dots.forEach((d, i) => d.classList.toggle("is-active", i === real));
  }

  function scrollToPhysical(p, behavior = "smooth") {
    const slides = getSlides();
    const el = slides[p];
    if (!el) return;

    const w = el.getBoundingClientRect().width;
    const left = el.offsetLeft;
    const target = left - (viewportCenterX() - w / 2);

    viewport.scrollTo({ left: target, behavior });
  }

  function scrollToLogical(i, behavior = "smooth") {
    scrollToPhysical(i + BUFFER, behavior);
  }

  function targetScrollLeftForPhysical(p) {
    const slides = getSlides();
    const el = slides[p];
    if (!el) return viewport.scrollLeft;

    const w = el.getBoundingClientRect().width;
    const left = el.offsetLeft;
    return left - (viewportCenterX() - w / 2);
  }


  // ---- infinite wrap jump
  let jumping = false;
  let settleT = 0;
  const SCROLL_SETTLE_MS = 5;
  let suppressActive = false;

  function jumpIfNeeded() {
    if (jumping) return;

    const p = physicalIndexFromScroll();

    let targetP = -1;
    if (p < BUFFER) targetP = p + SET;               // left clones -> real
    else if (p >= BUFFER + SET) targetP = p - SET;   // right clones -> real
    else return;

    jumping = true;
    suppressActive = true;
    viewport.classList.add("is-jumping");

    const targetLeft = targetScrollLeftForPhysical(targetP);

    // do the jump on the next frame to avoid mid-paint flicker
    requestAnimationFrame(() => {
      const prevBehavior = viewport.style.scrollBehavior;
      viewport.style.scrollBehavior = "auto";

      viewport.scrollLeft = targetLeft; // direct assignment = least janky

      // restore behavior next frame
      requestAnimationFrame(() => {
        viewport.style.scrollBehavior = prevBehavior || "";
        jumping = false;
        suppressActive = false;

        // after jump, set active/dots based on the new stable position
        setActivePhysical(targetP);
        setDotsForPhysical(targetP);
        viewport.classList.remove("is-jumping");
      });
    });
  }

  // ---- arrows (wrap logically)
  prevBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    const p = physicalIndexFromScroll();
    const logical = logicalFromPhysical(p);

    if (logical === 0) scrollToPhysical(BUFFER - 1, "smooth");
    else scrollToLogical(mod(logical - 1, SET));
  });

  nextBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    const p = physicalIndexFromScroll();
    const logical = logicalFromPhysical(p);

    if (logical === SET - 1) scrollToPhysical(BUFFER + SET, "smooth");
    else scrollToLogical(mod(logical + 1, SET));
  });

  // ---- drag
  let dragging = false;
  let startX = 0;
  let startScroll = 0;

  viewport.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    dragging = true;
    startX = e.clientX;
    startScroll = viewport.scrollLeft;

    viewport.setPointerCapture(e.pointerId);
    viewport.style.scrollBehavior = "auto";
    e.preventDefault();
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    viewport.scrollLeft = startScroll - dx;
    e.preventDefault();
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;

    const p = physicalIndexFromScroll();
    viewport.style.scrollBehavior = "";
    scrollToPhysical(p, "smooth");
  }

  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
  viewport.addEventListener("lostpointercapture", endDrag);

  // ---- wheel: vertical mouse wheel => horizontal scroll. Trackpad horizontal passes through.
  viewport.addEventListener(
    "wheel",
    (e) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      if (absX > absY) return; // natural horizontal trackpad scroll
      e.preventDefault();
      viewport.scrollLeft += e.deltaY;
    },
    { passive: false }
  );

  // ---- keep active + dots synced
  let rafDots = 0;

  viewport.addEventListener(
    "scroll",
    () => {
      // LIVE dots (fast)
      if (!rafDots) {
        rafDots = requestAnimationFrame(() => {
          rafDots = 0;
          const pNow = physicalIndexFromScroll();
          setDotsForPhysical(pNow);
        });
      }

      // SETTLE: jump + active grow (no flicker)
      clearTimeout(settleT);
      settleT = setTimeout(() => {
        jumpIfNeeded();

        if (!jumping) {
          const p = physicalIndexFromScroll();
          setActivePhysical(p);
          setDotsForPhysical(p); // ensure dots match after jump
        }
      }, SCROLL_SETTLE_MS);
    },
    { passive: true }
  );

  // ---- initial: start at first REAL slide (physical BUFFER)
  setActivePhysical(BUFFER);
  requestAnimationFrame(() => scrollToPhysical(BUFFER, "auto"));

  // ---- resize: keep centered + maintain infinite behavior
  const ro = new ResizeObserver(() => {
    const p = physicalIndexFromScroll();
    scrollToPhysical(p, "auto");

    clearTimeout(settleT);
    settleT = setTimeout(() => jumpIfNeeded(), SCROLL_SETTLE_MS);
  });
  ro.observe(viewport);
});
