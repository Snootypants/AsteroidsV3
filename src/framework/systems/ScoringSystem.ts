import { BaseEntity } from '../entities/BaseEntity';
import { Asteroid } from '../entities/Asteroid';

export interface ScoreEvent {
  points: number;
  position: { x: number; y: number };
  entity: BaseEntity;
  reason: 'asteroid' | 'enemy' | 'bonus';
  size?: string;
}

export interface ComboData {
  multiplier: number;
  count: number;
  timer: number;
  maxTimer: number;
}

/**
 * Scoring system with combo mechanics and persistent high scores
 * Handles point calculation, combo multipliers, and score events
 */
export class ScoringSystem {
  private score: number = 0;
  private highScore: number = 0;
  
  // Combo system
  private combo: ComboData = {
    multiplier: 1,
    count: 0,
    timer: 0,
    maxTimer: 3.0 // 3 seconds to maintain combo
  };
  
  // Score values from vanilla implementation
  private static readonly SCORE_VALUES = {
    asteroid: {
      large: 20,
      medium: 50,
      small: 100
    },
    enemy: 150,
    bonus: {
      pickup: 10,
      wave_complete: 100,
      perfect_wave: 500 // No damage taken
    }
  };
  
  // Combo thresholds
  private static readonly COMBO_THRESHOLDS = [1, 2, 3, 5, 8, 12, 20, 30];
  
  // Event callbacks
  private onScoreChange?: (score: number, delta: number) => void;
  private onComboChange?: (combo: ComboData) => void;
  private onHighScore?: (newHighScore: number) => void;
  private onScoreEvent?: (event: ScoreEvent) => void;
  
  constructor() {
    this.loadHighScore();
  }
  
  /**
   * Register callback for score changes
   */
  public onScore(callback: (score: number, delta: number) => void): void {
    this.onScoreChange = callback;
  }
  
  /**
   * Register callback for combo changes
   */
  public onCombo(callback: (combo: ComboData) => void): void {
    this.onComboChange = callback;
  }
  
  /**
   * Register callback for new high scores
   */
  public onNewHighScore(callback: (newHighScore: number) => void): void {
    this.onHighScore = callback;
  }
  
  /**
   * Register callback for score events (for visual indicators)
   */
  public onScoreEventCallback(callback: (event: ScoreEvent) => void): void {
    this.onScoreEvent = callback;
  }
  
  /**
   * Award points for asteroid destruction
   * @param asteroid The destroyed asteroid
   */
  public awardAsteroidPoints(asteroid: Asteroid): void {
    const size = asteroid.sizeKey;
    const basePoints = ScoringSystem.SCORE_VALUES.asteroid[size];
    
    this.awardPoints(basePoints, asteroid.position, asteroid, 'asteroid', size);
  }
  
  /**
   * Award points for enemy destruction
   * @param enemy The destroyed enemy
   */
  public awardEnemyPoints(enemy: BaseEntity): void {
    const basePoints = ScoringSystem.SCORE_VALUES.enemy;
    this.awardPoints(basePoints, enemy.position, enemy, 'enemy');
  }
  
  /**
   * Award bonus points
   * @param bonusType Type of bonus
   * @param position Position for visual indicator
   */
  public awardBonus(bonusType: keyof typeof ScoringSystem.SCORE_VALUES.bonus, position: { x: number; y: number }, entity?: BaseEntity): void {
    const basePoints = ScoringSystem.SCORE_VALUES.bonus[bonusType];
    this.awardPoints(basePoints, position, entity, 'bonus');
  }
  
  /**
   * Internal method to award points with combo calculation
   * @param basePoints Base points before combo
   * @param position Position for visual effect
   * @param entity Entity that generated points
   * @param reason Reason for scoring
   * @param size Optional size for asteroids
   */
  private awardPoints(
    basePoints: number, 
    position: { x: number; y: number }, 
    entity?: BaseEntity, 
    reason: ScoreEvent['reason'] = 'asteroid',
    size?: string
  ): void {
    // Calculate points with combo multiplier
    const finalPoints = Math.round(basePoints * this.combo.multiplier);
    
    // Update score
    this.score += finalPoints;
    
    // Check for high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
      this.onHighScore?.(this.highScore);
    }
    
    // Update combo
    this.incrementCombo();
    
    // Fire callbacks
    this.onScoreChange?.(this.score, finalPoints);
    
    if (entity) {
      const scoreEvent: ScoreEvent = {
        points: finalPoints,
        position,
        entity,
        reason,
        size
      };
      this.onScoreEvent?.(scoreEvent);
    }
  }
  
  /**
   * Increment combo counter and multiplier
   */
  private incrementCombo(): void {
    this.combo.count++;
    this.combo.timer = this.combo.maxTimer; // Reset timer
    
    // Calculate multiplier based on combo count
    let newMultiplier = 1;
    for (let i = ScoringSystem.COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this.combo.count >= ScoringSystem.COMBO_THRESHOLDS[i]) {
        newMultiplier = i + 2; // 2x, 3x, 4x, etc.
        break;
      }
    }
    
    this.combo.multiplier = newMultiplier;
    this.onComboChange?.(this.combo);
  }
  
  /**
   * Update combo timer (call from game loop)
   * @param dt Delta time in seconds
   */
  public updateCombo(dt: number): void {
    if (this.combo.count > 0) {
      this.combo.timer -= dt;
      
      if (this.combo.timer <= 0) {
        // Reset combo
        this.combo.count = 0;
        this.combo.multiplier = 1;
        this.combo.timer = 0;
        this.onComboChange?.(this.combo);
      }
    }
  }
  
  /**
   * Reset combo (when player takes damage)
   */
  public resetCombo(): void {
    this.combo.count = 0;
    this.combo.multiplier = 1;
    this.combo.timer = 0;
    this.onComboChange?.(this.combo);
  }
  
  /**
   * Reset score for new game
   */
  public resetScore(): void {
    this.score = 0;
    this.resetCombo();
    this.onScoreChange?.(this.score, 0);
  }
  
  /**
   * Get current score
   */
  public getScore(): number {
    return this.score;
  }
  
  /**
   * Get high score
   */
  public getHighScore(): number {
    return this.highScore;
  }
  
  /**
   * Get current combo data
   */
  public getCombo(): ComboData {
    return { ...this.combo };
  }
  
  /**
   * Load high score from localStorage
   */
  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem('asteroids-high-score');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    } catch (error) {
      console.warn('Failed to load high score:', error);
      this.highScore = 0;
    }
  }
  
  /**
   * Save high score to localStorage
   */
  private saveHighScore(): void {
    try {
      localStorage.setItem('asteroids-high-score', this.highScore.toString());
    } catch (error) {
      console.warn('Failed to save high score:', error);
    }
  }
  
  /**
   * Get formatted score string
   * @param score Score to format
   * @returns Formatted score with commas
   */
  public static formatScore(score: number): string {
    return score.toLocaleString();
  }
  
  /**
   * Calculate points for a given asteroid size
   * @param size Asteroid size
   * @returns Base points (before combo)
   */
  public static getAsteroidPoints(size: keyof typeof ScoringSystem.SCORE_VALUES.asteroid): number {
    return ScoringSystem.SCORE_VALUES.asteroid[size];
  }
  
  /**
   * Get enemy points
   */
  public static getEnemyPoints(): number {
    return ScoringSystem.SCORE_VALUES.enemy;
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      score: this.score,
      highScore: this.highScore,
      combo: this.combo,
      scoreValues: ScoringSystem.SCORE_VALUES
    };
  }
}