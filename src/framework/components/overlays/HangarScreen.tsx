import React from 'react';
import { GameState } from '../../hooks/useGameState';

interface HangarScreenProps {
  gameState?: GameState;
  onUpdateGameState?: (updates: Partial<GameState>) => void;
  onStartGame?: () => void;
  onClose: () => void;
}

export const HangarScreen: React.FC<HangarScreenProps> = ({
  gameState,
  onUpdateGameState,
  onStartGame,
  onClose
}) => {
  const handleNextMission = () => {
    // Start the next wave/mission
    if (onUpdateGameState && gameState) {
      onUpdateGameState({
        wave: gameState.wave + 1,
        overlay: {
          show: false,
          type: 'none'
        }
      });
    }
    if (onStartGame) {
      onStartGame();
    } else {
      onClose(); // Use onClose from Game.tsx
    }
  };

  const handleReroll = () => {
    // Implement shop reroll logic - would generate new upgrades
    console.log('Reroll shop items');
  };

  const handleBanish = () => {
    // Implement banish logic - would remove selected upgrade from pool
    console.log('Banish selected upgrade');
  };

  const handleToggleVisibility = () => {
    // Toggle upgrade visibility/filtering
    if (onUpdateGameState && gameState) {
      onUpdateGameState({
        ui: {
          ...gameState.ui,
          hideUpgrades: !gameState.ui.hideUpgrades
        }
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case ' ':
      case 'Enter':
        event.preventDefault();
        handleNextMission();
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        handleReroll();
        break;
      case 'b':
      case 'B':
        event.preventDefault();
        handleBanish();
        break;
      case 'h':
      case 'H':
        event.preventDefault();
        handleToggleVisibility();
        break;
    }
  };

  return (
    <div 
      className="overlay hangar-overlay show"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <img 
        className="overlay-img" 
        src={new URL('../../../assets/Hanger.png', import.meta.url).toString()}
        alt="Hangar background"
        loading="eager"
      />

      <div className="hangar-title">
        <h1>HANGAR</h1>
        <p>Wave {gameState?.wave || 1} Complete - Prepare for Wave {(gameState?.wave || 1) + 1}</p>
      </div>

      {/* Currency display */}
      <div className="hangar-currency">
        <div className="currency-item salvage">
          {gameState?.currencies?.salvage || 0}
        </div>
        <div className="currency-item gold">
          {gameState?.currencies?.gold || 0}
        </div>
        <div className="currency-item platinum">
          {gameState?.currencies?.platinum || 0}
        </div>
        <div className="currency-item adamantium">
          {gameState?.currencies?.adamantium || 0}
        </div>
      </div>

      {/* Shop area - This will contain ShopCard components */}
      <div className="card-grid shop" style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90vw',
        maxHeight: '40vh',
        overflow: 'auto'
      }}>
        {/* Placeholder for shop cards */}
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--color-primary)',
          opacity: 0.6,
          fontSize: '18px'
        }}>
          Shop upgrades will appear here
        </div>
      </div>

      {/* Control buttons */}
      <div className="shop-controls">
        <button className="shop-button reroll" onClick={handleReroll}>
          Reroll (R) - {gameState?.rerollCost || 10} Gold
        </button>
        
        <button className="shop-button banish" onClick={handleBanish}>
          Banish (B) - {gameState?.banishCost || 25} Gold
        </button>
        
        <button className="shop-button toggle-vis" onClick={handleToggleVisibility}>
          {gameState?.ui?.hideUpgrades ? 'Show' : 'Hide'} Upgrades (H)
        </button>
        
        <button className="shop-button next-mission" onClick={handleNextMission}>
          Next Mission (SPACE)
        </button>
      </div>

      <div className="shop-info">
        Click upgrades to purchase • SPACE for next mission
      </div>
    </div>
  );
};