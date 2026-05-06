(function () {
  const { Config, World } = window.FarmCraft;
  const { WORLD_WIDTH, WORLD_HEIGHT } = Config;

  function createGameState() {
    const { world, heightMap } = World.generateWorld();
    const state = {
      world,
      heightMap,
      cropTimers: Array.from({ length: WORLD_HEIGHT }, () => Array(WORLD_WIDTH).fill(0)),
      selectedBlockIndex: 0,
      timeOfDay: 0,
      cameraX: 0,
      cameraY: 0,
      inventory: window.inventory,
      statusMessage: "A/D move, Space jump, 1-5 select, LMB place, RMB break",
      statusTimer: 240,
      mouseTile: { x: -1, y: -1 },
      keys: {},
      player: {
        x: 100,
        y: 100,
        width: 28,
        height: 28,
        vx: 0,
        vy: 0,
        speed: 3,
        jumping: false
      },
      animals: [
        {
          x: 600,
          y: 0,
          width: 24,
          height: 20,
          vx: 0,
          vy: 0,
          speed: 1,
          dir: 1,
          color: "#ffcc99",
          eggTimer: 0,
          eggFlashTimer: 0
        },
        {
          x: 1200,
          y: 0,
          width: 24,
          height: 20,
          vx: 0,
          vy: 0,
          speed: 1,
          dir: -1,
          color: "#ffffff",
          eggTimer: 180,
          eggFlashTimer: 0
        }
      ]
    };

    window.FarmCraft.Entities.placePlayerAtSpawn(state);
    return state;
  }

  function setStatus(state, message, duration = 120) {
    state.statusMessage = message;
    state.statusTimer = duration;
  }

  window.FarmCraft.State = {
    createGameState,
    setStatus
  };
})();
