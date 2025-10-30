import React, { useCallback, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useRunStore } from '../stores/useRunStore';
import { useMeetingStore } from '../stores/useMeetingStore';
import type { MinuteItem } from '../constants/meetingConstants';

// Timer controls (start/pause/resume/next) with Overrun trigger
export const TimerControls: React.FC<{ onOverrun: () => void }> = ({ onOverrun }) => {
  const start = useRunStore((s) => s.start);
  const pause = useRunStore((s) => s.pause);
  const resume = useRunStore((s) => s.resume);
  const reset = useRunStore((s) => s.reset);
  const stop = useRunStore((s) => s.stop);
  const next = useRunStore((s) => s.nextAgenda);
  const isRunning = useRunStore((s) => s.isRunning);

  const onStart = useCallback(() => start(), [start]);
  const onPause = useCallback(() => pause(), [pause]);
  const onResume = useCallback(() => resume(), [resume]);
  const onReset = useCallback(() => reset(), [reset]);
  const onStop = useCallback(() => stop(), [stop]);
  const onNext = useCallback(() => next({ reason: 'manual' }), [next]);

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onStart} variant="default">開始</Button>
      <Button onClick={onPause} variant="secondary" disabled={!isRunning}>一時停止</Button>
      <Button onClick={onResume} variant="secondary">再開</Button>
      <Button onClick={onReset} variant="outline">リセット</Button>
      <Button onClick={onStop} variant="outline">停止</Button>
      <Button onClick={onNext} variant="outline">次へ</Button>
      <Button onClick={onOverrun} variant="destructive">超過対応</Button>
    </div>
  );
};

// Overrun dialog (extend/borrow/next)
export const OverrunDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void }> = ({ open, onOpenChange }) => {
  const extend = useRunStore((s) => s.extendCurrent);
  const borrow = useRunStore((s) => s.borrowFromNext);
  const skip = useRunStore((s) => s.skipCurrent);
  const [amount, setAmount] = React.useState(60);

  const onExtend = useCallback(() => { extend(amount, 'overrun-dialog'); onOpenChange(false); }, [extend, amount, onOpenChange]);
  const onBorrow = useCallback(() => { borrow(amount, 'overrun-dialog'); onOpenChange(false); }, [borrow, amount, onOpenChange]);
  const onNext = useCallback(() => { skip(); onOpenChange(false); }, [skip, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>時間超過 — 対応を選択</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input type="number" min={10} step={10} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            <span>秒</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onExtend}>延長</Button>
            <Button onClick={onBorrow} variant="secondary">次から借用</Button>
            <Button onClick={onNext} variant="outline">次へ進む</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Minutes pane (add simple Note records for current agenda)
export const MinutesPane: React.FC = () => {
  const [text, setText] = React.useState('');
  const [minuteType, setMinuteType] = React.useState<MinuteItem['type']>('Note');
  const [owner, setOwner] = React.useState('');
  const [due, setDue] = React.useState('');
  const addMinute = useRunStore((s) => s.addMinute);
  const currentAgendaId = useRunStore((s) => s.currentAgendaId);
  const meeting = useMeetingStore((s) => s.meetings.find((m) => m.id === s.activeMeetingId) ?? null);
  const minutes = useMemo<MinuteItem[]>(() => {
    if (!meeting || !currentAgendaId) return [];
    const a = meeting.agendas.find((g) => g.id === currentAgendaId);
    return (a?.minutes ?? []) as MinuteItem[];
  }, [meeting, currentAgendaId]);

  const isAction = minuteType === 'Action';

  const handleAdd = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addMinute({
      content: trimmed,
      type: minuteType,
      owner: isAction ? owner.trim() || undefined : undefined,
      due: isAction && due ? due : undefined,
    });
    setText('');
    if (isAction) {
      setOwner('');
      setDue('');
    }
  }, [text, addMinute, minuteType, owner, due, isAction]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr,minmax(140px,200px)]">
        <div className="space-y-1">
          <Label htmlFor="minutes-content">内容</Label>
          <Input
            id="minutes-content"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="メモ/決定/アクションを入力"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="minutes-type">種別</Label>
          <Select value={minuteType} onValueChange={(value) => setMinuteType(value as MinuteItem['type'])}>
            <SelectTrigger id="minutes-type">
              <SelectValue placeholder="選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Note">メモ</SelectItem>
              <SelectItem value="Decision">決定</SelectItem>
              <SelectItem value="Action">アクション</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {isAction ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="minutes-owner">担当</Label>
            <Input
              id="minutes-owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="担当者"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="minutes-due">期限</Label>
            <Input
              id="minutes-due"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button onClick={handleAdd} disabled={!text.trim()}>追加</Button>
      </div>
      <ul className="space-y-1">
        {minutes.map((m) => (
          <li key={m.id} className="text-sm">
            <span className="text-muted-foreground mr-2">{new Date(m.createdAt).toLocaleTimeString()}</span>
            <span className="uppercase text-xs font-semibold mr-2">[{m.type}]</span>
            <span className="mr-2">{m.content}</span>
            {m.owner ? <span className="text-xs text-muted-foreground mr-2">担当: {m.owner}</span> : null}
            {m.due ? <span className="text-xs text-muted-foreground">期限: {m.due}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TimerControls;
