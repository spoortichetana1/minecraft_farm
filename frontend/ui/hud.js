import { INVENTORY_LABELS, INVENTORY_TYPES } from "../systems/inventory.js";

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

      health.textContent = `Health: ${Math.round(context.player.health.currentHealth)}`;
      time.textContent = `Time: ${context.dayNight.getLabel()}`;
      inventory.textContent = INVENTORY_TYPES
        .map((item) => `${INVENTORY_LABELS[item]}: ${context.inventory.items[item] ?? 0}`)
        .join(" | ");

      if (statusTimer <= 0) {
        status.textContent = "1-5 select blocks. Right click places. Left click removes or interacts.";
      }
    }
  };
}
