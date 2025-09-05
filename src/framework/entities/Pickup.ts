import * as THREE from 'three';
import { BaseEntity } from './BaseEntity';
import { Ship } from './Ship';
import { PhysicsSystem } from '../systems/PhysicsSystem';

export type PickupType = 'salvage' | 'gold' | 'platinum' | 'adamantium' | 'health' | 'shield' | 'rapidfire' | 'pierce' | 'damage';

export interface PickupProperties {
  type: PickupType;
  value: number;
  color: number;
  magnetRange: number;
  lifetime: number;
}

/**
 * Pickup entity with different types and magnetic attraction
 * Provides resources, health, and temporary power-ups
 */
export class Pickup extends BaseEntity {
  // Pickup constants
  private static readonly PICKUP_CONSTANTS = {
    radius: 1.5,
    magnetSpeed: 80,
    rotationSpeed: 2.0,
    pulseSpeed: 4.0,
    lifetime: 10.0, // 10 seconds before despawn
    magnetRange: 60
  };

  // Pickup type definitions
  private static readonly PICKUP_TYPES: Record<PickupType, Omit<PickupProperties, 'type'>> = {
    salvage: {
      value: 10,
      color: 0x00ff88, // Green
      magnetRange: 50,
      lifetime: 15.0
    },
    gold: {
      value: 5,
      color: 0xffd700, // Gold
      magnetRange: 50,
      lifetime: 15.0
    },
    platinum: {
      value: 2,
      color: 0xe5e4e2, // Platinum silver
      magnetRange: 55,
      lifetime: 12.0
    },
    adamantium: {
      value: 1,
      color: 0x9966cc, // Purple
      magnetRange: 60,
      lifetime: 10.0
    },
    health: {
      value: 25,
      color: 0xff0044, // Red
      magnetRange: 70,
      lifetime: 8.0
    },
    shield: {
      value: 50,
      color: 0x4488ff, // Blue
      magnetRange: 70,
      lifetime: 8.0
    },
    rapidfire: {
      value: 5.0, // Duration in seconds
      color: 0xffaa00, // Orange
      magnetRange: 60,
      lifetime: 12.0
    },
    pierce: {
      value: 3.0, // Duration in seconds  
      color: 0xff00ff, // Magenta
      magnetRange: 60,
      lifetime: 12.0
    },
    damage: {
      value: 5.0, // Duration in seconds
      color: 0xff4400, // Red-orange
      magnetRange: 60,
      lifetime: 12.0
    }
  };

  // Pickup-specific properties
  public readonly pickupType: PickupType;
  public readonly properties: PickupProperties;
  private remainingLifetime: number;
  private rotationAngle: number = 0;
  private pulsePhase: number = 0;
  private beingMagnetized: boolean = false;
  private magnetTarget?: Ship;

  // Visual components
  private pickupMesh?: THREE.Mesh;
  private glowMesh?: THREE.Mesh;

  // Materials (shared by type)
  private static materials: Map<PickupType, THREE.MeshBasicMaterial> = new Map();
  private static glowMaterials: Map<PickupType, THREE.MeshBasicMaterial> = new Map();

  constructor(type: PickupType, x = 0, y = 0) {
    super(x, y, 0, 0, Pickup.PICKUP_CONSTANTS.radius);
    
    this.pickupType = type;
    this.properties = {
      type,
      ...Pickup.PICKUP_TYPES[type]
    };
    
    this.remainingLifetime = this.properties.lifetime;
    this.pulsePhase = Math.random() * Math.PI * 2; // Random phase for variety
    
    // Set small random drift velocity
    this.velocity.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      0
    );
    
    this.mesh = this.createMesh();
  }

  protected createMesh(): THREE.Object3D {
    const group = new THREE.Group();
    
    // Create pickup mesh
    this.createPickupMesh(group);
    
    // Create glow effect
    this.createGlowMesh(group);
    
    return group;
  }

  private createPickupMesh(group: THREE.Group): void {
    // Get or create material for this pickup type
    if (!Pickup.materials.has(this.pickupType)) {
      Pickup.materials.set(this.pickupType, new THREE.MeshBasicMaterial({
        color: this.properties.color,
        transparent: false
      }));
    }

    let geometry: THREE.BufferGeometry;

    // Different shapes for different pickup types
    switch (this.pickupType) {
      case 'salvage':
        // Diamond/crystal shape
        geometry = new THREE.OctahedronGeometry(1.2, 0);
        break;
        
      case 'gold':
        // Coin/disc shape
        geometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16);
        break;
        
      case 'platinum':
        // Smaller coin shape
        geometry = new THREE.CylinderGeometry(1.0, 1.0, 0.2, 12);
        break;
        
      case 'adamantium':
        // Rare crystalline shape
        geometry = new THREE.TetrahedronGeometry(1.4, 0);
        break;
        
      case 'health':
        // Cross shape (health symbol)
        geometry = this.createCrossGeometry();
        break;
        
      case 'shield':
        // Shield/hexagon shape
        geometry = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 6);
        break;
        
      case 'rapidfire':
        // Star burst shape
        geometry = this.createStarGeometry(6);
        break;
        
      case 'pierce':
        // Arrow/spear shape
        geometry = this.createArrowGeometry();
        break;
        
      case 'damage':
        // Spiky sphere
        geometry = new THREE.IcosahedronGeometry(1.2, 0);
        break;
        
      default:
        geometry = new THREE.SphereGeometry(1.2, 8, 6);
    }

    this.pickupMesh = new THREE.Mesh(geometry, Pickup.materials.get(this.pickupType)!);
    group.add(this.pickupMesh);
  }

  private createGlowMesh(group: THREE.Group): void {
    // Get or create glow material for this pickup type
    if (!Pickup.glowMaterials.has(this.pickupType)) {
      Pickup.glowMaterials.set(this.pickupType, new THREE.MeshBasicMaterial({
        color: this.properties.color,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      }));
    }

    // Glow is a slightly larger version
    const glowGeometry = new THREE.SphereGeometry(2.0, 8, 6);
    this.glowMesh = new THREE.Mesh(glowGeometry, Pickup.glowMaterials.get(this.pickupType)!);
    group.add(this.glowMesh);
  }

  private createCrossGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Horizontal bar
      -1.2, -0.3, 0, 1.2, -0.3, 0, 1.2, 0.3, 0,
      -1.2, -0.3, 0, 1.2, 0.3, 0, -1.2, 0.3, 0,
      
      // Vertical bar
      -0.3, -1.2, 0, 0.3, -1.2, 0, 0.3, 1.2, 0,
      -0.3, -1.2, 0, 0.3, 1.2, 0, -0.3, 1.2, 0,
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  }

  private createStarGeometry(points: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    const outerRadius = 1.2;
    const innerRadius = 0.6;
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      
      vertices.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );
    }
    
    // Create triangles from center
    const finalVertices: number[] = [];
    for (let i = 0; i < points * 2; i++) {
      const next = (i + 1) % (points * 2);
      
      // Center point
      finalVertices.push(0, 0, 0);
      // Current point
      finalVertices.push(vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]);
      // Next point
      finalVertices.push(vertices[next * 3], vertices[next * 3 + 1], vertices[next * 3 + 2]);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(finalVertices), 3));
    return geometry;
  }

  private createArrowGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Arrow head
      0, 1.2, 0, -0.6, 0.3, 0, 0.6, 0.3, 0,
      
      // Arrow shaft
      -0.2, 0.3, 0, 0.2, 0.3, 0, 0.2, -1.2, 0,
      -0.2, 0.3, 0, 0.2, -1.2, 0, -0.2, -1.2, 0,
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  }

  protected onUpdate(dt: number): void {
    // Update lifetime
    this.remainingLifetime -= dt;
    
    if (this.remainingLifetime <= 0) {
      this.active = false;
      return;
    }
    
    // Update rotation and pulsing
    this.rotationAngle += Pickup.PICKUP_CONSTANTS.rotationSpeed * dt;
    this.pulsePhase += Pickup.PICKUP_CONSTANTS.pulseSpeed * dt;
    
    // Check for magnetic attraction
    this.updateMagnetism(dt);
    
    // Update visual effects
    this.updateVisualEffects();
    
    // Apply slight friction to slow down over time
    this.velocity.multiplyScalar(0.995);
  }

  private updateMagnetism(dt: number): void {
    if (!this.magnetTarget) return;
    
    const distance = PhysicsSystem.getDistance(this, this.magnetTarget);
    
    if (distance <= this.properties.magnetRange) {
      this.beingMagnetized = true;
      
      // Apply magnetic force toward target
      const direction = PhysicsSystem.getDirection(this, this.magnetTarget);
      const magnetForce = Pickup.PICKUP_CONSTANTS.magnetSpeed * dt;
      
      // Stronger attraction when closer
      const forceMultiplier = Math.max(0.5, 1 - (distance / this.properties.magnetRange));
      
      this.velocity.x += direction.x * magnetForce * forceMultiplier;
      this.velocity.y += direction.y * magnetForce * forceMultiplier;
    } else {
      this.beingMagnetized = false;
    }
  }

  private updateVisualEffects(): void {
    if (!this.pickupMesh || !this.glowMesh) return;
    
    // Rotation
    this.pickupMesh.rotation.y = this.rotationAngle;
    this.pickupMesh.rotation.z = this.rotationAngle * 0.5;
    
    // Pulsing glow
    const pulseIntensity = 0.5 + Math.sin(this.pulsePhase) * 0.3;
    this.glowMesh.scale.setScalar(pulseIntensity);
    
    const glowMaterial = this.glowMesh.material as THREE.MeshBasicMaterial;
    glowMaterial.opacity = 0.2 + pulseIntensity * 0.2;
    
    // Magnetic attraction visual effect
    if (this.beingMagnetized) {
      this.pickupMesh.scale.setScalar(1.1 + Math.sin(this.pulsePhase * 2) * 0.1);
      glowMaterial.opacity *= 1.5;
    } else {
      this.pickupMesh.scale.setScalar(1.0);
    }
    
    // Lifetime warning - flash when about to expire
    if (this.remainingLifetime < 3.0) {
      const flashIntensity = Math.sin(this.remainingLifetime * 10) * 0.5 + 0.5;
      const material = this.pickupMesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.5 + flashIntensity * 0.5;
      material.transparent = true;
    }
  }

  /**
   * Set the ship that can attract this pickup
   * @param ship Target ship for magnetic attraction
   */
  public setMagnetTarget(ship: Ship): void {
    this.magnetTarget = ship;
  }

  /**
   * Apply the pickup effect to a ship
   * @param ship Ship to apply effect to
   * @param onCurrencyCollected Optional callback for currency collection
   * @returns True if pickup was consumed
   */
  public applyToShip(ship: Ship, onCurrencyCollected?: (type: string, amount: number) => void): boolean {
    switch (this.pickupType) {
      case 'salvage':
        // Add salvage currency
        if (onCurrencyCollected) {
          onCurrencyCollected('salvage', this.properties.value);
        }
        console.log(`Collected ${this.properties.value} salvage`);
        return true;
        
      case 'gold':
        // Add gold currency
        if (onCurrencyCollected) {
          onCurrencyCollected('gold', this.properties.value);
        }
        console.log(`Collected ${this.properties.value} gold`);
        return true;
        
      case 'platinum':
        // Add platinum currency
        if (onCurrencyCollected) {
          onCurrencyCollected('platinum', this.properties.value);
        }
        console.log(`Collected ${this.properties.value} platinum`);
        return true;
        
      case 'adamantium':
        // Add adamantium currency
        if (onCurrencyCollected) {
          onCurrencyCollected('adamantium', this.properties.value);
        }
        console.log(`Collected ${this.properties.value} adamantium`);
        return true;
        
      case 'health':
        // Restore health (would integrate with health system)
        console.log(`Restored ${this.properties.value} health`);
        return true;
        
      case 'shield':
        // Restore shield (would integrate with shield system)
        ship.setInvulnerable(this.properties.value / 10); // Convert to seconds
        console.log(`Shield recharged for ${this.properties.value}%`);
        return true;
        
      case 'rapidfire':
        // Temporary rapid fire (would need weapon system integration)
        console.log(`Rapid fire for ${this.properties.value} seconds`);
        return true;
        
      case 'pierce':
        // Temporary piercing shots
        console.log(`Piercing shots for ${this.properties.value} seconds`);
        return true;
        
      case 'damage':
        // Temporary damage boost
        console.log(`Damage boost for ${this.properties.value} seconds`);
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Get pickup type
   */
  public getPickupType(): PickupType {
    return this.pickupType;
  }

  /**
   * Get pickup value
   */
  public getValue(): number {
    return this.properties.value;
  }

  /**
   * Get remaining lifetime
   */
  public getRemainingLifetime(): number {
    return this.remainingLifetime;
  }

  /**
   * Check if pickup is being magnetized
   */
  public isBeingMagnetized(): boolean {
    return this.beingMagnetized;
  }

  /**
   * Create a random pickup
   * @param x Spawn X position
   * @param y Spawn Y position
   * @returns Random pickup instance
   */
  public static createRandom(x: number, y: number): Pickup {
    const types: PickupType[] = ['salvage', 'gold', 'platinum', 'adamantium', 'health', 'shield', 'rapidfire', 'pierce', 'damage'];
    const weights = [30, 25, 15, 8, 12, 6, 3, 1, 1]; // Weighted probability - currencies more common
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < types.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return new Pickup(types[i], x, y);
      }
    }
    
    // Fallback
    return new Pickup('salvage', x, y);
  }

  protected onSpawn(): void {
    // Reset pickup state when spawned
    this.remainingLifetime = this.properties.lifetime;
    this.rotationAngle = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.beingMagnetized = false;
  }

  protected onDespawn(): void {
    // Clean up references
    this.magnetTarget = undefined;
    this.beingMagnetized = false;
  }

  protected onReset(): void {
    // Reset pickup to initial state  
    this.remainingLifetime = this.properties.lifetime;
    this.rotationAngle = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.beingMagnetized = false;
    this.magnetTarget = undefined;
    
    // Reset velocity
    this.velocity.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      0
    );
  }
}