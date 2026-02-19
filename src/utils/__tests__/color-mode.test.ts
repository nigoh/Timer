import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyColorMode,
  COLOR_MODE_STORAGE_KEY,
  getInitialColorMode,
  persistColorMode,
} from "../color-mode";

describe("color mode", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("保存済みのテーマを優先して初期値を返す", () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");

    expect(getInitialColorMode()).toBe("dark");
  });

  it("保存値がない場合はOS設定を参照する", () => {
    const matchMediaMock = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal("matchMedia", matchMediaMock);

    expect(getInitialColorMode()).toBe("dark");
  });

  it("指定テーマの適用と保存ができる", () => {
    applyColorMode("dark");
    persistColorMode("dark");

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
  });
});
