// Small shared utilities for the app

export function formatISO(date: Date): string {
  return date.toISOString();
}

export function clamp(n: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, n));
}
