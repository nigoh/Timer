import React, { useMemo } from 'react';
import type { Meeting, AgendaItem } from '../constants/meetingConstants';
import { spacingTokens } from '../../../theme/designSystem';

interface MeetingSummaryTableProps {
  meeting: Meeting | null;
}

const cellStyle: React.CSSProperties = {
  paddingTop: spacingTokens.sm,
  paddingBottom: spacingTokens.sm,
  paddingLeft: spacingTokens.sm,
  paddingRight: spacingTokens.sm,
  borderBottom: '1px solid var(--border)',
};

const headerStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 600,
  textAlign: 'left',
};

const formatSeconds = (sec: number) => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const countActionItems = (agenda: AgendaItem) => agenda.minutes.filter((m) => m.type === 'Action').length;

export const MeetingSummaryTable: React.FC<MeetingSummaryTableProps> = ({ meeting }) => {
  const rows = useMemo(() => {
    if (!meeting) return [] as AgendaItem[];
    return [...meeting.agendas].sort((a, b) => a.order - b.order);
  }, [meeting]);

  if (!meeting) {
    return <p className="text-sm text-muted-foreground">進行中の会議を選択してください。</p>;
  }

  const totals = rows.reduce(
    (acc, agenda) => ({
      planned: acc.planned + agenda.plannedDuration,
      actual: acc.actual + agenda.actualDuration,
      actions: acc.actions + countActionItems(agenda),
    }),
    { planned: 0, actual: 0, actions: 0 },
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th style={headerStyle}>順番</th>
            <th style={headerStyle}>議題</th>
            <th style={headerStyle}>予定</th>
            <th style={headerStyle}>実績</th>
            <th style={headerStyle}>決定・アクション</th>
            <th style={headerStyle}>超過対応</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((agenda) => (
            <tr key={agenda.id}>
              <td style={cellStyle}>{agenda.order + 1}</td>
              <td style={cellStyle}>
                <div className="font-medium">{agenda.title}</div>
                <div className="text-xs text-muted-foreground">{agenda.goal}</div>
              </td>
              <td style={cellStyle}>{formatSeconds(agenda.plannedDuration)}</td>
              <td style={cellStyle}>{formatSeconds(agenda.actualDuration)}</td>
              <td style={cellStyle}>{countActionItems(agenda)}</td>
              <td style={cellStyle}>
                <ul className="space-y-1">
                  {agenda.overrunDecisions.map((decision) => (
                    <li key={decision.at} className="text-xs text-muted-foreground">
                      {decision.type} {decision.amountSec ? `${decision.amountSec}s` : ''}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={cellStyle} colSpan={2}>合計</td>
            <td style={cellStyle}>{formatSeconds(totals.planned)}</td>
            <td style={cellStyle}>{formatSeconds(totals.actual)}</td>
            <td style={cellStyle}>{totals.actions}</td>
            <td style={cellStyle}>
              {totals.actual > totals.planned ? 'オーバー' : 'オンタイム'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default MeetingSummaryTable;
