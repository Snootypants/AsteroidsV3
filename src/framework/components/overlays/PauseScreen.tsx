import React from 'react';
import { GameState } from '../../hooks/useGameState';

interface PauseScreenProps {
  gameState: GameState;
  onUpdateGameState: (updates: Partial<GameState>) => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
}

export const PauseScreen: React.FC<PauseScreenProps> = ({
  gameState,
  onUpdateGameState,
  onResumeGame,
  onRestartGame
}) => {
  const handleVolumeChange = (type: 'master' | 'sfx' | 'music', value: number) => {
    onUpdateGameState({
      sound: {
        ...gameState.sound,
        [type]: value
      }
    });
  };

  const toggleMute = () => {
    onUpdateGameState({
      sound: {
        ...gameState.sound,
        muted: !gameState.sound.muted
      }
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' || event.key === ' ') {
      event.preventDefault();
      onResumeGame();
    } else if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      onRestartGame();
    }
  };

  return (
    <div 
      className={`overlay pause-screen ${gameState.overlay.show ? 'show' : 'hide'}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="overlay-center">
        <h1>PAUSED</h1>
        
        <div className="pause-section">
          <h3>Controls</h3>
          <div className="pause-controls">
            <div>WASD - Move ship</div>
            <div>Mouse - Aim and shoot</div>
            <div>ESC - Pause/Resume</div>
            <div>R - Restart game</div>
          </div>
        </div>

        <div className="pause-section" style={{ marginTop: '20px' }}>
          <h3>Audio Settings</h3>
          
          <div className="sound-control">
            <label>Master:</label>
            <input
              type="range"
              min="0"
              max="100"
              value={gameState.sound.master * 100}
              onChange={(e) => handleVolumeChange('master', parseInt(e.target.value) / 100)}
            />
            <span>{Math.round(gameState.sound.master * 100)}%</span>
          </div>

          <div className="sound-control">
            <label>SFX:</label>
            <input
              type="range"
              min="0"
              max="100"
              value={gameState.sound.sfx * 100}
              onChange={(e) => handleVolumeChange('sfx', parseInt(e.target.value) / 100)}
            />
            <span>{Math.round(gameState.sound.sfx * 100)}%</span>
          </div>

          <div className="sound-control">
            <label>Music:</label>
            <input
              type="range"
              min="0"
              max="100"
              value={gameState.sound.music * 100}
              onChange={(e) => handleVolumeChange('music', parseInt(e.target.value) / 100)}
            />
            <span>{Math.round(gameState.sound.music * 100)}%</span>
          </div>

          <button className="mute-button" onClick={toggleMute}>
            {gameState.sound.muted ? 'Unmute All' : 'Mute All'}
          </button>
        </div>

        <p style={{ marginTop: '24px', opacity: 0.8 }}>
          Press ESC or SPACE to resume • Press R to restart
        </p>
      </div>
    </div>
  );
};