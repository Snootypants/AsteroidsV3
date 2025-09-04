import React, { useState, useEffect } from 'react';
import { GameFramework } from '../GameFramework';
import { useGameState } from '../hooks/useGameState';

/**
 * UI Integration Test Component
 * 
 * This component demonstrates and tests all UI systems:
 * - All overlay screens with transitions
 * - HUD components with live data
 * - Card interactions and 3D effects
 * - State management integration
 * 
 * Run this component to verify Phase 2 implementation is working correctly.
 */
export const UIIntegrationTest: React.FC = () => {
  const gameStateHook = useGameState();
  const [frameTime, setFrameTime] = useState(16.67);
  const [fps, setFps] = useState(60);
  const [testPhase, setTestPhase] = useState('start');

  // Simulate game loop performance metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameTime(16.67 + Math.random() * 5);
      setFps(60 - Math.random() * 10);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Test different UI states
  const showStartScreen = () => {
    gameStateHook.updateState({
      gamePhase: 'menu',
      overlay: { show: true, type: 'start' }
    });
    setTestPhase('start');
  };

  const showPauseScreen = () => {
    gameStateHook.updateState({
      gamePhase: 'playing',
      overlay: { show: true, type: 'pause' }
    });
    setTestPhase('pause');
  };

  const showGameOverScreen = () => {
    gameStateHook.updateState({
      gamePhase: 'gameover',
      overlay: { show: true, type: 'gameover' },
      score: 125000,
      wave: 15,
      shipsLost: 3,
      deathReason: 'Overwhelmed by asteroid swarm',
      stats: {
        ...gameStateHook.state.stats,
        asteroidsDestroyed: 423,
        shotsFired: 1250,
        shotsHit: 892,
        playTime: 847
      }
    });
    setTestPhase('gameover');
  };

  const showHangarScreen = () => {
    gameStateHook.updateState({
      gamePhase: 'hangar',
      overlay: { show: true, type: 'hangar' },
      wave: 8,
      currencies: {
        salvage: 150,
        gold: 45,
        platinum: 8,
        adamantium: 2
      }
    });
    setTestPhase('hangar');
  };

  const showChoicesScreen = () => {
    gameStateHook.updateState({
      gamePhase: 'choices',
      overlay: { show: true, type: 'choices' }
    });
    setTestPhase('choices');
  };

  const showGameplayHUD = () => {
    gameStateHook.updateState({
      gamePhase: 'playing',
      overlay: { show: false, type: 'none' },
      score: 87500,
      wave: 12,
      lives: 2,
      currencies: {
        salvage: 89,
        gold: 23,
        platinum: 4,
        adamantium: 1
      },
      upgradeHistory: [
        { id: 'fireRate', name: 'Rapid Fire', icon: '🔥', timestamp: Date.now() - 30000 },
        { id: 'engine', name: 'Engine Boost', icon: '🚀', timestamp: Date.now() - 20000 },
        { id: 'pierceDouble', name: 'Armor Piercing', icon: '🗲', timestamp: Date.now() - 10000 }
      ],
      debug: {
        ...gameStateHook.state.debug,
        showFPS: true,
        showStatusConsole: true,
        logs: [
          'System initialized',
          'Player spawned at (0, 0)',
          'Wave 12 started',
          'Asteroid destroyed (+150 salvage)',
          'Currency pickup: +5 gold',
          'HINT: Upgrade your fire rate for better DPS'
        ]
      }
    });
    setTestPhase('gameplay');
  };

  const handleStartGame = () => {
    console.log('Game started!');
    showGameplayHUD();
  };

  const handlePauseGame = () => {
    console.log('Game paused!');
    showPauseScreen();
  };

  const handleResumeGame = () => {
    console.log('Game resumed!');
    showGameplayHUD();
  };

  const handleRestartGame = () => {
    console.log('Game restarted!');
    gameStateHook.updateState({
      score: 0,
      wave: 1,
      lives: 3,
      shipsLost: 0,
      currencies: { salvage: 0, gold: 0, platinum: 0, adamantium: 0 },
      upgradeHistory: []
    });
    showStartScreen();
  };

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'radial-gradient(1200px 800px at 50% 50%, #04040a, #020208 60%, #000 100%)',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    }}>
      {/* Three.js Canvas Placeholder */}
      <canvas
        id="game-canvas"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: 'transparent'
        }}
      />

      {/* Test Controls */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        zIndex: 20000,
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={showStartScreen}
          style={{
            padding: '8px 12px',
            background: testPhase === 'start' ? '#4a90e2' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Start Screen
        </button>
        
        <button 
          onClick={showPauseScreen}
          style={{
            padding: '8px 12px',
            background: testPhase === 'pause' ? '#4a90e2' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Pause Screen
        </button>
        
        <button 
          onClick={showGameOverScreen}
          style={{
            padding: '8px 12px',
            background: testPhase === 'gameover' ? '#4a90e2' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Game Over
        </button>
        
        <button 
          onClick={showHangarScreen}
          style={{
            padding: '8px 12px',
            background: testPhase === 'hangar' ? '#4a90e2' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Hangar/Shop
        </button>
        
        <button 
          onClick={showChoicesScreen}
          style={{
            padding: '8px 12px',
            background: testPhase === 'choices' ? '#4a90e2' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Upgrade Choices
        </button>
        
        <button 
          onClick={showGameplayHUD}
          style={{
            padding: '8px 12px',
            background: testPhase === 'gameplay' ? '#4a90e2' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Gameplay HUD
        </button>
      </div>

      {/* Main Game Framework */}
      <GameFramework
        gameState={gameStateHook.state}
        onUpdateGameState={gameStateHook.updateState}
        onStartGame={handleStartGame}
        onPauseGame={handlePauseGame}
        onResumeGame={handleResumeGame}
        onRestartGame={handleRestartGame}
        frameTime={frameTime}
        fps={fps}
      />
    </div>
  );
};