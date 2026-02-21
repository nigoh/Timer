import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, X } from "lucide-react";
import { useAgendaTimerStore } from "@/features/timer/stores/agenda-timer-store";
import { GitHubIssueLinking } from "@/components/GitHubIssueLinking";
import { Meeting } from "@/types/agenda";

export interface AgendaSettingsDialogProps {
  meeting: Meeting;
  isOpen: boolean;
  onClose: () => void;
}

export const AgendaSettingsDialog: React.FC<AgendaSettingsDialogProps> = ({
  meeting,
  isOpen,
  onClose,
}) => {
  const { updateMeetingSettings } = useAgendaTimerStore();
  const [settings, setSettings] = useState(meeting.settings);
  const meetingIssueLinkId = `meeting:${meeting.id}`;

  useEffect(() => {
    setSettings(meeting.settings);
  }, [meeting.settings]);

  const handleSave = () => {
    updateMeetingSettings(meeting.id, settings);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              会議設定
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="ダイアログを閉じる"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本設定 */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">基本設定</h4>

            <div className="flex items-center justify-between">
              <Label className="text-sm">
                自動遷移
                <div className="text-xs text-muted-foreground">
                  アジェンダが終了したら自動で次へ
                </div>
              </Label>
              <Switch
                checked={settings.autoTransition}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    autoTransition: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">
                サイレントモード
                <div className="text-xs text-muted-foreground">
                  音を鳴らさずバイブのみ
                </div>
              </Label>
              <Switch
                checked={settings.silentMode}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    silentMode: checked,
                  })
                }
              />
            </div>
          </div>

          {/* ベル設定 */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">ベル通知設定</h4>

            <div>
              <Label className="text-sm mb-2 block">ベル音の種類</Label>
              <Select
                value={settings.bellSettings.soundType}
                onValueChange={(value: "single" | "double" | "loop") =>
                  setSettings({
                    ...settings,
                    bellSettings: {
                      ...settings.bellSettings,
                      soundType: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">単発ベル</SelectItem>
                  <SelectItem value="double">二打ベル</SelectItem>
                  <SelectItem value="loop">ループベル</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">開始時</Label>
                <Switch
                  checked={settings.bellSettings.start}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      bellSettings: {
                        ...settings.bellSettings,
                        start: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">残り5分</Label>
                <Switch
                  checked={settings.bellSettings.fiveMinWarning}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      bellSettings: {
                        ...settings.bellSettings,
                        fiveMinWarning: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">終了時</Label>
                <Switch
                  checked={settings.bellSettings.end}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      bellSettings: { ...settings.bellSettings, end: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">超過時</Label>
                <Switch
                  checked={settings.bellSettings.overtime}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      bellSettings: {
                        ...settings.bellSettings,
                        overtime: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <GitHubIssueLinking timeLogId={meetingIssueLinkId} />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>設定を保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
