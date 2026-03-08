import { create } from 'zustand';
import { SyncStatus } from '@/types/sync';

interface SyncState {
  status: SyncStatus;
  lastSyncAt: string | null; // ISO 8601
  isOnline: boolean;
}

interface SyncActions {
  setStatus: (status: SyncStatus) => void;
  setLastSyncAt: (at: string) => void;
  setOnline: (online: boolean) => void;
}

export type SyncStore = SyncState & SyncActions;

/** 同期状態ストア（非永続: リロードでリセット） */
export const useSyncStore = create<SyncStore>()((set) => ({
  status: 'idle',
  lastSyncAt: null,
  isOnline: navigator.onLine,

  setStatus: (status) => set({ status }),
  setLastSyncAt: (at) => set({ lastSyncAt: at }),
  setOnline: (isOnline) => set({ isOnline }),
}));
