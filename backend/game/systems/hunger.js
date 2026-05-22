export const FOOD_VALUES = {
  foxMeat: 18,
  beef: 32,
  chickenMeat: 24,
  venison: 28
};

export function createHunger(maxValue = 100) {
  return {
    maxValue,
    currentHunger: maxValue,
    drainPerSecond: 0.45,
    update(deltaTime) {
      this.currentHunger = Math.max(0, this.currentHunger - this.drainPerSecond * deltaTime);
    },
    restore(amount) {
      if (amount <= 0 || this.currentHunger >= this.maxValue) return false;

      this.currentHunger = Math.min(this.maxValue, this.currentHunger + amount);
      return true;
    },
    setValue(value) {
      const parsed = Number(value);
      this.currentHunger = Number.isFinite(parsed)
        ? Math.max(0, Math.min(this.maxValue, parsed))
        : this.maxValue;
    },
    reset() {
      this.currentHunger = this.maxValue;
    },
    getState() {
      return {
        currentHunger: this.currentHunger
      };
    }
  };
}
