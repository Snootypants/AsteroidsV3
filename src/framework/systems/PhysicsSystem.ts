import * as THREE from 'three';
import { BaseEntity } from '../entities/BaseEntity';
import { WORLD } from '../constants/gameConstants';

/**
 * Physics system for managing entity movement, world wrapping, and physics calculations
 * Centralized physics management for all entities
 */
export class PhysicsSystem {
  // World bounds
  private static readonly WORLD_WIDTH = WORLD.width;
  private static readonly WORLD_HEIGHT = WORLD.height;
  
  // Physics constants
  private static readonly MAX_VELOCITY = 200; // Maximum velocity clamp
  private static readonly MIN_VELOCITY = 0.1; // Minimum velocity threshold
  
  /**
   * Update physics for all entities
   * @param entities Array of entities to update
   * @param dt Delta time in seconds
   */
  public static updateEntities(entities: BaseEntity[], dt: number): void {
    for (const entity of entities) {
      if (!entity.active) continue;
      
      // Update position based on velocity
      this.updatePosition(entity, dt);
      
      // Apply world wrapping
      this.wrapPosition(entity);
      
      // Update rotation
      this.updateRotation(entity, dt);
      
      // Clamp velocities
      this.clampVelocity(entity);
    }
  }
  
  /**
   * Update entity position based on velocity and delta time
   * @param entity Entity to update
   * @param dt Delta time in seconds
   */
  private static updatePosition(entity: BaseEntity, dt: number): void {
    entity.position.x += entity.velocity.x * dt;
    entity.position.y += entity.velocity.y * dt;
    entity.position.z += entity.velocity.z * dt;
  }
  
  /**
   * Wrap entity position around world boundaries
   * @param entity Entity to wrap
   */
  private static wrapPosition(entity: BaseEntity): void {
    const halfWidth = this.WORLD_WIDTH / 2;
    const halfHeight = this.WORLD_HEIGHT / 2;
    
    // Wrap X coordinate
    if (entity.position.x > halfWidth + entity.radius) {
      entity.position.x = -halfWidth - entity.radius;
    } else if (entity.position.x < -halfWidth - entity.radius) {
      entity.position.x = halfWidth + entity.radius;
    }
    
    // Wrap Y coordinate
    if (entity.position.y > halfHeight + entity.radius) {
      entity.position.y = -halfHeight - entity.radius;
    } else if (entity.position.y < -halfHeight - entity.radius) {
      entity.position.y = halfHeight + entity.radius;
    }
  }
  
  /**
   * Update entity rotation
   * @param entity Entity to update
   * @param _dt Delta time in seconds
   */
  private static updateRotation(entity: BaseEntity, _dt: number): void {
    // Angular velocity is stored in entity.angularVelocity if needed
    // For now, rotation is managed by individual entities
    if (entity.mesh) {
      entity.mesh.rotation.z = entity.rotation;
    }
  }
  
  /**
   * Clamp entity velocity to prevent excessive speeds
   * @param entity Entity to clamp
   */
  private static clampVelocity(entity: BaseEntity): void {
    const speed = entity.velocity.length();
    
    if (speed > this.MAX_VELOCITY) {
      entity.velocity.normalize().multiplyScalar(this.MAX_VELOCITY);
    } else if (speed < this.MIN_VELOCITY && speed > 0) {
      // Apply minimum velocity threshold to prevent micro-movements
      entity.velocity.normalize().multiplyScalar(this.MIN_VELOCITY);
    }
  }
  
  /**
   * Apply force to an entity
   * @param entity Entity to apply force to
   * @param forceX Force in X direction
   * @param forceY Force in Y direction
   * @param dt Delta time in seconds
   */
  public static applyForce(entity: BaseEntity, forceX: number, forceY: number, dt: number): void {
    entity.velocity.x += forceX * dt;
    entity.velocity.y += forceY * dt;
  }
  
  /**
   * Apply impulse to an entity (instantaneous velocity change)
   * @param entity Entity to apply impulse to
   * @param impulseX Impulse in X direction
   * @param impulseY Impulse in Y direction
   */
  public static applyImpulse(entity: BaseEntity, impulseX: number, impulseY: number): void {
    entity.velocity.x += impulseX;
    entity.velocity.y += impulseY;
  }
  
  /**
   * Calculate distance between two entities
   * @param entityA First entity
   * @param entityB Second entity
   * @returns Distance between entities
   */
  public static getDistance(entityA: BaseEntity, entityB: BaseEntity): number {
    return entityA.position.distanceTo(entityB.position);
  }
  
  /**
   * Calculate direction vector from entity A to entity B
   * @param entityA Source entity
   * @param entityB Target entity
   * @returns Normalized direction vector
   */
  public static getDirection(entityA: BaseEntity, entityB: BaseEntity): THREE.Vector3 {
    const direction = new THREE.Vector3();
    direction.subVectors(entityB.position, entityA.position);
    direction.normalize();
    return direction;
  }
  
  /**
   * Check if two entities are colliding (circle-circle collision)
   * @param entityA First entity
   * @param entityB Second entity
   * @returns True if entities are colliding
   */
  public static areColliding(entityA: BaseEntity, entityB: BaseEntity): boolean {
    const distance = this.getDistance(entityA, entityB);
    return distance < (entityA.radius + entityB.radius);
  }
  
  /**
   * Resolve collision between two entities with elastic collision response
   * @param entityA First entity
   * @param entityB Second entity
   */
  public static resolveCollision(entityA: BaseEntity, entityB: BaseEntity): void {
    const distance = this.getDistance(entityA, entityB);
    const minDistance = entityA.radius + entityB.radius;
    
    if (distance >= minDistance) return; // No collision
    
    // Calculate collision normal
    const normal = this.getDirection(entityA, entityB);
    
    // Separate entities
    const overlap = minDistance - distance;
    const separation = overlap / 2;
    
    entityA.position.x -= normal.x * separation;
    entityA.position.y -= normal.y * separation;
    entityB.position.x += normal.x * separation;
    entityB.position.y += normal.y * separation;
    
    // Calculate relative velocity
    const relativeVelocity = new THREE.Vector3();
    relativeVelocity.subVectors(entityB.velocity, entityA.velocity);
    
    // Calculate relative velocity along collision normal
    const velocityAlongNormal = relativeVelocity.dot(normal);
    
    // Objects are separating, no need to resolve
    if (velocityAlongNormal > 0) return;
    
    // Calculate impulse magnitude (assuming equal mass for simplicity)
    const restitution = 0.8; // Coefficient of restitution
    const impulseMagnitude = -(1 + restitution) * velocityAlongNormal / 2;
    
    // Apply impulse
    const impulse = normal.clone().multiplyScalar(impulseMagnitude);
    entityA.velocity.sub(impulse);
    entityB.velocity.add(impulse);
  }
  
  /**
   * Check if a point is within world bounds
   * @param x X coordinate
   * @param y Y coordinate
   * @returns True if point is within bounds
   */
  public static isWithinBounds(x: number, y: number): boolean {
    const halfWidth = this.WORLD_WIDTH / 2;
    const halfHeight = this.WORLD_HEIGHT / 2;
    
    return (
      x >= -halfWidth && x <= halfWidth &&
      y >= -halfHeight && y <= halfHeight
    );
  }
  
  /**
   * Get a random position within world bounds
   * @param margin Margin from edges (default: 50)
   * @returns Random position vector
   */
  public static getRandomPosition(margin: number = 50): THREE.Vector3 {
    const halfWidth = this.WORLD_WIDTH / 2 - margin;
    const halfHeight = this.WORLD_HEIGHT / 2 - margin;
    
    return new THREE.Vector3(
      (Math.random() - 0.5) * 2 * halfWidth,
      (Math.random() - 0.5) * 2 * halfHeight,
      0
    );
  }
  
  /**
   * Get a random velocity vector
   * @param minSpeed Minimum speed
   * @param maxSpeed Maximum speed
   * @returns Random velocity vector
   */
  public static getRandomVelocity(minSpeed: number, maxSpeed: number): THREE.Vector3 {
    const angle = Math.random() * Math.PI * 2;
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    
    return new THREE.Vector3(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      0
    );
  }
}