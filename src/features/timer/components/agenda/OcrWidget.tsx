import React, { useState } from "react";
import { ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OcrImportDialog } from "./OcrImportDialog";

/**
 * ウィジェットキャンバス用 OCR ウィジェット。
 * ダイアログを開いてテキストをクリップボードにコピーする。
 */
export const OcrWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [lastText, setLastText] = useState<string | null>(null);

  const handleImport = (text: string) => {
    setLastText(text);
    navigator.clipboard.writeText(text).catch(() => {});
    setIsOpen(false);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      <ScanText className="h-8 w-8 text-muted-foreground" />
      <p className="text-center text-sm text-muted-foreground">
        画像からテキストを読み取ります
      </p>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        画像を選択
      </Button>
      {lastText && (
        <p className="line-clamp-3 max-w-full text-xs text-muted-foreground">
          {lastText}
        </p>
      )}
      <OcrImportDialog
        isOpen={isOpen}
        mode="agenda"
        onClose={() => setIsOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
};
