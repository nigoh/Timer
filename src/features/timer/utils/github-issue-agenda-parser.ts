export interface ParsedIssueAgendaItem {
  title: string;
  plannedDurationMinutes?: number;
}

export interface ParsedIssueTodoItem {
  text: string;
  owner?: string;
  dueDate?: string;
}

const parseDurationMinutes = (text: string): number | undefined => {
  const englishMatch = text.match(/Duration\s*:\s*(\d+)\s*m/i);
  if (englishMatch) {
    return Number.parseInt(englishMatch[1], 10);
  }

  const japaneseMatch = text.match(/所要\s*[:：]\s*(\d+)\s*分/);
  if (japaneseMatch) {
    return Number.parseInt(japaneseMatch[1], 10);
  }

  return undefined;
};

const normalizeTitle = (text: string): string => {
  return text
    .replace(/\(\s*Duration\s*:\s*\d+\s*m\s*\)/gi, "")
    .replace(/\(\s*所要\s*[:：]\s*\d+\s*分\s*\)/g, "")
    .replace(/Duration\s*:\s*\d+\s*m/gi, "")
    .replace(/所要\s*[:：]\s*\d+\s*分/g, "")
    .replace(/[()（）]/g, "")
    .trim();
};

const toAgendaItem = (line: string): ParsedIssueAgendaItem | null => {
  const checklistMatch = line.match(/^- \[[ xX]\]\s+(.+)$/);
  const bulletMatch = line.match(/^[-*]\s+(.+)$/);
  const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
  const content = checklistMatch?.[1] ?? bulletMatch?.[1] ?? numberedMatch?.[1];

  if (!content) {
    return null;
  }

  const plannedDurationMinutes = parseDurationMinutes(content);
  const title = normalizeTitle(content);
  if (!title) {
    return null;
  }

  return {
    title,
    plannedDurationMinutes,
  };
};

export const parseIssueAgendaItems = (body: string): ParsedIssueAgendaItem[] => {
  const lines = body.split("\n").map((line) => line.trim());
  const inAgendaSectionItems: ParsedIssueAgendaItem[] = [];
  const checklistItems: ParsedIssueAgendaItem[] = [];
  const bulletItems: ParsedIssueAgendaItem[] = [];
  let inAgendaSection = false;

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      const headingText = headingMatch[1].toLowerCase();
      inAgendaSection = headingText.includes("agenda") || headingText.includes("議題");
      continue;
    }

    const item = toAgendaItem(line);
    if (!item) {
      continue;
    }

    const isChecklist = /^- \[[ xX]\]/.test(line);
    if (inAgendaSection) {
      inAgendaSectionItems.push(item);
    } else if (isChecklist) {
      checklistItems.push(item);
    } else {
      bulletItems.push(item);
    }
  }

  return [...inAgendaSectionItems, ...checklistItems, ...bulletItems];
};

const parseTodoItem = (line: string): ParsedIssueTodoItem | null => {
  const checklistMatch = line.match(/^- \[[ xX]\]\s+(.+)$/);
  if (!checklistMatch?.[1]) {
    return null;
  }

  const source = checklistMatch[1].trim();
  const ownerMatch =
    source.match(/@([a-zA-Z0-9_-]+)/) ?? source.match(/担当\s*[:：]\s*([^\s]+)/);
  const dueDateMatch =
    source.match(/(?:期限|due)\s*[:：]\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i) ?? null;

  const text = source
    .replace(/@([a-zA-Z0-9_-]+)/g, "")
    .replace(/担当\s*[:：]\s*[^\s]+/g, "")
    .replace(/(?:期限|due)\s*[:：]\s*[0-9]{4}-[0-9]{2}-[0-9]{2}/gi, "")
    .trim();

  if (!text) {
    return null;
  }

  return {
    text,
    owner: ownerMatch?.[1],
    dueDate: dueDateMatch?.[1],
  };
};

export const parseIssueTodoItems = (body: string): ParsedIssueTodoItem[] => {
  return body
    .split("\n")
    .map((line) => line.trim())
    .map(parseTodoItem)
    .filter((item): item is ParsedIssueTodoItem => item !== null);
};
