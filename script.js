/* IMAGE ROTATOR */
function rotatingImage(id, images, interval = 3000) {
  let index = 0;
  const el = document.getElementById(id);

  setInterval(() => {
    index = (index + 1) % images.length;

    el.style.opacity = 0;

    setTimeout(() => {
      el.src = images[index];
      el.style.opacity = 1;
    }, 300);
  }, interval);
}

rotatingImage("what-photo", [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800"
]);

rotatingImage("about-photo", [
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800"
]);

/* TESTIMONIAL ROTATOR */
const testimonials = [
  "“Working with Stevie was an amazing experience.” – Sarah R.",
  "“Professional, kind, and incredibly talented.” – Jason M.",
  "“The photos capture exactly who we are. Perfect.” – The McKenzie Family"
];

let t = 0;
function rotateTestimonials() {
  const el = document.getElementById("testimonial-text");
  el.style.opacity = 0;

  setTimeout(() => {
    el.textContent = testimonials[t];
    el.style.opacity = 1;
    t = (t + 1) % testimonials.length;
  }, 300);
}

setInterval(rotateTestimonials, 3500);
rotateTestimonials();
