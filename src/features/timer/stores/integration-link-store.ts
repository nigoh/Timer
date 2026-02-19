import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IntegrationLink } from '@/types/integrationLink';

interface IntegrationLinkState {
  /** timeLogId → IntegrationLink[] のマップ */
  linksByLogId: Record<string, IntegrationLink[]>;
  /**
   * GitHub PAT（メモリのみ・非永続）
   * - localStorage / sessionStorage には保存しない
   * - partialize により persist 対象外
   * - ページリロードで null にリセットされる
   */
  githubPat: string | null;
}

interface IntegrationLinkActions {
  /** リンクを追加する */
  addLink: (timeLogId: string, link: Omit<IntegrationLink, 'id' | 'createdAt'>) => void;
  /** リンクを削除する */
  removeLink: (timeLogId: string, linkId: string) => void;
  /** 指定 timeLogId のリンク一覧を返す */
  getLinks: (timeLogId: string) => IntegrationLink[];
  /** PAT をメモリにセット（persist 対象外） */
  setGithubPat: (pat: string | null) => void;
}

type IntegrationLinkStore = IntegrationLinkState & IntegrationLinkActions;

export const useIntegrationLinkStore = create<IntegrationLinkStore>()(
  persist(
    (set, get) => ({
      linksByLogId: {},
      githubPat: null,

      addLink: (timeLogId, link) => {
        const newLink: IntegrationLink = {
          ...link,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          linksByLogId: {
            ...state.linksByLogId,
            [timeLogId]: [...(state.linksByLogId[timeLogId] ?? []), newLink],
          },
        }));
      },

      removeLink: (timeLogId, linkId) => {
        set((state) => ({
          linksByLogId: {
            ...state.linksByLogId,
            [timeLogId]: (state.linksByLogId[timeLogId] ?? []).filter(
              (l) => l.id !== linkId,
            ),
          },
        }));
      },

      getLinks: (timeLogId) => get().linksByLogId[timeLogId] ?? [],

      setGithubPat: (pat) => set({ githubPat: pat }),
    }),
    {
      name: 'integration-links',
      // githubPat を永続化対象から除外する（セキュリティ上の要件）
      partialize: (state) => ({ linksByLogId: state.linksByLogId }),
    },
  ),
);
