/**
 * ランダムな一意IDを生成する。
 * 全ストア・フックで共通利用すること。
 */
export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);
