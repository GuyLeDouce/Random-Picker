import { useEffect, useState } from 'react';
import type { EntryDraft } from '../types';

interface EntryFormProps {
  initialValue: EntryDraft;
  onSubmit: (draft: EntryDraft) => void;
  onCancel?: () => void;
  submitLabel: string;
}

export function EntryForm({ initialValue, onSubmit, onCancel, submitLabel }: EntryFormProps) {
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
          <span>Display Name</span>
          <input
            value={draft.displayName}
            onChange={(event) => updateField('displayName', event.target.value)}
            placeholder="Winner name"
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
          <span>Avatar URL</span>
          <input
            value={draft.avatarUrl}
            onChange={(event) => updateField('avatarUrl', event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="wide">
          <span>Tweet URL</span>
          <input
            value={draft.tweetUrl}
            onChange={(event) => updateField('tweetUrl', event.target.value)}
            placeholder="https://x.com/user/status/123456789"
          />
        </label>
        <label className="wide">
          <span>Comment Text</span>
          <input
            value={draft.commentText}
            onChange={(event) => updateField('commentText', event.target.value)}
            placeholder="Optional reply/comment text"
          />
        </label>
        <label>
          <span>Prize</span>
          <input
            value={draft.prize}
            onChange={(event) => updateField('prize', event.target.value)}
            placeholder="Optional prize"
          />
        </label>
        <label>
          <span>Note</span>
          <input
            value={draft.note}
            onChange={(event) => updateField('note', event.target.value)}
            placeholder="Optional note"
          />
        </label>
      </div>
      <div className="inline-actions">
        <button className="primary-button" type="submit">
          {submitLabel}
        </button>
        {onCancel ? (
          <button className="ghost-button" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
