import * as THREE from 'three';
import { BaseEntity } from '../entities/BaseEntity';

export interface DebrisConfig {
  count: number;
  sizeRange: { min: number; max: number };
  speedRange: { min: number; max: number };
  lifetime: number;
  material: THREE.Material;
  geometry: THREE.BufferGeometry;
  physics: {
    drag: number;
    gravity: THREE.Vector3;
    bounce: number;
  };
}

export interface DebrisParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  size: number;
  active: boolean;
}

/**
 * Physics-based debris system for realistic destruction effects
 * Creates chunks of destroyed entities that interact with physics
 */
export class DebrisSystem {
  private scene: THREE.Scene;
  
  // Debris particles
  private activeDebris: DebrisParticle[] = [];
  private debrisPool: DebrisParticle[] = [];
  
  // Geometries and materials for different debris types
  private asteroidChunkGeometry?: THREE.BufferGeometry;
  private shipWreckageGeometry?: THREE.BufferGeometry;
  private enemyFragmentGeometry?: THREE.BufferGeometry;
  
  private asteroidMaterial?: THREE.Material;
  private metalMaterial?: THREE.Material;
  
  // Configuration presets
  private static readonly DEBRIS_PRESETS: Record<string, DebrisConfig> = {
    asteroid_large: {
      count: 8,
      sizeRange: { min: 1.0, max: 2.5 },
      speedRange: { min: 5, max: 25 },
      lifetime: 5.0,
      material: null as any, // Will be set in constructor
      geometry: null as any, // Will be set in constructor
      physics: {
        drag: 0.98,
        gravity: new THREE.Vector3(0, 0, 0),
        bounce: 0.3
      }
    },
    
    asteroid_medium: {
      count: 5,
      sizeRange: { min: 0.7, max: 1.8 },
      speedRange: { min: 8, max: 30 },
      lifetime: 4.0,
      material: null as any,
      geometry: null as any,
      physics: {
        drag: 0.97,
        gravity: new THREE.Vector3(0, 0, 0),
        bounce: 0.4
      }
    },
    
    asteroid_small: {
      count: 3,
      sizeRange: { min: 0.5, max: 1.2 },
      speedRange: { min: 10, max: 35 },
      lifetime: 3.0,
      material: null as any,
      geometry: null as any,
      physics: {
        drag: 0.96,
        gravity: new THREE.Vector3(0, 0, 0),
        bounce: 0.5
      }
    },
    
    ship_wreckage: {
      count: 6,
      sizeRange: { min: 0.8, max: 2.0 },
      speedRange: { min: 10, max: 40 },
      lifetime: 8.0,
      material: null as any,
      geometry: null as any,
      physics: {
        drag: 0.95,
        gravity: new THREE.Vector3(0, 0, 0),
        bounce: 0.2
      }
    },
    
    enemy_fragments: {
      count: 4,
      sizeRange: { min: 0.6, max: 1.5 },
      speedRange: { min: 15, max: 45 },
      lifetime: 6.0,
      material: null as any,
      geometry: null as any,
      physics: {
        drag: 0.94,
        gravity: new THREE.Vector3(0, 0, 0),
        bounce: 0.3
      }
    }
  };
  
  // Pool size
  private static readonly MAX_DEBRIS = 150;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createGeometries();
    this.createMaterials();
    this.updatePresetReferences();
    this.initializePool();
  }
  
  /**
   * Create geometries for different debris types
   */
  private createGeometries(): void {
    // Asteroid chunk geometry - irregular tetrahedron
    const asteroidVertices = new Float32Array([
      // Tetrahedron with random variation
      0, 1, 0,
      -0.8, -0.5, 0.8,
      0.8, -0.5, 0.8,
      0, -0.5, -0.8
    ]);
    
    const asteroidIndices = new Uint16Array([
      0, 1, 2,
      0, 2, 3,
      0, 3, 1,
      1, 3, 2
    ]);
    
    this.asteroidChunkGeometry = new THREE.BufferGeometry();
    this.asteroidChunkGeometry.setAttribute('position', new THREE.BufferAttribute(asteroidVertices, 3));
    this.asteroidChunkGeometry.setIndex(new THREE.BufferAttribute(asteroidIndices, 1));
    this.asteroidChunkGeometry.computeVertexNormals();
    
    // Ship wreckage geometry - angular pieces
    const shipVertices = new Float32Array([
      // Angular ship fragment
      -1, 0, 0,
      1, 0, 0,
      0, 0.8, 0,
      0, -0.5, 0.5,
      0, -0.5, -0.5
    ]);
    
    const shipIndices = new Uint16Array([
      0, 1, 2,
      0, 1, 3,
      1, 2, 4,
      0, 2, 3,
      1, 3, 4,
      2, 3, 4
    ]);
    
    this.shipWreckageGeometry = new THREE.BufferGeometry();
    this.shipWreckageGeometry.setAttribute('position', new THREE.BufferAttribute(shipVertices, 3));
    this.shipWreckageGeometry.setIndex(new THREE.BufferAttribute(shipIndices, 1));
    this.shipWreckageGeometry.computeVertexNormals();
    
    // Enemy fragment geometry - cubic chunks
    this.enemyFragmentGeometry = new THREE.BoxGeometry(1, 1, 1);
  }
  
  /**
   * Create materials for debris
   */
  private createMaterials(): void {
    this.asteroidMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.8
    });
    
    this.metalMaterial = new THREE.MeshBasicMaterial({
      color: 0xaaaaaa,
      transparent: true,
      opacity: 0.9
    });
  }
  
  /**
   * Update preset configurations with actual materials and geometries
   */
  private updatePresetReferences(): void {
    // Asteroid debris
    DebrisSystem.DEBRIS_PRESETS.asteroid_large.geometry = this.asteroidChunkGeometry!;
    DebrisSystem.DEBRIS_PRESETS.asteroid_large.material = this.asteroidMaterial!;
    
    DebrisSystem.DEBRIS_PRESETS.asteroid_medium.geometry = this.asteroidChunkGeometry!;
    DebrisSystem.DEBRIS_PRESETS.asteroid_medium.material = this.asteroidMaterial!;
    
    DebrisSystem.DEBRIS_PRESETS.asteroid_small.geometry = this.asteroidChunkGeometry!;
    DebrisSystem.DEBRIS_PRESETS.asteroid_small.material = this.asteroidMaterial!;
    
    // Ship and enemy debris
    DebrisSystem.DEBRIS_PRESETS.ship_wreckage.geometry = this.shipWreckageGeometry!;
    DebrisSystem.DEBRIS_PRESETS.ship_wreckage.material = this.metalMaterial!;
    
    DebrisSystem.DEBRIS_PRESETS.enemy_fragments.geometry = this.enemyFragmentGeometry!;
    DebrisSystem.DEBRIS_PRESETS.enemy_fragments.material = this.metalMaterial!;
  }
  
  /**
   * Initialize debris pool
   */
  private initializePool(): void {
    for (let i = 0; i < DebrisSystem.MAX_DEBRIS; i++) {
      const debris = this.createDebrisParticle();
      this.debrisPool.push(debris);
    }
  }
  
  /**
   * Create a debris particle object
   */
  private createDebrisParticle(): DebrisParticle {
    // Start with a basic cube geometry and material
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const mesh = new THREE.Mesh(geometry, material);
    
    return {
      mesh,
      velocity: new THREE.Vector3(),
      angularVelocity: new THREE.Vector3(),
      lifetime: 0,
      maxLifetime: 1,
      size: 1,
      active: false
    };
  }
  
  /**
   * Spawn debris using a preset configuration
   */
  public spawnDebris(presetName: string, position: THREE.Vector3, initialVelocity?: THREE.Vector3): void {
    const config = DebrisSystem.DEBRIS_PRESETS[presetName];
    if (!config) {
      console.warn(`Unknown debris preset: ${presetName}`);
      return;
    }
    
    this.spawnDebrisCustom(config, position, initialVelocity);
  }
  
  /**
   * Spawn debris with custom configuration
   */
  public spawnDebrisCustom(config: DebrisConfig, position: THREE.Vector3, initialVelocity: THREE.Vector3 = new THREE.Vector3()): void {
    for (let i = 0; i < config.count; i++) {
      const debris = this.debrisPool.pop();
      if (!debris) break; // Pool exhausted
      
      // Update mesh geometry and material
      debris.mesh.geometry = config.geometry;
      debris.mesh.material = config.material;
      
      // Set position
      debris.mesh.position.copy(position);
      
      // Random size
      debris.size = THREE.MathUtils.lerp(config.sizeRange.min, config.sizeRange.max, Math.random());
      debris.mesh.scale.setScalar(debris.size);
      
      // Random velocity
      const speed = THREE.MathUtils.lerp(config.speedRange.min, config.speedRange.max, Math.random());
      const angle = Math.random() * Math.PI * 2;
      debris.velocity.set(
        Math.cos(angle) * speed + initialVelocity.x,
        Math.sin(angle) * speed + initialVelocity.y,
        (Math.random() - 0.5) * speed * 0.5 + initialVelocity.z
      );
      
      // Random angular velocity
      debris.angularVelocity.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      
      // Set lifetime
      debris.lifetime = config.lifetime;
      debris.maxLifetime = config.lifetime;
      debris.active = true;
      
      // Add to scene and active list
      this.scene.add(debris.mesh);
      this.activeDebris.push(debris);
    }
  }
  
  /**
   * Update all debris particles
   */
  public update(deltaTime: number): void {
    for (let i = this.activeDebris.length - 1; i >= 0; i--) {
      const debris = this.activeDebris[i];
      
      // Update lifetime
      debris.lifetime -= deltaTime;
      
      if (debris.lifetime <= 0) {
        // Return to pool
        this.removeDebris(debris, i);
        continue;
      }
      
      // Update physics
      this.updateDebrisPhysics(debris, deltaTime);
      
      // Update visual properties
      this.updateDebrisVisuals(debris);
    }
  }
  
  /**
   * Update debris physics
   */
  private updateDebrisPhysics(debris: DebrisParticle, deltaTime: number): void {
    // Apply gravity (if any)
    const config = this.getConfigForDebris(debris);
    if (config) {
      debris.velocity.add(config.physics.gravity.clone().multiplyScalar(deltaTime));
      
      // Apply drag
      debris.velocity.multiplyScalar(config.physics.drag);
    }
    
    // Update position
    debris.mesh.position.add(debris.velocity.clone().multiplyScalar(deltaTime));
    
    // Update rotation
    debris.mesh.rotateX(debris.angularVelocity.x * deltaTime);
    debris.mesh.rotateY(debris.angularVelocity.y * deltaTime);
    debris.mesh.rotateZ(debris.angularVelocity.z * deltaTime);
    
    // World wrapping (optional)
    this.wrapDebrisPosition(debris);
  }
  
  /**
   * Wrap debris position around world bounds
   */
  private wrapDebrisPosition(debris: DebrisParticle): void {
    const halfWidth = 800; // Half world width
    const halfHeight = 450; // Half world height
    
    if (debris.mesh.position.x > halfWidth + 50) {
      debris.mesh.position.x = -halfWidth - 50;
    } else if (debris.mesh.position.x < -halfWidth - 50) {
      debris.mesh.position.x = halfWidth + 50;
    }
    
    if (debris.mesh.position.y > halfHeight + 50) {
      debris.mesh.position.y = -halfHeight - 50;
    } else if (debris.mesh.position.y < -halfHeight - 50) {
      debris.mesh.position.y = halfHeight + 50;
    }
  }
  
  /**
   * Update debris visual properties
   */
  private updateDebrisVisuals(debris: DebrisParticle): void {
    // Fade out over lifetime
    const lifeRatio = debris.lifetime / debris.maxLifetime;
    const material = debris.mesh.material as THREE.MeshBasicMaterial;
    
    // Fade out in the last 30% of lifetime
    if (lifeRatio < 0.3) {
      material.opacity = lifeRatio / 0.3;
    }
  }
  
  /**
   * Get configuration for a debris particle (simplified lookup)
   */
  private getConfigForDebris(_debris: DebrisParticle): DebrisConfig | null {
    // In a more complex system, you might track which config each debris uses
    // For now, return a default config
    return DebrisSystem.DEBRIS_PRESETS.asteroid_large;
  }
  
  /**
   * Remove debris particle and return to pool
   */
  private removeDebris(debris: DebrisParticle, index: number): void {
    // Remove from scene
    this.scene.remove(debris.mesh);
    
    // Remove from active list
    this.activeDebris.splice(index, 1);
    
    // Reset state
    debris.active = false;
    debris.lifetime = 0;
    
    // Return to pool if there's space
    if (this.debrisPool.length < DebrisSystem.MAX_DEBRIS) {
      this.debrisPool.push(debris);
    }
  }
  
  /**
   * Clear all active debris
   */
  public clearAllDebris(): void {
    for (let i = this.activeDebris.length - 1; i >= 0; i--) {
      this.removeDebris(this.activeDebris[i], i);
    }
  }
  
  /**
   * Check collision with other entities
   */
  public checkCollisions(entities: BaseEntity[]): void {
    for (const debris of this.activeDebris) {
      for (const entity of entities) {
        if (!entity.active) continue;
        
        const distance = debris.mesh.position.distanceTo(entity.position);
        const minDistance = debris.size + entity.radius;
        
        if (distance < minDistance) {
          // Simple collision response - debris bounces off entity
          const direction = debris.mesh.position.clone().sub(entity.position).normalize();
          const config = this.getConfigForDebris(debris);
          
          if (config) {
            // Apply bounce
            const bounceStrength = config.physics.bounce * 20;
            debris.velocity.add(direction.multiplyScalar(bounceStrength));
            
            // Add some randomness
            debris.velocity.add(new THREE.Vector3(
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 10,
              0
            ));
          }
        }
      }
    }
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      active: this.activeDebris.length,
      pooled: this.debrisPool.length,
      total: this.activeDebris.length + this.debrisPool.length,
      maxCapacity: DebrisSystem.MAX_DEBRIS
    };
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Clear all debris
    this.clearAllDebris();
    
    // Dispose of geometries
    this.asteroidChunkGeometry?.dispose();
    this.shipWreckageGeometry?.dispose();
    this.enemyFragmentGeometry?.dispose();
    
    // Dispose of materials
    this.asteroidMaterial?.dispose();
    this.metalMaterial?.dispose();
    
    // Clear pools
    this.debrisPool.length = 0;
  }
}