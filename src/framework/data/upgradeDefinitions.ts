import { UpgradeDefinition } from '../components/cards/UpgradeCard';

// Upgrade definitions matching the vanilla implementation exactly
export const UPGRADE_DEFINITIONS: Record<string, UpgradeDefinition> = {
  // Fire Rate Upgrades
  fireRate: {
    id: 'fireRate',
    name: 'Rapid Fire',
    description: 'Increases weapon fire rate, allowing you to shoot more bullets per second.',
    icon: '🔥',
    rarity: 'common',
    effects: [
      { label: 'Fire Rate', value: '+25%', isPositive: true }
    ],
    tags: ['Weapon', 'DPS']
  },

  fireRateAdvanced: {
    id: 'fireRateAdvanced',
    name: 'Advanced Targeting',
    description: 'Sophisticated targeting systems dramatically increase fire rate.',
    icon: '🎯',
    rarity: 'uncommon',
    effects: [
      { label: 'Fire Rate', value: '+50%', isPositive: true }
    ],
    tags: ['Weapon', 'DPS', 'Advanced']
  },

  // Engine/Speed Upgrades
  engine: {
    id: 'engine',
    name: 'Engine Boost',
    description: 'Improves engine efficiency, increasing maximum speed and acceleration.',
    icon: '🚀',
    rarity: 'common',
    effects: [
      { label: 'Max Speed', value: '+20%', isPositive: true },
      { label: 'Acceleration', value: '+15%', isPositive: true }
    ],
    tags: ['Movement', 'Speed']
  },

  engineAdvanced: {
    id: 'engineAdvanced',
    name: 'Quantum Drive',
    description: 'Quantum propulsion technology provides massive speed improvements.',
    icon: '⚡',
    rarity: 'rare',
    effects: [
      { label: 'Max Speed', value: '+40%', isPositive: true },
      { label: 'Acceleration', value: '+35%', isPositive: true }
    ],
    tags: ['Movement', 'Speed', 'Quantum']
  },

  // Spread/Multishot Upgrades
  spreadDouble: {
    id: 'spreadDouble',
    name: 'Twin Cannons',
    description: 'Dual-barrel system fires two bullets simultaneously.',
    icon: '⚌',
    rarity: 'uncommon',
    effects: [
      { label: 'Bullet Count', value: '2', isPositive: true },
      { label: 'Damage', value: '-10%', isPositive: false }
    ],
    tags: ['Weapon', 'Multishot']
  },

  spreadTriple: {
    id: 'spreadTriple',
    name: 'Trinity Barrage',
    description: 'Triple-barrel configuration creates a devastating spread pattern.',
    icon: '⚏',
    rarity: 'rare',
    effects: [
      { label: 'Bullet Count', value: '3', isPositive: true },
      { label: 'Damage', value: '-15%', isPositive: false }
    ],
    tags: ['Weapon', 'Multishot']
  },

  spreadPenta: {
    id: 'spreadPenta',
    name: 'Pentagram Spread',
    description: 'Five-way spread creates an impenetrable bullet wall.',
    icon: '✦',
    rarity: 'epic',
    effects: [
      { label: 'Bullet Count', value: '5', isPositive: true },
      { label: 'Damage', value: '-20%', isPositive: false }
    ],
    tags: ['Weapon', 'Multishot', 'Elite']
  },

  // Piercing Upgrades
  pierceDouble: {
    id: 'pierceDouble',
    name: 'Armor Piercing',
    description: 'Hardened bullets can penetrate through multiple targets.',
    icon: '🗲',
    rarity: 'uncommon',
    effects: [
      { label: 'Pierce Count', value: '2', isPositive: true },
      { label: 'Damage', value: '+10%', isPositive: true }
    ],
    tags: ['Weapon', 'Pierce']
  },

  pierceTriple: {
    id: 'pierceTriple',
    name: 'Deep Strike',
    description: 'Enhanced penetration allows bullets to pierce three enemies.',
    icon: '⚡',
    rarity: 'rare',
    effects: [
      { label: 'Pierce Count', value: '3', isPositive: true },
      { label: 'Damage', value: '+20%', isPositive: true }
    ],
    tags: ['Weapon', 'Pierce']
  },

  pierceInfinite: {
    id: 'pierceInfinite',
    name: 'Phase Bullets',
    description: 'Quantum-phase bullets pass through all matter indefinitely.',
    icon: '◊',
    rarity: 'legendary',
    effects: [
      { label: 'Pierce Count', value: '∞', isPositive: true },
      { label: 'Damage', value: '+50%', isPositive: true }
    ],
    tags: ['Weapon', 'Pierce', 'Legendary']
  },

  // Health/Shield Upgrades
  health: {
    id: 'health',
    name: 'Hull Reinforcement',
    description: 'Additional armor plating provides extra protection.',
    icon: '🛡️',
    rarity: 'common',
    effects: [
      { label: 'Max Health', value: '+1', isPositive: true },
      { label: 'Health Regen', value: '+0.1/s', isPositive: true }
    ],
    tags: ['Defense', 'Health']
  },

  healthAdvanced: {
    id: 'healthAdvanced',
    name: 'Regenerative Hull',
    description: 'Self-repairing nanomaterials continuously restore hull integrity.',
    icon: '💊',
    rarity: 'rare',
    effects: [
      { label: 'Max Health', value: '+2', isPositive: true },
      { label: 'Health Regen', value: '+0.3/s', isPositive: true }
    ],
    tags: ['Defense', 'Health', 'Regen']
  },

  // Magnetic/Attraction Upgrades
  magnet: {
    id: 'magnet',
    name: 'Salvage Magnet',
    description: 'Magnetic field generator attracts nearby salvage materials.',
    icon: '🧲',
    rarity: 'common',
    effects: [
      { label: 'Pickup Range', value: '+50%', isPositive: true },
      { label: 'Salvage Bonus', value: '+10%', isPositive: true }
    ],
    tags: ['Utility', 'Salvage']
  },

  magnetAdvanced: {
    id: 'magnetAdvanced',
    name: 'Gravitational Lens',
    description: 'Advanced gravitational manipulation draws resources from great distances.',
    icon: '🌀',
    rarity: 'epic',
    effects: [
      { label: 'Pickup Range', value: '+150%', isPositive: true },
      { label: 'Salvage Bonus', value: '+25%', isPositive: true },
      { label: 'Currency Bonus', value: '+15%', isPositive: true }
    ],
    tags: ['Utility', 'Salvage', 'Advanced']
  },

  // Special/Unique Upgrades
  shrapnel: {
    id: 'shrapnel',
    name: 'Shrapnel Rounds',
    description: 'Bullets explode on impact, creating deadly shrapnel clouds.',
    icon: '💥',
    rarity: 'epic',
    effects: [
      { label: 'Explosion Damage', value: '+200%', isPositive: true },
      { label: 'Explosion Radius', value: '3x', isPositive: true },
      { label: 'Fire Rate', value: '-15%', isPositive: false }
    ],
    tags: ['Weapon', 'Explosive', 'AOE']
  },

  timeWarp: {
    id: 'timeWarp',
    name: 'Temporal Distortion',
    description: 'Manipulates local spacetime to slow enemy movement while accelerating your own.',
    icon: '⏳',
    rarity: 'legendary',
    effects: [
      { label: 'Enemy Speed', value: '-30%', isPositive: true },
      { label: 'Player Speed', value: '+20%', isPositive: true },
      { label: 'Fire Rate', value: '+15%', isPositive: true }
    ],
    tags: ['Utility', 'Time', 'Legendary']
  }
};

// Rarity weights for random generation (matching vanilla probabilities)
export const RARITY_WEIGHTS = {
  common: 50,     // 50% chance
  uncommon: 30,   // 30% chance
  rare: 15,       // 15% chance
  epic: 4,        // 4% chance
  legendary: 1    // 1% chance
} as const;

// Shop costs by rarity (matching vanilla economy)
export const SHOP_COSTS = {
  common: { salvage: 10, gold: 2 },
  uncommon: { salvage: 20, gold: 5 },
  rare: { salvage: 35, gold: 10, platinum: 1 },
  epic: { salvage: 60, gold: 20, platinum: 3 },
  legendary: { salvage: 100, gold: 50, platinum: 10, adamantium: 1 }
} as const;

// Utility functions for upgrade generation
export const getUpgradesByRarity = (rarity: keyof typeof RARITY_WEIGHTS): UpgradeDefinition[] => {
  return Object.values(UPGRADE_DEFINITIONS).filter(upgrade => upgrade.rarity === rarity);
};

export const getRandomUpgrade = (): UpgradeDefinition => {
  const allUpgrades = Object.values(UPGRADE_DEFINITIONS);
  return allUpgrades[Math.floor(Math.random() * allUpgrades.length)];
};

export const getRandomUpgradeByRarity = (): UpgradeDefinition => {
  // Generate random number from 0-99
  const roll = Math.floor(Math.random() * 100);
  let threshold = 0;
  
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    threshold += weight;
    if (roll < threshold) {
      const upgradesOfRarity = getUpgradesByRarity(rarity as keyof typeof RARITY_WEIGHTS);
      if (upgradesOfRarity.length > 0) {
        return upgradesOfRarity[Math.floor(Math.random() * upgradesOfRarity.length)];
      }
    }
  }
  
  // Fallback to common rarity
  return getRandomUpgrade();
};

export const generateShopUpgrades = (count: number = 6): UpgradeDefinition[] => {
  const upgrades: UpgradeDefinition[] = [];
  const usedIds = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let upgrade: UpgradeDefinition;
    let attempts = 0;
    
    // Try to generate unique upgrades
    do {
      upgrade = getRandomUpgradeByRarity();
      attempts++;
    } while (usedIds.has(upgrade.id) && attempts < 20);
    
    upgrades.push(upgrade);
    usedIds.add(upgrade.id);
  }
  
  return upgrades;
};