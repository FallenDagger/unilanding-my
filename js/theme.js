/* ============================================================
   UniLanding MY — Theme Switcher
   4 themes: light, dark, nature, nightsky
============================================================ */

(function () {
  "use strict";

  const THEMES = ["light", "dark", "nature", "nightsky"];
  const THEME_LABELS = {
    light: "☀️ Light",
    dark: "🌙 Dark",
    nature: "🌸 Nature",
    nightsky: "✨ Night Sky",
  };
  const THEME_COLORS = {
    light: "#F2A900",
    dark: "#4A90D9",
    nature: "#52B788",
    nightsky: "#FFD700",
  };

  // ---------- Load/save theme ----------
  function getTheme() {
    try {
      const saved = localStorage.getItem("unilanding_theme");
      if (saved && THEMES.includes(saved)) return saved;
    } catch (e) {}
    return "light";
  }

  function setTheme(theme) {
    if (!THEMES.includes(theme)) return;
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("unilanding_theme", theme);
    } catch (e) {}
    updateSelector(theme);
    manageFallingAnimation(theme);
  }

  // ---------- Theme selector UI ----------
  function injectSelector() {
    const selector = document.createElement("div");
    selector.className = "theme-selector";
    selector.innerHTML = `
      <div class="theme-options" id="theme-options">
        ${THEMES.map(
          (t) =>
            `<button class="theme-option" data-theme="${t}">
              <span class="theme-dot" style="background:${THEME_COLORS[t]}"></span>
              ${THEME_LABELS[t]}
            </button>`
        ).join("")}
      </div>
      <button class="theme-toggle-btn" id="theme-toggle-btn" aria-label="Change theme" title="Change theme">🎨</button>
    `;
    document.body.appendChild(selector);

    const toggleBtn = document.getElementById("theme-toggle-btn");
    const options = document.getElementById("theme-options");

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      options.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!selector.contains(e.target)) {
        options.classList.remove("open");
      }
    });

    options.querySelectorAll(".theme-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        setTheme(btn.getAttribute("data-theme"));
        options.classList.remove("open");
      });
    });

    updateSelector(getTheme());
  }

  function updateSelector(theme) {
    document.querySelectorAll(".theme-option").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-theme") === theme);
    });
  }

  // ---------- Falling animation ----------
  let fallingInterval = null;
  let fallingContainer = null;

  function createFallingContainer() {
    if (fallingContainer) return fallingContainer;
    fallingContainer = document.createElement("div");
    fallingContainer.className = "falling-container";
    document.body.appendChild(fallingContainer);
    return fallingContainer;
  }

  function manageFallingAnimation(theme) {
    // Clear existing
    if (fallingInterval) {
      clearInterval(fallingInterval);
      fallingInterval = null;
    }
    if (fallingContainer) {
      fallingContainer.innerHTML = "";
    }

    if (theme === "nature") {
      startFalling("nature");
    } else if (theme === "nightsky") {
      startFalling("nightsky");
    }
  }

  function startFalling(type) {
    const container = createFallingContainer();

    if (type === "nature") {
      const items = ["🌸", "🌺", "🌼", "🌻", "🌹", "🌷", "✿", "❀"];

      function spawnFlower() {
        const item = document.createElement("div");
        item.className = "falling-item";
        item.textContent = items[Math.floor(Math.random() * items.length)];
        item.style.left = Math.random() * 100 + "vw";
        item.style.animationDuration = (Math.random() * 5 + 5) + "s";
        item.style.animationDelay = Math.random() * 2 + "s";
        item.style.fontSize = (Math.random() * 10 + 10) + "px";
        item.style.opacity = (Math.random() * 0.4 + 0.3).toFixed(2);
        container.appendChild(item);

        setTimeout(() => {
          if (item.parentNode) item.parentNode.removeChild(item);
        }, 12000);
      }

      for (let i = 0; i < 15; i++) {
        setTimeout(spawnFlower, Math.random() * 2000);
      }
      fallingInterval = setInterval(spawnFlower, 800);
    } else if (type === "nightsky") {
      // Add static twinkling background stars
      for (let i = 0; i < 60; i++) {
        const star = document.createElement("div");
        star.className = "bg-star";
        star.style.left = Math.random() * 100 + "vw";
        star.style.top = Math.random() * 100 + "vh";
        star.style.animationDuration = (Math.random() * 3 + 2) + "s";
        star.style.animationDelay = Math.random() * 3 + "s";
        star.style.width = star.style.height = (Math.random() * 2 + 1) + "px";
        container.appendChild(star);
      }

      function spawnShootingStar() {
        const star = document.createElement("div");
        star.className = "falling-item";
        // Random starting position in upper portion of screen
        const startX = Math.random() * 60 + 10; // 10-70vw
        const startY = Math.random() * 30; // 0-30vh
        star.style.left = startX + "vw";
        star.style.top = startY + "vh";
        star.style.animationDuration = (Math.random() * 1.5 + 1) + "s";
        container.appendChild(star);

        setTimeout(() => {
          if (star.parentNode) star.parentNode.removeChild(star);
        }, 3000);
      }

      // Spawn shooting stars periodically
      for (let i = 0; i < 3; i++) {
        setTimeout(spawnShootingStar, Math.random() * 2000);
      }
      fallingInterval = setInterval(() => {
        if (Math.random() > 0.4) {
          spawnShootingStar();
        }
      }, 2500);
    }
  }

  // ---------- Init ----------
  function init() {
    const theme = getTheme();
    setTheme(theme);
    injectSelector();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
