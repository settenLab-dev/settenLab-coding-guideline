document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".sidebar-nav");
  if (!nav) return;

  const links = Array.from(
    nav.querySelectorAll(".sidebar-nav__link, .nav-link")
  );

  // Определяем текущий файл (index.html по умолчанию)
  const path = window.location.pathname;
  const currentFile = (path.split("/").pop() || "index.html").split("#")[0];

  // Функция очистки и установки активного класса
  const setActiveLink = (link) => {
    links.forEach((l) => {
      l.classList.remove("active", "sidebar-nav__link--active");
    });
    if (link) {
      link.classList.add("active", "sidebar-nav__link--active");
    }
  };

  // 1) Первичная подсветка по URL
  let initialActive = null;

  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#")) return;

    const linkFile = href.split("/").pop().split("#")[0];

    if (linkFile === currentFile) {
      // Если у ссылки ещё и hash есть, можно дальше уточнять,
      // но базовая подсветка уже будет корректной
      initialActive = initialActive || link;
    }
  });

  // Если на index.html без файлового имени (e.g. /), попробуем поймать intro
  if (!initialActive && (currentFile === "" || currentFile === "index.html")) {
    initialActive = links.find((link) =>
      (link.getAttribute("href") || "").includes("#intro")
    );
  }

  setActiveLink(initialActive);

  // 2) Обработчик кликов по меню (делегирование)
  nav.addEventListener("click", (event) => {
    const target = event.target.closest(".sidebar-nav__link, .nav-link");
    if (!target) return;

    const href = target.getAttribute("href") || "";
    const hasHash = href.includes("#");
    const [hrefFile, hrefHash] = href.split("#");

    // Случай: ссылка ведёт на секцию на той же странице
    const isSamePage =
      hrefFile === "" ||
      hrefFile === currentFile ||
      (currentFile === "index.html" && hrefFile === "index.html");

    if (hasHash && isSamePage) {
      event.preventDefault();

      const sectionId = hrefHash || target.dataset.target;
      if (sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      setActiveLink(target);
    }
    // Если ссылка ведёт на другую страницу — просто дадим браузеру перейти по href
    // Подсветка сработает на новой странице при загрузке.
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const sliderEl = document.querySelector(".js-preview-swiper");

  if (sliderEl) {
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

      // mobile first
      breakpoints: {
        768: {
          speed: 700,
        },
      },
    });

    console.log("Swiper initialized:", slider);
  }
});
