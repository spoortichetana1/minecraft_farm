export const INVENTORY_LABELS = {
  wood: "Wood",
  meat: "Meat",
  stone: "Stone"
};

export const INVENTORY_TYPES = Object.keys(INVENTORY_LABELS);

function createStartingItems() {
  return {
    wood: 0,
    meat: 0,
    stone: 0
  };
}

export function createInventory() {
  const items = createStartingItems();

  function hasItemType(type) {
    return Object.prototype.hasOwnProperty.call(items, type);
  }

  return {
    items,
    addItem(type, amount) {
      if (!hasItemType(type) || amount <= 0) return false;

      items[type] += amount;
      return true;
    },
    removeItem(type, amount) {
      if (!hasItemType(type) || amount <= 0 || items[type] < amount) return false;

      items[type] -= amount;
      return true;
    },
    setItems(savedItems = {}) {
      for (const type of INVENTORY_TYPES) {
        const value = Number(savedItems[type]);
        items[type] = Number.isFinite(value) && value >= 0 ? value : 0;
      }
    },
    getItems() {
      return items;
    },
    getState() {
      return { ...items };
    }
  };
}
