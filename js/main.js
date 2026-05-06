(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const state = window.FarmCraft.State.createGameState();

  window.FarmCraft.Api.loadGameState(state.inventory);
  window.FarmCraft.Input.bindInput(state, canvas);

  function gameLoop() {
    window.FarmCraft.Entities.update(state);
    window.FarmCraft.Render.draw(state, ctx);
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
})();
