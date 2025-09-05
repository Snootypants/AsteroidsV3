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
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ pointerEvents: 'auto' }}
    >
      <img 
        className="overlay-img" 
        src={new URL('../../../assets/start_screen.png', import.meta.url).toString()} 
        alt="Start screen background"
        loading="eager"
      />
      
      <div className="overlay-center">
        <h1>ASTEROIDS V3</h1>
        
        <div style={{ 
          marginTop: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center'
        }}>
          <button
            onClick={handleStart}
            style={{
              padding: '16px 48px',
              fontSize: '20px',
              fontWeight: 'bold',
              backgroundColor: '#4a90e2',
              color: 'white',
              border: '2px solid #6bb6ff',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#6bb6ff';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(107, 182, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4a90e2';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(74, 144, 226, 0.3)';
            }}
          >
            Start Game
          </button>
          
          <button
            onClick={() => console.log('Settings clicked')}
            style={{
              padding: '12px 36px',
              fontSize: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            Settings
          </button>
          
          <button
            onClick={() => console.log('How to Play clicked')}
            style={{
              padding: '12px 36px',
              fontSize: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            How to Play
          </button>
        </div>
        
        <p style={{ marginTop: '32px', fontSize: '14px', opacity: 0.7 }}>
          Press SPACE or ENTER to quick start
        </p>
        
        <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.7 }}>
          Use WASD to move • Mouse to aim • SPACE to shoot • ESC to pause
        </p>
      </div>
    </div>
  );
};