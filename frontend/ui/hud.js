import { INVENTORY_LABELS, INVENTORY_TYPES } from "/game/systems/inventory.js";

export function createHud() {
  const health = document.getElementById("hud-health");
  const healthFill = document.getElementById("hud-health-fill");
  const hearts = document.getElementById("hud-hearts");
  const day = document.getElementById("hud-day");
  const time = document.getElementById("hud-time");
  const inventory = document.getElementById("hud-inventory");
  const status = document.getElementById("hud-status");
  const deathMessage = document.getElementById("death-message");
  const healthUi = document.querySelector(".health-ui");
  let statusTimer = 0;
  let deathTimer = 0;

  function renderHealth(playerHealth) {
    const current = Math.round(playerHealth.currentHealth);
    const max = playerHealth.maxValue;
    const percent = Math.max(0, Math.min(1, current / max));
    const fullHearts = Math.ceil(percent * 5);

    health.textContent = `Health: ${current} / ${max}`;
    healthFill.style.width = `${percent * 100}%`;
    hearts.textContent = `${"#".repeat(fullHearts)}${"-".repeat(5 - fullHearts)}`;
    healthUi.classList.toggle("is-invincible", playerHealth.isInvincible());
  }

  return {
    setStatus(message, duration = 2) {
      status.textContent = message;
      statusTimer = duration;
    },
    showDeathMessage(duration = 2.5) {
      deathMessage.classList.add("is-visible");
      deathTimer = duration;
      this.setStatus("YOU DIED", duration);
    },
    update(deltaTime, context) {
      statusTimer = Math.max(0, statusTimer - deltaTime);
      deathTimer = Math.max(0, deathTimer - deltaTime);

      renderHealth(context.player.health);
      day.textContent = `Day: ${context.dayNight.dayNumber}`;
      time.textContent = `Time: ${context.dayNight.getLabel()}`;
      inventory.textContent = ["wood", "wheat", ...INVENTORY_TYPES.filter((item) => item !== "wood" && item !== "wheat")]
        .map((item) => `${INVENTORY_LABELS[item]}: ${context.inventory.items[item] ?? 0}`)
        .join(" | ");

      if (deathTimer <= 0) {
        deathMessage.classList.remove("is-visible");
      }

      if (statusTimer <= 0) {
        status.textContent = context.dayNight.isNight
          ? "Night: stay sheltered and survive until sunrise."
          : "Day: gather wood, farm crops, and build shelter before night.";
      }
    }
  };
}
