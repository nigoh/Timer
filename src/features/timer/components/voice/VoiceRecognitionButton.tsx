import React from "react";
import { Mic, MicOff } from "lucide-react";
import { Tooltip } from "@radix-ui/themes";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useVoiceRecognition } from "@/features/timer/hooks/useVoiceRecognition";
import { cn } from "@/lib/utils";

interface VoiceRecognitionButtonProps {
  agendaId: string | null;
}

export const VoiceRecognitionButton: React.FC<VoiceRecognitionButtonProps> = ({
  agendaId,
}) => {
  const {
    isListening,
    isSupported,
    language,
    error,
    start,
    stop,
    setLanguage,
  } = useVoiceRecognition();

  const handleToggle = () => {
    if (isListening) {
      stop();
    } else {
      start(agendaId);
    }
  };

  const button = (
    <Button
      type="button"
      variant={isListening ? "destructive" : "outline"}
      size="sm"
      disabled={!isSupported}
      onClick={handleToggle}
      aria-label={isListening ? "録音停止" : "録音開始"}
      className={cn("relative gap-1.5", isListening && "animate-pulse")}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      {isListening ? "停止" : "録音"}
      {isListening && (
        <Badge
          variant="secondary"
          className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs"
        >
          ●
        </Badge>
      )}
    </Button>
  );

  return (
    <div className="flex items-center gap-2">
      {isSupported ? (
        button
      ) : (
        <Tooltip content="このブラウザは音声認識に対応していません（Chrome / Edge をお使いください）">
          <span>{button}</span>
        </Tooltip>
      )}

      <Select
        value={language}
        onValueChange={(v: "ja-JP" | "en-US") => setLanguage(v)}
        disabled={!isSupported || isListening}
      >
        <SelectTrigger className="h-8 w-[80px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ja-JP">日本語</SelectItem>
          <SelectItem value="en-US">English</SelectItem>
        </SelectContent>
      </Select>

      {error === "permission-denied" && (
        <span className="text-xs text-destructive">
          マイクへのアクセスを許可してください
        </span>
      )}
      {error === "network" && (
        <span className="text-xs text-destructive">
          音声認識に失敗しました。ネットワークを確認してください
        </span>
      )}
      {error === "aborted" && (
        <span className="text-xs text-destructive">
          音声認識が中断されました
        </span>
      )}
    </div>
  );
};
