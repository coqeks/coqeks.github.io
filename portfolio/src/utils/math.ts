export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
export const easeOutCubic = (p: number) => 1 - (1 - p) ** 3
export const easeInCubic = (p: number) => p * p * p