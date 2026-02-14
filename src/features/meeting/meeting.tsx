import React, { useMemo, useCallback, useEffect } from 'react';
import { FeatureLayout } from '../../components/layout/FeatureLayout';
import { FeatureHeader } from '../../components/layout/FeatureHeader';
import { FeatureContent } from '../../components/layout/FeatureContent';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useMeetingStore } from './stores/useMeetingStore';
import { useRunStore } from './stores/useRunStore';
import { TimerControls, OverrunDialog, MinutesPane } from './components/MeetingDialogs';
import { MeetingSummaryTable } from './components/MeetingListTable';
import type { AgendaItem, Meeting } from './constants/meetingConstants';

const formatSec = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

interface MinuteStats {
  total: number;
  decisions: number;
  actions: number;
}

export const MeetingRunPage: React.FC = () => {
  const activeMeetingId = useMeetingStore((s) => s.activeMeetingId);
  const meeting = useMeetingStore(
    useCallback((s) => s.meetings.find((m) => m.id === activeMeetingId) ?? null, [activeMeetingId])
  );
  const meetingId = meeting?.id ?? null;
  const currentAgendaId = useRunStore((s) => s.currentAgendaId);
  const sec = useRunStore((s) => s.lastEmittedSec);
  const isRunning = useRunStore((s) => s.isRunning);
  const initialize = useRunStore((s) => s.initialize);
  const [showOverrun, setShowOverrun] = React.useState(false);

  useEffect(() => {
    if (!meetingId) return;
    initialize();
  }, [meetingId, initialize]);

  const currentAgenda = useMemo(() => {
    if (!meeting || !currentAgendaId) return null;
    return meeting.agendas.find((a) => a.id === currentAgendaId) ?? null;
  }, [meeting, currentAgendaId]);

  const planned = currentAgenda?.plannedDuration ?? 0;
  const actual = currentAgenda?.actualDuration ?? sec;

  const minuteStats = useMemo<MinuteStats>(() => {
    if (!meeting) return { total: 0, decisions: 0, actions: 0 };
    return meeting.agendas.reduce(
      (acc, agenda) => {
        agenda.minutes.forEach((minute) => {
          acc.total += 1;
          if (minute.type === 'Decision') acc.decisions += 1;
          if (minute.type === 'Action') acc.actions += 1;
        });
        return acc;
      },
      { total: 0, decisions: 0, actions: 0 },
    );
  }, [meeting]);

  if (!meeting) {
    return <EmptyMeetingState />;
  }

  return (
    <MeetingRunLayout
      meeting={meeting}
      planned={planned}
      actual={actual}
      isRunning={isRunning}
      minuteStats={minuteStats}
      currentAgenda={currentAgenda}
      showOverrun={showOverrun}
      onToggleOverrun={setShowOverrun}
    />
  );
};

const EmptyMeetingState: React.FC = () => (
  <FeatureLayout maxWidth={false}>
    <FeatureHeader title="会議進行" subtitle="進行中の会議を選択してください" showAddButton={false} />
    <FeatureContent>
      <div className="text-sm text-muted-foreground">会議が見つかりません。</div>
    </FeatureContent>
  </FeatureLayout>
);

interface MeetingRunLayoutProps {
  meeting: Meeting;
  planned: number;
  actual: number;
  isRunning: boolean;
  minuteStats: MinuteStats;
  currentAgenda: AgendaItem | null;
  showOverrun: boolean;
  onToggleOverrun: (open: boolean) => void;
}

const MeetingRunLayout: React.FC<MeetingRunLayoutProps> = ({
  meeting,
  planned,
  actual,
  isRunning,
  minuteStats,
  currentAgenda,
  showOverrun,
  onToggleOverrun,
}) => (
  <FeatureLayout maxWidth={false}>
    <FeatureHeader title="会議進行" subtitle={meeting.title} showAddButton={false} />

    <FeatureContent variant="transparent" padding={0}>
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <TimerCard
          agenda={currentAgenda}
          planned={planned}
          actual={actual}
          isRunning={isRunning}
          onOpenOverrun={() => onToggleOverrun(true)}
        />
        <MinutesCard />
      </div>
    </FeatureContent>

    <FeatureContent>
      <SummarySection stats={minuteStats} meeting={meeting} />
    </FeatureContent>

    <OverrunDialog open={showOverrun} onOpenChange={onToggleOverrun} />
  </FeatureLayout>
);

const TimerCard: React.FC<{ agenda: AgendaItem | null; planned: number; actual: number; isRunning: boolean; onOpenOverrun: () => void }> = ({ agenda, planned, actual, isRunning, onOpenOverrun }) => (
  <Card>
    <CardHeader>
      <CardTitle>{agenda?.title ?? '議題未選択'}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="text-sm text-muted-foreground">
        進行中の議題をタイムボックス内に収めるよう管理します。
      </div>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-4xl font-mono">{formatSec(actual)}</span>
        <span className="text-sm text-muted-foreground">予定 {formatSec(planned)}</span>
      </div>
      <TimerControls onOverrun={onOpenOverrun} />
      {!isRunning ? (
        <div className="rounded-md border border-dashed border-muted p-3 text-sm text-muted-foreground">
          タイマーは停止中です。開始ボタンから進行を始めてください。
        </div>
      ) : null}
    </CardContent>
  </Card>
);

const MinutesCard: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>議事メモ</CardTitle>
    </CardHeader>
    <CardContent>
      <MinutesPane />
    </CardContent>
  </Card>
);

const SummarySection: React.FC<{ stats: MinuteStats; meeting: Meeting }> = ({ stats, meeting }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold">進行サマリー</h2>
      <p className="text-sm text-muted-foreground">議題の予定 vs 実績、超過対応、アクション数を一覧で確認できます。</p>
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      <SummaryStat label="記録総数" value={stats.total} />
      <SummaryStat label="決定事項" value={stats.decisions} />
      <SummaryStat label="アクション" value={stats.actions} />
    </div>

    <MeetingSummaryTable meeting={meeting} />
  </div>
);

const SummaryStat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-lg border border-border bg-muted/30 p-4">
    <div className="text-xs uppercase text-muted-foreground">{label}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

export default MeetingRunPage;
