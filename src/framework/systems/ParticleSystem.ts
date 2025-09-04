import * as THREE from 'three';

export type ParticleType = 'explosion' | 'muzzle_flash' | 'thrust' | 'sparkle' | 'debris' | 'score_popup' | 'trail';

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  maxSize: number;
  color: THREE.Color;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
}

export interface ParticleEmitterConfig {
  type: ParticleType;
  count: number;
  position: THREE.Vector3;
  velocity: {
    min: THREE.Vector3;
    max: THREE.Vector3;
  };
  size: {
    min: number;
    max: number;
  };
  life: {
    min: number;
    max: number;
  };
  color: {
    start: THREE.Color;
    end: THREE.Color;
  };
  gravity: THREE.Vector3;
  drag: number;
  burst: boolean; // true for instant burst, false for continuous emission
}

/**
 * Particle system for visual effects like explosions, muzzle flashes, and debris
 * Uses object pooling and efficient THREE.js rendering
 */
export class ParticleSystem {
  private scene: THREE.Scene;
  
  // Particle pools by type
  private particlePools: Map<ParticleType, Particle[]> = new Map();
  private activeParticles: Map<ParticleType, Particle[]> = new Map();
  
  // THREE.js objects for rendering
  private particleMeshes: Map<ParticleType, THREE.Points> = new Map();
  private particleGeometries: Map<ParticleType, THREE.BufferGeometry> = new Map();
  private particleMaterials: Map<ParticleType, THREE.PointsMaterial> = new Map();
  
  // Pool sizes by type
  private static readonly POOL_SIZES: Record<ParticleType, number> = {
    explosion: 200,
    muzzle_flash: 50,
    thrust: 30,
    sparkle: 100,
    debris: 150,
    score_popup: 20,
    trail: 80
  };
  
  // Predefined emitter configurations
  private static readonly EMITTER_CONFIGS: Record<string, ParticleEmitterConfig> = {
    asteroid_explosion_large: {
      type: 'explosion',
      count: 25,
      position: new THREE.Vector3(),
      velocity: {
        min: new THREE.Vector3(-50, -50, 0),
        max: new THREE.Vector3(50, 50, 0)
      },
      size: { min: 2, max: 6 },
      life: { min: 1.0, max: 2.5 },
      color: {
        start: new THREE.Color(1, 0.8, 0.4),
        end: new THREE.Color(0.8, 0.3, 0.1)
      },
      gravity: new THREE.Vector3(0, 0, 0),
      drag: 0.98,
      burst: true
    },
    
    asteroid_explosion_medium: {
      type: 'explosion',
      count: 15,
      position: new THREE.Vector3(),
      velocity: {
        min: new THREE.Vector3(-40, -40, 0),
        max: new THREE.Vector3(40, 40, 0)
      },
      size: { min: 1.5, max: 4 },
      life: { min: 0.8, max: 2.0 },
      color: {
        start: new THREE.Color(1, 0.7, 0.3),
        end: new THREE.Color(0.7, 0.2, 0.1)
      },
      gravity: new THREE.Vector3(0, 0, 0),
      drag: 0.98,
      burst: true
    },
    
    asteroid_explosion_small: {
      type: 'explosion',
      count: 8,
      position: new THREE.Vector3(),
      velocity: {
        min: new THREE.Vector3(-30, -30, 0),
        max: new THREE.Vector3(30, 30, 0)
      },
      size: { min: 1, max: 3 },
      life: { min: 0.5, max: 1.5 },
      color: {
        start: new THREE.Color(1, 0.6, 0.2),
        end: new THREE.Color(0.6, 0.1, 0.05)
      },
      gravity: new THREE.Vector3(0, 0, 0),
      drag: 0.98,
      burst: true
    },
    
    ship_muzzle_flash: {
      type: 'muzzle_flash',
      count: 5,
      position: new THREE.Vector3(),
      velocity: {
        min: new THREE.Vector3(-5, 0, 0),
        max: new THREE.Vector3(5, 20, 0)
      },
      size: { min: 1, max: 3 },
      life: { min: 0.05, max: 0.15 },
      color: {
        start: new THREE.Color(0.4, 0.8, 1),
        end: new THREE.Color(0.2, 0.4, 0.8)
      },
      gravity: new THREE.Vector3(0, 0, 0),
      drag: 0.95,
      burst: true
    },
    
    ship_thrust: {
      type: 'thrust',
      count: 3,
      position: new THREE.Vector3(),
      velocity: {
        min: new THREE.Vector3(-2, -15, 0),
        max: new THREE.Vector3(2, -5, 0)
      },
      size: { min: 0.5, max: 2 },
      life: { min: 0.1, max: 0.3 },
      color: {
        start: new THREE.Color(0.3, 0.6, 1),
        end: new THREE.Color(0.1, 0.3, 0.8)
      },
      gravity: new THREE.Vector3(0, 0, 0),
      drag: 0.9,
      burst: false
    },
    
    pickup_collect: {
      type: 'sparkle',
      count: 12,
      position: new THREE.Vector3(),
      velocity: {
        min: new THREE.Vector3(-20, -20, 0),
        max: new THREE.Vector3(20, 20, 0)
      },
      size: { min: 1, max: 4 },
      life: { min: 0.5, max: 1.0 },
      color: {
        start: new THREE.Color(0.8, 1, 0.4),
        end: new THREE.Color(0.4, 0.8, 0.2)
      },
      gravity: new THREE.Vector3(0, 0, 0),
      drag: 0.95,
      burst: true
    },
    
    score_popup: {
      type: 'score_popup',
      count: 1,
      position: new THREE.Vector3(),
      velocity: {
        min: new THREE.Vector3(0, 10, 0),
        max: new THREE.Vector3(0, 20, 0)
      },
      size: { min: 3, max: 5 },
      life: { min: 1.5, max: 1.5 },
      color: {
        start: new THREE.Color(1, 1, 0.4),
        end: new THREE.Color(1, 1, 1)
      },
      gravity: new THREE.Vector3(0, -10, 0),
      drag: 0.99,
      burst: true
    }
  };
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializePools();
    this.createRenderingObjects();
  }
  
  /**
   * Initialize particle pools for each type
   */
  private initializePools(): void {
    for (const [type, poolSize] of Object.entries(ParticleSystem.POOL_SIZES)) {
      const particleType = type as ParticleType;
      const pool: Particle[] = [];
      const active: Particle[] = [];
      
      for (let i = 0; i < poolSize; i++) {
        pool.push(this.createParticle());
      }
      
      this.particlePools.set(particleType, pool);
      this.activeParticles.set(particleType, active);
    }
  }
  
  /**
   * Create a new particle object
   */
  private createParticle(): Particle {
    return {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      acceleration: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      size: 1,
      maxSize: 1,
      color: new THREE.Color(1, 1, 1),
      alpha: 1,
      rotation: 0,
      rotationSpeed: 0,
      active: false
    };
  }
  
  /**
   * Create THREE.js objects for rendering particles
   */
  private createRenderingObjects(): void {
    for (const particleType of Object.values(ParticleSystem.POOL_SIZES).map((_, i) => Object.keys(ParticleSystem.POOL_SIZES)[i] as ParticleType)) {
      const poolSize = ParticleSystem.POOL_SIZES[particleType];
      
      // Create geometry
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(poolSize * 3);
      const colors = new Float32Array(poolSize * 3);
      const sizes = new Float32Array(poolSize);
      const alphas = new Float32Array(poolSize);
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
      
      // Create material
      const material = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        sizeAttenuation: true,
        alphaTest: 0.001
      });
      
      // Create points mesh
      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false; // Prevent culling issues
      
      this.particleGeometries.set(particleType, geometry);
      this.particleMaterials.set(particleType, material);
      this.particleMeshes.set(particleType, points);
      
      this.scene.add(points);
    }
  }
  
  /**
   * Emit particles using a predefined configuration
   */
  public emit(configName: string, position: THREE.Vector3, direction?: THREE.Vector3): void {
    const config = ParticleSystem.EMITTER_CONFIGS[configName];
    if (!config) {
      console.warn(`Unknown particle config: ${configName}`);
      return;
    }
    
    // Update position
    const emitConfig = { ...config };
    emitConfig.position = position.clone();
    
    // Apply direction if provided
    if (direction) {
      const angle = Math.atan2(direction.y, direction.x);
      emitConfig.velocity.min.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);
      emitConfig.velocity.max.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);
    }
    
    this.emitParticles(emitConfig);
  }
  
  /**
   * Emit particles with custom configuration
   */
  public emitParticles(config: ParticleEmitterConfig): void {
    const pool = this.particlePools.get(config.type);
    const active = this.activeParticles.get(config.type);
    
    if (!pool || !active) return;
    
    for (let i = 0; i < config.count; i++) {
      const particle = pool.pop();
      if (!particle) break; // Pool exhausted
      
      // Initialize particle
      particle.position.copy(config.position);
      
      // Random velocity within range
      particle.velocity.set(
        THREE.MathUtils.lerp(config.velocity.min.x, config.velocity.max.x, Math.random()),
        THREE.MathUtils.lerp(config.velocity.min.y, config.velocity.max.y, Math.random()),
        THREE.MathUtils.lerp(config.velocity.min.z, config.velocity.max.z, Math.random())
      );
      
      particle.acceleration.copy(config.gravity);
      
      // Random size and life
      particle.size = THREE.MathUtils.lerp(config.size.min, config.size.max, Math.random());
      particle.maxSize = particle.size;
      particle.maxLife = THREE.MathUtils.lerp(config.life.min, config.life.max, Math.random());
      particle.life = particle.maxLife;
      
      // Color
      particle.color.copy(config.color.start);
      particle.alpha = 1;
      
      // Random rotation
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = (Math.random() - 0.5) * 5;
      
      particle.active = true;
      active.push(particle);
    }
  }
  
  /**
   * Update all particles
   */
  public update(deltaTime: number): void {
    for (const [particleType, activeList] of this.activeParticles) {
      this.updateParticleType(particleType, activeList, deltaTime);
      this.updateRenderingData(particleType, activeList);
    }
  }
  
  /**
   * Update particles of a specific type
   */
  private updateParticleType(particleType: ParticleType, particles: Particle[], deltaTime: number): void {
    const pool = this.particlePools.get(particleType);
    if (!pool) return;
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      // Update life
      particle.life -= deltaTime;
      
      if (particle.life <= 0) {
        // Return to pool
        particle.active = false;
        particles.splice(i, 1);
        pool.push(particle);
        continue;
      }
      
      // Update physics
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime));
      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
      
      // Apply drag
      const config = this.getConfigForType(particleType);
      if (config) {
        particle.velocity.multiplyScalar(config.drag);
      }
      
      // Update visual properties based on life
      const lifeRatio = 1 - (particle.life / particle.maxLife);
      
      // Update alpha (fade out)
      particle.alpha = 1 - lifeRatio;
      
      // Update size (some particles grow, others shrink)
      switch (particleType) {
        case 'explosion':
          particle.size = particle.maxSize * (1 + lifeRatio * 0.5); // Grow slightly
          break;
        case 'muzzle_flash':
          particle.size = particle.maxSize * (1 - lifeRatio * 0.5); // Shrink
          break;
        case 'score_popup':
          particle.size = particle.maxSize * (1 + Math.sin(lifeRatio * Math.PI) * 0.3); // Pulse
          break;
        default:
          particle.size = particle.maxSize;
      }
      
      // Update color interpolation
      if (config) {
        particle.color.lerpColors(config.color.start, config.color.end, lifeRatio);
      }
      
      // Update rotation
      particle.rotation += particle.rotationSpeed * deltaTime;
    }
  }
  
  /**
   * Get configuration for particle type (simplified)
   */
  private getConfigForType(particleType: ParticleType): ParticleEmitterConfig | null {
    // Return first config that matches type
    for (const config of Object.values(ParticleSystem.EMITTER_CONFIGS)) {
      if (config.type === particleType) {
        return config;
      }
    }
    return null;
  }
  
  /**
   * Update rendering data for a particle type
   */
  private updateRenderingData(particleType: ParticleType, particles: Particle[]): void {
    const geometry = this.particleGeometries.get(particleType);
    const material = this.particleMaterials.get(particleType);
    
    if (!geometry || !material) return;
    
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const colors = geometry.attributes.color as THREE.BufferAttribute;
    const sizes = geometry.attributes.size as THREE.BufferAttribute;
    const alphas = geometry.attributes.alpha as THREE.BufferAttribute;
    
    // Update active particles
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      
      // Position
      positions.setXYZ(i, particle.position.x, particle.position.y, particle.position.z);
      
      // Color
      colors.setXYZ(i, particle.color.r, particle.color.g, particle.color.b);
      
      // Size
      sizes.setX(i, particle.size);
      
      // Alpha
      alphas.setX(i, particle.alpha);
    }
    
    // Hide inactive particles by moving them far away
    for (let i = particles.length; i < positions.count; i++) {
      positions.setXYZ(i, 10000, 10000, 10000);
      alphas.setX(i, 0);
    }
    
    // Mark attributes as needing update
    positions.needsUpdate = true;
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
    alphas.needsUpdate = true;
    
    // Update draw range to only render active particles
    geometry.setDrawRange(0, Math.max(particles.length, 1));
  }
  
  /**
   * Clear all particles of a specific type
   */
  public clearParticles(particleType: ParticleType): void {
    const active = this.activeParticles.get(particleType);
    const pool = this.particlePools.get(particleType);
    
    if (!active || !pool) return;
    
    // Return all active particles to pool
    for (const particle of active) {
      particle.active = false;
      pool.push(particle);
    }
    active.length = 0;
  }
  
  /**
   * Clear all particles
   */
  public clearAllParticles(): void {
    for (const particleType of Object.keys(ParticleSystem.POOL_SIZES) as ParticleType[]) {
      this.clearParticles(particleType);
    }
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    const activeCount: Record<ParticleType, number> = {} as any;
    const poolCount: Record<ParticleType, number> = {} as any;
    
    for (const [type, active] of this.activeParticles) {
      activeCount[type] = active.length;
      poolCount[type] = this.particlePools.get(type)?.length || 0;
    }
    
    return {
      active: activeCount,
      pools: poolCount,
      totalActive: Object.values(activeCount).reduce((sum, count) => sum + count, 0),
      totalPooled: Object.values(poolCount).reduce((sum, count) => sum + count, 0)
    };
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    for (const geometry of this.particleGeometries.values()) {
      geometry.dispose();
    }
    
    for (const material of this.particleMaterials.values()) {
      material.dispose();
    }
    
    for (const mesh of this.particleMeshes.values()) {
      this.scene.remove(mesh);
    }
    
    this.particleGeometries.clear();
    this.particleMaterials.clear();
    this.particleMeshes.clear();
  }
}