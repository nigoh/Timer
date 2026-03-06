import React, { useRef, useState } from "react";
import { Camera, FileImage, Loader2, ScanText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ocrService } from "@/features/timer/services/ocr-service";
import type { OcrImportMode, OcrLanguage } from "@/types/ocr";

const ACCEPT_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif,image/bmp";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB

export interface OcrImportDialogProps {
  isOpen: boolean;
  /** 'agenda': アジェンダ下書きへの取り込み / 'minutes': 議事録への挿入 */
  mode: OcrImportMode;
  onClose: () => void;
  /** 認識結果テキストを呼び出し元に渡す */
  onImport: (text: string) => void;
}

export const OcrImportDialog: React.FC<OcrImportDialogProps> = ({
  isOpen,
  mode,
  onClose,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrText, setOcrText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<OcrLanguage>("jpn");

  const reset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setImageFile(null);
    setIsRecognizing(false);
    setProgress(0);
    setOcrText("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const loadImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください（PNG / JPEG / WebP 対応）");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("画像サイズは 20 MB 以下にしてください");
      return;
    }
    setError(null);
    setOcrText("");
    setProgress(0);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setImageFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImageFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) loadImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRecognize = async () => {
    if (!imageFile) return;
    setIsRecognizing(true);
    setProgress(0);
    setError(null);
    try {
      const result = await ocrService.recognize(imageFile, {
        language,
        onProgress: setProgress,
      });
      setOcrText(result.text);
    } catch {
      setError("文字認識に失敗しました。別の画像をお試しください。");
    } finally {
      setIsRecognizing(false);
      setProgress(0);
    }
  };

  const handleImport = () => {
    if (!ocrText.trim()) return;
    onImport(ocrText.trim());
    handleClose();
  };

  const importButtonLabel =
    mode === "agenda" ? "アジェンダ下書きに反映" : "議事録に挿入";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        className="sm:max-w-lg [&>button]:hidden"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <ScanText className="h-4 w-4" />
              画像から文字を読み込む
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              aria-label="ダイアログを閉じる"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* 画像選択エリア */}
          {!imageUrl ? (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-muted-foreground/30 p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="画像をドラッグ&ドロップまたはクリックして選択"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <FileImage className="h-8 w-8 text-muted-foreground/50" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  ドラッグ&ドロップまたはクリックして選択
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG / JPEG / WebP（最大 20 MB）
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <FileImage className="mr-1.5 h-3.5 w-3.5" />
                  ファイルを選択
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                >
                  <Camera className="mr-1.5 h-3.5 w-3.5" />
                  カメラ撮影
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="OCR 対象画像"
                  className="max-h-48 w-full rounded-md object-contain bg-muted/30"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0 bg-background/80 hover:bg-background"
                  onClick={reset}
                  aria-label="画像をクリア"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* 言語選択 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">認識言語:</span>
                {(
                  [
                    { value: "jpn", label: "日本語（横書き）" },
                    { value: "jpn_vert", label: "日本語（縦書き）" },
                    { value: "eng", label: "英語" },
                  ] as { value: OcrLanguage; label: string }[]
                ).map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="ocr-language"
                      value={value}
                      checked={language === value}
                      onChange={() => setLanguage(value)}
                      className="accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>

              {/* OCR 実行ボタン */}
              {!ocrText && (
                <Button
                  type="button"
                  onClick={handleRecognize}
                  disabled={isRecognizing}
                  className="w-full"
                  size="sm"
                >
                  {isRecognizing ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      認識中...
                    </>
                  ) : (
                    <>
                      <ScanText className="mr-1.5 h-3.5 w-3.5" />
                      文字を認識する
                    </>
                  )}
                </Button>
              )}

              {/* 進捗バー */}
              {isRecognizing && (
                <div className="space-y-1">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground text-right">
                    {progress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* OCR 結果テキスト */}
          {ocrText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">認識結果（編集可）</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={() => setOcrText("")}
                >
                  クリア
                </Button>
              </div>
              <Textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                rows={8}
                className="text-sm font-mono resize-y"
                placeholder="認識されたテキストが表示されます"
              />
              {mode === "agenda" && (
                <p className="text-xs text-muted-foreground">
                  ヒント: 1 行につき 1 議題として読み込みます。「タイトル | 分数」形式にすると予定時間も設定できます。
                </p>
              )}
            </div>
          )}

          {/* フッターボタン */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              キャンセル
            </Button>
            {ocrText && (
              <Button
                type="button"
                size="sm"
                onClick={handleImport}
                disabled={!ocrText.trim()}
              >
                {importButtonLabel}
              </Button>
            )}
          </div>
        </div>

        {/* 非表示ファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_IMAGE_TYPES}
          className="hidden"
          onChange={handleFileChange}
          aria-hidden="true"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept={ACCEPT_IMAGE_TYPES}
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </DialogContent>
    </Dialog>
  );
};
