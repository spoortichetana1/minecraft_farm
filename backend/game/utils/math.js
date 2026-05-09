export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}
