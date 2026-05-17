import { BUILDABLE_BLOCKS } from "/backend/game/world/building.js";
import { TOOL_ITEMS } from "/backend/game/player/tools.js";

const HOTBAR_ITEMS = [
  ...TOOL_ITEMS,
  ...BUILDABLE_BLOCKS.map((block) => ({ ...block, kind: "block" }))
];

function renderItemIcon(item) {
  if (item.icon === "axe") {
    return `
      <span class="hotbar-axe" aria-hidden="true">
        <span class="hotbar-axe-handle"></span>
        <span class="hotbar-axe-collar"></span>
        <span class="hotbar-axe-head"></span>
        <span class="hotbar-axe-edge"></span>
      </span>
    `;
  }

  return `<span class="hotbar-swatch" style="background:#${item.color.toString(16).padStart(6, "0")}"></span>`;
}

export function createHotbar() {
  const root = document.getElementById("hotbar");
  let selectedIndex = 0;
  const selectionListeners = new Set();

  function selectedItem() {
    return HOTBAR_ITEMS[selectedIndex];
  }

  function setSelectedIndex(index) {
    selectedIndex = index;
    render();
    for (const listener of selectionListeners) listener(selectedItem());
  }

  function render() {
    if (!root) return;

    root.replaceChildren();
    HOTBAR_ITEMS.forEach((item, index) => {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = `hotbar-slot${index === selectedIndex ? " is-selected" : ""}`;
      slot.setAttribute("aria-label", `Select ${item.label}`);
      slot.innerHTML = `
        <span class="hotbar-key">${index + 1}</span>
        ${renderItemIcon(item)}
        <span class="hotbar-label">${item.label}</span>
      `;
      slot.addEventListener("click", () => {
        setSelectedIndex(index);
      });
      root.appendChild(slot);
    });
  }

  document.addEventListener("keydown", (event) => {
    const slotNumber = Number(event.key);
    if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > HOTBAR_ITEMS.length) return;

    setSelectedIndex(slotNumber - 1);
  });

  render();

  return {
    getSelectedItem() {
      return selectedItem();
    },
    onSelectionChange(callback) {
      selectionListeners.add(callback);
      callback(selectedItem());
      return () => selectionListeners.delete(callback);
    },
    update() {
      // Selection changes are event-driven through number keys or direct slot clicks.
    }
  };
}
