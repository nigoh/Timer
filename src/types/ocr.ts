/** OCR 読み取り対象言語 */
export type OcrLanguage = 'jpn' | 'jpn_vert' | 'eng';

/**
 * OCR 処理フェーズ
 * - preparing: エンジン・WASM の初期化
 * - loading:   言語データのダウンロード
 * - recognizing: テキスト認識
 */
export type OcrPhase = 'preparing' | 'loading' | 'recognizing';

/** OCR 実行オプション */
export interface OcrOptions {
  /** 認識言語（デフォルト: jpn） */
  language?: OcrLanguage;
  /** 進捗コールバック（0–100）認識フェーズのみ */
  onProgress?: (progress: number) => void;
  /** フェーズと進捗を同時に通知するコールバック（0–100） */
  onPhaseChange?: (phase: OcrPhase, progress: number) => void;
}

/** OCR 認識結果 */
export interface OcrResult {
  /** 抽出テキスト */
  text: string;
  /** 信頼度（0–100） */
  confidence: number;
}

/** OCR ダイアログのモード */
export type OcrImportMode = 'agenda' | 'minutes';
