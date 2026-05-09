export function createIntroOverlay(options = {}) {
  const overlay = document.getElementById("intro-overlay");
  const startButton = document.getElementById("intro-start");
  let started = false;

  function startGame() {
    if (started) return;

    started = true;
    overlay?.classList.add("is-hidden");
    options.onStart?.();
  }

  function handleStartKey(event) {
    if (event.key !== "Enter" && event.code !== "Enter" && event.code !== "NumpadEnter") return;

    event.preventDefault();
    startGame();
  }

  startButton?.addEventListener("click", startGame);
  window.addEventListener("keydown", handleStartKey, true);
  startButton?.focus();

  return {
    isStarted() {
      return started;
    }
  };
}
