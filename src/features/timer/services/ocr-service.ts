import { createWorker } from 'tesseract.js';
import type { OcrOptions, OcrResult } from '@/types/ocr';
import { logger } from '@/utils/logger';

class OcrService {
  /**
   * 画像ファイルからテキストを認識する。
   *
   * Tesseract.js を使用したブラウザ内 OCR。
   * 初回実行時は言語データを CDN から自動ダウンロードする（数 MB）。
   *
   * @param image - 対象画像（File または Blob）
   * @param options - 認識オプション
   * @returns OCR 認識結果
   */
  async recognize(image: File | Blob, options: OcrOptions = {}): Promise<OcrResult> {
    const { language = 'jpn', onProgress } = options;

    logger.info('OCR 開始', { language, imageSize: image.size }, 'ocr');

    const worker = await createWorker(language, 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    try {
      const { data } = await worker.recognize(image);
      const result: OcrResult = {
        text: data.text.trim(),
        confidence: data.confidence,
      };
      logger.info('OCR 完了', { confidence: result.confidence }, 'ocr');
      return result;
    } catch (error) {
      logger.error('OCR 失敗', error, 'ocr');
      throw error;
    } finally {
      await worker.terminate();
    }
  }
}

export const ocrService = new OcrService();
