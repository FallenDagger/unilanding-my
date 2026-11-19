/* ============================================================
   UniLanding MY — Dashboard Interactions
============================================================ */

(function () {
  "use strict";

  // Safe JSON parse helper
  function safeJsonParse(str, fallback) {
    try {
      const parsed = JSON.parse(str);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
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

  // ---------- Load user & booking data from localStorage ----------
  function loadUserData() {
    try {
      const user = safeJsonParse(localStorage.getItem("unilanding_user"), {});
      if (user.name) {
        const nameEl = document.querySelector(".dash-name");
        if (nameEl) nameEl.textContent = user.name;
        const avatarEl = document.querySelector(".dash-avatar");
        if (avatarEl) {
          const initials = user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          avatarEl.textContent = initials || "U";
        }
        const titleEl = document.querySelector(".dash-title");
        if (titleEl && titleEl.textContent.startsWith("Welcome back")) {
          titleEl.textContent = "Welcome back, " + user.name.split(" ")[0] + " 👋";
        }
        // Profile form
        const nameInput = document.querySelector('.profile-form input[type="text"]');
        if (nameInput && user.name) nameInput.value = user.name;
        const emailInput = document.querySelector('.profile-form input[type="email"]');
        if (emailInput && user.email) emailInput.value = user.email;
        const uniInput = document.querySelectorAll('.profile-form input[type="text"]')[1];
        if (uniInput && user.university) uniInput.value = user.university;
      }
    } catch (e) {}
  }

  function loadBookingData() {
    try {
      const booking = safeJsonParse(localStorage.getItem("unilanding_booking"), null);
      const bookings = safeJsonParse(localStorage.getItem("unilanding_bookings"), []);
      if (booking) {
        // Update active booking card
        const refEl = document.querySelector(".booking-ref-value");
        if (refEl) refEl.textContent = booking.ref;
        const pkgEl = document.querySelector(".active-booking .dash-card-title");
        if (pkgEl) pkgEl.textContent = booking.package + " Package";
        // Update booking details
        const details = document.querySelectorAll(".booking-detail .bd-value");
        if (details.length >= 4) {
          details[0].textContent = (booking.flight || "MH0123") + " · " + (booking.airport || "KLIA");
          details[1].textContent = formatDate(booking.date) + (booking.time ? ", " + booking.time : "");
          details[2].textContent = booking.destination || "UNITAR Hostel, Selangor";
          details[3].textContent = packageVehicle(booking.package);
        }
        // Update stats
        const statValues = document.querySelectorAll(".dash-stat-value");
        if (statValues.length >= 4) {
          statValues[0].textContent = formatDate(booking.date) || "15 Dec 2026";
          statValues[3].textContent = "RM " + (booking.total || 320);
        }
        // Update confirmation reference in toast? no
      }
      // Update bookings table
      if (bookings.length > 0) {
        const tbody = document.querySelector("#view-bookings .dash-table tbody");
        if (tbody) {
          tbody.innerHTML = bookings.map((b) => {
            const isActive = booking && b.ref === booking.ref;
            const badgeClass = isActive ? "success" : "muted";
            const statusText = isActive ? "Confirmed" : "Completed";
            return `<tr>
              <td><strong>${escapeHtml(b.ref)}</strong></td>
              <td>${escapeHtml(b.package)}</td>
              <td>${escapeHtml(b.flight || "—")}</td>
              <td>${escapeHtml(formatDate(b.date))}</td>
              <td><span class="dash-badge ${escapeHtml(badgeClass)}">${escapeHtml(statusText)}</span></td>
              <td>RM ${escapeHtml(b.total)}</td>
              <td><button class="table-btn">View</button></td>
            </tr>`;
          }).join("");
          // Re-attach view button handlers
          document.querySelectorAll("#view-bookings .table-btn").forEach((btn) => {
            btn.addEventListener("click", () => showToast("Booking details opened."));
          });
        }
        // Update invoices table
        const invTbody = document.querySelector("#view-invoices .dash-table tbody");
        if (invTbody && bookings.length > 0) {
          invTbody.innerHTML = bookings.map((b) => {
            return `<tr>
              <td><strong>${escapeHtml(b.invoice)}</strong></td>
              <td>${escapeHtml(formatDate(b.bookedAt ? b.bookedAt.slice(0, 10) : b.date))}</td>
              <td>${escapeHtml(b.package)}</td>
              <td>RM ${escapeHtml(b.total)}</td>
              <td>${escapeHtml(b.payment || "FPX")}</td>
              <td><button class="table-btn" data-invoice="${escapeHtml(b.invoice)}">Download</button></td>
            </tr>`;
          }).join("");
          document.querySelectorAll("#view-invoices [data-invoice]").forEach((btn) => {
            btn.addEventListener("click", () => {
              showToast("Invoice " + btn.getAttribute("data-invoice") + " downloaded (simulated).");
            });
          });
        }
      }
    } catch (e) {}
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
    } catch (e) {
      return dateStr;
    }
  }

  function packageVehicle(pkg) {
    if (pkg && pkg.includes("VIP")) return "Extra-large van (4+ bags)";
    return "Toyota Alphard (6-seater)";
  }

  loadUserData();
  loadBookingData();

  // ---------- View switching ----------
  const navItems = document.querySelectorAll(".dash-nav-item");
  const views = document.querySelectorAll(".dash-view");

  function switchView(viewName) {
    navItems.forEach((item) => {
      item.classList.toggle("active", item.getAttribute("data-view") === viewName);
    });
    views.forEach((view) => {
      view.classList.toggle("active", view.id === `view-${viewName}`);
    });
    // Update URL hash (without scrolling)
    if (history.replaceState) {
      history.replaceState(null, "", `#${viewName}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      switchView(item.getAttribute("data-view"));
    });
  });

  // Quick action buttons that switch views
  document.querySelectorAll("[data-view-switch]").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchView(btn.getAttribute("data-view-switch"));
    });
  });

  // Handle hash on load
  const initialHash = (window.location.hash || "#overview").replace("#", "");
  const validViews = ["overview", "bookings", "track", "esim", "invoices", "profile"];
  if (validViews.includes(initialHash)) {
    switchView(initialHash);
  } else {
    switchView("overview");
  }

  // ---------- Toast ----------
  const toast = document.getElementById("toast");
  let toastTimer = null;

  function showToast(message, duration = 2800) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
  }

  // ---------- Download buttons ----------
  const downloadEsim = document.getElementById("download-esim");
  if (downloadEsim) {
    downloadEsim.addEventListener("click", () => {
      showToast("eSIM QR code downloaded (simulated).");
    });
  }

  const downloadChecklist = document.getElementById("download-checklist");
  if (downloadChecklist) {
    downloadChecklist.addEventListener("click", () => {
      showToast("Arrival checklist PDF downloaded (simulated).");
    });
  }

  // Invoice download buttons
  document.querySelectorAll("[data-invoice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const inv = btn.getAttribute("data-invoice");
      showToast(`Invoice ${inv} downloaded (simulated).`);
    });
  });

  // Table "View" buttons
  document.querySelectorAll(".table-btn:not([data-invoice])").forEach((btn) => {
    btn.addEventListener("click", () => {
      showToast("Booking details opened.");
    });
  });

  // ---------- Share ETA ----------
  const shareEtaBtn = document.getElementById("share-eta-btn");
  if (shareEtaBtn) {
    shareEtaBtn.addEventListener("click", () => {
      showToast("ETA shared with your host via WhatsApp.");
    });
  }

  // ---------- Profile form ----------
  const profileForm = document.querySelector(".profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", (e) => e.preventDefault());
    const saveBtn = profileForm.querySelector(".btn-primary");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        showToast("Profile changes saved.");
      });
    }
    const cancelBtn = profileForm.querySelector(".btn-outline");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        showToast("Changes discarded.");
      });
    }
  }

  // Security buttons
  document.querySelectorAll(".security-row .btn-outline").forEach((btn) => {
    btn.addEventListener("click", () => {
      showToast("Password change link sent to your email.");
    });
  });

  const fileChangeBtn = document.getElementById("file-change-btn");
  const fileInput = document.getElementById("passport-upload");
  const fileNameEl = document.getElementById("file-name");
  if (fileChangeBtn && fileInput) {
    fileChangeBtn.addEventListener("click", () => {
      fileInput.click();
    });
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      // Validate type
      const allowed = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowed.includes(file.type)) {
        showToast("Invalid file type. Use JPG, PNG, or PDF.");
        fileInput.value = "";
        return;
      }
      // Validate size (max 5 MB)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        showToast("File too large. Maximum 5 MB.");
        fileInput.value = "";
        return;
      }
      if (fileNameEl) fileNameEl.textContent = file.name;
      showToast("File selected: " + file.name);
    });
  }

  // ---------- Sign out ----------
  const logout = document.querySelector(".dash-logout");
  if (logout) {
    logout.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Sign out of your UniLanding MY dashboard?")) {
        window.location.href = "index.html";
      }
    });
  }

  // ---------- Mobile nav toggle (reuse) ----------
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      navLinks.classList.toggle("open");
    });
  }

  // ---------- Live flight tracker simulation ----------
  // Simulate ETA countdown
  let etaMinutes = 12;
  const etaEl = document.querySelector(".track-eta");
  setInterval(() => {
    if (etaMinutes > 0 && document.querySelector("#view-track.active")) {
      etaMinutes -= 1;
      if (etaEl) etaEl.textContent = `Arriving in ${etaMinutes} min · KLIA Gate A`;
      if (etaMinutes <= 0) {
        if (etaEl) etaEl.textContent = "Driver arriving now · KLIA Gate A";
      }
    }
  }, 60000);
})();
