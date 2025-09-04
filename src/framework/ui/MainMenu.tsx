import React, { useState, useEffect } from 'react';
import { GameSettings } from '../systems/GameStateManager';

export interface MainMenuProps {
  highScore: number;
  settings: GameSettings;
  onStartGame: () => void;
  onShowHighScores: () => void;
  onShowSettings: () => void;
  onSettingsChange: (settings: Partial<GameSettings>) => void;
  className?: string;
}

/**
 * Main menu component with game start, settings, and high scores
 * Features animated background and modern UI design
 */
export const MainMenu: React.FC<MainMenuProps> = ({
  highScore,
  settings,
  onStartGame,
  onShowHighScores,
  onShowSettings,
  onSettingsChange,
  className = ''
}) => {
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // Animated title effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(phase => (phase + 1) % 4);
    }, 800);
    
    return () => clearInterval(interval);
  }, []);
  
  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };
  
  const getAnimatedTitle = (): string => {
    const phases = ['ASTEROIDS', 'ASTEROIDS.', 'ASTEROIDS..', 'ASTEROIDS...'];
    return phases[animationPhase];
  };
  
  return (
    <div className={`fixed inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center text-white ${className}`}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-8xl font-bold font-mono text-cyan-400 tracking-wider">
            {getAnimatedTitle()}
          </h1>
          <div className="text-xl text-gray-400 font-mono">
            A Modern Space Adventure
          </div>
        </div>
        
        {/* High Score Display */}
        {highScore > 0 && (
          <div className="bg-black bg-opacity-50 px-8 py-4 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 uppercase tracking-wide">High Score</div>
            <div className="text-3xl font-bold text-yellow-400 font-mono">
              {formatScore(highScore)}
            </div>
          </div>
        )}
        
        {/* Main Menu Buttons */}
        <div className="space-y-4">
          <button
            onClick={onStartGame}
            className="w-64 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xl rounded-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/50 font-mono uppercase tracking-wider"
          >
            Start Game
          </button>
          
          <button
            onClick={onShowHighScores}
            className="w-64 px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transform transition-all duration-200 hover:scale-105 font-mono uppercase tracking-wider"
          >
            High Scores
          </button>
          
          <button
            onClick={() => setShowQuickSettings(!showQuickSettings)}
            className="w-64 px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transform transition-all duration-200 hover:scale-105 font-mono uppercase tracking-wider"
          >
            {showQuickSettings ? 'Hide Settings' : 'Quick Settings'}
          </button>
          
          <button
            onClick={onShowSettings}
            className="w-64 px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transform transition-all duration-200 hover:scale-105 font-mono uppercase tracking-wider"
          >
            Advanced Settings
          </button>
        </div>
        
        {/* Quick Settings Panel */}
        {showQuickSettings && (
          <div className="bg-black bg-opacity-70 p-6 rounded-lg border border-gray-700 space-y-4 w-80">
            <h3 className="text-lg font-bold text-center text-cyan-400 font-mono uppercase">
              Quick Settings
            </h3>
            
            {/* Master Volume */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-300 font-mono">Master Volume</label>
                <span className="text-cyan-400 font-mono">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.masterVolume}
                onChange={(e) => onSettingsChange({ masterVolume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            {/* SFX Volume */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-300 font-mono">SFX Volume</label>
                <span className="text-cyan-400 font-mono">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.sfxVolume}
                onChange={(e) => onSettingsChange({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-300 font-mono">Show FPS</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.showFPS}
                    onChange={(e) => onSettingsChange({ showFPS: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${settings.showFPS ? 'bg-cyan-600' : 'bg-gray-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full mt-1 ml-1 transition-transform ${settings.showFPS ? 'transform translate-x-4' : ''}`} />
                  </div>
                </div>
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-300 font-mono">Screen Shake</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.screenShake}
                    onChange={(e) => onSettingsChange({ screenShake: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${settings.screenShake ? 'bg-cyan-600' : 'bg-gray-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full mt-1 ml-1 transition-transform ${settings.screenShake ? 'transform translate-x-4' : ''}`} />
                  </div>
                </div>
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-300 font-mono">Auto-Fire</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.autofire}
                    onChange={(e) => onSettingsChange({ autofire: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${settings.autofire ? 'bg-cyan-600' : 'bg-gray-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full mt-1 ml-1 transition-transform ${settings.autofire ? 'transform translate-x-4' : ''}`} />
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}
        
        {/* Credits */}
        <div className="text-center text-gray-500 text-sm font-mono space-y-1">
          <div>Built with React, Three.js & TypeScript</div>
          <div>Use WASD to move, Space to shoot, ESC to pause</div>
        </div>
      </div>
      
      {/* Custom CSS for sliders */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};