import * as THREE from 'three';
import { BaseEntity } from './BaseEntity';
import { ASTEROIDS } from '../constants/gameConstants';

export type AsteroidSize = 'large' | 'medium' | 'small';

/**
 * Asteroid entity with procedural geometry and splitting mechanics
 * Matches vanilla implementation exactly
 */
export class Asteroid extends BaseEntity {
  public readonly sizeKey: AsteroidSize;
  public readonly scoreValue: number;
  public readonly splitSize: AsteroidSize | null;
  public readonly splitCount: number;
  
  private rotationSpeed: number = 0;
  private asteroidMesh?: THREE.Mesh;
  
  // Static materials for performance
  private static materials: THREE.MeshBasicMaterial[] = [];

  constructor(sizeKey: AsteroidSize, x = 0, y = 0, vx = 0, vy = 0) {
    const def = ASTEROIDS[sizeKey];
    super(x, y, vx, vy, def.r);
    
    this.sizeKey = sizeKey;
    this.scoreValue = def.score;
    this.splitSize = def.next as AsteroidSize | null;
    this.splitCount = def.count;
    
    // Random rotation speed
    this.rotationSpeed = (Math.random() - 0.5) * 2; // -1 to 1 rad/sec
    
    this.mesh = this.createMesh();
  }

  protected createMesh(): THREE.Object3D {
    // Create procedural asteroid geometry
    const geometry = this.createAsteroidGeometry();
    
    // Get or create material
    const material = this.getAsteroidMaterial();
    
    // Create mesh
    this.asteroidMesh = new THREE.Mesh(geometry, material);
    
    return this.asteroidMesh;
  }

  private createAsteroidGeometry(): THREE.BufferGeometry {
    const def = ASTEROIDS[this.sizeKey];
    const baseRadius = def.r;
    
    // Create irregular asteroid shape using polar coordinates
    const vertices: number[] = [];
    const indices: number[] = [];
    const segments = Math.floor(baseRadius * 3) + 8; // More segments for larger asteroids
    
    // Center vertex
    vertices.push(0, 0, 0);
    
    // Create vertices in a circle with random radius variation
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      
      // Vary radius randomly for irregular shape
      const radiusVariation = 0.3 + Math.random() * 0.7; // 0.3 to 1.0 multiplier
      const radius = baseRadius * radiusVariation;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      vertices.push(x, y, 0);
    }
    
    // Create triangular faces from center to perimeter
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      
      // Triangle from center to two adjacent perimeter vertices
      indices.push(0, i + 1, next + 1);
    }
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }

  private getAsteroidMaterial(): THREE.MeshBasicMaterial {
    // Create materials if not already created
    if (Asteroid.materials.length === 0) {
      // Create several material variants for visual variety
      const colors = [
        0x8899aa, // Blueish gray
        0x9988aa, // Purplish gray  
        0xaa9988, // Brownish gray
        0x8a9a8a, // Greenish gray
        0xa89898  // Reddish gray
      ];
      
      for (const color of colors) {
        const material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        });
        Asteroid.materials.push(material);
      }
    }
    
    // Return random material variant
    const index = Math.floor(Math.random() * Asteroid.materials.length);
    return Asteroid.materials[index];
  }

  protected onUpdate(dt: number): void {
    // Rotate asteroid continuously
    this.rotation += this.rotationSpeed * dt;
    
    // Update mesh rotation
    if (this.asteroidMesh) {
      this.asteroidMesh.rotation.z = this.rotation;
    }
  }

  /**
   * Split this asteroid into smaller pieces
   * @returns Array of new smaller asteroids, or empty array if can't split
   */
  public split(): Asteroid[] {
    if (!this.splitSize || this.splitCount === 0) {
      return []; // Can't split (smallest size)
    }
    
    const pieces: Asteroid[] = [];
    const baseSpeed = ASTEROIDS.baseSpeed * 1.2; // Slightly faster than spawned asteroids
    
    for (let i = 0; i < this.splitCount; i++) {
      // Random angle for each piece
      const angle = Math.random() * Math.PI * 2;
      
      // Random speed variation
      const speed = baseSpeed * (0.8 + Math.random() * 0.4); // 0.8 to 1.2x
      
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      // Create new asteroid at this position with some offset
      const offsetX = (Math.random() - 0.5) * 2;
      const offsetY = (Math.random() - 0.5) * 2;
      
      const piece = new Asteroid(
        this.splitSize,
        this.position.x + offsetX,
        this.position.y + offsetY,
        vx,
        vy
      );
      
      pieces.push(piece);
    }
    
    return pieces;
  }

  /**
   * Check if this asteroid can be split
   */
  public canSplit(): boolean {
    return this.splitSize !== null && this.splitCount > 0;
  }

  /**
   * Get the size definition for this asteroid
   */
  public getSizeDef() {
    return ASTEROIDS[this.sizeKey];
  }

  protected onSpawn(): void {
    // Reset rotation when spawned
    this.rotation = Math.random() * Math.PI * 2;
  }

  protected onDespawn(): void {
    // Clean up geometry to prevent memory leaks
    if (this.asteroidMesh) {
      this.asteroidMesh.geometry.dispose();
    }
  }

  protected onReset(): void {
    // Generate new random rotation speed and starting rotation
    this.rotationSpeed = (Math.random() - 0.5) * 2;
    this.rotation = Math.random() * Math.PI * 2;
  }

  /**
   * Static factory method to create asteroid with random properties
   * @param sizeKey Size of asteroid to create
   * @param x Starting X position
   * @param y Starting Y position
   * @param wave Current wave number for speed scaling
   * @returns New Asteroid instance
   */
  static createRandom(sizeKey: AsteroidSize, x: number, y: number, wave: number = 1): Asteroid {
    // Random angle for movement
    const angle = Math.random() * Math.PI * 2;
    
    // Speed increases with wave
    const baseSpeed = ASTEROIDS.baseSpeed;
    const speed = baseSpeed * (0.6 + Math.random() * 0.6) + wave * 0.3; // Random speed with wave scaling
    
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    return new Asteroid(sizeKey, x, y, vx, vy);
  }
}