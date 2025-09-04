import * as THREE from 'three';
import { WORLD } from '../constants/gameConstants';

/**
 * Abstract base class for all game entities
 * Provides common physics, positioning, and lifecycle management
 */
export abstract class BaseEntity {
  // Core properties
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public rotation: number;
  public radius: number;
  public age: number;
  public active: boolean;

  // Three.js mesh reference
  public mesh?: THREE.Object3D;

  constructor(
    x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    radius = 1
  ) {
    this.position = new THREE.Vector3(x, y, 0);
    this.velocity = new THREE.Vector3(vx, vy, 0);
    this.rotation = 0;
    this.radius = radius;
    this.age = 0;
    this.active = true;
  }

  /**
   * Update entity physics and state
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    if (!this.active) return;

    // Update age
    this.age += dt;

    // Update position based on velocity
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    // World wrapping - seamless boundaries
    this.wrapPosition();

    // Update mesh position if it exists
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.z = this.rotation;
    }

    // Call entity-specific update logic
    this.onUpdate(dt);
  }

  /**
   * World wrapping logic for seamless boundaries
   * Entities smoothly wrap from one edge to the other
   */
  protected wrapPosition(): void {
    const halfWidth = WORLD.width / 2;
    const halfHeight = WORLD.height / 2;

    // Wrap X coordinate
    if (this.position.x > halfWidth) {
      this.position.x = -halfWidth;
    } else if (this.position.x < -halfWidth) {
      this.position.x = halfWidth;
    }

    // Wrap Y coordinate
    if (this.position.y > halfHeight) {
      this.position.y = -halfHeight;
    } else if (this.position.y < -halfHeight) {
      this.position.y = halfHeight;
    }
  }

  /**
   * Check collision with another entity using circle-circle detection
   * @param other Other entity to check collision with
   * @returns True if entities are colliding
   */
  public collidesWith(other: BaseEntity): boolean {
    if (!this.active || !other.active) return false;
    
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (this.radius + other.radius);
  }

  /**
   * Get distance to another entity
   * @param other Other entity
   * @returns Distance in world units
   */
  public distanceTo(other: BaseEntity): number {
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get normalized direction vector to another entity
   * @param other Other entity
   * @returns Direction vector (normalized)
   */
  public directionTo(other: BaseEntity): THREE.Vector3 {
    const direction = new THREE.Vector3()
      .subVectors(other.position, this.position)
      .normalize();
    return direction;
  }

  /**
   * Apply force to entity (adds to velocity)
   * @param fx Force X component
   * @param fy Force Y component
   * @param dt Delta time for integration
   */
  public applyForce(fx: number, fy: number, dt: number): void {
    this.velocity.x += fx * dt;
    this.velocity.y += fy * dt;
  }

  /**
   * Spawn the entity (create and add mesh to scene)
   * @param scene Three.js scene to add to
   */
  public spawn(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.add(this.mesh);
    }
    this.active = true;
    this.onSpawn();
  }

  /**
   * Despawn the entity (remove mesh from scene and deactivate)
   * @param scene Three.js scene to remove from
   */
  public despawn(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.remove(this.mesh);
    }
    this.active = false;
    this.onDespawn();
  }

  /**
   * Reset entity to initial state for object pooling
   * @param x New X position
   * @param y New Y position
   * @param vx New X velocity
   * @param vy New Y velocity
   */
  public reset(x = 0, y = 0, vx = 0, vy = 0): void {
    this.position.set(x, y, 0);
    this.velocity.set(vx, vy, 0);
    this.rotation = 0;
    this.age = 0;
    this.active = true;
    this.onReset();
  }

  /**
   * Abstract methods for entity-specific behavior
   * Must be implemented by derived classes
   */
  protected abstract onUpdate(dt: number): void;
  protected abstract onSpawn(): void;
  protected abstract onDespawn(): void;
  protected abstract onReset(): void;

  /**
   * Abstract method for creating the Three.js mesh
   * Must be implemented by derived classes
   */
  protected abstract createMesh(): THREE.Object3D;
}