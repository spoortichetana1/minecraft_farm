export function createTimeSystem() {
  return {
    value: 0.3,
    dayLengthSeconds: 90,
    update(deltaTime, context) {
      this.value = (this.value + deltaTime / this.dayLengthSeconds) % 1;
      context.lights.updateForTime(this);
    },
    isNight() {
      return this.value >= 0.68 || this.value < 0.18;
    },
    getLabel() {
      return this.isNight() ? "Night" : "Day";
    }
  };
}
