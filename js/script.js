const pageType = document.body.dataset.page;
const desktopCanvasWidth = 1440;
const fixedHeaderTop = 24;

// Calcula la escala con la que se adapta la grilla desktop.
function getDesktopScale() {
  return Math.min(1, (window.innerWidth - 32) / desktopCanvasWidth);
}

function bindMenuContrast(menu, contentSelector) {
  if (!menu) return () => {};

  const items = Array.from(menu.querySelectorAll("a"));
  let frame = null;

  // Revisa si el texto del menú cae sobre una imagen para invertir su color.
  function updateContrast() {
    frame = null;

    if (window.innerWidth < 900) {
      items.forEach((item) => item.classList.remove("is-contrast"));
      return;
    }

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const pointX = rect.left + rect.width / 2;
      const pointY = rect.top + rect.height / 2;
      const stack = document.elementsFromPoint(pointX, pointY);
      const target = stack.find((element) => {
        if (menu.contains(element)) return false;
        return element.matches?.(contentSelector) || element.closest?.(contentSelector);
      });

      item.classList.toggle("is-contrast", Boolean(target));
    });
  }

  function requestUpdate() {
    if (frame !== null) return;
    frame = requestAnimationFrame(updateContrast);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  requestUpdate();

  return requestUpdate;
}

function clearMenuContrast(menu) {
  if (!menu) return;
  menu.querySelectorAll("a").forEach((item) => item.classList.remove("is-contrast"));
}

// Reproduce el video del titulo solo en desktop.
function initHomeTitleVideo() {
  const video = document.querySelector("[data-home-title-video]");
  if (!video || window.innerWidth < 900) return;

  video.currentTime = 0;
  const playPromise = video.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

// Controla el menu fijo y la flecha de la home.
function renderHome() {
  const desktopMenu = document.querySelector(".desktop-menu");
  const homeArrowButtons = document.querySelectorAll(".home-arrow");
  const refreshMenuContrast = bindMenuContrast(
    desktopMenu,
    ".project-card, .project-card__media, .project-card__media img",
  );

  // Define la posición inicial del menú antes de quedar fijo.
  function getHomeMenuTop() {
    const scale = getDesktopScale();
    const designTop = 949 * scale;
    const menuHeight = 90 * scale;
    const bottomMargin = 24;
    return Math.min(designTop, Math.max(0, window.innerHeight - menuHeight - bottomMargin));
  }

  // Cambia el estado del menú según el scroll y el tamaño de pantalla.
  function updateHomeMenuState() {
    if (!desktopMenu) return;

    if (window.innerWidth < 900) {
      desktopMenu.classList.remove("is-fixed");
      desktopMenu.style.top = `${getHomeMenuTop()}px`;
      return;
    }

    const initialTop = getHomeMenuTop();
    desktopMenu.style.top = `${initialTop}px`;

    if (window.scrollY >= initialTop - fixedHeaderTop) {
      desktopMenu.classList.add("is-fixed");
    } else {
      desktopMenu.classList.remove("is-fixed");
    }

    refreshMenuContrast();
  }

  homeArrowButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = window.innerWidth >= 900 ? 949 * getDesktopScale() : window.innerHeight * 0.72;
      window.scrollTo({ top: target, behavior: "smooth" });
    });
  });

  window.addEventListener("scroll", updateHomeMenuState, { passive: true });
  window.addEventListener("resize", updateHomeMenuState);
  updateHomeMenuState();
  initHomeTitleVideo();
}

// Ajusta la altura y el comportamiento comun de cada pagina de proyecto.
function renderProject() {
  const projectMenu = document.querySelector(".project-menu");
  const projectShell = document.querySelector(".project-shell");
  const heroFigure = document.querySelector("[data-project-hero]");
  const copyBlock = document.querySelector("[data-project-copy]");
  const lockMenuAccent = document.body.dataset.lockMenuAccent === "true";

  const refreshProjectMenuContrast = lockMenuAccent
    ? () => clearMenuContrast(projectMenu)
    : bindMenuContrast(projectMenu, ".project-figure, .project-figure img");

  // Ajusta el bloque de texto para calzarlo con el borde inferior del hero.
  function updateProjectCopyAlignment() {
    if (!copyBlock) return;

    const defaultTop = Number(copyBlock.dataset.defaultTop || 0);
    const alignToHero = copyBlock.dataset.alignCopyBottom === "true";
    const allowCopyAboveDefault = copyBlock.dataset.allowCopyAboveDefault === "true";
    const copyBottomOffset = Number(copyBlock.dataset.copyBottomOffset || 0);

    if (!alignToHero || window.innerWidth < 900 || !heroFigure) {
      copyBlock.style.top = `${defaultTop}px`;
      return;
    }

    const heroBottom = heroFigure.offsetTop + heroFigure.offsetHeight;
    const targetTop = heroBottom - copyBlock.offsetHeight + copyBottomOffset;
    const alignedTop = allowCopyAboveDefault ? targetTop : Math.max(defaultTop, targetTop);

    copyBlock.style.top = `${alignedTop}px`;
  }

  // Mantiene el encabezado del proyecto visible en desktop.
  function updateProjectMenuState() {
    if (!projectMenu) return;

    if (window.innerWidth < 900) {
      projectMenu.classList.remove("is-fixed");
      projectMenu.style.top = `${fixedHeaderTop}px`;
      return;
    }

    projectMenu.style.top = `${fixedHeaderTop}px`;
    projectMenu.classList.add("is-fixed");
    refreshProjectMenuContrast();
  }

  // Expone la altura total del lienzo para el CSS escalado.
  function updateProjectHeight() {
    if (!projectShell) return;
    document.documentElement.style.setProperty("--desktop-project-height", `${projectShell.offsetHeight}px`);
  }

  // Recalcula todos los ajustes dependientes del tamaño y las fuentes.
  function syncProjectLayout() {
    updateProjectCopyAlignment();
    updateProjectHeight();
    updateProjectMenuState();
  }

  requestAnimationFrame(syncProjectLayout);
  window.addEventListener("load", syncProjectLayout);
  window.addEventListener("resize", syncProjectLayout);
  window.addEventListener("scroll", refreshProjectMenuContrast, { passive: true });

  if (document.fonts?.ready) {
    document.fonts.ready.then(syncProjectLayout);
  }
}

// Decide qué comportamiento cargar según el tipo de página.
if (pageType === "project") {
  renderProject();
} else {
  renderHome();
}
