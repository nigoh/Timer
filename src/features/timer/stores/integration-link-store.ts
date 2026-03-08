import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IntegrationLink } from '@/types/integrationLink';
import { AiProviderConfig } from '@/types/aiAssist';
import { logger } from '@/utils/logger';

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
  /**
   * AI API 設定（メモリのみ・非永続）
   * - localStorage / sessionStorage には保存しない
   * - partialize により persist 対象外
   * - ページリロードで null にリセットされる
   */
  aiProviderConfig: AiProviderConfig | null;
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
  /** AI API 設定をメモリにセット（persist 対象外） */
  setAiProviderConfig: (config: AiProviderConfig | null) => void;
}

type IntegrationLinkStore = IntegrationLinkState & IntegrationLinkActions;

export const useIntegrationLinkStore = create<IntegrationLinkStore>()(
  persist(
    (set, get) => ({
      linksByLogId: {},
      githubPat: null,
      aiProviderConfig: null,

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
        logger.featureUsage('integration', 'add-link', { repo: link.repo });
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
        logger.featureUsage('integration', 'remove-link', { linkId });
      },

      getLinks: (timeLogId) => get().linksByLogId[timeLogId] ?? [],

      setGithubPat: (pat) => {
        set({ githubPat: pat });
        logger.featureUsage('integration', pat ? 'github-pat-set' : 'github-pat-cleared');
      },
      setAiProviderConfig: (config) => {
        set({ aiProviderConfig: config });
        logger.featureUsage('integration', config ? 'ai-config-set' : 'ai-config-cleared', { provider: config?.provider });
      },
    }),
    {
      name: 'integration-links',
      // githubPat を永続化対象から除外する（セキュリティ上の要件）
      partialize: (state) => ({ linksByLogId: state.linksByLogId }),
    },
  ),
);
