# 繧ｿ繧､繝槭・繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ 謚陦謎ｻ墓ｧ俶嶌

## 搭 繧ｷ繧ｹ繝・Β讒区・

### 繧｢繝ｼ繧ｭ繝・け繝√Ε讎りｦ・
```
src/
笏懌楳笏 features/
笏・  笏懌楳笏 timer/                     # 蝓ｺ譛ｬ繧ｿ繧､繝槭・讖溯・
笏・  笏懌楳笏 pomodoroTimer/            # 繝昴Δ繝峨・繝ｭ繧ｿ繧､繝槭・
笏・  笏懌楳笏 multiTimer/               # 隍・焚繧ｿ繧､繝槭・邂｡逅・
笏・  笏懌楳笏 analytics/                # 邨ｱ險医・蛻・梵
笏・  笏懌楳笏 settings/                 # 險ｭ螳夂ｮ｡逅・
笏・  笏披楳笏 teamTimer/               # 繝√・繝讖溯・・・hase 3・・
笏懌楳笏 components/
笏・  笏懌楳笏 layout/                   # 譌｢蟄倥Ξ繧､繧｢繧ｦ繝域ｴｻ逕ｨ
笏・  笏懌楳笏 ui/                      # 蝓ｺ譛ｬUI繧ｳ繝ｳ繝昴・繝阪Φ繝・
笏・  笏披楳笏 timer/                   # 繧ｿ繧､繝槭・蟆ら畑繧ｳ繝ｳ繝昴・繝阪Φ繝・
笏懌楳笏 hooks/                       # 蜈ｱ騾壹き繧ｹ繧ｿ繝繝輔ャ繧ｯ
笏懌楳笏 stores/                      # Zustand迥ｶ諷狗ｮ｡逅・
笏懌楳笏 utils/                       # 繝ｦ繝ｼ繝・ぅ繝ｪ繝・ぅ髢｢謨ｰ
笏懌楳笏 types/                       # TypeScript蝙句ｮ夂ｾｩ
笏披楳笏 constants/                   # 螳壽焚繝ｻ險ｭ螳壼､
```

---

## 識 繧ｳ繝ｳ繝昴・繝阪Φ繝郁ｨｭ險・

### 1. Timer Feature Structure

```typescript
// src/features/timer/
笏懌楳笏 Timer.tsx                    # 繝｡繧､繝ｳ繝壹・繧ｸ
笏懌楳笏 TimerDisplay.tsx            # 繧ｿ繧､繝槭・陦ｨ遉ｺ繧ｳ繝ｳ繝昴・繝阪Φ繝・
笏懌楳笏 TimerControls.tsx           # 謫堺ｽ懊さ繝ｳ繝医Ο繝ｼ繝ｫ
笏懌楳笏 TimerSettings.tsx           # 險ｭ螳夂判髱｢
笏懌楳笏 components/
笏・  笏懌楳笏 DigitalDisplay.tsx      # 繝・ず繧ｿ繝ｫ陦ｨ遉ｺ
笏・  笏懌楳笏 AnalogDisplay.tsx       # 繧｢繝翫Ο繧ｰ陦ｨ遉ｺ
笏・  笏懌楳笏 ProgressRing.tsx        # 騾ｲ謐励Μ繝ｳ繧ｰ
笏・  笏懌楳笏 NotificationSettings.tsx # 騾夂衍險ｭ螳・
笏・  笏披楳笏 SoundSelector.tsx       # 髻ｳ螢ｰ驕ｸ謚・
笏懌楳笏 hooks/
笏・  笏懌楳笏 useTimer.ts             # 繧ｿ繧､繝槭・繝ｭ繧ｸ繝・け
笏・  笏懌楳笏 useNotification.ts      # 騾夂衍邂｡逅・
笏・  笏披楳笏 useAudio.ts            # 髻ｳ螢ｰ邂｡逅・
笏懌楳笏 stores/
笏・  笏懌楳笏 useTimerStore.ts        # 繧ｿ繧､繝槭・迥ｶ諷・
笏・  笏披楳笏 useTimerSettingsStore.ts # 險ｭ螳夂憾諷・
笏懌楳笏 constants/
笏・  笏披楳笏 timerConstants.ts       # 繧ｿ繧､繝槭・髢｢騾｣螳壽焚
笏披楳笏 types/
    笏披楳笏 timer.types.ts          # 蝙句ｮ夂ｾｩ
```

### 2. 荳ｻ隕∝梛螳夂ｾｩ

```typescript
// src/types/timer.types.ts
export interface Timer {
  id: string;
  name: string;
  duration: number;            // 遘貞腰菴・
  remainingTime: number;       // 谿九ｊ譎る俣
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
  rating?: number;           // 1-5谿ｵ髫手ｩ穂ｾ｡
  tags: string[];
}

export interface PomodoroSettings {
  workDuration: number;      // 菴懈･ｭ譎る俣・亥・・・
  shortBreakDuration: number; // 遏ｭ縺・ｼ第・・亥・・・
  longBreakDuration: number;  // 髟ｷ縺・ｼ第・・亥・・・
  longBreakInterval: number;  // 髟ｷ縺・ｼ第・縺ｮ髢馴囈
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  browser: boolean;
  soundVolume: number;
  customSounds: { [key: string]: string };
  vibration: boolean;        // 繝｢繝舌う繝ｫ逕ｨ
}
```

---

## 肌 迥ｶ諷狗ｮ｡逅・ｨｭ險・

### 1. Timer Store・・ustand・・

```typescript
// src/stores/useTimerStore.ts
interface TimerState {
  // 繝・・繧ｿ
  timers: Timer[];
  activeTimer: Timer | null;
  sessions: TimerSession[];
  
  // UI迥ｶ諷・
  loading: boolean;
  error: string | null;
  
  // 邨ｱ險・
  todayStats: DayStats;
  weekStats: WeekStats;
}

interface TimerActions {
  // 繧ｿ繧､繝槭・邂｡逅・
  createTimer: (timer: Omit<Timer, 'id'>) => void;
  updateTimer: (id: string, updates: Partial<Timer>) => void;
  deleteTimer: (id: string) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  stopTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  
  // 繧ｻ繝・す繝ｧ繝ｳ邂｡逅・
  startSession: (timerId: string) => void;
  endSession: (sessionId: string, data: Partial<TimerSession>) => void;
  
  // 繝・・繧ｿ邂｡逅・
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
  // 螟冶ｦｳ險ｭ螳・
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  displayMode: 'digital' | 'analog' | 'both';
  
  // 騾夂衍險ｭ螳・
  notifications: NotificationSettings;
  
  // 繝昴Δ繝峨・繝ｭ險ｭ螳・
  pomodoro: PomodoroSettings;
  
  // 繧ｷ繝ｧ繝ｼ繝医き繝・ヨ
  shortcuts: { [action: string]: string };
  
  // 荳闊ｬ險ｭ螳・
  autoSave: boolean;
  dataRetention: number;     // 譌･謨ｰ
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

## 耳 UI/UX 螳溯｣・ｩｳ邏ｰ

### 1. 繧ｿ繧､繝槭・陦ｨ遉ｺ繧ｳ繝ｳ繝昴・繝阪Φ繝・

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
  // 螳溯｣・ｩｳ邏ｰ
};
```

### 2. 騾ｲ謐励Μ繝ｳ繧ｰ繧ｳ繝ｳ繝昴・繝阪Φ繝・

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

### 3. 繝ｬ繧ｹ繝昴Φ繧ｷ繝門ｯｾ蠢・

```typescript
// MUI縺ｮ繝・・繝樊僑蠑ｵ
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
          // 繝｢繝舌う繝ｫ: 繧ｷ繝ｳ繧ｰ繝ｫ陦ｨ遉ｺ
          [theme.breakpoints.down('md')]: {
            fontSize: '3rem',
            padding: theme.spacing(2),
          },
          // 繝・せ繧ｯ繝医ャ繝・ 隍・焚陦ｨ遉ｺ蟇ｾ蠢・
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

## 竢ｰ 繧ｿ繧､繝槭・讖溯・螳溯｣・

### 1. 鬮倡ｲｾ蠎ｦ繧ｿ繧､繝槭・繝輔ャ繧ｯ

```typescript
// src/hooks/useTimer.ts
interface UseTimerOptions {
  onTick?: (remaining: number) => void;
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  precision?: number;        // 繝溘Μ遘貞腰菴阪・邊ｾ蠎ｦ
}

export const useTimer = (
  initialDuration: number,
  options: UseTimerOptions = {}
) => {
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Web Workers菴ｿ逕ｨ縺ｫ繧医ｋ鬮倡ｲｾ蠎ｦ繧ｿ繧､繝槭・
  const workerRef = useRef<Worker>();
  
  useEffect(() => {
    // Timer Worker縺ｮ蛻晄悄蛹・
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
  
  // 繧ｿ繧､繝槭・謫堺ｽ懊Γ繧ｽ繝・ラ
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
  
  // 縺昴・莉悶・繝｡繧ｽ繝・ラ...
  
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

### 2. Timer Worker・磯ｫ倡ｲｾ蠎ｦ蜃ｦ逅・ｼ・

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

## 粕 騾夂衍繧ｷ繧ｹ繝・Β

### 1. 騾夂衍邂｡逅・ヵ繝・け

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
      
      // 閾ｪ蜍暮哩縺倥ｋ
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

### 2. 髻ｳ螢ｰ騾夂衍繧ｷ繧ｹ繝・Β

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
      console.error('髻ｳ螢ｰ繝輔ぃ繧､繝ｫ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨・', error);
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

## 沈 繝・・繧ｿ豌ｸ邯壼喧

### 1. IndexedDB邂｡逅・

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

// 繝・・繧ｿ謫堺ｽ懊・繝ｫ繝代・
export const timerPersistence = {
  // 繧ｿ繧､繝槭・謫堺ｽ・
  async saveTimer(timer: Timer): Promise<void> {
    await db.timers.put(timer);
  },
  
  async getTimers(): Promise<Timer[]> {
    return await db.timers.toArray();
  },
  
  async deleteTimer(id: string): Promise<void> {
    await db.timers.where('id').equals(id).delete();
  },
  
  // 繧ｻ繝・す繝ｧ繝ｳ謫堺ｽ・
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
  
  // 繧ｨ繧ｯ繧ｹ繝昴・繝・繧､繝ｳ繝昴・繝・
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

## 投 邨ｱ險医・蛻・梵讖溯・

### 1. 邨ｱ險郁ｨ育ｮ励Θ繝ｼ繝・ぅ繝ｪ繝・ぅ

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
      const category = session.tags[0] || '縺昴・莉・;
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
      weeklyGoalProgress: 0 // 逶ｮ讓呵ｨｭ螳壽ｩ溯・螳溯｣・ｾ・
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

## 識 螳溯｣・Ο繝ｼ繝峨・繝・・

### Phase 1: Core MVP・・騾ｱ髢難ｼ・
1. **蝓ｺ譛ｬ繝励Ο繧ｸ繧ｧ繧ｯ繝郁ｨｭ螳・*
   - Vite + React + TypeScript迺ｰ蠅・ｧ狗ｯ・
   - MUI v7險ｭ螳壹√ョ繧ｶ繧､繝ｳ繧ｷ繧ｹ繝・Β邨ｱ蜷・
   - Zustand迥ｶ諷狗ｮ｡逅・渕逶､

2. **蝓ｺ譛ｬ繧ｿ繧､繝槭・讖溯・**
   - 繧ｷ繝ｳ繝励Ν縺ｪ繧ｫ繧ｦ繝ｳ繝医ム繧ｦ繝ｳ繧ｿ繧､繝槭・
   - 髢句ｧ・荳譎ょ●豁｢/蛛懈ｭ｢/繝ｪ繧ｻ繝・ヨ
   - 蝓ｺ譛ｬ逧・↑騾夂衍・医ヶ繝ｩ繧ｦ繧ｶ騾夂衍縲・浹螢ｰ・・

3. **UI蝓ｺ逶､**
   - 繝ｬ繧ｹ繝昴Φ繧ｷ繝悶Ξ繧､繧｢繧ｦ繝・
   - 繧ｿ繧､繝槭・陦ｨ遉ｺ・医ョ繧ｸ繧ｿ繝ｫ・・
   - 蝓ｺ譛ｬ逧・↑險ｭ螳夂判髱｢


---

## 📚 仕様管理の責務分離（Spec Kit導入）

- 仕様の正本（Normative）は `.specify/` で管理し、CIで整合性を検証する。
- 本書を含む `docs/` は実装背景・技術解説・運用ガイドなどの説明資料（Informative）を担当する。
- 実装差分を伴うPRでは、該当Specパスを明示し、必要に応じて `docs/` 側の説明も更新する。
### Phase 2: Enhanced Features・・騾ｱ髢難ｼ・
1. **繝昴Δ繝峨・繝ｭ繧ｿ繧､繝槭・**
2. **隍・焚繧ｿ繧､繝槭・邂｡逅・*
3. **繧ｻ繝・す繝ｧ繝ｳ險倬鹸繝ｻ蝓ｺ譛ｬ邨ｱ險・*
4. **繝・・繧ｿ豌ｸ邯壼喧・・ndexedDB・・*
5. **繧ｨ繧ｯ繧ｹ繝昴・繝・繧､繝ｳ繝昴・繝域ｩ溯・**

### Phase 3: Advanced Features・・騾ｱ髢難ｼ・
1. **隧ｳ邏ｰ邨ｱ險医・蛻・梵**
2. **逶ｮ讓呵ｨｭ螳壹・驕疲・蠎ｦ邂｡逅・*
3. **鬮伜ｺｦ縺ｪ騾夂衍險ｭ螳・*
4. **PWA蟇ｾ蠢・*
5. **繝√・繝讖溯・蝓ｺ逶､**

### Phase 4: Polish & Optimization・・騾ｱ髢難ｼ・
1. **繝代ヵ繧ｩ繝ｼ繝槭Φ繧ｹ譛驕ｩ蛹・*
2. **繧｢繧ｯ繧ｻ繧ｷ繝薙Μ繝・ぅ蜷台ｸ・*
3. **繝ｦ繝ｼ繧ｶ繝薙Μ繝・ぅ繝・せ繝医・謾ｹ蝟・*
4. **繝峨く繝･繝｡繝ｳ繝域紛蛯・*

---

縺薙・謚陦謎ｻ墓ｧ俶嶌縺ｫ蝓ｺ縺･縺・※縲∵ｮｵ髫守噪縺ｪ螳溯｣・ｒ騾ｲ繧√※縺・″縺ｾ縺吶１hase 1縺ｮMVP縺九ｉ蟋九ａ縺ｦ縲√Θ繝ｼ繧ｶ繝ｼ繝輔ぅ繝ｼ繝峨ヰ繝・け繧貞庶髮・＠縺ｪ縺後ｉ讖溯・繧呈僑蠑ｵ縺励※縺・￥莠亥ｮ壹〒縺吶・

