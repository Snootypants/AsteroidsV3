import * as THREE from 'three';

// Exact collision detection from vanilla implementation

export const circleHit = (
  ax: number, 
  ay: number, 
  ar: number, 
  bx: number, 
  by: number, 
  br: number
): boolean => {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy <= rr * rr;
};

// Check collision between two Three.js objects with userData.radius
export const checkEntityCollision = (
  a: THREE.Object3D & { userData: { radius: number } },
  b: THREE.Object3D & { userData: { radius: number } }
): boolean => {
  return circleHit(
    a.position.x, a.position.y, a.userData.radius,
    b.position.x, b.position.y, b.userData.radius
  );
};

// Check if point is within circle
export const pointInCircle = (
  px: number, 
  py: number, 
  cx: number, 
  cy: number, 
  radius: number
): boolean => {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
};

// Get all entities within radius of a position
export const getEntitiesInRange = <T extends THREE.Object3D & { userData: { radius: number } }>(
  entities: T[],
  centerX: number,
  centerY: number,
  range: number
): T[] => {
  return entities.filter(entity => 
    circleHit(centerX, centerY, range, entity.position.x, entity.position.y, entity.userData.radius)
  );
};

// Find closest entity to a position
export const findClosestEntity = <T extends THREE.Object3D>(
  entities: T[],
  targetX: number,
  targetY: number
): T | null => {
  if (entities.length === 0) return null;
  
  let closest = entities[0];
  let closestDistance = Number.MAX_VALUE;
  
  for (const entity of entities) {
    const dx = entity.position.x - targetX;
    const dy = entity.position.y - targetY;
    const distance = dx * dx + dy * dy;
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = entity;
    }
  }
  
  return closest;
};