import * as THREE from 'three';
import { BaseEntity } from './BaseEntity';
import { BULLET, VISIBLE_HEIGHT } from '../constants/gameConstants';

/**
 * Bullet entity with pierce, ricochet, and lifetime mechanics
 * Matches vanilla implementation exactly
 */
export class Bullet extends BaseEntity {
  // Bullet properties
  public pierce: number = 0;          // How many enemies this bullet can pierce through
  public ricochet: number = 0;        // How many ricochets this bullet has left
  public damage: number = 1.0;        // Damage multiplier
  public lifetime: number = BULLET.life; // Lifetime in seconds
  
  // Visual
  private bulletMesh?: THREE.Mesh;
  
  // Static material for performance
  private static bulletMaterial?: THREE.MeshBasicMaterial;

  constructor(x = 0, y = 0, direction = 0, inheritVx = 0, inheritVy = 0) {
    // Calculate velocity from direction and inherited velocity
    // Ship faces "up" by default, so we use sin for X and cos for Y
    const vx = Math.sin(direction) * BULLET.speed + inheritVx;
    const vy = Math.cos(direction) * BULLET.speed + inheritVy;
    
    super(x, y, vx, vy, BULLET.r);
    
    // Calculate life based on 1.5x visible height travel distance
    this.lifetime = (VISIBLE_HEIGHT * 1.5) / BULLET.speed;
    
    this.mesh = this.createMesh();
  }

  protected createMesh(): THREE.Object3D {
    // Create bullet material if not exists
    if (!Bullet.bulletMaterial) {
      Bullet.bulletMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
    }
    
    // Create thin cylinder geometry for line-like appearance
    const geometry = new THREE.CylinderGeometry(
      BULLET.r * 0.3,  // Top radius
      BULLET.r * 0.3,  // Bottom radius  
      1.2,             // Length
      6                // Segments
    );
    
    // Rotate to point along velocity direction
    geometry.rotateZ(Math.PI / 2); // Rotate to point along X axis by default
    
    this.bulletMesh = new THREE.Mesh(geometry, Bullet.bulletMaterial);
    
    // Orient bullet along movement direction
    const angle = Math.atan2(this.velocity.y, this.velocity.x);
    this.bulletMesh.rotation.z = angle;
    
    return this.bulletMesh;
  }

  protected onUpdate(dt: number): void {
    // Update lifetime
    this.lifetime -= dt;
    
    // Deactivate if lifetime expired
    if (this.lifetime <= 0) {
      this.active = false;
      return;
    }
    
    // Update bullet orientation to match velocity direction
    if (this.bulletMesh && (this.velocity.x !== 0 || this.velocity.y !== 0)) {
      const angle = Math.atan2(this.velocity.y, this.velocity.x);
      this.bulletMesh.rotation.z = angle;
    }
    
    // Fade out as lifetime approaches zero
    if (this.bulletMesh && this.lifetime < 0.2) {
      const material = this.bulletMesh.material as THREE.MeshBasicMaterial;
      material.opacity = (this.lifetime / 0.2) * 0.9;
    }
  }

  /**
   * Handle bullet piercing through target
   * Reduces pierce count and continues if pierce remaining
   * @returns true if bullet should continue (has pierce left), false if bullet should be destroyed
   */
  public pierceThrough(): boolean {
    if (this.pierce > 0) {
      this.pierce--;
      return true; // Continue bullet
    }
    return false; // Destroy bullet
  }

  /**
   * Handle bullet ricochet off target
   * Bounces bullet in random direction and reduces ricochet count
   * @returns true if ricochet occurred, false if bullet should be destroyed
   */
  public ricochetOff(): boolean {
    if (this.ricochet > 0) {
      this.ricochet--;
      
      // Bounce in random direction with same speed
      const currentSpeed = this.velocity.length();
      const newAngle = Math.random() * Math.PI * 2;
      
      this.velocity.x = Math.cos(newAngle) * currentSpeed;
      this.velocity.y = Math.sin(newAngle) * currentSpeed;
      
      // Reset some lifetime on ricochet
      this.lifetime = Math.min(this.lifetime + 0.3, BULLET.life);
      
      return true; // Continue bullet
    }
    return false; // Destroy bullet
  }

  /**
   * Check if bullet has special properties (pierce or ricochet)
   */
  public hasSpecialProperties(): boolean {
    return this.pierce > 0 || this.ricochet > 0;
  }

  /**
   * Get remaining lifetime as percentage (0-1)
   */
  public getLifetimePercent(): number {
    return Math.max(0, this.lifetime / BULLET.life);
  }

  protected onSpawn(): void {
    // Reset bullet state when spawned
    this.lifetime = BULLET.life;
    this.pierce = 0;
    this.ricochet = 0;
    this.damage = 1.0;
    
    // Reset material opacity
    if (this.bulletMesh) {
      const material = this.bulletMesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.9;
    }
  }

  protected onDespawn(): void {
    // No special cleanup needed
  }

  protected onReset(): void {
    // Reset all bullet properties
    this.lifetime = BULLET.life;
    this.pierce = 0;
    this.ricochet = 0;
    this.damage = 1.0;
    
    // Reset material opacity
    if (this.bulletMesh) {
      const material = this.bulletMesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.9;
    }
  }

  /**
   * Static factory method to create bullet with modifications
   * @param x Starting X position
   * @param y Starting Y position 
   * @param direction Direction angle in radians
   * @param inheritVx Inherited velocity X from shooter
   * @param inheritVy Inherited velocity Y from shooter
   * @param pierce Number of pierce hits
   * @param ricochet Number of ricochet bounces
   * @param damage Damage multiplier
   * @returns New Bullet instance
   */
  static createWithMods(
    x: number,
    y: number, 
    direction: number,
    inheritVx = 0,
    inheritVy = 0,
    pierce = 0,
    ricochet = 0,
    damage = 1.0
  ): Bullet {
    const bullet = new Bullet(x, y, direction, inheritVx, inheritVy);
    bullet.pierce = pierce;
    bullet.ricochet = ricochet;
    bullet.damage = damage;
    
    // Visual indication for special bullets
    if (bullet.bulletMesh) {
      const material = bullet.bulletMesh.material as THREE.MeshBasicMaterial;
      
      if (pierce > 0) {
        // Piercing bullets are more blue
        material.color.setHex(0x88ccff);
      } else if (ricochet > 0) {
        // Ricochet bullets are more yellow
        material.color.setHex(0xffcc88);
      }
      
      if (damage !== 1.0) {
        // Scale bullet size based on damage
        bullet.bulletMesh.scale.setScalar(0.5 + damage * 0.5);
      }
    }
    
    return bullet;
  }
}