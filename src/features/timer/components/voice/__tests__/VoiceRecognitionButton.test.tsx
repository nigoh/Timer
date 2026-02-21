import React, { act } from 'react';
import { describe, expect, beforeEach, afterEach, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';

// ---- useVoiceRecognition モック ----
const mockHook = {
  isListening: false,
  isSupported: true,
  language: 'ja-JP' as 'ja-JP' | 'en-US',
  error: null as 'permission-denied' | 'network' | 'aborted' | 'not-supported' | null,
  start: vi.fn(),
  stop: vi.fn(),
  setLanguage: vi.fn(),
  clearTranscript: vi.fn(),
  interimTranscript: '',
  confirmedEntries: [],
  currentAgendaId: null,
};

vi.mock('@/features/timer/hooks/useVoiceRecognition', () => ({
  useVoiceRecognition: () => mockHook,
}));

// ---- UI コンポーネントのモック ----
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, 'aria-label': ariaLabel }: {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler;
    disabled?: boolean;
    variant?: string;
    'aria-label'?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, disabled, children }: {
    value: string;
    onValueChange: (v: string) => void;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <select
      aria-label="言語選択"
      value={value}
      disabled={disabled}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
}));

vi.mock('@radix-ui/themes', () => ({
  Tooltip: ({ children, content }: { children: React.ReactNode; content: string }) => (
    <div data-tooltip={content}>{children}</div>
  ),
}));

vi.mock('lucide-react', () => ({
  Mic: () => <span>mic</span>,
  MicOff: () => <span>micoff</span>,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import { VoiceRecognitionButton } from '../VoiceRecognitionButton';

describe('VoiceRecognitionButton', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // フックのモック状態をリセット
    mockHook.isListening = false;
    mockHook.isSupported = true;
    mockHook.language = 'ja-JP';
    mockHook.error = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('isSupported=true のとき録音ボタンが enabled で表示される', async () => {
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="a1" />);
    });
    const btn = container.querySelector('button')!;
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toContain('録音');
  });

  it('isSupported=false のとき録音ボタンが disabled になる', async () => {
    mockHook.isSupported = false;
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="a1" />);
    });
    const btn = container.querySelector('button')!;
    expect(btn.disabled).toBe(true);
  });

  it('isListening=true のとき「停止」が表示される', async () => {
    mockHook.isListening = true;
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="a1" />);
    });
    const btn = container.querySelector('button')!;
    expect(btn.textContent).toContain('停止');
    expect(btn.getAttribute('data-variant')).toBe('destructive');
  });

  it('isListening=false のとき「録音」が表示される', async () => {
    mockHook.isListening = false;
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="a1" />);
    });
    const btn = container.querySelector('button')!;
    expect(btn.textContent).toContain('録音');
    expect(btn.getAttribute('data-variant')).toBe('outline');
  });

  it('ボタンクリック時（停止中）に start() が呼ばれる', async () => {
    mockHook.isListening = false;
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="agenda-42" />);
    });

    await act(async () => {
      container.querySelector('button')!.click();
    });

    expect(mockHook.start).toHaveBeenCalledWith('agenda-42');
  });

  it('ボタンクリック時（録音中）に stop() が呼ばれる', async () => {
    mockHook.isListening = true;
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="a1" />);
    });

    await act(async () => {
      container.querySelector('button')!.click();
    });

    expect(mockHook.stop).toHaveBeenCalledTimes(1);
  });

  it('isListening=true のとき赤バッジが表示される', async () => {
    mockHook.isListening = true;
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="a1" />);
    });
    const badge = container.querySelector('[data-testid="badge"]');
    expect(badge).not.toBeNull();
  });

  it('isListening=false のとき赤バッジが表示されない', async () => {
    mockHook.isListening = false;
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="a1" />);
    });
    const badge = container.querySelector('[data-testid="badge"]');
    expect(badge).toBeNull();
  });

  it('error=permission-denied のときエラーメッセージが表示される', async () => {
    mockHook.error = 'permission-denied';
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="a1" />);
    });
    expect(container.textContent).toContain('マイクへのアクセスを許可してください');
  });

  it('error=network のときエラーメッセージが表示される', async () => {
    mockHook.error = 'network';
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="a1" />);
    });
    expect(container.textContent).toContain('ネットワーク');
  });

  it('error=aborted のときエラーメッセージが表示される', async () => {
    mockHook.error = 'aborted';
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="a1" />);
    });
    expect(container.textContent).toContain('中断されました');
  });

  it('言語セレクトの変更で setLanguage() が呼ばれる', async () => {
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="a1" />);
    });

    const select = container.querySelector('select')!;
    await act(async () => {
      select.value = 'en-US';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(mockHook.setLanguage).toHaveBeenCalledWith('en-US');
  });

  it('isListening=true のとき言語セレクトが disabled になる', async () => {
    mockHook.isListening = true;
    await act(async () => {
      createRoot(container).render(<VoiceRecognitionButton agendaId="a1" />);
    });
    const select = container.querySelector('select')!;
    expect(select.disabled).toBe(true);
  });
});
