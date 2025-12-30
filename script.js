// script.js
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-loaded");

  const navImgs = document.querySelectorAll(".nav-item img");
  navImgs.forEach((img) => {
    img.style.transition = "transform 0.35s ease, filter 0.35s ease";
  });

  (() => {
    "use strict";

    const images = [
      { src: "assets/nav/about.jpg", alt: "About" },
      { src: "assets/nav/gallery.jpg", alt: "Gallery" },
      { src: "assets/nav/contact.jpg", alt: "Contact" },
      { src: "assets/nav/home.jpg", alt: "Home" },
    ];

    const root = document.querySelector("[data-mg]");
    if (!root) return;

    const track = root.querySelector("[data-track]");
    const viewport = root.querySelector("[data-viewport]");
    const prevBtn = root.querySelector("[data-prev]");
    const nextBtn = root.querySelector("[data-next]");
    const dotsWrap = root.closest(".mini-gallery")?.querySelector("[data-dots]");

    if (!track || !viewport || images.length < 2) return;

    const mod = (n, m) => ((n % m) + m) % m;
    const prefersReduced = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- Build a repeated strip so "infinite" feels real
    const SET = images.length;
    const REPEAT = 11;               // must be odd
    const TOTAL = SET * REPEAT;
    const CENTER_BASE = SET * Math.floor(REPEAT / 2);

    let index = CENTER_BASE;          // active slide index in the repeated strip
    let slideW = 0;
    let step = 0;
    let centerOffset = 0;

    // movement state (single source of truth)
    let currentX = 0;                // current translateX (px)
    let anim = null;                 // current Web Animation
    let isAnimating = false;
    let pending = 0;

    // drag state
    let dragging = false;
    let dragStartX = 0;
    let dragStartTranslate = 0;

    // ----- DOM build
    function buildSlides() {
      track.innerHTML = "";
      for (let r = 0; r < REPEAT; r++) {
        for (let i = 0; i < SET; i++) {
          const slide = document.createElement("div");
          slide.className = "mg__slide";

          const img = document.createElement("img");
          img.src = images[i].src;
          img.alt = images[i].alt || "";
          img.loading = (r === Math.floor(REPEAT / 2) && i === 0) ? "eager" : "lazy";
          img.decoding = "async";
          img.draggable = false;

          slide.appendChild(img);
          track.appendChild(slide);
        }
      }
    }
    buildSlides();

    // ----- Dots (real set only)
    const dots = images.map((_, i) => {
      const b = document.createElement("button");
      b.className = "mg__dot" + (i === 0 ? " is-active" : "");
      b.type = "button";
      b.setAttribute("aria-label", `Go to photo ${i + 1}`);
      b.addEventListener("click", () => jumpToReal(i));
      dotsWrap?.appendChild(b);
      return b;
    });

    function setActiveClasses() {
      const slides = Array.from(track.children);
      slides.forEach((s) => s.classList.remove("is-active"));
      if (slides[index]) slides[index].classList.add("is-active");
    }

    function setDots() {
      const real = mod(index, SET);
      dots.forEach((d, i) => d.classList.toggle("is-active", i === real));
    }

    function computeStep() {
      const slides = track.querySelectorAll(".mg__slide");
      if (slides.length < 2) return 0;
      // layout-based, stable under transforms
      return slides[1].offsetLeft - slides[0].offsetLeft;
    }

    function applyTransform(x) {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    }

    function xForIndex(i) {
      return centerOffset - (i * step);
    }

    function cancelAnim() {
      if (anim) {
        anim.cancel();
        anim = null;
      }
      isAnimating = false;
    }

    function measure() {
      const first = track.querySelector(".mg__slide");
      if (!first) return;

      slideW = first.offsetWidth;
      step = computeStep();
      if (!slideW || !step) return;

      const vpW = viewport.getBoundingClientRect().width;
      centerOffset = (vpW / 2) - (slideW / 2);

      // snap to index in a controlled way
      cancelAnim();
      currentX = xForIndex(index);
      applyTransform(currentX);

      setActiveClasses();
      setDots();
    }

    // ---- Recentering without ANY visual change
    function recenterIfNeeded() {
      const buffer = SET * 3;
      if (index > buffer && index < TOTAL - buffer) return;

      const oldIndex = index;
      const real = mod(oldIndex, SET);
      const newIndex = CENTER_BASE + real;

      // shift currentX by exact multiple of step so the pixels stay identical
      // (keep any tiny drift perfectly)
      currentX += (oldIndex - newIndex) * step;
      index = newIndex;

      applyTransform(currentX);
      setActiveClasses();
      setDots();
    }

    // ---- Animation (reliable finish callback, even on spam)
    function animateToIndex(targetIndex) {
      const targetX = xForIndex(targetIndex);

      if (prefersReduced()) {
        cancelAnim();
        index = targetIndex;
        currentX = targetX;
        applyTransform(currentX);
        setActiveClasses();
        setDots();
        recenterIfNeeded();
        return Promise.resolve();
      }

      cancelAnim();
      isAnimating = true;

      // start from currentX (never read computed styles)
      anim = track.animate(
        [
          { transform: `translate3d(${currentX}px, 0, 0)` },
          { transform: `translate3d(${targetX}px, 0, 0)` },
        ],
        { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
      );

      return anim.finished
        .then(() => {
          // commit final state
          currentX = targetX;
          applyTransform(currentX);
        })
        .catch(() => {}) // cancelled is fine
        .finally(() => {
          if (anim) anim.cancel();
          anim = null;
          isAnimating = false;

          recenterIfNeeded();

          // drain queued spam clicks
          if (pending !== 0) {
            const d = pending;
            pending = 0;
            moveBy(d);
          }
        });
    }

    function moveBy(delta) {
      // clamp delta so you can't queue absurd leaps; keeps it feeling consistent
      const d = Math.max(-SET, Math.min(SET, delta));
      index += d;

      setActiveClasses();
      setDots();

      return animateToIndex(index);
    }

    function requestMove(delta) {
      pending += delta;
      if (isAnimating) return;

      const d = pending;
      pending = 0;
      moveBy(d);
    }

    function next() { requestMove(1); }
    function prev() { requestMove(-1); }

    function jumpToReal(realIndex) {
      // reset to center copy + chosen real
      cancelAnim();
      pending = 0;

      index = CENTER_BASE + realIndex;
      currentX = xForIndex(index);
      applyTransform(currentX);

      setActiveClasses();
      setDots();
    }

    // ---- Buttons (no special preventDefault needed now, but safe)
    prevBtn?.addEventListener("click", (e) => { e.preventDefault(); prev(); });
    nextBtn?.addEventListener("click", (e) => { e.preventDefault(); next(); });

    // ---- Drag / swipe (viewport only, ignore buttons)
    viewport.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      cancelAnim();
      pending = 0;

      dragging = true;
      dragStartX = e.clientX;
      dragStartTranslate = currentX;

      viewport.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;

      currentX = dragStartTranslate + dx;
      applyTransform(currentX);

      e.preventDefault();
    });

    viewport.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;

      const dx = e.clientX - dragStartX;
      const threshold = slideW * 0.18;

      if (dx > threshold) index -= 1;
      else if (dx < -threshold) index += 1;

      setActiveClasses();
      setDots();

      animateToIndex(index);
      e.preventDefault();
    });

    // ---- Resize
    const ro = new ResizeObserver(() => measure());
    ro.observe(viewport);

    requestAnimationFrame(measure);

    // --- Trackpad / wheel support (two-finger scroll)
    let wheelAccum = 0;
    let wheelRAF = 0;

    function wheelRender() {
      wheelRAF = 0;
      // behave like a “temporary drag” around the current active index
      currentX = xForIndex(index) - wheelAccum;
      applyTransform(currentX);
    }

    function settleWheel() {
      wheelAccum = 0;
      animateToIndex(index);
    }

    function onWheel(e) {
      // Ignore while actively dragging with pointer
      if (dragging) return;

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // Trackpads usually give deltaX for horizontal. Some users “horizontal scroll” via deltaY.
      const isMostlyHorizontal = absX > absY;
      const delta = isMostlyHorizontal ? e.deltaX : e.deltaY;

      // If it’s basically a normal vertical scroll, don’t hijack the page.
      if (!isMostlyHorizontal && absY > 0 && absX < 3) return;

      e.preventDefault();

      // stop any running animation so wheel feels immediate
      cancelAnim();
      pending = 0;

      wheelAccum += delta * 0.4;

      // render at most once per frame
      if (!wheelRAF) wheelRAF = requestAnimationFrame(wheelRender);

      // When the user scrolls far enough, advance slides
      const threshold = slideW * 0.90;

      if (wheelAccum > threshold) {
        wheelAccum -= threshold;
        index += 1; // flipped
        setActiveClasses();
        setDots();
        animateToIndex(index);
      } else if (wheelAccum < -threshold) {
        wheelAccum += threshold;
        index -= 1; // flipped
        setActiveClasses();
        setDots();
        animateToIndex(index);
      }

      clearTimeout(onWheel._t);
      onWheel._t = setTimeout(settleWheel, 140);
    }

    viewport.addEventListener("wheel", onWheel, { passive: false });

  })();
});
