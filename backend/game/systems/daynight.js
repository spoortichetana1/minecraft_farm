import { getNightDifficulty } from "./difficulty.js";

export function createDayNightSystem() {
  return {
    value: 0.3,
    dayLengthSeconds: 180,
    isNight: false,
    dayNumber: 1,
    currentNight: 1,
    nightsSurvived: 0,
    survivedNight: false,
    difficulty: getNightDifficulty(1),
    update(deltaTime, lighting) {
      const wasNight = this.isNight;

      this.value = (this.value + deltaTime / this.dayLengthSeconds) % 1;
      this.isNight = this.value >= 0.7 || this.value < 0.18;
      this.survivedNight = wasNight && !this.isNight;

      if (this.survivedNight) {
        this.dayNumber++;
        this.nightsSurvived++;
        this.currentNight++;
        this.difficulty = getNightDifficulty(this.currentNight);
      }

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
      if (!this.isNight) return "Day";

      return this.difficulty.bloodMoon ? `Blood Moon ${this.currentNight}` : `Night ${this.currentNight}`;
    },
    getNightDifficulty() {
      return this.difficulty;
    },
    isBloodMoonApproaching() {
      return !this.isNight && this.difficulty.bloodMoon && this.value >= 0.55 && this.value < 0.7;
    }
  };
}
