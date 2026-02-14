import { create } from 'zustand';
import { AgendaTimerState, Meeting, AgendaItem } from '../types/agenda';
import { bellSoundManager } from '../utils/bellSoundManager';
import { logger } from '../utils/logger';

interface AgendaTimerStore extends AgendaTimerState {
  // Meeting管理
  createMeeting: (title: string) => void;
  deleteMeeting: (id: string) => void;
  setCurrentMeeting: (id: string) => void;
  updateMeetingSettings: (id: string, settings: Partial<Meeting['settings']>) => void;
  
  // Agenda管理
  addAgenda: (meetingId: string, title: string, plannedDuration: number, memo?: string) => void;
  updateAgenda: (meetingId: string, agendaId: string, updates: Partial<AgendaItem>) => void;
  deleteAgenda: (meetingId: string, agendaId: string) => void;
  reorderAgendas: (meetingId: string, agendaIds: string[]) => void;
  
  // タイマー制御
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  nextAgenda: () => void;
  previousAgenda: () => void;
  tick: () => void;
  
  // ユーティリティ
  getCurrentAgenda: () => AgendaItem | null;
  getProgressPercentage: () => number;
  getTotalProgressPercentage: () => number;
  calculateTimeColor: (percentage: number) => string;
  
  // バックグラウンド対応
  syncTime: () => void;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// 進捗に応じた色の計算
const getProgressColor = (percentage: number): string => {
  if (percentage <= 70) return 'bg-green-500'; // 緑（余裕）
  if (percentage <= 90) return 'bg-orange-500'; // 橙（残り少）
  if (percentage <= 100) return 'bg-red-500'; // 赤（0到達）
  return 'bg-purple-500'; // 紫（超過）
};

export const useAgendaTimerStore = create<AgendaTimerStore>((set, get) => ({
  // 初期状態
  currentMeeting: null,
  meetings: [],
  isRunning: false,
  currentTime: 0,
  meetingStartTime: undefined,
  lastTickTime: undefined,

  // Meeting管理
  createMeeting: (title: string) => {
    const newMeeting: Meeting = {
      id: generateId(),
      title,
      agenda: [],
      totalPlannedDuration: 0,
      totalActualDuration: 0,
      status: 'not-started',
      settings: {
        autoTransition: false,
        silentMode: false,
        bellSettings: {
          start: true,
          fiveMinWarning: true,
          end: true,
          overtime: true,
          soundType: 'single',
        },
      },
    };

    set((state) => ({
      meetings: [...state.meetings, newMeeting],
      currentMeeting: state.currentMeeting || newMeeting,
    }));

    logger.info('Meeting created', {
      meetingId: newMeeting.id,
      title: newMeeting.title
    }, 'agenda');
  },

  deleteMeeting: (id: string) => {
    const state = get();
    const meetingToDelete = state.meetings.find(m => m.id === id);
    
    set((state) => ({
      meetings: state.meetings.filter((m) => m.id !== id),
      currentMeeting: state.currentMeeting?.id === id ? null : state.currentMeeting,
    }));

    logger.info('Meeting deleted', {
      meetingId: id,
      title: meetingToDelete?.title
    }, 'agenda');
  },

  setCurrentMeeting: (id: string) => {
    const meeting = get().meetings.find((m) => m.id === id);
    if (meeting) {
      set({ currentMeeting: meeting });
    }
  },

  updateMeetingSettings: (id: string, settings) => {
    set((state) => ({
      meetings: state.meetings.map((m) =>
        m.id === id ? { ...m, settings: { ...m.settings, ...settings } } : m
      ),
      currentMeeting: state.currentMeeting?.id === id 
        ? { ...state.currentMeeting, settings: { ...state.currentMeeting.settings, ...settings } }
        : state.currentMeeting,
    }));
  },

  // Agenda管理
  addAgenda: (meetingId: string, title: string, plannedDuration: number, memo?: string) => {
    const newAgenda: AgendaItem = {
      id: generateId(),
      title,
      plannedDuration,
      memo,
      actualDuration: 0,
      status: 'pending',
      minutesContent: '',
      minutesFormat: 'markdown',
      sectionStatus: 'not_started',
      order: 0,
      remainingTime: plannedDuration,
    };

    set((state) => {
      const updatedMeetings = state.meetings.map((meeting) => {
        if (meeting.id === meetingId) {
          const newOrder = meeting.agenda.length;
          const updatedAgenda = [...meeting.agenda, { ...newAgenda, order: newOrder }];
          return {
            ...meeting,
            agenda: updatedAgenda,
            totalPlannedDuration: meeting.totalPlannedDuration + plannedDuration,
          };
        }
        return meeting;
      });

      return {
        meetings: updatedMeetings,
        currentMeeting: state.currentMeeting?.id === meetingId 
          ? updatedMeetings.find(m => m.id === meetingId) || state.currentMeeting
          : state.currentMeeting,
      };
    });
  },

  updateAgenda: (meetingId: string, agendaId: string, updates) => {
    set((state) => {
      const updatedMeetings = state.meetings.map((meeting) => {
        if (meeting.id === meetingId) {
          const updatedAgenda = meeting.agenda.map((agenda) =>
            agenda.id === agendaId ? { ...agenda, ...updates } : agenda
          );
          
          // 総時間を再計算
          const totalPlannedDuration = updatedAgenda.reduce((sum, a) => sum + a.plannedDuration, 0);
          const totalActualDuration = updatedAgenda.reduce((sum, a) => sum + a.actualDuration, 0);
          
          return {
            ...meeting,
            agenda: updatedAgenda,
            totalPlannedDuration,
            totalActualDuration,
          };
        }
        return meeting;
      });

      return {
        meetings: updatedMeetings,
        currentMeeting: state.currentMeeting?.id === meetingId 
          ? updatedMeetings.find(m => m.id === meetingId) || state.currentMeeting
          : state.currentMeeting,
      };
    });
  },

  deleteAgenda: (meetingId: string, agendaId: string) => {
    set((state) => {
      const updatedMeetings = state.meetings.map((meeting) => {
        if (meeting.id === meetingId) {
          const agenda = meeting.agenda.find(a => a.id === agendaId);
          const updatedAgenda = meeting.agenda
            .filter((a) => a.id !== agendaId)
            .map((a, index) => ({ ...a, order: index }));
          
          return {
            ...meeting,
            agenda: updatedAgenda,
            totalPlannedDuration: meeting.totalPlannedDuration - (agenda?.plannedDuration || 0),
          };
        }
        return meeting;
      });

      return {
        meetings: updatedMeetings,
        currentMeeting: state.currentMeeting?.id === meetingId 
          ? updatedMeetings.find(m => m.id === meetingId) || state.currentMeeting
          : state.currentMeeting,
      };
    });
  },

  reorderAgendas: (meetingId: string, agendaIds: string[]) => {
    set((state) => {
      const updatedMeetings = state.meetings.map((meeting) => {
        if (meeting.id === meetingId) {
          const reorderedAgenda = agendaIds.map((id, index) => {
            const agenda = meeting.agenda.find((a) => a.id === id);
            return agenda ? { ...agenda, order: index } : null;
          }).filter(Boolean) as AgendaItem[];
          
          return { ...meeting, agenda: reorderedAgenda };
        }
        return meeting;
      });

      return {
        meetings: updatedMeetings,
        currentMeeting: state.currentMeeting?.id === meetingId 
          ? updatedMeetings.find(m => m.id === meetingId) || state.currentMeeting
          : state.currentMeeting,
      };
    });
  },

  // タイマー制御
  startTimer: () => {
    const state = get();
    const currentAgenda = get().getCurrentAgenda();
    
    if (!currentAgenda || !state.currentMeeting) return;

    const now = new Date();
    set({
      isRunning: true,
      meetingStartTime: state.meetingStartTime || now,
      lastTickTime: now.getTime(),
    });

    logger.timerStart(
      currentAgenda.id,
      'agenda',
      currentAgenda.plannedDuration * 60
    );

    logger.info('Agenda timer started', {
      meetingId: state.currentMeeting.id,
      meetingTitle: state.currentMeeting.title,
      agendaId: currentAgenda.id,
      agendaTitle: currentAgenda.title,
      plannedDuration: currentAgenda.plannedDuration
    }, 'agenda');

    // 現在のアジェンダを開始状態に
    get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
      status: 'running',
      startTime: currentAgenda.startTime || now,
    });

    // 開始ベル
    if (state.currentMeeting.settings.bellSettings.start) {
      bellSoundManager.notifyWithBell(
        'start',
        state.currentMeeting.settings.bellSettings,
        `アジェンダ「${currentAgenda.title}」を開始しました`
      );
    }

    // 通知権限をリクエスト
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  pauseTimer: () => {
    set({ isRunning: false });
  },

  stopTimer: () => {
    const state = get();
    const currentAgenda = get().getCurrentAgenda();
    
    if (currentAgenda && state.currentMeeting) {
      get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
        status: 'paused',
      });
    }

    set({
      isRunning: false,
      currentTime: 0,
      meetingStartTime: undefined,
      lastTickTime: undefined,
    });
  },

  nextAgenda: () => {
    const state = get();
    if (!state.currentMeeting) return;

    const currentAgenda = get().getCurrentAgenda();
    if (currentAgenda) {
      // 現在のアジェンダを完了状態に
      get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
        status: 'completed',
        endTime: new Date(),
      });
    }

    // 次のアジェンダを探す
    const nextAgenda = state.currentMeeting.agenda
      .filter(a => a.status === 'pending')
      .sort((a, b) => a.order - b.order)[0];

    if (nextAgenda) {
      // 次のアジェンダに移動
      set((prevState) => ({
        currentMeeting: prevState.currentMeeting ? {
          ...prevState.currentMeeting,
          currentAgendaId: nextAgenda.id,
        } : null,
        currentTime: 0,
      }));

      // 自動開始設定の場合は自動で開始
      if (state.currentMeeting.settings.autoTransition && state.isRunning) {
        setTimeout(() => get().startTimer(), 1000);
      }
    } else {
      // 会議終了
      get().stopTimer();
      set((prevState) => ({
        currentMeeting: prevState.currentMeeting ? {
          ...prevState.currentMeeting,
          status: 'completed',
          endTime: new Date(),
        } : null,
      }));
    }
  },

  previousAgenda: () => {
    const state = get();
    if (!state.currentMeeting) return;

    const currentAgenda = get().getCurrentAgenda();
    if (!currentAgenda) return;

    // 前のアジェンダを探す
    const prevAgenda = state.currentMeeting.agenda
      .filter(a => a.order < currentAgenda.order)
      .sort((a, b) => b.order - a.order)[0];

    if (prevAgenda) {
      set((prevState) => ({
        currentMeeting: prevState.currentMeeting ? {
          ...prevState.currentMeeting,
          currentAgendaId: prevAgenda.id,
        } : null,
        currentTime: 0,
      }));
    }
  },

  tick: () => {
    const state = get();
    if (!state.isRunning || !state.currentMeeting) return;

    const currentAgenda = get().getCurrentAgenda();
    if (!currentAgenda) return;

    const now = Date.now();
    const deltaTime = state.lastTickTime ? Math.round((now - state.lastTickTime) / 1000) : 1;
    
    const newCurrentTime = state.currentTime + deltaTime;
    const newRemainingTime = currentAgenda.plannedDuration - newCurrentTime;
    
    set({
      currentTime: newCurrentTime,
      lastTickTime: now,
    });

    // アジェンダの残り時間を更新
    get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
      remainingTime: newRemainingTime,
      actualDuration: newCurrentTime,
      status: newRemainingTime <= 0 ? 'overtime' : 'running',
    });

    // 残り5分警告
    if (newRemainingTime === 300 && state.currentMeeting.settings.bellSettings.fiveMinWarning) {
      bellSoundManager.notifyWithBell(
        'warning',
        state.currentMeeting.settings.bellSettings,
        `アジェンダ「${currentAgenda.title}」の残り時間は5分です`
      );
    }

    // 時間終了通知
    if (newRemainingTime === 0 && state.currentMeeting.settings.bellSettings.end) {
      bellSoundManager.notifyWithBell(
        'end',
        state.currentMeeting.settings.bellSettings,
        `アジェンダ「${currentAgenda.title}」の予定時間が終了しました`
      );
    }

    // 超過警告（毎分）
    if (newRemainingTime < 0 && Math.abs(newRemainingTime) % 60 === 0 && state.currentMeeting.settings.bellSettings.overtime) {
      bellSoundManager.notifyWithBell(
        'overtime',
        state.currentMeeting.settings.bellSettings,
        `アジェンダ「${currentAgenda.title}」が${Math.abs(Math.floor(newRemainingTime / 60))}分超過しています`
      );
    }
  },

  // ユーティリティ
  getCurrentAgenda: () => {
    const state = get();
    if (!state.currentMeeting || !state.currentMeeting.currentAgendaId) {
      // 現在のアジェンダが設定されていない場合、最初の未完了アジェンダを返す
      const firstPending = state.currentMeeting?.agenda
        .filter(a => a.status === 'pending')
        .sort((a, b) => a.order - b.order)[0];
      
      if (firstPending && state.currentMeeting) {
        // 現在のアジェンダIDを更新
        set((prevState) => ({
          currentMeeting: prevState.currentMeeting ? {
            ...prevState.currentMeeting,
            currentAgendaId: firstPending.id,
          } : null,
        }));
      }
      
      return firstPending || null;
    }
    
    return state.currentMeeting.agenda.find(a => a.id === state.currentMeeting!.currentAgendaId) || null;
  },

  getProgressPercentage: () => {
    const currentAgenda = get().getCurrentAgenda();
    if (!currentAgenda) return 0;
    
    return Math.min((currentAgenda.actualDuration / currentAgenda.plannedDuration) * 100, 150); // 最大150%まで表示
  },

  getTotalProgressPercentage: () => {
    const state = get();
    if (!state.currentMeeting || state.currentMeeting.totalPlannedDuration === 0) return 0;
    
    return Math.min((state.currentMeeting.totalActualDuration / state.currentMeeting.totalPlannedDuration) * 100, 150);
  },

  calculateTimeColor: (percentage: number) => {
    return getProgressColor(percentage);
  },

  // バックグラウンド対応
  syncTime: () => {
    const state = get();
    if (!state.isRunning || !state.lastTickTime) return;

    const now = Date.now();
    const timeDiff = Math.round((now - state.lastTickTime) / 1000);
    
    if (timeDiff > 1) {
      // バックグラウンドから復帰時の時間同期
      set({
        currentTime: state.currentTime + timeDiff,
        lastTickTime: now,
      });
    }
  },
}));
