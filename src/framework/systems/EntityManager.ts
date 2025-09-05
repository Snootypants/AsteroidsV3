import * as THREE from 'three';
import { BaseEntity } from '../entities/BaseEntity';
import { Ship } from '../entities/Ship';
import { Asteroid, AsteroidSize } from '../entities/Asteroid';
import { Bullet } from '../entities/Bullet';
import { Enemy, EnemyType } from '../entities/Enemy';
import { Pickup, PickupType } from '../entities/Pickup';
import { POOL_SIZES, BULLET } from '../constants/gameConstants';

export interface EntityCollections {
  ships: Ship[];
  asteroids: Asteroid[];
  bullets: Bullet[];
  enemies: Enemy[];
  pickups: Pickup[];
  // Additional entity types for future expansion
  // drones: Drone[];
}

/**
 * Central entity management system
 * Handles entity lifecycle, updates, and collections
 */
export class EntityManager {
  // Entity collections
  public entities: EntityCollections;
  
  // Three.js scene reference
  private scene: THREE.Scene;
  
  // Entity pools for performance (using simple arrays for now)
  private shipPool: Ship[] = [];
  private asteroidPool: Asteroid[] = [];
  private bulletPool: Bullet[] = [];
  private enemyPool: Enemy[] = [];
  private pickupPool: Pickup[] = [];
  

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Initialize entity collections
    this.entities = {
      ships: [],
      asteroids: [],
      bullets: [],
      enemies: [],
      pickups: []
    };
    
    // Pre-populate pools
    this.initializePools();
  }

  private initializePools(): void {
    // Create ship pool
    for (let i = 0; i < POOL_SIZES.ships; i++) {
      const ship = new Ship();
      this.shipPool.push(ship);
    }
    
    // Create asteroid pool with various sizes
    for (let i = 0; i < POOL_SIZES.asteroids; i++) {
      const size: AsteroidSize = i % 3 === 0 ? 'large' : i % 3 === 1 ? 'medium' : 'small';
      const asteroid = new Asteroid(size);
      this.asteroidPool.push(asteroid);
    }
    
    // Create bullet pool
    for (let i = 0; i < POOL_SIZES.bullets; i++) {
      const bullet = new Bullet();
      this.bulletPool.push(bullet);
    }
    
    // Create enemy pool
    for (let i = 0; i < POOL_SIZES.enemies; i++) {
      const enemyType: EnemyType = i % 3 === 0 ? 'hunter' : i % 3 === 1 ? 'sniper' : 'kamikaze';
      const enemy = new Enemy(enemyType);
      this.enemyPool.push(enemy);
    }
    
    // Create pickup pool
    for (let i = 0; i < POOL_SIZES.pickups; i++) {
      const pickupType: PickupType = i % 6 === 0 ? 'salvage' : 
                                    i % 6 === 1 ? 'health' : 
                                    i % 6 === 2 ? 'shield' :
                                    i % 6 === 3 ? 'rapidfire' :
                                    i % 6 === 4 ? 'pierce' : 'damage';
      const pickup = new Pickup(pickupType);
      this.pickupPool.push(pickup);
    }
  }

  /**
   * Update all active entities
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    // Update all active entities
    this.updateEntityCollection(this.entities.ships, dt);
    this.updateEntityCollection(this.entities.asteroids, dt);
    this.updateEntityCollection(this.entities.bullets, dt);
    this.updateEntityCollection(this.entities.enemies, dt);
    this.updateEntityCollection(this.entities.pickups, dt);
    
    // Clean up inactive entities
    this.cleanupInactiveEntities();
  }

  private updateEntityCollection<T extends BaseEntity>(entities: T[], dt: number): void {
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      entity.update(dt);
      
      // Remove if inactive
      if (!entity.active) {
        this.removeEntity(entity);
        entities.splice(i, 1);
      }
    }
  }

  private cleanupInactiveEntities(): void {
    // Remove inactive entities and return them to pools
    this.cleanupCollection(this.entities.ships, this.shipPool, 'ships');
    this.cleanupCollection(this.entities.asteroids, this.asteroidPool, 'asteroids');
    this.cleanupCollection(this.entities.bullets, this.bulletPool, 'bullets');
    this.cleanupCollection(this.entities.enemies, this.enemyPool, 'enemies');
    this.cleanupCollection(this.entities.pickups, this.pickupPool, 'pickups');
  }

  private cleanupCollection<T extends BaseEntity>(entities: T[], pool: T[], kind: keyof EntityCollections): void {
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      if (!entity.active) {
        this.removeEntity(entity);
        entities.splice(i, 1);
        
        // Return to pool if there's space
        if (pool.length < POOL_SIZES[kind]) {
          pool.push(entity);
        }
      }
    }
  }

  /**
   * Spawn a ship at specified position
   * @param x X position
   * @param y Y position
   * @returns Spawned ship instance
   */
  public spawnShip(x: number, y: number): Ship {
    let ship = this.getFromPool(this.shipPool);
    if (!ship) {
      ship = new Ship(x, y);
    } else {
      ship.reset(x, y);
    }
    
    ship.spawn(this.scene);
    this.entities.ships.push(ship);
    
    return ship;
  }

  /**
   * Spawn an asteroid at specified position
   * @param size Size of asteroid
   * @param x X position
   * @param y Y position
   * @param vx X velocity
   * @param vy Y velocity
   * @returns Spawned asteroid instance
   */
  public spawnAsteroid(size: AsteroidSize, x: number, y: number, vx: number, vy: number): Asteroid {
    let asteroid = this.getFromPool(this.asteroidPool);
    if (!asteroid) {
      asteroid = new Asteroid(size, x, y, vx, vy);
    } else {
      // Reset asteroid with new properties
      asteroid.reset(x, y, vx, vy);
      // Note: We'd need to modify reset to handle size changes, or use a different approach
    }
    
    asteroid.spawn(this.scene);
    this.entities.asteroids.push(asteroid);
    
    return asteroid;
  }

  /**
   * Spawn a bullet at specified position and direction
   * @param x X position
   * @param y Y position
   * @param direction Direction angle in radians
   * @param inheritVx Inherited velocity X
   * @param inheritVy Inherited velocity Y
   * @param pierce Pierce count
   * @param ricochet Ricochet count
   * @param damage Damage multiplier
   * @returns Spawned bullet instance
   */
  public spawnBullet(
    x: number, 
    y: number, 
    direction: number, 
    inheritVx = 0, 
    inheritVy = 0,
    pierce = 0,
    ricochet = 0,
    damage = 1.0
  ): Bullet {
    let bullet = this.getFromPool(this.bulletPool);
    if (!bullet) {
      bullet = Bullet.createWithMods(x, y, direction, inheritVx, inheritVy, pierce, ricochet, damage);
    } else {
      bullet.reset(x, y);
      // Set bullet direction and properties
      bullet.velocity.x = Math.cos(direction) * BULLET.speed + inheritVx;
      bullet.velocity.y = Math.sin(direction) * BULLET.speed + inheritVy;
      bullet.pierce = pierce;
      bullet.ricochet = ricochet;
      bullet.damage = damage;
    }
    
    bullet.spawn(this.scene);
    this.entities.bullets.push(bullet);
    
    return bullet;
  }

  /**
   * Spawn an enemy at specified position
   * @param type Enemy type
   * @param x X position
   * @param y Y position
   * @param speedMultiplier Speed multiplier for this wave
   * @returns Spawned enemy instance
   */
  public spawnEnemy(type: EnemyType, x: number, y: number, speedMultiplier: number = 1.0): Enemy {
    let enemy = this.getFromPool(this.enemyPool);
    if (!enemy) {
      enemy = new Enemy(type, x, y);
    } else {
      enemy.reset(x, y);
    }
    
    // Apply speed multiplier to enemy velocity if needed
    if (speedMultiplier !== 1.0) {
      enemy.velocity.multiplyScalar(speedMultiplier);
    }
    
    // Set target to first ship if available
    const ships = this.entities.ships;
    if (ships.length > 0) {
      enemy.setTarget(ships[0]);
    }
    
    enemy.spawn(this.scene);
    this.entities.enemies.push(enemy);
    
    return enemy;
  }

  /**
   * Spawn a pickup at specified position
   * @param type Pickup type
   * @param x X position
   * @param y Y position
   * @returns Spawned pickup instance
   */
  public spawnPickup(type: PickupType, x: number, y: number): Pickup {
    let pickup = this.getFromPool(this.pickupPool);
    if (!pickup) {
      pickup = new Pickup(type, x, y);
    } else {
      pickup.reset(x, y);
      // TODO: Handle pickup type changes when reset supports it
    }
    
    // Set magnet target to first ship if available
    const ships = this.entities.ships;
    if (ships.length > 0) {
      pickup.setMagnetTarget(ships[0]);
    }
    
    pickup.spawn(this.scene);
    this.entities.pickups.push(pickup);
    
    return pickup;
  }

  /**
   * Spawn a random pickup at specified position
   * @param x X position
   * @param y Y position
   * @returns Spawned pickup instance
   */
  public spawnRandomPickup(x: number, y: number): Pickup {
    const pickup = Pickup.createRandom(x, y);
    
    // Set magnet target to first ship if available
    const ships = this.entities.ships;
    if (ships.length > 0) {
      pickup.setMagnetTarget(ships[0]);
    }
    
    pickup.spawn(this.scene);
    this.entities.pickups.push(pickup);
    
    return pickup;
  }

  /**
   * Remove entity from scene and deactivate
   * @param entity Entity to remove
   */
  private removeEntity(entity: BaseEntity): void {
    entity.despawn(this.scene);
  }

  /**
   * Get entity from pool if available
   * @param pool Pool to get from
   * @returns Entity instance or undefined if pool empty
   */
  private getFromPool<T extends BaseEntity>(pool: T[]): T | undefined {
    return pool.pop();
  }

  /**
   * Get all active entities of specific type
   * @param type Entity type
   * @returns Array of active entities
   */
  public getEntitiesOfType<T extends BaseEntity>(type: new (...args: any[]) => T): T[] {
    const allEntities: BaseEntity[] = [
      ...this.entities.ships,
      ...this.entities.asteroids,
      ...this.entities.bullets,
      ...this.entities.enemies,
      ...this.entities.pickups
    ];
    
    return allEntities.filter(entity => entity instanceof type) as T[];
  }

  /**
   * Add an existing entity to the manager (used for asteroid splitting)
   * @param entity Entity to add
   * @param type Entity collection type
   */
  public addExistingEntity(entity: BaseEntity, type: keyof EntityCollections): void {
    switch (type) {
      case 'ships':
        this.entities.ships.push(entity as Ship);
        break;
      case 'asteroids':
        this.entities.asteroids.push(entity as Asteroid);
        break;
      case 'bullets':
        this.entities.bullets.push(entity as Bullet);
        break;
      case 'enemies':
        this.entities.enemies.push(entity as Enemy);
        break;
      case 'pickups':
        this.entities.pickups.push(entity as Pickup);
        break;
    }
  }

  /**
   * Get active entities of specific collection type
   * @param type Collection type
   * @returns Array of active entities
   */
  public getActiveEntities(type: keyof EntityCollections): BaseEntity[] {
    return this.entities[type] as BaseEntity[];
  }

  /**
   * Get scene reference for collision system
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get total count of active entities
   */
  public getActiveEntityCount(): number {
    return this.entities.ships.length + 
           this.entities.asteroids.length + 
           this.entities.bullets.length +
           this.entities.enemies.length +
           this.entities.pickups.length;
  }

  /**
   * Clear all entities from scene and collections
   */
  public clearAll(): void {
    // Remove all entities from scene
    [...this.entities.ships, ...this.entities.asteroids, ...this.entities.bullets, ...this.entities.enemies, ...this.entities.pickups]
      .forEach(entity => this.removeEntity(entity));
    
    // Clear collections
    this.entities.ships.length = 0;
    this.entities.asteroids.length = 0;
    this.entities.bullets.length = 0;
    this.entities.enemies.length = 0;
    this.entities.pickups.length = 0;
  }

  /**
   * Get debug information about entity pools and active counts
   */
  public getDebugInfo(): {
    active: { ships: number; asteroids: number; bullets: number; enemies: number; pickups: number; total: number };
    pools: { ships: number; asteroids: number; bullets: number; enemies: number; pickups: number };
  } {
    return {
      active: {
        ships: this.entities.ships.length,
        asteroids: this.entities.asteroids.length,
        bullets: this.entities.bullets.length,
        enemies: this.entities.enemies.length,
        pickups: this.entities.pickups.length,
        total: this.getActiveEntityCount()
      },
      pools: {
        ships: this.shipPool.length,
        asteroids: this.asteroidPool.length,
        bullets: this.bulletPool.length,
        enemies: this.enemyPool.length,
        pickups: this.pickupPool.length
      }
    };
  }
}