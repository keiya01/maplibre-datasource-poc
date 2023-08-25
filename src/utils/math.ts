export const randomValue = (n: number) => Math.random() * n;

export const clamp = (min: number, v: number, max: number) => Math.min(Math.max(v, min), max);

export const clampColor = (v: number) => clamp(0, v, 255);
