// Exact constants from vanilla Asteroids implementation
// All values preserved from reference/vanillaHTML/src/main.js

export const WORLD = {
  width: 750,   // Total world width - NEVER changes (3x larger)
  height: 498,  // Total world height - NEVER changes (3x larger)
} as const;

export const PLAYER = {
  accel: 40,
  maxSpeed: 40,
  friction: 0.98,
  turn: 3.2,
  fireRate: 0.16,
  radius: 1.5,
} as const;

export const ASTEROIDS = {
  large: { r: 6, score: 20, next: 'medium', count: 2 },
  medium: { r: 3.5, score: 50, next: 'small', count: 2 },
  small: { r: 2.0, score: 100, next: null, count: 0 },
  baseSpeed: 8,
} as const;

export const BULLET = { 
  speed: 70, 
  life: 1.1, 
  r: 0.2 
} as const;

export const ENEMY = {
  radius: 1.2,
  accel: 20,
  maxSpeed: 26,
  fireRate: 0.9,
  bulletSpeed: 55,
  bulletLife: 1.6,
  score: 150,
  preferredDist: 14,
} as const;

// Camera and rendering constants
export const VISIBLE_HEIGHT = WORLD.height / 5; // 99.6 units visible
export const ZOOM = {
  default: 1.0,
  min: 0.6,
  max: 1.8,
  step: 0.1,
} as const;

// Game timing constants
export const COMBO_TIMER = 2.3;
export const COMBO_DECAY = 0.25;
export const COMBO_MULTIPLIER = 0.2;

// Invulnerability periods
export const INVULN_SPAWN = 2.0;
export const INVULN_WAVE = 3.0;
export const INVULN_HIT = 1.0;

// Shop and upgrade constants  
export const BASE_REROLL_COST = 15;
export const REROLL_MULTIPLIER = 1.15;
export const EPIC_REROLL_THRESHOLD = 4;

// Entity pool sizes (matching vanilla)
export const POOL_SIZES = {
  bullets: 200,
  particles: 350,
  debris: 260,
  asteroids: 100,
  enemies: 20,
  pickups: 50,
} as const;

// Starfield constants
export const STARFIELD = {
  count: 16000,
  widthMultiplier: 3.0,
  heightMultiplier: 3.0,
  depthMin: -120,
  depthMax: -3,
  sizeMin: 0.2,
  sizeMax: 2.2,
  brightnessMin: 0.2,
  brightnessMax: 2.0,
} as const;

// Postprocessing constants (exact values)
export const POSTPROCESSING = {
  outline: {
    edgeStrength: 3.0,
    edgeGlow: 0.4,
    edgeThickness: 1.0,
    pulsePeriod: 0.0,
    visibleEdgeColor: 0xd7f0ff,
    hiddenEdgeColor: 0x111319,
  },
  bloom: {
    threshold: 0.2,
    strength: 1.25,
    radius: 0.6,
  },
  vignette: {
    offset: 1.15,
    darkness: 0.55,
  },
} as const;

// Renderer settings
export const RENDERER_SETTINGS = {
  antialias: false,
  alpha: true,
  pixelRatio: Math.min(devicePixelRatio, 2),
  outputColorSpace: 'srgb',
  toneMapping: 'ACESFilmic',
  toneMappingExposure: 1.2,
  clearColor: 0x070a14,
  clearAlpha: 1,
} as const;

// Lighting constants
export const LIGHTING = {
  key: {
    color: 0x6688ff,
    intensity: 1.4,
    distance: 220,
    position: [20, 15, 20],
  },
  ambient: {
    color: 0x334455,
    intensity: 0.85,
  },
  hemisphere: {
    skyColor: 0x98b7ff,
    groundColor: 0x1b2030,
    intensity: 0.55,
  },
  fill: {
    color: 0x88a0ff,
    intensity: 0.4,
    position: [-18, -12, 14],
  },
} as const;

// Fog settings
export const FOG = {
  color: 0x02040a,
  density: 0.004,
} as const;

// Ore drop rates (exact from vanilla)
export const ORE_RATES = {
  iron: 0.995,    // 99.5% chance for iron
  gold: 0.97,     // 2.5% chance for gold  
  platinum: 0.995, // 0.5% chance for platinum
  adamantium: 0.995, // 0.5% chance for adamantium
} as const;

// Pickup drop chances
export const PICKUP_RATES = {
  gold: 0.3,      // 70% chance to drop if gold ore
  platinum: 0.4,  // 60% chance to drop if platinum ore  
  adamantium: 0.6, // 40% chance to drop if adamantium ore
} as const;

// Material colors
export const MATERIAL_COLORS = {
  bullet: 0xffcc88,
  bulletEmissive: 0xff8800,
  salvage: 0xbde2ff,
  gold: 0xffd77a,
  platinum: 0xd8f4ff,
  adamantium: 0xff9a7a,
  shield: 0x66ccff,
  drone: 0x92ffdd,
  droneEmissive: 0x227755,
} as const;

// Upgrade rarity weights
export const RARITY_WEIGHTS = {
  common: 5,
  uncommon: 2,
  rare: 1,
  epic: 1,
  legendary: 1,
} as const;

// Drone constants
export const DRONE = {
  orbitRadius: 4.2,
  orbitSpeed: 2.5,
  fireRate: 0.5,
  maxCount: 3,
  radiusOffset: 0.8,
  speedMultiplier: 0.3,
} as const;

// Particle system constants
export const PARTICLES = {
  hit: {
    count: 14,
    speed: [8, 24],
    life: [0.35, 0.8],
    size: [0.25, 0.9],
    color: 0xffcc88,
  },
  explosion: {
    count: 16,
    speed: [12, 36],
    life: [0.25, 0.6],
    size: [0.25, 1.0],
    color: 0xaad0ff,
  },
  shield: {
    count: 24,
    speed: [20, 40],
    life: [0.2, 0.5],
    size: [0.3, 1.2],
    color: 0x66ccff,
  },
} as const;

export type AsteroidSize = keyof typeof ASTEROIDS;
export type PierceType = false | true | 'super' | 'ultra';
export type SpreadType = false | true | 'wide';
export type CurrencyType = 'salvage' | 'gold' | 'platinum' | 'adamantium';
export type OverlayType = 'none' | 'start' | 'upgrade' | 'hangar' | 'pause' | 'gameover' | 'choices' | null;