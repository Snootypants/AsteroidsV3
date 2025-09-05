import { BaseEntity } from '../entities/BaseEntity';
import { Ship } from '../entities/Ship';
import { Asteroid } from '../entities/Asteroid';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Pickup } from '../entities/Pickup';
import { EntityManager } from './EntityManager';
import { PhysicsSystem } from './PhysicsSystem';
import { AudioManager } from './AudioManager';
import { ParticleSystem } from './ParticleSystem';
import { VFXManager } from './VFXManager';
import { DebrisSystem } from './DebrisSystem';

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
  
  // Audio and VFX systems (optional)
  private audioManager?: AudioManager;
  private particleSystem?: ParticleSystem;
  private vfxManager?: VFXManager;
  private debrisSystem?: DebrisSystem;
  
  // Currency collection callback
  private onCurrencyCollected?: (type: string, amount: number) => void;
  
  constructor(
    entityManager: EntityManager,
    audioManager?: AudioManager,
    particleSystem?: ParticleSystem,
    vfxManager?: VFXManager,
    debrisSystem?: DebrisSystem,
    onCurrencyCollected?: (type: string, amount: number) => void
  ) {
    this.entityManager = entityManager;
    this.audioManager = audioManager;
    this.particleSystem = particleSystem;
    this.vfxManager = vfxManager;
    this.debrisSystem = debrisSystem;
    this.onCurrencyCollected = onCurrencyCollected;
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
          // Handle collision with integrated effects
          CollisionSystem.handleShipAsteroidCollision(
            ship,
            entity,
            this.audioManager,
            this.vfxManager
          );
          
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
          // Handle collision with integrated effects
          CollisionSystem.handleBulletAsteroidCollision(
            bullet,
            entity,
            this.entityManager,
            this.audioManager,
            this.particleSystem,
            this.vfxManager,
            this.debrisSystem
          );
          
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
          // Handle collision with integrated effects
          CollisionSystem.handleShipBulletCollision(
            ship,
            bullet,
            this.entityManager,
            this.audioManager,
            this.particleSystem
          );
          
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
          // Handle collision with integrated effects
          CollisionSystem.handleShipEnemyCollision(
            ship,
            entity,
            this.entityManager,
            this.audioManager,
            this.particleSystem,
            this.vfxManager,
            this.debrisSystem
          );
          
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
          // Handle collision with integrated effects
          CollisionSystem.handleBulletEnemyCollision(
            bullet,
            entity,
            this.entityManager,
            this.audioManager,
            this.particleSystem,
            this.vfxManager,
            this.debrisSystem
          );
          
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
          // Handle collision with integrated effects
          CollisionSystem.handleShipPickupCollision(
            ship,
            entity,
            this.entityManager,
            this.audioManager,
            this.particleSystem,
            this.vfxManager,
            this.onCurrencyCollected
          );
          
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
   * @param entityManager Entity manager for scene access
   * @param audioManager Optional audio manager for sound effects
   * @param particleSystem Optional particle system for explosion effects
   * @param vfxManager Optional VFX manager for screen shake
   * @param debrisSystem Optional debris system for destruction particles
   */
  public static handleBulletAsteroidCollision(
    bullet: Bullet,
    asteroid: Asteroid,
    entityManager: EntityManager,
    audioManager?: AudioManager,
    particleSystem?: ParticleSystem,
    vfxManager?: VFXManager,
    debrisSystem?: DebrisSystem
  ): void {
    const scene = entityManager.getScene();
    const position = asteroid.position.clone();
    
    // Determine explosion type based on asteroid size
    let explosionType: string;
    let debrisType: string;
    let shakePreset: string;
    
    if (asteroid.radius >= 15) {
      explosionType = 'explosion_large';
      debrisType = 'asteroid_large';
      shakePreset = 'large_explosion';
      audioManager?.playSound('combat.explosion_large');
    } else if (asteroid.radius >= 8) {
      explosionType = 'explosion_medium';
      debrisType = 'asteroid_medium';
      shakePreset = 'medium_explosion';
      audioManager?.playSound('combat.explosion_medium');
    } else {
      explosionType = 'explosion_small';
      debrisType = 'asteroid_small';
      shakePreset = 'small_explosion';
      audioManager?.playSound('combat.explosion_small');
    }
    
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
    
    // Add visual and audio effects
    particleSystem?.emit(explosionType, position);
    vfxManager?.shakeScreen(shakePreset);
    debrisSystem?.spawnDebris(debrisType, position);
    
    // Currency drops (weighted). Uses existing spawn helpers and magnet targeting.
    try {
      const ships = entityManager.getActiveEntities('ships') as Ship[];
      const dropCount = Math.random() < 0.7 ? 1 : 2; // 70% one, 30% two
      for (let i = 0; i < dropCount; i++) {
        const p = entityManager.spawnRandomPickup(position.x, position.y);
        if (ships.length) p.setMagnetTarget(ships[0]);
      }
    } catch (e) {
      console.warn('[CollisionSystem] Pickup spawn failed:', e);
    }
  }
  
  /**
   * Handle ship-asteroid collision
   * @param ship The ship entity
   * @param asteroid The asteroid entity
   * @param audioManager Optional audio manager for sound effects
   * @param vfxManager Optional VFX manager for screen shake and flash
   */
  public static handleShipAsteroidCollision(
    ship: Ship,
    asteroid: Asteroid,
    audioManager?: AudioManager,
    vfxManager?: VFXManager
  ): void {
    // Make ship invulnerable temporarily
    ship.setInvulnerable(2.0);
    
    // Apply knockback to ship
    const direction = PhysicsSystem.getDirection(asteroid, ship);
    PhysicsSystem.applyImpulse(ship, direction.x * 30, direction.y * 30);
    
    // Audio and visual feedback
    audioManager?.playSound('ship.damage', 1.0);
    vfxManager?.shakeScreen('ship_hit');
    vfxManager?.flash('damage_red');
  }
  
  /**
   * Handle ship-bullet collision (friendly fire)
   * @param ship The ship entity
   * @param bullet The bullet entity
   * @param entityManager Entity manager for scene access
   * @param audioManager Optional audio manager for sound effects
   * @param particleSystem Optional particle system for hit effects
   */
  public static handleShipBulletCollision(
    ship: Ship,
    bullet: Bullet,
    entityManager: EntityManager,
    audioManager?: AudioManager,
    particleSystem?: ParticleSystem
  ): void {
    // Only if friendly fire is enabled
    bullet.despawn(entityManager.getScene());
    
    // Minor damage to ship
    ship.setInvulnerable(1.0);
    
    // Audio and visual feedback
    audioManager?.playSound('combat.bullet_hit', 0.8);
    particleSystem?.emit('sparks', bullet.position.clone());
  }

  /**
   * Handle ship-enemy collision
   * @param ship The ship entity
   * @param enemy The enemy entity
   * @param entityManager Entity manager for scene access
   * @param audioManager Optional audio manager for sound effects
   * @param particleSystem Optional particle system for collision effects
   * @param vfxManager Optional VFX manager for screen shake
   * @param debrisSystem Optional debris system for destruction particles
   */
  public static handleShipEnemyCollision(
    ship: Ship,
    enemy: Enemy,
    entityManager: EntityManager,
    audioManager?: AudioManager,
    particleSystem?: ParticleSystem,
    vfxManager?: VFXManager,
    debrisSystem?: DebrisSystem
  ): void {
    const scene = entityManager.getScene();
    const collisionPoint = enemy.position.clone();
    
    // Both ship and enemy take damage
    ship.setInvulnerable(2.0);
    
    // Audio and visual feedback
    audioManager?.playSound('ship.damage', 1.0);
    vfxManager?.shakeScreen('ship_hit');
    vfxManager?.flash('damage_red');
    particleSystem?.emit('sparks', collisionPoint);
    
    if (enemy.takeDamage(1)) {
      // Enemy destroyed
      enemy.despawn(scene);
      
      // Add destruction effects
      audioManager?.playSound('combat.explosion_medium');
      particleSystem?.emit('explosion_medium', collisionPoint);
      debrisSystem?.spawnDebris('enemy_fragments', collisionPoint);
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
   * @param audioManager Optional audio manager for sound effects
   * @param particleSystem Optional particle system for hit/explosion effects
   * @param vfxManager Optional VFX manager for screen shake
   * @param debrisSystem Optional debris system for destruction particles
   */
  public static handleBulletEnemyCollision(
    bullet: Bullet,
    enemy: Enemy,
    entityManager: EntityManager,
    audioManager?: AudioManager,
    particleSystem?: ParticleSystem,
    vfxManager?: VFXManager,
    debrisSystem?: DebrisSystem
  ): void {
    const scene = entityManager.getScene();
    const hitPosition = enemy.position.clone();
    
    // Destroy bullet
    bullet.despawn(scene);
    
    // Hit sound effect
    audioManager?.playSound('combat.bullet_hit', 0.8);
    particleSystem?.emit('sparks', hitPosition);
    
    // Damage enemy
    if (enemy.takeDamage(bullet.damage)) {
      // Enemy destroyed
      enemy.despawn(scene);
      
      // Destruction effects
      audioManager?.playSound('combat.explosion_medium');
      vfxManager?.shakeScreen('medium_explosion');
      particleSystem?.emit('explosion_medium', hitPosition);
      debrisSystem?.spawnDebris('enemy_fragments', hitPosition, enemy.velocity.clone());
      
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
   * @param audioManager Optional audio manager for sound effects
   * @param particleSystem Optional particle system for collection effects
   * @param vfxManager Optional VFX manager for visual feedback
   * @param onCurrencyCollected Optional callback for currency collection
   */
  public static handleShipPickupCollision(
    ship: Ship,
    pickup: Pickup,
    entityManager: EntityManager,
    audioManager?: AudioManager,
    particleSystem?: ParticleSystem,
    vfxManager?: VFXManager,
    onCurrencyCollected?: (type: string, amount: number) => void
  ): void {
    const pickupPosition = pickup.position.clone();
    const pickupType = pickup.pickupType; // Use the pickupType property
    
    // Apply pickup effect
    if (pickup.applyToShip(ship, onCurrencyCollected)) {
      // Remove pickup if it was consumed
      pickup.despawn(entityManager.getScene());
      
      // Audio and visual feedback based on pickup type
      switch (pickupType) {
        case 'salvage':
        case 'gold':
        case 'platinum':
        case 'adamantium':
          audioManager?.playSound('pickup.salvage');
          vfxManager?.flash('pickup_green');
          break;
        case 'health':
        case 'shield':
          audioManager?.playSound('pickup.health');
          vfxManager?.flash('pickup_green');
          break;
        case 'rapidfire':
        case 'pierce':
        case 'damage':
          audioManager?.playSound('pickup.powerup');
          vfxManager?.flash('powerup_blue');
          vfxManager?.shakeScreen('pickup_collect');
          break;
      }
      
      // Collection particle effects
      particleSystem?.emit('sparkle', pickupPosition);
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