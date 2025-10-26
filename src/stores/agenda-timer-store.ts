// @ts-nocheck
import { create } from 'zustand';
import { AgendaSession, AgendaItem, AgendaTimerState } from '../types/agenda';

interface AgendaTimerActions {
  // セッション管理
  createSession: (title: string, items: Omit<AgendaItem, 'id' | 'actualDuration' | 'status' | 'order'>[]) => void;
  loadSession: (session: AgendaSession) => void;
  
  // タイマー制御
  startSession: () => void;
  pauseSession: () => void;
  stopSession: () => void;
  
  // アイテム制御
  startItem: (itemId: string) => void;
  completeCurrentItem: () => void;
  skipToItem: (itemId: string) => void;
  
  // アイテム編集
  updateItem: (itemId: string, updates: Partial<AgendaItem>) => void;
  addItem: (item: Omit<AgendaItem, 'id' | 'actualDuration' | 'status' | 'order'>) => void;
  removeItem: (itemId: string) => void;
  reorderItems: (itemIds: string[]) => void;
  
  // 時間更新
  updateCurrentTime: () => void;
  
  // リセット
  resetSession: () => void;
}

type AgendaTimerStore = AgendaTimerState & AgendaTimerActions;

export const useAgendaTimerStore = create<AgendaTimerStore>((set, get) => ({
  // 初期状態
  currentSession: null,
  sessions: [],
  isRunning: false,
  currentTime: 0,

  // セッション管理
  createSession: (title, itemsData) => {
    const items: AgendaItem[] = itemsData.map((item, index) => ({
      ...item,
      id: crypto.randomUUID(),
      actualDuration: 0,
      status: 'pending' as const,
      order: index,
    }));

    const totalPlannedDuration = items.reduce((sum, item) => sum + item.plannedDuration, 0);

    const newSession: AgendaSession = {
      id: crypto.randomUUID(),
      title,
      items,
      totalPlannedDuration,
      totalActualDuration: 0,
      status: 'not-started',
    };

    set((state) => ({
      currentSession: newSession,
      sessions: [...state.sessions, newSession],
    }));
  },

  loadSession: (session) => {
    set({ currentSession: session });
  },

  // タイマー制御
  startSession: () => {
    const state = get();
    if (!state.currentSession) return;

    const now = new Date();
    
    set((state) => ({
      isRunning: true,
      sessionStartTime: now,
      currentSession: state.currentSession ? {
        ...state.currentSession,
        status: 'in-progress',
        startTime: state.currentSession.startTime || now,
      } : null,
    }));

    // 最初の未完了アイテムを開始
    const firstPendingItem = state.currentSession.items.find(item => item.status === 'pending');
    if (firstPendingItem) {
      get().startItem(firstPendingItem.id);
    }
  },

  pauseSession: () => {
    set((state) => ({
      isRunning: false,
      currentSession: state.currentSession ? {
        ...state.currentSession,
        status: 'paused',
      } : null,
    }));
  },

  stopSession: () => {
    const state = get();
    const now = new Date();
    
    set((state) => ({
      isRunning: false,
      currentSession: state.currentSession ? {
        ...state.currentSession,
        status: 'completed',
        endTime: now,
        totalActualDuration: state.currentTime,
      } : null,
    }));
  },

  // アイテム制御
  startItem: (itemId) => {
    const now = new Date();
    
    set((state) => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        currentItemId: itemId,
        items: state.currentSession.items.map(item =>
          item.id === itemId
            ? { ...item, status: 'running' as const, startTime: now }
            : item.status === 'running'
            ? { ...item, status: 'paused' as const }
            : item
        ),
      } : null,
    }));
  },

  completeCurrentItem: () => {
    const state = get();
    if (!state.currentSession?.currentItemId) return;

    const now = new Date();
    const currentItem = state.currentSession.items.find(
      item => item.id === state.currentSession!.currentItemId
    );

    if (currentItem && currentItem.startTime) {
      const actualDuration = Math.floor((now.getTime() - currentItem.startTime.getTime()) / 1000);
      
      set((state) => ({
        currentSession: state.currentSession ? {
          ...state.currentSession,
          currentItemId: undefined,
          items: state.currentSession.items.map(item =>
            item.id === state.currentSession!.currentItemId
              ? { 
                  ...item, 
                  status: 'completed' as const, 
                  endTime: now,
                  actualDuration: item.actualDuration + actualDuration
                }
              : item
          ),
        } : null,
      }));

      // 次のアイテムを自動開始
      const nextItem = state.currentSession.items.find(item => item.status === 'pending');
      if (nextItem) {
        setTimeout(() => get().startItem(nextItem.id), 500);
      } else {
        // すべて完了
        setTimeout(() => get().stopSession(), 500);
      }
    }
  },

  skipToItem: (itemId) => {
    get().startItem(itemId);
  },

  // アイテム編集
  updateItem: (itemId, updates) => {
    set((state) => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        items: state.currentSession.items.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
        totalPlannedDuration: state.currentSession.items
          .map(item => item.id === itemId ? { ...item, ...updates } : item)
          .reduce((sum, item) => sum + item.plannedDuration, 0),
      } : null,
    }));
  },

  addItem: (itemData) => {
    const state = get();
    if (!state.currentSession) return;

    const newItem: AgendaItem = {
      ...itemData,
      id: crypto.randomUUID(),
      actualDuration: 0,
      status: 'pending',
      order: state.currentSession.items.length,
    };

    set((state) => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        items: [...state.currentSession.items, newItem],
        totalPlannedDuration: state.currentSession.totalPlannedDuration + newItem.plannedDuration,
      } : null,
    }));
  },

  removeItem: (itemId) => {
    set((state) => {
      if (!state.currentSession) return state;
      
      const itemToRemove = state.currentSession.items.find(item => item.id === itemId);
      
      return {
        currentSession: {
          ...state.currentSession,
          items: state.currentSession.items.filter(item => item.id !== itemId),
          totalPlannedDuration: state.currentSession.totalPlannedDuration - (itemToRemove?.plannedDuration || 0),
        }
      };
    });
  },

  reorderItems: (itemIds) => {
    set((state) => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        items: itemIds.map((id, index) => {
          const item = state.currentSession!.items.find(item => item.id === id)!;
          return { ...item, order: index };
        }),
      } : null,
    }));
  },

  // 時間更新
  updateCurrentTime: () => {
    const state = get();
    if (!state.isRunning || !state.sessionStartTime) return;

    const now = new Date();
    const currentTime = Math.floor((now.getTime() - state.sessionStartTime.getTime()) / 1000);
    
    set({ currentTime });
  },

  // リセット
  resetSession: () => {
    set({
      currentSession: null,
      isRunning: false,
      currentTime: 0,
      sessionStartTime: undefined,
    });
  },
}));
