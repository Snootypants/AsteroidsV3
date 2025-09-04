export type SoundCategory = 'ship' | 'combat' | 'pickup' | 'ui' | 'ambient';

export interface SoundConfig {
  category: SoundCategory;
  volume: number;
  loop: boolean;
  pitchVariation: number; // 0-1 range for random pitch variation
  maxInstances: number; // Max concurrent instances
}

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  enabled: boolean;
}

/**
 * Audio manager using Web Audio API for game sounds and music
 * Handles sound loading, playback, volume control, and spatial audio
 */
export class AudioManager {
  private audioContext?: AudioContext;
  private masterGain?: GainNode;
  private sfxGain?: GainNode;
  private musicGain?: GainNode;
  
  // Sound storage
  private sounds: Map<string, AudioBuffer> = new Map();
  private soundConfigs: Map<string, SoundConfig> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode[]> = new Map();
  
  // Settings
  private settings: AudioSettings = {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    enabled: true
  };
  
  // Sound definitions
  private static readonly SOUND_DEFINITIONS: Record<string, SoundConfig> = {
    // Ship sounds
    'ship.thrust': { category: 'ship', volume: 0.3, loop: true, pitchVariation: 0.1, maxInstances: 1 },
    'ship.shoot': { category: 'ship', volume: 0.5, loop: false, pitchVariation: 0.2, maxInstances: 3 },
    'ship.damage': { category: 'ship', volume: 0.7, loop: false, pitchVariation: 0.1, maxInstances: 2 },
    'ship.death': { category: 'ship', volume: 0.8, loop: false, pitchVariation: 0, maxInstances: 1 },
    
    // Combat sounds
    'combat.explosion_large': { category: 'combat', volume: 0.8, loop: false, pitchVariation: 0.15, maxInstances: 5 },
    'combat.explosion_medium': { category: 'combat', volume: 0.6, loop: false, pitchVariation: 0.15, maxInstances: 8 },
    'combat.explosion_small': { category: 'combat', volume: 0.4, loop: false, pitchVariation: 0.2, maxInstances: 10 },
    'combat.enemy_shoot': { category: 'combat', volume: 0.4, loop: false, pitchVariation: 0.25, maxInstances: 6 },
    'combat.bullet_hit': { category: 'combat', volume: 0.3, loop: false, pitchVariation: 0.3, maxInstances: 8 },
    
    // Pickup sounds
    'pickup.salvage': { category: 'pickup', volume: 0.5, loop: false, pitchVariation: 0.1, maxInstances: 3 },
    'pickup.health': { category: 'pickup', volume: 0.6, loop: false, pitchVariation: 0.05, maxInstances: 2 },
    'pickup.shield': { category: 'pickup', volume: 0.6, loop: false, pitchVariation: 0.05, maxInstances: 2 },
    'pickup.powerup': { category: 'pickup', volume: 0.7, loop: false, pitchVariation: 0.1, maxInstances: 2 },
    
    // UI sounds
    'ui.wave_start': { category: 'ui', volume: 0.8, loop: false, pitchVariation: 0, maxInstances: 1 },
    'ui.wave_complete': { category: 'ui', volume: 0.9, loop: false, pitchVariation: 0, maxInstances: 1 },
    'ui.combo_up': { category: 'ui', volume: 0.6, loop: false, pitchVariation: 0.1, maxInstances: 1 },
    'ui.high_score': { category: 'ui', volume: 1.0, loop: false, pitchVariation: 0, maxInstances: 1 },
    
    // Ambient
    'ambient.music': { category: 'ambient', volume: 0.4, loop: true, pitchVariation: 0, maxInstances: 1 }
  };
  
  constructor() {
    this.loadSettings();
    this.initializeAudioContext();
    this.setupSoundConfigs();
  }
  
  /**
   * Initialize Web Audio API context and gain nodes
   */
  private async initializeAudioContext(): Promise<void> {
    try {
      // Create audio context (handle browser prefixes)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Create gain nodes for volume control
      this.masterGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      
      // Connect gain nodes
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      
      // Set initial volumes
      this.updateVolumes();
      
      // Handle browser autoplay policy
      if (this.audioContext.state === 'suspended') {
        // Will be resumed on first user interaction
        console.log('AudioContext suspended - waiting for user interaction');
      }
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
      this.settings.enabled = false;
    }
  }
  
  /**
   * Setup sound configurations
   */
  private setupSoundConfigs(): void {
    for (const [soundId, config] of Object.entries(AudioManager.SOUND_DEFINITIONS)) {
      this.soundConfigs.set(soundId, config);
      this.activeSources.set(soundId, []);
    }
  }
  
  /**
   * Resume audio context (required for browsers with autoplay restrictions)
   */
  public async resumeContext(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
      console.log('AudioContext resumed');
    }
  }
  
  /**
   * Generate procedural sound for a given sound ID
   * This creates synthetic sounds since we don't have audio files yet
   */
  private generateProceduralSound(soundId: string): AudioBuffer | null {
    if (!this.audioContext) return null;
    
    const sampleRate = this.audioContext.sampleRate;
    let duration = 0.5; // Default duration
    let buffer: AudioBuffer;
    let data: Float32Array;
    
    switch (soundId) {
      case 'ship.thrust':
        duration = 0.1; // Short loop
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        data = buffer.getChannelData(0);
        // Generate low-frequency rumble
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          data[i] = (Math.sin(t * 60 * Math.PI) + Math.sin(t * 40 * Math.PI)) * 0.3 * 
                   Math.sin(t * 20 * Math.PI) * Math.exp(-t * 2);
        }
        break;
        
      case 'ship.shoot':
        duration = 0.15;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        data = buffer.getChannelData(0);
        // Generate laser shot
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const freq = 800 * Math.exp(-t * 8);
          data[i] = Math.sin(t * freq * Math.PI * 2) * Math.exp(-t * 10) * 0.5;
        }
        break;
        
      case 'combat.explosion_large':
        duration = 1.2;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        data = buffer.getChannelData(0);
        // Generate explosion with noise and low freq
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const noise = (Math.random() - 0.5) * 2;
          const boom = Math.sin(t * 30 * Math.PI) * Math.exp(-t * 2);
          data[i] = (noise * 0.4 + boom * 0.6) * Math.exp(-t * 1.5) * 0.8;
        }
        break;
        
      case 'combat.explosion_medium':
        duration = 0.8;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const noise = (Math.random() - 0.5) * 2;
          const boom = Math.sin(t * 50 * Math.PI) * Math.exp(-t * 3);
          data[i] = (noise * 0.3 + boom * 0.7) * Math.exp(-t * 2) * 0.6;
        }
        break;
        
      case 'combat.explosion_small':
        duration = 0.4;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const noise = (Math.random() - 0.5) * 2;
          const pop = Math.sin(t * 100 * Math.PI) * Math.exp(-t * 8);
          data[i] = (noise * 0.2 + pop * 0.8) * Math.exp(-t * 4) * 0.4;
        }
        break;
        
      case 'pickup.salvage':
        duration = 0.3;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        data = buffer.getChannelData(0);
        // Generate pleasant pickup sound
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          data[i] = (Math.sin(t * 800 * Math.PI) + Math.sin(t * 1200 * Math.PI)) * 
                   Math.exp(-t * 3) * 0.3;
        }
        break;
        
      case 'ui.combo_up':
        duration = 0.2;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        data = buffer.getChannelData(0);
        // Generate ascending tone
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const freq = 400 + t * 800;
          data[i] = Math.sin(t * freq * Math.PI * 2) * Math.exp(-t * 4) * 0.4;
        }
        break;
        
      default:
        // Generate generic beep
        duration = 0.1;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          data[i] = Math.sin(t * 440 * Math.PI * 2) * Math.exp(-t * 10) * 0.3;
        }
    }
    
    return buffer;
  }
  
  /**
   * Load or generate sound
   */
  private async loadSound(soundId: string): Promise<void> {
    if (this.sounds.has(soundId) || !this.audioContext) return;
    
    try {
      // For now, generate procedural sounds
      // In a real implementation, you would load audio files here
      const buffer = this.generateProceduralSound(soundId);
      if (buffer) {
        this.sounds.set(soundId, buffer);
      }
    } catch (error) {
      console.warn(`Failed to load sound: ${soundId}`, error);
    }
  }
  
  /**
   * Play a sound by ID
   */
  public async playSound(soundId: string, volume: number = 1.0, pitch: number = 1.0): Promise<void> {
    if (!this.settings.enabled || !this.audioContext) return;
    
    // Resume context if needed
    await this.resumeContext();
    
    // Load sound if not loaded
    await this.loadSound(soundId);
    
    const buffer = this.sounds.get(soundId);
    const config = this.soundConfigs.get(soundId);
    if (!buffer || !config) return;
    
    // Check max instances
    const activeSources = this.activeSources.get(soundId) || [];
    if (activeSources.length >= config.maxInstances) {
      // Stop oldest instance
      const oldest = activeSources.shift();
      oldest?.stop();
    }
    
    // Create audio source
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = config.loop;
    
    // Apply pitch variation
    const finalPitch = pitch * (1 + (Math.random() - 0.5) * config.pitchVariation);
    source.playbackRate.value = finalPitch;
    
    // Create gain node for this instance
    const gainNode = this.audioContext.createGain();
    const finalVolume = config.volume * volume * this.getCategoryVolume(config.category);
    gainNode.gain.value = finalVolume;
    
    // Connect audio graph
    source.connect(gainNode);
    if (config.category === 'ambient') {
      gainNode.connect(this.musicGain!);
    } else {
      gainNode.connect(this.sfxGain!);
    }
    
    // Track source
    activeSources.push(source);
    this.activeSources.set(soundId, activeSources);
    
    // Clean up when finished
    source.onended = () => {
      const sources = this.activeSources.get(soundId) || [];
      const index = sources.indexOf(source);
      if (index >= 0) {
        sources.splice(index, 1);
      }
    };
    
    // Start playback
    source.start();
  }
  
  /**
   * Stop a sound by ID
   */
  public stopSound(soundId: string): void {
    const sources = this.activeSources.get(soundId) || [];
    sources.forEach(source => source.stop());
    sources.length = 0;
  }
  
  /**
   * Stop all sounds
   */
  public stopAllSounds(): void {
    for (const [soundId] of this.activeSources) {
      this.stopSound(soundId);
    }
  }
  
  /**
   * Get category volume multiplier
   */
  private getCategoryVolume(category: SoundCategory): number {
    switch (category) {
      case 'ambient':
        return this.settings.musicVolume;
      default:
        return this.settings.sfxVolume;
    }
  }
  
  /**
   * Update volume settings
   */
  public setVolume(type: 'master' | 'sfx' | 'music', volume: number): void {
    volume = Math.max(0, Math.min(1, volume));
    
    switch (type) {
      case 'master':
        this.settings.masterVolume = volume;
        break;
      case 'sfx':
        this.settings.sfxVolume = volume;
        break;
      case 'music':
        this.settings.musicVolume = volume;
        break;
    }
    
    this.updateVolumes();
    this.saveSettings();
  }
  
  /**
   * Update gain node volumes
   */
  private updateVolumes(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = this.settings.masterVolume;
    }
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.settings.sfxVolume;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = this.settings.musicVolume;
    }
  }
  
  /**
   * Toggle audio on/off
   */
  public setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    if (!enabled) {
      this.stopAllSounds();
    }
    this.saveSettings();
  }
  
  /**
   * Get current settings
   */
  public getSettings(): AudioSettings {
    return { ...this.settings };
  }
  
  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('asteroids-audio-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.settings = { ...this.settings, ...settings };
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }
  
  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('asteroids-audio-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      settings: this.settings,
      contextState: this.audioContext?.state,
      loadedSounds: this.sounds.size,
      activeSources: Object.fromEntries(
        Array.from(this.activeSources.entries()).map(([id, sources]) => [id, sources.length])
      )
    };
  }
}