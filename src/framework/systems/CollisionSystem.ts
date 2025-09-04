import { BaseEntity } from '../entities/BaseEntity';
import { Ship } from '../entities/Ship';
import { Asteroid } from '../entities/Asteroid';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Pickup } from '../entities/Pickup';
import { EntityManager } from './EntityManager';
import { PhysicsSystem } from './PhysicsSystem';

export interface CollisionEvent {
  entityA: BaseEntity;
  entityB: BaseEntity;
  type: 'ship-asteroid' | 'bullet-asteroid' | 'ship-bullet' | 'ship-enemy' | 'bullet-enemy' | 'ship-pickup' | 'enemy-bullet';
}

/**
 * Collision detection and response system
 * Handles all entity-to-entity collision detection and callbacks
 */
export class CollisionSystem {
  private entityManager: EntityManager;
  private collisionCallbacks: Map<string, (event: CollisionEvent) => void> = new Map();
  
  // Performance optimization: spatial partitioning grid
  private gridSize = 100;
  private grid: Map<string, BaseEntity[]> = new Map();
  
  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }
  
  /**
   * Register collision callback for specific collision types
   * @param type Collision type to listen for
   * @param callback Function to call when collision occurs
   */
  public onCollision(type: string, callback: (event: CollisionEvent) => void): void {
    this.collisionCallbacks.set(type, callback);
  }
  
  /**
   * Update collision detection for all entities
   * @param dt Delta time in seconds
   */
  public update(_dt: number): void {
    // Clear and rebuild spatial grid
    this.rebuildGrid();
    
    // Check all collision pairs
    this.checkShipAsteroidCollisions();
    this.checkBulletAsteroidCollisions();
    this.checkShipBulletCollisions();
    this.checkShipEnemyCollisions();
    this.checkBulletEnemyCollisions();
    this.checkShipPickupCollisions();
  }
  
  /**
   * Rebuild spatial partitioning grid for performance optimization
   */
  private rebuildGrid(): void {
    this.grid.clear();
    
    const allEntities = [
      ...this.entityManager.getActiveEntities('ships'),
      ...this.entityManager.getActiveEntities('asteroids'),
      ...this.entityManager.getActiveEntities('bullets'),
      ...(this.entityManager.getActiveEntities('enemies') || []),
      ...(this.entityManager.getActiveEntities('pickups') || [])
    ];
    
    for (const entity of allEntities) {
      const gridKey = this.getGridKey(entity.position.x, entity.position.y);
      if (!this.grid.has(gridKey)) {
        this.grid.set(gridKey, []);
      }
      this.grid.get(gridKey)!.push(entity);
      
      // Also add to adjacent cells for entities near grid boundaries
      const adjacentKeys = this.getAdjacentGridKeys(entity.position.x, entity.position.y, entity.radius);
      for (const key of adjacentKeys) {
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        if (!this.grid.get(key)!.includes(entity)) {
          this.grid.get(key)!.push(entity);
        }
      }
    }
  }
  
  /**
   * Get grid key for spatial partitioning
   * @param x X coordinate
   * @param y Y coordinate
   * @returns Grid key string
   */
  private getGridKey(x: number, y: number): string {
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);
    return `${gridX},${gridY}`;
  }
  
  /**
   * Get adjacent grid keys for large entities
   * @param x X coordinate
   * @param y Y coordinate
   * @param radius Entity radius
   * @returns Array of adjacent grid keys
   */
  private getAdjacentGridKeys(x: number, y: number, radius: number): string[] {
    const keys: string[] = [];
    const range = Math.ceil(radius / this.gridSize);
    const baseGridX = Math.floor(x / this.gridSize);
    const baseGridY = Math.floor(y / this.gridSize);
    
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        if (dx === 0 && dy === 0) continue; // Skip center cell (already added)
        keys.push(`${baseGridX + dx},${baseGridY + dy}`);
      }
    }
    
    return keys;
  }
  
  /**
   * Check collisions between ships and asteroids
   */
  private checkShipAsteroidCollisions(): void {
    const ships = this.entityManager.getActiveEntities('ships') as Ship[];
    
    for (const ship of ships) {
      if (ship.isInvulnerable()) continue;
      
      const gridKey = this.getGridKey(ship.position.x, ship.position.y);
      const nearbyEntities = this.grid.get(gridKey) || [];
      
      for (const entity of nearbyEntities) {
        if (entity instanceof Asteroid && PhysicsSystem.areColliding(ship, entity)) {
          this.triggerCollision({
            entityA: ship,
            entityB: entity,
            type: 'ship-asteroid'
          });
        }
      }
    }
  }
  
  /**
   * Check collisions between bullets and asteroids
   */
  private checkBulletAsteroidCollisions(): void {
    const bullets = this.entityManager.getActiveEntities('bullets') as Bullet[];
    
    for (const bullet of bullets) {
      const gridKey = this.getGridKey(bullet.position.x, bullet.position.y);
      const nearbyEntities = this.grid.get(gridKey) || [];
      
      for (const entity of nearbyEntities) {
        if (entity instanceof Asteroid && PhysicsSystem.areColliding(bullet, entity)) {
          this.triggerCollision({
            entityA: bullet,
            entityB: entity,
            type: 'bullet-asteroid'
          });
        }
      }
    }
  }
  
  /**
   * Check collisions between ships and bullets (friendly fire)
   */
  private checkShipBulletCollisions(): void {
    const ships = this.entityManager.getActiveEntities('ships') as Ship[];
    const bullets = this.entityManager.getActiveEntities('bullets') as Bullet[];
    
    for (const ship of ships) {
      if (ship.isInvulnerable()) continue;
      
      for (const bullet of bullets) {
        // Skip bullets fired by this ship (would need owner tracking)
        if (PhysicsSystem.areColliding(ship, bullet)) {
          this.triggerCollision({
            entityA: ship,
            entityB: bullet,
            type: 'ship-bullet'
          });
        }
      }
    }
  }

  /**
   * Check collisions between ships and enemies
   */
  private checkShipEnemyCollisions(): void {
    const ships = this.entityManager.getActiveEntities('ships') as Ship[];
    
    for (const ship of ships) {
      if (ship.isInvulnerable()) continue;
      
      const gridKey = this.getGridKey(ship.position.x, ship.position.y);
      const nearbyEntities = this.grid.get(gridKey) || [];
      
      for (const entity of nearbyEntities) {
        if (entity instanceof Enemy && entity.isAlive() && PhysicsSystem.areColliding(ship, entity)) {
          this.triggerCollision({
            entityA: ship,
            entityB: entity,
            type: 'ship-enemy'
          });
        }
      }
    }
  }

  /**
   * Check collisions between bullets and enemies
   */
  private checkBulletEnemyCollisions(): void {
    const bullets = this.entityManager.getActiveEntities('bullets') as Bullet[];
    
    for (const bullet of bullets) {
      const gridKey = this.getGridKey(bullet.position.x, bullet.position.y);
      const nearbyEntities = this.grid.get(gridKey) || [];
      
      for (const entity of nearbyEntities) {
        if (entity instanceof Enemy && entity.isAlive() && PhysicsSystem.areColliding(bullet, entity)) {
          this.triggerCollision({
            entityA: bullet,
            entityB: entity,
            type: 'bullet-enemy'
          });
        }
      }
    }
  }

  /**
   * Check collisions between ships and pickups
   */
  private checkShipPickupCollisions(): void {
    const ships = this.entityManager.getActiveEntities('ships') as Ship[];
    
    for (const ship of ships) {
      const gridKey = this.getGridKey(ship.position.x, ship.position.y);
      const nearbyEntities = this.grid.get(gridKey) || [];
      
      for (const entity of nearbyEntities) {
        if (entity instanceof Pickup && PhysicsSystem.areColliding(ship, entity)) {
          this.triggerCollision({
            entityA: ship,
            entityB: entity,
            type: 'ship-pickup'
          });
        }
      }
    }
  }
  
  /**
   * Trigger collision event and call registered callbacks
   * @param event Collision event data
   */
  private triggerCollision(event: CollisionEvent): void {
    // Call type-specific callback
    const callback = this.collisionCallbacks.get(event.type);
    if (callback) {
      callback(event);
    }
    
    // Call generic collision callback
    const genericCallback = this.collisionCallbacks.get('collision');
    if (genericCallback) {
      genericCallback(event);
    }
  }
  
  /**
   * Handle bullet-asteroid collision with asteroid splitting
   * @param bullet The bullet entity
   * @param asteroid The asteroid entity
   */
  public static handleBulletAsteroidCollision(bullet: Bullet, asteroid: Asteroid, entityManager: EntityManager): void {
    const scene = entityManager.getScene();
    
    // Destroy the bullet
    bullet.despawn(scene);
    
    // Split the asteroid if possible
    const pieces = asteroid.split();
    asteroid.despawn(scene);
    
    // Spawn asteroid pieces
    for (const piece of pieces) {
      entityManager.addExistingEntity(piece, 'asteroids');
      piece.spawn(scene);
    }
    
    // Apply some screen shake effect (would be handled by camera system)
    // Add particle effects (would be handled by particle system)
    
    // Award points (would be handled by game state)
  }
  
  /**
   * Handle ship-asteroid collision
   * @param ship The ship entity
   * @param asteroid The asteroid entity
   */
  public static handleShipAsteroidCollision(ship: Ship, asteroid: Asteroid): void {
    // Make ship invulnerable temporarily
    ship.setInvulnerable(2.0);
    
    // Apply knockback to ship
    const direction = PhysicsSystem.getDirection(asteroid, ship);
    PhysicsSystem.applyImpulse(ship, direction.x * 30, direction.y * 30);
    
    // Apply damage to ship (would be handled by health system)
    // Reduce lives or health
    // Play damage sound
    // Add screen shake
  }
  
  /**
   * Handle ship-bullet collision (friendly fire)
   * @param ship The ship entity
   * @param bullet The bullet entity
   * @param entityManager Entity manager for scene access
   */
  public static handleShipBulletCollision(ship: Ship, bullet: Bullet, entityManager: EntityManager): void {
    // Only if friendly fire is enabled
    bullet.despawn(entityManager.getScene());
    
    // Minor damage to ship
    ship.setInvulnerable(1.0);
  }

  /**
   * Handle ship-enemy collision
   * @param ship The ship entity
   * @param enemy The enemy entity
   * @param entityManager Entity manager for scene access
   */
  public static handleShipEnemyCollision(ship: Ship, enemy: Enemy, entityManager: EntityManager): void {
    const scene = entityManager.getScene();
    
    // Both ship and enemy take damage
    ship.setInvulnerable(2.0);
    
    if (enemy.takeDamage(1)) {
      // Enemy destroyed - will be handled by scoring system
      enemy.despawn(scene);
    }
    
    // Apply knockback to both
    const direction = PhysicsSystem.getDirection(enemy, ship);
    PhysicsSystem.applyImpulse(ship, direction.x * 40, direction.y * 40);
    PhysicsSystem.applyImpulse(enemy, -direction.x * 20, -direction.y * 20);
  }

  /**
   * Handle bullet-enemy collision
   * @param bullet The bullet entity
   * @param enemy The enemy entity
   * @param entityManager Entity manager for scene access
   */
  public static handleBulletEnemyCollision(bullet: Bullet, enemy: Enemy, entityManager: EntityManager): void {
    const scene = entityManager.getScene();
    
    // Destroy bullet
    bullet.despawn(scene);
    
    // Damage enemy
    if (enemy.takeDamage(bullet.damage)) {
      // Enemy destroyed - will be handled by scoring system
      enemy.despawn(scene);
      
      // Chance to spawn pickup
      if (Math.random() < 0.15) { // 15% chance
        const pickup = Pickup.createRandom(enemy.position.x, enemy.position.y);
        entityManager.addExistingEntity(pickup, 'pickups');
        pickup.spawn(scene);
      }
    }
  }

  /**
   * Handle ship-pickup collision
   * @param ship The ship entity
   * @param pickup The pickup entity
   * @param entityManager Entity manager for scene access
   */
  public static handleShipPickupCollision(ship: Ship, pickup: Pickup, entityManager: EntityManager): void {
    // Apply pickup effect
    if (pickup.applyToShip(ship)) {
      // Remove pickup if it was consumed
      pickup.despawn(entityManager.getScene());
    }
  }
  
  /**
   * Get all entities within a radius of a point
   * @param x Center X coordinate
   * @param y Center Y coordinate
   * @param radius Search radius
   * @returns Array of entities within radius
   */
  public getEntitiesInRadius(x: number, y: number, radius: number): BaseEntity[] {
    const result: BaseEntity[] = [];
    const gridKeys = this.getAdjacentGridKeys(x, y, radius);
    
    // Also check the center grid
    gridKeys.push(this.getGridKey(x, y));
    
    const checkedEntities = new Set<BaseEntity>();
    
    for (const key of gridKeys) {
      const entities = this.grid.get(key) || [];
      for (const entity of entities) {
        if (checkedEntities.has(entity)) continue;
        checkedEntities.add(entity);
        
        const distance = Math.sqrt(
          (entity.position.x - x) ** 2 + (entity.position.y - y) ** 2
        );
        
        if (distance <= radius) {
          result.push(entity);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Check if a circular area is clear of entities
   * @param x Center X coordinate
   * @param y Center Y coordinate
   * @param radius Check radius
   * @param excludeTypes Entity types to exclude from check
   * @returns True if area is clear
   */
  public isAreaClear(x: number, y: number, radius: number, excludeTypes: string[] = []): boolean {
    const entities = this.getEntitiesInRadius(x, y, radius);
    
    for (const entity of entities) {
      const entityType = entity.constructor.name.toLowerCase();
      if (!excludeTypes.includes(entityType)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get collision debug information
   * @returns Debug information object
   */
  public getDebugInfo(): any {
    return {
      gridCells: this.grid.size,
      totalEntitiesInGrid: Array.from(this.grid.values()).reduce((sum, entities) => sum + entities.length, 0),
      callbacks: this.collisionCallbacks.size,
      gridSize: this.gridSize
    };
  }
}