const THREE = window.THREE;
const OrbitControls = THREE ? THREE.OrbitControls : null;

const navButtons = Array.from(document.querySelectorAll("[data-to]"));
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const navLinksWrap = document.getElementById("nav-links");
const navIndicator = document.getElementById("nav-indicator");
const navMenuBtn = document.querySelector(".nav-menu-btn");
const sections = Array.from(document.querySelectorAll("section[id]"));
const reveals = Array.from(document.querySelectorAll(".reveal"));
const particlesRoot = document.getElementById("bg-particles");
const modal = document.getElementById("project-modal");
const modalTitle = document.getElementById("modal-title");
const thunderOverlay = document.getElementById("skill-thunder-overlay");
const skillsSection = document.getElementById("skills");

let lastY = window.scrollY || 0;
let scrollDirection = "down";
let scrollingTimer = null;
let navScrollFrame = 0;
let navIsAutoScrolling = false;

function safeInit(name, callback) {
  try {
    callback();
  } catch (error) {
    console.warn(`[init:${name}] skipped`, error);
  }
}

for (let i = 0; i < 20; i += 1) {
  const dot = document.createElement("span");
  dot.className = "bg-dot";
  dot.style.left = `${(i * 37) % 100}%`;
  dot.style.top = `${(i * 61) % 100}%`;
  dot.style.width = `${2 + (i % 3)}px`;
  dot.style.height = `${2 + (i % 3)}px`;
  dot.style.setProperty("--d", `${5 + (i % 5)}s`);
  dot.style.setProperty("--delay", `${(i % 8) * 0.38}s`);
  if (particlesRoot) particlesRoot.appendChild(dot);
}

function toTarget(hash) {
  const node = document.querySelector(hash);
  if (!node) return;

  const navShell = document.querySelector(".nav-shell");
  const navOffset = navShell ? Math.ceil(navShell.getBoundingClientRect().height + 18) : 0;
  const targetY = Math.max(0, window.scrollY + node.getBoundingClientRect().top - navOffset);
  const startY = window.scrollY || window.pageYOffset;
  const delta = targetY - startY;

  if (Math.abs(delta) < 2) {
    window.scrollTo(0, targetY);
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (navScrollFrame) cancelAnimationFrame(navScrollFrame);
    navScrollFrame = 0;
    navIsAutoScrolling = false;
    window.scrollTo({ top: targetY, behavior: "auto" });
    return;
  }

  if (navScrollFrame) cancelAnimationFrame(navScrollFrame);
  navScrollFrame = 0;
  navIsAutoScrolling = true;

  const duration = Math.min(760, Math.max(380, Math.abs(delta) * 0.45));
  const startTime = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    const y = startY + delta * ease(progress);
    window.scrollTo(0, y);
    if (progress < 1) {
      navScrollFrame = requestAnimationFrame(step);
    } else {
      navScrollFrame = 0;
      navIsAutoScrolling = false;
      setActiveNavLink(hash);
    }
  };

  navScrollFrame = requestAnimationFrame(step);
}

function moveNavIndicator(button) {
  const mobileNav = window.matchMedia("(max-width: 780px)").matches;
  if (mobileNav) {
    if (navIndicator) navIndicator.style.width = "0px";
    return;
  }
  if (!navLinksWrap || !navIndicator || !button) return;
  const wrapRect = navLinksWrap.getBoundingClientRect();
  const btnRect = button.getBoundingClientRect();
  const x = btnRect.left - wrapRect.left + navLinksWrap.scrollLeft;
  navIndicator.style.width = `${btnRect.width}px`;
  navIndicator.style.transform = `translateX(${x}px)`;
}

function setActiveNavLink(activeHash) {
  let activeButton = null;
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("data-to") === activeHash;
    link.classList.toggle("active", isActive);
    if (isActive) activeButton = link;
  });
  if (activeButton) moveNavIndicator(activeButton);
}

function paintRipple(button, event) {
  if (!button.classList.contains("nav-link")) return;
  const rect = button.getBoundingClientRect();
  const x = event && Number.isFinite(event.clientX) ? event.clientX - rect.left : rect.width / 2;
  const y = event && Number.isFinite(event.clientY) ? event.clientY - rect.top : rect.height / 2;
  button.style.setProperty("--ripple-x", `${x}px`);
  button.style.setProperty("--ripple-y", `${y}px`);
  button.classList.remove("ripple");
  void button.offsetWidth;
  button.classList.add("ripple");
}

function initBrandLogo() {
  const logo = document.querySelector(".brand.dev-brand");
  if (!logo) return;

  let particleTimer = 0;

  const spawnParticle = () => {
    const p = document.createElement("span");
    p.className = "dev-brand-particle";
    p.style.left = `${Math.random() * logo.clientWidth}px`;
    p.style.top = `${logo.clientHeight - 8}px`;
    p.style.setProperty("--x", `${(Math.random() - 0.5) * 58}px`);
    logo.appendChild(p);
    setTimeout(() => p.remove(), 1300);
  };

  logo.addEventListener("mousemove", (e) => {
    if (window.matchMedia("(max-width: 780px)").matches) return;
    const rect = logo.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 10;
    const rotateX = ((y / rect.height) - 0.5) * -10;
    logo.style.transform = `perspective(680px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-1px) scale(1.02)`;
  });

  logo.addEventListener("mouseenter", () => {
    if (window.matchMedia("(max-width: 780px)").matches) return;
    if (particleTimer) clearInterval(particleTimer);
    particleTimer = setInterval(spawnParticle, 95);
  });

  const reset = () => {
    logo.style.transform = "";
    if (particleTimer) clearInterval(particleTimer);
    particleTimer = 0;
  };

  logo.addEventListener("mouseleave", reset);
  logo.addEventListener("blur", reset);
}

navButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const target = button.getAttribute("data-to");
    if (button.classList.contains("nav-link")) {
      setActiveNavLink(target || "");
      paintRipple(button, event);
    }
    if (target) toTarget(target);
    if (window.matchMedia("(max-width: 780px)").matches && navLinksWrap && navLinksWrap.classList.contains("open")) {
      navLinksWrap.classList.remove("open");
      if (navMenuBtn) navMenuBtn.setAttribute("aria-expanded", "false");
    }
  });
});

if (navLinks.length) {
  navLinks.forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      button.style.setProperty("--ripple-x", `${event.clientX - rect.left}px`);
      button.style.setProperty("--ripple-y", `${event.clientY - rect.top}px`);
    });
  });
}

initBrandLogo();

if (navMenuBtn && navLinksWrap) {
  navMenuBtn.addEventListener("click", () => {
    const isOpen = navLinksWrap.classList.toggle("open");
    navMenuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 780px)").matches) {
        navLinksWrap.classList.remove("open");
        navMenuBtn.setAttribute("aria-expanded", "false");
      }
    });
  });
}

let ticking = false;
function updateActiveSection() {
  ticking = false;
  const navShell = document.querySelector(".nav-shell");
  const anchor = (navShell ? navShell.getBoundingClientRect().height : 0) + 84;
  let active = null;
  let fallback = null;
  let fallbackDistance = Infinity;

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= anchor && rect.bottom >= anchor) {
      active = `#${section.id}`;
      break;
    }
    const distance = Math.abs(rect.top - anchor);
    if (distance < fallbackDistance) {
      fallbackDistance = distance;
      fallback = `#${section.id}`;
    }
  }
  setActiveNavLink(active || fallback || "#home");
}

function onScroll() {
  const currentY = window.scrollY || 0;
  if (currentY > lastY) scrollDirection = "down";
  else if (currentY < lastY) scrollDirection = "up";
  lastY = currentY;

  document.body.classList.add("is-scrolling");
  if (scrollingTimer) clearTimeout(scrollingTimer);
  scrollingTimer = setTimeout(() => document.body.classList.remove("is-scrolling"), 180);

  if (navIsAutoScrolling || ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateActiveSection);
}

const cancelAutoScroll = () => {
  if (!navIsAutoScrolling || !navScrollFrame) return;
  cancelAnimationFrame(navScrollFrame);
  navScrollFrame = 0;
  navIsAutoScrolling = false;
  if (!ticking) {
    ticking = true;
    window.requestAnimationFrame(updateActiveSection);
  }
};

window.addEventListener("wheel", cancelAutoScroll, { passive: true });
window.addEventListener("touchstart", cancelAutoScroll, { passive: true });
window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
    cancelAutoScroll();
  }
});

window.addEventListener("scroll", onScroll, { passive: true });
updateActiveSection();
window.addEventListener(
  "resize",
  () => {
    if (window.matchMedia("(max-width: 780px)").matches) {
      if (navIndicator) navIndicator.style.width = "0px";
      return;
    }
    if (navLinksWrap) navLinksWrap.classList.remove("open");
    if (navMenuBtn) navMenuBtn.setAttribute("aria-expanded", "false");
    const activeLink = navLinks.find((link) => link.classList.contains("active")) || navLinks[0];
    if (activeLink) moveNavIndicator(activeLink);
  },
  { passive: true }
);
if (navLinksWrap) {
  navLinksWrap.addEventListener(
    "scroll",
    () => {
      const activeLink = navLinks.find((link) => link.classList.contains("active"));
      if (activeLink) moveNavIndicator(activeLink);
    },
    { passive: true }
  );
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
        }
      }
    },
    { threshold: 0.2 }
  );
  reveals.forEach((node) => revealObserver.observe(node));
} else {
  reveals.forEach((node) => node.classList.add("in"));
}

setTimeout(() => {
  reveals.forEach((node) => node.classList.add("in"));
}, 1300);

if ("IntersectionObserver" in window && skillsSection && thunderOverlay) {
  let thunderLock = false;
  const thunderObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry || !entry.isIntersecting || scrollDirection !== "down" || thunderLock) return;
      thunderLock = true;
      thunderOverlay.classList.remove("active");
      void thunderOverlay.offsetWidth;
      thunderOverlay.classList.add("active");
      setTimeout(() => {
        thunderOverlay.classList.remove("active");
        thunderLock = false;
      }, 1300);
    },
    { threshold: 0.35 }
  );
  thunderObserver.observe(skillsSection);
}

function initHeroParticles() {
  const canvas = document.getElementById("hero-particle-canvas");
  const wrapper = canvas ? canvas.closest(".hero-visual") : null;
  const fallbackName = wrapper ? wrapper.querySelector(".name-mark-overlay") : null;
  if (!canvas || !wrapper) return;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    wrapper.classList.add("fallback");
    return;
  }

  let width = 0;
  let height = 0;
  let particles = [];
  let targetText = "Wajd Dev";
  let animationFrame = 0;
  const mouse = { x: null, y: null, radius: 95, active: false };
  const sampleCanvas = document.createElement("canvas");
  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!sampleCtx) {
    wrapper.classList.add("fallback");
    return;
  }

  class Particle {
    constructor(x, y) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.baseX = x;
      this.baseY = y;
      this.size = Math.random() * 2.3 + 1.4;
      this.density = Math.random() * 32 + 8;
      this.vx = 0;
      this.vy = 0;
    }

    setTarget(x, y) {
      this.baseX = x;
      this.baseY = y;
    }

    update() {
      if (mouse.active && mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          this.vx -= (dx / distance) * force * this.density;
          this.vy -= (dy / distance) * force * this.density;
        }
      }

      this.vx += (this.baseX - this.x) * 0.018;
      this.vy += (this.baseY - this.y) * 0.018;
      this.vx *= 0.86;
      this.vy *= 0.86;
      this.x += this.vx;
      this.y += this.vy;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.shadowColor = "rgba(255,255,255,0.8)";
      ctx.shadowBlur = 14;
      ctx.fill();
    }
  }

  function getTextPoints(text) {
    sampleCtx.clearRect(0, 0, width, height);
    const compact = window.innerWidth <= 780;
    const fontSize = Math.min(width / (compact ? 3.4 : 4.2), compact ? 78 : 96);
    sampleCtx.font = `900 ${fontSize}px Arial, sans-serif`;
    sampleCtx.textAlign = "center";
    sampleCtx.textBaseline = "middle";
    sampleCtx.fillStyle = "#fff";
    sampleCtx.fillText(text, width / 2, height / 2);

    const data = sampleCtx.getImageData(0, 0, width, height);
    const points = [];
    const gap = window.innerWidth <= 780 ? 5 : 4;
    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const i = (y * width + x) * 4;
        if (data.data[i + 3] > 128) points.push({ x, y });
      }
    }
    sampleCtx.clearRect(0, 0, width, height);
    return points;
  }

  function createParticles(text) {
    const points = getTextPoints(text);
    wrapper.classList.toggle("fallback", points.length < 120);
    if (fallbackName) {
      fallbackName.textContent = text;
      fallbackName.style.opacity = points.length < 120 ? "1" : "0";
    }
    const next = [];
    for (let i = 0; i < points.length; i += 1) {
      if (particles[i]) {
        particles[i].setTarget(points[i].x, points[i].y);
        next.push(particles[i]);
      } else {
        next.push(new Particle(points[i].x, points[i].y));
      }
    }
    particles = next;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const compact = window.innerWidth <= 780;
    width = Math.max(compact ? 220 : 320, Math.floor(rect.width));
    height = Math.max(compact ? 170 : 220, Math.floor(rect.height));
    mouse.radius = compact ? 78 : 95;
    canvas.width = width;
    canvas.height = height;
    sampleCanvas.width = width;
    sampleCanvas.height = height;
    createParticles(targetText);
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.update();
      p.draw();
    }
    animationFrame = requestAnimationFrame(animate);
  }

  function pointerMove(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = clientX - rect.left;
    mouse.y = clientY - rect.top;
    mouse.active = true;
    if (targetText !== "Hello!") {
      targetText = "Hello!";
      createParticles(targetText);
    }
  }

  function handleLeave() {
    mouse.active = false;
    mouse.x = null;
    mouse.y = null;
    if (targetText !== "Wajd Dev") {
      targetText = "Wajd Dev";
      createParticles(targetText);
    }
  }

  const handleMouseMove = (e) => pointerMove(e.clientX, e.clientY);
  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    if (touch) pointerMove(touch.clientX, touch.clientY);
  };

  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseleave", handleLeave);
  canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
  canvas.addEventListener("touchend", handleLeave);
  window.addEventListener("resize", resize);

  if (fallbackName) fallbackName.textContent = targetText;
  resize();
  animate();
  createParticles(targetText);
  setTimeout(() => createParticles(targetText), 120);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => createParticles(targetText)).catch(() => {});
  }

  window.addEventListener(
    "beforeunload",
    () => {
      cancelAnimationFrame(animationFrame);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleLeave);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleLeave);
      window.removeEventListener("resize", resize);
    },
    { once: true }
  );
}

function initInteractiveTitles() {
  const interactiveNodes = Array.from(
    document.querySelectorAll(".interactive-title, #contact .interactive-copy, #about .interactive-copy")
  );
  if (!interactiveNodes.length) return;

  const state = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
  let rafId = 0;

  function apply() {
    for (const el of interactiveNodes) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = state.x - cx;
      const dy = state.y - cy;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const isTitle = el.classList.contains("interactive-title");
      const influence = Math.max(0, 1 - dist / (isTitle ? 420 : 360));

      const tx = Math.max(-8, Math.min(8, dx * (isTitle ? 0.03 : 0.02) * influence));
      const ty = Math.max(-5, Math.min(5, dy * (isTitle ? 0.02 : 0.015) * influence));
      const rx = Math.max(-5, Math.min(5, -dy * (isTitle ? 0.02 : 0.012) * influence));
      const ry = Math.max(-7, Math.min(7, dx * (isTitle ? 0.02 : 0.012) * influence));
      const glow = (isTitle ? 0.08 : 0.04) + influence * (isTitle ? 0.3 : 0.18);

      el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      el.style.textShadow = `0 6px 18px rgba(255,255,255,${glow.toFixed(3)})`;
    }
    rafId = 0;
  }

  function schedule(clientX, clientY) {
    state.x = clientX;
    state.y = clientY;
    if (!rafId) rafId = requestAnimationFrame(apply);
  }

  window.addEventListener("mousemove", (e) => schedule(e.clientX, e.clientY), { passive: true });
  window.addEventListener(
    "touchmove",
    (e) => {
      const touch = e.touches && e.touches[0];
      if (touch) schedule(touch.clientX, touch.clientY);
    },
    { passive: true }
  );
  window.addEventListener(
    "scroll",
    () => {
      if (!rafId) rafId = requestAnimationFrame(apply);
    },
    { passive: true }
  );

  apply();
}

function initInteractiveTiltBox(selector, options = {}) {
  const box = document.querySelector(selector);
  if (!box) return;

  const {
    xVar = "--cbx",
    yVar = "--cby",
    hoverClass = "is-hovered",
    perspective = 900,
    rotateXStrength = 5,
    rotateYStrength = 7,
    enableTilt = true,
  } = options;

  let rafId = 0;
  const state = {
    rx: 0,
    ry: 0,
    cx: 50,
    cy: 50,
    hover: false,
  };

  function apply() {
    box.style.setProperty(xVar, `${state.cx.toFixed(1)}%`);
    box.style.setProperty(yVar, `${state.cy.toFixed(1)}%`);
    box.style.transform = enableTilt
      ? `perspective(${perspective}px) rotateX(${state.rx.toFixed(2)}deg) rotateY(${state.ry.toFixed(2)}deg)`
      : "none";
    box.classList.toggle(hoverClass, state.hover);
    rafId = 0;
  }

  function schedule() {
    if (!rafId) rafId = requestAnimationFrame(apply);
  }

  function updateFromPointer(clientX, clientY) {
    const rect = box.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const nx = rect.width ? x / rect.width : 0.5;
    const ny = rect.height ? y / rect.height : 0.5;
    state.cx = nx * 100;
    state.cy = ny * 100;
    state.ry = (nx - 0.5) * rotateYStrength;
    state.rx = (0.5 - ny) * rotateXStrength;
    schedule();
  }

  box.addEventListener("pointerenter", () => {
    state.hover = true;
    schedule();
  });

  box.addEventListener("pointermove", (e) => {
    state.hover = true;
    updateFromPointer(e.clientX, e.clientY);
  });

  box.addEventListener("pointerleave", () => {
    state.hover = false;
    state.rx = 0;
    state.ry = 0;
    state.cx = 50;
    state.cy = 50;
    schedule();
  });

  box.addEventListener(
    "touchmove",
    (e) => {
      const touch = e.touches && e.touches[0];
      if (!touch) return;
      state.hover = true;
      updateFromPointer(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  box.addEventListener("touchend", () => {
    state.hover = false;
    state.rx = 0;
    state.ry = 0;
    state.cx = 50;
    state.cy = 50;
    schedule();
  });

  apply();
}

function initInteractiveContactBox() {
  initInteractiveTiltBox("#contact .contact-box", {
    xVar: "--cbx",
    yVar: "--cby",
    hoverClass: "is-hovered",
    perspective: 900,
    rotateXStrength: 5,
    rotateYStrength: 7,
  });
}

function initInteractiveAboutBox() {
  initInteractiveTiltBox("#about .about-card", {
    xVar: "--abx",
    yVar: "--aby",
    hoverClass: "is-hovered-about",
    perspective: 1000,
    rotateXStrength: 4.5,
    rotateYStrength: 6.5,
    enableTilt: false,
  });
}

function initInteractiveField() {
  const canvas = document.getElementById("interactive-field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const root = document.documentElement;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  const mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    tx: window.innerWidth / 2,
    ty: window.innerHeight / 2,
  };

  const rand = (min, max) => Math.random() * (max - min) + min;

  function seed() {
    const count = Math.floor(Math.min(180, Math.max(90, (width * height) / 9500)));
    particles = Array.from({ length: count }, () => ({
      x: rand(0, width),
      y: rand(0, height),
      vx: rand(-0.2, 0.2),
      vy: rand(-0.2, 0.2),
      r: rand(0.65, 1.9),
      a: rand(0.2, 0.7),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.001, 0.006),
      link: Math.random() > 0.76,
    }));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function setPointer(x, y) {
    mouse.tx = x;
    mouse.ty = y;
    root.style.setProperty("--mx", `${x}px`);
    root.style.setProperty("--my", `${y}px`);
  }

  function onPointerMove(e) {
    setPointer(e.clientX, e.clientY);
  }

  function onTouchMove(e) {
    const touch = e.touches[0];
    if (touch) setPointer(touch.clientX, touch.clientY);
  }

  function draw(t) {
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    const glow = ctx.createRadialGradient(
      mouse.x,
      mouse.y,
      0,
      mouse.x,
      mouse.y,
      Math.min(width, height) * 0.28
    );
    glow.addColorStop(0, "rgba(255,255,255,.11)");
    glow.addColorStop(0.22, "rgba(255,255,255,.055)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    for (const p of particles) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.hypot(dx, dy) || 1;
      const force = Math.max(0, 1 - dist / 240);
      const angle = Math.atan2(dy, dx) + Math.sin(t * p.speed + p.phase) * 0.7;

      p.vx += Math.cos(angle) * force * 0.08;
      p.vy += Math.sin(angle) * force * 0.08;
      p.vx += Math.cos(t * p.speed + p.phase) * 0.006;
      p.vy += Math.sin(t * p.speed + p.phase) * 0.006;

      p.vx *= 0.965;
      p.vy *= 0.965;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      const pulse = 0.55 + Math.sin(t * p.speed * 5 + p.phase) * 0.45;
      const alpha = p.a * (0.34 + force * 1.2 + pulse * 0.24);

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(p.x, p.y, p.r + force * 2.2, 0, Math.PI * 2);
      ctx.fill();

      if (p.link && dist < 220) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(210,225,255,${force * 0.12})`;
        ctx.lineWidth = 1;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(draw);
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("resize", resize);

  setPointer(window.innerWidth * 0.5, window.innerHeight * 0.45);
  resize();
  requestAnimationFrame(draw);

  window.addEventListener(
    "beforeunload",
    () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", resize);
    },
    { once: true }
  );
}

function initGlobe() {
  const canvas = document.getElementById("globe-canvas");
  const popupEl = document.getElementById("map-popup");
  const highlightEl = document.getElementById("map-highlight");
  const coordsEl = document.getElementById("map-coords");
  if (!canvas || !popupEl || !highlightEl || !coordsEl || !THREE || !OrbitControls) return;

  const scene = new THREE.Scene();
  const raycaster = new THREE.Raycaster();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.z = 3;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
  } catch (_error) {
    return;
  }

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  scene.add(sphere);

  const sphereRim = new THREE.Mesh(
    new THREE.SphereGeometry(1.006, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.055,
      side: THREE.BackSide,
    })
  );
  scene.add(sphereRim);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.62;
  controls.rotateSpeed = 1.8;
  controls.minPolarAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 2;

  function latLonToXYZ(lon, lat, radius = 1) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -Math.sin(phi) * Math.cos(theta) * radius;
    const y = Math.cos(phi) * radius;
    const z = Math.sin(phi) * Math.sin(theta) * radius;
    return new THREE.Vector3(x, y, z);
  }

  function lonSpanDeg(lons) {
    const norm = lons
      .map((lon) => (((lon + 180) % 360) + 360) % 360 - 180)
      .sort((a, b) => a - b);
    let maxGap = -Infinity;
    for (let i = 1; i < norm.length; i += 1) maxGap = Math.max(maxGap, norm[i] - norm[i - 1]);
    maxGap = Math.max(maxGap, norm[0] + 360 - norm[norm.length - 1]);
    return Math.min(norm[norm.length - 1] - norm[0], 360 - maxGap);
  }

  function polygonExtentScore(rings) {
    if (!rings || !rings.length) return 0;
    const outer = rings[0];
    const lats = outer.map((p) => p[1]);
    const lons = outer.map((p) => p[0]);
    const latSpan = Math.max(...lats) - Math.min(...lats);
    const lonSpan = lonSpanDeg(lons);
    return Math.max(latSpan, lonSpan);
  }

  function computeRingCentroidLonLat(ring) {
    let sumLon = 0;
    let sumLat = 0;
    const n = ring.length || 1;
    for (let i = 0; i < n; i += 1) {
      sumLon += ring[i][0];
      sumLat += ring[i][1];
    }
    return { lon: sumLon / n, lat: sumLat / n };
  }

  function drawContour(ring, color = 0xffffff) {
    const pts = ring.map(([lon, lat]) => latLonToXYZ(lon, lat, 1.001));
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.98 });
    const loop = new THREE.LineLoop(geometry, material);
    scene.add(loop);
  }

  function drawContinentFeature(feat) {
    if (!feat.geometry) return;
    const { type, coordinates } = feat.geometry;
    const processPoly = (rings) => {
      if (polygonExtentScore(rings) < 2.0) return;
      drawContour(rings[0], 0xffffff);
    };
    if (type === "Polygon") processPoly(coordinates);
    else if (type === "MultiPolygon") coordinates.forEach(processPoly);
  }

  function featureName(feat) {
    const p = feat.properties || {};
    return (p.ADMIN || p.ADMIN_EN || p.name || p.NAME || p.name_en || p.NAME_LONG || "")
      .toString()
      .toLowerCase();
  }

  let lebanonCentroid = { lon: 35.8623, lat: 33.8547 };
  let lebanonMesh = null;

  function addFilledCountry(feature, fillColor = 0xffffff, radius = 1.002) {
    const type = feature.geometry.type;
    const coords = feature.geometry.coordinates;
    const polys = type === "Polygon" ? [coords] : coords.slice();
    const largePolys = polys.filter((rings) => polygonExtentScore(rings) >= 0.25);
    const targetPolys = largePolys.length ? largePolys : polys;

    let best = targetPolys[0];
    let bestScore = polygonExtentScore(best);
    for (let i = 1; i < targetPolys.length; i += 1) {
      const score = polygonExtentScore(targetPolys[i]);
      if (score > bestScore) {
        best = targetPolys[i];
        bestScore = score;
      }
    }

    lebanonCentroid = computeRingCentroidLonLat(best[0]);
    const outer = best[0].map(([lon, lat]) => new THREE.Vector2(lon, lat));
    const shape = new THREE.Shape(outer);
    const shapeGeo = new THREE.ShapeGeometry(shape);
    const pos = shapeGeo.attributes.position;

    for (let i = 0; i < pos.count; i += 1) {
      const lon = pos.getX(i);
      const lat = pos.getY(i);
      const p3 = latLonToXYZ(lon, lat, radius);
      pos.setXYZ(i, p3.x, p3.y, p3.z);
    }

    shapeGeo.computeVertexNormals();
    const mat = new THREE.MeshBasicMaterial({
      color: fillColor,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: true,
    });

    lebanonMesh = new THREE.Mesh(shapeGeo, mat);
    lebanonMesh.renderOrder = 2;
    scene.add(lebanonMesh);
  }

  function worldToCanvasPos(vec3) {
    const v = vec3.clone().project(camera);
    const rect = canvas.getBoundingClientRect();
    const x = ((v.x + 1) / 2) * rect.width;
    const y = ((-v.y + 1) / 2) * rect.height;
    return { x, y };
  }

  function isPointVisible(worldPoint, occluder = sphere) {
    const camForward = new THREE.Vector3();
    camera.getWorldDirection(camForward);
    const toPoint = worldPoint.clone().sub(camera.position);
    const distToPoint = toPoint.length();
    const toPointDir = toPoint.clone().normalize();
    if (camForward.dot(toPointDir) <= 0) return false;
    const ndc = worldPoint.clone().project(camera);
    if (Math.abs(ndc.x) > 1.05 || Math.abs(ndc.y) > 1.05 || ndc.z < -1 || ndc.z > 1) return false;
    raycaster.set(camera.position, toPointDir);
    const intersects = raycaster.intersectObject(occluder, true);
    if (intersects.length > 0 && intersects[0].distance + 1e-4 < distToPoint) return false;
    return true;
  }

  function setPopupVisible(visible) {
    popupEl.style.opacity = visible ? "1" : "0";
    highlightEl.style.opacity = visible ? "1" : "0";
  }

  function updatePopupPositionAndVisibility() {
    if (!lebanonCentroid) return;
    const worldPos = latLonToXYZ(lebanonCentroid.lon, lebanonCentroid.lat, 1.01);
    const visible = isPointVisible(worldPos);
    if (lebanonMesh) lebanonMesh.visible = visible;
    if (!visible) {
      setPopupVisible(false);
      return;
    }

    const screen = worldToCanvasPos(worldPos);
    const popupW = popupEl.offsetWidth || 180;
    const popupH = popupEl.offsetHeight || 58;
    const rect = canvas.getBoundingClientRect();
    const padding = 8;
    const desiredLeft = screen.x + 20;
    const desiredTop = screen.y - popupH - 12;
    const clampedLeft = Math.max(padding, Math.min(rect.width - popupW - padding, desiredLeft));
    const clampedTop = Math.max(padding, Math.min(rect.height - popupH - padding, desiredTop));

    highlightEl.style.left = `${screen.x}px`;
    highlightEl.style.top = `${screen.y}px`;
    popupEl.style.left = `${clampedLeft}px`;
    popupEl.style.top = `${clampedTop}px`;
    coordsEl.textContent = `Lat: ${lebanonCentroid.lat.toFixed(3)}, Lon: ${lebanonCentroid.lon.toFixed(3)}`;
    setPopupVisible(true);
  }

  function resizeRendererToDisplaySize() {
    const width = Math.max(1, canvas.clientWidth || 520);
    const height = Math.max(1, canvas.clientHeight || 420);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    const needResize =
      canvas.width !== Math.floor(width * pixelRatio) ||
      canvas.height !== Math.floor(height * pixelRatio);
    if (needResize) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  async function loadGlobeData() {
    try {
      const [continentsResp, worldResp] = await Promise.all([
        fetch("https://gist.githubusercontent.com/hrbrmstr/91ea5cc9474286c72838/raw/continents.json"),
        fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
      ]);
      const continentsGeo = await continentsResp.json();
      const worldData = await worldResp.json();

      continentsGeo.features.forEach(drawContinentFeature);
      const lebanonFeature = worldData.features.find((f) => featureName(f).includes("lebanon"));
      if (lebanonFeature) {
        addFilledCountry(lebanonFeature, 0xffffff, 1.002);
      }

      const targetVec = latLonToXYZ(lebanonCentroid.lon, lebanonCentroid.lat, 1.0);
      const camDist = camera.position.length();
      camera.position.copy(targetVec.clone().normalize().multiplyScalar(camDist));
      camera.lookAt(0, 0, 0);
      controls.update();
      updatePopupPositionAndVisibility();
    } catch (_error) {
      setPopupVisible(false);
    }
  }

  let frameId = null;
  let lastFrameTime = 0;
  function animate(now = 0) {
    frameId = requestAnimationFrame(animate);
    if (now - lastFrameTime < 33) return;
    lastFrameTime = now;
    resizeRendererToDisplaySize();
    controls.update();
    updatePopupPositionAndVisibility();
    renderer.render(scene, camera);
  }

  resizeRendererToDisplaySize();
  loadGlobeData();
  animate();

  window.addEventListener("resize", resizeRendererToDisplaySize);
  window.addEventListener("beforeunload", () => {
    if (frameId) cancelAnimationFrame(frameId);
    controls.dispose();
    renderer.dispose();
  });
}

function initAboutParticles() {
  const canvas = document.getElementById("about-particles-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let animationFrame = 0;

  const particles = Array.from({ length: 72 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 2.1 + 0.7,
    vx: (Math.random() - 0.5) * 0.0009,
    vy: (Math.random() - 0.5) * 0.0009,
    a: Math.random() * 0.45 + 0.2,
  }));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      10,
      width / 2,
      height / 2,
      Math.min(width, height) / 1.1
    );
    gradient.addColorStop(0, "rgba(255,255,255,0.09)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.035)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;

      const x = p.x * width;
      const y = p.y * height;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.a})`;
      ctx.shadowColor = "rgba(255,255,255,0.75)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const ax = particles[i].x * width;
        const ay = particles[i].y * height;
        const bx = particles[j].x * width;
        const by = particles[j].y * height;
        const dist = Math.hypot(ax - bx, ay - by);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = `rgba(255,255,255,${0.095 * (1 - dist / 90)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    animationFrame = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(animationFrame), { once: true });
}

const yearNow = document.getElementById("year-now");
if (yearNow) yearNow.textContent = String(new Date().getFullYear());

const projectsData = [
  {
    id: 1,
    category: "websites",
    title: "SMM Panel Platform",
    subtitle: "Full website with dashboard, orders, services, and backend logic.",
    description:
      "A complete SMM panel system with a modern dashboard, service listing, order creation, user balance logic, admin tools, and backend database integration. Built to handle real user flows and scalable service management.",
    languages: ["PHP", "MySQL", "JavaScript", "HTML", "CSS"],
    status: "Built",
    thumbnail: "SMM",
    links: [
      { label: "Preview", href: "#" },
      { label: "Case Study", href: "#" },
    ],
  },
  {
    id: 2,
    category: "websites",
    title: "Portfolio Website",
    subtitle: "Premium black and white developer portfolio with animations.",
    description:
      "A modern portfolio website with metallic glass UI, animated hero, smooth navigation, section transitions, particle effects, and responsive design. Built to present projects, skills, contact links, and personal identity with a clean premium aesthetic.",
    languages: ["React", "Tailwind", "Framer Motion"],
    status: "Active",
    thumbnail: "WEB",
    links: [{ label: "Website", href: "#" }],
  },
  {
    id: 3,
    category: "mobile",
    title: "Ecommerce Android App",
    subtitle: "Android shop app with PHP backend and database flows.",
    description:
      "A mobile ecommerce application built with Kotlin and connected to a PHP backend. Includes product browsing, cart flow, backend endpoints, database integration, and app-to-server communication logic.",
    languages: ["Kotlin", "PHP", "MySQL", "API"],
    status: "Built",
    thumbnail: "APP",
    links: [{ label: "Details", href: "#" }],
  },
  {
    id: 4,
    category: "bots",
    title: "Advanced Telegram Bot System",
    subtitle: "Inline buttons, admin panel, database, and automation.",
    description:
      "A Telegram bot system with inline keyboard flows, user management, admin controls, database storage, broadcast tools, and automation logic. Designed for real users and structured bot interactions.",
    languages: ["Python", "Telebot", "SQLite", "API"],
    status: "Built",
    thumbnail: "BOT",
    links: [{ label: "Bot Demo", href: "#" }],
  },
  {
    id: 5,
    category: "bots",
    title: "Trading Automation Bot",
    subtitle: "Telegram trading flow with wallet, profiles, and control panels.",
    description:
      "A Telegram-based trading automation system with wallet flows, user profiles, history, team structure, settings, and admin logic. Built with strong focus on user flow, menu structure, and backend state handling.",
    languages: ["PHP", "MySQL", "Telegram API"],
    status: "In Progress",
    thumbnail: "AI",
    links: [{ label: "Architecture", href: "#" }],
  },
  {
    id: 6,
    category: "tools",
    title: "Terminal Automation Tools",
    subtitle: "CLI tools for workflows, parsing, and repetitive tasks.",
    description:
      "A collection of terminal-based tools and scripts built to automate repetitive tasks, parse responses, process files, manage workflows, and speed up development operations on Linux and VPS environments.",
    languages: ["Python", "Bash", "Linux"],
    status: "Built",
    thumbnail: "CLI",
    links: [{ label: "Repo", href: "#" }],
  },
  {
    id: 7,
    category: "tools",
    title: "Web Scraping Engine",
    subtitle: "Automation and data extraction with structured output.",
    description:
      "A scraping and automation workflow built for extracting structured data from websites, handling errors, normalizing outputs, and preparing data for use inside dashboards, bots, or APIs.",
    languages: ["Python", "Requests", "Automation"],
    status: "Built",
    thumbnail: "SCAN",
    links: [{ label: "Overview", href: "#" }],
  },
  {
    id: 8,
    category: "apis",
    title: "PHP API Endpoints",
    subtitle: "Backend endpoints for apps, bots, and panels.",
    description:
      "Custom PHP API endpoints for mobile apps, dashboards, bots, and backend systems. Includes request handling, database queries, authentication-style flows, JSON responses, and production-style error handling.",
    languages: ["PHP", "MySQL", "JSON", "cURL"],
    status: "Built",
    thumbnail: "API",
    links: [{ label: "Docs", href: "#" }],
  },
];

const programmingSkills = [
  { name: "Python", level: 96, icon: "python", detail: "Expert - automation, scraping, bots" },
  { name: "PHP", level: 95, icon: "php", detail: "Expert - APIs, panels, backends" },
  { name: "SQL", level: 94, icon: "sql", detail: "Expert - MySQL, SQLite, queries" },
  { name: "HTML / CSS", level: 90, icon: "htmlcss", detail: "Very good - responsive UI" },
  { name: "JavaScript", level: 88, icon: "javascript", detail: "Very good - frontend logic" },
  { name: "Kotlin", level: 87, icon: "kotlin", detail: "Very good - Android apps" },
  { name: "API Integration", level: 88, icon: "api", detail: "Very good - web APIs" },
  { name: "Java", level: 65, icon: "java", detail: "Medium - OOP foundations" },
  { name: "Node.js", level: 65, icon: "node", detail: "Medium - server runtime" },
  { name: "Networks", level: 62, icon: "network", detail: "Medium - fundamentals and tools" },
  { name: "C++", level: 42, icon: "cpu", detail: "Low - basic syntax and logic" },
  { name: "Dart / Flutter", level: 35, icon: "flutter", detail: "Learning - mobile UI" },
];

const skillGroups = [
  {
    title: "Senior Telegram Bot Developer",
    icon: "bot",
    text: "Advanced bots with admin panels, inline keyboards, databases, automation, and real user flows.",
  },
  {
    title: "Senior Web Scraper",
    icon: "search",
    text: "Scraping systems, browser automation, data extraction, anti-error logic, and structured outputs.",
  },
  {
    title: "Full-Stack Web Development",
    icon: "layers",
    text: "React, Tailwind CSS, PHP backends, SQL databases, dashboards, APIs, and modern UI systems.",
  },
  {
    title: "Backend & API Systems",
    icon: "server",
    text: "Custom endpoints, API integrations, authentication flows, panels, database logic, and server-side features.",
  },
  {
    title: "Automation Maker",
    icon: "zap",
    text: "Terminal tools, scripts, scheduled jobs, bot workflows, data processors, and productivity systems.",
  },
  {
    title: "Ethical Security Research",
    icon: "shield",
    text: "Security labs and real-world learning, used for ethical testing, hardening, and awareness.",
  },
  {
    title: "Linux & VPS Operations",
    icon: "terminal",
    text: "Deployments, process management, server setup, command-line workflows, and troubleshooting.",
  },
  {
    title: "Prompt Engineering",
    icon: "brain",
    text: "Started early in 2023, building prompts, AI workflows, agents, and structured automation logic.",
  },
  {
    title: "Mobile App Development",
    icon: "phone",
    text: "Android apps with Kotlin, PHP backends, ecommerce flows, and app-to-server communication.",
  },
];

const projectCards = [
  { label: "SMM Panels", value: "Full websites", icon: "globe" },
  { label: "Ecommerce", value: "Android + Backend", icon: "cart" },
  { label: "Telegram Bots", value: "Advanced systems", icon: "bot" },
  { label: "Terminal Tools", value: "Automation CLI", icon: "terminal" },
  { label: "Websites", value: "Many projects", icon: "layers" },
  { label: "Security Labs", value: "Ethical usage", icon: "lock" },
];

const toolStack = [
  "React",
  "Tailwind CSS",
  "PHP",
  "MySQL",
  "SQLite",
  "Node.js",
  "Linux",
  "Telegram APIs",
  "Web APIs",
  "Kotlin",
  "Python",
  "Automation",
];

const speakingLanguages = [
  { name: "Arabic", level: "Native" },
  { name: "English", level: "Good" },
  { name: "French", level: "Good / Learning" },
  { name: "German", level: "Soon" },
];

const frameworks = [
  {
    name: "React",
    icon: "javascript",
    level: "Very good",
    text: "Component architecture, sections, effects, and modern UI.",
  },
  {
    name: "Tailwind CSS",
    icon: "htmlcss",
    level: "Very good",
    text: "Responsive layouts, glass effects, animations, and clean design systems.",
  },
  {
    name: "Node.js",
    icon: "node",
    level: "Medium",
    text: "APIs, server scripts, tooling, and backend runtime basics.",
  },
  {
    name: "PHP Backend",
    icon: "php",
    level: "Expert",
    text: "Dashboards, endpoints, MySQL flows, auth, and backend systems.",
  },
  {
    name: "Kotlin Android",
    icon: "kotlin",
    level: "Very good",
    text: "Android apps, ecommerce flows, and app-to-backend communication.",
  },
  {
    name: "Flutter",
    icon: "flutter",
    level: "Learning",
    text: "Currently learning Dart and Flutter for cross-platform apps.",
  },
];

function techIcon(type = "code") {
  const wrap = (body) => `
    <span class="tech-icon tech-${type}">
      <svg viewBox="0 0 64 64" aria-hidden="true">${body}</svg>
    </span>
  `;

  switch (type) {
    case "python":
      return wrap('<path d="M16 35 C16 22,27 22,32 22 L40 22 C45 22,48 18,44 14 C39 9,25 9,21 14 C18 17,20 22,24 22 L30 22" /><path d="M48 29 C48 42,37 42,32 42 L24 42 C19 42,16 46,20 50 C25 55,39 55,43 50 C46 47,44 42,40 42 L34 42" /><circle cx="39" cy="16" r="2.2" class="fill-dot a" /><circle cx="25" cy="48" r="2.2" class="fill-dot b" />');
    case "php":
      return wrap('<ellipse cx="32" cy="32" rx="27" ry="16" /><text x="32" y="38" text-anchor="middle" font-size="16" font-weight="900">PHP</text>');
    case "sql":
      return wrap('<ellipse cx="32" cy="17" rx="21" ry="9" /><path d="M11 17 V45 C11 50 20 55 32 55 C44 55 53 50 53 45 V17" /><path d="M11 31 C11 36 20 41 32 41 C44 41 53 36 53 31" class="thin" />');
    case "htmlcss":
      return wrap('<path d="M25 18 L13 32 L25 46" /><path d="M39 18 L51 32 L39 46" /><path d="M35 15 L29 49" />');
    case "javascript":
      return wrap('<rect x="12" y="12" width="40" height="40" rx="9" /><text x="32" y="39" text-anchor="middle" font-size="17" font-weight="900">JS</text>');
    case "kotlin":
      return wrap('<path d="M14 12 H50 L32 32 L50 52 H14 Z" /><path d="M14 52 L50 12" class="thin" />');
    case "api":
      return wrap('<circle cx="17" cy="32" r="7" /><circle cx="47" cy="18" r="7" /><circle cx="47" cy="46" r="7" /><path d="M24 30 L40 21 M24 34 L40 43" />');
    case "java":
      return wrap('<path d="M20 31 H46 L42 50 H24 Z" /><path d="M46 35 H52 C56 35 56 43 47 43" /><path d="M25 22 C20 16,34 14,30 7 M36 22 C31 16,45 14,41 7" class="thin" />');
    case "node":
      return wrap('<path d="M32 8 L53 20 V44 L32 56 L11 44 V20 Z" /><text x="32" y="38" text-anchor="middle" font-size="14" font-weight="900">N</text>');
    case "flutter":
      return wrap('<path d="M41 9 L15 35 L25 45 L51 19 Z" /><path d="M28 48 L39 59 L52 46 L41 35 Z" />');
    case "bot":
      return wrap('<rect x="16" y="18" width="32" height="26" rx="8" /><path d="M32 18 V10" /><circle cx="26" cy="30" r="2.5" class="fill-dot a" /><circle cx="38" cy="30" r="2.5" class="fill-dot b" /><path d="M24 39 H40" />');
    case "search":
      return wrap('<circle cx="28" cy="28" r="14" /><path d="M39 39 L51 51" /><path d="M19 28 H37" class="thin" />');
    case "layers":
      return wrap('<path d="M32 12 L12 24 L32 36 L52 24 Z" /><path d="M16 34 L32 44 L48 34" /><path d="M16 44 L32 54 L48 44" />');
    case "server":
      return wrap('<rect x="14" y="14" width="36" height="14" rx="4" /><rect x="14" y="36" width="36" height="14" rx="4" /><circle cx="22" cy="21" r="2" class="fill-dot a" /><circle cx="22" cy="43" r="2" class="fill-dot b" />');
    case "zap":
      return wrap('<path d="M34 8 L18 33 H30 L24 56 L46 28 H34 L40 8 Z" />');
    case "shield":
      return wrap('<path d="M32 10 L49 16 V28 C49 40 41 49 32 54 C23 49 15 40 15 28 V16 Z" /><path d="M24 31 L29 36 L40 25" />');
    case "terminal":
      return wrap('<rect x="10" y="14" width="44" height="36" rx="6" /><path d="M20 26 L28 32 L20 38" /><path d="M32 38 H42" />');
    case "brain":
      return wrap('<path d="M24 18 C24 12 30 10 34 13 C37 8 45 11 45 18 C51 18 53 25 49 29 C54 33 52 42 45 43 C44 50 36 52 32 48 C28 52 20 50 19 43 C12 42 10 33 15 29 C11 25 13 18 19 18 C19 15 21 13 24 13" /><path d="M24 30 H40 M28 38 H36" class="thin" />');
    case "phone":
      return wrap('<rect x="20" y="8" width="24" height="48" rx="6" /><circle cx="32" cy="47" r="2.3" class="fill-dot a" />');
    case "rocket":
      return wrap('<path d="M38 10 C48 12 52 26 46 36 L28 18 C38 12 34 8 38 10 Z" /><path d="M28 18 L18 28 L24 40 L36 46 L46 36" /><path d="M18 46 L24 40" />');
    case "languages":
      return wrap('<text x="20" y="35" text-anchor="middle" font-size="22" font-weight="900">A</text><text x="43" y="36" text-anchor="middle" font-size="18" font-weight="900">L</text><path d="M12 45 H52" class="thin" />');
    case "graduate":
      return wrap('<path d="M10 24 L32 14 L54 24 L32 34 Z" /><path d="M18 30 V40 C18 44 25 48 32 48 C39 48 46 44 46 40 V30" /><path d="M54 24 V38" />');
    case "globe":
      return wrap('<circle cx="32" cy="32" r="22" /><path d="M10 32 H54 M32 10 C24 18 24 46 32 54 M32 10 C40 18 40 46 32 54" class="thin" />');
    case "cart":
      return wrap('<path d="M14 18 H20 L25 38 H46 L50 24 H23" /><circle cx="28" cy="48" r="3.5" class="fill-dot a" /><circle cx="44" cy="48" r="3.5" class="fill-dot b" />');
    case "lock":
      return wrap('<rect x="18" y="28" width="28" height="22" rx="5" /><path d="M24 28 V21 C24 16 28 12 32 12 C36 12 40 16 40 21 V28" /><circle cx="32" cy="39" r="2.5" class="fill-dot a" />');
    case "sparkles":
      return wrap('<path d="M32 8 L37 26 L55 32 L37 38 L32 56 L27 38 L9 32 L27 26 Z" />');
    case "network":
      return wrap('<circle cx="18" cy="20" r="6" /><circle cx="46" cy="20" r="6" /><circle cx="32" cy="46" r="6" /><path d="M24 23 L40 23 M21 26 L29 41 M43 26 L35 41" class="thin" />');
    case "cpu":
      return wrap('<rect x="18" y="18" width="28" height="28" rx="5" /><rect x="26" y="26" width="12" height="12" rx="2" class="thin" /><path d="M24 10 V18 M32 10 V18 M40 10 V18 M24 46 V54 M32 46 V54 M40 46 V54 M10 24 H18 M10 32 H18 M10 40 H18 M46 24 H54 M46 32 H54 M46 40 H54" class="thin" />');
    default:
      return wrap('<path d="M25 18 L13 32 L25 46" /><path d="M39 18 L51 32 L39 46" />');
  }
}

function sectionHeader(eyebrow, title, description, icon) {
  return `
    <div class="skills-head-row">
      <div>
        <p class="skills-eyebrow">${eyebrow}</p>
        <h3 class="skills-title">${title}</h3>
        <p class="skills-subtitle">${description}</p>
      </div>
      <div class="skills-head-icon">${techIcon(icon)}</div>
    </div>
  `;
}

function builderProfilePanel() {
  return `
    <div class="builder-panel">
      <div class="builder-glow"></div>
      <div class="builder-grid">
        <div>
          <div class="builder-icon">${techIcon("rocket")}</div>
          <h3 class="builder-title">Builder Profile</h3>
          <p class="builder-copy">I build real systems, not only demos - websites, panels, Android apps, Telegram bots, scraping tools, APIs, and automation workflows.</p>
        </div>
        <div class="builder-cards">
          ${projectCards
            .map(
              (card) => `
                <article class="builder-card">
                  <div class="builder-card-icon">${techIcon(card.icon)}</div>
                  <p class="builder-card-label">${card.label}</p>
                  <p class="builder-card-value">${card.value}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
}

const projectGrid = document.getElementById("project-grid");
const projectCatButtons = Array.from(document.querySelectorAll("[data-project-cat]"));
const projectIntro = document.getElementById("project-folder-intro");
const modalDesc = document.getElementById("modal-desc");
const modalLangs = document.getElementById("modal-langs");
const modalLinks = document.getElementById("modal-links");
const modalStatus = document.getElementById("modal-status");
const modalThumb = document.getElementById("modal-thumb");
const modalFlyText = document.getElementById("modal-fly-text");
const modalLeftTitle = document.getElementById("modal-left-title");
let activeProjectCategory = "all";

function openProjectModal(project) {
  if (!modal) return;
  modalTitle.textContent = project.title;
  if (modalLeftTitle) modalLeftTitle.textContent = project.title;
  if (modalStatus) modalStatus.textContent = project.status;
  if (modalThumb) modalThumb.textContent = project.thumbnail;
  if (modalFlyText) modalFlyText.textContent = project.thumbnail;
  modalDesc.textContent = project.description;
  modalLangs.innerHTML = project.languages.map((lang) => `<span class="project-tag">${lang}</span>`).join("");
  modalLinks.innerHTML = `
    ${project.links
      .map(
        (link) =>
          `<a class="chip active modal-link-btn" href="${link.href}" target="_blank" rel="noreferrer">${link.label}</a>`
      )
      .join("")}
    <button class="chip modal-link-ghost" type="button">Request Details</button>
  `;

  const fly = modal.querySelector(".modal-fly-folder");
  if (fly) {
    fly.classList.remove("active");
    void fly.offsetWidth;
    fly.classList.add("active");
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeProjectModal() {
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function renderProjects() {
  if (!projectGrid) return;
  const filtered =
    activeProjectCategory === "all"
      ? projectsData
      : projectsData.filter((project) => project.category === activeProjectCategory);

  projectGrid.innerHTML = filtered
    .map((project) => {
      const shown = project.languages.slice(0, 3);
      const more = Math.max(project.languages.length - shown.length, 0);
      return `
        <button class="glass project-card project-card-rich" data-project-id="${project.id}">
          <div class="project-card-gradient"></div>
          <div class="project-card-sweep"></div>
          <div class="project-top">
            <div class="project-tags">
              ${shown.map((lang) => `<span class="project-tag">${lang}</span>`).join("")}
              ${more > 0 ? `<span class="project-tag">+${more} more</span>` : ""}
            </div>
            <span class="project-status">${project.status}</span>
          </div>

          <div class="folder-shell">
            <div class="folder-shell-glow"></div>
            <div class="folder-3d">
              <div class="folder-3d-tab"></div>
              <div class="folder-3d-text">${project.thumbnail}</div>
            </div>
          </div>

          <div class="project-body">
            <h3>${project.title}</h3>
            <p>${project.subtitle}</p>
          </div>

          <div class="open-row">
            <span class="open-label">Open folder</span>
            <span class="open-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" class="open-ico-svg">
                <path d="M7 17L17 7"></path>
                <path d="M9 7h8v8"></path>
              </svg>
            </span>
          </div>
        </button>
      `;
    })
    .join("");

  projectGrid.querySelectorAll("[data-project-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-project-id"));
      const project = projectsData.find((item) => item.id === id);
      if (project) openProjectModal(project);
    });
  });
}

projectCatButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeProjectCategory = button.getAttribute("data-project-cat") || "all";
    projectCatButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderProjects();
  });
});

if ("IntersectionObserver" in window && projectIntro) {
  let introLock = false;
  const introObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry || !entry.isIntersecting || scrollDirection !== "down" || introLock) return;
      introLock = true;
      projectIntro.classList.remove("active");
      void projectIntro.offsetWidth;
      projectIntro.classList.add("active");
      setTimeout(() => {
        projectIntro.classList.remove("active");
        introLock = false;
      }, 1700);
    },
    { threshold: 0.3 }
  );
  const projectSection = document.getElementById("projects");
  if (projectSection) introObserver.observe(projectSection);
}

const skillsPanel = document.getElementById("skills-panel");
const skillsTabButtons = Array.from(document.querySelectorAll("[data-skill-tab]"));
let activeSkillTab = "programming";

function renderSkillsPanel() {
  if (!skillsPanel) return;
  let content = "";

  if (activeSkillTab === "programming") {
    content = `
      <div class="skills-surface">
        ${sectionHeader(
          "Technical Level",
          "Programming Languages",
          "My current stack and confidence level in each technology.",
          "code"
        )}
        <div class="prog-grid">
          ${programmingSkills
            .map(
              (skill) => `
                <article class="prog-card">
                  <div class="prog-card-glow"></div>
                  <div class="prog-top">
                    <div class="prog-icon">${techIcon(skill.icon)}</div>
                    <span class="prog-score">${skill.level}%</span>
                  </div>
                  <h4>${skill.name}</h4>
                  <p>${skill.detail}</p>
                  <div class="skill-meter"><span class="skill-meter-fill" data-fill="${skill.level}"></span></div>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
      ${builderProfilePanel()}
    `;
  } else if (activeSkillTab === "core") {
    content = `
      <div class="skills-surface skills-surface-lite">
        ${sectionHeader(
          "Main Fields",
          "Core Experience",
          "The practical areas behind my work and projects.",
          "sparkles"
        )}
        <div class="core-grid">
          ${skillGroups
            .map(
              (item) => `
                <article class="core-card">
                  <div class="core-icon">${techIcon(item.icon)}</div>
                  <h4>${item.title}</h4>
                  <p>${item.text}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
      ${builderProfilePanel()}
    `;
  } else if (activeSkillTab === "languages") {
    content = `
      <div class="skills-surface skills-narrow">
        <div class="lang-head">
          <div class="lang-head-icon">${techIcon("languages")}</div>
          <div>
            <p class="skills-eyebrow">Communication</p>
            <h3 class="skills-title">Languages</h3>
          </div>
        </div>
        <div class="lang-grid">
          ${speakingLanguages
            .map(
              (language) => `
                <article class="lang-card">
                  <span>${language.name}</span>
                  <span class="lang-badge">${language.level}</span>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  } else if (activeSkillTab === "education") {
    content = `
      <div class="skills-surface skills-mid">
        <div class="lang-head">
          <div class="lang-head-icon">${techIcon("graduate")}</div>
          <div>
            <p class="skills-eyebrow">Lebanon</p>
            <h3 class="skills-title">Education</h3>
          </div>
        </div>
        <article class="edu-card">
          <p class="edu-title">First-year Computer Science Student</p>
          <p class="edu-copy">Finished high school in Lebanon and currently studying Computer Science while building real-world projects across web, bots, automation, mobile apps, and security labs.</p>
        </article>
      </div>
    `;
  } else {
    content = `
      <div class="skills-surface">
        ${sectionHeader(
          "Frameworks & Tools",
          "Technologies I Work With",
          "A compact view of frameworks, libraries, and tools I use across real projects.",
          "layers"
        )}
        <div class="frame-grid">
          ${frameworks
            .map(
              (item) => `
                <article class="frame-card">
                  <div class="frame-head">
                    <div class="frame-icon">${techIcon(item.icon)}</div>
                    <span class="frame-level">${item.level}</span>
                  </div>
                  <h4>${item.name}</h4>
                  <p>${item.text}</p>
                </article>
              `
            )
            .join("")}
        </div>
        <div class="tool-pills">
          ${toolStack.map((tool) => `<span class="tool-pill">${tool}</span>`).join("")}
        </div>
      </div>
    `;
  }

  skillsPanel.innerHTML = content;
  requestAnimationFrame(() => {
    skillsPanel.querySelectorAll(".skill-meter-fill").forEach((bar) => {
      bar.style.width = `${bar.getAttribute("data-fill")}%`;
    });
  });
}

skillsTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeSkillTab = button.getAttribute("data-skill-tab") || "programming";
    skillsTabButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderSkillsPanel();
  });
});

renderSkillsPanel();
renderProjects();

function ensureCriticalSectionsReady() {
  const ensure = () => {
    if (skillsPanel && skillsPanel.children.length === 0) {
      renderSkillsPanel();
    }
    if (projectGrid && projectGrid.children.length === 0) {
      renderProjects();
    }
    const skillsNode = document.getElementById("skills");
    const projectsNode = document.getElementById("projects");
    if (skillsNode) skillsNode.classList.add("in");
    if (projectsNode) projectsNode.classList.add("in");
  };

  ensure();
  setTimeout(ensure, 420);
  setTimeout(ensure, 1200);
}

ensureCriticalSectionsReady();

function bootstrapVisuals() {
  safeInit("interactive-field", initInteractiveField);
  safeInit("hero-particles", initHeroParticles);
  safeInit("titles", initInteractiveTitles);
  safeInit("contact-box", initInteractiveContactBox);
  safeInit("about-box", initInteractiveAboutBox);
  safeInit("about-particles", initAboutParticles);
  safeInit("globe", initGlobe);
}

bootstrapVisuals();

document.querySelectorAll("[data-close='modal']").forEach((node) => {
  node.addEventListener("click", closeProjectModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeProjectModal();
});
