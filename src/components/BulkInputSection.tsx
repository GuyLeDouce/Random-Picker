import { useRef, useState } from 'react';
import type { AppLanguage, EntryDraft } from '../types';
import { EntryForm } from './EntryForm';
import { Section } from './Section';

interface BulkInputSectionProps {
  mode: 'tweet' | 'comment';
  language: AppLanguage;
  totalEntries: number;
  targetTweetUrl: string;
  replyFetchLimit: number;
  onTargetTweetUrlChange: (value: string) => void;
  onReplyFetchLimitChange: (value: number) => void;
  onAutoImportReplies: () => Promise<void>;
  onImportLinks: (value: string) => Promise<void>;
  onImportCsv: (value: string) => Promise<void>;
  onImportJson: (file: File) => Promise<void>;
  onAddManualEntry: (draft: EntryDraft) => Promise<void>;
  onExportCsv: () => void;
  onExportJson: () => void;
  onGenerateSampleData: () => Promise<void>;
}

const emptyDraft: EntryDraft = {
  displayName: '',
  handle: '',
  avatarUrl: '',
  tweetUrl: '',
  commentText: '',
  note: '',
  prize: '',
};

export function BulkInputSection({
  mode,
  language,
  totalEntries,
  targetTweetUrl,
  replyFetchLimit,
  onTargetTweetUrlChange,
  onReplyFetchLimitChange,
  onAutoImportReplies,
  onImportLinks,
  onImportCsv,
  onImportJson,
  onAddManualEntry,
  onExportCsv,
  onExportJson,
  onGenerateSampleData,
}: BulkInputSectionProps) {
  const [bulkLinks, setBulkLinks] = useState('');
  const [bulkCsv, setBulkCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  async function runBusyTask(task: () => Promise<void>) {
    setBusy(true);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      eyebrow={language === 'fr' ? 'Entree' : 'Input'}
      title={
        mode === 'tweet'
          ? language === 'fr'
            ? 'Entree de tweets en lot'
            : 'Bulk Tweet Input'
          : language === 'fr'
            ? 'Entree du selecteur de commentaires'
            : 'Comment Selector Input'
      }
      subtitle={
        mode === 'tweet'
          ? language === 'fr'
            ? 'Collez jusqua 100 liens de tweets, importez un CSV ou utilisez une entree manuelle.'
            : 'Paste up to 100 tweet links, import CSV, or use manual fallback entry.'
          : language === 'fr'
            ? 'Definissez un tweet cible, puis importez des liens de reponses ou des entrees manuelles pour ce tweet.'
            : 'Set one target tweet, then import reply links or manual comment entries for that tweet.'
      }
      actions={<div className="stat-pill">{totalEntries} / 100 entries</div>}
    >
      {mode === 'comment' ? (
        <div className="comment-fetch-panel">
          <label className="stack">
            <span>{language === 'fr' ? 'URL du tweet cible' : 'Target Tweet URL'}</span>
            <input
              value={targetTweetUrl}
              onChange={(event) => onTargetTweetUrlChange(event.target.value)}
              placeholder="https://x.com/creator/status/123456789"
            />
          </label>
          <label className="stack fetch-limit-field">
            <span>{language === 'fr' ? "Limite dimport des reponses" : 'Reply import cap'}</span>
            <select value={String(replyFetchLimit)} onChange={(event) => onReplyFetchLimitChange(Number(event.target.value))}>
              <option value="25">{language === 'fr' ? '25 reponses' : '25 replies'}</option>
              <option value="50">{language === 'fr' ? '50 reponses' : '50 replies'}</option>
              <option value="100">{language === 'fr' ? '100 reponses' : '100 replies'}</option>
            </select>
          </label>
          <div className="stack">
            <span className="muted small">
              {language === 'fr'
                ? 'Une requete serveur par import. Reponses recentes uniquement pour limiter lusage de lAPI X.'
                : 'One server request per import. Recent replies only to keep X API usage low.'}
            </span>
            <button className="primary-button" type="button" disabled={busy} onClick={() => void runBusyTask(onAutoImportReplies)}>
              {language === 'fr' ? 'Recuperer les reponses depuis X' : 'Fetch Replies From X'}
            </button>
          </div>
        </div>
      ) : null}
      <div className="two-column">
        <div className="stack">
          <label>
            <span>
              {mode === 'tweet'
                ? language === 'fr'
                  ? 'Liens des tweets'
                  : 'Tweet Links'
                : language === 'fr'
                  ? 'Liens des reponses / commentaires'
                  : 'Reply / Comment Links'}
            </span>
            <textarea
              value={bulkLinks}
              onChange={(event) => setBulkLinks(event.target.value)}
              placeholder={'https://x.com/user/status/123\nhttps://twitter.com/other/status/456'}
              rows={8}
            />
          </label>
          <div className="inline-actions">
            <button
              className="primary-button"
              type="button"
              disabled={busy}
              onClick={() =>
                runBusyTask(async () => {
                  await onImportLinks(bulkLinks);
                  setBulkLinks('');
                })
              }
            >
              {mode === 'tweet'
                ? language === 'fr'
                  ? 'Ajouter les liens des tweets'
                  : 'Add Tweet Links'
                : language === 'fr'
                  ? 'Ajouter les liens des commentaires'
                  : 'Add Comment Links'}
            </button>
            <button className="ghost-button" type="button" disabled={busy} onClick={() => void onGenerateSampleData()}>
              {language === 'fr' ? 'Donnees dexemple' : 'Sample Data'}
            </button>
          </div>
        </div>

        <div className="stack">
          <label>
            <span>{language === 'fr' ? 'Import CSV' : 'CSV Import'}</span>
            <textarea
              value={bulkCsv}
              onChange={(event) => setBulkCsv(event.target.value)}
              placeholder={
                'displayName,handle,avatarUrl,tweetUrl,tweetId,commentText,note,prize\nJane,jane,,https://x.com/jane/status/1,1,Count me in!,VIP,Gold'
              }
              rows={8}
            />
          </label>
          <div className="inline-actions wrap">
            <button
              className="secondary-button"
              type="button"
              disabled={busy}
              onClick={() =>
                runBusyTask(async () => {
                  await onImportCsv(bulkCsv);
                  setBulkCsv('');
                })
              }
            >
              {language === 'fr' ? 'Importer CSV' : 'Import CSV'}
            </button>
            <button className="ghost-button" type="button" onClick={onExportCsv}>
              {language === 'fr' ? 'Exporter CSV' : 'Export CSV'}
            </button>
            <button className="ghost-button" type="button" onClick={onExportJson}>
              {language === 'fr' ? 'Exporter JSON' : 'Export JSON'}
            </button>
            <button className="ghost-button" type="button" onClick={() => jsonInputRef.current?.click()}>
              {language === 'fr' ? 'Importer JSON' : 'Import JSON'}
            </button>
          </div>
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              void runBusyTask(() => onImportJson(file));
              event.target.value = '';
            }}
          />
        </div>
      </div>

      <div className="divider" />

      <EntryForm
        initialValue={emptyDraft}
        language={language}
        submitLabel={
          mode === 'tweet'
            ? language === 'fr'
              ? 'Ajouter une entree manuelle'
              : 'Add Manual Entry'
            : language === 'fr'
              ? 'Ajouter un commentaire manuel'
              : 'Add Manual Comment'
        }
        onSubmit={(draft) => {
          void runBusyTask(() => onAddManualEntry(draft));
        }}
      />
    </Section>
  );
}
