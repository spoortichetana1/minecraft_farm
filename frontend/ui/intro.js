export function createIntroOverlay(options = {}) {
  const overlay = document.getElementById("intro-overlay");
  const startButton = document.getElementById("intro-start");
  const howToPlayButton = document.getElementById("how-to-play-button");
  const settingsButton = document.getElementById("settings-button");
  const howToPlayModal = document.getElementById("how-to-play-modal");
  const settingsPanel = document.getElementById("settings-panel");
  const howToPlayClose = document.getElementById("how-to-play-close");
  const settingsClose = document.getElementById("settings-close");
  const fullscreenToggle = document.getElementById("fullscreen-toggle");
  let started = false;

  console.log("[SurvivorCraft] Menu initialized", {
    overlayFound: Boolean(overlay),
    startButtonFound: Boolean(startButton)
  });

  function showPanel(panel) {
    howToPlayModal?.classList.remove("is-visible");
    settingsPanel?.classList.remove("is-visible");
    howToPlayModal?.setAttribute("aria-hidden", "true");
    settingsPanel?.setAttribute("aria-hidden", "true");

    panel?.classList.add("is-visible");
    panel?.setAttribute("aria-hidden", "false");
    panel?.querySelector("button")?.focus();
  }

  function closePanels() {
    howToPlayModal?.classList.remove("is-visible");
    settingsPanel?.classList.remove("is-visible");
    howToPlayModal?.setAttribute("aria-hidden", "true");
    settingsPanel?.setAttribute("aria-hidden", "true");
    startButton?.focus();
  }

  function startGame() {
    console.log("[SurvivorCraft] Start button clicked", {
      gameStarted: started
    });

    if (started) return;

    started = true;
    closePanels();
    overlay?.classList.add("is-hidden");
    overlay?.setAttribute("aria-hidden", "true");
    startButton?.blur();
    console.log("[SurvivorCraft] Menu hidden", {
      overlayHidden: overlay?.classList.contains("is-hidden"),
      pointerEvents: overlay ? getComputedStyle(overlay).pointerEvents : null
    });
    options.onStart?.();
  }

  startButton?.addEventListener("click", startGame);
  howToPlayButton?.addEventListener("click", () => showPanel(howToPlayModal));
  settingsButton?.addEventListener("click", () => showPanel(settingsPanel));
  howToPlayClose?.addEventListener("click", closePanels);
  settingsClose?.addEventListener("click", closePanels);
  fullscreenToggle?.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  });
  startButton?.focus();

  return {
    isStarted() {
      return started;
    }
  };
}
