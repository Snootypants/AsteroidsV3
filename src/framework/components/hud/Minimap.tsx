import React, { useRef, useEffect } from 'react';
import { GameState } from '../../hooks/useGameState';
import { WORLD } from '../../constants/gameConstants';
import { EntityManager } from '../../systems/EntityManager';

interface MinimapProps {
  gameState: GameState;
  onUpdateGameState: (updates: Partial<GameState>) => void;
  entityManager?: EntityManager;
}

export const Minimap: React.FC<MinimapProps> = ({
  gameState,
  onUpdateGameState,
  entityManager
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [focused, setFocused] = React.useState(false);

  // Minimap dimensions from vanilla (280x187)
  const MINIMAP_WIDTH = 280;
  const MINIMAP_HEIGHT = 187;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Set up scaling from world coordinates to minimap coordinates
    const scaleX = MINIMAP_WIDTH / WORLD.width;
    const scaleY = MINIMAP_HEIGHT / WORLD.height;

    // Draw world boundary
    ctx.strokeStyle = 'rgba(120, 150, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw entities from EntityManager if available
    if (entityManager) {
      // Draw ships (bright blue triangles)
      const ships = entityManager.entities.ships;
      ships.forEach(ship => {
        if (ship.active) {
          const shipX = ((ship.position.x + WORLD.width / 2) / WORLD.width) * MINIMAP_WIDTH;
          const shipY = ((ship.position.y + WORLD.height / 2) / WORLD.height) * MINIMAP_HEIGHT;
          
          ctx.fillStyle = '#4a90e2';
          ctx.beginPath();
          ctx.arc(shipX, shipY, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw direction indicator
          const angle = ship.rotation;
          const dirLength = 10;
          const dirX = shipX + Math.cos(angle) * dirLength;
          const dirY = shipY + Math.sin(angle) * dirLength;
          
          ctx.strokeStyle = '#4a90e2';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(shipX, shipY);
          ctx.lineTo(dirX, dirY);
          ctx.stroke();
        }
      });
      
      // Draw asteroids (gray dots)
      const asteroids = entityManager.entities.asteroids;
      asteroids.forEach(asteroid => {
        if (asteroid.active) {
          const asteroidX = ((asteroid.position.x + WORLD.width / 2) / WORLD.width) * MINIMAP_WIDTH;
          const asteroidY = ((asteroid.position.y + WORLD.height / 2) / WORLD.height) * MINIMAP_HEIGHT;
          
          ctx.fillStyle = '#888888';
          ctx.beginPath();
          ctx.arc(asteroidX, asteroidY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Draw bullets (small yellow dots)
      const bullets = entityManager.entities.bullets;
      bullets.forEach(bullet => {
        if (bullet.active) {
          const bulletX = ((bullet.position.x + WORLD.width / 2) / WORLD.width) * MINIMAP_WIDTH;
          const bulletY = ((bullet.position.y + WORLD.height / 2) / WORLD.height) * MINIMAP_HEIGHT;
          
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(bulletX, bulletY, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Draw enemies (red triangles)
      const enemies = entityManager.entities.enemies;
      enemies.forEach(enemy => {
        if (enemy.active) {
          const enemyX = ((enemy.position.x + WORLD.width / 2) / WORLD.width) * MINIMAP_WIDTH;
          const enemyY = ((enemy.position.y + WORLD.height / 2) / WORLD.height) * MINIMAP_HEIGHT;
          
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(enemyX, enemyY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Draw pickups (green dots)
      const pickups = entityManager.entities.pickups;
      pickups.forEach(pickup => {
        if (pickup.active) {
          const pickupX = ((pickup.position.x + WORLD.width / 2) / WORLD.width) * MINIMAP_WIDTH;
          const pickupY = ((pickup.position.y + WORLD.height / 2) / WORLD.height) * MINIMAP_HEIGHT;
          
          ctx.fillStyle = '#44ff44';
          ctx.beginPath();
          ctx.arc(pickupX, pickupY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    } else {
      // Fallback to gameState player position when entityManager not available (menu state)
      if (gameState.lives > 0) {
        const playerX = (gameState.player.position.x + WORLD.width / 2) * scaleX;
        const playerY = (gameState.player.position.y + WORLD.height / 2) * scaleY;
        
        ctx.fillStyle = '#4a90e2';
        ctx.beginPath();
        ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player direction indicator
        const angle = gameState.player.rotation;
        const dirLength = 8;
        const dirX = playerX + Math.cos(angle) * dirLength;
        const dirY = playerY + Math.sin(angle) * dirLength;
        
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(playerX, playerY);
        ctx.lineTo(dirX, dirY);
        ctx.stroke();
      }
    }

  }, [gameState.player.position, gameState.player.rotation, gameState.lives, entityManager]);

  const handleMouseEnter = () => {
    setFocused(true);
  };

  const handleMouseLeave = () => {
    setFocused(false);
  };

  const handleClick = () => {
    // Toggle minimap focus/zoom or other functionality
    onUpdateGameState({
      ui: {
        ...gameState.ui,
        minimapFocused: !gameState.ui.minimapFocused
      }
    });
  };

  return (
    <div 
      className={`minimap ${focused ? 'focused' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="minimap-title">TACTICAL MAP</div>
      <canvas
        ref={canvasRef}
        className="minimap-canvas"
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
      />
    </div>
  );
};