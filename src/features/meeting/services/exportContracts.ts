import type { Meeting } from '../constants/meetingConstants';

export function exportMarkdown(meeting: Meeting): string {
  // Minimal placeholder; implement fully in US3 tasks
  const lines: string[] = [];
  lines.push(`# ${meeting.title}`);
  lines.push(`Date: ${meeting.date} ${meeting.startTime}`);
  lines.push(`Location: ${meeting.location}`);
  lines.push('');
  meeting.agendas
    .sort((a, b) => a.order - b.order)
    .forEach((a, idx) => {
      lines.push(`## ${idx + 1}. ${a.title} (${a.category})`);
      lines.push(`Goal: ${a.goal}`);
      lines.push(`Presenter: ${a.presenter}`);
      lines.push(`Planned: ${a.plannedDuration}s / Actual: ${a.actualDuration}s`);
      const notes = a.minutes.filter((m) => m.type === 'Note');
      const decisions = a.minutes.filter((m) => m.type === 'Decision');
      const actions = a.minutes.filter((m) => m.type === 'Action');
      if (notes.length) {
        lines.push('### Notes');
        notes.forEach((n) => lines.push(`- ${n.content}`));
      }
      if (decisions.length) {
        lines.push('### Decisions');
        decisions.forEach((n) => lines.push(`- ${n.content}`));
      }
      if (actions.length) {
        lines.push('### Actions');
        actions.forEach((n) => lines.push(`- ${n.content}${n.owner ? ` (owner: ${n.owner})` : ''}${n.due ? ` due: ${n.due}` : ''}`));
      }
      lines.push('');
    });
  return lines.join('\n');
}

export function exportCsvs(meeting: Meeting): { agendasCsv: string; actionsCsv: string } {
  const agendaHeader = 'title,category,goal,outline,presenter,plannedSec,actualSec,overrunDecision';
  const agendasRows = meeting.agendas
    .sort((a, b) => a.order - b.order)
    .map((a) => {
      const lastDecision = a.overrunDecisions.at(-1);
      const decisionStr = lastDecision ? `${lastDecision.type}:${lastDecision.amountSec ?? 0}` : '';
      const esc = (s: string) => '"' + (s ?? '').replace(/"/g, '""') + '"';
      return [esc(a.title), esc(String(a.category)), esc(a.goal), esc(a.discussionOutline), esc(a.presenter), a.plannedDuration, a.actualDuration, esc(decisionStr)].join(',');
    });
  const agendasCsv = [agendaHeader, ...agendasRows].join('\n');

  const actionsHeader = 'agendaTitle,owner,dueISO,content';
  const actionsRows: string[] = [];
  meeting.agendas.forEach((a) => {
    a.minutes.filter((m) => m.type === 'Action').forEach((act) => {
      const esc = (s: string) => '"' + (s ?? '').replace(/"/g, '""') + '"';
      actionsRows.push([esc(a.title), esc(act.owner ?? ''), esc(act.due ?? ''), esc(act.content)].join(','));
    });
  });
  const actionsCsv = [actionsHeader, ...actionsRows].join('\n');
  return { agendasCsv, actionsCsv };
}

export async function exportPdf(meeting: Meeting): Promise<Blob> {
  // Print-friendly HTML → Blob（実実装はUS3で強化）
  const html = `<html><head><meta charset="utf-8"/></head><body><pre>${escapeHtml(exportMarkdown(meeting))}</pre></body></html>`;
  return new Blob([html], { type: 'text/html' });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
