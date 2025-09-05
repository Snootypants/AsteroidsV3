import * as THREE from 'three';
import { BaseEntity } from './BaseEntity';
import { Bullet } from './Bullet';
import { PLAYER } from '../constants/gameConstants';

/**
 * Player ship entity with movement, rotation, and visual effects
 * Matches vanilla implementation exactly
 */
export class Ship extends BaseEntity {
  // Ship-specific properties
  private targetRotation: number = 0;
  private thrusting: boolean = false;
  private thrustingReverse: boolean = false;
  private invulnerable: boolean = false;
  private invulnTime: number = 0;

  // Visual components
  private shipMesh?: THREE.Mesh;
  private shieldMesh?: THREE.Mesh;
  private boostFlames: THREE.Mesh[] = [];

  // Materials
  private static shipMaterial?: THREE.MeshBasicMaterial;
  private static shieldMaterial?: THREE.MeshBasicMaterial;
  private static flameMaterial?: THREE.MeshBasicMaterial;

  constructor(x = 0, y = 0) {
    super(x, y, 0, 0, PLAYER.radius);
    this.mesh = this.createMesh();
  }

  protected createMesh(): THREE.Object3D {
    const group = new THREE.Group();

    // Create ship mesh with texture
    this.createShipMesh(group);
    
    // Create shield visual
    this.createShieldMesh(group);
    
    // Create boost flame effects
    this.createBoostFlames(group);

    return group;
  }

  private createShipMesh(group: THREE.Group): void {
    // Create ship material with fallback
    if (!Ship.shipMaterial) {
      Ship.shipMaterial = new THREE.MeshBasicMaterial({
        color: 0x4a90e2,
        transparent: true,
      });
      
      // Try to load ship texture asynchronously
      const loader = new THREE.TextureLoader();
      loader.load(
        '/src/assets/ship/ship.png',
        (texture) => {
          // Success callback
          Ship.shipMaterial!.map = texture;
          Ship.shipMaterial!.color.setHex(0xffffff); // Reset color to white when texture loads
          Ship.shipMaterial!.needsUpdate = true;
          console.log('[Ship] Texture loaded successfully');
        },
        undefined,
        (error) => {
          // Error callback - keep using colored material
          console.warn('[Ship] Failed to load texture, using colored fallback:', error);
        }
      );
    }

    // Create ship geometry (plane for texture or triangle for fallback)
    const geometry = new THREE.PlaneGeometry(3, 3);
    this.shipMesh = new THREE.Mesh(geometry, Ship.shipMaterial);
    
    group.add(this.shipMesh);
    console.log('[Ship] Ship mesh created');
  }

  private createShieldMesh(group: THREE.Group): void {
    // Create shield material
    if (!Ship.shieldMaterial) {
      Ship.shieldMaterial = new THREE.MeshBasicMaterial({
        color: 0x4a90e2,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
    }

    // Create shield geometry (circle)
    const shieldGeometry = new THREE.RingGeometry(2.8, 3.2, 16);
    this.shieldMesh = new THREE.Mesh(shieldGeometry, Ship.shieldMaterial);
    
    group.add(this.shieldMesh);
  }

  private createBoostFlames(group: THREE.Group): void {
    // Create flame material
    if (!Ship.flameMaterial) {
      Ship.flameMaterial = new THREE.MeshBasicMaterial({
        color: 0x4a90e2,
        transparent: true,
        opacity: 0.8
      });
    }

    // Create two small flame meshes
    const flameGeometry = new THREE.ConeGeometry(0.3, 1.5, 4);
    
    const flame1 = new THREE.Mesh(flameGeometry, Ship.flameMaterial);
    flame1.position.set(-0.3, -2.2, 0);
    flame1.rotation.z = Math.PI;
    
    const flame2 = new THREE.Mesh(flameGeometry, Ship.flameMaterial);
    flame2.position.set(0.3, -2.2, 0);
    flame2.rotation.z = Math.PI;

    this.boostFlames = [flame1, flame2];
    group.add(flame1);
    group.add(flame2);

    // Initially hidden
    flame1.visible = false;
    flame2.visible = false;
  }

  /**
   * Update ship movement and rotation
   */
  protected onUpdate(dt: number): void {
    // Update invulnerability
    if (this.invulnerable) {
      this.invulnTime -= dt;
      if (this.invulnTime <= 0) {
        this.invulnerable = false;
      }
    }

    // Ship rotation - smoothly rotate to target angle
    this.updateRotation(dt);

    // Apply thrust (forward or reverse)
    if (this.thrusting || this.thrustingReverse) {
      const dir = this.thrusting ? 1.0 : -0.65; // reverse uses opposite sign
      const thrustX = Math.sin(this.rotation) * PLAYER.accel * dir * dt;
      const thrustY = Math.cos(this.rotation) * PLAYER.accel * dir * dt;
      this.velocity.x += thrustX;
      this.velocity.y += thrustY;
    }

    // Apply friction
    this.velocity.x *= PLAYER.friction;
    this.velocity.y *= PLAYER.friction;

    // Limit maximum speed
    const speed = this.velocity.length();
    if (speed > PLAYER.maxSpeed) {
      this.velocity.normalize().multiplyScalar(PLAYER.maxSpeed);
    }

    // Update visual effects
    this.updateVisualEffects(dt);
    
    // Update mesh rotation to match entity rotation
    if (this.mesh) {
      this.mesh.rotation.z = this.rotation;
    }
  }

  private updateRotation(dt: number): void {
    // Calculate angle difference
    let angleDiff = this.targetRotation - this.rotation;
    
    // Normalize angle difference to [-π, π]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Smoothly rotate towards target
    const rotationSpeed = PLAYER.turn * dt;
    if (Math.abs(angleDiff) < rotationSpeed) {
      this.rotation = this.targetRotation;
    } else {
      this.rotation += Math.sign(angleDiff) * rotationSpeed;
    }
  }


  private updateVisualEffects(_dt: number): void {
    // Update boost flames visibility
    this.boostFlames.forEach(flame => {
      flame.visible = this.thrusting;
      if (this.thrusting) {
        // Add slight flicker effect
        flame.scale.y = 0.8 + Math.sin(this.age * 20) * 0.3;
      }
    });

    // Update shield opacity based on invulnerability
    if (this.shieldMesh) {
      const targetOpacity = this.invulnerable ? 0.6 : 0;
      const material = this.shieldMesh.material as THREE.MeshBasicMaterial;
      material.opacity += (targetOpacity - material.opacity) * 0.2;
    }
  }

  /**
   * Set the target rotation angle for smooth rotation
   * @param angle Target angle in radians
   */
  public setTargetRotation(angle: number): void {
    this.targetRotation = angle;
  }

  /**
   * Set thrusting state
   * @param thrusting Whether ship is thrusting
   */
  public setThrusting(thrusting: boolean): void {
    this.thrusting = thrusting;
  }

  /**
   * Set reverse thrusting state
   * @param thrustingReverse Whether ship is reverse thrusting
   */
  public setThrustingReverse(thrustingReverse: boolean): void {
    this.thrustingReverse = thrustingReverse;
  }
  
  /**
   * Set rotation input (-1 for left, 1 for right, 0 for no rotation)
   * @param direction Rotation direction
   */
  public setRotating(direction: number): void {
    // Apply rotation based on direction
    this.targetRotation += direction * PLAYER.turn;
  }
  
  // Shooting properties
  private lastShotTime: number = 0;
  private readonly shotCooldown: number = 0.2; // 200ms between shots
  
  /**
   * Check if ship can shoot
   */
  public canShoot(): boolean {
    const now = performance.now() / 1000;
    return now - this.lastShotTime >= this.shotCooldown;
  }
  
  /**
   * Shoot a bullet from the ship's position
   */
  public shoot(): Bullet | null {
    if (!this.canShoot()) return null;
    
    this.lastShotTime = performance.now() / 1000;
    
    // Create actual Bullet entity
    const angle = this.rotation; // Use entity rotation, not mesh rotation
    const bullet = new Bullet(
      this.position.x,
      this.position.y,
      angle,
      this.velocity.x * 0.1, // Inherit some ship velocity
      this.velocity.y * 0.1
    );
    
    return bullet;
  }

  /**
   * Make ship invulnerable for specified time
   * @param duration Duration in seconds
   */
  public setInvulnerable(duration: number): void {
    this.invulnerable = true;
    this.invulnTime = duration;
  }

  /**
   * Check if ship is currently invulnerable
   */
  public isInvulnerable(): boolean {
    return this.invulnerable;
  }

  /**
   * Get current thrust state
   */
  public isThrusting(): boolean {
    return this.thrusting;
  }

  protected onSpawn(): void {
    // Reset ship state when spawned
    this.invulnerable = false;
    this.invulnTime = 0;
    this.thrusting = false;
  }

  protected onDespawn(): void {
    // Clean up when despawned
    this.thrusting = false;
  }

  protected onReset(): void {
    // Reset ship to initial state
    this.targetRotation = 0;
    this.thrusting = false;
    this.thrustingReverse = false;
    this.invulnerable = false;
    this.invulnTime = 0;
  }
}