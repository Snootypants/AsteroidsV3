import React, { useState } from 'react';
import { GameSettings, GameStats } from '../systems/GameStateManager';

export interface PauseMenuProps {
  stats: GameStats;
  settings: GameSettings;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onSettingsChange: (settings: Partial<GameSettings>) => void;
  className?: string;
}

/**
 * Pause menu component with resume, restart, settings, and quit options
 * Appears as overlay during gameplay pause
 */
export const PauseMenu: React.FC<PauseMenuProps> = ({
  stats,
  settings,
  onResume,
  onRestart,
  onMainMenu,
  onSettingsChange,
  className = ''
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  
  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleRestart = () => {
    if (confirmRestart) {
      onRestart();
    } else {
      setConfirmRestart(true);
      setTimeout(() => setConfirmRestart(false), 3000);
    }
  };
  
  const handleQuit = () => {
    if (confirmQuit) {
      onMainMenu();
    } else {
      setConfirmQuit(true);
      setTimeout(() => setConfirmQuit(false), 3000);
    }
  };
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center text-white z-50 ${className}`}>
      <div className="bg-gray-900 bg-opacity-95 p-8 rounded-lg border border-gray-700 max-w-md w-full mx-4">
        {/* Pause Title */}
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold font-mono text-cyan-400 tracking-wider mb-2">
            PAUSED
          </h2>
          <div className="text-gray-400 font-mono">Game is temporarily suspended</div>
        </div>
        
        {/* Current Game Stats */}
        <div className="bg-black bg-opacity-50 p-4 rounded-lg mb-6 space-y-2 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Score:</span>
            <span className="text-cyan-400">{formatScore(stats.score)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Wave:</span>
            <span className="text-green-400">{stats.wave}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Lives:</span>
            <span className="text-red-400">{stats.lives}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Time:</span>
            <span className="text-blue-400">{formatTime(stats.timeAlive)}</span>
          </div>
        </div>
        
        {!showSettings ? (
          /* Main Menu */
          <div className="space-y-4">
            <button
              onClick={onResume}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transform transition-all duration-200 hover:scale-105 font-mono uppercase tracking-wider"
            >
              Resume Game
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transform transition-all duration-200 hover:scale-105 font-mono uppercase tracking-wider"
            >
              Settings
            </button>
            
            <button
              onClick={handleRestart}
              className={`w-full px-6 py-3 font-bold rounded-lg transform transition-all duration-200 hover:scale-105 font-mono uppercase tracking-wider ${
                confirmRestart 
                  ? 'bg-red-600 hover:bg-red-500 text-white' 
                  : 'bg-orange-600 hover:bg-orange-500 text-white'
              }`}
            >
              {confirmRestart ? 'Confirm Restart' : 'Restart Game'}
            </button>
            
            <button
              onClick={handleQuit}
              className={`w-full px-6 py-3 font-bold rounded-lg transform transition-all duration-200 hover:scale-105 font-mono uppercase tracking-wider ${
                confirmQuit 
                  ? 'bg-red-600 hover:bg-red-500 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {confirmQuit ? 'Confirm Quit' : 'Main Menu'}
            </button>
            
            <div className="text-center text-gray-500 text-sm font-mono mt-4">
              Press ESC to resume
            </div>
          </div>
        ) : (
          /* Settings Menu */
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-cyan-400 font-mono">SETTINGS</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white font-mono text-sm"
              >
                ← Back
              </button>
            </div>
            
            {/* Audio Settings */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-300 font-mono">Audio</h4>
              
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
              
              {/* Music Volume */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-300 font-mono">Music Volume</label>
                  <span className="text-cyan-400 font-mono">{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.musicVolume}
                  onChange={(e) => onSettingsChange({ musicVolume: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
            
            {/* Visual Settings */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-300 font-mono">Visual</h4>
              
              {/* Particle Quality */}
              <div className="space-y-2">
                <label className="text-sm text-gray-300 font-mono">Particle Quality</label>
                <select
                  value={settings.particleQuality}
                  onChange={(e) => onSettingsChange({ particleQuality: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-3 py-2 bg-gray-700 text-white font-mono rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
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
              </div>
            </div>
            
            {/* Gameplay Settings */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-300 font-mono">Gameplay</h4>
              
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
        
        {/* Confirmation Messages */}
        {confirmRestart && (
          <div className="mt-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg text-center font-mono text-sm text-red-200">
            Click again to restart the game
          </div>
        )}
        
        {confirmQuit && (
          <div className="mt-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg text-center font-mono text-sm text-red-200">
            Click again to quit to main menu
          </div>
        )}
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