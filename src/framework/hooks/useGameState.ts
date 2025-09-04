import { useState, useCallback, useRef } from 'react';
import { CurrencyType, OverlayType, PierceType, SpreadType } from '../constants/gameConstants';

// Complete GameState interface matching vanilla implementation exactly
export interface GameState {
  // Core game state
  score: number;
  wave: number;
  lives: number;
  shipsLost: number;
  gameOver: boolean;
  paused: boolean;
  pausedForUpgrade: boolean;
  started: boolean;
  gamePhase: 'menu' | 'playing' | 'paused' | 'gameover' | 'hangar' | 'choices';
  deathReason?: string;
  
  // Player state
  invuln: number;
  combo: number;
  comboTimer: number;
  playerShotCounter: number;
  player: {
    position: { x: number; y: number };
    rotation: number;
  };
  
  // Currencies (4-currency system)
  currencies: {
    salvage: number;
    gold: number;
    platinum: number;
    adamantium: number;
  };
  
  // Modifications system (16+ upgrade types)
  mods: {
    fireRateMul: number;      // default 1.0
    engineMul: number;         // default 1.0
    spread: SpreadType;        // false | true | 'wide'
    pierce: PierceType;        // false | true | 'super' | 'ultra'
    shields: number;           // default 0
    ricochet: number;          // 0, 1, or 2
    drones: number;            // 0 to 3
    magnet?: number;
    magnetLvl?: number;
  };
  
  // UI state
  currentOverlay: OverlayType;
  overlay: {
    show: boolean;
    type: OverlayType;
  };
  upgradeHistory: UpgradeHistoryItem[];
  rerollCount: number;
  baseRerollCost: number;
  rerollCost: number;
  banishCost: number;
  
  // Sound settings
  sound: {
    master: number;
    sfx: number;
    music: number;
    muted: boolean;
  };
  
  // UI/Input state
  ui: {
    showReticle: boolean;
    mousePosition: { x: number; y: number };
    minimapFocused: boolean;
    hideUpgrades: boolean;
  };
  
  // Debug state
  debug: {
    showFPS: boolean;
    showStatusConsole: boolean;
    logs: string[];
  };
  
  // Stats tracking
  stats: {
    asteroidsDestroyed: number;
    shotsFired: number;
    shotsHit: number;
    playTime: number;
  };
  
  // Camera and rendering
  currentZoom: number;
  
  // Input state
  mouseEnabled: boolean;
}

export interface UpgradeHistoryItem {
  id: string;
  name: string;
  icon: string;
  timestamp: number;
}

export interface Upgrade {
  key: string;
  label: string;
  desc: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  timestamp: number;
}

const initialGameState: GameState = {
  // Core game state
  score: 0,
  wave: 1,
  lives: 3,
  shipsLost: 0,
  gameOver: false,
  paused: false,
  pausedForUpgrade: false,
  started: false,
  gamePhase: 'menu',
  deathReason: undefined,
  
  // Player state
  invuln: 0,
  combo: 1,
  comboTimer: 0,
  playerShotCounter: 0,
  player: {
    position: { x: 0, y: 0 },
    rotation: 0
  },
  
  // Currencies
  currencies: {
    salvage: 0,
    gold: 0,
    platinum: 0,
    adamantium: 0,
  },
  
  // Modifications
  mods: {
    fireRateMul: 1.0,
    engineMul: 1.0,
    spread: false,
    pierce: false,
    shields: 0,
    ricochet: 0,
    drones: 0,
  },
  
  // UI state
  currentOverlay: 'start',
  overlay: {
    show: true,
    type: 'start'
  },
  upgradeHistory: [],
  rerollCount: 0,
  baseRerollCost: 15,
  rerollCost: 15,
  banishCost: 10,
  
  // Sound settings
  sound: {
    master: 1.0,
    sfx: 1.0,
    music: 1.0,
    muted: false
  },
  
  // UI/Input state
  ui: {
    showReticle: true,
    mousePosition: { x: 0, y: 0 },
    minimapFocused: false,
    hideUpgrades: false
  },
  
  // Debug state
  debug: {
    showFPS: false,
    showStatusConsole: false,
    logs: []
  },
  
  // Stats tracking
  stats: {
    asteroidsDestroyed: 0,
    shotsFired: 0,
    shotsHit: 0,
    playTime: 0
  },
  
  // Camera
  currentZoom: 1.0,
  
  // Input
  mouseEnabled: true,
};

export interface GameStateHook {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  
  // Core game controls
  startGame: () => void;
  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: (reason?: string) => void;
  nextWave: () => void;
  
  // Score and combo
  addScore: (points: number) => void;
  addComboScore: (baseScore: number) => void;
  resetCombo: () => void;
  decrementComboTimer: (dt: number) => void;
  
  // Currency management
  addCurrency: (type: CurrencyType, amount: number) => void;
  spendCurrency: (costs: Partial<Record<CurrencyType, number>>) => boolean;
  canAfford: (costs: Partial<Record<CurrencyType, number>>) => boolean;
  
  // Modifications
  applyUpgrade: (upgrade: Upgrade, modChanges: Partial<GameState['mods']>) => void;
  resetMods: () => void;
  
  // UI state
  setOverlay: (overlay: OverlayType) => void;
  incrementRerollCount: () => void;
  resetRerollCount: () => void;
  
  // Player state
  setInvuln: (seconds: number) => void;
  decrementInvuln: (dt: number) => void;
  incrementPlayerShotCounter: () => void;
  
  // Camera
  setZoom: (zoom: number) => void;
  
  // Input
  setMouseEnabled: (enabled: boolean) => void;
  
  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

export const useGameState = (): GameStateHook => {
  const [state, setState] = useState<GameState>(initialGameState);
  const persistenceTimeoutRef = useRef<number>();
  
  // Debounced persistence to avoid excessive localStorage writes
  const debouncedSave = useCallback(() => {
    if (persistenceTimeoutRef.current) {
      clearTimeout(persistenceTimeoutRef.current);
    }
    persistenceTimeoutRef.current = setTimeout(() => {
      const persistentData = {
        currencies: state.currencies,
        upgradeHistory: state.upgradeHistory.slice(0, 8), // Only keep last 8
        bestScore: Math.max(state.score, 
          parseInt(localStorage.getItem('asteroids_bestScore') || '0')
        ),
      };
      localStorage.setItem('asteroids_gameData', JSON.stringify(persistentData));
      localStorage.setItem('asteroids_bestScore', persistentData.bestScore.toString());
    }, 1000);
  }, [state.currencies, state.upgradeHistory, state.score]);
  
  // Core game controls
  const startGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      started: true,
      gameOver: false,
      currentOverlay: null,
      invuln: 2.0, // Brief safety window
    }));
  }, []);
  
  const resetGame = useCallback(() => {
    setState(prev => ({
      ...initialGameState,
      currencies: prev.currencies, // Keep currencies between games
      upgradeHistory: [], // Reset upgrade history
      started: true,
      currentOverlay: null,
      invuln: 2.0,
    }));
  }, []);
  
  const pauseGame = useCallback(() => {
    setState(prev => ({ ...prev, paused: !prev.paused }));
  }, []);
  
  const resumeGame = useCallback(() => {
    setState(prev => ({ ...prev, paused: false }));
  }, []);
  
  const endGame = useCallback((_reason = 'Destroyed') => {
    setState(prev => ({
      ...prev,
      gameOver: true,
      currentOverlay: 'gameover',
      paused: false,
      pausedForUpgrade: false,
    }));
    debouncedSave();
  }, [debouncedSave]);
  
  const nextWave = useCallback(() => {
    setState(prev => ({
      ...prev,
      wave: prev.wave + 1,
      invuln: 3.0, // 3-second invulnerability when starting new wave
    }));
  }, []);
  
  // Score and combo management
  const addScore = useCallback((points: number) => {
    setState(prev => ({ ...prev, score: prev.score + points }));
  }, []);
  
  const addComboScore = useCallback((baseScore: number) => {
    setState(prev => {
      const newCombo = prev.combo + 1;
      const multiplier = 1 + 0.2 * (newCombo - 1);
      const finalScore = Math.round(baseScore * multiplier);
      
      return {
        ...prev,
        combo: newCombo,
        comboTimer: 2.3, // Reset combo timer
        score: prev.score + finalScore,
      };
    });
  }, []);
  
  const resetCombo = useCallback(() => {
    setState(prev => ({ ...prev, combo: 1, comboTimer: 0 }));
  }, []);
  
  const decrementComboTimer = useCallback((dt: number) => {
    setState(prev => {
      const newTimer = Math.max(0, prev.comboTimer - dt);
      const newCombo = newTimer <= 0 ? 1 : prev.combo;
      return { ...prev, comboTimer: newTimer, combo: newCombo };
    });
  }, []);
  
  // Currency management
  const addCurrency = useCallback((type: CurrencyType, amount: number) => {
    setState(prev => ({
      ...prev,
      currencies: {
        ...prev.currencies,
        [type]: prev.currencies[type] + amount,
      },
    }));
    debouncedSave();
  }, [debouncedSave]);
  
  const spendCurrency = useCallback((costs: Partial<Record<CurrencyType, number>>): boolean => {
    let purchaseSuccessful = false;
    
    setState(prev => {
      // Check if can afford
      const canAfford = Object.entries(costs).every(([type, cost]) => 
        prev.currencies[type as CurrencyType] >= (cost || 0)
      );
      
      if (!canAfford) return prev;
      
      purchaseSuccessful = true;
      
      // Spend the currency
      const newCurrencies = { ...prev.currencies };
      Object.entries(costs).forEach(([type, cost]) => {
        if (cost) {
          newCurrencies[type as CurrencyType] -= cost;
        }
      });
      
      return {
        ...prev,
        currencies: newCurrencies,
      };
    });
    
    return purchaseSuccessful;
  }, [setState]);
  
  const canAfford = useCallback((costs: Partial<Record<CurrencyType, number>>): boolean => {
    return Object.entries(costs).every(([type, cost]) => 
      state.currencies[type as CurrencyType] >= (cost || 0)
    );
  }, [state.currencies]);
  
  // Modifications
  const applyUpgrade = useCallback((upgrade: Upgrade, modChanges: Partial<GameState['mods']>) => {
    const historyItem: UpgradeHistoryItem = {
      id: upgrade.key,
      name: upgrade.label,
      icon: '⚡', // Default icon, should be passed or mapped
      timestamp: Date.now()
    };
    
    setState(prev => ({
      ...prev,
      mods: { ...prev.mods, ...modChanges },
      upgradeHistory: [historyItem, ...prev.upgradeHistory].slice(0, 8), // Keep last 8 upgrades
    }));
  }, []);
  
  const resetMods = useCallback(() => {
    setState(prev => ({ ...prev, mods: { ...initialGameState.mods } }));
  }, []);
  
  // UI state management
  const setOverlay = useCallback((overlay: OverlayType) => {
    setState(prev => ({
      ...prev,
      currentOverlay: overlay,
      pausedForUpgrade: overlay === 'upgrade' || overlay === 'hangar',
      mouseEnabled: overlay === null,
    }));
  }, []);
  
  const incrementRerollCount = useCallback(() => {
    setState(prev => ({ ...prev, rerollCount: prev.rerollCount + 1 }));
  }, []);
  
  const resetRerollCount = useCallback(() => {
    setState(prev => ({ ...prev, rerollCount: 0 }));
  }, []);
  
  // Player state
  const setInvuln = useCallback((seconds: number) => {
    setState(prev => ({ ...prev, invuln: seconds }));
  }, []);
  
  const decrementInvuln = useCallback((dt: number) => {
    setState(prev => ({ ...prev, invuln: Math.max(0, prev.invuln - dt) }));
  }, []);
  
  const incrementPlayerShotCounter = useCallback(() => {
    setState(prev => ({ ...prev, playerShotCounter: prev.playerShotCounter + 1 }));
  }, []);
  
  // Camera
  const setZoom = useCallback((zoom: number) => {
    const clampedZoom = Math.max(0.6, Math.min(1.8, zoom));
    setState(prev => ({ ...prev, currentZoom: clampedZoom }));
  }, []);
  
  // Input
  const setMouseEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, mouseEnabled: enabled }));
  }, []);
  
  // Persistence
  const saveToLocalStorage = useCallback(() => {
    debouncedSave();
  }, [debouncedSave]);
  
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem('asteroids_gameData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setState(prev => ({
          ...prev,
          currencies: { ...prev.currencies, ...parsed.currencies },
          upgradeHistory: parsed.upgradeHistory || [],
        }));
      }
    } catch (error) {
      console.warn('Failed to load game data from localStorage:', error);
    }
  }, []);
  
  // Direct state update method for advanced use cases
  const updateState = useCallback((updates: Partial<GameState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    state,
    updateState,
    
    // Core game controls
    startGame,
    resetGame,
    pauseGame,
    resumeGame,
    endGame,
    nextWave,
    
    // Score and combo
    addScore,
    addComboScore,
    resetCombo,
    decrementComboTimer,
    
    // Currency management
    addCurrency,
    spendCurrency,
    canAfford,
    
    // Modifications
    applyUpgrade,
    resetMods,
    
    // UI state
    setOverlay,
    incrementRerollCount,
    resetRerollCount,
    
    // Player state
    setInvuln,
    decrementInvuln,
    incrementPlayerShotCounter,
    
    // Camera
    setZoom,
    
    // Input
    setMouseEnabled,
    
    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
  };
};