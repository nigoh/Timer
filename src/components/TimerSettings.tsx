import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Settings, Clock } from 'lucide-react';

interface TimerSettingsProps {
  duration: number;
  onDurationChange: (duration: number) => void;
  disabled?: boolean;
}

export const TimerSettings: React.FC<TimerSettingsProps> = ({
  duration,
  onDurationChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [minutes, setMinutes] = useState(Math.floor(duration / 60));
  const [seconds, setSeconds] = useState(duration % 60);

  const handleSave = () => {
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds > 0) {
      onDurationChange(totalSeconds);
      setIsOpen(false);
    }
  };

  const presetTimes = [
    { label: '5分', value: 5 * 60 },
    { label: '10分', value: 10 * 60 },
    { label: '15分', value: 15 * 60 },
    { label: '25分', value: 25 * 60 },
    { label: '30分', value: 30 * 60 },
    { label: '45分', value: 45 * 60 },
    { label: '60分', value: 60 * 60 },
  ];

  const handlePresetSelect = (value: number) => {
    setMinutes(Math.floor(value / 60));
    setSeconds(value % 60);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Settings className="w-4 h-4 mr-2" />
          時間設定
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            タイマー時間設定
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* プリセット時間 */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              プリセット時間
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {presetTimes.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(preset.value)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* カスタム時間設定 */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              カスタム時間
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="minutes" className="text-xs text-muted-foreground">
                  分
                </Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="999"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="text-center"
                />
              </div>
              
              <span className="text-2xl font-mono text-muted-foreground">:</span>
              
              <div className="flex-1">
                <Label htmlFor="seconds" className="text-xs text-muted-foreground">
                  秒
                </Label>
                <Input
                  id="seconds"
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="text-center"
                />
              </div>
            </div>
          </div>
          
          {/* プレビュー */}
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-mono font-bold">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              合計: {minutes * 60 + seconds}秒
            </div>
          </div>
          
          {/* アクションボタン */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={minutes === 0 && seconds === 0}>
              設定を保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
