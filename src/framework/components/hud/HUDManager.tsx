import React from 'react';
import { GameState } from '../../hooks/useGameState';
import { CurrencyDisplay } from './CurrencyDisplay';
import { Minimap } from './Minimap';
import { UpgradeHistory } from './UpgradeHistory';
import { StatusConsole } from './StatusConsole';
import { FrameCounter } from './FrameCounter';

interface HUDManagerProps {
  gameState: GameState;
  onUpdateGameState: (updates: Partial<GameState>) => void;
  frameTime?: number;
  fps?: number;
}

export const HUDManager: React.FC<HUDManagerProps> = ({
  gameState,
  onUpdateGameState,
  frameTime = 0,
  fps = 0
}) => {
  // Only show HUD during active gameplay
  if (gameState.gamePhase !== 'playing' || gameState.overlay.show) {
    return null;
  }

  return (
    <>
      {/* Main HUD container */}
      <div className="hud">
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Score: {gameState.score.toLocaleString()}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Wave: {gameState.wave}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Lives: {gameState.lives}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Ships: {gameState.shipsLost}
        </div>
      </div>

      {/* Currency display (top-right) */}
      <CurrencyDisplay 
        currencies={gameState.currencies}
      />

      {/* Minimap (bottom-center) */}
      <Minimap 
        gameState={gameState}
        onUpdateGameState={onUpdateGameState}
      />

      {/* Upgrade history (bottom-left) */}
      <UpgradeHistory 
        history={gameState.upgradeHistory}
      />

      {/* Status console (bottom-right) */}
      <StatusConsole 
        gameState={gameState}
        onUpdateGameState={onUpdateGameState}
      />

      {/* Frame counter (debug - bottom-right corner) */}
      {gameState.debug.showFPS && (
        <FrameCounter 
          fps={fps}
          frameTime={frameTime}
        />
      )}

      {/* Mouse reticle */}
      <div 
        className={`reticle ${gameState.ui.showReticle ? 'visible' : ''}`}
        style={{
          left: gameState.ui.mousePosition.x,
          top: gameState.ui.mousePosition.y
        }}
      />
    </>
  );
};