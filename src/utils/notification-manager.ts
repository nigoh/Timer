// Unified Notification Manager for all timer features
// Supports sound synthesis (Web Audio API) and Browser Notifications

export type SoundType = 'single' | 'double' | 'loop' | 'complete' | 'warning' | 'start';

class NotificationManager {
  private static instance: NotificationManager;
  private audioContext: AudioContext | null = null;
  private soundBuffers: Map<SoundType, AudioBuffer> = new Map();
  private currentSource: AudioBufferSourceNode | null = null;
  private isInitialized = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Lazy init to avoid auto-play policy issues immediately on load
      // But we set up listeners if needed
    }
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Must be called on user interaction (first click) to unlock AudioContext
   */
  public async ensureInitialized() {
    if (this.isInitialized && this.audioContext?.state === 'running') return;

    try {
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (typeof AudioContextClass !== 'function') {
          return;
        }
        this.audioContext = new AudioContextClass();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isInitialized = true;
      
      // Request notification permission efficiently
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch (e) {
      console.warn('Failed to initialize AudioContext', e);
    }
  }

  private getSoundBuffer(type: SoundType): AudioBuffer | null {
    if (!this.audioContext) return null;
    
    // Return cached buffer if exists
    if (this.soundBuffers.has(type)) {
      return this.soundBuffers.get(type)!;
    }

    // Generate buffer on demand
    const buffer = this.createSyntheticSound(type);
    if (buffer) {
      this.soundBuffers.set(type, buffer);
    }
    return buffer;
  }

  private createSyntheticSound(type: SoundType): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    let duration = 0.5;
    
    // Duration configuration
    switch (type) {
      case 'loop': duration = 2.0; break;
      case 'double': duration = 1.0; break;
      case 'complete': duration = 1.5; break;
      case 'start': duration = 0.8; break;
      default: duration = 0.5;
    }

    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Synthesis Parameters
    const baseFreq = type === 'warning' ? 440 : type === 'complete' ? 880 : 800;
    const harmonics = [1, 1.5, 2, 2.5, 3]; // Bell-like harmonics

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // START SOUND (Ascending chime)
      if (type === 'start') {
        sample = Math.sin(2 * Math.PI * 523.25 * t) * Math.exp(-t * 3) * 0.5 + 
                 Math.sin(2 * Math.PI * 659.25 * t) * Math.exp(-(t-0.1) * 3) * (t > 0.1 ? 0.5 : 0);
      } 
      // COMPLETE SOUND (Major chord arpeggio)
      else if (type === 'complete') {
        const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major
        chord.forEach((freq, idx) => {
          const offset = idx * 0.1;
          if (t > offset) {
            sample += Math.sin(2 * Math.PI * freq * t) * Math.exp(-(t - offset) * 2) * 0.2;
          }
        });
      }
      // WARNING SOUND (Simple beep)
      else if (type === 'warning') {
        sample = Math.sin(2 * Math.PI * 440 * t) * (t < 0.2 ? 1 : 0);
      }
      // BELL SOUNDS (Single, Double, Loop)
      else {
         // Bell overlay
         for (const harmonic of harmonics) {
            const freq = baseFreq * harmonic;
            const amplitude = Math.exp(-t * 2) / harmonics.length;
            sample += Math.sin(2 * Math.PI * freq * t) * amplitude;
        }

        // Double hit logic
        if (type === 'double' && t >= 0.3) {
            const t2 = t - 0.3;
            for (const harmonic of harmonics) {
                const freq = baseFreq * harmonic;
                const amplitude = Math.exp(-t2 * 2) / harmonics.length;
                sample += Math.sin(2 * Math.PI * freq * t2) * amplitude;
            }
        }
      }

      // Master volume scaling
      channelData[i] = sample * 0.3;
    }

    return buffer;
  }

  public async playSound(type: SoundType, silentMode: boolean = false): Promise<void> {
    if (silentMode) {
      this.triggerVibration();
      return;
    }

    await this.ensureInitialized();
    if (!this.audioContext) return;

    try {
      // Stop previous looping sound
      this.stopSound();

      const buffer = this.getSoundBuffer(type);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);

      if (type === 'loop') {
        source.loop = true;
        this.currentSource = source;
        // Auto-stop loop after 5 seconds to prevent annoyance
        setTimeout(() => this.stopSound(), 5000);
      }

      source.start();
    } catch (error) {
      console.warn('Playback failed:', error);
    }
  }

  public stopSound() {
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch { return; }
      this.currentSource = null;
    }
  }

  private triggerVibration(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  /**
   * Unified notification method
   */
  public async notify(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      sound?: SoundType;
      silent?: boolean;
    }
  ) {
    // 1. Play Sound
    if (options?.sound) {
      await this.playSound(options.sound, options.silent);
    }

    // 2. Browser Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: options?.body,
          icon: options?.icon || '/timer-icon.png',
          silent: true, // Audio is handled via WebAudio
        });
      } catch (e) {
        // Ignored
      }
    }
  }
}

export const notificationManager = NotificationManager.getInstance();
