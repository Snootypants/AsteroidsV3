import * as THREE from 'three';
import { BaseEntity } from './BaseEntity';
import { Ship } from './Ship';
import { PhysicsSystem } from '../systems/PhysicsSystem';

export type EnemyType = 'hunter' | 'sniper' | 'kamikaze';
export type EnemyState = 'hunting' | 'attacking' | 'fleeing' | 'circling';

export interface EnemyAI {
  target?: Ship;
  state: EnemyState;
  stateTimer: number;
  shootTimer: number;
  shootCooldown: number;
  fleeDistance: number;
  attackDistance: number;
}

/**
 * Enemy entity with AI behavior and shooting
 * Hunts player, shoots, and uses different tactics based on type
 */
export class Enemy extends BaseEntity {
  // Enemy constants (from vanilla reference)
  private static readonly ENEMY_CONSTANTS = {
    radius: 2.5,
    maxSpeed: 30,
    accel: 20,
    shootRange: 200,
    shootAccuracy: 0.8, // 0-1, how accurate shots are
    health: 1,
    score: 150
  };

  // Enemy-specific properties
  public readonly enemyType: EnemyType;
  public health: number;
  private ai: EnemyAI;
  
  // Visual components
  private enemyMesh?: THREE.Mesh;
  private thrusterFlames: THREE.Mesh[] = [];
  
  // Materials (shared across all enemies)
  private static enemyMaterial?: THREE.MeshBasicMaterial;
  private static flameMaterial?: THREE.MeshBasicMaterial;

  constructor(type: EnemyType = 'hunter', x = 0, y = 0) {
    super(x, y, 0, 0, Enemy.ENEMY_CONSTANTS.radius);
    
    this.enemyType = type;
    this.health = Enemy.ENEMY_CONSTANTS.health;
    
    // Initialize AI
    this.ai = {
      state: 'hunting',
      stateTimer: 0,
      shootTimer: 0,
      shootCooldown: this.getShootCooldown(),
      fleeDistance: 80,
      attackDistance: 150
    };
    
    this.mesh = this.createMesh();
  }

  protected createMesh(): THREE.Object3D {
    const group = new THREE.Group();
    
    // Create enemy ship mesh
    this.createEnemyMesh(group);
    
    // Create thruster flames
    this.createThrusterFlames(group);
    
    return group;
  }

  private createEnemyMesh(group: THREE.Group): void {
    // Create enemy material (red/orange to distinguish from player)
    if (!Enemy.enemyMaterial) {
      Enemy.enemyMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4444, // Red color for enemies
        transparent: false
      });
    }

    // Create triangular enemy ship geometry
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Triangle pointing up (enemy ship)
      0, 2, 0,      // Top vertex
      -1.5, -1, 0,  // Bottom left
      1.5, -1, 0,   // Bottom right
      
      // Additional geometry for different enemy types
      0, 2, 0,      // Top vertex
      0, -2, 0,     // Bottom spike
      -1.5, -1, 0,  // Bottom left
      
      0, 2, 0,      // Top vertex  
      1.5, -1, 0,   // Bottom right
      0, -2, 0,     // Bottom spike
    ]);

    const indices = new Uint16Array([
      0, 1, 2,  // Main triangle
      3, 4, 5,  // Left wing
      6, 7, 8   // Right wing
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    this.enemyMesh = new THREE.Mesh(geometry, Enemy.enemyMaterial);
    group.add(this.enemyMesh);
  }

  private createThrusterFlames(group: THREE.Group): void {
    // Create flame material
    if (!Enemy.flameMaterial) {
      Enemy.flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600, // Orange flames
        transparent: true,
        opacity: 0.7
      });
    }

    // Create small thruster flames
    const flameGeometry = new THREE.ConeGeometry(0.2, 1, 4);
    
    const flame1 = new THREE.Mesh(flameGeometry, Enemy.flameMaterial);
    flame1.position.set(-0.5, -1.5, 0);
    flame1.rotation.z = Math.PI;
    
    const flame2 = new THREE.Mesh(flameGeometry, Enemy.flameMaterial);  
    flame2.position.set(0.5, -1.5, 0);
    flame2.rotation.z = Math.PI;

    this.thrusterFlames = [flame1, flame2];
    group.add(flame1);
    group.add(flame2);

    // Initially hidden
    flame1.visible = false;
    flame2.visible = false;
  }

  protected onUpdate(dt: number): void {
    // Update AI behavior
    this.updateAI(dt);
    
    // Apply AI movement
    this.applyAIMovement(dt);
    
    // Update visual effects
    this.updateVisualEffects(dt);
  }

  private updateAI(dt: number): void {
    if (!this.ai.target) return;

    this.ai.stateTimer -= dt;
    this.ai.shootTimer -= dt;

    const distanceToTarget = PhysicsSystem.getDistance(this, this.ai.target);

    // State machine
    switch (this.ai.state) {
      case 'hunting':
        if (distanceToTarget < this.ai.attackDistance) {
          this.ai.state = 'attacking';
          this.ai.stateTimer = 2.0 + Math.random() * 2.0; // Attack for 2-4 seconds
        }
        break;

      case 'attacking':
        if (this.ai.stateTimer <= 0) {
          // Decide next action based on distance and type
          if (distanceToTarget < this.ai.fleeDistance && Math.random() < 0.6) {
            this.ai.state = 'fleeing';
            this.ai.stateTimer = 1.0 + Math.random();
          } else {
            this.ai.state = 'circling';
            this.ai.stateTimer = 3.0 + Math.random() * 2.0;
          }
        }
        break;

      case 'fleeing':
        if (this.ai.stateTimer <= 0) {
          this.ai.state = 'hunting';
          this.ai.stateTimer = 1.0;
        }
        break;

      case 'circling':
        if (this.ai.stateTimer <= 0) {
          this.ai.state = 'hunting';
          this.ai.stateTimer = 1.0;
        }
        break;
    }

    // Shooting logic
    if (this.ai.shootTimer <= 0 && distanceToTarget < Enemy.ENEMY_CONSTANTS.shootRange) {
      if (this.canShoot()) {
        this.shoot();
        this.ai.shootTimer = this.ai.shootCooldown;
      }
    }
  }

  private applyAIMovement(dt: number): void {
    if (!this.ai.target) return;

    const targetDirection = PhysicsSystem.getDirection(this, this.ai.target);
    let desiredDirection = targetDirection.clone();

    switch (this.ai.state) {
      case 'hunting':
        // Move directly toward target
        break;

      case 'attacking':
        // Move toward target with slight randomization
        desiredDirection.x += (Math.random() - 0.5) * 0.3;
        desiredDirection.y += (Math.random() - 0.5) * 0.3;
        desiredDirection.normalize();
        break;

      case 'fleeing':
        // Move away from target
        desiredDirection.multiplyScalar(-1);
        break;

      case 'circling':
        // Circle around target
        const perpendicular = new THREE.Vector3(-targetDirection.y, targetDirection.x, 0);
        desiredDirection = perpendicular.clone();
        
        // Add some inward/outward movement
        const inwardFactor = (Math.random() - 0.5) * 0.5;
        desiredDirection.add(targetDirection.clone().multiplyScalar(inwardFactor));
        desiredDirection.normalize();
        break;
    }

    // Apply acceleration toward desired direction
    const accel = Enemy.ENEMY_CONSTANTS.accel * dt;
    this.velocity.x += desiredDirection.x * accel;
    this.velocity.y += desiredDirection.y * accel;

    // Limit speed
    const speed = this.velocity.length();
    if (speed > Enemy.ENEMY_CONSTANTS.maxSpeed) {
      this.velocity.normalize().multiplyScalar(Enemy.ENEMY_CONSTANTS.maxSpeed);
    }

    // Update rotation to face movement direction
    if (speed > 1) {
      this.rotation = Math.atan2(this.velocity.x, this.velocity.y);
    }
  }

  private updateVisualEffects(_dt: number): void {
    // Show thruster flames when accelerating
    const isAccelerating = this.velocity.length() > 5;
    
    this.thrusterFlames.forEach((flame, index) => {
      flame.visible = isAccelerating;
      if (isAccelerating) {
        // Add flicker effect
        flame.scale.y = 0.7 + Math.sin(this.age * 15 + index * Math.PI) * 0.3;
      }
    });

    // Change color based on health
    if (this.enemyMesh) {
      const material = this.enemyMesh.material as THREE.MeshBasicMaterial;
      if (this.health <= 0) {
        material.color.setHex(0x666666); // Gray when destroyed
      } else {
        // Pulse red when damaged
        const intensity = this.health < Enemy.ENEMY_CONSTANTS.health ? 0.7 + Math.sin(this.age * 10) * 0.3 : 1.0;
        material.color.setRGB(1.0 * intensity, 0.2 * intensity, 0.2 * intensity);
      }
    }
  }

  private canShoot(): boolean {
    if (!this.ai.target) return false;

    const distance = PhysicsSystem.getDistance(this, this.ai.target);
    
    // Range check
    if (distance > Enemy.ENEMY_CONSTANTS.shootRange) return false;

    // Accuracy check - enemies miss sometimes
    return Math.random() < Enemy.ENEMY_CONSTANTS.shootAccuracy;
  }

  private shoot(): void {
    if (!this.ai.target) return;

    // Calculate lead time for moving targets
    const targetVelocity = this.ai.target.velocity.clone();
    const distance = PhysicsSystem.getDistance(this, this.ai.target);
    const bulletSpeed = 70; // Same as player bullets
    const leadTime = distance / bulletSpeed;
    
    // Predict where target will be
    const predictedPosition = this.ai.target.position.clone();
    predictedPosition.add(targetVelocity.clone().multiplyScalar(leadTime));
    
    // Calculate angle to predicted position  
    const dx = predictedPosition.x - this.position.x;
    const dy = predictedPosition.y - this.position.y;
    const angle = Math.atan2(dx, dy);
    
    // Add some inaccuracy based on enemy type
    const inaccuracy = (1 - Enemy.ENEMY_CONSTANTS.shootAccuracy) * 0.5;
    const finalAngle = angle + (Math.random() - 0.5) * inaccuracy;

    // TODO: Spawn enemy bullet when bullet system supports it
    // For now, just visual/audio feedback
    console.log(`Enemy shoots at angle ${(finalAngle * 180 / Math.PI).toFixed(1)}°`);
  }

  private getShootCooldown(): number {
    switch (this.enemyType) {
      case 'hunter': return 1.5 + Math.random() * 0.5; // 1.5-2s
      case 'sniper': return 2.5 + Math.random() * 1.0; // 2.5-3.5s
      case 'kamikaze': return 0.8 + Math.random() * 0.4; // 0.8-1.2s
      default: return 2.0;
    }
  }

  /**
   * Set the target for AI behavior
   * @param target Target ship to hunt
   */
  public setTarget(target: Ship): void {
    this.ai.target = target;
  }

  /**
   * Take damage
   * @param damage Damage amount
   * @returns True if enemy is destroyed
   */
  public takeDamage(damage: number): boolean {
    this.health -= damage;
    
    if (this.health <= 0) {
      this.health = 0;
      return true;
    }
    
    return false;
  }

  /**
   * Get enemy type
   */
  public getEnemyType(): EnemyType {
    return this.enemyType;
  }

  /**
   * Get current AI state
   */
  public getAIState(): EnemyState {
    return this.ai.state;
  }

  /**
   * Get current health
   */
  public getHealth(): number {
    return this.health;
  }

  /**
   * Check if enemy is alive
   */
  public isAlive(): boolean {
    return this.health > 0;
  }

  /**
   * Get score value
   */
  public static getScoreValue(): number {
    return Enemy.ENEMY_CONSTANTS.score;
  }

  protected onSpawn(): void {
    // Reset enemy state when spawned
    this.health = Enemy.ENEMY_CONSTANTS.health;
    this.ai.state = 'hunting';
    this.ai.stateTimer = 1.0;
    this.ai.shootTimer = this.ai.shootCooldown;
  }

  protected onDespawn(): void {
    // Clean up AI references
    this.ai.target = undefined;
  }

  protected onReset(): void {
    // Reset enemy to initial state
    this.health = Enemy.ENEMY_CONSTANTS.health;
    this.ai = {
      state: 'hunting',
      stateTimer: 0,
      shootTimer: 0,
      shootCooldown: this.getShootCooldown(),
      fleeDistance: 80,
      attackDistance: 150
    };
  }
}