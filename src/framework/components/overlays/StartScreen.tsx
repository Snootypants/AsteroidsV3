import React from 'react';
import { GameState } from '../../hooks/useGameState';

interface StartScreenProps {
  gameState: GameState;
  onUpdateGameState: (updates: Partial<GameState>) => void;
  onStartGame: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  gameState,
  onStartGame
}) => {
  const handleStart = () => {
    onStartGame();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleStart();
    }
  };

  return (
    <div 
      className={`overlay start-screen ${gameState.overlay.show ? 'show' : 'hide'}`}
      onClick={handleStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Start game"
    >
      <img 
        className="overlay-img" 
        src="/assets/images/startbg.jpg" 
        alt="Start screen background"
        loading="eager"
      />
      
      <div className="overlay-center">
        <h1>ASTEROIDS V3</h1>
        <p>Click anywhere or press SPACE to start</p>
        <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.7 }}>
          Use WASD to move • Mouse to aim and shoot • ESC to pause
        </p>
      </div>
    </div>
  );
};