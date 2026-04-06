import { useEffect, useState } from 'react';
import type { AppLanguage, EntryDraft } from '../types';

interface EntryFormProps {
  initialValue: EntryDraft;
  onSubmit: (draft: EntryDraft) => void;
  onCancel?: () => void;
  submitLabel: string;
  language: AppLanguage;
}

export function EntryForm({ initialValue, onSubmit, onCancel, submitLabel, language }: EntryFormProps) {
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    setDraft(initialValue);
  }, [initialValue]);

  function updateField<K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      className="entry-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
      }}
    >
      <div className="field-grid">
        <label>
          <span>{language === 'fr' ? 'Nom affiche' : 'Display Name'}</span>
          <input
            value={draft.displayName}
            onChange={(event) => updateField('displayName', event.target.value)}
            placeholder={language === 'fr' ? 'Nom du gagnant' : 'Winner name'}
          />
        </label>
        <label>
          <span>@Handle</span>
          <input
            value={draft.handle}
            onChange={(event) => updateField('handle', event.target.value)}
            placeholder="username"
          />
        </label>
        <label className="wide">
          <span>{language === 'fr' ? "URL de lavatar" : 'Avatar URL'}</span>
          <input
            value={draft.avatarUrl}
            onChange={(event) => updateField('avatarUrl', event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="wide">
          <span>{language === 'fr' ? 'URL du tweet' : 'Tweet URL'}</span>
          <input
            value={draft.tweetUrl}
            onChange={(event) => updateField('tweetUrl', event.target.value)}
            placeholder="https://x.com/user/status/123456789"
          />
        </label>
        <label className="wide">
          <span>{language === 'fr' ? 'Texte du commentaire' : 'Comment Text'}</span>
          <input
            value={draft.commentText}
            onChange={(event) => updateField('commentText', event.target.value)}
            placeholder={language === 'fr' ? 'Texte optionnel de commentaire' : 'Optional reply/comment text'}
          />
        </label>
        <label>
          <span>{language === 'fr' ? 'Lot' : 'Prize'}</span>
          <input
            value={draft.prize}
            onChange={(event) => updateField('prize', event.target.value)}
            placeholder={language === 'fr' ? 'Lot optionnel' : 'Optional prize'}
          />
        </label>
        <label>
          <span>{language === 'fr' ? 'Note' : 'Note'}</span>
          <input
            value={draft.note}
            onChange={(event) => updateField('note', event.target.value)}
            placeholder={language === 'fr' ? 'Note optionnelle' : 'Optional note'}
          />
        </label>
      </div>
      <div className="inline-actions">
        <button className="primary-button" type="submit">
          {submitLabel}
        </button>
        {onCancel ? (
          <button className="ghost-button" type="button" onClick={onCancel}>
            {language === 'fr' ? 'Annuler' : 'Cancel'}
          </button>
        ) : null}
      </div>
    </form>
  );
}
