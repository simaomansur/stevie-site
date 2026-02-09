// script.js
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-loaded");

  document.querySelectorAll(".nav-item img").forEach((img) => {
    img.style.transition = "transform 0.35s ease, filter 0.35s ease";
  });

  (() => {
    "use strict";

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

    const SET = images.length;
    const REPEAT = 5;
    const CENTER_BASE = SET * Math.floor(REPEAT / 2);

    let index = CENTER_BASE;
    let slideW = 0;
    let step = 0;
    let baseCenterOffset = 0;
    let biasX = 0;

    let currentX = 0;
    let isAnimating = false;
    let pending = 0;

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
          img.loading = r === Math.floor(REPEAT / 2) && i === 0 ? "eager" : "lazy";
          img.decoding = "async";
          img.draggable = false;

          slide.appendChild(img);
          track.appendChild(slide);
        }
      }
    }
    buildSlides();

    // ----- Dots
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
      const slides = track.children;
      const len = slides.length;
      const real = mod(index, SET);
      const target = CENTER_BASE + real;

      for (let k = 0; k < len; k++) slides[k].classList.remove("is-active");
      if (slides[target]) slides[target].classList.add("is-active");
    }

    function setActiveForIndex(i) {
      const slides = track.children;
      const len = slides.length;
      if (!Number.isFinite(i) || len === 0) return;

      const clamped = Math.max(0, Math.min(len - 1, i));

      for (let k = 0; k < len; k++) slides[k].classList.remove("is-active");
      slides[clamped].classList.add("is-active");
    }

    function setDots() {
      const real = mod(index, SET);
      dots.forEach((d, i) => d.classList.toggle("is-active", i === real));
    }

    // live dot update during wheel scroll
    function setDotsWheel(wheelPos) {
      if (!step) return;
      const visual = index + Math.round(wheelPos / step);
      const real = mod(visual, SET);
      dots.forEach((d, i) => d.classList.toggle("is-active", i === real));
    }

    function computeStep() {
      const slides = track.querySelectorAll(".mg__slide");
      if (slides.length < 2) return 0;

      const a = slides[0].getBoundingClientRect();
      const b = slides[1].getBoundingClientRect();
      const stepPx = b.left - a.left;

      return Number.isFinite(stepPx) ? stepPx : 0;
    }

    function applyTransform(x) {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    }

    function xForIndex(i) {
      return baseCenterOffset + biasX - i * step;
    }

    function cancelAnim() {
      isAnimating = false;
    }

    function setTrackTransition(enabled) {
      track.style.transition = enabled
        ? "transform 520ms cubic-bezier(.2,.8,.2,1)"
        : "none";
    }

    function normalizeBias() {
      if (!step || !Number.isFinite(step)) return;

      const period = SET * step;
      if (!Number.isFinite(period) || period === 0) return;

      const k = Math.round(biasX / period);
      if (k === 0) return;

      biasX -= k * period;
      currentX += k * period;

      setTrackTransition(false);
      applyTransform(currentX);
      setTrackTransition(true);
    }

    function clampIndexToMiddle() {
      const real = mod(index, SET);
      const newIndex = CENTER_BASE + real;
      if (newIndex !== index) index = newIndex;
    }

    function measure() {
      const first = track.querySelector(".mg__slide");
      if (!first) return;

      slideW = first.offsetWidth;
      step = computeStep();
      if (!slideW || !step) return;

      const vpW = viewport.getBoundingClientRect().width;
      baseCenterOffset = vpW / 2 - slideW / 2;

      normalizeBias();
      cancelAnim();

      setTrackTransition(false);
      currentX = xForIndex(index);
      applyTransform(currentX);
      setTrackTransition(true);

      setActiveClasses();
      setDots();
    }

    function animateToIndex(targetIndex, { doRebase = true } = {}) {
      const targetX = xForIndex(targetIndex);

      cancelAnim();

      if (prefersReduced()) {
        setTrackTransition(false);
        index = targetIndex;
        currentX = targetX;
        applyTransform(currentX);
        setActiveClasses();
        setDots();
        clampIndexToMiddle();
        setActiveForIndex(index);
        return Promise.resolve();
      }

      isAnimating = true;
      setTrackTransition(true);

      index = targetIndex;
      currentX = targetX;
      applyTransform(currentX);

      setActiveForIndex(index);

      return new Promise((resolve) => {
        const onEnd = (e) => {
          if (e.propertyName !== "transform") return;
          track.removeEventListener("transitionend", onEnd);
          isAnimating = false;

          if (doRebase) clampIndexToMiddle();

          setDots();

          if (pending !== 0) {
            const d = pending;
            pending = 0;
            moveBy(d);
          }
          resolve();
        };
        track.addEventListener("transitionend", onEnd);
      });
    }

    function moveBy(delta) {
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

    function jumpToReal(realIndex) {
      cancelAnim();
      pending = 0;

      index = CENTER_BASE + realIndex;
      currentX = xForIndex(index);
      applyTransform(currentX);

      setActiveClasses();
      setDots();
    }

    prevBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      requestMove(-1);
    });

    nextBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      requestMove(1);
    });

    // ---- Drag / swipe
    viewport.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      cancelAnim();
      pending = 0;

      dragging = true;
      dragStartX = e.clientX;
      dragStartTranslate = currentX;
      setTrackTransition(false);

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
      setTrackTransition(true);

      animateToIndex(index);
      e.preventDefault();
    });

    viewport.addEventListener("pointercancel", () => {
      if (!dragging) return;
      dragging = false;
      setTrackTransition(true);
      animateToIndex(index);
    });

    viewport.addEventListener("lostpointercapture", () => {
      if (!dragging) return;
      dragging = false;
      setTrackTransition(true);
      animateToIndex(index);
    });

    // ---- Resize
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    requestAnimationFrame(measure);

    // --- Trackpad / wheel support
    let wheelTarget = 0;
    let wheelPos = 0;
    let wheelRAF = 0;
    let wheelSettleT = 0;

    const WHEEL_EASE = 0.14;
    const WHEEL_SENS = 0.55;

    function normalizeWheelPx(e) {
      let dx = e.deltaX;
      let dy = e.deltaY;

      if (e.deltaMode === 1) {
        dx *= 16;
        dy *= 16;
      } else if (e.deltaMode === 2) {
        dx *= window.innerHeight;
        dy *= window.innerHeight;
      }

      dx = Math.max(-240, Math.min(240, dx));
      dy = Math.max(-240, Math.min(240, dy));

      return { dx, dy };
    }

    function wheelTick() {
      wheelRAF = 0;

      wheelPos += (wheelTarget - wheelPos) * WHEEL_EASE;
      if (!step || !Number.isFinite(step)) return;

      const shift = Math.trunc(wheelPos / step);
      if (shift !== 0) {
        index += shift;
        wheelPos -= shift * step;
        wheelTarget -= shift * step;
      }

      currentX = baseCenterOffset - index * step - wheelPos;
      applyTransform(currentX);

      setActiveForIndex(index);
      setDotsWheel(wheelPos);

      if (Math.abs(wheelTarget - wheelPos) > 0.25) {
        wheelRAF = requestAnimationFrame(wheelTick);
      }
    }

    function settleWheel() {
      if (wheelRAF) {
        cancelAnimationFrame(wheelRAF);
        wheelRAF = 0;
      }

      const move = Math.round(wheelPos / step);

      wheelTarget = 0;
      wheelPos = 0;

      if (move !== 0) index += move;

      animateToIndex(index, { doRebase: true });
    }

    function onWheel(e) {
      setTrackTransition(false);
      if (dragging) return;

      const { dx, dy } = normalizeWheelPx(e);

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      const isMostlyHorizontal = absX > absY * 1.15;
      const delta = isMostlyHorizontal ? dx : dy;

      if (!isMostlyHorizontal && absY > 0 && absX < 4) return;
      if (!step || !Number.isFinite(step)) return;

      e.preventDefault();

      cancelAnim();
      pending = 0;

      wheelTarget += delta * WHEEL_SENS;

      if (!wheelRAF) wheelRAF = requestAnimationFrame(wheelTick);

      clearTimeout(wheelSettleT);
      wheelSettleT = setTimeout(settleWheel, 160);
    }

    viewport.addEventListener("wheel", onWheel, { passive: false });
  })();
});
