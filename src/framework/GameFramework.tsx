import React from 'react';
import { GameState } from './hooks/useGameState';
import { OverlayManager } from './components/OverlayManager';
import { HUDManager } from './components/hud/HUDManager';

interface GameFrameworkProps {
  gameState: GameState;
  onUpdateGameState: (updates: Partial<GameState>) => void;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  frameTime?: number;
  fps?: number;
}

/**
 * Main Game Framework Component
 * 
 * This component integrates all UI systems and provides the complete
 * React-based overlay and HUD system for arcade games.
 * 
 * Features:
 * - Complete overlay system (Start, Pause, GameOver, Hangar, Choices)
 * - HUD components (Currency, Minimap, Upgrade History, Status Console)
 * - 3D card components with tilt effects
 * - Upgrade system with 16 different upgrade types
 * - Rarity-based styling and animations
 * - Glass morphism design matching vanilla implementation
 */
export const GameFramework: React.FC<GameFrameworkProps> = ({
  gameState,
  onUpdateGameState,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onRestartGame,
  frameTime,
  fps
}) => {
  return (
    <>
      {/* Overlay System - Handles all full-screen overlays */}
      <OverlayManager
        gameState={gameState}
        onUpdateGameState={onUpdateGameState}
        onStartGame={onStartGame}
        onPauseGame={onPauseGame}
        onResumeGame={onResumeGame}
        onRestartGame={onRestartGame}
      />

      {/* HUD System - Handles in-game UI elements */}
      <HUDManager
        gameState={gameState}
        onUpdateGameState={onUpdateGameState}
        frameTime={frameTime}
        fps={fps}
      />
    </>
  );
};