export function createDayNightSystem() {
  return {
    value: 0.3,
    dayLengthSeconds: 180,
    isNight: false,
    update(deltaTime, lighting) {
      this.value = (this.value + deltaTime / this.dayLengthSeconds) % 1;
      this.isNight = this.value >= 0.7 || this.value < 0.18;
      lighting.updateForDayNight(this);
    },
    getSunAngle() {
      return this.value * Math.PI * 2;
    },
    getDayAmount() {
      const sunHeight = Math.sin(this.getSunAngle());
      return Math.max(0, Math.min(1, sunHeight * 0.5 + 0.5));
    },
    getSunsetAmount() {
      const sunrise = Math.max(0, 1 - Math.abs(this.value - 0.03) / 0.08);
      const sunset = Math.max(0, 1 - Math.abs(this.value - 0.55) / 0.12);
      return Math.max(sunrise, sunset);
    },
    getLabel() {
      return this.isNight ? "Night" : "Day";
    }
  };
}
