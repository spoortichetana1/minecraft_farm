const INVENTORY_ORDER = ["wheat", "seeds", "eggs", "wood", "stone"];

export function createHud() {
  const health = document.getElementById("hud-health");
  const time = document.getElementById("hud-time");
  const inventory = document.getElementById("hud-inventory");
  const status = document.getElementById("hud-status");
  let statusTimer = 0;

  return {
    setStatus(message, duration = 2) {
      status.textContent = message;
      statusTimer = duration;
    },
    update(deltaTime, context) {
      statusTimer = Math.max(0, statusTimer - deltaTime);

      health.textContent = `Health: ${Math.round(context.player.health)}`;
      time.textContent = `Time: ${context.time.getLabel()}`;
      inventory.textContent = INVENTORY_ORDER
        .map((item) => `${item}: ${context.inventory.items[item] ?? 0}`)
        .join(" | ");

      if (statusTimer <= 0) {
        status.textContent = "Click trees to collect wood. Survive the night.";
      }
    }
  };
}
