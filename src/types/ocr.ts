/** OCR 読み取り対象言語 */
export type OcrLanguage = 'jpn' | 'jpn_vert' | 'eng';

/** OCR 実行オプション */
export interface OcrOptions {
  /** 認識言語（デフォルト: jpn） */
  language?: OcrLanguage;
  /** 進捗コールバック（0–100）*/
  onProgress?: (progress: number) => void;
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
