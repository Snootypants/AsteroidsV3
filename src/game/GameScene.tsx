import { useEffect, useRef } from 'react';
import { GameStateHook } from '../framework/hooks/useGameState';
import { ThreeSceneHook } from '../framework/hooks/useThreeScene';

interface GameSceneProps {
  gameState: GameStateHook;
  threeScene: ThreeSceneHook;
}

const GameScene: React.FC<GameSceneProps> = ({ gameState, threeScene }) => {
  const frameId = useRef<number>();
  const lastTime = useRef(performance.now() / 1000);
  
  // Main game loop
  useEffect(() => {
    const gameLoop = () => {
      const now = performance.now() / 1000;
      const deltaTime = Math.min(now - lastTime.current, 0.033); // Clamp to 30fps minimum
      lastTime.current = now;
      
      // Update Three.js scene effects (warp, camera shake, etc.)
      threeScene.update(deltaTime, {
        paused: gameState.state.paused,
        gameOver: gameState.state.gameOver
      });
      
      // Game logic updates would go here
      if (gameState.state.started && !gameState.state.paused && !gameState.state.gameOver) {
        // Update invulnerability timer
        if (gameState.state.invuln > 0) {
          gameState.decrementInvuln(deltaTime);
        }
        
        // Update combo timer
        if (gameState.state.comboTimer > 0) {
          gameState.decrementComboTimer(deltaTime);
        }
        
        // TODO: Update entities (bullets, asteroids, enemies, etc.)
        // TODO: Check collisions
        // TODO: Update pickups
        // TODO: Check wave completion
      }
      
      // Render frame
      if (threeScene.sceneRefs.current) {
        const { composer } = threeScene.sceneRefs.current;
        composer.render();
      }
      
      frameId.current = requestAnimationFrame(gameLoop);
    };
    
    frameId.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, [gameState, threeScene]);
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // Start game with R key (for testing)
      if (key === 'r') {
        if (!gameState.state.started) {
          gameState.startGame();
          console.log('[GameScene] Game started via R key');
        } else {
          gameState.resetGame();
          console.log('[GameScene] Game reset via R key');
        }
        e.preventDefault();
      }
      
      // Pause with Escape
      if (key === 'escape' && gameState.state.started && !gameState.state.gameOver) {
        gameState.pauseGame();
        e.preventDefault();
      }
      
      // Zoom controls (Q = zoom in, A = zoom out)
      if (key === 'q') {
        const newZoom = Math.min(1.8, gameState.state.currentZoom + 0.1);
        gameState.setZoom(newZoom);
        threeScene.updateZoom(newZoom);
        e.preventDefault();
      }
      if (key === 'a') {
        const newZoom = Math.max(0.6, gameState.state.currentZoom - 0.1);
        gameState.setZoom(newZoom);
        threeScene.updateZoom(newZoom);
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, threeScene]);
  
  // This component doesn't render any UI - it just manages the game logic
  return null;
};

export default GameScene;