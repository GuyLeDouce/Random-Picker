import type { AppLanguage, OutputStyle, WinnerSnapshot } from '../types';
import { Section } from './Section';

interface TweetOutputSectionProps {
  winners: WinnerSnapshot[];
  language: AppLanguage;
  outputStyle: OutputStyle;
  setOutputStyle: (value: OutputStyle) => void;
  includeNumbering: boolean;
  setIncludeNumbering: (value: boolean) => void;
  includeTweetLinks: boolean;
  setIncludeTweetLinks: (value: boolean) => void;
  tweetText: string;
  winnersOnlyText: string;
  handlesOnlyText: string;
  tweetLinksOnlyText: string;
  onCopy: (value: string) => Promise<void>;
}

export function TweetOutputSection({
  winners,
  language,
  outputStyle,
  setOutputStyle,
  includeNumbering,
  setIncludeNumbering,
  includeTweetLinks,
  setIncludeTweetLinks,
  tweetText,
  winnersOnlyText,
  handlesOnlyText,
  tweetLinksOnlyText,
  onCopy,
}: TweetOutputSectionProps) {
  return (
    <Section
      eyebrow={language === 'fr' ? 'Sortie' : 'Output'}
      title={language === 'fr' ? 'Texte du tweet' : 'Tweet Output'}
      subtitle={
        language === 'fr'
          ? 'Copiez une annonce prete a publier, les handles seulement ou une liste propre des gagnants.'
          : 'Copy a tweet-ready winner announcement, just the handles, or a clean winner list.'
      }
      actions={<div className={`stat-pill ${tweetText.length > 280 ? 'warning' : ''}`}>{tweetText.length} {language === 'fr' ? 'caracteres' : 'chars'}</div>}
    >
      <div className="control-grid">
        <label className="toggle-card">
          <span>{language === 'fr' ? 'Style' : 'Style'}</span>
          <select value={outputStyle} onChange={(event) => setOutputStyle(event.target.value as OutputStyle)}>
            <option value="clean">{language === 'fr' ? 'Propre' : 'Clean'}</option>
            <option value="hype">{language === 'fr' ? 'Hype' : 'Hype'}</option>
            <option value="minimal">{language === 'fr' ? 'Minimal' : 'Minimal'}</option>
          </select>
        </label>
        <label className="toggle-card">
          <input type="checkbox" checked={includeNumbering} onChange={(event) => setIncludeNumbering(event.target.checked)} />
          <span>{language === 'fr' ? 'Inclure la numerotation' : 'Include numbering'}</span>
        </label>
        <label className="toggle-card">
          <input type="checkbox" checked={includeTweetLinks} onChange={(event) => setIncludeTweetLinks(event.target.checked)} />
          <span>{language === 'fr' ? 'Inclure les liens des tweets' : 'Include tweet links'}</span>
        </label>
      </div>

      <div className="output-grid">
        <div className="stack">
          <label>
            <span>{language === 'fr' ? 'Tweet dannonce' : 'Announcement Tweet'}</span>
            <textarea value={winners.length ? tweetText : ''} readOnly rows={8} />
          </label>
          <div className="inline-actions wrap">
            <button className="primary-button" type="button" onClick={() => void onCopy(tweetText)} disabled={!winners.length}>
              {language === 'fr' ? 'Copier le tweet' : 'Copy Tweet'}
            </button>
            <button className="secondary-button" type="button" onClick={() => void onCopy(winnersOnlyText)} disabled={!winners.length}>
              {language === 'fr' ? 'Copier les gagnants seulement' : 'Copy Winners Only'}
            </button>
            <button className="ghost-button" type="button" onClick={() => void onCopy(handlesOnlyText)} disabled={!winners.length}>
              {language === 'fr' ? 'Copier les handles tagues' : 'Copy Tagged Handles'}
            </button>
          </div>
        </div>
        <div className="stack">
          <label>
            <span>{language === 'fr' ? 'Sortie alternative' : 'Alternate Output'}</span>
            <textarea value={winners.length ? tweetLinksOnlyText : ''} readOnly rows={8} />
          </label>
          <div className="inline-actions wrap">
            <button className="ghost-button" type="button" onClick={() => void onCopy(tweetLinksOnlyText)} disabled={!winners.length}>
              {language === 'fr' ? 'Copier les liens des tweets' : 'Copy Tweet Links'}
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}
