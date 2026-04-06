import type { DrawRecord, GiveawayEntry } from '../types';

const ENTRY_HEADERS = [
  'displayName',
  'handle',
  'avatarUrl',
  'tweetUrl',
  'tweetId',
  'commentText',
  'note',
  'prize',
];

function escapeCell(value: string) {
  const normalized = value.replace(/"/g, '""');
  return `"${normalized}"`;
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === ',' && !insideQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function exportEntriesCsv(entries: GiveawayEntry[]) {
  const rows = [
    ENTRY_HEADERS.join(','),
    ...entries.map((entry) =>
      [
        entry.displayName,
        entry.handle,
        entry.avatarUrl,
        entry.tweetUrl,
        entry.tweetId,
        entry.commentText,
        entry.note,
        entry.prize,
      ]
        .map((value) => escapeCell(value))
        .join(','),
    ),
  ];

  return rows.join('\n');
}

export function importEntriesCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const firstRow = splitCsvLine(lines[0]);
  const hasHeaders = firstRow.some((cell) => ENTRY_HEADERS.includes(cell));
  const dataLines = hasHeaders ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const [
      displayName = '',
      handle = '',
      avatarUrl = '',
      tweetUrl = '',
      tweetId = '',
      commentText = '',
      note = '',
      prize = '',
    ] =
      splitCsvLine(line);

    return {
      displayName,
      handle,
      avatarUrl,
      tweetUrl,
      tweetId,
      commentText,
      note,
      prize,
    };
  });
}

export function exportHistoryCsv(history: DrawRecord[]) {
  const rows = [
    ['drawId', 'createdAt', 'position', 'displayName', 'handle', 'tweetUrl', 'tweetId', 'prize'].join(','),
  ];

  history.forEach((draw) => {
    draw.winners.forEach((winner, index) => {
      rows.push(
        [
          draw.id,
          draw.createdAt,
          String(index + 1),
          winner.displayName,
          winner.handle,
          winner.tweetUrl,
          winner.tweetId,
          winner.prize,
        ]
          .map((value) => escapeCell(value))
          .join(','),
      );
    });
  });

  return rows.join('\n');
}
