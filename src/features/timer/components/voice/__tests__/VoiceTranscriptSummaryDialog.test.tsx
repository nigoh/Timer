import React, { act } from 'react';
import { describe, expect, beforeEach, afterEach, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import type ReactQuill from 'react-quill';
import type { VoiceTranscriptEntry } from '@/types/voice';

// ---- useVoiceRecognition モック ----
const mockVoiceHook = {
  confirmedEntries: [] as VoiceTranscriptEntry[],
  clearTranscript: vi.fn(),
  isListening: false,
  start: vi.fn(),
  stop: vi.fn(),
  setLanguage: vi.fn(),
  isSupported: true,
  language: 'ja-JP' as const,
  error: null,
  interimTranscript: '',
  currentAgendaId: null,
};

vi.mock('@/features/timer/hooks/useVoiceRecognition', () => ({
  useVoiceRecognition: () => mockVoiceHook,
}));

// ---- integration-link-store モック ----
vi.mock('@/features/timer/stores/integration-link-store', () => ({
  useIntegrationLinkStore: () => ({ aiProviderConfig: null }),
}));

// ---- summarizeVoiceTranscript モック ----
const mockSummarize = vi.fn();
vi.mock('@/features/timer/services/meeting-ai-assist-service', () => ({
  summarizeVoiceTranscript: (...args: unknown[]) => mockSummarize(...args),
}));

// ---- logger モック ----
vi.mock('@/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---- UI コンポーネントのモック ----
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    open,
    children,
  }: {
    open: boolean;
    onOpenChange?: (v: boolean) => void;
    children: React.ReactNode;
  }) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
    placeholder?: string;
  }) => (
    <textarea
      data-testid="summary-textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  ),
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('lucide-react', () => ({
  RefreshCw: () => <span>refresh</span>,
}));

import { VoiceTranscriptSummaryDialog } from '../VoiceTranscriptSummaryDialog';

describe('VoiceTranscriptSummaryDialog', () => {
  let container: HTMLDivElement;
  const mockOnClose = vi.fn();
  const mockOnInserted = vi.fn();
  const mockEditor = {
    getLength: vi.fn(() => 10),
    insertText: vi.fn(),
  };
  const mockQuillRef = {
    current: {
      getEditor: vi.fn(() => mockEditor),
    },
  } as unknown as React.RefObject<ReactQuill>;

  const sampleEntries: VoiceTranscriptEntry[] = [
    { id: 'e1', text: '発言1', timestamp: 1700000000000, agendaId: null },
    { id: 'e2', text: '発言2', timestamp: 1700000001000, agendaId: null },
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    mockVoiceHook.confirmedEntries = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  const renderDialog = async (isOpen = true, extraProps = {}) => {
    const props = {
      isOpen,
      onClose: mockOnClose,
      quillRef: mockQuillRef,
      onInserted: mockOnInserted,
      ...extraProps,
    };
    await act(async () => {
      createRoot(container).render(<VoiceTranscriptSummaryDialog {...props} />);
    });
  };

  it('isOpen=false のときダイアログが表示されない', async () => {
    await renderDialog(false);
    expect(container.querySelector('[data-testid="dialog"]')).toBeNull();
  });

  it('isOpen=true のときダイアログが表示される', async () => {
    await renderDialog(true);
    expect(container.querySelector('[data-testid="dialog"]')).not.toBeNull();
  });

  it('isEmpty のとき「文字起こしデータがありません」が表示される', async () => {
    mockVoiceHook.confirmedEntries = [];
    await renderDialog();
    expect(container.textContent).toContain('文字起こしデータがありません');
  });

  it('confirmedEntries があるとき原文テキストが表示される', async () => {
    mockVoiceHook.confirmedEntries = sampleEntries;
    mockSummarize.mockResolvedValue({ summary: 'AI要約結果', usedFallback: false });
    await renderDialog();
    expect(container.textContent).toContain('発言1');
    expect(container.textContent).toContain('発言2');
  });

  it('ダイアログ表示時に自動で summarizeVoiceTranscript が呼ばれる', async () => {
    mockVoiceHook.confirmedEntries = sampleEntries;
    mockSummarize.mockResolvedValue({ summary: 'AI要約結果', usedFallback: false });

    await renderDialog();
    await act(async () => {});

    expect(mockSummarize).toHaveBeenCalledTimes(1);
    expect(mockSummarize).toHaveBeenCalledWith(sampleEntries, null);
  });

  it('AI要約結果が textarea に表示される', async () => {
    mockVoiceHook.confirmedEntries = sampleEntries;
    mockSummarize.mockResolvedValue({ summary: 'まとめ内容', usedFallback: false });

    await renderDialog();
    await act(async () => {});

    const textarea = container.querySelector('[data-testid="summary-textarea"]') as HTMLTextAreaElement;
    expect(textarea.value).toBe('まとめ内容');
  });

  it('usedFallback=true のとき AI未構成の注記が表示される', async () => {
    mockVoiceHook.confirmedEntries = sampleEntries;
    mockSummarize.mockResolvedValue({ summary: '発言1\n発言2', usedFallback: true });

    await renderDialog();
    await act(async () => {});

    expect(container.textContent).toContain('AI設定未構成のため原文をそのまま表示しています');
  });

  it('「Quill に挿入して確定」ボタンクリックで editor.insertText が呼ばれる', async () => {
    mockVoiceHook.confirmedEntries = sampleEntries;
    mockSummarize.mockResolvedValue({ summary: '要約テキスト', usedFallback: false });

    await renderDialog();
    await act(async () => {});

    const buttons = Array.from(container.querySelectorAll('button'));
    const insertBtn = buttons.find(b => b.textContent?.includes('Quill に挿入'))!;

    await act(async () => {
      insertBtn.click();
    });

    const editor = (mockQuillRef.current as ReactQuill).getEditor();
    expect(editor.insertText).toHaveBeenCalledTimes(1);
    expect(editor.insertText).toHaveBeenCalledWith(
      10,
      expect.stringContaining('要約テキスト'),
      'user',
    );
  });

  it('「Quill に挿入して確定」後に clearTranscript と onInserted と onClose が呼ばれる', async () => {
    mockVoiceHook.confirmedEntries = sampleEntries;
    mockSummarize.mockResolvedValue({ summary: '要約テキスト', usedFallback: false });

    await renderDialog();
    await act(async () => {});

    const buttons = Array.from(container.querySelectorAll('button'));
    const insertBtn = buttons.find(b => b.textContent?.includes('Quill に挿入'))!;

    await act(async () => {
      insertBtn.click();
    });

    expect(mockVoiceHook.clearTranscript).toHaveBeenCalledTimes(1);
    expect(mockOnInserted).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('summaryText が空のとき「Quill に挿入して確定」ボタンが disabled', async () => {
    mockVoiceHook.confirmedEntries = sampleEntries;
    mockSummarize.mockResolvedValue({ summary: '', usedFallback: true });

    await renderDialog();
    await act(async () => {});

    const buttons = Array.from(container.querySelectorAll('button'));
    const insertBtn = buttons.find(b => b.textContent?.includes('Quill に挿入'));
    expect(insertBtn?.disabled).toBe(true);
  });

  it('「キャンセル」ボタンクリックで onClose が呼ばれる', async () => {
    mockVoiceHook.confirmedEntries = sampleEntries;
    mockSummarize.mockResolvedValue({ summary: '要約', usedFallback: false });

    await renderDialog();

    const buttons = Array.from(container.querySelectorAll('button'));
    const cancelBtn = buttons.find(b => b.textContent?.includes('キャンセル'))!;

    await act(async () => {
      cancelBtn.click();
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('「再生成」ボタンクリックで summarizeVoiceTranscript が再度呼ばれる', async () => {
    mockVoiceHook.confirmedEntries = sampleEntries;
    mockSummarize.mockResolvedValue({ summary: '初回要約', usedFallback: false });

    await renderDialog();
    await act(async () => {});

    mockSummarize.mockClear();
    mockSummarize.mockResolvedValue({ summary: '再生成要約', usedFallback: false });

    const buttons = Array.from(container.querySelectorAll('button'));
    const regenBtn = buttons.find(b => b.textContent?.includes('再生成'))!;

    await act(async () => {
      regenBtn.click();
    });
    await act(async () => {});

    expect(mockSummarize).toHaveBeenCalledTimes(1);
    const textarea = container.querySelector('[data-testid="summary-textarea"]') as HTMLTextAreaElement;
    expect(textarea.value).toBe('再生成要約');
  });
});
