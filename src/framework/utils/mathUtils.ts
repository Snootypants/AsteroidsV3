import * as THREE from 'three';
import { WORLD } from '../constants/gameConstants';

// Exact utility functions from vanilla implementation

export const rand = (a: number, b: number): number => {
  return a + Math.random() * (b - a);
};

export const randSign = (): number => {
  return Math.random() < 0.5 ? -1 : 1;
};

export const clampMag = (vx: number, vy: number, max: number): [number, number] => {
  const m2 = vx * vx + vy * vy;
  if (m2 > max * max) {
    const m = Math.sqrt(m2);
    return [(vx / m) * max, (vy / m) * max];
  }
  return [vx, vy];
};

// Basic 2D wrapping in X/Y plane (uses full world bounds, not visible area)
export const wrap = (obj: THREE.Object3D): void => {
  // Fixed 750x498 world wrapping - NEVER changes
  const halfWorldX = WORLD.width * 0.5;  // 375 units
  const halfWorldY = WORLD.height * 0.5; // 249 units
  
  if (obj.position.x > halfWorldX) obj.position.x = -halfWorldX;
  if (obj.position.x < -halfWorldX) obj.position.x = halfWorldX;
  if (obj.position.y > halfWorldY) obj.position.y = -halfWorldY;
  if (obj.position.y < -halfWorldY) obj.position.y = halfWorldY;
};

// Convert screen coordinates to world coordinates
export const screenToWorld = (
  sx: number, 
  sy: number, 
  camera: THREE.OrthographicCamera
): THREE.Vector3 => {
  const ndcX = (sx / window.innerWidth) * 2 - 1;
  const ndcY = -(sy / window.innerHeight) * 2 + 1;
  const wx = THREE.MathUtils.mapLinear(ndcX, -1, 1, camera.left, camera.right) + camera.position.x;
  const wy = THREE.MathUtils.mapLinear(ndcY, -1, 1, camera.bottom, camera.top) + camera.position.y;
  return new THREE.Vector3(wx, wy, 0);
};

// Bell curve brightness distribution using Box-Muller transform
export const normalRandom = (mean: number = 0, stdDev: number = 1): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
};

// Generate bell curve brightness for stars
export const generateStarBrightness = (): number => {
  const z0 = normalRandom();
  // Convert normal distribution to brightness range with bell curve centered on dim stars
  // Most stars dim (0.2-0.8), fewer medium (0.8-1.4), very few bright (1.4-2.0) - doubled brightness
  const normalizedBrightness = Math.max(0.2, Math.min(2.0, (0.35 + z0 * 0.15) * 2.0));
  return normalizedBrightness;
};

// Distance calculation helper
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
};

// Angle between two points
export const angleBetween = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.atan2(y2 - y1, x2 - x1);
};

// Lerp function for smooth interpolation
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

// Clamp value between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};