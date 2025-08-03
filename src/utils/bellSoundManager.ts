// 音声管理ユーティリティ
export type BellType = 'single' | 'double' | 'loop';
export type NotificationType = 'start' | 'warning' | 'end' | 'overtime';

interface BellSettings {
  start: boolean;
  fiveMinWarning: boolean;
  end: boolean;
  overtime: boolean;
  soundType: BellType;
}

// 各種音声ファイルのパス
const SOUND_PATHS: Record<BellType, string> = {
  single: '/sounds/bell-single.mp3',
  double: '/sounds/bell-double.mp3',
  loop: '/sounds/bell-loop.mp3',
};

// デスクトップベル音のデータURL（Base64エンコード、実際のファイルの代替）
const BELL_SOUNDS: Record<BellType, string> = {
  // 短いベル音のデータURL（実際の実装では音声ファイルを使用）
  single: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeCS6O2+3SfzAGIHDA7+SbUwwOUqXh77BUEAo+ltryxnkpAyl+zPLaizsIGGS57OOdTgwKUJ/e8LdlIAo6jNf1v2cpByF8x+/hh0EMEQ==',
  double: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeCS6O2+3SfzAGIHDA7+SbUwwOUqXh77BUEAo+ltryxnkpAyl+zPLaizsIGGS57OOdTgwKUJ/e8LdlIAo6jNf1v2cpByF8x+/hh0EMEQ==',
  loop: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeCS6O2+3SfzAGIHDA7+SbUwwOUqXh77BUEAo+ltryxnkpAyl+zPLaizsIGGS57OOdTgwKUJ/e8LdlIAo6jNf1v2cpByF8x+/hh0EMEQ==',
};

class BellSoundManager {
  private audioContext: AudioContext | null = null;
  private soundBuffers: Map<BellType, AudioBuffer> = new Map();
  private currentLoopSource: AudioBufferSourceNode | null = null;

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.loadSounds();
    } catch (error) {
      console.warn('オーディオコンテキストの初期化に失敗:', error);
    }
  }

  private async loadSounds() {
    if (!this.audioContext) return;

    for (const [type, dataUrl] of Object.entries(BELL_SOUNDS)) {
      try {
        // データURLから音声バッファを作成
        const response = await fetch(dataUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.soundBuffers.set(type as BellType, audioBuffer);
      } catch (error) {
        console.warn(`音声ファイル ${type} の読み込みに失敗:`, error);
        
        // フォールバック: Web Audio APIで簡単なベル音を生成
        const buffer = this.createSyntheticBell(type as BellType);
        if (buffer) {
          this.soundBuffers.set(type as BellType, buffer);
        }
      }
    }
  }

  private createSyntheticBell(type: BellType): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const duration = type === 'loop' ? 2.0 : type === 'double' ? 1.0 : 0.5;
    const frameCount = sampleRate * duration;
    
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);

    // シンプルなベル音を生成
    const baseFreq = 800; // ベル音の基本周波数
    const harmonics = [1, 1.5, 2, 2.5, 3]; // 倍音

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // 倍音を重ねてベル音らしさを作る
      for (const harmonic of harmonics) {
        const freq = baseFreq * harmonic;
        const amplitude = Math.exp(-t * 2) / harmonics.length; // 減衰
        sample += Math.sin(2 * Math.PI * freq * t) * amplitude;
      }

      // ダブルベルの場合は0.3秒後にもう一度
      if (type === 'double' && t >= 0.3 && t < 0.8) {
        const t2 = t - 0.3;
        for (const harmonic of harmonics) {
          const freq = baseFreq * harmonic;
          const amplitude = Math.exp(-t2 * 2) / harmonics.length;
          sample += Math.sin(2 * Math.PI * freq * t2) * amplitude;
        }
      }

      channelData[i] = sample * 0.3; // 音量調整
    }

    return buffer;
  }

  async playBell(type: BellType, silentMode: boolean = false): Promise<void> {
    if (silentMode) {
      // サイレントモード時はバイブレーションのみ
      this.triggerVibration();
      return;
    }

    if (!this.audioContext || !this.soundBuffers.has(type)) {
      console.warn(`音声 ${type} が利用できません`);
      return;
    }

    try {
      // 既存のループを停止
      if (this.currentLoopSource) {
        this.currentLoopSource.stop();
        this.currentLoopSource = null;
      }

      const buffer = this.soundBuffers.get(type)!;
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);

      if (type === 'loop') {
        source.loop = true;
        this.currentLoopSource = source;
        // 5秒後に自動停止
        setTimeout(() => this.stopLoop(), 5000);
      }

      source.start();
    } catch (error) {
      console.warn('音声再生エラー:', error);
    }
  }

  stopLoop(): void {
    if (this.currentLoopSource) {
      try {
        this.currentLoopSource.stop();
      } catch (error) {
        // 既に停止している場合のエラーを無視
      }
      this.currentLoopSource = null;
    }
  }

  private triggerVibration(): void {
    if ('vibrate' in navigator) {
      // バイブレーションパターン: [振動時間, 停止時間, ...]
      navigator.vibrate([200, 100, 200]);
    }
  }

  // 通知とベル音の統合メソッド
  async notifyWithBell(
    type: NotificationType,
    settings: BellSettings,
    message: string
  ): Promise<void> {
    // 設定に応じてベル音を再生
    let shouldPlay = false;
    switch (type) {
      case 'start':
        shouldPlay = settings.start;
        break;
      case 'warning':
        shouldPlay = settings.fiveMinWarning;
        break;
      case 'end':
        shouldPlay = settings.end;
        break;
      case 'overtime':
        shouldPlay = settings.overtime;
        break;
    }

    if (shouldPlay) {
      await this.playBell(settings.soundType, false);
    }

    // ブラウザ通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('会議タイマー', {
        body: message,
        icon: '/timer-icon.png',
        tag: `agenda-${type}`,
        silent: true, // 音声はベル音で制御
      });
    }
  }
}

// シングルトンインスタンス
export const bellSoundManager = new BellSoundManager();
