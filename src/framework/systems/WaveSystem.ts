import { EntityManager } from './EntityManager';
import { AsteroidSize } from '../entities/Asteroid';
import { WORLD, ASTEROIDS } from '../constants/gameConstants';
import { AudioManager } from './AudioManager';
import { ParticleSystem } from './ParticleSystem';
import { VFXManager } from './VFXManager';
import * as THREE from 'three';

export interface WaveConfig {
  waveNumber: number;
  asteroidCount: number;
  asteroidSizes: AsteroidSize[];
  enemyCount: number;
  enemyDelay: number; // Delay before spawning enemies
  speedMultiplier: number;
  pickupChance: number; // 0-1 chance for pickups to spawn
}

export interface WaveState {
  currentWave: number;
  waveActive: boolean;
  waveComplete: boolean;
  asteroidCount: number;
  enemyCount: number;
  waveStartTime: number;
  perfectWave: boolean; // No damage taken this wave
}

/**
 * Wave management system for progressive difficulty
 * Handles wave composition, spawning, and state transitions
 */
export class WaveSystem {
  private entityManager: EntityManager;
  private waveState: WaveState;
  
  // Wave progression constants
  private static readonly BASE_ASTEROIDS = 3;
  private static readonly ASTEROIDS_PER_WAVE = 2;
  private static readonly MAX_ASTEROIDS = 20;
  private static readonly ENEMY_START_WAVE = 3;
  private static readonly MAX_ENEMIES = 5;
  
  // Audio and VFX systems (optional)
  private audioManager?: AudioManager;
  private particleSystem?: ParticleSystem;
  private vfxManager?: VFXManager;
  
  // Callbacks
  private onWaveStart?: (wave: number) => void;
  private onWaveComplete?: (wave: number, perfect: boolean) => void;
  private onWaveChange?: (waveState: WaveState) => void;
  private onOpenHangar?: () => void;
  
  constructor(
    entityManager: EntityManager,
    audioManager?: AudioManager,
    particleSystem?: ParticleSystem,
    vfxManager?: VFXManager
  ) {
    this.entityManager = entityManager;
    this.audioManager = audioManager;
    this.particleSystem = particleSystem;
    this.vfxManager = vfxManager;
    
    this.waveState = {
      currentWave: 1,
      waveActive: false,
      waveComplete: false,
      asteroidCount: 0,
      enemyCount: 0,
      waveStartTime: 0,
      perfectWave: true
    };
  }
  
  /**
   * Register wave start callback
   */
  public onWaveStartCallback(callback: (wave: number) => void): void {
    this.onWaveStart = callback;
  }
  
  /**
   * Register wave complete callback
   */
  public onWaveCompleteCallback(callback: (wave: number, perfect: boolean) => void): void {
    this.onWaveComplete = callback;
  }
  
  /**
   * Register wave state change callback
   */
  public onWaveStateChange(callback: (waveState: WaveState) => void): void {
    this.onWaveChange = callback;
  }
  
  /**
   * Register hangar open callback
   */
  public onOpenHangarCallback(callback: () => void): void {
    this.onOpenHangar = callback;
  }
  
  /**
   * Start the current wave
   */
  public startWave(): void {
    if (this.waveState.waveActive) return;
    
    const waveConfig = this.generateWaveConfig(this.waveState.currentWave);
    console.log('[WaveSystem] Starting wave', this.waveState.currentWave, 'with config:', waveConfig);
    
    // Wave start effects
    this.audioManager?.playSound('ui.wave_start');
    this.vfxManager?.flash('wave_complete'); // Use existing golden flash
    this.vfxManager?.shakeScreen('pickup_collect'); // Light shake
    
    // Create wave start particle effect at screen center
    if (this.particleSystem) {
      const centerPos = new THREE.Vector3(0, 0, 0);
      this.particleSystem.emit('fireworks', centerPos);
      
      // Additional sparkle effects around the edges
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 200;
        const sparklePos = new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0
        );
        setTimeout(() => {
          this.particleSystem?.emit('sparkle', sparklePos);
        }, i * 200);
      }
    }
    
    this.spawnWave(waveConfig);
    
    this.waveState.waveActive = true;
    this.waveState.waveComplete = false;
    this.waveState.waveStartTime = performance.now() / 1000;
    this.waveState.perfectWave = true;
    
    this.onWaveStart?.(this.waveState.currentWave);
    this.onWaveChange?.(this.waveState);
  }
  
  /**
   * Update wave state (call from game loop)
   * @param _dt Delta time in seconds
   */
  public update(_dt: number): void {
    if (!this.waveState.waveActive) return;
    
    // Count remaining entities
    const asteroids = this.entityManager.getActiveEntities('asteroids');
    const enemies = this.entityManager.getActiveEntities('enemies') || [];
    
    this.waveState.asteroidCount = asteroids.length;
    this.waveState.enemyCount = enemies.length;
    
    // Check if wave is complete
    if (asteroids.length === 0 && enemies.length === 0) {
      this.completeWave();
    }
    
    this.onWaveChange?.(this.waveState);
  }
  
  /**
   * Complete the current wave
   */
  private completeWave(): void {
    if (!this.waveState.waveActive || this.waveState.waveComplete) return;
    
    this.waveState.waveActive = false;
    this.waveState.waveComplete = true;
    
    // Wave complete effects
    this.audioManager?.playSound('ui.wave_complete');
    
    if (this.waveState.perfectWave) {
      // Perfect wave - extra celebration
      this.vfxManager?.flash('wave_complete'); // Golden flash
      this.vfxManager?.shakeScreen('medium_explosion');
      
      // Perfect wave fireworks display
      if (this.particleSystem) {
        const centerPos = new THREE.Vector3(0, 0, 0);
        this.particleSystem.emit('fireworks', centerPos);
        
        // Multiple fireworks bursts
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 150 + Math.random() * 100;
            const burstPos = new THREE.Vector3(
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              0
            );
            this.particleSystem?.emit('fireworks', burstPos);
          }, i * 300);
        }
      }
    } else {
      // Normal wave complete
      this.vfxManager?.flash('powerup_blue'); // Blue flash
      this.vfxManager?.shakeScreen('small_explosion');
      
      // Single celebration burst
      if (this.particleSystem) {
        const centerPos = new THREE.Vector3(0, 0, 0);
        this.particleSystem.emit('explosion_large', centerPos);
      }
    }
    
    this.onWaveComplete?.(this.waveState.currentWave, this.waveState.perfectWave);
    this.onWaveChange?.(this.waveState);
  }
  
  /**
   * Advance to next wave
   */
  public nextWave(): void {
    if (!this.waveState.waveComplete) return;
    
    this.waveState.currentWave++;
    this.waveState.waveComplete = false;
    
    // Create wave transition particle effect
    if (this.particleSystem) {
      // Create expanding ring of particles
      for (let i = 0; i < 32; i++) {
        setTimeout(() => {
          const angle = (i / 32) * Math.PI * 2;
          const radius = 50;
          const particlePos = new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0
          );
          this.particleSystem?.emit('sparkle', particlePos);
        }, i * 50);
      }
    }
    
    // Check if this is an even wave (hangar cadence)
    if (this.waveState.currentWave % 2 === 0) {
      // Even wave: open hangar overlay
      this.onOpenHangar?.();
    } else {
      // Odd wave: auto-start after brief delay
      setTimeout(() => {
        this.startWave();
      }, 2000);
    }
  }
  
  /**
   * Generate wave configuration based on wave number
   * @param waveNumber Current wave number
   * @returns Wave configuration
   */
  private generateWaveConfig(waveNumber: number): WaveConfig {
    // Calculate asteroid count with cap
    const baseCount = WaveSystem.BASE_ASTEROIDS + (waveNumber - 1) * WaveSystem.ASTEROIDS_PER_WAVE;
    const asteroidCount = Math.min(baseCount, WaveSystem.MAX_ASTEROIDS);
    
    // Generate asteroid size distribution
    const asteroidSizes: AsteroidSize[] = [];
    
    // Early waves: mostly large asteroids
    if (waveNumber <= 2) {
      for (let i = 0; i < asteroidCount; i++) {
        asteroidSizes.push(Math.random() < 0.8 ? 'large' : 'medium');
      }
    }
    // Mid waves: mix of sizes
    else if (waveNumber <= 5) {
      for (let i = 0; i < asteroidCount; i++) {
        const rand = Math.random();
        if (rand < 0.5) asteroidSizes.push('large');
        else if (rand < 0.8) asteroidSizes.push('medium');
        else asteroidSizes.push('small');
      }
    }
    // Later waves: more variety and challenge
    else {
      for (let i = 0; i < asteroidCount; i++) {
        const rand = Math.random();
        if (rand < 0.3) asteroidSizes.push('large');
        else if (rand < 0.7) asteroidSizes.push('medium');
        else asteroidSizes.push('small');
      }
    }
    
    // Calculate enemy count
    const enemyCount = waveNumber >= WaveSystem.ENEMY_START_WAVE 
      ? Math.min(Math.floor((waveNumber - WaveSystem.ENEMY_START_WAVE) / 2) + 1, WaveSystem.MAX_ENEMIES)
      : 0;
    
    // Speed multiplier increases gradually
    const speedMultiplier = 1.0 + (waveNumber - 1) * 0.1;
    
    // Pickup chance increases with wave number
    const pickupChance = Math.min(0.1 + (waveNumber - 1) * 0.02, 0.4);
    
    return {
      waveNumber,
      asteroidCount,
      asteroidSizes,
      enemyCount,
      enemyDelay: enemyCount > 0 ? 5.0 : 0, // 5 second delay for enemies
      speedMultiplier,
      pickupChance
    };
  }
  
  /**
   * Spawn entities for the wave
   * @param config Wave configuration
   */
  private spawnWave(config: WaveConfig): void {
    console.log('[WaveSystem] Spawning wave with', config.asteroidSizes.length, 'asteroids');
    
    // Spawn asteroids
    for (let i = 0; i < config.asteroidSizes.length; i++) {
      const size = config.asteroidSizes[i];
      const position = this.getSpawnPosition();
      
      // Calculate inward velocity with tangential component
      const toCenter = new THREE.Vector3(-position.x, -position.y, 0).normalize();
      const tangent  = new THREE.Vector3(-toCenter.y, toCenter.x, 0);
      const base = ASTEROIDS.baseSpeed * config.speedMultiplier;
      const speed = base * (0.8 + Math.random() * 0.4);
      const tangentAmt = (Math.random() - 0.5) * 0.5 * base;
      const velocity = new THREE.Vector3(
        toCenter.x * speed + tangent.x * tangentAmt,
        toCenter.y * speed + tangent.y * tangentAmt,
        0
      );
      
      this.entityManager.spawnAsteroid(size, position.x, position.y, velocity.x, velocity.y);
      console.log('[WaveSystem] Spawned asteroid', i + 1, 'of', config.asteroidSizes.length, '- size:', size, 'at:', position);
    }
    
    // Schedule enemy spawning if needed
    if (config.enemyCount > 0) {
      setTimeout(() => {
        this.spawnEnemies(config.enemyCount, config.speedMultiplier);
      }, config.enemyDelay * 1000);
    }
  }
  
  /**
   * Spawn enemies for the wave
   * @param count Number of enemies to spawn
   * @param _speedMultiplier Speed multiplier for this wave (unused)
   */
  private spawnEnemies(count: number, _speedMultiplier: number): void {
    for (let i = 0; i < count; i++) {
      // Spawn enemy with delay between each
      setTimeout(() => {
        const position = this.getSpawnPosition();
        
        // TODO: Implement enemy spawning when Enemy entity is created
        // this.entityManager.spawnEnemy(position.x, position.y, velocityX, velocityY);
        console.log(`Would spawn enemy at (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`);
      }, i * 1000); // 1 second between enemy spawns
    }
  }
  
  /**
   * Get spawn position at world edge
   * @returns spawn position outside world bounds
   */
  private getSpawnPosition(): { x: number; y: number } {
    const margin = 20;
    const halfW = WORLD.width / 2;
    const halfH = WORLD.height / 2;
    const side = Math.floor(Math.random() * 4); // 0:L,1:R,2:T,3:B
    switch (side) {
      case 0: return { x: -halfW - margin, y: (Math.random() * 2 - 1) * halfH };
      case 1: return { x:  halfW + margin, y: (Math.random() * 2 - 1) * halfH };
      case 2: return { x: (Math.random() * 2 - 1) * halfW, y:  halfH + margin };
      default:return { x: (Math.random() * 2 - 1) * halfW, y: -halfH - margin };
    }
  }
  
  /**
   * Mark wave as having damage taken (not perfect)
   */
  public markDamage(): void {
    this.waveState.perfectWave = false;
  }
  
  /**
   * Reset wave system for new game
   */
  public reset(): void {
    this.waveState = {
      currentWave: 1,
      waveActive: false,
      waveComplete: false,
      asteroidCount: 0,
      enemyCount: 0,
      waveStartTime: 0,
      perfectWave: true
    };
    
    this.onWaveChange?.(this.waveState);
  }
  
  /**
   * Get current wave state
   */
  public getWaveState(): WaveState {
    return { ...this.waveState };
  }
  
  /**
   * Get current wave number
   */
  public getCurrentWave(): number {
    return this.waveState.currentWave;
  }
  
  /**
   * Check if wave is active
   */
  public isWaveActive(): boolean {
    return this.waveState.waveActive;
  }
  
  /**
   * Check if wave is complete
   */
  public isWaveComplete(): boolean {
    return this.waveState.waveComplete;
  }
  
  /**
   * Get wave progress (0-1)
   */
  public getWaveProgress(): number {
    if (!this.waveState.waveActive) return 0;
    
    const totalEntities = this.waveState.asteroidCount + this.waveState.enemyCount;
    const waveConfig = this.generateWaveConfig(this.waveState.currentWave);
    const initialTotal = waveConfig.asteroidCount + waveConfig.enemyCount;
    
    if (initialTotal === 0) return 1;
    
    return Math.max(0, 1 - (totalEntities / initialTotal));
  }
  
  /**
   * Set audio and VFX systems
   * @param audioManager Audio manager instance
   * @param particleSystem Particle system instance  
   * @param vfxManager VFX manager instance
   */
  public setSystems(
    audioManager?: AudioManager,
    particleSystem?: ParticleSystem,
    vfxManager?: VFXManager
  ): void {
    this.audioManager = audioManager;
    this.particleSystem = particleSystem;
    this.vfxManager = vfxManager;
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      waveState: this.waveState,
      waveConfig: this.generateWaveConfig(this.waveState.currentWave),
      progress: this.getWaveProgress(),
      systems: {
        hasAudio: !!this.audioManager,
        hasParticles: !!this.particleSystem,
        hasVFX: !!this.vfxManager
      },
      constants: {
        baseAsteroids: WaveSystem.BASE_ASTEROIDS,
        asteroidsPerWave: WaveSystem.ASTEROIDS_PER_WAVE,
        maxAsteroids: WaveSystem.MAX_ASTEROIDS,
        enemyStartWave: WaveSystem.ENEMY_START_WAVE,
        maxEnemies: WaveSystem.MAX_ENEMIES
      }
    };
  }
}