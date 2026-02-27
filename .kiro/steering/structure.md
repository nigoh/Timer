# Project Structure

## Organization Philosophy

Feature-first + Layered 方式。全機能は `src/features/timer/` 配下に集約し、
各層（stores / components / containers / services / hooks / utils）で責務を分離する。
共通 UI プリミティブは `src/components/ui/` に配置し、ドメイン型は `src/types/` を正本とする。

## Directory Patterns

### Feature Domain
**Location**: `src/features/timer/`  
**Purpose**: タイマー関連の全機能を格納する唯一のフィーチャードメイン  
**Example**: `stores/agenda-timer-store.ts`, `components/agenda/AgendaView.tsx`

### Zustand Stores
**Location**: `src/features/timer/stores/`  
**Purpose**: ドメイン状態管理。State / Actions を interface で明示し、公開 API を固定化  
**Example**: `basic-timer-store.ts`, `pomodoro-store.ts`, `meeting-knowledge-store.ts`

### View Components
**Location**: `src/features/timer/components/{feature}/`  
**Purpose**: 機能別の表示ロジック。ビジネスロジックは含まない  
**Example**: `components/agenda/AgendaTimerView.tsx`, `components/pomodoro/PomodoroView.tsx`

### Smart Containers
**Location**: `src/features/timer/containers/`  
**Purpose**: ストア接続・データ取得の配線専用。表示ロジックは持たない  
**Example**: `AgendaTimerContainer.tsx`

### Services
**Location**: `src/features/timer/services/`  
**Purpose**: 副作用を伴うビジネスロジック（AI API・分析集計・音声認識）  
**Example**: `meeting-ai-assist-service.ts`, `analytics.ts`

### Domain Types
**Location**: `src/types/`  
**Purpose**: ドメイン型の正本。同等型の再定義禁止  
**Example**: `agenda.ts`, `timer.ts`, `pomodoro.ts`, `meetingReport.ts`

### Shared UI
**Location**: `src/components/ui/`  
**Purpose**: shadcn/ui + Radix UI のプリミティブラッパー  
**Example**: `button.tsx`, `dialog.tsx`, `tabs.tsx`

### Utilities
**Location**: `src/utils/`  
**Purpose**: 横断的ユーティリティ（ログ・通知・カラーモード）  
**Example**: `logger.ts`, `notification-manager.ts`

## Naming Conventions

- **Files**: コンポーネントは `PascalCase.tsx`、ストア/サービスは `kebab-case.ts`
- **Components**: PascalCase（`AgendaTimerView`, `KpiCard`）
- **Functions**: camelCase（`startTimer`, `generateReport`）
- **Types/Interfaces**: PascalCase（`Meeting`, `PomodoroState`）
- **Store**: `use{Feature}Store` パターン（`useAgendaTimerStore`）

## Import Organization

```typescript
// 1. External libraries
import { create } from 'zustand';
import { Button } from '@radix-ui/themes';

// 2. Absolute imports (@ alias)
import { Meeting } from '@/types/agenda';
import { logger } from '@/utils/logger';

// 3. Relative imports
import { AgendaItemRow } from './AgendaItemRow';
```

**Path Aliases**:
- `@/`: `src/` にマッピング

## Code Organization Principles

- **ストア責務分離**: UI から直接 `localStorage` / 通知 API を叩かない。ストアまたはユーティリティ経由
- **最小差分更新**: Zustand `set` は必要なプロパティのみ更新
- **単一責務ストア**: 同一機能の重複ストア禁止
- **型安全性**: `any` 禁止。union / type guard を使用
- **containers は配線専用**: 表示ロジックは `components/*View.tsx` に分離

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
_updated_at: 2026-02-27_
