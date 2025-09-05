import React, { useRef, useEffect } from 'react';
import { GameState } from '../../hooks/useGameState';
import { WORLD } from '../../constants/gameConstants';
import { EntityManager } from '../../systems/EntityManager';

interface ViewportInfo {
  cx: number;
  cy: number;
  camW: number;
  camH: number;
}

interface MinimapProps {
  gameState: GameState;
  onUpdateGameState: (updates: Partial<GameState>) => void;
  entityManager?: EntityManager;
  viewport?: ViewportInfo;
}

export const Minimap: React.FC<MinimapProps> = ({
  gameState,
  onUpdateGameState,
  entityManager,
  viewport
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [focused, setFocused] = React.useState(false);

  // Minimap dimensions from vanilla (280x187)
  const MINIMAP_WIDTH = 280;
  const MINIMAP_HEIGHT = 187;
  
  // Helper function to convert world coordinates to minimap pixels
  const worldToMinimap = (x: number, y: number) => {
    const nx = (x + WORLD.width / 2) / WORLD.width;
    const ny = 1 - (y + WORLD.height / 2) / WORLD.height; // Flip Y axis
    const px = nx * MINIMAP_WIDTH;
    const py = ny * MINIMAP_HEIGHT;
    
    // Clamp within minimap bounds
    return {
      x: Math.max(0, Math.min(MINIMAP_WIDTH, px)),
      y: Math.max(0, Math.min(MINIMAP_HEIGHT, py))
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);


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
          const pos = worldToMinimap(ship.position.x, ship.position.y);
          
          ctx.fillStyle = '#4a90e2';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw direction indicator
          const angle = ship.rotation;
          const dirLength = 10;
          const dirX = pos.x + Math.cos(angle) * dirLength;
          const dirY = pos.y + Math.sin(angle) * dirLength;
          
          ctx.strokeStyle = '#4a90e2';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(dirX, dirY);
          ctx.stroke();
        }
      });
      
      // Draw asteroids (gray dots)
      const asteroids = entityManager.entities.asteroids;
      asteroids.forEach(asteroid => {
        if (asteroid.active) {
          const pos = worldToMinimap(asteroid.position.x, asteroid.position.y);
          
          ctx.fillStyle = '#888888';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Draw bullets (small yellow dots)
      const bullets = entityManager.entities.bullets;
      bullets.forEach(bullet => {
        if (bullet.active) {
          const pos = worldToMinimap(bullet.position.x, bullet.position.y);
          
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Draw enemies (red triangles)
      const enemies = entityManager.entities.enemies;
      enemies.forEach(enemy => {
        if (enemy.active) {
          const pos = worldToMinimap(enemy.position.x, enemy.position.y);
          
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Draw pickups (green dots)
      const pickups = entityManager.entities.pickups;
      pickups.forEach(pickup => {
        if (pickup.active) {
          const pos = worldToMinimap(pickup.position.x, pickup.position.y);
          
          ctx.fillStyle = '#44ff44';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    } else {
      // Fallback to gameState player position when entityManager not available (menu state)
      if (gameState.lives > 0) {
        const pos = worldToMinimap(gameState.player.position.x, gameState.player.position.y);
        
        ctx.fillStyle = '#4a90e2';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player direction indicator
        const angle = gameState.player.rotation;
        const dirLength = 8;
        const dirX = pos.x + Math.cos(angle) * dirLength;
        const dirY = pos.y + Math.sin(angle) * dirLength;
        
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(dirX, dirY);
        ctx.stroke();
      }
    }

    // Draw viewport rectangle if viewport info is available
    if (viewport) {
      const topLeft = worldToMinimap(
        viewport.cx - viewport.camW / 2,
        viewport.cy + viewport.camH / 2 // Remember Y is flipped
      );
      const bottomRight = worldToMinimap(
        viewport.cx + viewport.camW / 2,
        viewport.cy - viewport.camH / 2
      );
      
      const rectWidth = bottomRight.x - topLeft.x;
      const rectHeight = bottomRight.y - topLeft.y;
      
      ctx.strokeStyle = 'rgba(120, 150, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(topLeft.x, topLeft.y, rectWidth, rectHeight);
    }

  }, [gameState.player.position, gameState.player.rotation, gameState.lives, entityManager, viewport]);

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