function initSidebarUI() {
  const body = document.body;
  const sidebar =
    document.getElementById("primary-sidebar") ||
    document.querySelector(".sidebar");
  const toggleBtn = document.querySelector(".js-sidebar-toggle");
  const backdrop = document.querySelector(".js-sidebar-backdrop");

  if (!sidebar || !toggleBtn || !backdrop) return;

  const setOpen = (open) => {
    body.classList.toggle("sidebar-open", open);
    toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    backdrop.hidden = !open;
  };

  const close = () => setOpen(false);
  const toggle = () => setOpen(!body.classList.contains("sidebar-open"));

  toggleBtn.addEventListener("click", toggle);
  backdrop.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // Force disable off-canvas state on ≥1200px
  const mq = window.matchMedia("(min-width: 1200px)");
  const sync = () => {
    if (mq.matches) close();
  };

  if (mq.addEventListener) mq.addEventListener("change", sync);
  else mq.addListener(sync); // Fallback for older browsers

  sync();
}

document.documentElement.classList.add("js");

// Utilities
const utils = {
  getCurrentFile() {
    const path = window.location.pathname;
    return (path.split("/").pop() || "index.html").split("#")[0];
  },

  parseLinkHref(href, currentFile) {
    if (!href) return { file: "", hash: "" };

    if (href.startsWith("#")) {
      return { file: currentFile, hash: href.slice(1) };
    }

    const [filePart, hashPart] = href.split("#");
    const file = (filePart.split("/").pop() || currentFile).split("?")[0];
    return { file, hash: hashPart || "" };
  },

  getCurrentHash() {
    return window.location.hash.replace(/^#/, "");
  },
};

// Accordion animations (for .accordion and .nav-group)
const accordion = {
  // ms per px
  speed: 0.35,

  minDuration: 160,
  maxDuration: 520,

  prefersReduced: window.matchMedia?.("(prefers-reduced-motion: reduce)"),

  getDuration(px) {
    if (this.prefersReduced?.matches) return 0;
    const d = Math.round(Math.abs(px) * this.speed);
    return Math.max(this.minDuration, Math.min(this.maxDuration, d));
  },

  animate(detailsEl, shouldOpen) {
    if (!detailsEl) return;

    const isNavGroup = detailsEl.classList.contains("nav-group");
    const content = isNavGroup
      ? detailsEl.querySelector(".nav-group__list")
      : detailsEl.querySelector(".accordion__content");

    if (!content) {
      detailsEl.open = shouldOpen;
      return;
    }

    shouldOpen ? this.open(detailsEl, content) : this.close(detailsEl, content);
  },

  open(detailsEl, content) {
    detailsEl.open = true;

    // Measure content height
    const targetHeight = content.scrollHeight;

    // Calculate duration based on height
    const duration = this.getDuration(targetHeight);

    // Set initial height
    content.style.height = "0px";
    content.style.overflow = "hidden";
    content.style.transition = `height ${duration}ms linear`;

    // Start animation
    requestAnimationFrame(() => {
      content.style.height = `${targetHeight}px`;

      const onEnd = (e) => {
        if (e.propertyName !== "height") return;
        content.style.height = "auto";
        content.style.overflow = "";
        content.style.transition = "";
        content.removeEventListener("transitionend", onEnd);
      };

      content.addEventListener("transitionend", onEnd);

      // Fallback in case transitionend doesn't fire
      setTimeout(() => {
        if (content.style.height !== "auto") {
          content.style.height = "auto";
          content.style.overflow = "";
          content.style.transition = "";
        }
      }, duration + 50);
    });
  },

  close(detailsEl, content) {
    if (!detailsEl.open) return;

    // Measure current height
    const currentHeight = content.scrollHeight;

    // Calculate duration
    const duration = this.getDuration(currentHeight);

    // Fix current height
    content.style.height = `${currentHeight}px`;
    content.style.overflow = "hidden";
    content.style.transition = "";

    // Force reflow
    content.offsetHeight;

    // Set transition and close
    content.style.transition = `height ${duration}ms ease-out`;

    requestAnimationFrame(() => {
      content.style.height = "0px";

      const onEnd = (e) => {
        if (e.propertyName !== "height") return;
        detailsEl.open = false;
        content.style.overflow = "";
        content.style.transition = "";
        content.removeEventListener("transitionend", onEnd);
      };

      content.addEventListener("transitionend", onEnd);

      // Fallback
      setTimeout(() => {
        if (detailsEl.open) {
          detailsEl.open = false;
          content.style.overflow = "";
          content.style.transition = "";
        }
      }, duration + 50);
    });
  },

  openForHash(hashId) {
    const id = hashId.replace(/^#/, "");
    if (!id) return;

    const el = document.getElementById(id);
    if (!el) return;

    if (el.tagName?.toLowerCase() === "details") {
      this.animate(el, true);
      return;
    }

    const parentDetails = el.closest("details.accordion");
    if (parentDetails) this.animate(parentDetails, true);
  },

  initAll() {
    // Initialize .accordion elements
    const accordions = document.querySelectorAll("details.accordion");
    accordions.forEach((acc) => {
      if (acc.dataset.smoothInit === "1") return;
      acc.dataset.smoothInit = "1";

      const summary = acc.querySelector(".accordion__summary");
      const content = acc.querySelector(".accordion__content");
      if (!summary || !content) return;

      // Set initial state
      content.style.height = acc.open ? "auto" : "0px";
      content.style.overflow = acc.open ? "" : "hidden";

      summary.addEventListener("click", (e) => {
        e.preventDefault();
        this.animate(acc, !acc.open);
      });
    });

    // Initialize .nav-group elements
    const navGroups = document.querySelectorAll("details.nav-group");
    navGroups.forEach((group) => {
      if (group.dataset.smoothInit === "1") return;
      group.dataset.smoothInit = "1";

      const summary = group.querySelector(".nav-group__summary");
      const list = group.querySelector(".nav-group__list");
      if (!summary || !list) return;

      // Set initial state
      list.style.height = group.open ? "auto" : "0px";
      list.style.overflow = group.open ? "" : "hidden";

      summary.addEventListener("click", (e) => {
        e.preventDefault();
        this.animate(group, !group.open);
      });
    });
  },
};

// Modal management (VERY SIMPLE with dialog!)
const modal = {
  init() {
    // Handle clicks on modal links
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#modal-"]');
      if (link) {
        e.preventDefault();
        const modalId = link.getAttribute("href").slice(1);
        const dialog = document.getElementById(modalId);
        if (dialog) {
          dialog.showModal();
        }
        return;
      }

      // Close when clicking close button
      const closeBtn = e.target.closest(".preview-modal__close");
      if (closeBtn) {
        const dialog = closeBtn.closest("dialog");
        if (dialog) {
          dialog.close();
        }
      }
    });

    // Close when clicking on backdrop
    document.querySelectorAll(".preview-modal").forEach((dialog) => {
      dialog.addEventListener("click", (e) => {
        const rect = dialog.getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        ) {
          dialog.close();
        }
      });
    });

    // Open modal on page load if hash matches
    const hash = utils.getCurrentHash();
    if (hash && hash.startsWith("modal-")) {
      const dialog = document.getElementById(hash);
      if (dialog) {
        dialog.showModal();
      }
    }
  },
};

accordion.initAll();

// Navigation
class Navigation {
  constructor(nav) {
    this.nav = nav;
    this.currentFile = utils.getCurrentFile();
    this.links = Array.from(
      nav.querySelectorAll(".sidebar-nav__link, .nav-link")
    );
  }

  init() {
    accordion.initAll();
    this.setInitialActiveLink();
  }

  setActiveLink(link) {
    this.links.forEach((l) =>
      l.classList.remove("active", "sidebar-nav__link--active")
    );
    if (link) link.classList.add("active", "sidebar-nav__link--active");
  }

  openNavGroupForLink(link) {
    if (!link) return;

    const group = link.closest("details.nav-group");
    if (!group) return;

    this.nav.querySelectorAll("details.nav-group").forEach((d) => {
      d.open = d === group;
    });
  }

  findLinkByFile(file) {
    return this.links.find((link) => {
      const href = link.getAttribute("href") || "";
      const { file: linkFile } = utils.parseLinkHref(href, this.currentFile);
      return linkFile === file;
    });
  }

  setInitialActiveLink() {
    let activeLink = null;

    // 1) Match by file
    activeLink = this.findLinkByFile(this.currentFile);

    // 2) Fallback for homepage (optional - kept from original)
    if (
      !activeLink &&
      (this.currentFile === "" || this.currentFile === "index.html")
    ) {
      activeLink = this.links.find((link) => {
        const href = link.getAttribute("href") || "";
        return (
          href.includes("index.html") || href === "/" || href === "index.html"
        );
      });
    }

    this.setActiveLink(activeLink);
    this.openNavGroupForLink(activeLink);
  }
}

// Swiper slider
const initSwiper = () => {
  const sliderEl = document.querySelector(".js-preview-swiper");
  if (!sliderEl || typeof Swiper === "undefined") return;

  const slider = new Swiper(sliderEl, {
    loop: true,
    speed: 600,
    slidesPerView: 1,
    navigation: {
      nextEl: ".preview-slider__nav--next",
      prevEl: ".preview-slider__nav--prev",
    },
    pagination: {
      el: ".preview-slider__dots",
      clickable: true,
    },
    breakpoints: {
      768: { speed: 700 },
    },
  });
};

document.addEventListener("DOMContentLoaded", () => {
  modal.init();
  initSidebarUI();

  accordion.initAll();

  const nav = document.querySelector(".sidebar-nav");
  if (nav) {
    const navigation = new Navigation(nav);
    navigation.init();
  }

  initSwiper();
});

(function () {
  const STORAGE_KEY = "theme";
  const saved = localStorage.getItem(STORAGE_KEY);
  const theme =
    saved === "dark" || saved === "light"
      ? saved
      : window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  document.documentElement.dataset.theme = theme;
})();

(() => {
  const STORAGE_KEY = "theme"; // "dark" | "light"
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const getSystemTheme = () => (media.matches ? "dark" : "light");

  const setButtonState = (theme) => {
    const isDark = theme === "dark";
    btn.setAttribute("aria-pressed", String(isDark));
    btn.setAttribute(
      "aria-label",
      isDark ? "Switch to light theme" : "Switch to dark theme"
    );
    btn.textContent = isDark ? "🌙" : "☀️";
  };

  const applyTheme = (theme) => {
    root.dataset.theme = theme; // <html data-theme="dark|light">
    setButtonState(theme);
  };

  // Initial theme: saved choice OR system preference
  const saved = localStorage.getItem(STORAGE_KEY);
  const initialTheme =
    saved === "dark" || saved === "light" ? saved : getSystemTheme();

  // Important: initial apply without animation (in case CSS is already loaded)
  // No data-theme-animate here.
  applyTheme(initialTheme);

  // Follow system only if user hasn't chosen explicitly
  const handleSystemChange = () => {
    const hasSaved = localStorage.getItem(STORAGE_KEY);
    if (hasSaved !== "dark" && hasSaved !== "light") {
      applyTheme(getSystemTheme()); // without animation to prevent flicker
    }
  };

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", handleSystemChange);
  } else {
    media.addListener(handleSystemChange);
  }

  const runAnimatedSwitch = () => {
    // respect prefers-reduced-motion
    if (reduceMotion.matches) return;

    // enable animation only briefly
    root.dataset.themeAnimate = "true";

    // Remove after slightly longer than your transition durations
    window.setTimeout(() => {
      delete root.dataset.themeAnimate;
    }, 360);
  };

  btn.addEventListener("click", () => {
    runAnimatedSwitch();

    const current = root.dataset.theme === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  });
})();
