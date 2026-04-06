import confetti from 'canvas-confetti';
import { useEffect, useMemo, useState } from 'react';
import { AuditHistorySection } from './components/AuditHistorySection';
import { BulkInputSection } from './components/BulkInputSection';
import { DrawControlsSection } from './components/DrawControlsSection';
import { EntryForm } from './components/EntryForm';
import { EntryListSection } from './components/EntryListSection';
import { Section } from './components/Section';
import { SquigsLogo } from './components/SquigsLogo';
import { TweetOutputSection } from './components/TweetOutputSection';
import { WinnersSection } from './components/WinnersSection';
import type {
  AppLanguage,
  AppStateExport,
  DrawRecord,
  EntryDraft,
  GiveawayEntry,
  OutputStyle,
  PickerMode,
  SortMode,
  WinnerSnapshot,
} from './types';
import { exportEntriesCsv, exportHistoryCsv, importEntriesCsv } from './utils/csv';
import { fairShuffle } from './utils/random';
import {
  loadCommentCurrentDraw,
  loadCommentEntries,
  loadCommentHistory,
  loadCommentTargetTweetUrl,
  loadTweetCurrentDraw,
  loadTweetEntries,
  loadTweetHistory,
  saveCommentCurrentDraw,
  saveCommentEntries,
  saveCommentHistory,
  saveCommentTargetTweetUrl,
  saveTweetCurrentDraw,
  saveTweetEntries,
  saveTweetHistory,
} from './utils/storage';
import { enrichEntryMetadata, parseTweetUrl } from './utils/tweet';
import { buildHandlesOnly, buildTweetLinksOnly, buildTweetText, buildWinnersOnly } from './utils/tweetOutput';

const MAX_ENTRIES = 100;
const DEFAULT_WINNER_COUNT = 4;
const DEFAULT_REPLY_FETCH_LIMIT = 50;

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function downloadText(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toWinnerSnapshot(entry: GiveawayEntry): WinnerSnapshot {
  return {
    id: entry.id,
    displayName: entry.displayName,
    handle: entry.handle,
    avatarUrl: entry.avatarUrl,
    commentText: entry.commentText,
    tweetUrl: entry.tweetUrl,
    tweetId: entry.tweetId,
    prize: entry.prize,
    note: entry.note,
  };
}

function createEntryFromDraft(draft: EntryDraft) {
  const parsed = draft.tweetUrl ? parseTweetUrl(draft.tweetUrl) : null;
  if (draft.tweetUrl && parsed && !parsed.isValid) {
    throw new Error(parsed.error);
  }

  const handle = draft.handle.replace(/^@+/, '').trim() || parsed?.handle || '';
  const tweetUrl = parsed?.normalizedUrl || draft.tweetUrl.trim();
  const tweetId = parsed?.tweetId || createId('manual');
  const displayName = draft.displayName.trim() || handle || `tweet-${tweetId}`;
  const now = new Date().toISOString();

  return {
    id: createId('entry'),
    tweetUrl,
    normalizedTweetUrl: tweetUrl,
    tweetId,
    displayName,
    handle,
    avatarUrl: draft.avatarUrl.trim(),
    commentText: draft.commentText.trim(),
    note: draft.note.trim(),
    prize: draft.prize.trim(),
    createdAt: now,
    updatedAt: now,
    metadataStatus: draft.avatarUrl || draft.displayName || draft.handle ? ('manual' as const) : ('parsed' as const),
  };
}

function mergeEntries(existing: GiveawayEntry[], incoming: GiveawayEntry[]) {
  const byUrl = new Map(existing.map((entry) => [entry.normalizedTweetUrl || entry.id, entry]));

  incoming.forEach((entry) => {
    const key = entry.normalizedTweetUrl || entry.id;
    if (!byUrl.has(key)) {
      byUrl.set(key, entry);
    }
  });

  return Array.from(byUrl.values()).slice(0, MAX_ENTRIES);
}

export default function App() {
  const [mode, setMode] = useState<PickerMode>('tweet');
  const [language, setLanguage] = useState<AppLanguage>('en');

  const [tweetEntries, setTweetEntries] = useState<GiveawayEntry[]>(() => loadTweetEntries());
  const [tweetHistory, setTweetHistory] = useState<DrawRecord[]>(() => loadTweetHistory());
  const [tweetCurrentDraw, setTweetCurrentDraw] = useState<DrawRecord | null>(() => loadTweetCurrentDraw());

  const [commentEntries, setCommentEntries] = useState<GiveawayEntry[]>(() => loadCommentEntries());
  const [commentHistory, setCommentHistory] = useState<DrawRecord[]>(() => loadCommentHistory());
  const [commentCurrentDraw, setCommentCurrentDraw] = useState<DrawRecord | null>(() => loadCommentCurrentDraw());
  const [commentTargetTweetUrl, setCommentTargetTweetUrl] = useState<string>(() => loadCommentTargetTweetUrl());

  const [visibleWinners, setVisibleWinners] = useState<WinnerSnapshot[]>(() => loadTweetCurrentDraw()?.winners ?? []);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [winnerCount, setWinnerCount] = useState(DEFAULT_WINNER_COUNT);
  const [replyFetchLimit, setReplyFetchLimit] = useState(DEFAULT_REPLY_FETCH_LIMIT);
  const [excludePreviousWinners, setExcludePreviousWinners] = useState(false);
  const [lockWinners, setLockWinners] = useState(true);
  const [revealMode, setRevealMode] = useState<'all' | 'one'>('all');
  const [outputStyle, setOutputStyle] = useState<OutputStyle>('clean');
  const [includeNumbering, setIncludeNumbering] = useState(true);
  const [includeTweetLinks, setIncludeTweetLinks] = useState(false);
  const [editingEntry, setEditingEntry] = useState<GiveawayEntry | null>(null);

  const activeEntries = mode === 'tweet' ? tweetEntries : commentEntries;
  const activeHistory = mode === 'tweet' ? tweetHistory : commentHistory;
  const activeCurrentDraw = mode === 'tweet' ? tweetCurrentDraw : commentCurrentDraw;

  useEffect(() => {
    saveTweetEntries(tweetEntries);
  }, [tweetEntries]);

  useEffect(() => {
    saveTweetHistory(tweetHistory);
  }, [tweetHistory]);

  useEffect(() => {
    saveTweetCurrentDraw(tweetCurrentDraw);
  }, [tweetCurrentDraw]);

  useEffect(() => {
    saveCommentEntries(commentEntries);
  }, [commentEntries]);

  useEffect(() => {
    saveCommentHistory(commentHistory);
  }, [commentHistory]);

  useEffect(() => {
    saveCommentCurrentDraw(commentCurrentDraw);
  }, [commentCurrentDraw]);

  useEffect(() => {
    saveCommentTargetTweetUrl(commentTargetTweetUrl.trim());
  }, [commentTargetTweetUrl]);

  useEffect(() => {
    setVisibleWinners(activeCurrentDraw?.winners ?? []);
    setEditingEntry(null);
  }, [mode, activeCurrentDraw]);

  const previousWinnerIds = useMemo(() => new Set(activeHistory.flatMap((draw) => draw.winnerIds)), [activeHistory]);

  const duplicateHandleWarnings = useMemo(() => {
    const counts = new Map<string, number>();
    activeEntries.forEach((entry) => {
      if (!entry.handle) {
        return;
      }
      counts.set(entry.handle, (counts.get(entry.handle) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([handle]) => handle);
  }, [activeEntries]);

  const eligibleEntries = useMemo(() => {
    if (!excludePreviousWinners) {
      return activeEntries;
    }
    return activeEntries.filter((entry) => !previousWinnerIds.has(entry.id));
  }, [activeEntries, excludePreviousWinners, previousWinnerIds]);

  useEffect(() => {
    setWinnerCount((current) => {
      const maxAllowed = Math.max(1, activeEntries.length || DEFAULT_WINNER_COUNT);
      return Math.min(Math.max(current, 1), maxAllowed);
    });
  }, [activeEntries.length, mode]);

  const tweetText = useMemo(
    () =>
      buildTweetText(visibleWinners, {
        style: outputStyle,
        includeNumbering,
        includeTweetLinks,
        language,
      }),
    [visibleWinners, outputStyle, includeNumbering, includeTweetLinks, language],
  );

  const winnersOnlyText = useMemo(
    () => buildWinnersOnly(visibleWinners, includeNumbering),
    [visibleWinners, includeNumbering],
  );
  const handlesOnlyText = useMemo(() => buildHandlesOnly(visibleWinners), [visibleWinners]);
  const tweetLinksOnlyText = useMemo(() => buildTweetLinksOnly(visibleWinners), [visibleWinners]);

  async function revealWinners(record: DrawRecord) {
    setVisibleWinners([]);

    if (revealMode === 'all') {
      setVisibleWinners(record.winners);
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.55 } });
      return;
    }

    for (let index = 0; index < record.winners.length; index += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      setVisibleWinners((current) => [...current, record.winners[index]]);
    }

    confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
  }

  function setEntriesForMode(next: GiveawayEntry[] | ((current: GiveawayEntry[]) => GiveawayEntry[])) {
    if (mode === 'tweet') {
      setTweetEntries(next);
      return;
    }

    setCommentEntries(next);
  }

  function setHistoryForMode(next: DrawRecord[] | ((current: DrawRecord[]) => DrawRecord[])) {
    if (mode === 'tweet') {
      setTweetHistory(next);
      return;
    }

    setCommentHistory(next);
  }

  function setCurrentDrawForMode(next: DrawRecord | null) {
    if (mode === 'tweet') {
      setTweetCurrentDraw(next);
      return;
    }

    setCommentCurrentDraw(next);
  }

  async function importLinkBlock(value: string) {
    const lines = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      window.alert(
        language === 'fr'
          ? `Collez au moins une URL de ${mode === 'tweet' ? 'tweet' : 'commentaire'}.`
          : `Paste at least one ${mode === 'tweet' ? 'tweet' : 'comment'} URL.`,
      );
      return;
    }

    if (mode === 'comment' && !commentTargetTweetUrl.trim()) {
      window.alert(
        language === 'fr'
          ? "Definissez l'URL du tweet cible avant d'importer des commentaires."
          : 'Set the target tweet URL before importing comments.',
      );
      return;
    }

    const dedupedLines = Array.from(new Set(lines));

    if (activeEntries.length + dedupedLines.length > MAX_ENTRIES) {
      window.alert(
        language === 'fr'
          ? `Cette application prend en charge jusqua ${MAX_ENTRIES} entrees.`
          : `This app supports up to ${MAX_ENTRIES} entries.`,
      );
      return;
    }

    const incoming: GiveawayEntry[] = [];
    for (const line of dedupedLines) {
      const parsed = parseTweetUrl(line);
      if (!parsed.isValid) {
        window.alert(
          `${line}\n\n${
            language === 'fr'
              ? 'Entrez une URL de statut x.com ou twitter.com valide.'
              : parsed.error
          }`,
        );
        return;
      }

      const now = new Date().toISOString();
      const baseEntry: GiveawayEntry = {
        id: createId(mode),
        tweetUrl: parsed.normalizedUrl,
        normalizedTweetUrl: parsed.normalizedUrl,
        tweetId: parsed.tweetId,
        displayName: parsed.handle,
        handle: parsed.handle,
        avatarUrl: '',
        commentText: '',
        note: '',
        prize: '',
        createdAt: now,
        updatedAt: now,
        metadataStatus: 'parsed',
      };

      const enhanced = await enrichEntryMetadata(baseEntry);
      incoming.push({
        ...baseEntry,
        ...enhanced,
        updatedAt: new Date().toISOString(),
      });
    }

    setEntriesForMode((current) => mergeEntries(current, incoming));
  }

  async function importCsvText(value: string) {
    if (mode === 'comment' && !commentTargetTweetUrl.trim()) {
      window.alert(
        language === 'fr'
          ? "Definissez l'URL du tweet cible avant d'importer des commentaires."
          : 'Set the target tweet URL before importing comments.',
      );
      return;
    }

    const rows = importEntriesCsv(value);
    if (!rows.length) {
      window.alert(language === 'fr' ? "Limport CSV est vide." : 'CSV import is empty.');
      return;
    }

    const incoming = rows.map((row) =>
      createEntryFromDraft({
        displayName: row.displayName,
        handle: row.handle,
        avatarUrl: row.avatarUrl,
        tweetUrl: row.tweetUrl,
        commentText: row.commentText,
        note: row.note,
        prize: row.prize,
      }),
    );

    if (activeEntries.length + incoming.length > MAX_ENTRIES) {
      window.alert(
        language === 'fr'
          ? `Cette application prend en charge jusqua ${MAX_ENTRIES} entrees.`
          : `This app supports up to ${MAX_ENTRIES} entries.`,
      );
      return;
    }

    setEntriesForMode((current) => mergeEntries(current, incoming));
  }

  async function autoImportReplies() {
    if (mode !== 'comment') {
      return;
    }

    const trimmedTargetUrl = commentTargetTweetUrl.trim();
    if (!trimmedTargetUrl) {
      window.alert(
        language === 'fr'
          ? "Definissez l'URL du tweet cible avant de recuperer les reponses."
          : 'Set the target tweet URL before fetching replies.',
      );
      return;
    }

    const response = await fetch(
      `/api/replies?tweetUrl=${encodeURIComponent(trimmedTargetUrl)}&limit=${encodeURIComponent(String(replyFetchLimit))}`,
    );

    const payload = (await response.json()) as {
      error?: string;
      targetTweetUrl?: string;
      replies?: Array<{
        tweetUrl: string;
        normalizedTweetUrl: string;
        tweetId: string;
        displayName: string;
        handle: string;
        avatarUrl: string;
        commentText: string;
      }>;
      meta?: {
        importedCount: number;
      };
    };

    if (!response.ok || payload.error) {
      window.alert(
        payload.error ||
          (language === 'fr'
            ? 'Impossible de recuperer les reponses depuis X.'
            : 'Unable to fetch replies from X.'),
      );
      return;
    }

    const now = new Date().toISOString();
    const incoming: GiveawayEntry[] = (payload.replies || []).map((reply) => ({
      id: createId('comment'),
      tweetUrl: reply.tweetUrl,
      normalizedTweetUrl: reply.normalizedTweetUrl,
      tweetId: reply.tweetId,
      displayName: reply.displayName,
      handle: reply.handle,
      avatarUrl: reply.avatarUrl,
      commentText: reply.commentText,
      note: '',
      prize: '',
      createdAt: now,
      updatedAt: now,
      metadataStatus: 'enhanced',
    }));

    setCommentTargetTweetUrl(payload.targetTweetUrl || trimmedTargetUrl);
    setCommentEntries((current) => mergeEntries(current, incoming));
    window.alert(
      language === 'fr'
        ? `${payload.meta?.importedCount ?? incoming.length} reponses importees depuis X.`
        : `Imported ${payload.meta?.importedCount ?? incoming.length} replies from X.`,
    );
  }

  async function addManualEntry(draft: EntryDraft) {
    if (mode === 'comment' && !commentTargetTweetUrl.trim()) {
      window.alert(
        language === 'fr'
          ? "Definissez l'URL du tweet cible avant d'ajouter des commentaires."
          : 'Set the target tweet URL before adding comments.',
      );
      return;
    }

    const entry = createEntryFromDraft(draft);
    if (!entry.tweetUrl) {
      window.alert(
        mode === 'tweet'
          ? language === 'fr'
            ? 'Les entrees manuelles ont toujours besoin dune URL de tweet.'
            : 'Manual entries still need a tweet URL.'
          : language === 'fr'
            ? 'Les commentaires manuels ont toujours besoin dune URL de commentaire.'
            : 'Manual comments still need a comment URL.',
      );
      return;
    }

    if (activeEntries.length >= MAX_ENTRIES) {
      window.alert(
        language === 'fr'
          ? `Cette application prend en charge jusqua ${MAX_ENTRIES} entrees.`
          : `This app supports up to ${MAX_ENTRIES} entries.`,
      );
      return;
    }

    setEntriesForMode((current) => mergeEntries(current, [entry]));
  }

  async function refreshEntry(entryId: string) {
    const target = activeEntries.find((entry) => entry.id === entryId);
    if (!target) {
      return;
    }

    const metadata = await enrichEntryMetadata(target);
    setEntriesForMode((current) =>
      current.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              ...metadata,
              updatedAt: new Date().toISOString(),
            }
          : entry,
      ),
    );
  }

  async function refreshAllMetadata() {
    const refreshed = await Promise.all(
      activeEntries.map(async (entry) => ({
        ...entry,
        ...(await enrichEntryMetadata(entry)),
        updatedAt: new Date().toISOString(),
      })),
    );
    setEntriesForMode(refreshed);
  }

  async function pickWinners(force = false) {
    if (lockWinners && activeCurrentDraw && !force) {
      await revealWinners(activeCurrentDraw);
      return;
    }

    if (eligibleEntries.length < winnerCount) {
      window.alert(
        language === 'fr'
          ? `Au moins ${winnerCount} entrees eligibles sont requises.`
          : `At least ${winnerCount} eligible entries are required.`,
      );
      return;
    }

    const randomized = fairShuffle(eligibleEntries);
    const winners = randomized.slice(0, winnerCount).map(toWinnerSnapshot);
    const record: DrawRecord = {
      id: createId(`draw-${mode}`),
      createdAt: new Date().toISOString(),
      winnerIds: winners.map((winner) => winner.id),
      randomizedOrder: randomized.map((entry, index) => `${index + 1}. @${entry.handle} | ${entry.tweetUrl}`),
      winners,
    };

    setCurrentDrawForMode(record);
    setHistoryForMode((current) => [record, ...current]);
    await revealWinners(record);
  }

  async function reroll() {
    await pickWinners(true);
  }

  async function copyText(value: string) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.alert(language === 'fr' ? 'La copie dans le presse-papiers a echoue.' : 'Clipboard copy failed.');
    }
  }

  function exportJson() {
    const payload: AppStateExport = {
      exportedAt: new Date().toISOString(),
      mode,
      targetTweetUrl: mode === 'comment' ? commentTargetTweetUrl.trim() : undefined,
      entries: activeEntries,
      drawHistory: activeHistory,
      currentDraw: activeCurrentDraw,
    };

    downloadText(
      mode === 'tweet' ? 'giveaway-tweet-picker-state.json' : 'giveaway-comment-picker-state.json',
      JSON.stringify(payload, null, 2),
      'application/json',
    );
  }

  async function importJson(file: File) {
    const content = await file.text();
    const parsed = JSON.parse(content) as Partial<AppStateExport>;
    const importedEntries = Array.isArray(parsed.entries) ? parsed.entries.slice(0, MAX_ENTRIES) : [];
    const importedHistory = Array.isArray(parsed.drawHistory) ? parsed.drawHistory : [];
    const importedDraw = parsed.currentDraw ?? null;

    if (mode === 'tweet') {
      setTweetEntries(importedEntries);
      setTweetHistory(importedHistory);
      setTweetCurrentDraw(importedDraw);
      setVisibleWinners(importedDraw?.winners ?? []);
      return;
    }

    setCommentEntries(importedEntries);
    setCommentHistory(importedHistory);
    setCommentCurrentDraw(importedDraw);
    setCommentTargetTweetUrl(parsed.targetTweetUrl ?? '');
    setVisibleWinners(importedDraw?.winners ?? []);
  }

  async function generateSampleData() {
    if (mode === 'tweet') {
      const sampleLinks = [
        'https://x.com/PixelPilot/status/1770000000000000001',
        'https://x.com/RetroNova/status/1770000000000000002',
        'https://x.com/QuestMint/status/1770000000000000003',
        'https://x.com/SkyForge/status/1770000000000000004',
        'https://x.com/FluxArcade/status/1770000000000000005',
        'https://x.com/OrbitMaven/status/1770000000000000006',
      ];
      await importLinkBlock(sampleLinks.join('\n'));
      return;
    }

    setCommentTargetTweetUrl('https://x.com/GiveawayHost/status/1880000000000000000');
    const sampleLinks = [
      'https://x.com/ReplyAlpha/status/1880000000000000101',
      'https://x.com/ReplyBravo/status/1880000000000000102',
      'https://x.com/ReplyCharlie/status/1880000000000000103',
      'https://x.com/ReplyDelta/status/1880000000000000104',
      'https://x.com/ReplyEcho/status/1880000000000000105',
    ];
    await importLinkBlock(sampleLinks.join('\n'));
  }

  const heroSubtitle =
    mode === 'tweet'
      ? language === 'fr'
        ? 'Selecteur de giveaway pret pour le public avec tirages bases sur des tweets, revelations soignees et publication rapide.'
        : 'Public-ready giveaway picker for tweet-based draws, clean winner reveals, and fast posting.'
      : language === 'fr'
        ? 'Selecteur de commentaires pour un seul tweet avec import de reponses, revelations propres et rerolls equitables.'
        : 'Single-tweet comment selector for imported reply pools, clean reveals, and fair rerolls.';

  return (
    <div className="app-shell">
      <header className="hero brand-hero">
        <div className="hero-copy">
          <div className="brand-badge-row">
            <span className="brand-badge">{language === 'fr' ? 'Outils giveaway Squigs' : 'Squigs Giveaway Tools'}</span>
            <span className="brand-badge muted-badge">
              {language === 'fr' ? 'Refonte publique de la marque' : 'Public-facing brand refresh'}
            </span>
          </div>
          <SquigsLogo />
          <h1>{language === 'fr' ? 'Selecteur Giveaway Squigs' : 'Squigs Giveaway Picker'}</h1>
          <p className="hero-subtitle">{heroSubtitle}</p>
          <p className="brand-summary">
            {language === 'fr'
              ? 'Choisissez des gagnants a partir de tweets ou de commentaires importes avec une interface de marque plus propre, pensee comme un produit public et pas seulement comme un utilitaire interne.'
              : 'Pick winners from tweets or imported comments with a cleaner branded interface that is ready for a public landing page feel, not just an internal utility.'}
          </p>
          <div className="hero-feature-row">
            <span className="hero-pill">{language === 'fr' ? 'Selecteur de tweets' : 'Tweet Selector'}</span>
            <span className="hero-pill">{language === 'fr' ? 'Selecteur de commentaires' : 'Comment Selector'}</span>
            <span className="hero-pill">{language === 'fr' ? 'Posts gagnants prets a copier' : 'Copy-Ready Winner Posts'}</span>
            <span className="hero-pill">{language === 'fr' ? 'Historique local daudit' : 'Local Audit History'}</span>
          </div>
          <div className="mode-switcher">
            <button className={`mode-button ${mode === 'tweet' ? 'active' : ''}`} type="button" onClick={() => setMode('tweet')}>
              {language === 'fr' ? 'Selecteur de tweets' : 'Tweet Selector'}
            </button>
            <button className={`mode-button ${mode === 'comment' ? 'active' : ''}`} type="button" onClick={() => setMode('comment')}>
              {language === 'fr' ? 'Selecteur de commentaires' : 'Comment Selector'}
            </button>
          </div>
        </div>

        <aside className="hero-side">
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>{activeEntries.length}</strong>
              <span>
                {mode === 'tweet'
                  ? language === 'fr'
                    ? 'Entrees de tweets'
                    : 'Tweet Entries'
                  : language === 'fr'
                    ? 'Entrees de commentaires'
                    : 'Comment Entries'}
              </span>
            </div>
            <div className="hero-stat">
              <strong>{activeHistory.length}</strong>
              <span>{language === 'fr' ? 'Tirages passes' : 'Past Draws'}</span>
            </div>
            <div className="hero-stat">
              <strong>{visibleWinners.length}</strong>
              <span>{language === 'fr' ? 'Gagnants visibles' : 'Visible Winners'}</span>
            </div>
          </div>

          <div className="hero-note-card">
            <p className="eyebrow">{language === 'fr' ? 'Mode de marque' : 'Brand Mode'}</p>
            <h2>{mode === 'tweet' ? (language === 'fr' ? 'Flux giveaway tweet' : 'Tweet giveaway flow') : language === 'fr' ? 'Flux giveaway commentaires' : 'Comment giveaway flow'}</h2>
            <p>
              {mode === 'tweet'
                ? language === 'fr'
                  ? "Collez des liens de statut, affinez les participants, puis revelez les gagnants avec un bloc dannonce de marque."
                  : 'Paste status links, refine entrants, then reveal winners with a branded announcement block.'
                : language === 'fr'
                  ? 'Utilisez un tweet cible, importez les commentaires participants et lancez un tirage cible base sur les reponses.'
                  : 'Use one target tweet, import comment entrants, and run a focused reply-based giveaway draw.'}
            </p>
            <button className="ghost-button language-toggle" type="button" onClick={() => setLanguage((current) => (current === 'en' ? 'fr' : 'en'))}>
              {language === 'en' ? 'Utilisez cette application en francais' : 'Use this App in English'}
            </button>
          </div>
        </aside>
      </header>

      <main className="layout">
        <BulkInputSection
          mode={mode}
          language={language}
          totalEntries={activeEntries.length}
          targetTweetUrl={commentTargetTweetUrl}
          replyFetchLimit={replyFetchLimit}
          onTargetTweetUrlChange={setCommentTargetTweetUrl}
          onReplyFetchLimitChange={setReplyFetchLimit}
          onAutoImportReplies={autoImportReplies}
          onImportLinks={importLinkBlock}
          onImportCsv={importCsvText}
          onImportJson={importJson}
          onAddManualEntry={addManualEntry}
          onExportCsv={() =>
            downloadText(
              mode === 'tweet' ? 'giveaway-entries.csv' : 'giveaway-comment-entries.csv',
              exportEntriesCsv(activeEntries),
              'text/csv',
            )
          }
          onExportJson={exportJson}
          onGenerateSampleData={generateSampleData}
        />

        {editingEntry ? (
          <Section
            eyebrow={language === 'fr' ? 'Modifier' : 'Edit'}
            title={language === 'fr' ? 'Modifier lentree' : 'Edit Entry'}
            subtitle={
              language === 'fr'
                ? 'Mettez a jour une entree enregistree sans perdre lhistoire locale.'
                : 'Update a saved entry without losing local history.'
            }
          >
            <EntryForm
              initialValue={{
                displayName: editingEntry.displayName,
                handle: editingEntry.handle,
                avatarUrl: editingEntry.avatarUrl,
                tweetUrl: editingEntry.tweetUrl,
                commentText: editingEntry.commentText,
                note: editingEntry.note,
                prize: editingEntry.prize,
              }}
              submitLabel={language === 'fr' ? 'Enregistrer les modifications' : 'Save Changes'}
              language={language}
              onCancel={() => setEditingEntry(null)}
              onSubmit={(draft) => {
                try {
                  const updated = createEntryFromDraft(draft);
                  setEntriesForMode((current) =>
                    current.map((entry) =>
                      entry.id === editingEntry.id
                        ? {
                            ...entry,
                            ...updated,
                            id: editingEntry.id,
                            createdAt: editingEntry.createdAt,
                            updatedAt: new Date().toISOString(),
                          }
                        : entry,
                    ),
                  );
                  setEditingEntry(null);
                } catch (error) {
                  window.alert(
                    error instanceof Error
                      ? error.message
                      : language === 'fr'
                        ? 'Impossible denregistrer lentree.'
                        : 'Unable to save entry.',
                  );
                }
              }}
            />
          </Section>
        ) : null}

        <EntryListSection
          mode={mode}
          language={language}
          entries={activeEntries}
          search={search}
          setSearch={setSearch}
          sortMode={sortMode}
          setSortMode={setSortMode}
          duplicateHandleWarnings={duplicateHandleWarnings}
          onEdit={setEditingEntry}
          onDelete={(entryId) => setEntriesForMode((current) => current.filter((entry) => entry.id !== entryId))}
          onRefreshEntry={refreshEntry}
          onRefreshAll={refreshAllMetadata}
          onClearAll={() => {
            if (
              !window.confirm(
                language === 'fr' ? 'Tout effacer les entrees et le tirage actuel ?' : 'Clear all entries and the current draw?',
              )
            ) {
              return;
            }
            setEntriesForMode([]);
            setCurrentDrawForMode(null);
            setVisibleWinners([]);
          }}
        />

        <DrawControlsSection
          entries={activeEntries}
          language={language}
          eligibleEntriesCount={eligibleEntries.length}
          winnerCount={winnerCount}
          setWinnerCount={setWinnerCount}
          excludePreviousWinners={excludePreviousWinners}
          setExcludePreviousWinners={setExcludePreviousWinners}
          lockWinners={lockWinners}
          setLockWinners={setLockWinners}
          revealMode={revealMode}
          setRevealMode={setRevealMode}
          onPickWinners={pickWinners}
          onReroll={reroll}
        />

        <WinnersSection mode={mode} language={language} currentDraw={activeCurrentDraw} visibleWinners={visibleWinners} />

        <TweetOutputSection
          winners={visibleWinners}
          language={language}
          outputStyle={outputStyle}
          setOutputStyle={setOutputStyle}
          includeNumbering={includeNumbering}
          setIncludeNumbering={setIncludeNumbering}
          includeTweetLinks={includeTweetLinks}
          setIncludeTweetLinks={setIncludeTweetLinks}
          tweetText={tweetText}
          winnersOnlyText={winnersOnlyText}
          handlesOnlyText={handlesOnlyText}
          tweetLinksOnlyText={tweetLinksOnlyText}
          onCopy={copyText}
        />

        <AuditHistorySection
          currentDraw={activeCurrentDraw}
          language={language}
          history={activeHistory}
          onExportHistoryCsv={() =>
            downloadText(
              mode === 'tweet' ? 'giveaway-winner-history.csv' : 'giveaway-comment-history.csv',
              exportHistoryCsv(activeHistory),
              'text/csv',
            )
          }
          onResetHistory={() => {
            if (!window.confirm(language === 'fr' ? 'Reinitialiser lhistoire des gagnants ?' : 'Reset winner history?')) {
              return;
            }
            setHistoryForMode([]);
          }}
        />
      </main>
    </div>
  );
}
