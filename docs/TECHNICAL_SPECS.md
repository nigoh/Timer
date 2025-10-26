# タイマ�Eアプリケーション 技術仕様書

## 📋 シスチE��構�E

### アーキチE��チャ概要E
```
src/
├── features/
━E  ├── timer/                     # 基本タイマ�E機�E
━E  ├── pomodoroTimer/            # ポモド�Eロタイマ�E
━E  ├── multiTimer/               # 褁E��タイマ�E管琁E
━E  ├── analytics/                # 統計�E刁E��
━E  ├── settings/                 # 設定管琁E
━E  └── teamTimer/               # チ�Eム機�E�E�Ehase 3�E�E
├── components/
━E  ├── layout/                   # 既存レイアウト活用
━E  ├── ui/                      # 基本UIコンポ�EネンチE
━E  └── timer/                   # タイマ�E専用コンポ�EネンチE
├── hooks/                       # 共通カスタムフック
├── stores/                      # Zustand状態管琁E
├── utils/                       # ユーチE��リチE��関数
├── types/                       # TypeScript型定義
└── constants/                   # 定数・設定値
```

---

## 🎯 コンポ�Eネント設訁E

### 1. Timer Feature Structure

```typescript
// src/features/timer/
├── Timer.tsx                    # メインペ�Eジ
├── TimerDisplay.tsx            # タイマ�E表示コンポ�EネンチE
├── TimerControls.tsx           # 操作コントロール
├── TimerSettings.tsx           # 設定画面
├── components/
━E  ├── DigitalDisplay.tsx      # チE��タル表示
━E  ├── AnalogDisplay.tsx       # アナログ表示
━E  ├── ProgressRing.tsx        # 進捗リング
━E  ├── NotificationSettings.tsx # 通知設宁E
━E  └── SoundSelector.tsx       # 音声選抁E
├── hooks/
━E  ├── useTimer.ts             # タイマ�EロジチE��
━E  ├── useNotification.ts      # 通知管琁E
━E  └── useAudio.ts            # 音声管琁E
├── stores/
━E  ├── useTimerStore.ts        # タイマ�E状慁E
━E  └── useTimerSettingsStore.ts # 設定状慁E
├── constants/
━E  └── timerConstants.ts       # タイマ�E関連定数
└── types/
    └── timer.types.ts          # 型定義
```

### 2. 主要型定義

```typescript
// src/types/timer.types.ts
export interface Timer {
  id: string;
  name: string;
  duration: number;            // 秒単佁E
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
  workDuration: number;      // 作業時間�E��E�E�E
  shortBreakDuration: number; // 短ぁE���E�E��E�E�E
  longBreakDuration: number;  // 長ぁE���E�E��E�E�E
  longBreakInterval: number;  // 長ぁE���Eの間隔
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

## 🔧 状態管琁E��訁E

### 1. Timer Store�E�Eustand�E�E

```typescript
// src/stores/useTimerStore.ts
interface TimerState {
  // チE�Eタ
  timers: Timer[];
  activeTimer: Timer | null;
  sessions: TimerSession[];
  
  // UI状慁E
  loading: boolean;
  error: string | null;
  
  // 統訁E
  todayStats: DayStats;
  weekStats: WeekStats;
}

interface TimerActions {
  // タイマ�E管琁E
  createTimer: (timer: Omit<Timer, 'id'>) => void;
  updateTimer: (id: string, updates: Partial<Timer>) => void;
  deleteTimer: (id: string) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  stopTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  
  // セチE��ョン管琁E
  startSession: (timerId: string) => void;
  endSession: (sessionId: string, data: Partial<TimerSession>) => void;
  
  // チE�Eタ管琁E
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
  // 外観設宁E
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  displayMode: 'digital' | 'analog' | 'both';
  
  // 通知設宁E
  notifications: NotificationSettings;
  
  // ポモド�Eロ設宁E
  pomodoro: PomodoroSettings;
  
  // ショートカチE��
  shortcuts: { [action: string]: string };
  
  // 一般設宁E
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

## 🎨 UI/UX 実裁E��細

### 1. タイマ�E表示コンポ�EネンチE

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
  // 実裁E��細
};
```

### 2. 進捗リングコンポ�EネンチE

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

### 3. レスポンシブ対忁E

```typescript
// MUIのチE�Eマ拡張
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
          // チE��クトッチE 褁E��表示対忁E
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

## ⏰ タイマ�E機�E実裁E

### 1. 高精度タイマ�Eフック

```typescript
// src/hooks/useTimer.ts
interface UseTimerOptions {
  onTick?: (remaining: number) => void;
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  precision?: number;        // ミリ秒単位�E精度
}

export const useTimer = (
  initialDuration: number,
  options: UseTimerOptions = {}
) => {
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Web Workers使用による高精度タイマ�E
  const workerRef = useRef<Worker>();
  
  useEffect(() => {
    // Timer Workerの初期匁E
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
  
  // タイマ�E操作メソチE��
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
  
  // そ�E他�EメソチE��...
  
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

### 2. Timer Worker�E�高精度処琁E��E

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

## 🔔 通知シスチE��

### 1. 通知管琁E��チE��

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

### 2. 音声通知シスチE��

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
      console.error('音声ファイルの読み込みに失敁E', error);
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

## 💾 チE�Eタ永続化

### 1. IndexedDB管琁E

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

// チE�Eタ操作�Eルパ�E
export const timerPersistence = {
  // タイマ�E操佁E
  async saveTimer(timer: Timer): Promise<void> {
    await db.timers.put(timer);
  },
  
  async getTimers(): Promise<Timer[]> {
    return await db.timers.toArray();
  },
  
  async deleteTimer(id: string): Promise<void> {
    await db.timers.where('id').equals(id).delete();
  },
  
  // セチE��ョン操佁E
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
  
  // エクスポ�EチEインポ�EチE
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

## 📊 統計�E刁E��機�E

### 1. 統計計算ユーチE��リチE��

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
      const category = session.tags[0] || 'そ�E仁E;
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
      weeklyGoalProgress: 0 // 目標設定機�E実裁E��E
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

## 🎯 実裁E��ード�EチE�E

### Phase 1: Core MVP�E�E週間！E
1. **基本プロジェクト設宁E*
   - Vite + React + TypeScript環墁E��篁E
   - MUI v7設定、デザインシスチE��統吁E
   - Zustand状態管琁E��盤

2. **基本タイマ�E機�E**
   - シンプルなカウントダウンタイマ�E
   - 開姁E一時停止/停止/リセチE��
   - 基本皁E��通知�E�ブラウザ通知、E��声�E�E

3. **UI基盤**
   - レスポンシブレイアウチE
   - タイマ�E表示�E�デジタル�E�E
   - 基本皁E��設定画面

### Phase 2: Enhanced Features�E�E週間！E
1. **ポモド�Eロタイマ�E**
2. **褁E��タイマ�E管琁E*
3. **セチE��ョン記録・基本統訁E*
4. **チE�Eタ永続化�E�EndexedDB�E�E*
5. **エクスポ�EチEインポ�Eト機�E**

### Phase 3: Advanced Features�E�E週間！E
1. **詳細統計�E刁E��**
2. **目標設定�E達�E度管琁E*
3. **高度な通知設宁E*
4. **PWA対忁E*
5. **チ�Eム機�E基盤**

### Phase 4: Polish & Optimization�E�E週間！E
1. **パフォーマンス最適匁E*
2. **アクセシビリチE��向丁E*
3. **ユーザビリチE��チE��ト�E改喁E*
4. **ドキュメント整傁E*

---

こ�E技術仕様書に基づぁE��、段階的な実裁E��進めてぁE��ます。Phase 1のMVPから始めて、ユーザーフィードバチE��を収雁E��ながら機�Eを拡張してぁE��予定です、E

