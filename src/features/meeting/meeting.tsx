import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useMeetingStore } from './stores/useMeetingStore';
import { useRunStore } from './stores/useRunStore';
import { TimerControls, OverrunDialog, MinutesPane } from './components/MeetingDialogs';

const formatSec = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const MeetingRunPage: React.FC = () => {
  const activeMeetingId = useMeetingStore((s) => s.activeMeetingId);
  const meeting = useMeetingStore(
    useCallback((s) => s.meetings.find((m) => m.id === activeMeetingId) ?? null, [activeMeetingId])
  );
  const currentAgendaId = useRunStore((s) => s.currentAgendaId);
  const sec = useRunStore((s) => s.lastEmittedSec);
  const isRunning = useRunStore((s) => s.isRunning);
  const [showOverrun, setShowOverrun] = React.useState(false);

  const currentAgenda = useMemo(() => {
    if (!meeting || !currentAgendaId) return null;
    return meeting.agendas.find((a) => a.id === currentAgendaId) ?? null;
  }, [meeting, currentAgendaId]);

  const planned = currentAgenda?.plannedDuration ?? 0;
  const actual = currentAgenda?.actualDuration ?? sec;

  if (!meeting) return <div>会議が見つかりません。</div>;

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{meeting.title} — 実行</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xl">現在: {currentAgenda?.title ?? '未選択'}</div>
          <div className="text-4xl font-mono">{formatSec(actual)} / {formatSec(planned)}</div>
          <TimerControls onOverrun={() => setShowOverrun(true)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>議事録</CardTitle>
        </CardHeader>
        <CardContent>
          <MinutesPane />
        </CardContent>
      </Card>

      <OverrunDialog open={showOverrun} onOpenChange={setShowOverrun} />

      {!isRunning && (
        <div className="text-sm text-muted-foreground">タイマーは停止中です。開始して進行を始めてください。</div>
      )}
    </div>
  );
};

export default MeetingRunPage;
