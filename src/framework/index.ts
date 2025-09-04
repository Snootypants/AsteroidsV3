// Main Framework Export
// This file provides the complete React Game Framework API

// Phase 1: Core Hooks & State Management
export { useGameState } from './hooks/useGameState';
export { useThreeScene } from './hooks/useThreeScene';
export { useEntityPool } from './hooks/useEntityPool';

// Phase 2: UI Components & Overlay System  
export { GameFramework } from './GameFramework';
export * from './components';

// Phase 3: Game Systems (to be implemented)
// export * from './systems';
// export * from './entities';

// Constants
export {
  WORLD,
  PLAYER,
  ASTEROIDS,
  BULLET,
  STARFIELD
} from './constants/gameConstants';

// Types
export type {
  CurrencyType,
  OverlayType,
  PierceType,
  SpreadType
} from './constants/gameConstants';

// Types
export type { GameState } from './hooks/useGameState';
export type { EntityPoolHook } from './hooks/useEntityPool';

// Test Components
export { UIIntegrationTest } from './test/UIIntegrationTest';