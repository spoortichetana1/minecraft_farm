(function () {
  window.FarmCraft = window.FarmCraft || {};

  async function loadGameState(inventory) {
    try {
      const response = await fetch("/api/game-state");
      if (!response.ok) return;

      const gameState = await response.json();
      if (gameState.inventory) {
        inventory.wheat = gameState.inventory.wheat ?? inventory.wheat;
        inventory.eggs = gameState.inventory.eggs ?? inventory.eggs;
      }
    } catch (error) {
      console.warn("Backend state load failed. Using local state.", error);
    }
  }

  async function saveGameState(inventory) {
    try {
      await fetch("/api/game-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory })
      });
    } catch (error) {
      console.warn("Backend state save failed. Keeping local state.", error);
    }
  }

  window.FarmCraft.Api = {
    loadGameState,
    saveGameState
  };
})();
