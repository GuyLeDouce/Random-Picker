import confetti from 'canvas-confetti';
import { useEffect, useMemo, useState } from 'react';
import type { AppLanguage, DrawRecord, GiveawayEntry, PickerMode, WinnerSnapshot } from './types';
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
import { createPlaceholderAvatar, parseTweetUrl } from './utils/tweet';

const DEFAULT_WINNER_COUNT = 1;
const DEFAULT_REPLY_FETCH_LIMIT = 500;
const MAX_ENTRIES_PER_IMPORT = 500;

const copy = {
  en: {
    appTitle: 'Giveaway Picker',
    appSubtitle: 'Pick ordered winners from direct tweet comments or a manually entered list.',
    commentPicker: 'Comment Picker',
    twitterPicker: 'Twitter Picker',
    commentHelp: 'Paste the main tweet link, import direct comments, then draw winners.',
    twitterHelp: 'Paste tweets, names, wallets, links, or handles. One item per line.',
    tweetUrl: 'Tweet link',
    fetchLimit: 'Comment limit',
    importComments: 'Import comments',
    manualEntries: 'Manual entries',
    addEntries: 'Add entries',
    clearEntries: 'Clear entries',
    entries: 'Entries',
    winners: 'Winners',
    winnerCount: 'Number of winners',
    excludePrevious: 'Exclude previous winners',
    draw: 'Draw winners',
    reroll: 'Reroll',
    drawRecord: 'Draw record',
    postText: 'Ready-to-post tweet',
    copyPost: 'Copy post',
    copyRecord: 'Copy record',
    history: 'History',
    noEntries: 'No entries yet.',
    noWinners: 'Run a draw to see winners.',
    imported: 'Imported',
    directComments: 'direct comments',
    eligible: 'Eligible',
    tooManyEntries: 'Add up to 500 entries at a time.',
    language: 'Francais',
  },
  fr: {
    appTitle: 'Selecteur Giveaway',
    appSubtitle: 'Choisissez des gagnants ordonnes depuis les commentaires directs ou une liste manuelle.',
    commentPicker: 'Selecteur de commentaires',
    twitterPicker: 'Selecteur Twitter',
    commentHelp: 'Collez le lien du tweet principal, importez les commentaires directs, puis tirez les gagnants.',
    twitterHelp: 'Collez tweets, noms, wallets, liens ou handles. Une entree par ligne.',
    tweetUrl: 'Lien du tweet',
    fetchLimit: 'Limite commentaires',
    importComments: 'Importer commentaires',
    manualEntries: 'Entrees manuelles',
    addEntries: 'Ajouter entrees',
    clearEntries: 'Effacer entrees',
    entries: 'Entrees',
    winners: 'Gagnants',
    winnerCount: 'Nombre de gagnants',
    excludePrevious: 'Exclure les anciens gagnants',
    draw: 'Tirer gagnants',
    reroll: 'Relancer',
    drawRecord: 'Preuve du tirage',
    postText: 'Tweet pret a publier',
    copyPost: 'Copier tweet',
    copyRecord: 'Copier preuve',
    history: 'Historique',
    noEntries: 'Aucune entree.',
    noWinners: 'Lancez un tirage pour voir les gagnants.',
    imported: 'Importe',
    directComments: 'commentaires directs',
    eligible: 'Eligibles',
    tooManyEntries: 'Ajoutez jusqua 500 entrees a la fois.',
    language: 'English',
  },
} as const;

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function displayLabel(entry: Pick<GiveawayEntry, 'displayName' | 'handle'>) {
  return entry.handle ? `@${entry.handle}` : entry.displayName;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeManualValue(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function entryKey(entry: GiveawayEntry) {
  return (entry.normalizedTweetUrl || entry.tweetUrl || entry.handle || entry.displayName).toLowerCase();
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

function mergeEntries(existing: GiveawayEntry[], incoming: GiveawayEntry[]) {
  const byKey = new Map(existing.map((entry) => [entryKey(entry), entry]));
  incoming.forEach((entry) => {
    if (!byKey.has(entryKey(entry))) {
      byKey.set(entryKey(entry), entry);
    }
  });
  return Array.from(byKey.values());
}

function createManualEntry(rawValue: string): GiveawayEntry {
  const value = normalizeManualValue(rawValue);
  const parsed = parseTweetUrl(value);
  const handle = parsed.isValid
    ? parsed.handle
    : value.startsWith('@')
      ? value.replace(/^@+/, '').split(/\s+/)[0]
      : '';
  const displayName = parsed.isValid ? parsed.handle : value;
  const tweetUrl = parsed.isValid ? parsed.normalizedUrl : value;
  const timestamp = nowIso();

  return {
    id: createId('manual'),
    tweetUrl,
    normalizedTweetUrl: parsed.isValid ? parsed.normalizedUrl : value.toLowerCase(),
    tweetId: parsed.isValid ? parsed.tweetId : createId('item'),
    displayName,
    handle,
    avatarUrl: createPlaceholderAvatar(handle || displayName),
    commentText: '',
    note: '',
    prize: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    metadataStatus: parsed.isValid ? 'parsed' : 'manual',
  };
}

function buildPostText(winners: WinnerSnapshot[], language: AppLanguage) {
  if (!winners.length) {
    return '';
  }

  const intro = language === 'fr' ? 'Les gagnants sont :' : 'The winners are:';
  const outro = language === 'fr' ? 'DM-moi pour reclamer.' : 'DM me to claim.';
  const lines = winners.map((winner, index) => `${index + 1}. ${displayLabel(winner)}`);
  return [intro, '', ...lines, '', outro].join('\n');
}

function buildRecordText(record: DrawRecord | null, mode: PickerMode, entries: GiveawayEntry[], language: AppLanguage) {
  if (!record) {
    return '';
  }

  const labels = language === 'fr'
    ? {
        title: 'Preuve du tirage',
        mode: 'Mode',
        created: 'Date',
        pool: 'Participants',
        winners: 'Gagnants',
        order: 'Ordre randomise',
      }
    : {
        title: 'Draw record',
        mode: 'Mode',
        created: 'Created',
        pool: 'Entry pool',
        winners: 'Winners',
        order: 'Randomized order',
      };

  return [
    labels.title,
    `${labels.mode}: ${mode}`,
    `${labels.created}: ${record.createdAt}`,
    `${labels.pool}: ${entries.length}`,
    '',
    labels.winners,
    ...record.winners.map((winner, index) => `${index + 1}. ${displayLabel(winner)} (${winner.id})`),
    '',
    labels.order,
    ...record.randomizedOrder,
  ].join('\n');
}

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [mode, setMode] = useState<PickerMode>('comment');
  const [tweetEntries, setTweetEntries] = useState<GiveawayEntry[]>(() => loadTweetEntries());
  const [commentEntries, setCommentEntries] = useState<GiveawayEntry[]>(() => loadCommentEntries());
  const [tweetHistory, setTweetHistory] = useState<DrawRecord[]>(() => loadTweetHistory());
  const [commentHistory, setCommentHistory] = useState<DrawRecord[]>(() => loadCommentHistory());
  const [tweetCurrentDraw, setTweetCurrentDraw] = useState<DrawRecord | null>(() => loadTweetCurrentDraw());
  const [commentCurrentDraw, setCommentCurrentDraw] = useState<DrawRecord | null>(() => loadCommentCurrentDraw());
  const [targetTweetUrl, setTargetTweetUrl] = useState(() => loadCommentTargetTweetUrl());
  const [manualInput, setManualInput] = useState('');
  const [winnerCount, setWinnerCount] = useState(DEFAULT_WINNER_COUNT);
  const [replyFetchLimit, setReplyFetchLimit] = useState(DEFAULT_REPLY_FETCH_LIMIT);
  const [excludePreviousWinners, setExcludePreviousWinners] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const t = copy[language];
  const activeEntries = mode === 'tweet' ? tweetEntries : commentEntries;
  const activeHistory = mode === 'tweet' ? tweetHistory : commentHistory;
  const activeDraw = mode === 'tweet' ? tweetCurrentDraw : commentCurrentDraw;

  useEffect(() => saveTweetEntries(tweetEntries), [tweetEntries]);
  useEffect(() => saveCommentEntries(commentEntries), [commentEntries]);
  useEffect(() => saveTweetHistory(tweetHistory), [tweetHistory]);
  useEffect(() => saveCommentHistory(commentHistory), [commentHistory]);
  useEffect(() => saveTweetCurrentDraw(tweetCurrentDraw), [tweetCurrentDraw]);
  useEffect(() => saveCommentCurrentDraw(commentCurrentDraw), [commentCurrentDraw]);
  useEffect(() => saveCommentTargetTweetUrl(targetTweetUrl.trim()), [targetTweetUrl]);

  useEffect(() => {
    setWinnerCount((current) => Math.min(Math.max(current, 1), Math.max(activeEntries.length, 1)));
  }, [activeEntries.length]);

  const previousWinnerIds = useMemo(() => new Set(activeHistory.flatMap((record) => record.winnerIds)), [activeHistory]);
  const eligibleEntries = useMemo(
    () => activeEntries.filter((entry) => !excludePreviousWinners || !previousWinnerIds.has(entry.id)),
    [activeEntries, excludePreviousWinners, previousWinnerIds],
  );
  const postText = useMemo(() => buildPostText(activeDraw?.winners ?? [], language), [activeDraw, language]);
  const recordText = useMemo(
    () => buildRecordText(activeDraw, mode, activeEntries, language),
    [activeDraw, mode, activeEntries, language],
  );

  function setEntries(next: GiveawayEntry[] | ((current: GiveawayEntry[]) => GiveawayEntry[])) {
    if (mode === 'tweet') {
      setTweetEntries(next);
      return;
    }
    setCommentEntries(next);
  }

  function setHistory(next: DrawRecord[] | ((current: DrawRecord[]) => DrawRecord[])) {
    if (mode === 'tweet') {
      setTweetHistory(next);
      return;
    }
    setCommentHistory(next);
  }

  function setCurrentDraw(next: DrawRecord | null) {
    if (mode === 'tweet') {
      setTweetCurrentDraw(next);
      return;
    }
    setCommentCurrentDraw(next);
  }

  function addManualEntries() {
    const lines = manualInput.split(/\r?\n/).map(normalizeManualValue).filter(Boolean);
    if (!lines.length) {
      return;
    }

    if (lines.length > MAX_ENTRIES_PER_IMPORT) {
      window.alert(t.tooManyEntries);
      return;
    }

    setEntries((current) => mergeEntries(current, lines.map(createManualEntry)));
    setManualInput('');
  }

  async function importComments() {
    const trimmedUrl = targetTweetUrl.trim();
    if (!trimmedUrl) {
      window.alert(language === 'fr' ? 'Collez un lien de tweet.' : 'Paste a tweet link.');
      return;
    }

    setIsImporting(true);
    try {
      const commentLimit = Math.min(Math.max(replyFetchLimit || 1, 1), MAX_ENTRIES_PER_IMPORT);
      const response = await fetch(
        `/api/replies?tweetUrl=${encodeURIComponent(trimmedUrl)}&limit=${encodeURIComponent(String(commentLimit))}`,
      );
      const payload = (await response.json()) as {
        error?: string;
        targetTweetUrl?: string;
        replies?: GiveawayEntry[];
        meta?: { importedCount: number };
      };

      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Unable to import comments.');
      }

      const timestamp = nowIso();
      const incoming = (payload.replies || []).map((reply) => ({
        ...reply,
        id: createId('comment'),
        note: '',
        prize: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        metadataStatus: 'enhanced' as const,
      }));

      setTargetTweetUrl(payload.targetTweetUrl || trimmedUrl);
      setCommentEntries((current) => mergeEntries(current, incoming));
      window.alert(`${t.imported} ${payload.meta?.importedCount ?? incoming.length} ${t.directComments}.`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to import comments.');
    } finally {
      setIsImporting(false);
    }
  }

  async function drawWinners(force = false) {
    if (activeDraw && !force) {
      return;
    }

    if (eligibleEntries.length < winnerCount) {
      window.alert(
        language === 'fr'
          ? `Il faut au moins ${winnerCount} entrees eligibles.`
          : `At least ${winnerCount} eligible entries are required.`,
      );
      return;
    }

    const randomized = fairShuffle(eligibleEntries);
    const winners = randomized.slice(0, winnerCount).map(toWinnerSnapshot);
    const record: DrawRecord = {
      id: createId(`draw-${mode}`),
      createdAt: nowIso(),
      winnerIds: winners.map((winner) => winner.id),
      randomizedOrder: randomized.map((entry, index) => `${index + 1}. ${displayLabel(entry)} | ${entry.tweetUrl}`),
      winners,
    };

    setCurrentDraw(record);
    setHistory((current) => [record, ...current]);
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.55 } });
  }

  async function copyText(value: string) {
    if (value) {
      await navigator.clipboard.writeText(value);
    }
  }

  function clearEntries() {
    if (!window.confirm(language === 'fr' ? 'Effacer les entrees et le tirage actuel ?' : 'Clear entries and current draw?')) {
      return;
    }
    setEntries([]);
    setCurrentDraw(null);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}>
          {t.language}
        </button>
      </header>

      <main className="app-grid">
        <section className="panel setup-panel">
          <div className="tabs" role="tablist" aria-label="Picker mode">
            <button className={mode === 'comment' ? 'active' : ''} type="button" onClick={() => setMode('comment')}>
              {t.commentPicker}
            </button>
            <button className={mode === 'tweet' ? 'active' : ''} type="button" onClick={() => setMode('tweet')}>
              {t.twitterPicker}
            </button>
          </div>

          <p className="muted">{mode === 'comment' ? t.commentHelp : t.twitterHelp}</p>

          {mode === 'comment' ? (
            <div className="comment-import">
              <label>
                <span>{t.tweetUrl}</span>
                <input value={targetTweetUrl} onChange={(event) => setTargetTweetUrl(event.target.value)} placeholder="https://x.com/user/status/..." />
              </label>
              <label>
                <span>{t.fetchLimit}</span>
                <input
                  min="1"
                  max={MAX_ENTRIES_PER_IMPORT}
                  type="number"
                  value={replyFetchLimit}
                  onChange={(event) => setReplyFetchLimit(Number(event.target.value))}
                />
              </label>
              <button className="primary-button" type="button" onClick={importComments} disabled={isImporting}>
                {isImporting ? '...' : t.importComments}
              </button>
            </div>
          ) : null}

          <label>
            <span>{t.manualEntries}</span>
            <textarea
              rows={mode === 'tweet' ? 10 : 5}
              value={manualInput}
              onChange={(event) => setManualInput(event.target.value)}
              placeholder={mode === 'tweet' ? '@handle\n0x1234...\nhttps://x.com/user/status/...' : 'Optional manual comment entries'}
            />
          </label>

          <div className="button-row">
            <button className="primary-button" type="button" onClick={addManualEntries}>
              {t.addEntries}
            </button>
            <button className="secondary-button" type="button" onClick={clearEntries}>
              {t.clearEntries}
            </button>
          </div>
        </section>

        <section className="panel draw-panel">
          <div className="stats-row">
            <div>
              <strong>{activeEntries.length}</strong>
              <span>{t.entries}</span>
            </div>
            <div>
              <strong>{eligibleEntries.length}</strong>
              <span>{t.eligible}</span>
            </div>
            <div>
              <strong>{activeHistory.length}</strong>
              <span>{t.history}</span>
            </div>
          </div>

          <label>
            <span>{t.winnerCount}</span>
            <input
              min="1"
              max={Math.max(activeEntries.length, 1)}
              type="number"
              value={winnerCount}
              onChange={(event) => setWinnerCount(Number(event.target.value))}
            />
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={excludePreviousWinners}
              onChange={(event) => setExcludePreviousWinners(event.target.checked)}
            />
            <span>{t.excludePrevious}</span>
          </label>

          <div className="button-row">
            <button className="primary-button large" type="button" onClick={() => drawWinners(false)}>
              {t.draw}
            </button>
            <button className="secondary-button large" type="button" onClick={() => drawWinners(true)}>
              {t.reroll}
            </button>
          </div>
        </section>

        <section className="panel list-panel">
          <div className="section-heading">
            <h2>{t.entries}</h2>
            <span>{activeEntries.length}</span>
          </div>
          {activeEntries.length ? (
            <div className="entry-list">
              {activeEntries.map((entry) => (
                <article className="entry-row" key={entry.id}>
                  <img className="avatar" src={entry.avatarUrl || createPlaceholderAvatar(displayLabel(entry))} alt="" />
                  <div>
                    <strong>{displayLabel(entry)}</strong>
                    <span>{entry.commentText || entry.tweetUrl}</span>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Remove entry"
                    onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}
                  >
                    x
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">{t.noEntries}</p>
          )}
        </section>

        <section className="panel results-panel">
          <div className="section-heading">
            <h2>{t.winners}</h2>
            <span>{activeDraw?.createdAt ? new Date(activeDraw.createdAt).toLocaleString() : ''}</span>
          </div>

          {activeDraw?.winners.length ? (
            <div className="winner-list">
              {activeDraw.winners.map((winner, index) => (
                <article className="winner-row" key={winner.id}>
                  <span className="rank">{index + 1}</span>
                  <img className="avatar" src={winner.avatarUrl || createPlaceholderAvatar(displayLabel(winner))} alt="" />
                  <div>
                    <strong>{displayLabel(winner)}</strong>
                    <span>{winner.commentText || winner.tweetUrl}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">{t.noWinners}</p>
          )}

          <div className="output-grid">
            <label>
              <span>{t.postText}</span>
              <textarea readOnly rows={8} value={postText} />
            </label>
            <label>
              <span>{t.drawRecord}</span>
              <textarea readOnly rows={8} value={recordText} />
            </label>
          </div>

          <div className="button-row">
            <button className="primary-button" type="button" onClick={() => copyText(postText)}>
              {t.copyPost}
            </button>
            <button className="secondary-button" type="button" onClick={() => copyText(recordText)}>
              {t.copyRecord}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
