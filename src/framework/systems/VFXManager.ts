import * as THREE from 'three';

export interface ScreenShakeConfig {
  intensity: number;
  duration: number;
  frequency: number;
}

export interface FlashConfig {
  color: THREE.Color;
  intensity: number;
  duration: number;
  fadeOut: boolean;
}

export interface TrailConfig {
  length: number;
  width: number;
  color: THREE.Color;
  fadeRate: number;
}

/**
 * Visual Effects Manager for screen shake, flashes, trails, and other visual feedback
 * Integrates with camera and rendering pipeline for immersive effects
 */
export class VFXManager {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  
  // Screen shake state
  private shakeActive: boolean = false;
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeFrequency: number = 30;
  private shakeTime: number = 0;
  private originalCameraPosition: THREE.Vector3;
  
  // Flash effect
  private flashMesh?: THREE.Mesh;
  private flashActive: boolean = false;
  private flashDuration: number = 0;
  private flashTime: number = 0;
  private flashStartIntensity: number = 0;
  private flashFadeOut: boolean = true;
  
  // Trail effects
  private trailMeshes: Map<string, THREE.Mesh[]> = new Map();
  private trailGeometries: Map<string, THREE.BufferGeometry[]> = new Map();
  
  // Glow effects
  private glowMeshes: Map<string, THREE.Mesh> = new Map();
  
  // Post-processing effects (placeholder for future implementation)
  private bloomEnabled: boolean = false;
  private vignetteEnabled: boolean = false;
  
  // Effect presets
  private static readonly SHAKE_PRESETS: Record<string, ScreenShakeConfig> = {
    small_explosion: { intensity: 2, duration: 0.2, frequency: 30 },
    medium_explosion: { intensity: 4, duration: 0.4, frequency: 25 },
    large_explosion: { intensity: 8, duration: 0.8, frequency: 20 },
    ship_hit: { intensity: 3, duration: 0.3, frequency: 35 },
    enemy_hit: { intensity: 1.5, duration: 0.15, frequency: 40 },
    pickup_collect: { intensity: 0.5, duration: 0.1, frequency: 50 }
  };
  
  private static readonly FLASH_PRESETS: Record<string, FlashConfig> = {
    damage_red: {
      color: new THREE.Color(1, 0.2, 0.2),
      intensity: 0.3,
      duration: 0.15,
      fadeOut: true
    },
    pickup_green: {
      color: new THREE.Color(0.3, 1, 0.3),
      intensity: 0.2,
      duration: 0.2,
      fadeOut: true
    },
    powerup_blue: {
      color: new THREE.Color(0.3, 0.6, 1),
      intensity: 0.25,
      duration: 0.3,
      fadeOut: true
    },
    wave_complete: {
      color: new THREE.Color(1, 1, 0.4),
      intensity: 0.4,
      duration: 0.5,
      fadeOut: true
    },
    muzzle_flash: {
      color: new THREE.Color(0.8, 0.9, 1),
      intensity: 0.15,
      duration: 0.05,
      fadeOut: true
    }
  };
  
  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
    this.originalCameraPosition = camera.position.clone();
    
    this.createFlashMesh();
  }
  
  /**
   * Create full-screen flash mesh
   */
  private createFlashMesh(): void {
    // Create full-screen quad for flash effects
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    this.flashMesh = new THREE.Mesh(geometry, material);
    this.flashMesh.position.z = -1; // In front of camera
    this.flashMesh.visible = false;
    
    // Add to camera so it follows camera movement
    this.camera.add(this.flashMesh);
  }
  
  /**
   * Start screen shake with preset
   */
  public shakeScreen(presetName: string, intensityMultiplier: number = 1): void {
    const preset = VFXManager.SHAKE_PRESETS[presetName];
    if (!preset) {
      console.warn(`Unknown shake preset: ${presetName}`);
      return;
    }
    
    this.shakeScreenCustom({
      intensity: preset.intensity * intensityMultiplier,
      duration: preset.duration,
      frequency: preset.frequency
    });
  }
  
  /**
   * Start screen shake with custom config
   */
  public shakeScreenCustom(config: ScreenShakeConfig): void {
    this.shakeActive = true;
    this.shakeIntensity = config.intensity;
    this.shakeDuration = config.duration;
    this.shakeFrequency = config.frequency;
    this.shakeTime = 0;
  }
  
  /**
   * Trigger flash effect with preset
   */
  public flash(presetName: string, intensityMultiplier: number = 1): void {
    const preset = VFXManager.FLASH_PRESETS[presetName];
    if (!preset) {
      console.warn(`Unknown flash preset: ${presetName}`);
      return;
    }
    
    this.flashCustom({
      color: preset.color,
      intensity: preset.intensity * intensityMultiplier,
      duration: preset.duration,
      fadeOut: preset.fadeOut
    });
  }
  
  /**
   * Trigger flash effect with custom config
   */
  public flashCustom(config: FlashConfig): void {
    if (!this.flashMesh) return;
    
    this.flashActive = true;
    this.flashDuration = config.duration;
    this.flashTime = 0;
    this.flashStartIntensity = config.intensity;
    this.flashFadeOut = config.fadeOut;
    
    const material = this.flashMesh.material as THREE.MeshBasicMaterial;
    material.color.copy(config.color);
    material.opacity = config.intensity;
    
    this.flashMesh.visible = true;
  }
  
  /**
   * Create a trail effect for an entity
   */
  public createTrail(entityId: string, config: TrailConfig): void {
    const trailMeshes: THREE.Mesh[] = [];
    const trailGeometries: THREE.BufferGeometry[] = [];
    
    // Create trail segments
    for (let i = 0; i < config.length; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(6); // 2 triangles = 6 vertices
      const colors = new Float32Array(9); // 3 vertices * 3 components
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1 - (i / config.length),
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      
      this.scene.add(mesh);
      trailMeshes.push(mesh);
      trailGeometries.push(geometry);
    }
    
    this.trailMeshes.set(entityId, trailMeshes);
    this.trailGeometries.set(entityId, trailGeometries);
  }
  
  /**
   * Update trail effect for an entity
   */
  public updateTrail(entityId: string, position: THREE.Vector3, direction: THREE.Vector3, config: TrailConfig): void {
    const meshes = this.trailMeshes.get(entityId);
    const geometries = this.trailGeometries.get(entityId);
    
    if (!meshes || !geometries) return;
    
    // Calculate perpendicular vector for trail width
    const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
    const halfWidth = config.width / 2;
    
    // Update each trail segment
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];
      const geometry = geometries[i];
      
      // Calculate trail segment position (behind current position)
      const segmentDistance = (i + 1) * 2; // Distance behind entity
      const segmentPosition = position.clone().sub(direction.clone().multiplyScalar(segmentDistance));
      
      // Create quad vertices
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      const colors = geometry.attributes.color as THREE.BufferAttribute;
      
      // Left and right points of trail segment
      const left = segmentPosition.clone().add(perpendicular.clone().multiplyScalar(halfWidth));
      const right = segmentPosition.clone().sub(perpendicular.clone().multiplyScalar(halfWidth));
      const leftNext = segmentPosition.clone().add(direction.clone().multiplyScalar(-1)).add(perpendicular.clone().multiplyScalar(halfWidth));
      const rightNext = segmentPosition.clone().add(direction.clone().multiplyScalar(-1)).sub(perpendicular.clone().multiplyScalar(halfWidth));
      
      // Set vertices (2 triangles)
      positions.setXYZ(0, left.x, left.y, left.z);
      positions.setXYZ(1, right.x, right.y, right.z);
      positions.setXYZ(2, leftNext.x, leftNext.y, leftNext.z);
      positions.setXYZ(3, right.x, right.y, right.z);
      positions.setXYZ(4, rightNext.x, rightNext.y, rightNext.z);
      positions.setXYZ(5, leftNext.x, leftNext.y, leftNext.z);
      
      // Set colors (fade based on segment index)
      const alpha = 1 - (i / meshes.length);
      for (let j = 0; j < 6; j++) {
        colors.setXYZ(j, config.color.r * alpha, config.color.g * alpha, config.color.b * alpha);
      }
      
      positions.needsUpdate = true;
      colors.needsUpdate = true;
      
      // Update material opacity
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = alpha;
      
      mesh.visible = alpha > 0.01;
    }
  }
  
  /**
   * Remove trail effect
   */
  public removeTrail(entityId: string): void {
    const meshes = this.trailMeshes.get(entityId);
    const geometries = this.trailGeometries.get(entityId);
    
    if (meshes) {
      meshes.forEach(mesh => {
        this.scene.remove(mesh);
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      this.trailMeshes.delete(entityId);
    }
    
    if (geometries) {
      geometries.forEach(geometry => geometry.dispose());
      this.trailGeometries.delete(entityId);
    }
  }
  
  /**
   * Create glow effect for an entity
   */
  public createGlow(entityId: string, radius: number, color: THREE.Color, intensity: number): void {
    const geometry = new THREE.RingGeometry(radius * 0.8, radius * 1.2, 16);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: intensity,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    this.glowMeshes.set(entityId, mesh);
  }
  
  /**
   * Update glow effect position and properties
   */
  public updateGlow(entityId: string, position: THREE.Vector3, pulsePhase?: number): void {
    const mesh = this.glowMeshes.get(entityId);
    if (!mesh) return;
    
    mesh.position.copy(position);
    
    if (pulsePhase !== undefined) {
      const material = mesh.material as THREE.MeshBasicMaterial;
      const pulseFactor = 0.7 + Math.sin(pulsePhase) * 0.3;
      mesh.scale.setScalar(pulseFactor);
      material.opacity = material.opacity * pulseFactor;
    }
  }
  
  /**
   * Remove glow effect
   */
  public removeGlow(entityId: string): void {
    const mesh = this.glowMeshes.get(entityId);
    if (mesh) {
      this.scene.remove(mesh);
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else {
        mesh.material.dispose();
      }
      mesh.geometry.dispose();
      this.glowMeshes.delete(entityId);
    }
  }
  
  /**
   * Update all VFX systems
   */
  public update(deltaTime: number): void {
    this.updateScreenShake(deltaTime);
    this.updateFlash(deltaTime);
    this.updateTrailFade(deltaTime);
  }
  
  /**
   * Update screen shake effect
   */
  private updateScreenShake(deltaTime: number): void {
    if (!this.shakeActive) return;
    
    this.shakeTime += deltaTime;
    
    if (this.shakeTime >= this.shakeDuration) {
      // End shake
      this.shakeActive = false;
      this.camera.position.copy(this.originalCameraPosition);
      return;
    }
    
    // Calculate shake offset
    const progress = this.shakeTime / this.shakeDuration;
    const intensity = this.shakeIntensity * (1 - progress); // Fade out over time
    
    const shakeX = Math.sin(this.shakeTime * this.shakeFrequency) * intensity;
    const shakeY = Math.cos(this.shakeTime * this.shakeFrequency * 0.8) * intensity;
    
    // Apply shake to camera
    this.camera.position.copy(this.originalCameraPosition);
    this.camera.position.x += shakeX;
    this.camera.position.y += shakeY;
  }
  
  /**
   * Update flash effect
   */
  private updateFlash(deltaTime: number): void {
    if (!this.flashActive || !this.flashMesh) return;
    
    this.flashTime += deltaTime;
    
    if (this.flashTime >= this.flashDuration) {
      // End flash
      this.flashActive = false;
      this.flashMesh.visible = false;
      return;
    }
    
    if (this.flashFadeOut) {
      // Fade out over duration
      const progress = this.flashTime / this.flashDuration;
      const material = this.flashMesh.material as THREE.MeshBasicMaterial;
      material.opacity = this.flashStartIntensity * (1 - progress);
    }
  }
  
  /**
   * Update trail fade effects
   */
  private updateTrailFade(_deltaTime: number): void {
    // This would update any automatic trail fading
    // For now, trails are manually updated by entities
  }
  
  /**
   * Set original camera position (call when camera moves)
   */
  public updateCameraPosition(position: THREE.Vector3): void {
    this.originalCameraPosition.copy(position);
  }
  
  /**
   * Enable/disable post-processing effects
   */
  public setBloomEnabled(enabled: boolean): void {
    this.bloomEnabled = enabled;
    // Implementation would integrate with post-processing pipeline
  }
  
  public setVignetteEnabled(enabled: boolean): void {
    this.vignetteEnabled = enabled;
    // Implementation would integrate with post-processing pipeline
  }
  
  /**
   * Stop all active effects
   */
  public stopAllEffects(): void {
    this.shakeActive = false;
    this.flashActive = false;
    
    if (this.flashMesh) {
      this.flashMesh.visible = false;
    }
    
    this.camera.position.copy(this.originalCameraPosition);
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      screenShake: {
        active: this.shakeActive,
        intensity: this.shakeIntensity,
        timeRemaining: this.shakeActive ? this.shakeDuration - this.shakeTime : 0
      },
      flash: {
        active: this.flashActive,
        timeRemaining: this.flashActive ? this.flashDuration - this.flashTime : 0
      },
      trails: {
        count: this.trailMeshes.size
      },
      glows: {
        count: this.glowMeshes.size
      },
      postProcessing: {
        bloom: this.bloomEnabled,
        vignette: this.vignetteEnabled
      }
    };
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Remove flash mesh
    if (this.flashMesh) {
      this.camera.remove(this.flashMesh);
      if (Array.isArray(this.flashMesh.material)) {
        this.flashMesh.material.forEach(mat => mat.dispose());
      } else {
        this.flashMesh.material.dispose();
      }
      this.flashMesh.geometry.dispose();
    }
    
    // Remove all trails
    for (const entityId of this.trailMeshes.keys()) {
      this.removeTrail(entityId);
    }
    
    // Remove all glows
    for (const entityId of this.glowMeshes.keys()) {
      this.removeGlow(entityId);
    }
  }
}