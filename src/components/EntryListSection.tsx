import { useMemo } from 'react';
import type { AppLanguage, GiveawayEntry, SortMode } from '../types';
import { Avatar } from './Avatar';
import { Section } from './Section';

interface EntryListSectionProps {
  mode: 'tweet' | 'comment';
  language: AppLanguage;
  entries: GiveawayEntry[];
  search: string;
  setSearch: (value: string) => void;
  sortMode: SortMode;
  setSortMode: (value: SortMode) => void;
  duplicateHandleWarnings: string[];
  onEdit: (entry: GiveawayEntry) => void;
  onDelete: (entryId: string) => void;
  onRefreshEntry: (entryId: string) => Promise<void>;
  onRefreshAll: () => Promise<void>;
  onClearAll: () => void;
}

export function EntryListSection({
  mode,
  language,
  entries,
  search,
  setSearch,
  sortMode,
  setSortMode,
  duplicateHandleWarnings,
  onEdit,
  onDelete,
  onRefreshEntry,
  onRefreshAll,
  onClearAll,
}: EntryListSectionProps) {
  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    const ordered = [...entries].sort((left, right) => {
      if (sortMode === 'name') {
        return left.displayName.localeCompare(right.displayName);
      }
      if (sortMode === 'handle') {
        return left.handle.localeCompare(right.handle);
      }
      return right.createdAt.localeCompare(left.createdAt);
    });

    if (!query) {
      return ordered;
    }

    return ordered.filter((entry) =>
      [entry.displayName, entry.handle, entry.tweetUrl, entry.note, entry.prize].join(' ').toLowerCase().includes(query),
    );
  }, [entries, search, sortMode]);

  return (
    <Section
      eyebrow={language === 'fr' ? 'Entrees' : 'Entries'}
      title={
        mode === 'tweet'
          ? language === 'fr'
            ? 'Liste dentrees'
            : 'Entry List'
          : language === 'fr'
            ? 'Liste des commentaires'
            : 'Comment Entry List'
      }
      subtitle={
        mode === 'tweet'
          ? language === 'fr'
            ? 'Modifiez, dedupliquez, recherchez et actualisez les metadonnees sans quitter lapplication.'
            : 'Edit, deduplicate, search, and refresh metadata without leaving the app.'
          : language === 'fr'
            ? 'Gerez les participants importes pour le tweet selectionne et gardez le tirage local.'
            : 'Manage imported comment entrants for the selected tweet and keep the draw local.'
      }
      actions={
        <div className="inline-actions wrap">
          <button className="ghost-button" type="button" onClick={() => void onRefreshAll()}>
            {language === 'fr' ? 'Actualiser les metadonnees' : 'Refresh Metadata'}
          </button>
          <button className="danger-button" type="button" onClick={onClearAll}>
            {language === 'fr' ? 'Tout effacer' : 'Clear All'}
          </button>
        </div>
      }
    >
      <div className="toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={language === 'fr' ? 'Rechercher par handle, nom, lot, note ou URL' : 'Search by handle, name, prize, note, or URL'}
        />
        <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
          <option value="recent">{language === 'fr' ? 'Plus recent' : 'Most Recent'}</option>
          <option value="name">{language === 'fr' ? 'Trier par nom' : 'Sort by Name'}</option>
          <option value="handle">{language === 'fr' ? 'Trier par handle' : 'Sort by Handle'}</option>
        </select>
      </div>

      {duplicateHandleWarnings.length ? (
        <div className="warning-banner">
          {language === 'fr' ? 'Handles en double detectes :' : 'Duplicate handles detected:'}{' '}
          {duplicateHandleWarnings.map((handle) => `@${handle}`).join(', ')}
        </div>
      ) : null}

      <div className="entry-grid">
        {filteredEntries.map((entry) => (
          <article className="entry-card" key={entry.id}>
            <div className="entry-top">
              <Avatar src={entry.avatarUrl} label={entry.displayName || entry.handle} />
              <div>
                <h3>{entry.displayName || entry.handle || (language === 'fr' ? 'Entree sans nom' : 'Unnamed entry')}</h3>
                <p className="muted">@{entry.handle || (language === 'fr' ? 'inconnu' : 'unknown')}</p>
                <p className="mono">{entry.tweetId}</p>
              </div>
            </div>
            <a className="entry-link" href={entry.tweetUrl} target="_blank" rel="noreferrer">
              {entry.tweetUrl}
            </a>
            {entry.commentText ? <p className="entry-note">{entry.commentText}</p> : null}
            {entry.prize ? <p className="chip">{language === 'fr' ? 'Lot :' : 'Prize:'} {entry.prize}</p> : null}
            {entry.note ? <p className="entry-note">{entry.note}</p> : null}
            <p className="muted small">{language === 'fr' ? 'Metadonnees :' : 'Metadata:'} {entry.metadataStatus}</p>
            <div className="inline-actions wrap">
              <button className="secondary-button" type="button" onClick={() => onEdit(entry)}>
                {language === 'fr' ? 'Modifier' : 'Edit'}
              </button>
              <button className="ghost-button" type="button" onClick={() => void onRefreshEntry(entry.id)}>
                {language === 'fr' ? 'Actualiser' : 'Refresh'}
              </button>
              <button className="danger-button" type="button" onClick={() => onDelete(entry.id)}>
                {language === 'fr' ? 'Supprimer' : 'Delete'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
