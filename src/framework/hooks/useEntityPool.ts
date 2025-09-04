import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';

export interface EntityPool<T extends THREE.Object3D> {
  spawn: (...args: any[]) => T | null;
  despawn: (entity: T) => void;
  getActive: () => T[];
  getPoolSize: () => number;
  getActiveCount: () => number;
  clear: () => void;
}

export interface EntityPoolHook<T extends THREE.Object3D> extends EntityPool<T> {
  // Additional hooks-specific functionality could go here
}

// Generic entity pool matching vanilla implementation patterns
export const useEntityPool = <T extends THREE.Object3D>(
  createEntity: () => T,
  poolSize: number,
  scene?: THREE.Scene
): EntityPoolHook<T> => {
  const pool = useRef<T[]>([]);
  const active = useRef<Set<T>>(new Set());
  
  // Initialize the pool
  useEffect(() => {
    console.log(`[EntityPool] Initializing pool of size ${poolSize}`);
    
    for (let i = 0; i < poolSize; i++) {
      const entity = createEntity();
      entity.visible = false;
      
      // Add to scene if provided
      if (scene) {
        scene.add(entity);
      }
      
      pool.current.push(entity);
    }
    
    return () => {
      // Cleanup - remove all entities from scene
      if (scene) {
        [...pool.current, ...Array.from(active.current)].forEach(entity => {
          scene.remove(entity);
        });
      }
    };
  }, [createEntity, poolSize, scene]);
  
  // Spawn entity from pool
  const spawn = useCallback((): T | null => {
    const entity = pool.current.pop();
    if (!entity) {
      console.warn('[EntityPool] Pool exhausted! Increase pool size.');
      return null;
    }
    
    // Reset entity to default state
    entity.visible = true;
    entity.position.set(0, 0, 0);
    entity.rotation.set(0, 0, 0);
    entity.scale.set(1, 1, 1);
    
    // Reset userData if it exists
    if (entity.userData) {
      // Preserve kind and original data, reset dynamic properties
      const kind = entity.userData.kind;
      const originalData = { ...entity.userData };
      entity.userData = {
        ...originalData,
        kind,
        // Common dynamic properties that should be reset
        vx: 0,
        vy: 0,
        life: 0,
        ttl: 0,
        age: 0,
      };
    }
    
    active.current.add(entity);
    return entity;
  }, []);
  
  // Return entity to pool
  const despawn = useCallback((entity: T) => {
    if (!active.current.has(entity)) {
      console.warn('[EntityPool] Attempting to despawn entity not in active set');
      return;
    }
    
    entity.visible = false;
    active.current.delete(entity);
    pool.current.push(entity);
  }, []);
  
  // Get all active entities
  const getActive = useCallback((): T[] => {
    return Array.from(active.current);
  }, []);
  
  // Get pool information
  const getPoolSize = useCallback((): number => {
    return poolSize;
  }, [poolSize]);
  
  const getActiveCount = useCallback((): number => {
    return active.current.size;
  }, []);
  
  // Clear all active entities (return them to pool)
  const clear = useCallback(() => {
    for (const entity of active.current) {
      entity.visible = false;
      pool.current.push(entity);
    }
    active.current.clear();
  }, []);
  
  return {
    spawn,
    despawn,
    getActive,
    getPoolSize,
    getActiveCount,
    clear,
  };
};

// Specialized hook for particle systems (matching vanilla ParticleSystem class)
export const useParticlePool = (
  poolSize: number = 350,
  scene?: THREE.Scene
) => {
  const createParticle = useCallback(() => {
    const material = new THREE.SpriteMaterial({
      color: 0xffcc88,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    const sprite = new THREE.Sprite(material.clone());
    sprite.scale.set(0.4, 0.4, 1);
    sprite.userData = {
      kind: 'particle',
      vx: 0,
      vy: 0,
      life: 0,
      ttl: 0
    };
    
    return sprite;
  }, []);
  
  const pool = useEntityPool(createParticle, poolSize, scene);
  
  // Emit burst of particles (matching vanilla emitBurst method)
  const emitBurst = useCallback((
    x: number, 
    y: number, 
    options: {
      count?: number;
      speed?: [number, number];
      life?: [number, number];
      size?: [number, number];
      color?: number;
    } = {}
  ) => {
    const {
      count = 14,
      speed = [8, 24],
      life = [0.35, 0.8],
      size = [0.25, 0.9],
      color = 0xffcc88
    } = options;
    
    for (let i = 0; i < count; i++) {
      const particle = pool.spawn();
      if (!particle) break;
      
      const material = particle.material as THREE.SpriteMaterial;
      material.color.setHex(color);
      
      const angle = Math.random() * Math.PI * 2;
      const speed_val = speed[0] + Math.random() * (speed[1] - speed[0]);
      
      particle.userData.vx = Math.cos(angle) * speed_val;
      particle.userData.vy = Math.sin(angle) * speed_val;
      particle.userData.ttl = life[0] + Math.random() * (life[1] - life[0]);
      particle.userData.life = particle.userData.ttl;
      
      const scale = size[0] + Math.random() * (size[1] - size[0]);
      particle.scale.set(scale, scale, 1);
      particle.position.set(x, y, 0);
    }
  }, [pool]);
  
  // Update all particles (call this in your game loop)
  const updateParticles = useCallback((deltaTime: number) => {
    const activeParticles = pool.getActive();
    
    for (const particle of activeParticles) {
      particle.userData.life -= deltaTime;
      
      if (particle.userData.life <= 0) {
        pool.despawn(particle);
        continue;
      }
      
      particle.position.x += particle.userData.vx * deltaTime;
      particle.position.y += particle.userData.vy * deltaTime;
      
      const t = particle.userData.life / particle.userData.ttl;
      const material = particle.material as THREE.SpriteMaterial;
      material.opacity = t;
    }
  }, [pool]);
  
  return {
    ...pool,
    emitBurst,
    updateParticles,
  };
};

// Specialized hook for debris systems (matching vanilla DebrisSystem class)
export const useDebrisPool = (
  poolSize: number = 260,
  scene?: THREE.Scene
) => {
  const createDebris = useCallback(() => {
    const geometry = new THREE.TetrahedronGeometry(0.4);
    const material = new THREE.MeshStandardMaterial({
      color: 0x9aa3ad,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = {
      kind: 'debris',
      vx: 0,
      vy: 0,
      life: 0,
      ttl: 0,
      rot: 0
    };
    
    return mesh;
  }, []);
  
  const pool = useEntityPool(createDebris, poolSize, scene);
  
  // Create debris burst (matching vanilla burst method)
  const burst = useCallback((x: number, y: number, baseCount: number = 8) => {
    const count = baseCount + Math.floor(Math.random() * baseCount);
    
    for (let i = 0; i < count; i++) {
      const debris = pool.spawn();
      if (!debris) break;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 14; // [6, 20] range
      
      debris.userData.vx = Math.cos(angle) * speed;
      debris.userData.vy = Math.sin(angle) * speed;
      debris.userData.ttl = 0.6 + Math.random() * 0.7; // [0.6, 1.3] range
      debris.userData.life = debris.userData.ttl;
      debris.userData.rot = -4 + Math.random() * 8; // [-4, 4] range
      
      debris.position.set(x, y, 0);
      debris.rotation.z = Math.random() * Math.PI * 2;
      
      const material = debris.material as THREE.MeshStandardMaterial;
      material.opacity = 1;
    }
  }, [pool]);
  
  // Update all debris (call this in your game loop)
  const updateDebris = useCallback((deltaTime: number, wrapFunction: (obj: THREE.Object3D) => void) => {
    const activeDebris = pool.getActive();
    
    for (const debris of activeDebris) {
      debris.userData.life -= deltaTime;
      
      if (debris.userData.life <= 0) {
        pool.despawn(debris);
        continue;
      }
      
      debris.position.x += debris.userData.vx * deltaTime;
      debris.position.y += debris.userData.vy * deltaTime;
      wrapFunction(debris);
      
      debris.rotation.z += debris.userData.rot * deltaTime;
      
      const t = debris.userData.life / debris.userData.ttl;
      const material = debris.material as THREE.MeshStandardMaterial;
      material.opacity = t;
      
      const scale = 0.4 + 0.6 * t;
      debris.scale.setScalar(scale);
    }
  }, [pool]);
  
  return {
    ...pool,
    burst,
    updateDebris,
  };
};