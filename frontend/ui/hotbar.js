import { BUILDABLE_BLOCKS } from "/backend/game/world/building.js";

export function createHotbar() {
  const root = document.getElementById("hotbar");
  let selectedIndex = 0;

  function render() {
    if (!root) return;

    root.replaceChildren();
    BUILDABLE_BLOCKS.forEach((item, index) => {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = `hotbar-slot${index === selectedIndex ? " is-selected" : ""}`;
      slot.setAttribute("aria-label", `Select ${item.label}`);
      slot.innerHTML = `
        <span class="hotbar-key">${index + 1}</span>
        <span class="hotbar-swatch" style="background:#${item.color.toString(16).padStart(6, "0")}"></span>
        <span class="hotbar-label">${item.label}</span>
      `;
      slot.addEventListener("click", () => {
        selectedIndex = index;
        render();
      });
      root.appendChild(slot);
    });
  }

  document.addEventListener("keydown", (event) => {
    const slotNumber = Number(event.key);
    if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > BUILDABLE_BLOCKS.length) return;

    selectedIndex = slotNumber - 1;
    render();
  });

  render();

  return {
    getSelectedItem() {
      return BUILDABLE_BLOCKS[selectedIndex];
    },
    update() {
      // Selection changes are event-driven through number keys or direct slot clicks.
    }
  };
}
