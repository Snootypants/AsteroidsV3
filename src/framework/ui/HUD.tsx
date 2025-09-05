import React from 'react';
import { GameStats } from '../systems/GameStateManager';
import { EntityManager } from '../systems/EntityManager';
import { Minimap } from '../components/hud/Minimap';

export interface HUDProps {
  stats: GameStats;
  showFPS?: boolean;
  fps?: number;
  waveProgress?: number; // 0-1 percentage of wave completion
  isPaused?: boolean;
  className?: string;
  entityManager?: EntityManager;
  minimapOpacity?: number;
}

/**
 * Heads-Up Display component showing real-time game information
 * Displays score, lives, wave info, and other game statistics
 */
export const HUD: React.FC<HUDProps> = ({
  stats,
  showFPS = false,
  fps = 0,
  waveProgress = 0,
  isPaused = false,
  className = '',
  entityManager,
  minimapOpacity = 1.0
}) => {
  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };
  
  const formatPercentage = (ratio: number): string => {
    return `${Math.round(ratio * 100)}%`;
  };
  
  const getComboColor = (combo: number): string => {
    if (combo >= 20) return 'text-purple-400';
    if (combo >= 12) return 'text-red-400';
    if (combo >= 8) return 'text-orange-400';
    if (combo >= 5) return 'text-yellow-400';
    if (combo >= 3) return 'text-green-400';
    if (combo >= 2) return 'text-blue-400';
    return 'text-white';
  };
  
  const getMultiplierText = (combo: number): string => {
    if (combo === 0) return '1x';
    if (combo < 2) return '2x';
    if (combo < 3) return '3x';
    if (combo < 5) return '4x';
    if (combo < 8) return '5x';
    if (combo < 12) return '6x';
    if (combo < 20) return '7x';
    if (combo < 30) return '8x';
    return '9x';
  };
  
  return (
    <div className={`fixed inset-0 pointer-events-none z-10 ${className}`}>
      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center pointer-events-auto">
          <div className="text-center">
            <h2 className="text-6xl font-bold text-white mb-4 font-mono">PAUSED</h2>
            <p className="text-xl text-gray-300 font-mono">Press ESC to resume</p>
          </div>
        </div>
      )}
      
      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4 flex justify-between items-center font-mono">
        {/* Left Side - Score and Combo */}
        <div className="flex items-center space-x-8">
          <div>
            <div className="text-sm text-gray-300">SCORE</div>
            <div className="text-2xl font-bold">{formatScore(stats.score)}</div>
          </div>
          
          {stats.combo > 0 && (
            <div className={`${getComboColor(stats.combo)} pulse-glow`}>
              <div className="text-sm">COMBO</div>
              <div className="text-xl font-bold">
                {stats.combo} • {getMultiplierText(stats.combo)}
              </div>
            </div>
          )}
          
          <div>
            <div className="text-sm text-gray-300">HIGH SCORE</div>
            <div className="text-lg text-yellow-400">{formatScore(stats.highScore)}</div>
          </div>
        </div>
        
        {/* Center - Wave Information */}
        <div className="text-center">
          <div className="text-sm text-gray-300">WAVE</div>
          <div className="text-3xl font-bold text-cyan-400">{stats.wave}</div>
          
          {/* Wave Progress Bar */}
          {waveProgress > 0 && waveProgress < 1 && (
            <div className="mt-2 w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${waveProgress * 100}%` }}
              />
            </div>
          )}
        </div>
        
        {/* Right Side - Lives and Stats */}
        <div className="flex items-center space-x-6">
          <div>
            <div className="text-sm text-gray-300">ACCURACY</div>
            <div className="text-lg text-green-400">{formatPercentage(stats.accuracy)}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-300">LIVES</div>
            <div className="flex space-x-1 mt-1">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 ${
                    i < stats.lives 
                      ? 'bg-red-500' 
                      : 'bg-gray-600'
                  } transform rotate-45`}
                  style={{
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Left - Statistics */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg font-mono text-sm">
        <div className="space-y-1">
          <div className="flex justify-between w-40">
            <span className="text-gray-300">Enemies:</span>
            <span className="text-red-400">{stats.enemiesDestroyed}</span>
          </div>
          <div className="flex justify-between w-40">
            <span className="text-gray-300">Asteroids:</span>
            <span className="text-blue-400">{stats.asteroidsDestroyed}</span>
          </div>
          <div className="flex justify-between w-40">
            <span className="text-gray-300">Pickups:</span>
            <span className="text-green-400">{stats.pickupsCollected}</span>
          </div>
          <div className="flex justify-between w-40">
            <span className="text-gray-300">Perfect Waves:</span>
            <span className="text-yellow-400">{stats.perfectWaves}</span>
          </div>
        </div>
      </div>
      
      {/* Bottom Right - Time and FPS */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg font-mono text-sm">
        <div className="space-y-1 text-right">
          <div>
            <span className="text-gray-300">Time: </span>
            <span className="text-cyan-400">{formatTime(stats.timeAlive)}</span>
          </div>
          
          {showFPS && (
            <div>
              <span className="text-gray-300">FPS: </span>
              <span className={fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
                {Math.round(fps)}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Minimap - Bottom Center */}
      {entityManager && (
        <div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          style={{ opacity: minimapOpacity }}
        >
          <Minimap 
            gameState={{
              player: {
                position: { x: 0, y: 0 }, // Will be updated from actual ship position
                rotation: 0
              },
              lives: stats.lives,
              ui: {
                minimapFocused: false
              }
            }}
            onUpdateGameState={() => {}}
            entityManager={entityManager}
            viewport={{
              centerX: 0, // Will be updated from camera position
              centerY: 0,
              width: 150, // Approximate visible area
              height: 100
            }}
          />
        </div>
      )}
      
      {/* Power-up Status (if active) */}
      {/* This would be expanded based on active power-ups */}
      <div className="absolute top-20 right-4 space-y-2">
        {/* Example power-up indicators - would be dynamic */}
        {/* {activePowerups.map(powerup => (
          <div key={powerup.type} className="bg-purple-600 bg-opacity-80 text-white px-3 py-1 rounded-lg font-mono text-sm">
            <div className="flex justify-between items-center w-32">
              <span>{powerup.name}</span>
              <span>{Math.ceil(powerup.timeLeft)}s</span>
            </div>
            <div className="w-full h-1 bg-purple-800 mt-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-400 transition-all duration-100"
                style={{ width: `${(powerup.timeLeft / powerup.duration) * 100}%` }}
              />
            </div>
          </div>
        ))} */}
      </div>
    </div>
  );
};

/**
 * Format time in MM:SS or HH:MM:SS format
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}