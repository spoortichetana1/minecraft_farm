(function () {
  const { Config, Interactions } = window.FarmCraft;
  const { TILE_SIZE, PLACEABLE_BLOCKS } = Config;

  function bindInput(state, canvas) {
    document.addEventListener("keydown", (event) => {
      state.keys[event.code] = true;

      if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(event.code)) {
        event.preventDefault();
      }

      const digit = Number(event.code.replace("Digit", ""));
      if (Number.isInteger(digit) && digit >= 1 && digit <= PLACEABLE_BLOCKS.length) {
        state.selectedBlockIndex = digit - 1;
      }
    });

    document.addEventListener("keyup", (event) => {
      state.keys[event.code] = false;
    });

    canvas.addEventListener("mousemove", (event) => updateMouseTile(state, canvas, event));
    canvas.addEventListener("mouseleave", () => {
      state.mouseTile = { x: -1, y: -1 };
    });

    canvas.addEventListener("mousedown", (event) => {
      updateMouseTile(state, canvas, event);

      if (event.button === 0 && !Interactions.harvestCrop(state, state.mouseTile.x, state.mouseTile.y)) {
        Interactions.placeBlock(state, state.mouseTile.x, state.mouseTile.y);
      } else if (event.button === 2) {
        Interactions.breakBlock(state, state.mouseTile.x, state.mouseTile.y);
      }
    });

    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  function updateMouseTile(state, canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    state.mouseTile = {
      x: Math.floor((mouseX + state.cameraX) / TILE_SIZE),
      y: Math.floor((mouseY + state.cameraY) / TILE_SIZE)
    };
  }

  window.FarmCraft.Input = {
    bindInput,
    updateMouseTile
  };
})();
