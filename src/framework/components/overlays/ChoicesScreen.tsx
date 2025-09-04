import React from 'react';
import { GameState } from '../../hooks/useGameState';

interface ChoicesScreenProps {
  gameState: GameState;
  onUpdateGameState: (updates: Partial<GameState>) => void;
  onStartGame: () => void;
}

export const ChoicesScreen: React.FC<ChoicesScreenProps> = ({
  gameState,
  onUpdateGameState,
  onStartGame
}) => {
  const handleChoice = (choiceIndex: number) => {
    // Apply the selected upgrade and continue to next wave
    console.log(`Selected choice ${choiceIndex}`);
    
    // Hide overlay and continue game
    onUpdateGameState({
      overlay: {
        show: false,
        type: 'none'
      }
    });
    onStartGame();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key >= '1' && event.key <= '3') {
      const choiceIndex = parseInt(event.key) - 1;
      handleChoice(choiceIndex);
    } else if (event.key === 'Escape') {
      // Skip choices (if allowed)
      onUpdateGameState({
        overlay: {
          show: false,
          type: 'none'
        }
      });
      onStartGame();
    }
  };

  return (
    <div 
      className={`overlay choices-screen ${gameState.overlay.show ? 'show' : 'hide'}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="choices-heading">
        <h1>LEVEL UP</h1>
        <p>Choose your upgrade</p>
      </div>

      {/* Upgrade choices - This will contain UpgradeCard components */}
      <div className="card-grid choices">
        {/* Placeholder for upgrade choice cards */}
        {[0, 1, 2].map(index => (
          <div 
            key={index}
            className="card"
            onClick={() => handleChoice(index)}
            style={{
              cursor: 'pointer',
              padding: '20px',
              background: 'rgba(20, 30, 60, 0.8)',
              border: '2px solid rgba(120, 150, 255, 0.4)',
              borderRadius: '12px',
              textAlign: 'center',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              opacity: 0.6
            }}>
              {index + 1}
            </div>
            <div style={{
              fontSize: '18px',
              color: 'var(--color-primary)',
              marginBottom: '8px'
            }}>
              Upgrade Choice {index + 1}
            </div>
            <div style={{
              fontSize: '14px',
              opacity: 0.8
            }}>
              Press {index + 1} or click to select
            </div>
          </div>
        ))}
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: '24px',
        opacity: 0.8
      }}>
        Press 1, 2, or 3 to choose • ESC to skip
      </div>
    </div>
  );
};