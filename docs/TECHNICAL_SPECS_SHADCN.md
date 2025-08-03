# タイマーアプリケーション 技術仕様書（shadcn/ui版）

## 📋 システム構成

### アーキテクチャ概要

```text
src/
├── app/                         # App Router（Next.js風）
│   ├── globals.css             # Tailwind + shadcn/ui スタイル
│   ├── layout.tsx              # ルートレイアウト
│   └── page.tsx                # メインページ
├── components/
│   ├── ui/                     # shadcn/ui コンポーネント
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── progress.tsx
│   │   ├── slider.tsx
│   │   └── ...
│   ├── layout/                 # レイアウトコンポーネント
│   └── timer/                  # タイマー専用コンポーネント
├── features/
│   ├── timer/                  # 基本タイマー機能
│   ├── pomodoro/              # ポモドーロタイマー
│   ├── multi-timer/           # 複数タイマー管理
│   ├── analytics/             # 統計・分析
│   └── settings/              # 設定管理
├── hooks/                     # 共通カスタムフック
├── stores/                    # Zustand状態管理
├── lib/                       # ユーティリティ・設定
│   ├── utils.ts              # cn()などユーティリティ
│   ├── database.ts           # IndexedDB管理
│   └── constants.ts          # 定数定義
└── types/                     # TypeScript型定義
```

**技術スタック**: React 18 + TypeScript 5 + Vite 5 + shadcn/ui + Tailwind CSS + Zustand 4

---

## 🎯 shadcn/ui コンポーネント設計

### 1. 使用するshadcn/uiコンポーネント

```bash
# 必須コンポーネント
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card  
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add select
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add badge
```

### 2. Timer Feature Structure（shadcn/ui版）

```typescript
// src/features/timer/
├── components/
│   ├── timer-display.tsx       # メインタイマー表示
│   ├── timer-controls.tsx      # 操作ボタン群
│   ├── timer-settings.tsx      # 設定ダイアログ
│   ├── digital-display.tsx     # デジタル時計表示
│   ├── analog-display.tsx      # アナログ時計表示
│   ├── progress-ring.tsx       # 進捗リング
│   └── notification-settings.tsx # 通知設定
├── hooks/
│   ├── use-timer.ts            # タイマーロジック
│   ├── use-notification.ts     # 通知管理
│   └── use-audio.ts           # 音声管理
├── stores/
│   ├── timer-store.ts          # タイマー状態
│   └── timer-settings-store.ts # 設定状態
└── types.ts                   # 型定義
```

### 3. 主要型定義（shadcn/ui版）

```typescript
// src/types/timer.ts
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
  theme: TimerTheme;           // shadcn/ui テーマ
  notificationEnabled: boolean;
  soundEnabled: boolean;
  soundFile?: string;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerTheme {
  color: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  variant: 'default' | 'outline' | 'ghost';
  size: 'default' | 'sm' | 'lg' | 'icon';
}

export interface PomodoroSettings {
  workDuration: number;          // 作業時間（分）
  shortBreakDuration: number;    // 短い休憩（分）
  longBreakDuration: number;     // 長い休憩（分）
  longBreakInterval: number;     // 長い休憩の間隔
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  theme: {
    work: string;              // 作業時のテーマ色
    shortBreak: string;        // 短休憩時のテーマ色
    longBreak: string;         // 長休憩時のテーマ色
  };
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  browser: boolean;
  soundVolume: number;
  customSounds: { [key: string]: string };
  vibration: boolean;            // モバイル用
}
```

---

## 🎨 UI実装詳細（shadcn/ui）

### 1. メインタイマーコンポーネント

```typescript
// src/features/timer/components/timer-display.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { useTimer } from "../hooks/use-timer";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  timer: Timer;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TimerDisplay({ timer, className, size = 'lg' }: TimerDisplayProps) {
  const { 
    timeRemaining, 
    isRunning, 
    isPaused, 
    start, 
    pause, 
    stop, 
    reset,
    progress 
  } = useTimer(timer);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{timer.name}</CardTitle>
          <Badge variant={timer.status === 'running' ? 'default' : 'secondary'}>
            {timer.status === 'running' ? '実行中' : 
             timer.status === 'paused' ? '一時停止' : 
             timer.status === 'completed' ? '完了' : '待機'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 時間表示 */}
        <div className="text-center space-y-2">
          <div className={cn(
            "font-mono font-bold tracking-wider",
            size === 'lg' && "text-4xl md:text-6xl",
            size === 'md' && "text-2xl md:text-4xl", 
            size === 'sm' && "text-xl md:text-2xl"
          )}>
            {formatTime(timeRemaining)}
          </div>
          
          {/* 進捗バー */}
          <Progress 
            value={progress} 
            className="h-2"
            indicatorClassName={cn(
              timer.status === 'running' && "bg-primary",
              timer.status === 'paused' && "bg-yellow-500",
              timer.status === 'completed' && "bg-green-500"
            )}
          />
          
          <p className="text-sm text-muted-foreground">
            {Math.round(progress)}% 完了
          </p>
        </div>

        {/* 操作ボタン */}
        <div className="flex justify-center gap-2">
          {!isRunning ? (
            <Button 
              onClick={start} 
              size="lg"
              className="px-8"
            >
              <Play className="mr-2 h-4 w-4" />
              開始
            </Button>
          ) : (
            <Button 
              onClick={pause} 
              variant="outline" 
              size="lg"
              className="px-8"
            >
              <Pause className="mr-2 h-4 w-4" />
              一時停止
            </Button>
          )}
          
          <Button 
            onClick={stop} 
            variant="destructive" 
            size="lg"
          >
            <Square className="mr-2 h-4 w-4" />
            停止
          </Button>
          
          <Button 
            onClick={reset} 
            variant="outline" 
            size="lg"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            リセット
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2. 進捗リングコンポーネント（Tailwind CSS）

```typescript
// src/features/timer/components/progress-ring.tsx
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number;              // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
  color?: 'primary' | 'secondary' | 'destructive' | 'success';
}

export function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  className,
  showPercentage = true,
  animated = true,
  color = 'primary'
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    primary: 'stroke-primary',
    secondary: 'stroke-secondary', 
    destructive: 'stroke-destructive',
    success: 'stroke-green-500'
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 背景リング */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        
        {/* 進捗リング */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            colorClasses[color],
            animated && "transition-all duration-300 ease-in-out"
          )}
        />
      </svg>
      
      {/* 中央のパーセンテージ表示 */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}
```

### 3. 設定ダイアログ（shadcn/ui）

```typescript
// src/features/timer/components/timer-settings.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";

interface TimerSettingsProps {
  settings: NotificationSettings;
  onSettingsChange: (settings: Partial<NotificationSettings>) => void;
}

export function TimerSettings({ settings, onSettingsChange }: TimerSettingsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>タイマー設定</DialogTitle>
          <DialogDescription>
            通知や音声などの設定を変更できます。
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">通知</TabsTrigger>
            <TabsTrigger value="audio">音声</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="browser-notifications">ブラウザ通知</Label>
              <Switch
                id="browser-notifications"
                checked={settings.browser}
                onCheckedChange={(checked) => 
                  onSettingsChange({ browser: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="vibration">バイブレーション</Label>
              <Switch
                id="vibration"
                checked={settings.vibration}
                onCheckedChange={(checked) => 
                  onSettingsChange({ vibration: checked })
                }
              />
            </div>
          </TabsContent>
          
          <TabsContent value="audio" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound">音声通知</Label>
              <Switch
                id="sound"
                checked={settings.sound}
                onCheckedChange={(checked) => 
                  onSettingsChange({ sound: checked })
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label>音量: {settings.soundVolume}%</Label>
              <Slider
                value={[settings.soundVolume]}
                onValueChange={([value]) => 
                  onSettingsChange({ soundVolume: value })
                }
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔧 Tailwind CSS 設定

### 1. tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // タイマー専用カラー
        timer: {
          work: "hsl(220, 98%, 61%)",
          break: "hsl(142, 71%, 45%)",
          longBreak: "hsl(262, 83%, 58%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        // タイマー専用アニメーション
        "timer-pulse": {
          "0%, 100%": { 
            opacity: 1,
            transform: "scale(1)" 
          },
          "50%": { 
            opacity: 0.8,
            transform: "scale(1.05)" 
          },
        },
        "progress-fill": {
          "0%": { 
            strokeDasharray: "0 100" 
          },
          "100%": { 
            strokeDasharray: "100 0" 
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "timer-pulse": "timer-pulse 2s ease-in-out infinite",
        "progress-fill": "progress-fill 1s ease-in-out",
      },
      // タイマー用のフォントサイズ
      fontSize: {
        'timer-xl': ['4rem', { lineHeight: '1' }],
        'timer-2xl': ['6rem', { lineHeight: '1' }],
        'timer-3xl': ['8rem', { lineHeight: '1' }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 2. globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* タイマー専用スタイル */
@layer components {
  .timer-display {
    @apply font-mono font-bold tracking-wider;
  }
  
  .timer-glow {
    @apply shadow-lg shadow-primary/25;
  }
  
  .timer-running {
    @apply animate-timer-pulse;
  }
}
```

---

## 🚀 プロジェクト初期化手順（shadcn/ui）

### 1. 基本セットアップ

```bash
# 1. Tailwind CSS とshadcn/ui初期化
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 2. shadcn/ui初期化
npx shadcn-ui@latest init

# 3. 必要なコンポーネントを追加
npx shadcn-ui@latest add button card dialog progress slider switch tabs input label toast dropdown-menu sheet separator badge

# 4. 追加ライブラリ
npm install zustand lucide-react date-fns class-variance-authority clsx tailwind-merge
npm install -D @types/node
```

### 2. ディレクトリ構造作成

```bash
mkdir -p src/{components/ui,features/timer,hooks,stores,lib,types}
mkdir -p src/features/timer/{components,hooks,stores}
mkdir -p src/components/{layout,timer}
```

---

## 🎯 実装優先度（shadcn/ui版）

### Phase 1: MVP（2週間）
1. **shadcn/ui環境構築**
   - Tailwind CSS + shadcn/ui設定
   - 基本コンポーネント導入
   - レスポンシブレイアウト

2. **基本タイマー機能**
   - TimerDisplayコンポーネント
   - 基本的な操作（開始/停止/リセット）
   - 進捗表示（Progress + ProgressRing）

3. **設定・通知システム**
   - 設定ダイアログ
   - ブラウザ通知
   - 音声通知基盤

### Phase 2: Enhanced Features（3週間）
1. **ポモドーロタイマー**
2. **複数タイマー管理**
3. **Toast通知システム**
4. **テーマシステム（Dark/Light）**

### Phase 3: Advanced Features（4週間）
1. **統計ダッシュボード**
2. **データエクスポート**
3. **PWA対応**
4. **アクセシビリティ向上**

---

この技術仕様書により、shadcn/ui + Tailwind CSSベースの現代的なタイマーアプリケーションを構築できます。美しいデザインシステムと高いカスタマイズ性を両立できます。
