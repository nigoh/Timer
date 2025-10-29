import React, { useCallback, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { useRunStore } from '../stores/useRunStore';
import { useMeetingStore } from '../stores/useMeetingStore';

// Timer controls (start/pause/resume/next) with Overrun trigger
export const TimerControls: React.FC<{ onOverrun: () => void }> = ({ onOverrun }) => {
  const start = useRunStore((s) => s.start);
  const pause = useRunStore((s) => s.pause);
  const resume = useRunStore((s) => s.resume);
  const stop = useRunStore((s) => s.stop);
  const next = useRunStore((s) => s.nextAgenda);
  const isRunning = useRunStore((s) => s.isRunning);

  const onStart = useCallback(() => start(), [start]);
  const onPause = useCallback(() => pause(), [pause]);
  const onResume = useCallback(() => resume(), [resume]);
  const onStop = useCallback(() => stop(), [stop]);
  const onNext = useCallback(() => next(), [next]);

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onStart} variant="default">開始</Button>
      <Button onClick={onPause} variant="secondary" disabled={!isRunning}>一時停止</Button>
      <Button onClick={onResume} variant="secondary">再開</Button>
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

  const onExtend = useCallback(() => { extend(amount); onOpenChange(false); }, [extend, amount, onOpenChange]);
  const onBorrow = useCallback(() => { borrow(amount); onOpenChange(false); }, [borrow, amount, onOpenChange]);
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
  const addMinute = useRunStore((s) => s.addMinute);
  const currentAgendaId = useRunStore((s) => s.currentAgendaId);
  const meeting = useMeetingStore((s) => s.meetings.find((m) => m.id === s.activeMeetingId) ?? null);
  const minutes = useMemo(() => {
    if (!meeting || !currentAgendaId) return [] as { createdAt: string; content: string; id: string }[];
    const a = meeting.agendas.find((g) => g.id === currentAgendaId);
    return a?.minutes ?? [];
  }, [meeting, currentAgendaId]);

  const handleAdd = useCallback(() => {
    if (!text.trim()) return;
    addMinute(text.trim());
    setText('');
  }, [text, addMinute]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="メモ/決定/アクションを入力" />
        <Button onClick={handleAdd}>追加</Button>
      </div>
      <ul className="space-y-1">
        {minutes.map((m) => (
          <li key={m.id} className="text-sm">
            <span className="text-muted-foreground mr-2">{new Date(m.createdAt).toLocaleTimeString()}</span>
            {m.content}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TimerControls;
