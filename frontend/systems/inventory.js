const STARTING_ITEMS = {
  wheat: 0,
  seeds: 0,
  eggs: 0,
  wood: 0,
  stone: 0
};

export function createInventory() {
  const items = { ...STARTING_ITEMS };

  return {
    items,
    addItem(itemName, amount) {
      if (!Object.prototype.hasOwnProperty.call(items, itemName)) {
        items[itemName] = 0;
      }

      items[itemName] = Math.max(0, items[itemName] + amount);
      return items[itemName];
    },
    getItems() {
      return items;
    }
  };
}
