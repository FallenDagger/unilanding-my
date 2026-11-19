/* ============================================================
   UniLanding MY — Immersive Scroll Motion Engine
   Inspired by Apple, SpaceX, Framer cinematic patterns
============================================================ */

(function () {
  "use strict";

  // ---------- Scroll progress bar ----------
  function initScrollProgress() {
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + "%";
    }

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  // ---------- Intersection Observer for reveals ----------
  function initRevealAnimations() {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -60px 0px",
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          // Stagger children
          const children = entry.target.querySelectorAll(".stagger-child");
          children.forEach((child, i) => {
            setTimeout(() => child.classList.add("visible"), i * 100);
          });
        }
      });
    }, observerOptions);

    document.querySelectorAll(".section-reveal, .slide-left, .slide-right, .scale-in, .text-reveal").forEach((el) => {
      revealObserver.observe(el);
    });

    // Observe section dividers
    document.querySelectorAll(".section-divider").forEach((el) => {
      revealObserver.observe(el);
    });
  }

  // ---------- Parallax scrolling ----------
  function initParallax() {
    const parallaxElements = document.querySelectorAll("[data-parallax]");
    if (parallaxElements.length === 0) return;

    function updateParallax() {
      const scrollY = window.scrollY;
      parallaxElements.forEach((el) => {
        const speed = parseFloat(el.getAttribute("data-parallax")) || 0.5;
        const rect = el.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const offset = (centerY - viewportCenter) * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    }

    window.addEventListener("scroll", updateParallax, { passive: true });
    updateParallax();
  }

  // ---------- Text reveal (word by word) ----------
  function initTextReveal() {
    document.querySelectorAll(".text-reveal").forEach((el) => {
      const text = el.textContent;
      const words = text.split(/\s+/);
      el.innerHTML = words
        .map((word, i) => `<span class="word" style="transition-delay: ${i * 0.05}s">${word}</span>`)
        .join(" ");
    });
  }

  // ---------- Magnetic hover effect ----------
  function initMagneticHover() {
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  // ---------- Counter animation ----------
  function initCounters() {
    const counters = document.querySelectorAll("[data-counter]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = "1";
          const target = parseInt(entry.target.getAttribute("data-counter"), 10);
          const suffix = entry.target.getAttribute("data-suffix") || "";
          const prefix = entry.target.getAttribute("data-prefix") || "";
          let current = 0;
          const increment = target / 60;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            entry.target.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
          }, 16);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach((el) => observer.observe(el));
  }

  // ---------- Smooth section transitions ----------
  function initSectionTransitions() {
    const sections = document.querySelectorAll("section");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        }
      });
    }, { threshold: 0.1 });

    sections.forEach((section) => observer.observe(section));
  }

  // ---------- Hero parallax ----------
  function initHeroParallax() {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const visual = hero.querySelector(".hero-visual");
    const content = hero.querySelector(".hero-content");

    function updateHeroParallax() {
      const scrollY = window.scrollY;
      const heroHeight = hero.offsetHeight;
      if (scrollY < heroHeight) {
        const progress = scrollY / heroHeight;
        if (visual) {
          visual.style.transform = `translateY(${scrollY * 0.3}px) scale(${1 + progress * 0.05})`;
          visual.style.opacity = 1 - progress * 0.5;
        }
        if (content) {
          content.style.transform = `translateY(${scrollY * 0.15}px)`;
          content.style.opacity = 1 - progress * 0.3;
        }
      }
    }

    window.addEventListener("scroll", updateHeroParallax, { passive: true });
    updateHeroParallax();
  }

  // ---------- Stagger reveal for grids ----------
  function initStaggerGrids() {
    const grids = document.querySelectorAll(".services-grid, .pricing-grid, .faq-grid, .trust-grid, .dash-stats, .dash-quick-actions");
    grids.forEach((grid) => {
      const children = grid.children;
      Array.from(children).forEach((child, i) => {
        child.style.transitionDelay = `${i * 0.1}s`;
      });
    });
  }

  // ---------- Init all ----------
  function init() {
    initScrollProgress();
    initTextReveal();
    initRevealAnimations();
    initParallax();
    initMagneticHover();
    initCounters();
    initSectionTransitions();
    initHeroParallax();
    initStaggerGrids();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();