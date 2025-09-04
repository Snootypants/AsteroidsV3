import React, { useState, useEffect } from 'react';
import { GameStats } from '../systems/GameStateManager';

export interface GameOverProps {
  stats: GameStats;
  isNewHighScore: boolean;
  onRestart: () => void;
  onMainMenu: () => void;
  className?: string;
}

/**
 * Game Over screen with statistics, high score entry, and restart options
 * Shows detailed game performance metrics and celebration for achievements
 */
export const GameOver: React.FC<GameOverProps> = ({
  stats,
  isNewHighScore,
  onRestart,
  onMainMenu,
  className = ''
}) => {
  const [playerName, setPlayerName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // Show stats after brief delay for dramatic effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStats(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };
  
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };
  
  const formatPercentage = (ratio: number): string => {
    return `${Math.round(ratio * 100)}%`;
  };
  
  const getPerformanceGrade = (): { grade: string; color: string; message: string } => {
    const accuracy = stats.accuracy;
    const survivalTime = stats.timeAlive;
    const score = stats.score;
    
    // Calculate overall performance score
    const accuracyScore = accuracy * 40; // 0-40 points
    const timeScore = Math.min(survivalTime / 60 * 30, 30); // 0-30 points (max at 1 minute)
    const scoreMultiplier = Math.min(score / 10000 * 30, 30); // 0-30 points (max at 10k score)
    const totalScore = accuracyScore + timeScore + scoreMultiplier;
    
    if (totalScore >= 85) return { grade: 'S', color: 'text-yellow-400', message: 'Legendary Performance!' };
    if (totalScore >= 75) return { grade: 'A', color: 'text-green-400', message: 'Excellent Work!' };
    if (totalScore >= 65) return { grade: 'B', color: 'text-blue-400', message: 'Great Job!' };
    if (totalScore >= 50) return { grade: 'C', color: 'text-orange-400', message: 'Good Effort!' };
    if (totalScore >= 30) return { grade: 'D', color: 'text-red-400', message: 'Keep Practicing!' };
    return { grade: 'F', color: 'text-gray-400', message: 'Better Luck Next Time!' };
  };
  
  const performance = getPerformanceGrade();
  
  const handleSubmitScore = () => {
    if (playerName.trim() && !nameSubmitted) {
      // In a real implementation, this would submit to a leaderboard
      console.log(`High Score Submitted: ${playerName} - ${stats.score}`);
      setNameSubmitted(true);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitScore();
    }
  };
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center text-white ${className}`}>
      <div className="max-w-4xl w-full p-8 space-y-8">
        {/* Game Over Title */}
        <div className="text-center space-y-4">
          <h1 className="text-8xl font-bold font-mono text-red-500 tracking-wider animate-pulse">
            GAME OVER
          </h1>
          
          {/* Performance Grade */}
          <div className={`text-6xl font-bold font-mono ${performance.color}`}>
            {performance.grade}
          </div>
          <div className="text-xl text-gray-300 font-mono">
            {performance.message}
          </div>
        </div>
        
        {/* New High Score Celebration */}
        {isNewHighScore && (
          <div className="text-center bg-yellow-900 bg-opacity-50 p-6 rounded-lg border-2 border-yellow-400 animate-pulse">
            <h2 className="text-4xl font-bold text-yellow-400 font-mono mb-4">
              🎉 NEW HIGH SCORE! 🎉
            </h2>
            <div className="text-6xl font-bold text-yellow-300 font-mono">
              {formatScore(stats.score)}
            </div>
            
            {/* High Score Name Entry */}
            {!nameSubmitted && (
              <div className="mt-6 space-y-4">
                <div className="text-lg text-yellow-200">Enter your name for the leaderboard:</div>
                <div className="flex justify-center space-x-4">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.substring(0, 12))}
                    onKeyPress={handleKeyPress}
                    placeholder="Your Name"
                    className="px-4 py-2 bg-black bg-opacity-50 text-yellow-400 font-mono text-xl border border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center"
                    maxLength={12}
                    autoFocus
                  />
                  <button
                    onClick={handleSubmitScore}
                    disabled={!playerName.trim()}
                    className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:opacity-50 text-white font-bold rounded-lg font-mono"
                  >
                    SUBMIT
                  </button>
                </div>
              </div>
            )}
            
            {nameSubmitted && (
              <div className="mt-4 text-lg text-yellow-200 font-mono">
                Score submitted! Thanks for playing!
              </div>
            )}
          </div>
        )}
        
        {/* Statistics */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Main Stats */}
            <div className="bg-black bg-opacity-50 p-6 rounded-lg border border-gray-700 space-y-4">
              <h3 className="text-2xl font-bold text-cyan-400 font-mono text-center">
                FINAL STATISTICS
              </h3>
              
              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Final Score:</span>
                  <span className="text-cyan-400 text-xl font-bold">{formatScore(stats.score)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Waves Survived:</span>
                  <span className="text-green-400 text-xl font-bold">{stats.wave}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Time Survived:</span>
                  <span className="text-blue-400 text-xl font-bold">{formatTime(stats.timeAlive)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Accuracy:</span>
                  <span className={`text-xl font-bold ${stats.accuracy >= 0.8 ? 'text-green-400' : stats.accuracy >= 0.6 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {formatPercentage(stats.accuracy)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Max Combo:</span>
                  <span className="text-purple-400 text-xl font-bold">{stats.combo}x</span>
                </div>
              </div>
            </div>
            
            {/* Detailed Stats */}
            <div className="bg-black bg-opacity-50 p-6 rounded-lg border border-gray-700 space-y-4">
              <h3 className="text-2xl font-bold text-cyan-400 font-mono text-center">
                COMBAT REPORT
              </h3>
              
              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Enemies Destroyed:</span>
                  <span className="text-red-400 text-xl font-bold">{stats.enemiesDestroyed}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Asteroids Destroyed:</span>
                  <span className="text-blue-400 text-xl font-bold">{stats.asteroidsDestroyed}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Pickups Collected:</span>
                  <span className="text-green-400 text-xl font-bold">{stats.pickupsCollected}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Perfect Waves:</span>
                  <span className="text-yellow-400 text-xl font-bold">{stats.perfectWaves}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Shots Fired:</span>
                  <span className="text-gray-400 text-xl font-bold">{stats.totalShots}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Shots Hit:</span>
                  <span className="text-gray-400 text-xl font-bold">{stats.totalHits}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-center space-x-6 mt-8">
          <button
            onClick={onRestart}
            className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-xl rounded-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/50 font-mono uppercase tracking-wider"
          >
            Play Again
          </button>
          
          <button
            onClick={onMainMenu}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-lg transform transition-all duration-200 hover:scale-105 font-mono uppercase tracking-wider"
          >
            Main Menu
          </button>
        </div>
        
        {/* Tips for improvement */}
        {stats.accuracy < 0.5 && (
          <div className="text-center bg-blue-900 bg-opacity-50 p-4 rounded-lg border border-blue-400">
            <div className="text-blue-300 font-mono">
              💡 Tip: Try leading your shots when targeting moving enemies!
            </div>
          </div>
        )}
        
        {stats.timeAlive < 60 && (
          <div className="text-center bg-blue-900 bg-opacity-50 p-4 rounded-lg border border-blue-400">
            <div className="text-blue-300 font-mono">
              💡 Tip: Use asteroids as cover and collect power-ups to survive longer!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};