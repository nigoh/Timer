# Firebase × React アーキテクチャガイド

「保守しやすく・関心の分離が効く」構成指針

> Firebase をコンポーネントの中で直接ベタ書きするのは、むき出し配線の家で暮らすようなもの——動くけど、後で泣きを見る。ちゃんと配線ダクトを引きましょう。

## 🎯 設計原則

### 1. 基本原則

- **「UIはFirebaseを知らない」**：UI層はただデータ/コールバックを受け取るだけ
- **「ドメイン型と変換ロジックを境界に置く」**：Firestoreドキュメント ↔ Domain Model変換を一ヶ所に集約
- **「サーバー寄せ（Cloud Functions/Rules）でビジネスルールを収束」**：クライアント肥大化を防ぎ、セキュアに

### 2. レイヤー構造と依存方向

```text
[ Presentational UI Components ]
        ↓ (props)
[ Feature Components / Hooks (useXxx) ]
        ↓
[ Domain Services / Use Cases ]
        ↓ (interface呼び出し)
[ Repository Interfaces (port) ]
        ↓ (adapter実装)
[ Firebase Adapter Layer (Firestore/Auth/Storage wrapper) ]
        ↓
[ Firebase SDK / Cloud Functions / Security Rules ]
```

## 📁 現在のディレクトリ構造分析

### ✅ 現状の良い点

```text
src/
├── auth/
│   ├── firebase.ts          # ✅ Firebase初期化が集約されている
│   ├── context.tsx          # ✅ Auth状態管理
│   └── stores/              # ✅ 認証状態のZustand管理
├── models/                  # ✅ Domain型定義が統一されている
│   ├── User.ts              # ✅ 統一ユーザーモデル
│   ├── Expense.ts           # ✅ 経費ドメインモデル
│   ├── Permission.ts        # ✅ 権限管理モデル
│   └── UserClaims.ts        # ✅ Firebase Custom Claims対応
├── services/                # ✅ ドメインサービス層
│   ├── userService.ts       # ✅ ユーザー操作の統一化
│   └── permissionService.ts # ✅ 権限管理サービス
└── features/                # ✅ 機能別分割
    ├── expense/
    │   ├── useExpenseStore.ts            # ✅ Zustand状態管理
    │   ├── services/expenseFirebaseService.ts # ✅ Firebase操作分離
    │   └── hooks/useExpenseForm.ts       # ✅ React Hooks層
    └── [other features]/
```

### ⚠️ 改善が必要な点

#### 1. Firebase依存の散在

```typescript
// ❌ 現状：各サービスでFirebase直接import
import { collection, doc, getDocs } from 'firebase/firestore';
import { db } from '../../../auth/firebase';

// ✅ 改善後：Repository Interface経由
interface ExpenseRepository {
  findByUserId(userId: string): Promise<Expense[]>;
  save(expense: Expense): Promise<string>;
}
```

#### 2. パス文字列の散在

```typescript
// ❌ 現状：各所でコレクション名ハードコード
collection(db, 'expenses')
collection(db, 'users')

// ✅ 改善後：ref関数で統一
export const colExpenses = () => collection(db, 'expenses');
export const docExpense = (id: string) => doc(db, 'expenses', id);
```

## 🔧 推奨アーキテクチャ実装

### 1. Firebase Adapter Layer

```typescript
// src/libs/firebase/refs.ts
import { collection, doc, type CollectionReference, type DocumentReference } from 'firebase/firestore';
import { db } from '../../auth/firebase';
import type { ExpenseEntry, User, UserClaimsDocument } from '../../models';

// コレクション参照の統一管理
export const colUsers = (): CollectionReference<User> => 
  collection(db, 'users') as CollectionReference<User>;

export const colExpenses = (): CollectionReference<ExpenseEntry> => 
  collection(db, 'expenses') as CollectionReference<ExpenseEntry>;

export const colUserClaims = (): CollectionReference<UserClaimsDocument> => 
  collection(db, 'user_claims') as CollectionReference<UserClaimsDocument>;

export const colPermissionRequests = () => collection(db, 'permissionRequests');
export const colExpenseAttachments = () => collection(db, 'expenseAttachments');

// ドキュメント参照の統一管理
export const docUser = (uid: string): DocumentReference<User> => 
  doc(colUsers(), uid);

export const docExpense = (id: string): DocumentReference<ExpenseEntry> => 
  doc(colExpenses(), id);

export const docUserClaims = (uid: string): DocumentReference<UserClaimsDocument> => 
  doc(colUserClaims(), uid);
```

### 2. Repository Interface定義

```typescript
// src/domain/expense/repository.ts
export interface ExpenseRepository {
  // 基本CRUD
  findById(id: string): Promise<ExpenseEntry | null>;
  findByUserId(userId: string): Promise<ExpenseEntry[]>;
  save(expense: CreateExpenseData): Promise<string>;
  update(id: string, expense: UpdateExpenseData): Promise<void>;
  delete(id: string): Promise<void>;
  
  // 検索・フィルタリング
  findByStatus(userId: string, status: ExpenseStatus): Promise<ExpenseEntry[]>;
  findByDateRange(userId: string, start: Date, end: Date): Promise<ExpenseEntry[]>;
  
  // リアルタイム購読
  subscribe(userId: string, callback: (expenses: ExpenseEntry[]) => void): () => void;
  
  // 統計・集計
  getMonthlyTotal(userId: string, year: number, month: number): Promise<number>;
}
```

### 3. Firebase Repository実装

```typescript
// src/libs/repositories/expense.firebase.ts
import { ExpenseRepository } from '../../domain/expense/repository';
import { colExpenses, docExpense } from '../firebase/refs';
import { expenseConverter } from '../converters/expense';

export const createExpenseRepositoryFirebase = (): ExpenseRepository => ({
  async findById(id: string) {
    const docRef = docExpense(id);
    const docSnap = await getDoc(docRef.withConverter(expenseConverter));
    return docSnap.exists() ? docSnap.data() : null;
  },

  async findByUserId(userId: string) {
    const q = query(
      colExpenses().withConverter(expenseConverter),
      where('userId', '==', userId),
      orderBy('expenseDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  },

  subscribe(userId: string, callback: (expenses: ExpenseEntry[]) => void) {
    const q = query(
      colExpenses().withConverter(expenseConverter),
      where('userId', '==', userId),
      orderBy('expenseDate', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => doc.data());
      callback(expenses);
    });
  },

  // ... 他のメソッド実装
});
```

### 4. Data Converter統一

```typescript
// src/libs/converters/expense.ts
import { FirestoreDataConverter, Timestamp } from 'firebase/firestore';
import type { ExpenseEntry } from '../../models';

export const expenseConverter: FirestoreDataConverter<ExpenseEntry> = {
  toFirestore(expense: ExpenseEntry) {
    return {
      ...expense,
      expenseDate: Timestamp.fromDate(expense.expenseDate),
      createdAt: Timestamp.fromDate(expense.createdAt),
      updatedAt: Timestamp.fromDate(expense.updatedAt),
      approvedAt: expense.approvedAt ? Timestamp.fromDate(expense.approvedAt) : null,
    };
  },

  fromFirestore(snapshot, options) {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      expenseDate: data.expenseDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      approvedAt: data.approvedAt?.toDate() || null,
    } as ExpenseEntry;
  }
};
```

### 5. Domain Service層

```typescript
// src/domain/expense/service.ts
import type { ExpenseRepository } from './repository';
import type { CreateExpenseData, UpdateExpenseData, ExpenseEntry } from '../../models';

export const createExpenseService = (repository: ExpenseRepository) => ({
  // ビジネスロジック込みの操作
  async createExpense(userId: string, data: CreateExpenseData): Promise<string> {
    // バリデーション
    if (data.amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    // ビジネスルール適用
    const expense: CreateExpenseData = {
      ...data,
      userId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return repository.save(expense);
  },

  async approveExpense(id: string, approverId: string): Promise<void> {
    const expense = await repository.findById(id);
    if (!expense) throw new Error('Expense not found');
    if (expense.status !== 'pending') throw new Error('Expense not in pending status');
    
    await repository.update(id, {
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    });
  },

  // 統計・レポート
  async getMonthlyExpenses(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return repository.findByDateRange(userId, start, end);
  },
});

export type ExpenseService = ReturnType<typeof createExpenseService>;
```

### 6. React Hooks層（TanStack Query統合）

```typescript
// src/domain/expense/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useExpenseService } from './context';
import type { CreateExpenseData, UpdateExpenseData } from '../../models';

export function useExpenses(userId: string) {
  const service = useExpenseService();
  
  return useQuery({
    queryKey: ['expenses', userId],
    queryFn: () => service.getUserExpenses(userId),
    enabled: !!userId,
  });
}

export function useExpenseSubscription(userId: string) {
  const queryClient = useQueryClient();
  const service = useExpenseService();
  
  React.useEffect(() => {
    if (!userId) return;
    
    const unsubscribe = service.subscribeToExpenses(userId, (expenses) => {
      queryClient.setQueryData(['expenses', userId], expenses);
    });
    
    return unsubscribe;
  }, [userId, service, queryClient]);
}

export function useCreateExpense() {
  const service = useExpenseService();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: CreateExpenseData }) =>
      service.createExpense(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
    },
  });
}
```

### 7. 依存性注入（DI）

```typescript
// src/domain/expense/context.tsx
import React from 'react';
import { createExpenseService, type ExpenseService } from './service';
import { createExpenseRepositoryFirebase } from '../../libs/repositories/expense.firebase';

const ExpenseServiceContext = React.createContext<ExpenseService | null>(null);

export function ExpenseServiceProvider({ children }: { children: React.ReactNode }) {
  const service = React.useMemo(() => {
    const repository = createExpenseRepositoryFirebase();
    return createExpenseService(repository);
  }, []);
  
  return (
    <ExpenseServiceContext.Provider value={service}>
      {children}
    </ExpenseServiceContext.Provider>
  );
}

export function useExpenseService() {
  const service = React.useContext(ExpenseServiceContext);
  if (!service) throw new Error('useExpenseService must be used within ExpenseServiceProvider');
  return service;
}
```

## 🧪 テスト戦略

### 1. レイヤー別テスト方針

| レイヤー | テスト種別 | ツール | Firebase依存 |
|---------|-----------|--------|-------------|
| Domain Service | Unit Test | Jest/Vitest | ❌ (Mock Repository) |
| Repository | Integration Test | Firebase Emulator | ✅ |
| Hooks | React Testing | @testing-library/react | ❌ (Mock Service) |
| E2E | Full Stack | Playwright | ✅ (Emulator) |

### 2. Mock Repository実装

```typescript
// src/libs/repositories/expense.memory.ts
export const createExpenseRepositoryMemory = (
  initialData: ExpenseEntry[] = []
): ExpenseRepository => {
  let expenses = [...initialData];
  let listeners: ((expenses: ExpenseEntry[]) => void)[] = [];
  
  return {
    async findByUserId(userId: string) {
      return expenses.filter(e => e.userId === userId);
    },
    
    async save(expense: CreateExpenseData) {
      const id = `expense_${Date.now()}`;
      const newExpense = { ...expense, id } as ExpenseEntry;
      expenses.push(newExpense);
      listeners.forEach(listener => listener(expenses));
      return id;
    },
    
    subscribe(userId: string, callback: (expenses: ExpenseEntry[]) => void) {
      listeners.push(callback);
      return () => {
        listeners = listeners.filter(l => l !== callback);
      };
    },
    
    // ... 他のメソッド
  };
};
```

## 📊 環境・設定分離

### 1. 環境別Firebase設定

```typescript
// src/libs/firebase/config.ts
interface FirebaseEnvironment {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  useEmulator?: boolean;
}

const environments: Record<string, FirebaseEnvironment> = {
  development: {
    projectId: 'demo-project',
    // ... other config
    useEmulator: true,
  },
  staging: {
    projectId: 'myapp-staging',
    // ... other config
    useEmulator: false,
  },
  production: {
    projectId: 'myapp-prod',
    // ... other config
    useEmulator: false,
  },
};

export const getFirebaseConfig = (): FirebaseEnvironment => {
  const env = import.meta.env.VITE_ENVIRONMENT || 'development';
  return environments[env] || environments.development;
};
```

### 2. Emulator自動接続

```typescript
// src/libs/firebase/emulator.ts
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import { auth, db, storage } from './app';

export function connectToEmulators() {
  const config = getFirebaseConfig();
  
  if (!config.useEmulator) return;
  
  try {
    // 開発環境でのみEmulator接続
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    
    console.log('✅ Connected to Firebase Emulators');
  } catch (error) {
    console.warn('⚠️ Could not connect to emulators:', error);
  }
}
```

## 🚀 段階的移行チェックリスト

### Phase 1: Foundation（基盤整備）

- [ ] Firebase refs統一（`src/libs/firebase/refs.ts`）
- [ ] Data Converter作成（`src/libs/converters/`）
- [ ] Repository Interface定義（`src/domain/*/repository.ts`）
- [ ] 環境設定分離（`src/libs/firebase/config.ts`）

### Phase 2: Service Layer（サービス層）

- [ ] Firebase Repository実装（`src/libs/repositories/*.firebase.ts`）
- [ ] Domain Service作成（`src/domain/*/service.ts`）
- [ ] DI Context作成（`src/domain/*/context.tsx`）
- [ ] Mock Repository作成（`src/libs/repositories/*.memory.ts`）

### Phase 3: React Integration（React統合）

- [ ] TanStack Query導入
- [ ] Custom Hooks作成（`src/domain/*/hooks.ts`）
- [ ] リアルタイム購読統合
- [ ] 楽観的更新実装

### Phase 4: Testing & Quality（テスト・品質）

- [ ] Unit Tests（Domain Service）
- [ ] Integration Tests（Repository + Emulator）
- [ ] React Testing（Hooks）
- [ ] E2E Tests（Playwright）

## 📋 既存コード移行例

### Before（現状）

```typescript
// ❌ features/expense/useExpenseStore.ts
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../auth/firebase';

const addExpense = async (data: CreateExpenseData) => {
  const docRef = await addDoc(collection(db, 'expenses'), data);
  return docRef.id;
};
```

### After（改善後）

```typescript
// ✅ domain/expense/hooks.ts
export function useCreateExpense() {
  const service = useExpenseService();
  return useMutation({
    mutationFn: (data: CreateExpenseData) => service.createExpense(data)
  });
}

// ✅ Component
function ExpenseForm() {
  const createExpense = useCreateExpense();
  
  const handleSubmit = (data: CreateExpenseData) => {
    createExpense.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Firebase知らない純粋なUI */}
    </form>
  );
}
```

## 🎯 実装優先度

### 高優先度（今すぐ実装）

1. **Firebase refs統一** - パス文字列散在を防ぐ
2. **Repository Interface** - テスト可能性向上
3. **Data Converter統一** - 型安全性確保

### 中優先度（数週間以内）

1. **Domain Service層** - ビジネスロジック集約
2. **TanStack Query統合** - サーバーステート管理
3. **DI Context** - 依存性注入

### 低優先度（長期的）

1. **E2E Testing** - 全体品質向上
2. **Cloud Functions統合** - サーバーサイド処理
3. **モニタリング・ログ** - 運用品質向上

---

**次のアクション**: この指針にしたがって、まずは`src/libs/firebase/refs.ts`から始めることをオススメします。現在の`features/expense/services/expenseFirebaseService.ts`をRepositoryパターンにリファクタリングし、徐々に他の機能にも適用していきましょう。

## 🔧 推奨アーキテクチャ実装

### 1. Firebase Adapter Layer

```typescript
// src/libs/firebase/refs.ts
import { collection, doc, type CollectionReference, type DocumentReference } from 'firebase/firestore';
import { db } from '../../auth/firebase';
import type { ExpenseEntry, User, UserClaimsDocument } from '../../models';

// コレクション参照の統一管理
export const colUsers = (): CollectionReference<User> => 
  collection(db, 'users') as CollectionReference<User>;

export const colExpenses = (): CollectionReference<ExpenseEntry> => 
  collection(db, 'expenses') as CollectionReference<ExpenseEntry>;

export const colUserClaims = (): CollectionReference<UserClaimsDocument> => 
  collection(db, 'user_claims') as CollectionReference<UserClaimsDocument>;

export const colPermissionRequests = () => collection(db, 'permissionRequests');
export const colExpenseAttachments = () => collection(db, 'expenseAttachments');

// ドキュメント参照の統一管理
export const docUser = (uid: string): DocumentReference<User> => 
  doc(colUsers(), uid);

export const docExpense = (id: string): DocumentReference<ExpenseEntry> => 
  doc(colExpenses(), id);

export const docUserClaims = (uid: string): DocumentReference<UserClaimsDocument> => 
  doc(colUserClaims(), uid);
```

### 2. Repository Interface定義

```typescript
// src/domain/expense/repository.ts
export interface ExpenseRepository {
  // 基本CRUD
  findById(id: string): Promise<ExpenseEntry | null>;
  findByUserId(userId: string): Promise<ExpenseEntry[]>;
  save(expense: CreateExpenseData): Promise<string>;
  update(id: string, expense: UpdateExpenseData): Promise<void>;
  delete(id: string): Promise<void>;
  
  // 検索・フィルタリング
  findByStatus(userId: string, status: ExpenseStatus): Promise<ExpenseEntry[]>;
  findByDateRange(userId: string, start: Date, end: Date): Promise<ExpenseEntry[]>;
  
  // リアルタイム購読
  subscribe(userId: string, callback: (expenses: ExpenseEntry[]) => void): () => void;
  
  // 統計・集計
  getMonthlyTotal(userId: string, year: number, month: number): Promise<number>;
}
```

### 3. Firebase Repository実装

```typescript
// src/libs/repositories/expense.firebase.ts
import { ExpenseRepository } from '../../domain/expense/repository';
import { colExpenses, docExpense } from '../firebase/refs';
import { expenseConverter } from '../converters/expense';

export const createExpenseRepositoryFirebase = (): ExpenseRepository => ({
  async findById(id: string) {
    const docRef = docExpense(id);
    const docSnap = await getDoc(docRef.withConverter(expenseConverter));
    return docSnap.exists() ? docSnap.data() : null;
  },

  async findByUserId(userId: string) {
    const q = query(
      colExpenses().withConverter(expenseConverter),
      where('userId', '==', userId),
      orderBy('expenseDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  },

  subscribe(userId: string, callback: (expenses: ExpenseEntry[]) => void) {
    const q = query(
      colExpenses().withConverter(expenseConverter),
      where('userId', '==', userId),
      orderBy('expenseDate', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => doc.data());
      callback(expenses);
    });
  },

  // ... 他のメソッド実装
});
```

### 4. Data Converter統一

```typescript
// src/libs/converters/expense.ts
import { FirestoreDataConverter, Timestamp } from 'firebase/firestore';
import type { ExpenseEntry } from '../../models';

export const expenseConverter: FirestoreDataConverter<ExpenseEntry> = {
  toFirestore(expense: ExpenseEntry) {
    return {
      ...expense,
      expenseDate: Timestamp.fromDate(expense.expenseDate),
      createdAt: Timestamp.fromDate(expense.createdAt),
      updatedAt: Timestamp.fromDate(expense.updatedAt),
      approvedAt: expense.approvedAt ? Timestamp.fromDate(expense.approvedAt) : null,
    };
  },

  fromFirestore(snapshot, options) {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      expenseDate: data.expenseDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      approvedAt: data.approvedAt?.toDate() || null,
    } as ExpenseEntry;
  }
};
```

### 5. Domain Service層

```typescript
// src/domain/expense/service.ts
import type { ExpenseRepository } from './repository';
import type { CreateExpenseData, UpdateExpenseData, ExpenseEntry } from '../../models';

export const createExpenseService = (repository: ExpenseRepository) => ({
  // ビジネスロジック込みの操作
  async createExpense(userId: string, data: CreateExpenseData): Promise<string> {
    // バリデーション
    if (data.amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    // ビジネスルール適用
    const expense: CreateExpenseData = {
      ...data,
      userId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return repository.save(expense);
  },

  async approveExpense(id: string, approverId: string): Promise<void> {
    const expense = await repository.findById(id);
    if (!expense) throw new Error('Expense not found');
    if (expense.status !== 'pending') throw new Error('Expense not in pending status');
    
    await repository.update(id, {
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    });
  },

  // 統計・レポート
  async getMonthlyExpenses(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return repository.findByDateRange(userId, start, end);
  },
});

export type ExpenseService = ReturnType<typeof createExpenseService>;
```

### 6. React Hooks層（TanStack Query統合）

```typescript
// src/domain/expense/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useExpenseService } from './context';
import type { CreateExpenseData, UpdateExpenseData } from '../../models';

export function useExpenses(userId: string) {
  const service = useExpenseService();
  
  return useQuery({
    queryKey: ['expenses', userId],
    queryFn: () => service.getUserExpenses(userId),
    enabled: !!userId,
  });
}

export function useExpenseSubscription(userId: string) {
  const queryClient = useQueryClient();
  const service = useExpenseService();
  
  React.useEffect(() => {
    if (!userId) return;
    
    const unsubscribe = service.subscribeToExpenses(userId, (expenses) => {
      queryClient.setQueryData(['expenses', userId], expenses);
    });
    
    return unsubscribe;
  }, [userId, service, queryClient]);
}

export function useCreateExpense() {
  const service = useExpenseService();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: CreateExpenseData }) =>
      service.createExpense(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
    },
  });
}
```

### 7. 依存性注入（DI）

```typescript
// src/domain/expense/context.tsx
import React from 'react';
import { createExpenseService, type ExpenseService } from './service';
import { createExpenseRepositoryFirebase } from '../../libs/repositories/expense.firebase';

const ExpenseServiceContext = React.createContext<ExpenseService | null>(null);

export function ExpenseServiceProvider({ children }: { children: React.ReactNode }) {
  const service = React.useMemo(() => {
    const repository = createExpenseRepositoryFirebase();
    return createExpenseService(repository);
  }, []);
  
  return (
    <ExpenseServiceContext.Provider value={service}>
      {children}
    </ExpenseServiceContext.Provider>
  );
}

export function useExpenseService() {
  const service = React.useContext(ExpenseServiceContext);
  if (!service) throw new Error('useExpenseService must be used within ExpenseServiceProvider');
  return service;
}
```

## 🧪 テスト戦略

### 1. レイヤー別テスト方針

| レイヤー | テスト種別 | ツール | Firebase依存 |
|---------|-----------|--------|-------------|
| Domain Service | Unit Test | Jest/Vitest | ❌ (Mock Repository) |
| Repository | Integration Test | Firebase Emulator | ✅ |
| Hooks | React Testing | @testing-library/react | ❌ (Mock Service) |
| E2E | Full Stack | Playwright | ✅ (Emulator) |

### 2. Mock Repository実装

```typescript
// src/libs/repositories/expense.memory.ts
export const createExpenseRepositoryMemory = (
  initialData: ExpenseEntry[] = []
): ExpenseRepository => {
  let expenses = [...initialData];
  let listeners: ((expenses: ExpenseEntry[]) => void)[] = [];
  
  return {
    async findByUserId(userId: string) {
      return expenses.filter(e => e.userId === userId);
    },
    
    async save(expense: CreateExpenseData) {
      const id = `expense_${Date.now()}`;
      const newExpense = { ...expense, id } as ExpenseEntry;
      expenses.push(newExpense);
      listeners.forEach(listener => listener(expenses));
      return id;
    },
    
    subscribe(userId: string, callback: (expenses: ExpenseEntry[]) => void) {
      listeners.push(callback);
      return () => {
        listeners = listeners.filter(l => l !== callback);
      };
    },
    
    // ... 他のメソッド
  };
};
```

## 📊 環境・設定分離

### 1. 環境別Firebase設定

```typescript
// src/libs/firebase/config.ts
interface FirebaseEnvironment {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  useEmulator?: boolean;
}

const environments: Record<string, FirebaseEnvironment> = {
  development: {
    projectId: 'demo-project',
    // ... other config
    useEmulator: true,
  },
  staging: {
    projectId: 'myapp-staging',
    // ... other config
    useEmulator: false,
  },
  production: {
    projectId: 'myapp-prod',
    // ... other config
    useEmulator: false,
  },
};

export const getFirebaseConfig = (): FirebaseEnvironment => {
  const env = import.meta.env.VITE_ENVIRONMENT || 'development';
  return environments[env] || environments.development;
};
```

### 2. Emulator自動接続

```typescript
// src/libs/firebase/emulator.ts
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import { auth, db, storage } from './app';

export function connectToEmulators() {
  const config = getFirebaseConfig();
  
  if (!config.useEmulator) return;
  
  try {
    // 開発環境でのみEmulator接続
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    
    console.log('✅ Connected to Firebase Emulators');
  } catch (error) {
    console.warn('⚠️ Could not connect to emulators:', error);
  }
}
```

## 🚀 段階的移行チェックリスト

### Phase 1: Foundation（基盤整備）
- [ ] Firebase refs統一（`src/libs/firebase/refs.ts`）
- [ ] Data Converter作成（`src/libs/converters/`）
- [ ] Repository Interface定義（`src/domain/*/repository.ts`）
- [ ] 環境設定分離（`src/libs/firebase/config.ts`）

### Phase 2: Service Layer（サービス層）
- [ ] Firebase Repository実装（`src/libs/repositories/*.firebase.ts`）
- [ ] Domain Service作成（`src/domain/*/service.ts`）
- [ ] DI Context作成（`src/domain/*/context.tsx`）
- [ ] Mock Repository作成（`src/libs/repositories/*.memory.ts`）

### Phase 3: React Integration（React統合）
- [ ] TanStack Query導入
- [ ] Custom Hooks作成（`src/domain/*/hooks.ts`）
- [ ] リアルタイム購読統合
- [ ] 楽観的更新実装

### Phase 4: Testing & Quality（テスト・品質）
- [ ] Unit Tests（Domain Service）
- [ ] Integration Tests（Repository + Emulator）
- [ ] React Testing（Hooks）
- [ ] E2E Tests（Playwright）

## 📋 既存コード移行例

### Before（現状）
```typescript
// ❌ features/expense/useExpenseStore.ts
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../auth/firebase';

const addExpense = async (data: CreateExpenseData) => {
  const docRef = await addDoc(collection(db, 'expenses'), data);
  return docRef.id;
};
```

### After（改善後）
```typescript
// ✅ domain/expense/hooks.ts
export function useCreateExpense() {
  const service = useExpenseService();
  return useMutation({
    mutationFn: (data: CreateExpenseData) => service.createExpense(data)
  });
}

// ✅ Component
function ExpenseForm() {
  const createExpense = useCreateExpense();
  
  const handleSubmit = (data: CreateExpenseData) => {
    createExpense.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Firebase知らない純粋なUI */}
    </form>
  );
}
```

## 🎯 実装優先度

### 高優先度（今すぐ実装）
1. **Firebase refs統一** - パス文字列散在を防ぐ
2. **Repository Interface** - テスト可能性向上
3. **Data Converter統一** - 型安全性確保

### 中優先度（数週間以内）
1. **Domain Service層** - ビジネスロジック集約
2. **TanStack Query統合** - サーバーステート管理
3. **DI Context** - 依存性注入

### 低優先度（長期的）
1. **E2E Testing** - 全体品質向上
2. **Cloud Functions統合** - サーバーサイド処理
3. **モニタリング・ログ** - 運用品質向上

---

**次のアクション**: この指針に従って、まずは `src/libs/firebase/refs.ts` から始めることをお勧めします。現在の `features/expense/services/expenseFirebaseService.ts` を Repository パターンにリファクタリングし、徐々に他の機能にも適用していきましょう。
