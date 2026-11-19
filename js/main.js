/* ============================================================
   UniLanding MY — Interactions
============================================================ */

(function () {
  "use strict";

  // ---------- Selectors ----------
  const navbar = document.getElementById("navbar");
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  const bookingBtns = document.querySelectorAll('a[href="#booking"]');
  const bookingModal = document.getElementById("booking-modal");
  const bookingBackdrop = document.getElementById("booking-backdrop");
  const bookingClose = document.getElementById("booking-close");
  const authModal = document.getElementById("auth-modal");
  const authBackdrop = document.getElementById("auth-backdrop");
  const authClose = document.getElementById("auth-close");
  const loginLink = document.querySelector('a[href="#login"]');

  // ---------- Navbar scroll state ----------
  window.addEventListener("scroll", () => {
    if (window.scrollY > 10) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // ---------- Mobile menu ----------
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navLinks.classList.toggle("open");
    document.body.style.overflow = navLinks.classList.contains("open") ? "hidden" : "";
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  // Close mobile menu when clicking outside
  document.addEventListener("click", (e) => {
    if (navLinks.classList.contains("open") && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  });

  // ---------- Reveal-on-scroll ----------
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -80px 0px" });

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  // ---------- FAQ accordion ----------
  document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const answer = btn.nextElementSibling;

      btn.closest(".faq-grid").querySelectorAll(".faq-question").forEach((other) => {
        if (other !== btn) {
          other.setAttribute("aria-expanded", "false");
          const toggle = other.querySelector(".faq-toggle");
          if (toggle) toggle.textContent = "+";
          const otherAnswer = other.nextElementSibling;
          if (otherAnswer) otherAnswer.hidden = true;
        }
      });

      btn.setAttribute("aria-expanded", String(!expanded));
      const toggle = btn.querySelector(".faq-toggle");
      if (toggle) toggle.textContent = expanded ? "+" : "−";
      if (answer) answer.hidden = expanded;
    });
  });

  // ---------- Modals ----------
  function openModal(modal) {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (modal === bookingModal) resetWizard();
  }

  bookingBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(bookingModal);
      setWizardStep(1);
    });
  });

  if (loginLink) {
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(authModal);
    });
  }

  bookingClose.addEventListener("click", () => closeModal(bookingModal));
  authClose.addEventListener("click", () => closeModal(authModal));
  bookingBackdrop.addEventListener("click", () => closeModal(bookingModal));
  authBackdrop.addEventListener("click", () => closeModal(authModal));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (bookingModal.classList.contains("open")) closeModal(bookingModal);
      if (authModal.classList.contains("open")) closeModal(authModal);
    }
  });

  // ---------- File upload validation (auth modal) ----------
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowed.includes(file.type)) {
        alert("Invalid file type. Please upload JPG, PNG, WebP, or PDF.");
        input.value = "";
        return;
      }
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert("File too large. Maximum size is 5 MB.");
        input.value = "";
        return;
      }
    });
  });

  // ---------- Auth tab switching ----------
  window.switchTab = (tab) => {
    document.querySelectorAll(".auth-tab").forEach((t) => {
      t.classList.toggle("active", t.getAttribute("data-tab") === tab);
    });
    document.querySelectorAll(".auth-form").forEach((f) => {
      f.style.display = f.id === `auth-${tab}` ? "" : "none";
    });
  };

  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.getAttribute("data-tab")));
  });

  // Inline onclick replacement for auth footer links
  document.querySelectorAll(".switch-tab-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab(link.getAttribute("data-tab"));
    });
  });

  // ---------- Auth submit -> dashboard ----------
  document.querySelectorAll(".auth-submit").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Collect user data from the visible form
      const form = btn.closest(".auth-form");
      if (form && form.id === "auth-signup") {
        const inputs = form.querySelectorAll("input[type='text'], input[type='email']");
        const name = inputs[0] ? sanitizeInput(inputs[0].value) : "";
        const university = inputs[1] ? sanitizeInput(inputs[1].value) : "";
        const email = inputs[2] ? sanitizeInput(inputs[2].value) : "";
        if (name) {
          try {
            localStorage.setItem("unilanding_user", JSON.stringify({ name, university, email }));
          } catch (e) {}
        }
      } else if (form && form.id === "auth-login") {
        const emailInput = form.querySelector("input[type='email']");
        if (emailInput && emailInput.value.trim()) {
          try {
            const existing = safeJsonParse(localStorage.getItem("unilanding_user"), {});
            if (!existing.name) {
              const email = sanitizeInput(emailInput.value);
              localStorage.setItem("unilanding_user", JSON.stringify({ name: email.split("@")[0], university: "UNITAR International University", email: email }));
            }
          } catch (e) {}
        }
      }
      window.location.href = "dashboard.html";
    });
  });

  // ---------- Workflow section (page) ----------
  let workflowStep = 1;
  const workflowStepEls = document.querySelectorAll(".step-step");
  const workflowPanels = document.querySelectorAll(".step-panel");

  function setWorkflowStep(step) {
    workflowStep = Math.max(1, Math.min(4, step));
    workflowStepEls.forEach((el, i) => {
      el.classList.toggle("active", i + 1 === workflowStep);
    });
    workflowPanels.forEach((panel, i) => {
      panel.classList.toggle("active", i + 1 === workflowStep);
    });
    const prev = document.getElementById("step-prev");
    const next = document.getElementById("step-next");
    if (prev) prev.disabled = workflowStep === 1;
    if (next) {
      next.textContent = workflowStep === 4 ? "Finish" : "Next";
    }
  }

  const stepPrevBtn = document.getElementById("step-prev");
  const stepNextBtn = document.getElementById("step-next");
  if (stepPrevBtn) {
    stepPrevBtn.addEventListener("click", () => setWorkflowStep(workflowStep - 1));
  }
  if (stepNextBtn) {
    stepNextBtn.addEventListener("click", () => {
      if (workflowStep === 4) {
        // Scroll to booking / open booking modal
        const bookingCta = document.querySelector('a[href="#booking"]');
        if (bookingCta) bookingCta.click();
        return;
      }
      setWorkflowStep(workflowStep + 1);
    });
  }

  setWorkflowStep(1);

  // ---------- Booking wizard (modal) ----------
  const wizardPages = document.querySelectorAll(".wizard-page");
  const wizardSteps = document.querySelectorAll(".wizard-step");

  let currentStep = 1;

  const packageInputs = document.querySelectorAll('input[name="package"]');
  const sumPackage = document.getElementById("sum-package");
  const sumSubtotal = document.getElementById("sum-subtotal");
  const sumTotal = document.getElementById("sum-total");
  const addonInputs = document.querySelectorAll(".addons input[type='checkbox']");
  const addonPrices = { "extra-sim": 30, "extra-meal": 25 };

  const packageLabels = {
    essential: { name: "Essential Transit", price: 180 },
    "soft-landing": { name: "The Soft Landing", price: 320 },
    vip: { name: "VIP Complete Relocation", price: 550 },
  };

  function updatePrice() {
    const selected = document.querySelector('input[name="package"]:checked');
    if (!selected) return;
    const pkg = packageLabels[selected.value];
    let total = pkg.price;

    addonInputs.forEach((inp) => {
      if (inp.checked) total += addonPrices[inp.value] || 0;
    });

    if (sumPackage) sumPackage.textContent = pkg.name;
    if (sumSubtotal) sumSubtotal.textContent = `RM ${pkg.price}`;
    if (sumTotal) sumTotal.textContent = `RM ${total}`;
  }

  packageInputs.forEach((inp) => inp.addEventListener("change", updatePrice));
  addonInputs.forEach((inp) => inp.addEventListener("change", updatePrice));
  updatePrice();

  function setWizardStep(step) {
    currentStep = Math.max(1, Math.min(4, step));

    wizardPages.forEach((page, i) => {
      page.classList.toggle("active", i + 1 === currentStep);
    });

    wizardSteps.forEach((stepEl, i) => {
      const done = i + 1 < currentStep;
      const active = i + 1 === currentStep;
      stepEl.classList.toggle("completed", done);
      stepEl.classList.toggle("active", active);
    });
  }

  function resetWizard() {
    setWizardStep(1);
    const softLanding = document.querySelector('input[name="package"][value="soft-landing"]');
    if (softLanding) softLanding.checked = true;
    addonInputs.forEach((inp) => (inp.checked = false));
    updatePrice();
    // Reset step 1 form
    const form1 = document.getElementById("form-step1");
    if (form1) form1.reset();
  }

  // Validation helper
  function validateStep1() {
    const form = document.getElementById("form-step1");
    if (!form) return true;
    const inputs = form.querySelectorAll("input[required], select[required]");
    for (const inp of inputs) {
      if (!inp.value || !inp.value.trim()) {
        inp.focus();
        inp.style.borderColor = "#EA4335";
        setTimeout(() => (inp.style.borderColor = ""), 1500);
        return false;
      }
    }
    return true;
  }

  // Safe JSON parse helper
  function safeJsonParse(str, fallback) {
    try {
      const parsed = JSON.parse(str);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  }

  // Input sanitization (strip HTML tags)
  function sanitizeInput(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/<[^>]*>/g, "").trim();
  }

  // HTML escape helper (prevents XSS when inserting user data)
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Collect booking data from wizard forms
  function collectBookingData() {
    const flightInput = document.querySelector("#form-step1 input[type='text']");
    const dateInput = document.querySelector("#form-step1 input[type='date']");
    const airportSelect = document.querySelector("#form-step1 select");
    const destInput = document.querySelectorAll("#form-step1 input[type='text']")[1];

    // Sanitize user inputs
    if (flightInput) flightInput.value = sanitizeInput(flightInput.value);
    if (destInput) destInput.value = sanitizeInput(destInput.value);
    const selectedPkg = document.querySelector('input[name="package"]:checked');
    const pkgLabels = {
      essential: { name: "Essential Transit", price: 180 },
      "soft-landing": { name: "The Soft Landing", price: 320 },
      vip: { name: "VIP Complete Relocation", price: 550 },
    };
    const pkg = pkgLabels[selectedPkg ? selectedPkg.value : "soft-landing"];
    const addons = [];
    let total = pkg.price;
    document.querySelectorAll(".addons input[type='checkbox']:checked").forEach((cb) => {
      const label = cb.parentElement.textContent.trim();
      addons.push(label);
      if (cb.value === "extra-sim") total += 30;
      if (cb.value === "extra-meal") total += 25;
    });
    const paySelected = document.querySelector(".pay-chip.selected");
    return {
      ref: "UNI-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000),
      invoice: "INV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000),
      package: pkg.name,
      price: pkg.price,
      total: total,
      addons: addons,
      flight: flightInput ? flightInput.value : "MH0123",
      date: dateInput ? dateInput.value : "2026-12-15",
      airport: airportSelect ? airportSelect.options[airportSelect.selectedIndex].text : "KLIA",
      destination: destInput ? destInput.value : "UNITAR Hostel, Selangor",
      payment: paySelected ? paySelected.textContent.trim() : "FPX Online Banking",
      bookedAt: new Date().toISOString(),
    };
  }

  // Navigation buttons inside wizard pages
  const w1Next = document.getElementById("w1-next");
  const w2Next = document.getElementById("w2-next");
  const w3Next = document.getElementById("w3-next");
  const w2Prev = document.getElementById("w2-prev");
  const w3Prev = document.getElementById("w3-prev");
  const w4Close = document.getElementById("w4-close");
  const w4Print = document.getElementById("w4-print");

  if (w1Next) {
    w1Next.addEventListener("click", () => {
      if (validateStep1()) setWizardStep(2);
    });
  }
  if (w2Next) {
    w2Next.addEventListener("click", () => setWizardStep(3));
  }
  if (w3Next) {
    w3Next.addEventListener("click", () => {
      const terms = document.querySelector('#form-step3 input[type="checkbox"]');
      if (terms && !terms.checked) {
        terms.focus();
        alert("Please agree to the terms and privacy policy to continue.");
        return;
      }
      const btn = w3Next;
      const orig = btn.textContent;
      btn.textContent = "Processing…";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled = false;
        // Persist booking data for dashboard
        const booking = collectBookingData();
        try {
          localStorage.setItem("unilanding_booking", JSON.stringify(booking));
          const history = safeJsonParse(localStorage.getItem("unilanding_bookings"), []);
          history.unshift(booking);
          localStorage.setItem("unilanding_bookings", JSON.stringify(history));
        } catch (e) {}
        // Update confirmation reference display
        const refEl = document.querySelector(".confirm-ref strong");
        if (refEl && refEl.nextSibling) {
          refEl.nextSibling.textContent = " " + booking.ref;
        }
        const refContainer = document.querySelector(".confirm-ref");
        if (refContainer) {
          refContainer.innerHTML = "<strong>Reference:</strong> " + escapeHtml(booking.ref);
        }
        setWizardStep(4);
      }, 1200);
    });
  }
  if (w4Close) {
    w4Close.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }
  if (w4Print) {
    w4Print.addEventListener("click", () => window.print());
  }
  if (w2Prev) {
    w2Prev.addEventListener("click", () => setWizardStep(1));
  }
  if (w3Prev) {
    w3Prev.addEventListener("click", () => setWizardStep(2));
  }

  // ---------- Pay method selection ----------
  document.querySelectorAll(".pay-chip").forEach((chip) => {
    const radio = chip.querySelector('input[type="radio"]');
    chip.addEventListener("click", () => {
      document.querySelectorAll(".pay-chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      if (radio) radio.checked = true;
    });
    if (radio && radio.checked) chip.classList.add("selected");
  });

  // ---------- Ripple effect on payment buttons ----------
  document.querySelectorAll(".btn-ripple").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement("span");
      ripple.style.position = "absolute";
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = ripple.style.height = "0";
      ripple.style.background = "rgba(255,255,255,0.4)";
      ripple.style.borderRadius = "50%";
      ripple.style.transform = "translate(-50%, -50%)";
      ripple.style.pointerEvents = "none";
      ripple.style.transition = "width 0.5s ease, height 0.5s ease, opacity 0.5s ease";
      ripple.style.opacity = "1";
      btn.style.position = "relative";
      btn.style.overflow = "hidden";
      btn.appendChild(ripple);
      setTimeout(() => {
        ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height) * 2}px`;
        ripple.style.opacity = "0";
      }, 10);
      setTimeout(() => ripple.remove(), 510);
    });
  });

  // ---------- Track section interactions ----------
  const shareEtaBtn = document.querySelector("#track button");
  if (shareEtaBtn) {
    shareEtaBtn.addEventListener("click", () => {
      alert("ETA shared with your host via WhatsApp.");
    });
  }

  // ---------- Stat counter animation (polish) ----------
  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight - 60 && rect.bottom >= 0;
  }

  function handleScroll() {
    document.querySelectorAll(".stat-value").forEach((el) => {
      if (!el.dataset.animated && isInViewport(el)) {
        el.dataset.animated = "1";
        const raw = el.textContent.trim();
        const num = parseInt(raw.replace(/\D/g, ""), 10);
        if (!isNaN(num) && num > 0 && num < 10000) {
          animateValue(el, 0, num, 900, raw);
        }
      }
    });
  }

  function animateValue(el, start, end, duration, original) {
    let startTime = null;
    const suffix = original.replace(/[\d]/g, "").trim();
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const val = Math.floor(progress * (end - start) + start);
      el.textContent = val + (suffix ? " " + suffix : "");
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = original;
    }
    requestAnimationFrame(step);
  }

  window.addEventListener("scroll", handleScroll);
  handleScroll();
})();
