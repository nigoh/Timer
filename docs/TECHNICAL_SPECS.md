# タイマーアプリケーション 技術仕様書

## 📋 システム構成

### アーキテクチャ概要
```
src/
├── features/
│   ├── timer/                     # 基本タイマー機能
│   ├── pomodoroTimer/            # ポモドーロタイマー
│   ├── multiTimer/               # 複数タイマー管理
│   ├── analytics/                # 統計・分析
│   ├── settings/                 # 設定管理
│   └── teamTimer/               # チーム機能（Phase 3）
├── components/
│   ├── layout/                   # 既存レイアウト活用
│   ├── ui/                      # 基本UIコンポーネント
│   └── timer/                   # タイマー専用コンポーネント
├── hooks/                       # 共通カスタムフック
├── stores/                      # Zustand状態管理
├── utils/                       # ユーティリティ関数
├── types/                       # TypeScript型定義
└── constants/                   # 定数・設定値
```

---

## 🎯 コンポーネント設計

### 1. Timer Feature Structure

```typescript
// src/features/timer/
├── Timer.tsx                    # メインページ
├── TimerDisplay.tsx            # タイマー表示コンポーネント
├── TimerControls.tsx           # 操作コントロール
├── TimerSettings.tsx           # 設定画面
├── components/
│   ├── DigitalDisplay.tsx      # デジタル表示
│   ├── AnalogDisplay.tsx       # アナログ表示
│   ├── ProgressRing.tsx        # 進捗リング
│   ├── NotificationSettings.tsx # 通知設定
│   └── SoundSelector.tsx       # 音声選択
├── hooks/
│   ├── useTimer.ts             # タイマーロジック
│   ├── useNotification.ts      # 通知管理
│   └── useAudio.ts            # 音声管理
├── stores/
│   ├── useTimerStore.ts        # タイマー状態
│   └── useTimerSettingsStore.ts # 設定状態
├── constants/
│   └── timerConstants.ts       # タイマー関連定数
└── types/
    └── timer.types.ts          # 型定義
```

### 2. 主要型定義

```typescript
// src/types/timer.types.ts
export interface Timer {
  id: string;
  name: string;
  duration: number;            // 秒単位
  remainingTime: number;       // 残り時間
  status: TimerStatus;
  createdAt: Date;
  startedAt?: Date;
  pausedAt?: Date;
  completedAt?: Date;
  category?: string;
  color?: string;
  notificationEnabled: boolean;
  soundEnabled: boolean;
  soundFile?: string;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerSession {
  id: string;
  timerId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  actualDuration?: number;
  interruptions: number;
  notes?: string;
  rating?: number;           // 1-5段階評価
  tags: string[];
}

export interface PomodoroSettings {
  workDuration: number;      // 作業時間（分）
  shortBreakDuration: number; // 短い休憩（分）
  longBreakDuration: number;  // 長い休憩（分）
  longBreakInterval: number;  // 長い休憩の間隔
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  browser: boolean;
  soundVolume: number;
  customSounds: { [key: string]: string };
  vibration: boolean;        // モバイル用
}
```

---

## 🔧 状態管理設計

### 1. Timer Store（Zustand）

```typescript
// src/stores/useTimerStore.ts
interface TimerState {
  // データ
  timers: Timer[];
  activeTimer: Timer | null;
  sessions: TimerSession[];
  
  // UI状態
  loading: boolean;
  error: string | null;
  
  // 統計
  todayStats: DayStats;
  weekStats: WeekStats;
}

interface TimerActions {
  // タイマー管理
  createTimer: (timer: Omit<Timer, 'id'>) => void;
  updateTimer: (id: string, updates: Partial<Timer>) => void;
  deleteTimer: (id: string) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  stopTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  
  // セッション管理
  startSession: (timerId: string) => void;
  endSession: (sessionId: string, data: Partial<TimerSession>) => void;
  
  // データ管理
  loadTimers: () => Promise<void>;
  saveTimer: (timer: Timer) => Promise<void>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
}

export type TimerStore = TimerState & TimerActions;
```

### 2. Settings Store

```typescript
// src/stores/useSettingsStore.ts
interface SettingsState {
  // 外観設定
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  displayMode: 'digital' | 'analog' | 'both';
  
  // 通知設定
  notifications: NotificationSettings;
  
  // ポモドーロ設定
  pomodoro: PomodoroSettings;
  
  // ショートカット
  shortcuts: { [action: string]: string };
  
  // 一般設定
  autoSave: boolean;
  dataRetention: number;     // 日数
  backupEnabled: boolean;
}

interface SettingsActions {
  updateTheme: (theme: SettingsState['theme']) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  updatePomodoro: (settings: Partial<PomodoroSettings>) => void;
  updateShortcut: (action: string, key: string) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (data: string) => void;
}
```

---

## 🎨 UI/UX 実装詳細

### 1. タイマー表示コンポーネント

```typescript
// src/components/timer/TimerDisplay.tsx
interface TimerDisplayProps {
  timer: Timer;
  size?: 'small' | 'medium' | 'large';
  variant?: 'digital' | 'analog' | 'minimal';
  showProgress?: boolean;
  interactive?: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timer,
  size = 'large',
  variant = 'digital',
  showProgress = true,
  interactive = true
}) => {
  // 実装詳細
};
```

### 2. 進捗リングコンポーネント

```typescript
// src/components/timer/ProgressRing.tsx
interface ProgressRingProps {
  progress: number;          // 0-100
  size: number;
  strokeWidth: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  animated?: boolean;
}
```

### 3. レスポンシブ対応

```typescript
// MUIのテーマ拡張
const timerTheme = {
  breakpoints: {
    timer: {
      mobile: '(max-width: 767px)',
      tablet: '(min-width: 768px) and (max-width: 1199px)',
      desktop: '(min-width: 1200px)'
    }
  },
  components: {
    TimerDisplay: {
      styleOverrides: {
        root: ({ theme }) => ({
          // モバイル: シングル表示
          [theme.breakpoints.down('md')]: {
            fontSize: '3rem',
            padding: theme.spacing(2),
          },
          // デスクトップ: 複数表示対応
          [theme.breakpoints.up('lg')]: {
            fontSize: '2rem',
            minHeight: '200px',
          }
        })
      }
    }
  }
};
```

---

## ⏰ タイマー機能実装

### 1. 高精度タイマーフック

```typescript
// src/hooks/useTimer.ts
interface UseTimerOptions {
  onTick?: (remaining: number) => void;
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  precision?: number;        // ミリ秒単位の精度
}

export const useTimer = (
  initialDuration: number,
  options: UseTimerOptions = {}
) => {
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Web Workers使用による高精度タイマー
  const workerRef = useRef<Worker>();
  
  useEffect(() => {
    // Timer Workerの初期化
    workerRef.current = new Worker('/workers/timer-worker.js');
    
    workerRef.current.onmessage = (event) => {
      const { type, remaining } = event.data;
      
      if (type === 'tick') {
        setTimeRemaining(remaining);
        options.onTick?.(remaining);
      } else if (type === 'complete') {
        setIsRunning(false);
        options.onComplete?.(');
      }
    };
    
    return () => workerRef.current?.terminate();
  }, []);
  
  // タイマー操作メソッド
  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    workerRef.current?.postMessage({
      type: 'start',
      duration: timeRemaining,
      precision: options.precision || 1000
    });
    options.onStart?.();
  }, [timeRemaining, options]);
  
  // その他のメソッド...
  
  return {
    timeRemaining,
    isRunning,
    isPaused,
    start,
    pause,
    stop,
    reset,
    setDuration
  };
};
```

### 2. Timer Worker（高精度処理）

```javascript
// public/workers/timer-worker.js
let timerId = null;
let startTime = null;
let duration = 0;
let precision = 1000;

self.onmessage = function(event) {
  const { type, duration: newDuration, precision: newPrecision } = event.data;
  
  switch (type) {
    case 'start':
      duration = newDuration;
      precision = newPrecision || 1000;
      startTime = Date.now();
      startTimer();
      break;
      
    case 'pause':
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      break;
      
    case 'stop':
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      break;
  }
};

function startTimer() {
  timerId = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    
    self.postMessage({
      type: 'tick',
      remaining: Math.floor(remaining / 1000),
      elapsed: Math.floor(elapsed / 1000)
    });
    
    if (remaining <= 0) {
      clearInterval(timerId);
      timerId = null;
      self.postMessage({ type: 'complete' });
    }
  }, precision);
}
```

---

## 🔔 通知システム

### 1. 通知管理フック

```typescript
// src/hooks/useNotification.ts
export const useNotification = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);
  
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);
  
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/timer-icon.png',
        badge: '/icons/timer-badge.png',
        tag: 'timer-notification',
        ...options
      });
      
      // 自動閉じる
      setTimeout(() => notification.close(), 5000);
      
      return notification;
    }
  }, [permission]);
  
  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window
  };
};
```

### 2. 音声通知システム

```typescript
// src/hooks/useAudio.ts
export const useAudio = () => {
  const audioContextRef = useRef<AudioContext>();
  const audioBufferRef = useRef<{ [key: string]: AudioBuffer }>({});
  
  const loadSound = useCallback(async (name: string, url: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      audioBufferRef.current[name] = audioBuffer;
    } catch (error) {
      console.error('音声ファイルの読み込みに失敗:', error);
    }
  }, []);
  
  const playSound = useCallback((name: string, volume: number = 1) => {
    const audioContext = audioContextRef.current;
    const audioBuffer = audioBufferRef.current[name];
    
    if (audioContext && audioBuffer) {
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = audioBuffer;
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      source.start();
    }
  }, []);
  
  return {
    loadSound,
    playSound,
    isSupported: 'AudioContext' in window
  };
};
```

---

## 💾 データ永続化

### 1. IndexedDB管理

```typescript
// src/utils/database.ts
import Dexie, { Table } from 'dexie';

export interface DBTimer extends Timer {
  id?: number;
}

export interface DBSession extends TimerSession {
  id?: number;
}

class TimerDatabase extends Dexie {
  timers!: Table<DBTimer>;
  sessions!: Table<DBSession>;
  settings!: Table<any>;

  constructor() {
    super('TimerDatabase');
    
    this.version(1).stores({
      timers: '++id, name, status, createdAt, category',
      sessions: '++id, timerId, startTime, endTime, duration',
      settings: 'key, value'
    });
  }
}

export const db = new TimerDatabase();

// データ操作ヘルパー
export const timerDB = {
  // タイマー操作
  async saveTimer(timer: Timer): Promise<void> {
    await db.timers.put(timer);
  },
  
  async getTimers(): Promise<Timer[]> {
    return await db.timers.toArray();
  },
  
  async deleteTimer(id: string): Promise<void> {
    await db.timers.where('id').equals(id).delete();
  },
  
  // セッション操作
  async saveSession(session: TimerSession): Promise<void> {
    await db.sessions.put(session);
  },
  
  async getSessionsByDate(date: Date): Promise<TimerSession[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db.sessions
      .where('startTime')
      .between(startOfDay, endOfDay)
      .toArray();
  },
  
  // エクスポート/インポート
  async exportData(): Promise<string> {
    const timers = await db.timers.toArray();
    const sessions = await db.sessions.toArray();
    const settings = await db.settings.toArray();
    
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: { timers, sessions, settings }
    });
  },
  
  async importData(jsonData: string): Promise<void> {
    const { data } = JSON.parse(jsonData);
    
    await db.transaction('rw', db.timers, db.sessions, db.settings, async () => {
      await db.timers.clear();
      await db.sessions.clear();
      await db.settings.clear();
      
      await db.timers.bulkAdd(data.timers);
      await db.sessions.bulkAdd(data.sessions);
      await db.settings.bulkAdd(data.settings);
    });
  }
};
```

---

## 📊 統計・分析機能

### 1. 統計計算ユーティリティ

```typescript
// src/utils/analytics.ts
export interface DayStats {
  date: Date;
  totalTime: number;
  sessionsCount: number;
  averageSession: number;
  interruptions: number;
  productivity: number;
  categories: { [category: string]: number };
}

export interface WeekStats {
  startDate: Date;
  endDate: Date;
  totalTime: number;
  dailyStats: DayStats[];
  mostProductiveDay: Date;
  averageDailyTime: number;
  weeklyGoalProgress: number;
}

export const analyticsUtils = {
  calculateDayStats(sessions: TimerSession[], date: Date): DayStats {
    const daySession = sessions.filter(session => 
      isSameDay(session.startTime, date)
    );
    
    const totalTime = daySession.reduce((sum, session) => 
      sum + (session.actualDuration || session.duration), 0
    );
    
    const interruptions = daySession.reduce((sum, session) => 
      sum + session.interruptions, 0
    );
    
    const categories = daySession.reduce((acc, session) => {
      const category = session.tags[0] || 'その他';
      acc[category] = (acc[category] || 0) + session.duration;
      return acc;
    }, {} as { [category: string]: number });
    
    return {
      date,
      totalTime,
      sessionsCount: daySession.length,
      averageSession: daySession.length > 0 ? totalTime / daySession.length : 0,
      interruptions,
      productivity: calculateProductivity(daySession),
      categories
    };
  },
  
  calculateWeekStats(sessions: TimerSession[], startDate: Date): WeekStats {
    const endDate = addDays(startDate, 6);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    
    const dailyStats = weekDays.map(date => 
      this.calculateDayStats(sessions, date)
    );
    
    const totalTime = dailyStats.reduce((sum, day) => sum + day.totalTime, 0);
    const mostProductiveDay = dailyStats.reduce((max, day) => 
      day.totalTime > max.totalTime ? day : max
    ).date;
    
    return {
      startDate,
      endDate,
      totalTime,
      dailyStats,
      mostProductiveDay,
      averageDailyTime: totalTime / 7,
      weeklyGoalProgress: 0 // 目標設定機能実装後
    };
  }
};

function calculateProductivity(sessions: TimerSession[]): number {
  if (sessions.length === 0) return 0;
  
  const avgRating = sessions
    .filter(s => s.rating)
    .reduce((sum, s) => sum + (s.rating || 0), 0) / sessions.length;
    
  const interruptionPenalty = sessions.reduce((sum, s) => 
    sum + s.interruptions, 0) * 0.1;
    
  return Math.max(0, Math.min(100, (avgRating * 20) - interruptionPenalty));
}
```

---

## 🎯 実装ロードマップ

### Phase 1: Core MVP（2週間）
1. **基本プロジェクト設定**
   - Vite + React + TypeScript環境構築
   - MUI v7設定、デザインシステム統合
   - Zustand状態管理基盤

2. **基本タイマー機能**
   - シンプルなカウントダウンタイマー
   - 開始/一時停止/停止/リセット
   - 基本的な通知（ブラウザ通知、音声）

3. **UI基盤**
   - レスポンシブレイアウト
   - タイマー表示（デジタル）
   - 基本的な設定画面

### Phase 2: Enhanced Features（3週間）
1. **ポモドーロタイマー**
2. **複数タイマー管理**
3. **セッション記録・基本統計**
4. **データ永続化（IndexedDB）**
5. **エクスポート/インポート機能**

### Phase 3: Advanced Features（4週間）
1. **詳細統計・分析**
2. **目標設定・達成度管理**
3. **高度な通知設定**
4. **PWA対応**
5. **チーム機能基盤**

### Phase 4: Polish & Optimization（2週間）
1. **パフォーマンス最適化**
2. **アクセシビリティ向上**
3. **ユーザビリティテスト・改善**
4. **ドキュメント整備**

---

この技術仕様書に基づいて、段階的な実装を進めていきます。Phase 1のMVPから始めて、ユーザーフィードバックを収集しながら機能を拡張していく予定です。
