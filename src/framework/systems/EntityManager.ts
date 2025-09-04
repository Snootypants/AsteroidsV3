import * as THREE from 'three';
import { BaseEntity } from '../entities/BaseEntity';
import { Ship } from '../entities/Ship';
import { Asteroid, AsteroidSize } from '../entities/Asteroid';
import { Bullet } from '../entities/Bullet';

export interface EntityCollections {
  ships: Ship[];
  asteroids: Asteroid[];
  bullets: Bullet[];
  // Additional entity types will be added in future days
  // enemies: Enemy[];
  // pickups: Pickup[];
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
  
  // Pool sizes
  private static readonly POOL_SIZES = {
    ships: 5,        // Few ships needed
    asteroids: 50,   // Many asteroids across waves
    bullets: 100     // Many bullets can be on screen
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Initialize entity collections
    this.entities = {
      ships: [],
      asteroids: [],
      bullets: []
    };
    
    // Pre-populate pools
    this.initializePools();
  }

  private initializePools(): void {
    // Create ship pool
    for (let i = 0; i < EntityManager.POOL_SIZES.ships; i++) {
      const ship = new Ship();
      this.shipPool.push(ship);
    }
    
    // Create asteroid pool with various sizes
    for (let i = 0; i < EntityManager.POOL_SIZES.asteroids; i++) {
      const size: AsteroidSize = i % 3 === 0 ? 'large' : i % 3 === 1 ? 'medium' : 'small';
      const asteroid = new Asteroid(size);
      this.asteroidPool.push(asteroid);
    }
    
    // Create bullet pool
    for (let i = 0; i < EntityManager.POOL_SIZES.bullets; i++) {
      const bullet = new Bullet();
      this.bulletPool.push(bullet);
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
    this.cleanupCollection(this.entities.ships, this.shipPool);
    this.cleanupCollection(this.entities.asteroids, this.asteroidPool);
    this.cleanupCollection(this.entities.bullets, this.bulletPool);
  }

  private cleanupCollection<T extends BaseEntity>(entities: T[], pool: T[]): void {
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      if (!entity.active) {
        this.removeEntity(entity);
        entities.splice(i, 1);
        
        // Return to pool if there's space
        if (pool.length < EntityManager.POOL_SIZES.ships) {
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
      bullet.velocity.x = Math.cos(direction) * 70 + inheritVx; // BULLET.speed = 70
      bullet.velocity.y = Math.sin(direction) * 70 + inheritVy;
      bullet.pierce = pierce;
      bullet.ricochet = ricochet;
      bullet.damage = damage;
    }
    
    bullet.spawn(this.scene);
    this.entities.bullets.push(bullet);
    
    return bullet;
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
      ...this.entities.bullets
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
           this.entities.bullets.length;
  }

  /**
   * Clear all entities from scene and collections
   */
  public clearAll(): void {
    // Remove all entities from scene
    [...this.entities.ships, ...this.entities.asteroids, ...this.entities.bullets]
      .forEach(entity => this.removeEntity(entity));
    
    // Clear collections
    this.entities.ships.length = 0;
    this.entities.asteroids.length = 0;
    this.entities.bullets.length = 0;
  }

  /**
   * Get debug information about entity pools and active counts
   */
  public getDebugInfo(): {
    active: { ships: number; asteroids: number; bullets: number; total: number };
    pools: { ships: number; asteroids: number; bullets: number };
  } {
    return {
      active: {
        ships: this.entities.ships.length,
        asteroids: this.entities.asteroids.length,
        bullets: this.entities.bullets.length,
        total: this.getActiveEntityCount()
      },
      pools: {
        ships: this.shipPool.length,
        asteroids: this.asteroidPool.length,
        bullets: this.bulletPool.length
      }
    };
  }
}