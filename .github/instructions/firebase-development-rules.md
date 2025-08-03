# Firebase開発ルール・ガイドライン

## 📋 概要

このドキュメントは、当プロジェクトにおけるFirebaseを使用した開発のルールとベストプラクティスを定義します。

## 🎯 基本原則

### 1. 関心の分離

- **UI層**: Firebaseを直接知らない
- **Service層**: ビジネスロジックに集中
- **Repository層**: データアクセスを抽象化
- **Firebase層**: 技術的な実装詳細を隠蔽

### 2. 依存性の方向

```text
UI Components
    ↓
React Hooks
    ↓  
Domain Services
    ↓
Repository Interfaces
    ↓
Firebase Adapters
    ↓
Firebase SDK
```

## 📁 ディレクトリ構造

### 現在の構造（分析結果）

```text
src/
├── auth/                    # 認証関連
│   ├── firebase.ts         # Firebase初期化（✅良い）
│   ├── context.tsx         # Auth Context（✅良い）
│   └── stores/             # 認証状態管理（✅良い）
├── models/                 # ドメインモデル
│   ├── User.ts            # ユーザーモデル（✅良い）
│   ├── Expense.ts         # 経費モデル（✅良い）
│   ├── Permission.ts      # 権限モデル（✅良い）
│   └── UserClaims.ts      # Firebase Claims（✅良い）
├── services/              # ドメインサービス
│   ├── userService.ts     # ユーザー操作（✅良い）
│   └── permissionService.ts # 権限管理（✅良い）
├── features/              # 機能別実装
│   └── expense/
│       ├── useExpenseStore.ts # Zustand（✅良い）
│       ├── services/expenseFirebaseService.ts # Firebase連携（⚠️要改善）
│       └── hooks/useExpenseForm.ts # React Hooks（✅良い）
└── stores/               # グローバル状態
    ├── useTemporaryStore.ts
    └── useUserCacheStore.ts
```

### 推奨構造（移行先）

```text
src/
├── libs/                   # 共通ライブラリ
│   ├── firebase/          # Firebase関連
│   │   ├── app.ts        # 初期化
│   │   ├── refs.ts       # コレクション参照統一
│   │   ├── config.ts     # 環境設定
│   │   └── emulator.ts   # エミュレーター接続
│   ├── repositories/      # Repository実装
│   │   ├── expense.firebase.ts
│   │   ├── expense.memory.ts  # テスト用
│   │   └── user.firebase.ts
│   └── converters/        # データ変換
│       ├── expense.ts
│       └── user.ts
├── domain/                # ドメイン層
│   ├── expense/
│   │   ├── repository.ts  # Repository Interface
│   │   ├── service.ts     # Domain Service
│   │   ├── hooks.ts       # React Hooks
│   │   └── context.tsx    # DI Context
│   └── user/
│       ├── repository.ts
│       ├── service.ts
│       ├── hooks.ts
│       └── context.tsx
└── features/              # UI Feature層
    └── expense/
        ├── components/    # Presentational Components
        ├── containers/    # Container Components
        └── pages/         # Page Components
```

## 🔧 実装ルール

### 1. Firebase参照の統一管理

```typescript
// ✅ 良い例: libs/firebase/refs.ts
import { collection, doc } from 'firebase/firestore';
import { db } from './app';

export const colExpenses = () => collection(db, 'expenses');
export const docExpense = (id: string) => doc(db, 'expenses', id);
export const colUsers = () => collection(db, 'users');
export const docUser = (uid: string) => doc(db, 'users', uid);

// ❌ 悪い例: 各ファイルでバラバラに定義
import { collection } from 'firebase/firestore';
import { db } from '../../../auth/firebase';
const expensesCol = collection(db, 'expenses'); // 散在している
```

### 2. Repository Pattern

```typescript
// ✅ 良い例: domain/expense/repository.ts
export interface ExpenseRepository {
  findById(id: string): Promise<ExpenseEntry | null>;
  findByUserId(userId: string): Promise<ExpenseEntry[]>;
  save(expense: CreateExpenseData): Promise<string>;
  update(id: string, data: UpdateExpenseData): Promise<void>;
  delete(id: string): Promise<void>;
}

// ✅ 実装: libs/repositories/expense.firebase.ts
export const createExpenseRepositoryFirebase = (): ExpenseRepository => ({
  async findById(id: string) {
    const docRef = docExpense(id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as ExpenseEntry : null;
  },
  // ... 他のメソッド
});

// ❌ 悪い例: 直接Firebase操作
const getExpense = async (id: string) => {
  const docRef = doc(db, 'expenses', id); // Firebaseに直接依存
  return await getDoc(docRef);
};
```

### 3. データ変換の統一

```typescript
// ✅ 良い例: libs/converters/expense.ts
import { FirestoreDataConverter, Timestamp } from 'firebase/firestore';

export const expenseConverter: FirestoreDataConverter<ExpenseEntry> = {
  toFirestore(expense: ExpenseEntry) {
    return {
      ...expense,
      expenseDate: Timestamp.fromDate(expense.expenseDate),
      createdAt: Timestamp.fromDate(expense.createdAt),
      updatedAt: Timestamp.fromDate(expense.updatedAt),
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
    } as ExpenseEntry;
  }
};

// ❌ 悪い例: 各所で個別変換
const convertToFirestore = (expense) => {
  return { ...expense, date: Timestamp.fromDate(expense.date) }; // 散在
};
```

### 4. React Hooks層

```typescript
// ✅ 良い例: domain/expense/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useExpenseService } from './context';

export function useExpenses(userId: string) {
  const service = useExpenseService();
  return useQuery({
    queryKey: ['expenses', userId],
    queryFn: () => service.getUserExpenses(userId),
    enabled: !!userId,
  });
}

export function useCreateExpense() {
  const service = useExpenseService();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateExpenseData) => service.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

// ❌ 悪い例: HooksでFirebase直接操作
export function useExpenses(userId: string) {
  const [expenses, setExpenses] = useState([]);
  
  useEffect(() => {
    const q = query(collection(db, 'expenses'), where('userId', '==', userId));
    getDocs(q).then(snapshot => {
      setExpenses(snapshot.docs.map(doc => doc.data()));
    });
  }, [userId]);
  
  return expenses;
}
```

### 5. 依存性注入（DI）

```typescript
// ✅ 良い例: domain/expense/context.tsx
import React from 'react';
import { createExpenseService } from './service';
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
  if (!service) {
    throw new Error('useExpenseService must be used within ExpenseServiceProvider');
  }
  return service;
}
```

## 🧪 テスト方針

### 1. レイヤー別テスト戦略

| レイヤー | テスト種別 | ツール | Firebase依存 |
|---------|-----------|--------|-------------|
| Domain Service | Unit Test | Jest/Vitest | ❌ (Mock Repository) |
| Repository | Integration Test | Firebase Emulator | ✅ |
| React Hooks | Component Test | Testing Library | ❌ (Mock Service) |
| E2E | Full Stack | Playwright | ✅ (Emulator) |

### 2. Mock実装

```typescript
// ✅ テスト用Mock Repository: libs/repositories/expense.memory.ts
export const createExpenseRepositoryMemory = (
  initialData: ExpenseEntry[] = []
): ExpenseRepository => {
  let expenses = [...initialData];
  
  return {
    async findByUserId(userId: string) {
      return expenses.filter(e => e.userId === userId);
    },
    
    async save(expense: CreateExpenseData) {
      const id = `expense_${Date.now()}`;
      const newExpense = { ...expense, id } as ExpenseEntry;
      expenses.push(newExpense);
      return id;
    },
    
    // ... 他のメソッド実装
  };
};
```

## 🌍 環境管理

### 1. 環境別設定

```typescript
// ✅ libs/firebase/config.ts
interface FirebaseEnvironment {
  projectId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  useEmulator: boolean;
}

const environments: Record<string, FirebaseEnvironment> = {
  development: {
    projectId: 'demo-project',
    useEmulator: true,
    // ... 他の設定
  },
  staging: {
    projectId: 'myapp-staging',
    useEmulator: false,
    // ... 他の設定
  },
  production: {
    projectId: 'myapp-prod',
    useEmulator: false,
    // ... 他の設定
  },
};

export const getFirebaseConfig = (): FirebaseEnvironment => {
  const env = import.meta.env.VITE_ENVIRONMENT || 'development';
  return environments[env] || environments.development;
};
```

### 2. エミュレーター自動接続

```typescript
// ✅ libs/firebase/emulator.ts
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';

export function connectToEmulators() {
  const config = getFirebaseConfig();
  
  if (!config.useEmulator) return;
  
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('✅ Connected to Firebase Emulators');
  } catch (error) {
    console.warn('⚠️ Emulator connection failed:', error);
  }
}
```

## 📊 Security Rules連携

### 1. Firestoreルールとの整合性

```typescript
// ✅ Firestoreルールに対応したモデル
// models/UserClaims.ts
export interface UserClaimsDocument {
  uid: string;           // firestore.rules: uid is string && uid.size() > 0
  roles: UserRole[];     // firestore.rules: roles is list
  permissions: Permission[]; // firestore.rules: permissions is list
  isActive: boolean;     // firestore.rules: isActive is bool
}

// ✅ Repository実装でルール準拠
export const createUserClaimsRepositoryFirebase = (): UserClaimsRepository => ({
  async save(data: CreateUserClaimsData) {
    // FirestoreルールのvalidateUserClaimsData関数に準拠
    const docData: UserClaimsDocument = {
      uid: data.uid,
      roles: data.roles,
      permissions: data.permissions,
      isActive: data.isActive,
    };
    
    await setDoc(docUserClaims(data.uid), docData);
  },
});
```

## 🚀 段階的移行計画

### Phase 1: 基盤整備（1-2週間）

1. **Firebase参照統一**
   - [ ] `libs/firebase/refs.ts`作成
   - [ ] 既存コードでの参照を統一

2. **Data Converter作成**
   - [ ] `libs/converters/`フォルダー作成
   - [ ] 主要モデルのConverter実装

3. **環境設定分離**
   - [ ] `libs/firebase/config.ts`作成
   - [ ] 環境別設定の整理

### Phase 2: Repository層実装（2-3週間）

1. **Repository Interface定義**
   - [ ] `domain/*/repository.ts`作成
   - [ ] 主要機能のInterface定義

2. **Firebase Repository実装**
   - [ ] `libs/repositories/*.firebase.ts`作成
   - [ ] 既存Serviceの移行

3. **Mock Repository作成**
   - [ ] `libs/repositories/*.memory.ts`作成
   - [ ] テスト環境整備

### Phase 3: React統合（2-3週間）

1. **TanStack Query導入**
   - [ ] パッケージインストール・設定
   - [ ] 既存Zustand Storeの段階的移行

2. **Domain Service作成**
   - [ ] `domain/*/service.ts`実装
   - [ ] ビジネスロジックの集約

3. **Custom Hooks実装**
   - [ ] `domain/*/hooks.ts`作成
   - [ ] Component層の簡素化

### Phase 4: 品質向上（継続的）

1. **テスト拡充**
   - [ ] Unit Test追加
   - [ ] Integration Test実装
   - [ ] E2E Test構築

2. **監視・ログ強化**
   - [ ] エラーハンドリング統一
   - [ ] パフォーマンス監視
   - [ ] セキュリティ監査

## ❌ アンチパターン

### 1. Firebase直接操作
```typescript
// ❌ 悪い例
function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  
  useEffect(() => {
    // コンポーネントでFirebase直接操作
    const q = query(collection(db, 'expenses'));
    getDocs(q).then(snapshot => {
      setExpenses(snapshot.docs.map(doc => doc.data()));
    });
  }, []);
  
  return <div>{/* ... */}</div>;
}
```

### 2. パス文字列の散在
```typescript
// ❌ 悪い例
collection(db, 'expenses')           // ファイルA
doc(db, 'expenses', id)              // ファイルB
collection(db, 'expense')            // ファイルC（typo!）
```

### 3. 型変換の散在
```typescript
// ❌ 悪い例
const firestoreData = {
  ...expense,
  date: Timestamp.fromDate(expense.date) // ファイルA
};

const expense = {
  ...doc.data(),
  date: doc.data().date.toDate() // ファイルB
};
```

## ✅ 実装チェックリスト

### 新機能実装時

- [ ] Repository Interfaceを定義
- [ ] Firebase Repository実装
- [ ] Mock Repository実装（テスト用）
- [ ] Domain Service実装
- [ ] React Hooks実装
- [ ] Unit Test作成
- [ ] Integration Test作成

### 既存機能修正時

- [ ] 修正対象レイヤーの特定
- [ ] 関連テストの実行
- [ ] 影響範囲の確認
- [ ] リファクタリング機会の検討

## 📚 参考資料

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Firebase Best Practices](https://firebase.google.com/docs/guides)
- [TanStack Query](https://tanstack.com/query/latest)

---

**最終更新**: 2025年7月18日
**バージョン**: 1.0.0
