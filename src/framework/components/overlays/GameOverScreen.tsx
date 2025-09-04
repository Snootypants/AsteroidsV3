import React from 'react';
import { GameState } from '../../hooks/useGameState';

interface GameOverScreenProps {
  gameState: GameState;
  onUpdateGameState: (updates: Partial<GameState>) => void;
  onStartGame: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  gameState,
  onStartGame
}) => {
  const handleRestart = () => {
    onStartGame();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter' || event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      handleRestart();
    }
  };

  return (
    <div 
      className={`overlay gameover ${gameState.overlay.show ? 'show' : 'hide'}`}
      onClick={handleRestart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Restart game"
    >
      <div className="overlay-center">
        <h1>GAME OVER</h1>
        
        <div style={{ margin: '20px 0', fontSize: '24px' }}>
          <div style={{ color: 'var(--color-primary-light)', marginBottom: '8px' }}>
            Final Score: {gameState.score.toLocaleString()}
          </div>
          
          <div style={{ fontSize: '18px', opacity: 0.8 }}>
            Wave: {gameState.wave} • Ships Lost: {gameState.shipsLost}
          </div>
        </div>

        {gameState.deathReason && (
          <div className="death-reason">
            {gameState.deathReason}
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'grid', gap: '8px', fontSize: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', minWidth: '300px' }}>
            <span>Asteroids Destroyed:</span>
            <span>{gameState.stats.asteroidsDestroyed}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Shots Fired:</span>
            <span>{gameState.stats.shotsFired}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Accuracy:</span>
            <span>
              {gameState.stats.shotsFired > 0 
                ? Math.round((gameState.stats.shotsHit / gameState.stats.shotsFired) * 100)
                : 0}%
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Play Time:</span>
            <span>
              {Math.floor(gameState.stats.playTime / 60)}:
              {String(Math.floor(gameState.stats.playTime % 60)).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div style={{ 
          marginTop: '32px', 
          display: 'flex', 
          gap: '24px', 
          fontSize: '20px',
          justifyContent: 'center' 
        }}>
          <div style={{ color: 'var(--color-salvage)' }}>
            {gameState.currencies.salvage} Salvage
          </div>
          <div style={{ color: 'var(--color-gold)' }}>
            {gameState.currencies.gold} Gold
          </div>
          <div style={{ color: 'var(--color-platinum)' }}>
            {gameState.currencies.platinum} Platinum
          </div>
          <div style={{ color: 'var(--color-adamantium)' }}>
            {gameState.currencies.adamantium} Adamantium
          </div>
        </div>

        <p style={{ marginTop: '32px', opacity: 0.8 }}>
          Click anywhere or press R to restart
        </p>
      </div>
    </div>
  );
};