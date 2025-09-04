import { GameState } from '../hooks/useGameState';
import { EntityManager } from '../systems/EntityManager';
import { CollisionSystem } from '../systems/CollisionSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';

export interface GameLoopCallbacks {
  onUpdate?: (dt: number) => void;
  onRender?: (dt: number) => void;
  onBeforeUpdate?: (dt: number) => void;
  onAfterUpdate?: (dt: number) => void;
}

/**
 * Main game loop system
 * Handles timing, delta time calculation, and orchestrates game updates
 */
export class GameLoop {
  // Timing
  private lastTime: number = 0;
  private running: boolean = false;
  private animationFrameId?: number;
  
  // Performance tracking
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private currentFPS: number = 60;
  private currentFrameTime: number = 16.67;
  
  // System references
  private entityManager: EntityManager;
  private gameState: GameState;
  private callbacks: GameLoopCallbacks;
  private collisionSystem: CollisionSystem;

  // Constants
  private static readonly MAX_DELTA_TIME = 0.033; // 33ms cap (30 FPS minimum)
  private static readonly FPS_UPDATE_INTERVAL = 1.0; // Update FPS every second

  constructor(
    entityManager: EntityManager,
    gameState: GameState,
    callbacks: GameLoopCallbacks = {}
  ) {
    this.entityManager = entityManager;
    this.gameState = gameState;
    this.callbacks = callbacks;
    this.collisionSystem = new CollisionSystem(entityManager);
    
    // Setup collision callbacks
    this.setupCollisionCallbacks();
  }

  /**
   * Start the game loop
   */
  public start(): void {
    if (this.running) return;
    
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.frameCount = 0;
    this.fpsUpdateTime = this.lastTime;
    
    this.tick();
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    this.running = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  /**
   * Pause the game loop
   */
  public pause(): void {
    this.stop();
  }

  /**
   * Resume the game loop
   */
  public resume(): void {
    if (!this.running) {
      this.start();
    }
  }

  /**
   * Main game loop tick
   */
  private tick = (): void => {
    if (!this.running) return;
    
    // Calculate delta time
    const now = performance.now() / 1000;
    let dt = now - this.lastTime;
    this.lastTime = now;
    
    // Clamp delta time to prevent spiral of death
    dt = Math.min(dt, GameLoop.MAX_DELTA_TIME);
    
    // Update performance metrics
    this.updatePerformanceMetrics(now, dt);
    
    // Only update if game conditions are met
    if (this.shouldUpdate()) {
      // Pre-update callback
      this.callbacks.onBeforeUpdate?.(dt);
      
      // Main update
      this.update(dt);
      
      // Post-update callback
      this.callbacks.onAfterUpdate?.(dt);
    }
    
    // Render callback (always called for smooth animation)
    this.callbacks.onRender?.(dt);
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  /**
   * Check if game should update based on current state
   */
  private shouldUpdate(): boolean {
    return (
      this.gameState.gamePhase === 'playing' &&
      !this.gameState.overlay.show &&
      !this.gameState.paused &&
      !this.gameState.gameOver &&
      !this.gameState.pausedForUpgrade
    );
  }

  /**
   * Setup collision system callbacks
   */
  private setupCollisionCallbacks(): void {
    // Handle bullet-asteroid collisions
    this.collisionSystem.onCollision('bullet-asteroid', (event) => {
      const bullet = event.entityA;
      const asteroid = event.entityB;
      CollisionSystem.handleBulletAsteroidCollision(bullet as any, asteroid as any, this.entityManager);
    });
    
    // Handle ship-asteroid collisions
    this.collisionSystem.onCollision('ship-asteroid', (event) => {
      const ship = event.entityA;
      const asteroid = event.entityB;
      CollisionSystem.handleShipAsteroidCollision(ship as any, asteroid as any);
    });
    
    // Handle ship-bullet collisions (friendly fire)
    this.collisionSystem.onCollision('ship-bullet', (event) => {
      const ship = event.entityA;
      const bullet = event.entityB;
      CollisionSystem.handleShipBulletCollision(ship as any, bullet as any, this.entityManager);
    });
  }

  /**
   * Main game update logic
   */
  private update(dt: number): void {
    // Custom update callback
    this.callbacks.onUpdate?.(dt);
    
    // Update physics for all entities
    const allEntities = [
      ...this.entityManager.getActiveEntities('ships'),
      ...this.entityManager.getActiveEntities('asteroids'),
      ...this.entityManager.getActiveEntities('bullets')
    ];
    PhysicsSystem.updateEntities(allEntities, dt);
    
    // Update entity logic
    this.entityManager.update(dt);
    
    // Check collisions
    this.collisionSystem.update(dt);
    
    // Update game state timers
    this.updateGameStateTimers(dt);
  }

  /**
   * Update game state timing values
   */
  private updateGameStateTimers(dt: number): void {
    // Update combo timer
    if (this.gameState.comboTimer > 0) {
      const newComboTimer = Math.max(0, this.gameState.comboTimer - dt);
      if (newComboTimer === 0 && this.gameState.comboTimer > 0) {
        // Combo expired - reset combo multiplier
        // This would be handled by the useGameState hook's decrementComboTimer method
      }
    }
    
    // Update invulnerability timer
    if (this.gameState.invuln > 0) {
      // This would be handled by the useGameState hook's decrementInvuln method
    }
    
    // Play time would be updated through gameState updates
    // const newPlayTime = this.gameState.stats.playTime + dt;
  }

  /**
   * Update performance tracking metrics
   */
  private updatePerformanceMetrics(now: number, dt: number): void {
    this.frameCount++;
    this.currentFrameTime = dt * 1000; // Convert to milliseconds
    
    // Update FPS every second
    if (now - this.fpsUpdateTime >= GameLoop.FPS_UPDATE_INTERVAL) {
      this.currentFPS = this.frameCount / (now - this.fpsUpdateTime);
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): { fps: number; frameTime: number } {
    return {
      fps: this.currentFPS,
      frameTime: this.currentFrameTime
    };
  }

  /**
   * Get current running state
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * Update callbacks
   */
  public updateCallbacks(callbacks: GameLoopCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get entity manager reference
   */
  public getEntityManager(): EntityManager {
    return this.entityManager;
  }

  /**
   * Force update game state reference (useful when game state changes)
   */
  public updateGameState(gameState: GameState): void {
    this.gameState = gameState;
  }
  
  /**
   * Get collision system reference
   */
  public getCollisionSystem(): CollisionSystem {
    return this.collisionSystem;
  }
}

/**
 * Hook to create and manage game loop
 * Integrates with React component lifecycle
 */
export const useGameLoop = (
  entityManager: EntityManager,
  gameState: GameState,
  callbacks: GameLoopCallbacks = {}
) => {
  // Create game loop instance (could be memoized in real implementation)
  const gameLoop = new GameLoop(entityManager, gameState, callbacks);
  
  return {
    gameLoop,
    start: () => gameLoop.start(),
    stop: () => gameLoop.stop(),
    pause: () => gameLoop.pause(),
    resume: () => gameLoop.resume(),
    isRunning: () => gameLoop.isRunning(),
    getPerformanceMetrics: () => gameLoop.getPerformanceMetrics(),
    updateCallbacks: (newCallbacks: GameLoopCallbacks) => gameLoop.updateCallbacks(newCallbacks),
    getCollisionSystem: () => gameLoop.getCollisionSystem()
  };
};