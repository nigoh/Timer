import { describe, expect, it, beforeEach } from 'vitest';
import {
  getStorageProvider,
  setStorageProvider,
  type IStorageProvider,
} from '../storage-adapter';

describe('storage-adapter', () => {
  beforeEach(() => {
    localStorage.clear();
    // デフォルトの localStorage プロバイダーに戻す
    setStorageProvider({
      getItem: (name) => localStorage.getItem(name),
      setItem: (name, value) => localStorage.setItem(name, value),
      removeItem: (name) => localStorage.removeItem(name),
    });
  });

  it('デフォルトプロバイダーで localStorage に読み書きできる', () => {
    const provider = getStorageProvider();
    provider.setItem('test-key', 'test-value');
    expect(provider.getItem('test-key')).toBe('test-value');
  });

  it('デフォルトプロバイダーで removeItem が動作する', () => {
    const provider = getStorageProvider();
    provider.setItem('test-key', 'test-value');
    provider.removeItem('test-key');
    expect(provider.getItem('test-key')).toBeNull();
  });

  it('setStorageProvider でカスタムプロバイダーに差し替えできる', () => {
    const store = new Map<string, string>();
    const customProvider: IStorageProvider = {
      getItem: (name) => store.get(name) ?? null,
      setItem: (name, value) => { store.set(name, value); },
      removeItem: (name) => { store.delete(name); },
    };

    setStorageProvider(customProvider);
    const provider = getStorageProvider();

    provider.setItem('custom-key', 'custom-value');
    expect(provider.getItem('custom-key')).toBe('custom-value');
    expect(store.get('custom-key')).toBe('custom-value');

    provider.removeItem('custom-key');
    expect(provider.getItem('custom-key')).toBeNull();
  });
});
