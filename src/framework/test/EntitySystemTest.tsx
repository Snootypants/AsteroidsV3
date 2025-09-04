import React, { useRef, useEffect, useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useThreeScene } from '../hooks/useThreeScene';
import { EntityManager } from '../systems/EntityManager';
import { useGameLoop } from '../game/GameLoop';
import { Ship } from '../entities/Ship';

/**
 * Entity System Integration Test Component
 * 
 * Tests the basic entity system functionality:
 * - Ship spawning and movement
 * - Asteroid spawning and drifting
 * - Bullet firing
 * - World wrapping
 * - Basic game loop
 */
export const EntitySystemTest: React.FC = () => {
  const gameStateHook = useGameState();
  const threeScene = useThreeScene();
  const [entityManager, setEntityManager] = useState<EntityManager | null>(null);
  const [ship, setShip] = useState<Ship | null>(null);
  
  // Input state
  const keysPressed = useRef<Set<string>>(new Set());
  const mousePos = useRef({ x: 0, y: 0 });

  // Initialize entity manager when scene is ready
  useEffect(() => {
    if (threeScene.sceneRefs.current?.scene && !entityManager) {
      console.log('[EntitySystemTest] Initializing EntityManager...');
      const em = new EntityManager(threeScene.sceneRefs.current.scene);
      console.log('[EntitySystemTest] EntityManager created:', em);
      setEntityManager(em);
    }
  }, [threeScene.sceneRefs, entityManager]);

  // Initialize game loop
  const gameLoopHook = useGameLoop(
    entityManager!,
    gameStateHook.state,
    {
      onUpdate: (dt: number) => {
        if (!ship || !entityManager) return;

        // Update ship controls
        updateShipControls(ship, dt);
        
        // Handle shooting
        handleShooting(ship, entityManager);
      },
      onRender: () => {
        const sceneRefs = threeScene.sceneRefs.current;
        if (sceneRefs) {
          // Update camera to follow ship
          if (ship) {
            sceneRefs.camera.position.x = ship.position.x;
            sceneRefs.camera.position.y = ship.position.y;
          }
          
          sceneRefs.renderer.render(sceneRefs.scene, sceneRefs.camera);
        }
      }
    }
  );

  // Setup input handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.current.add(event.code);
      
      if (event.code === 'Space') {
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.code);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (threeScene.mountRef.current) {
        const rect = threeScene.mountRef.current.getBoundingClientRect();
        mousePos.current.x = event.clientX - rect.left;
        mousePos.current.y = event.clientY - rect.top;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // The renderer is already handled by useThreeScene hook via mountRef
  // No need to manually append it again

  // Spawn initial entities
  const handleSpawnShip = () => {
    if (entityManager) {
      console.log('[EntitySystemTest] Spawning ship...');
      const newShip = entityManager.spawnShip(0, 0);
      console.log('[EntitySystemTest] Ship spawned:', newShip);
      setShip(newShip);
      
      // Start game loop
      console.log('[EntitySystemTest] Starting game loop...');
      gameLoopHook.start();
    } else {
      console.warn('[EntitySystemTest] Cannot spawn ship - entityManager not ready');
    }
  };

  const handleSpawnAsteroid = () => {
    if (entityManager) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 100;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      console.log('[EntitySystemTest] Spawning asteroid at:', x, y);
      const asteroid = entityManager.spawnAsteroid('large', x, y, 
        (Math.random() - 0.5) * 20, 
        (Math.random() - 0.5) * 20
      );
      console.log('[EntitySystemTest] Asteroid spawned:', asteroid);
    } else {
      console.warn('[EntitySystemTest] Cannot spawn asteroid - entityManager not ready');
    }
  };

  const handleClearAll = () => {
    if (entityManager) {
      entityManager.clearAll();
      setShip(null);
      gameLoopHook.stop();
    }
  };

  // Ship control logic
  const updateShipControls = (ship: Ship, _dt: number) => {
    // WASD movement
    const thrust = keysPressed.current.has('KeyW') || keysPressed.current.has('KeyS');
    ship.setThrusting(thrust);

    // Mouse rotation
    const sceneRefs = threeScene.sceneRefs.current;
    if (sceneRefs) {
      // Convert mouse position to world coordinates
      const canvas = sceneRefs.renderer.domElement;
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((mousePos.current.x - rect.width / 2) / rect.width) * 2;
      const mouseY = -((mousePos.current.y - rect.height / 2) / rect.height) * 2;
      
      // Calculate angle from ship to mouse
      const angle = Math.atan2(mouseX, mouseY);
      ship.setTargetRotation(angle);
    }
  };

  const handleShooting = (ship: Ship, entityManager: EntityManager) => {
    // Shoot with space or mouse click
    if (keysPressed.current.has('Space')) {
      // Simple shooting - would need rate limiting in real implementation
      if (Math.random() > 0.95) { // Rough rate limiting
        const direction = ship.rotation + Math.PI / 2; // Ship faces up
        entityManager.spawnBullet(
          ship.position.x,
          ship.position.y,
          direction,
          ship.velocity.x * 0.1,
          ship.velocity.y * 0.1
        );
      }
    }
  };

  const debugInfo = entityManager?.getDebugInfo();
  const perfMetrics = gameLoopHook.getPerformanceMetrics();
  const collisionInfo = gameLoopHook.getCollisionSystem?.()?.getDebugInfo();

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'radial-gradient(1200px 800px at 50% 50%, #04040a, #020208 60%, #000 100%)',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    }}>
      {/* Three.js Container */}
      <div 
        ref={threeScene.mountRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%'
        }}
      />

      {/* Test Controls */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '20px',
        borderRadius: '8px',
        color: 'white'
      }}>
        <h3 style={{ margin: 0, color: '#4a90e2' }}>Entity System Test</h3>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSpawnShip}
            disabled={!!ship}
            style={{
              padding: '8px 16px',
              background: ship ? '#555' : '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: ship ? 'not-allowed' : 'pointer'
            }}
          >
            Spawn Ship
          </button>
          
          <button 
            onClick={handleSpawnAsteroid}
            disabled={!entityManager}
            style={{
              padding: '8px 16px',
              background: entityManager ? '#e24a4a' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: entityManager ? 'pointer' : 'not-allowed'
            }}
          >
            Spawn Asteroid
          </button>
          
          <button 
            onClick={handleClearAll}
            style={{
              padding: '8px 16px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            <div><strong>Active Entities:</strong></div>
            <div>Ships: {debugInfo.active.ships}</div>
            <div>Asteroids: {debugInfo.active.asteroids}</div>
            <div>Bullets: {debugInfo.active.bullets}</div>
            <div>Total: {debugInfo.active.total}</div>
            
            <div style={{ marginTop: '10px' }}><strong>Performance:</strong></div>
            <div>FPS: {perfMetrics.fps.toFixed(1)}</div>
            <div>Frame Time: {perfMetrics.frameTime.toFixed(1)}ms</div>
            
            {collisionInfo && (
              <div style={{ marginTop: '10px' }}>
                <div><strong>Collision System:</strong></div>
                <div>Grid Cells: {collisionInfo.gridCells}</div>
                <div>Grid Entities: {collisionInfo.totalEntitiesInGrid}</div>
              </div>
            )}
            
            <div style={{ marginTop: '10px' }}><strong>Entity Pools:</strong></div>
            <div>Ships: {debugInfo.pools.ships}</div>
            <div>Asteroids: {debugInfo.pools.asteroids}</div>
            <div>Bullets: {debugInfo.pools.bullets}</div>
          </div>
        )}

        <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '10px' }}>
          <div><strong>Controls:</strong></div>
          <div>• W/S: Thrust</div>
          <div>• Mouse: Aim</div>
          <div>• Space: Shoot</div>
          <div></div>
          <div><strong>Combat Features:</strong></div>
          <div>• Bullets destroy asteroids</div>
          <div>• Large asteroids split into medium</div>
          <div>• Medium asteroids split into small</div>
          <div>• Ship-asteroid collisions cause knockback</div>
        </div>
      </div>

      {/* Game Status */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px'
      }}>
        <div>Game Loop: {gameLoopHook.isRunning() ? '🟢 Running' : '🔴 Stopped'}</div>
        <div>Ship: {ship ? '✅ Active' : '❌ None'}</div>
        <div>Entity Manager: {entityManager ? '✅ Ready' : '❌ Loading'}</div>
      </div>
    </div>
  );
};