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
import { HangarScreen } from '../components/overlays/HangarScreen';

/**
 * Complete Asteroids Game Component
 * Integrates all systems for a fully playable experience
 */
export const Game: React.FC = () => {
  // Three.js scene setup
  const threeScene = useThreeScene();
  
  // Game systems
  const [gameStateManager] = useState(() => new GameStateManager());
  const [entityManager, setEntityManager] = useState<EntityManager | null>(null);
  
  // Currency tracking (temporary until integrated with main game state)
  const [currencies, setCurrencies] = useState({
    salvage: 0,
    gold: 0,
    platinum: 0,
    adamantium: 0
  });
  
  // Currency collection callback
  const handleCurrencyCollected = useCallback((type: string, amount: number) => {
    setCurrencies(prev => ({
      ...prev,
      [type]: (prev[type as keyof typeof prev] || 0) + amount
    }));
    
    // Also update pickup count in game stats
    gameStateManager.updateStats({
      pickupsCollected: gameStateManager.getStats().pickupsCollected + 1
    });
  }, [gameStateManager]);
  
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
  const [systemsReady, setSystemsReady] = useState(false);
  
  // Game entities
  const [ship, setShip] = useState<Ship | null>(null);
  
  // Input handling
  const keysPressed = useRef<Set<string>>(new Set());
  const mousePos = useRef({ x: 0, y: 0 });
  const mousePressed = useRef<Set<number>>(new Set()); // Track mouse button states
  
  // Minimap state
  const [minimapOpacity, setMinimapOpacity] = useState(1.0);
  
  // Performance monitoring
  const [fps, setFps] = useState(60);
  const fpsCounter = useRef({ frames: 0, lastTime: 0 });
  
  // Game loop
  const gameLoopRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // Log initial state
  useEffect(() => {
    console.log('[Complete Game] Initial state:', currentState);
  }, []);

  // Initialize systems when scene is ready
  useEffect(() => {
    if (!threeScene.sceneRefs.current?.scene || !threeScene.sceneRefs.current?.camera) {
      console.log('[Complete Game] Waiting for scene to be ready...');
      return;
    }
    
    console.log('[Complete Game] Initializing systems...');
    const scene = threeScene.sceneRefs.current.scene;
    const camera = threeScene.sceneRefs.current.camera;
    
    // Initialize all systems
    const em = new EntityManager(scene);
    const am = new AudioManager();
    const ps = new ParticleSystem(scene);
    const vm = new VFXManager(camera, scene);
    const ds = new DebrisSystem(scene);
    const cs = new CollisionSystem(em, am, ps, vm, ds, handleCurrencyCollected);
    const ss = new ScoringSystem(ps);
    const ws = new WaveSystem(em, am, ps, vm);
    
    console.log('[Complete Game] Systems created - EntityManager:', em);
    
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
      console.log(`[Complete Game] Game state changed: ${from} → ${to}`);
      setCurrentState(to);
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
    
    ws.onOpenHangarCallback(() => {
      // Open hangar and pause gameplay
      gameStateManager.setState('hangar');
    });
    
    // Systems are now ready
    setSystemsReady(true);
    console.log('[Complete Game] Systems ready');
    
    return () => {
      // Cleanup systems
      ps.dispose();
      vm.dispose();
      ds.dispose();
    };
  }, [threeScene.sceneRefs, gameStateManager, gameStats.perfectWaves]);
  
  // Continuous render loop for starfield and background
  useEffect(() => {
    let rafId = 0;
    let last = performance.now();
    const renderLoop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const refs = threeScene.sceneRefs.current;
      if (refs) {
        threeScene.update(dt, {
          paused: currentState === 'paused',
          gameOver: currentState === 'gameOver',
        });
        refs.composer?.render(); // ensure visible background
      }
      rafId = requestAnimationFrame(renderLoop);
    };
    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, [threeScene, currentState]);
  
  // Game loop (only when playing)
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
      
      // Prevent Space from scrolling page
      if (e.code === 'Space') {
        e.preventDefault();
      }
      
      // Handle pause
      if (e.code === gameSettings.controls.pause) {
        e.preventDefault();
        if (currentState === 'playing') {
          gameStateManager.setState('paused');
        } else if (currentState === 'paused') {
          gameStateManager.setState('playing');
        }
      }
      
      // Handle minimap toggle (Tab key only during gameplay)
      if (e.code === 'Tab' && currentState === 'playing') {
        e.preventDefault();
        setMinimapOpacity(prev => prev === 1.0 ? 0.1 : 1.0);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!threeScene.mountRef.current) return;
      const rect = threeScene.mountRef.current.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: rect.height / 2 - (e.clientY - rect.top)
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Only handle left click (button 0) during gameplay to avoid UI conflicts
      if (e.button === 0 && currentState === 'playing') {
        e.preventDefault();
        mousePressed.current.add(0);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      mousePressed.current.delete(e.button);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [currentState, gameSettings.controls.pause, gameStateManager]);
  
  // Ship controls
  const updateShipControls = (ship: Ship, deltaTime: number) => {
    const isForward = keysPressed.current.has(gameSettings.controls.forward);
    const isBackward = keysPressed.current.has(gameSettings.controls.backward);
    const isLeft = keysPressed.current.has(gameSettings.controls.left);
    const isRight = keysPressed.current.has(gameSettings.controls.right);
    
    ship.setThrusting(isForward);
    ship.setThrustingReverse(isBackward);
    
    // Handle rotation: A/D keys override mouse aiming
    if (isLeft || isRight) {
      // Keyboard rotation takes priority
      ship.setRotating(isLeft ? -1 : isRight ? 1 : 0);
    } else if (threeScene.mountRef.current && threeScene.sceneRefs.current) {
      // Mouse aiming when no rotation keys pressed
      const rect = threeScene.mountRef.current.getBoundingClientRect();
      const normalizedX = (mousePos.current.x / rect.width) * 2 - 1;
      const normalizedY = -((mousePos.current.y / rect.height) * 2 - 1);
      const camera = threeScene.sceneRefs.current.camera;
      const worldX = normalizedX * (camera.right - camera.left) / 2 + camera.position.x;
      const worldY = normalizedY * (camera.top - camera.bottom) / 2 + camera.position.y;
      const dx = worldX - ship.position.x;
      const dy = worldY - ship.position.y;
      ship.setTargetRotation(Math.atan2(dx, dy));
      ship.setRotating(0);
    }
    
    ship.update(deltaTime);
    
    // Update thruster sound
    if (isForward && audioManager) {
      // Would play thruster sound
    }
  };
  
  // Shooting
  const handleShooting = (ship: Ship, entityManager: EntityManager) => {
    const isShooting = gameSettings.autofire || 
                     keysPressed.current.has(gameSettings.controls.shoot) ||
                     mousePressed.current.has(0); // Left click
    
    if (isShooting && ship.canShoot()) {
      const bullet = ship.shoot();
      if (bullet && entityManager) {
        entityManager.addExistingEntity(bullet, 'bullets');
        bullet.spawn(threeScene.sceneRefs.current!.scene);
        console.log('[Complete Game] Bullet spawned:', bullet.position);
        
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
    console.log('[Complete Game] Starting game...');
    
    if (!systemsReady) {
      console.warn('[Complete Game] Start blocked: systems not ready');
      return;
    }
    
    console.log('[Complete Game] EntityManager:', entityManager);
    console.log('[Complete Game] Scene:', threeScene.sceneRefs.current?.scene);
    
    if (!entityManager || !threeScene.sceneRefs.current?.scene) {
      console.warn('[Complete Game] Cannot start - missing entityManager or scene');
      return;
    }
    
    // Create and spawn ship
    console.log('[Complete Game] Creating ship...');
    const newShip = new Ship();
    newShip.spawn(threeScene.sceneRefs.current.scene);
    entityManager.addExistingEntity(newShip, 'ships');
    setShip(newShip);
    console.log('[Complete Game] Ship spawned:', newShip);
    
    // Set camera to follow ship
    threeScene.setCameraFollow(newShip.mesh!);
    console.log('[Complete Game] Camera following ship');
    
    // Start first wave
    console.log('[Complete Game] Starting first wave...');
    waveSystem?.startWave();
    
    // Set game state to playing
    console.log('[Complete Game] Setting state to playing...');
    gameStateManager.setState('playing');
  }, [systemsReady, entityManager, threeScene.sceneRefs, waveSystem, gameStateManager]);
  
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
  
  const handleExitHangar = useCallback(() => {
    // Exit hangar and start next wave
    gameStateManager.setState('playing');
    waveSystem?.startWave();
  }, [gameStateManager, waveSystem]);
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Three.js Canvas Container */}
      <div className="absolute inset-0" style={{ zIndex: 0 }} ref={threeScene.mountRef}>
        {/* Canvas will be mounted by Three.js hook */}
      </div>
      
      {/* UI Overlays */}
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {currentState === 'menu' && (
          <MainMenu
            highScore={gameStats.highScore}
            settings={gameSettings}
            systemsReady={systemsReady}
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
            entityManager={entityManager}
            minimapOpacity={minimapOpacity}
          />
        )}
        
        {/* Temporary currency display */}
        {(currentState === 'playing' || currentState === 'paused') && (
          <div style={{
            position: 'absolute',
            top: '80px',
            right: '20px',
            background: 'rgba(0,0,0,0.8)',
            padding: '10px',
            borderRadius: '5px',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            <div style={{color: '#00ff88'}}>Salvage: {currencies.salvage}</div>
            <div style={{color: '#ffd700'}}>Gold: {currencies.gold}</div>
            <div style={{color: '#e5e4e2'}}>Platinum: {currencies.platinum}</div>
            <div style={{color: '#9966cc'}}>Adamantium: {currencies.adamantium}</div>
          </div>
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
        
        {currentState === 'hangar' && (
          <HangarScreen
            onClose={handleExitHangar}
          />
        )}
      </div>
    </div>
  );
};