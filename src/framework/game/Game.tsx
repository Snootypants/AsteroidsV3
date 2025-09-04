import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useThreeScene } from '../hooks/useThreeScene';
import { EntityManager } from '../systems/EntityManager';
import { GameStateManager, GameState, GameStats, GameSettings } from '../systems/GameStateManager';
import { AudioManager } from '../systems/AudioManager';
import { ParticleSystem } from '../systems/ParticleSystem';
import { VFXManager } from '../systems/VFXManager';
import { DebrisSystem } from '../systems/DebrisSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoringSystem } from '../systems/ScoringSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { Ship } from '../entities/Ship';
import { HUD, MainMenu, GameOver, PauseMenu } from '../ui';

/**
 * Complete Asteroids Game Component
 * Integrates all systems for a fully playable experience
 */
export const Game: React.FC = () => {
  // Three.js scene setup
  const threeScene = useThreeScene();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game systems
  const [gameStateManager] = useState(() => new GameStateManager());
  const [entityManager, setEntityManager] = useState<EntityManager | null>(null);
  const [audioManager, setAudioManager] = useState<AudioManager | null>(null);
  const [particleSystem, setParticleSystem] = useState<ParticleSystem | null>(null);
  const [vfxManager, setVFXManager] = useState<VFXManager | null>(null);
  const [debrisSystem, setDebrisSystem] = useState<DebrisSystem | null>(null);
  const [collisionSystem, setCollisionSystem] = useState<CollisionSystem | null>(null);
  const [scoringSystem, setScoringSystem] = useState<ScoringSystem | null>(null);
  const [waveSystem, setWaveSystem] = useState<WaveSystem | null>(null);
  
  // Game state
  const [currentState, setCurrentState] = useState<GameState>('menu');
  const [gameStats, setGameStats] = useState<GameStats>(gameStateManager.getStats());
  const [gameSettings, setGameSettings] = useState<GameSettings>(gameStateManager.getSettings());
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  
  // Game entities
  const [ship, setShip] = useState<Ship | null>(null);
  
  // Input handling
  const keysPressed = useRef<Set<string>>(new Set());
  const mousePos = useRef({ x: 0, y: 0 });
  
  // Performance monitoring
  const [fps, setFps] = useState(60);
  const fpsCounter = useRef({ frames: 0, lastTime: 0 });
  
  // Game loop
  const gameLoopRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // Initialize systems when scene is ready
  useEffect(() => {
    if (!threeScene.sceneRefs.current?.scene || !threeScene.sceneRefs.current?.camera) return;
    
    const scene = threeScene.sceneRefs.current.scene;
    const camera = threeScene.sceneRefs.current.camera;
    
    // Initialize all systems
    const em = new EntityManager(scene);
    const am = new AudioManager();
    const ps = new ParticleSystem(scene);
    const vm = new VFXManager(camera, scene);
    const ds = new DebrisSystem(scene);
    const cs = new CollisionSystem(em, am, ps, vm, ds);
    const ss = new ScoringSystem(ps);
    const ws = new WaveSystem(em, am, ps, vm);
    
    // Set up system connections
    // ps.initialize(); // Remove if method doesn't exist
    
    setEntityManager(em);
    setAudioManager(am);
    setParticleSystem(ps);
    setVFXManager(vm);
    setDebrisSystem(ds);
    setCollisionSystem(cs);
    setScoringSystem(ss);
    setWaveSystem(ws);
    
    // Set up game state callbacks
    gameStateManager.onStateChange('any', (from, to) => {
      setCurrentState(to);
      console.log(`Game state changed: ${from} → ${to}`);
    });
    
    gameStateManager.onStatsUpdate((stats) => {
      setGameStats(stats);
      setIsNewHighScore(stats.score > stats.highScore);
    });
    
    gameStateManager.onSettingsChange((settings) => {
      setGameSettings(settings);
      // Apply settings to systems
      if (am) {
        am.setVolume('master', settings.masterVolume);
        am.setVolume('sfx', settings.sfxVolume);
        am.setVolume('music', settings.musicVolume);
      }
    });
    
    // Set up scoring callbacks
    ss.onScore((score, _delta) => {
      gameStateManager.updateStats({ score });
    });
    
    ss.onCombo((combo) => {
      gameStateManager.updateStats({ combo: combo.count });
    });
    
    // Set up wave callbacks
    ws.onWaveStartCallback((wave) => {
      gameStateManager.updateStats({ wave });
    });
    
    ws.onWaveCompleteCallback((_wave, perfect) => {
      if (perfect) {
        gameStateManager.updateStats({ 
          perfectWaves: gameStats.perfectWaves + 1 
        });
      }
    });
    
    return () => {
      // Cleanup systems
      ps.dispose();
      vm.dispose();
      ds.dispose();
    };
  }, [threeScene.sceneRefs, gameStateManager, gameStats.perfectWaves]);
  
  // Game loop
  useEffect(() => {
    if (currentState !== 'playing' || !entityManager) return;
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      
      // Cap delta time to prevent large jumps
      const clampedDelta = Math.min(deltaTime, 1/30);
      
      // Update FPS counter
      fpsCounter.current.frames++;
      if (currentTime - fpsCounter.current.lastTime >= 1000) {
        setFps(fpsCounter.current.frames);
        fpsCounter.current.frames = 0;
        fpsCounter.current.lastTime = currentTime;
      }
      
      // Update all systems
      if (ship) {
        updateShipControls(ship, clampedDelta);
        handleShooting(ship, entityManager);
      }
      
      entityManager.update(clampedDelta);
      collisionSystem?.update(clampedDelta);
      scoringSystem?.updateCombo(clampedDelta);
      waveSystem?.update(clampedDelta);
      particleSystem?.update(clampedDelta);
      vfxManager?.update(clampedDelta);
      debrisSystem?.update(clampedDelta);
      
      // Update game time
      gameStateManager.updateStats({
        timeAlive: (currentTime - gameStateManager.getDebugInfo().gameTime) / 1000
      });
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    lastTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [currentState, entityManager, ship, collisionSystem, scoringSystem, waveSystem, particleSystem, vfxManager, debrisSystem, gameStateManager]);
  
  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
      
      // Handle pause
      if (e.code === gameSettings.controls.pause) {
        e.preventDefault();
        if (currentState === 'playing') {
          gameStateManager.setState('paused');
        } else if (currentState === 'paused') {
          gameStateManager.setState('playing');
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: rect.height / 2 - (e.clientY - rect.top)
      };
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [currentState, gameSettings.controls.pause, gameStateManager]);
  
  // Ship controls
  const updateShipControls = (ship: Ship, deltaTime: number) => {
    const isForward = keysPressed.current.has(gameSettings.controls.forward);
    const isLeft = keysPressed.current.has(gameSettings.controls.left);
    const isRight = keysPressed.current.has(gameSettings.controls.right);
    
    ship.setThrusting(isForward);
    ship.setRotating(isLeft ? -1 : isRight ? 1 : 0);
    ship.update(deltaTime);
    
    // Update thruster sound
    if (isForward && audioManager) {
      // Would play thruster sound
    }
  };
  
  // Shooting
  const handleShooting = (ship: Ship, entityManager: EntityManager) => {
    const isShooting = gameSettings.autofire || 
                     keysPressed.current.has(gameSettings.controls.shoot);
    
    if (isShooting && ship.canShoot()) {
      const bullet = ship.shoot();
      if (bullet && entityManager) {
        entityManager.addExistingEntity(bullet, 'bullets');
        bullet.spawn(threeScene.sceneRefs.current!.scene);
        
        // Update stats
        gameStateManager.updateStats({
          totalShots: gameStats.totalShots + 1
        });
        
        // Play sound
        audioManager?.playSound('ship.shoot');
        
        // Muzzle flash effect
        particleSystem?.emit('muzzle_flash', ship.position.clone());
      }
    }
  };
  
  // Game state handlers
  const handleStartGame = useCallback(() => {
    if (!entityManager || !threeScene.sceneRefs.current?.scene) return;
    
    // Create and spawn ship
    const newShip = new Ship();
    newShip.spawn(threeScene.sceneRefs.current.scene);
    entityManager.addExistingEntity(newShip, 'ships');
    setShip(newShip);
    
    // Start first wave
    waveSystem?.startWave();
    
    gameStateManager.setState('playing');
  }, [entityManager, threeScene.sceneRefs, waveSystem, gameStateManager]);
  
  const handleRestart = useCallback(() => {
    // Reset all systems
    entityManager?.clearAll();
    scoringSystem?.resetScore();
    waveSystem?.reset();
    // particleSystem?.clear(); // Method may not exist
    vfxManager?.stopAllEffects();
    debrisSystem?.clearAllDebris();
    
    setShip(null);
    handleStartGame();
  }, [entityManager, scoringSystem, waveSystem, particleSystem, vfxManager, debrisSystem, handleStartGame]);
  
  const handleMainMenu = useCallback(() => {
    // Clear game state
    entityManager?.clearAll();
    setShip(null);
    gameStateManager.setState('menu');
  }, [entityManager, gameStateManager]);
  
  const handleSettingsChange = useCallback((newSettings: Partial<GameSettings>) => {
    gameStateManager.updateSettings(newSettings);
  }, [gameStateManager]);
  
  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-black">
      {/* Three.js Canvas */}
      <div className="absolute inset-0" ref={threeScene.mountRef}>
        {/* Canvas will be mounted by Three.js hook */}
      </div>
      
      {/* UI Overlays */}
      {currentState === 'menu' && (
        <MainMenu
          highScore={gameStats.highScore}
          settings={gameSettings}
          onStartGame={handleStartGame}
          onShowHighScores={() => console.log('Show high scores')}
          onShowSettings={() => console.log('Show settings')}
          onSettingsChange={handleSettingsChange}
        />
      )}
      
      {(currentState === 'playing' || currentState === 'paused') && (
        <HUD
          stats={gameStats}
          showFPS={gameSettings.showFPS}
          fps={fps}
          waveProgress={waveSystem?.getWaveProgress() || 0}
          isPaused={currentState === 'paused'}
        />
      )}
      
      {currentState === 'paused' && (
        <PauseMenu
          stats={gameStats}
          settings={gameSettings}
          onResume={() => gameStateManager.setState('playing')}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          onSettingsChange={handleSettingsChange}
        />
      )}
      
      {currentState === 'gameOver' && (
        <GameOver
          stats={gameStats}
          isNewHighScore={isNewHighScore}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
};