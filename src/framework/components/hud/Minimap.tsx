import React, { useRef, useEffect } from 'react';
import { GameState } from '../../hooks/useGameState';
import { WORLD } from '../../constants/gameConstants';

interface MinimapProps {
  gameState: GameState;
  onUpdateGameState: (updates: Partial<GameState>) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  gameState,
  onUpdateGameState
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

    // Draw player position (if alive)
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

    // TODO: Draw asteroids, enemies, pickups, etc. when entity systems are connected
    // This would require access to the entity pools and their positions

  }, [gameState.player.position, gameState.player.rotation, gameState.lives]);

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