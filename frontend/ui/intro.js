export function createIntroOverlay(options = {}) {
  const overlay = document.getElementById("intro-overlay");
  let started = false;

  function startGame() {
    if (started) return;

    started = true;
    overlay?.classList.add("is-hidden");
    options.onStart?.();
  }

  document.addEventListener("keydown", (event) => {
    if (event.code !== "Enter") return;

    event.preventDefault();
    startGame();
  });

  return {
    isStarted() {
      return started;
    }
  };
}
