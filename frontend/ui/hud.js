import { INVENTORY_LABELS, INVENTORY_TYPES } from "/backend/game/systems/inventory.js";

export function createHud() {
  const health = document.getElementById("hud-health");
  const healthFill = document.getElementById("hud-health-fill");
  const hearts = document.getElementById("hud-hearts");
  const day = document.getElementById("hud-day");
  const night = document.getElementById("hud-night");
  const time = document.getElementById("hud-time");
  const inventory = document.getElementById("hud-inventory");
  const status = document.getElementById("hud-status");
  const deathMessage = document.getElementById("death-message");
  const healthUi = document.querySelector(".health-ui");
  const floatingTextLayer = document.createElement("div");
  let statusTimer = 0;
  let deathTimer = 0;

  floatingTextLayer.className = "floating-text-layer";
  floatingTextLayer.setAttribute("aria-hidden", "true");
  document.body.appendChild(floatingTextLayer);

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
    showFloatingText(message) {
      const text = document.createElement("div");
      text.className = "floating-text";
      text.textContent = message;
      floatingTextLayer.appendChild(text);
      text.addEventListener("animationend", () => text.remove(), { once: true });
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
      night.textContent = `Night ${context.dayNight.currentNight}`;
      time.textContent = `Time: ${context.dayNight.getLabel()}`;
      inventory.textContent = INVENTORY_TYPES
        .map((item) => `${INVENTORY_LABELS[item]}: ${context.inventory.items[item] ?? 0}`)
        .join(" | ");

      if (deathTimer <= 0) {
        deathMessage.classList.remove("is-visible");
      }

      if (statusTimer <= 0) {
        if (context.dayNight.isBloodMoonApproaching()) {
          status.textContent = "Blood Moon Approaches...";
        } else if (context.dayNight.getNightDifficulty().bloodMoon && context.dayNight.isNight) {
          status.textContent = `Blood Moon ${context.dayNight.currentNight}: survive the onslaught.`;
        } else {
          status.textContent = context.dayNight.isNight
            ? `Night ${context.dayNight.currentNight}: stay sheltered and survive until sunrise.`
            : "Day: chop wood, collect meat, and build shelter before night.";
        }
      }
    }
  };
}
