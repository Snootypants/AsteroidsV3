import React, { useEffect } from 'react';
import { GameState } from '../hooks/useGameState';
import { StartScreen } from './overlays/StartScreen';
import { PauseScreen } from './overlays/PauseScreen';
import { GameOverScreen } from './overlays/GameOverScreen';
import { HangarScreen } from './overlays/HangarScreen';
import { ChoicesScreen } from './overlays/ChoicesScreen';

// Import all overlay styles
import './styles/base.css';
import './styles/overlays.css';
import './styles/hud.css';
import './styles/cards.css';

interface OverlayManagerProps {
  gameState: GameState;
  onUpdateGameState: (updates: Partial<GameState>) => void;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
}

export const OverlayManager: React.FC<OverlayManagerProps> = ({
  gameState,
  onUpdateGameState,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onRestartGame
}) => {
  // Handle canvas blur effect when overlays are open
  useEffect(() => {
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      const hasOverlay = gameState.overlay.show && gameState.overlay.type !== 'none';
      canvas.classList.toggle('blurred', hasOverlay);
    }
  }, [gameState.overlay.show, gameState.overlay.type]);

  // Handle ESC key for pause/resume
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (gameState.gamePhase === 'playing') {
          onPauseGame();
        } else if (gameState.overlay.type === 'pause') {
          onResumeGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gamePhase, gameState.overlay.type, onPauseGame, onResumeGame]);

  // Don't render anything if no overlay should be shown
  if (!gameState.overlay.show || gameState.overlay.type === 'none') {
    return null;
  }

  const commonProps = {
    gameState,
    onUpdateGameState,
    onStartGame,
    onPauseGame,
    onResumeGame,
    onRestartGame,
    onClose: () => onUpdateGameState({ overlay: { show: false, type: 'none' } })
  };

  return (
    <>
      {gameState.overlay.type === 'start' && (
        <StartScreen {...commonProps} />
      )}
      
      {gameState.overlay.type === 'pause' && (
        <PauseScreen {...commonProps} />
      )}
      
      {gameState.overlay.type === 'gameover' && (
        <GameOverScreen {...commonProps} />
      )}
      
      {gameState.overlay.type === 'hangar' && (
        <HangarScreen {...commonProps} />
      )}
      
      {gameState.overlay.type === 'choices' && (
        <ChoicesScreen {...commonProps} />
      )}
    </>
  );
};