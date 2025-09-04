export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver' | 'settings' | 'highScores';

export interface GameStats {
  score: number;
  highScore: number;
  wave: number;
  lives: number;
  accuracy: number; // 0-1 percentage
  enemiesDestroyed: number;
  asteroidsDestroyed: number;
  pickupsCollected: number;
  timeAlive: number; // seconds
  perfectWaves: number;
  combo: number;
  totalShots: number;
  totalHits: number;
}

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  showFPS: boolean;
  particleQuality: 'low' | 'medium' | 'high';
  screenShake: boolean;
  autofire: boolean;
  controls: {
    forward: string;
    left: string;
    right: string;
    shoot: string;
    pause: string;
  };
}

export interface GameStateData {
  currentState: GameState;
  previousState: GameState;
  stats: GameStats;
  settings: GameSettings;
  gameStartTime: number;
  pauseStartTime: number;
  totalPausedTime: number;
}

/**
 * Central game state management system
 * Handles all game states, settings, statistics, and transitions
 */
export class GameStateManager {
  private data: GameStateData;
  private stateChangeCallbacks: Map<GameState | 'any', ((from: GameState, to: GameState) => void)[]> = new Map();
  private statsUpdateCallbacks: ((stats: GameStats) => void)[] = [];
  private settingsChangeCallbacks: ((settings: GameSettings) => void)[] = [];
  
  // Default settings
  private static readonly DEFAULT_SETTINGS: GameSettings = {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    showFPS: false,
    particleQuality: 'high',
    screenShake: true,
    autofire: false,
    controls: {
      forward: 'KeyW',
      left: 'KeyA',
      right: 'KeyD',
      shoot: 'Space',
      pause: 'Escape'
    }
  };
  
  constructor() {
    this.data = {
      currentState: 'menu',
      previousState: 'menu',
      stats: this.createDefaultStats(),
      settings: this.loadSettings(),
      gameStartTime: 0,
      pauseStartTime: 0,
      totalPausedTime: 0
    };
    
    // Initialize callback maps
    this.stateChangeCallbacks.set('any', []);
    for (const state of ['menu', 'playing', 'paused', 'gameOver', 'settings', 'highScores'] as GameState[]) {
      this.stateChangeCallbacks.set(state, []);
    }
  }
  
  /**
   * Create default game statistics
   */
  private createDefaultStats(): GameStats {
    return {
      score: 0,
      highScore: this.loadHighScore(),
      wave: 1,
      lives: 3,
      accuracy: 0,
      enemiesDestroyed: 0,
      asteroidsDestroyed: 0,
      pickupsCollected: 0,
      timeAlive: 0,
      perfectWaves: 0,
      combo: 0,
      totalShots: 0,
      totalHits: 0
    };
  }
  
  /**
   * Change game state with proper callbacks
   * @param newState Target state
   */
  public setState(newState: GameState): void {
    if (newState === this.data.currentState) return;
    
    const oldState = this.data.currentState;
    this.data.previousState = oldState;
    this.data.currentState = newState;
    
    // Handle special state transitions
    this.handleStateTransition(oldState, newState);
    
    // Fire callbacks
    this.fireStateChangeCallbacks(oldState, newState);
  }
  
  /**
   * Handle special logic for state transitions
   * @param from Previous state
   * @param to New state
   */
  private handleStateTransition(from: GameState, to: GameState): void {
    switch (to) {
      case 'playing':
        if (from === 'menu') {
          // Starting new game
          this.startNewGame();
        } else if (from === 'paused') {
          // Resuming from pause
          this.resumeGame();
        }
        break;
        
      case 'paused':
        if (from === 'playing') {
          this.pauseGame();
        }
        break;
        
      case 'gameOver':
        if (from === 'playing') {
          this.endGame();
        }
        break;
        
      case 'menu':
        // Reset any game-specific state
        this.resetGameState();
        break;
    }
  }
  
  /**
   * Start a new game
   */
  private startNewGame(): void {
    this.data.stats = this.createDefaultStats();
    this.data.gameStartTime = performance.now();
    this.data.totalPausedTime = 0;
    this.fireStatsUpdateCallbacks();
  }
  
  /**
   * Pause the current game
   */
  private pauseGame(): void {
    this.data.pauseStartTime = performance.now();
  }
  
  /**
   * Resume from pause
   */
  private resumeGame(): void {
    if (this.data.pauseStartTime > 0) {
      this.data.totalPausedTime += performance.now() - this.data.pauseStartTime;
      this.data.pauseStartTime = 0;
    }
  }
  
  /**
   * End the current game
   */
  private endGame(): void {
    // Calculate final time alive
    if (this.data.gameStartTime > 0) {
      this.data.stats.timeAlive = (performance.now() - this.data.gameStartTime - this.data.totalPausedTime) / 1000;
    }
    
    // Calculate accuracy
    if (this.data.stats.totalShots > 0) {
      this.data.stats.accuracy = this.data.stats.totalHits / this.data.stats.totalShots;
    }
    
    // Check for new high score
    if (this.data.stats.score > this.data.stats.highScore) {
      this.data.stats.highScore = this.data.stats.score;
      this.saveHighScore(this.data.stats.highScore);
    }
    
    this.fireStatsUpdateCallbacks();
  }
  
  /**
   * Reset game state (return to menu)
   */
  private resetGameState(): void {
    this.data.gameStartTime = 0;
    this.data.pauseStartTime = 0;
    this.data.totalPausedTime = 0;
  }
  
  /**
   * Update game statistics
   * @param statUpdates Partial stats to update
   */
  public updateStats(statUpdates: Partial<GameStats>): void {
    Object.assign(this.data.stats, statUpdates);
    this.fireStatsUpdateCallbacks();
  }
  
  /**
   * Update settings
   * @param settingUpdates Partial settings to update
   */
  public updateSettings(settingUpdates: Partial<GameSettings>): void {
    Object.assign(this.data.settings, settingUpdates);
    this.saveSettings();
    this.fireSettingsChangeCallbacks();
  }
  
  /**
   * Get current game state
   */
  public getState(): GameState {
    return this.data.currentState;
  }
  
  /**
   * Get previous game state
   */
  public getPreviousState(): GameState {
    return this.data.previousState;
  }
  
  /**
   * Get current game statistics
   */
  public getStats(): GameStats {
    return { ...this.data.stats };
  }
  
  /**
   * Get current settings
   */
  public getSettings(): GameSettings {
    return { ...this.data.settings };
  }
  
  /**
   * Check if game is currently active (playing or paused)
   */
  public isGameActive(): boolean {
    return this.data.currentState === 'playing' || this.data.currentState === 'paused';
  }
  
  /**
   * Check if game is currently playing (not paused)
   */
  public isPlaying(): boolean {
    return this.data.currentState === 'playing';
  }
  
  /**
   * Check if game is paused
   */
  public isPaused(): boolean {
    return this.data.currentState === 'paused';
  }
  
  /**
   * Toggle pause state
   */
  public togglePause(): void {
    if (this.data.currentState === 'playing') {
      this.setState('paused');
    } else if (this.data.currentState === 'paused') {
      this.setState('playing');
    }
  }
  
  /**
   * Register callback for state changes
   * @param state State to listen for (or 'any' for all changes)
   * @param callback Function to call on state change
   */
  public onStateChange(state: GameState | 'any', callback: (from: GameState, to: GameState) => void): void {
    const callbacks = this.stateChangeCallbacks.get(state) || [];
    callbacks.push(callback);
    this.stateChangeCallbacks.set(state, callbacks);
  }
  
  /**
   * Register callback for stats updates
   * @param callback Function to call when stats change
   */
  public onStatsUpdate(callback: (stats: GameStats) => void): void {
    this.statsUpdateCallbacks.push(callback);
  }
  
  /**
   * Register callback for settings changes
   * @param callback Function to call when settings change
   */
  public onSettingsChange(callback: (settings: GameSettings) => void): void {
    this.settingsChangeCallbacks.push(callback);
  }
  
  /**
   * Fire state change callbacks
   * @param from Previous state
   * @param to New state
   */
  private fireStateChangeCallbacks(from: GameState, to: GameState): void {
    // Fire specific state callbacks
    const specificCallbacks = this.stateChangeCallbacks.get(to) || [];
    specificCallbacks.forEach(callback => callback(from, to));
    
    // Fire 'any' state callbacks
    const anyCallbacks = this.stateChangeCallbacks.get('any') || [];
    anyCallbacks.forEach(callback => callback(from, to));
  }
  
  /**
   * Fire stats update callbacks
   */
  private fireStatsUpdateCallbacks(): void {
    this.statsUpdateCallbacks.forEach(callback => callback(this.data.stats));
  }
  
  /**
   * Fire settings change callbacks
   */
  private fireSettingsChangeCallbacks(): void {
    this.settingsChangeCallbacks.forEach(callback => callback(this.data.settings));
  }
  
  /**
   * Load settings from localStorage
   */
  private loadSettings(): GameSettings {
    try {
      const saved = localStorage.getItem('asteroids-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return { ...GameStateManager.DEFAULT_SETTINGS, ...settings };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
    return { ...GameStateManager.DEFAULT_SETTINGS };
  }
  
  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('asteroids-settings', JSON.stringify(this.data.settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }
  
  /**
   * Load high score from localStorage
   */
  private loadHighScore(): number {
    try {
      const saved = localStorage.getItem('asteroids-high-score');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch (error) {
      console.warn('Failed to load high score:', error);
      return 0;
    }
  }
  
  /**
   * Save high score to localStorage
   */
  private saveHighScore(score: number): void {
    try {
      localStorage.setItem('asteroids-high-score', score.toString());
    } catch (error) {
      console.warn('Failed to save high score:', error);
    }
  }
  
  /**
   * Get formatted time string
   * @param seconds Time in seconds
   * @returns Formatted time string (MM:SS or HH:MM:SS)
   */
  public static formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
  
  /**
   * Get formatted score string with commas
   * @param score Score to format
   * @returns Formatted score string
   */
  public static formatScore(score: number): string {
    return score.toLocaleString();
  }
  
  /**
   * Get formatted percentage string
   * @param ratio Ratio (0-1)
   * @returns Formatted percentage
   */
  public static formatPercentage(ratio: number): string {
    return `${Math.round(ratio * 100)}%`;
  }
  
  /**
   * Reset settings to defaults
   */
  public resetSettings(): void {
    this.data.settings = { ...GameStateManager.DEFAULT_SETTINGS };
    this.saveSettings();
    this.fireSettingsChangeCallbacks();
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      currentState: this.data.currentState,
      previousState: this.data.previousState,
      stats: this.data.stats,
      settings: this.data.settings,
      gameTime: this.data.gameStartTime > 0 ? (performance.now() - this.data.gameStartTime - this.data.totalPausedTime) / 1000 : 0,
      pausedTime: this.data.totalPausedTime / 1000,
      callbacks: {
        stateCallbacks: Array.from(this.stateChangeCallbacks.keys()).map(key => ({
          state: key,
          count: this.stateChangeCallbacks.get(key)?.length || 0
        })),
        statsCallbacks: this.statsUpdateCallbacks.length,
        settingsCallbacks: this.settingsChangeCallbacks.length
      }
    };
  }
}