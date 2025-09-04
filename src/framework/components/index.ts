// Main UI Components Export
// This file provides a clean API for importing all UI components

// Core Management Components
export { OverlayManager } from './OverlayManager';
export { HUDManager } from './hud/HUDManager';

// Overlay Screen Components
export { StartScreen } from './overlays/StartScreen';
export { PauseScreen } from './overlays/PauseScreen';
export { GameOverScreen } from './overlays/GameOverScreen';
export { HangarScreen } from './overlays/HangarScreen';
export { ChoicesScreen } from './overlays/ChoicesScreen';

// HUD Components
export { CurrencyDisplay } from './hud/CurrencyDisplay';
export { Minimap } from './hud/Minimap';
export { UpgradeHistory } from './hud/UpgradeHistory';
export { StatusConsole } from './hud/StatusConsole';
export { FrameCounter } from './hud/FrameCounter';

// Card Components
export { UpgradeCard } from './cards/UpgradeCard';
export { ShopCard } from './cards/ShopCard';

// Types
export type { UpgradeDefinition } from './cards/UpgradeCard';

// Data
export * from '../data/upgradeDefinitions';