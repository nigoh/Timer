/**
 * ストレージアダプター抽象レイヤー
 *
 * Zustand persist ミドルウェアで使用するストレージバックエンドを
 * 抽象化し、将来的なDB移行を容易にする。
 *
 * 現在は localStorage を使用するが、IStorageProvider を実装することで
 * IndexedDB / REST API / WebSocket など任意のバックエンドに差し替え可能。
 */

/** ストレージプロバイダーの抽象インターフェース */
export interface IStorageProvider {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void>;
  removeItem: (name: string) => void | Promise<void>;
}

/** localStorage を使用するデフォルト実装 */
class LocalStorageProvider implements IStorageProvider {
  getItem(name: string): string | null {
    return localStorage.getItem(name);
  }

  setItem(name: string, value: string): void {
    localStorage.setItem(name, value);
  }

  removeItem(name: string): void {
    localStorage.removeItem(name);
  }
}

/** 現在のストレージプロバイダーインスタンス */
let currentProvider: IStorageProvider = new LocalStorageProvider();

/**
 * ストレージプロバイダーを取得する。
 * Zustand の `createJSONStorage(() => getStorageProvider())` で使用する。
 */
export const getStorageProvider = (): IStorageProvider => currentProvider;

/**
 * ストレージプロバイダーを差し替える（テスト・将来のDB移行用）。
 */
export const setStorageProvider = (provider: IStorageProvider): void => {
  currentProvider = provider;
};
