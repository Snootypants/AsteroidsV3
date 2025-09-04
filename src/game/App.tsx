import { useEffect, useState } from 'react';
import { useGameState } from '../framework/hooks/useGameState';
import { useThreeScene } from '../framework/hooks/useThreeScene';
import { EntitySystemTest, UIIntegrationTest } from '../framework';
import { Game } from '../framework/game/Game';
import GameScene from './GameScene';

function App() {
  const gameState = useGameState();
  const threeScene = useThreeScene();
  const [testMode, setTestMode] = useState<'none' | 'entities' | 'ui' | 'game'>('none');

  // Initialize game data from localStorage on mount
  useEffect(() => {
    gameState.loadFromLocalStorage();
  }, []);

  // Boot sequence log
  useEffect(() => {
    console.log('[Asteroids Framework] Booting...');
    console.log('[Asteroids Framework] React components mounted');
    console.log('[Asteroids Framework] Game state initialized');
    console.log('[Asteroids Framework] Three.js scene ready');
    console.log('[Asteroids Framework] Framework boot complete - ready for game implementation');
  }, []);

  // Handle test mode switching
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '1') setTestMode('entities');
      if (event.key === '2') setTestMode('ui');
      if (event.key === '3') setTestMode('game');
      if (event.key === '0') setTestMode('none');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Render test components
  if (testMode === 'entities') {
    return <EntitySystemTest />;
  }
  
  if (testMode === 'ui') {
    return <UIIntegrationTest />;
  }
  
  if (testMode === 'game') {
    return <Game />;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Three.js mount point */}
      <div 
        ref={threeScene.mountRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0
        }} 
      />
      
      {/* Game Scene Component - This will contain all the game logic */}
      <GameScene 
        gameState={gameState}
        threeScene={threeScene}
      />
      
      {/* Overlay UI - This is where HUD, menus, etc will go */}
      <div 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 100
        }}
      >
        {/* Status display for debugging */}
        <div style={{ 
          position: 'absolute', 
          top: 20, 
          left: 20, 
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '14px',
          pointerEvents: 'auto',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '10px',
          borderRadius: '4px'
        }}>
          <div>Framework Status: Ready ✓</div>
          <div>Phase 3 Day 1: Entity System Foundation ✓</div>
          <div>Game State: {gameState.state.started ? 'Running' : 'Not Started'}</div>
          <div>Wave: {gameState.state.wave}</div>
          <div>Score: {gameState.state.score}</div>
          <div>Overlay: {gameState.state.currentOverlay || 'None'}</div>
          <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>
            <div><strong>Test Modes:</strong></div>
            <div>Press 1 for Entity System Test</div>
            <div>Press 2 for UI Integration Test</div>
            <div>Press 3 for Complete Game</div>
            <div>Press 0 to return to main app</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;