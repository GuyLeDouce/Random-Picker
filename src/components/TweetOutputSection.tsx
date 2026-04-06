import type { OutputStyle, WinnerSnapshot } from '../types';
import { Section } from './Section';

interface TweetOutputSectionProps {
  winners: WinnerSnapshot[];
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
      eyebrow="Output"
      title="Tweet Output"
      subtitle="Copy a tweet-ready winner announcement, just the handles, or a clean winner list."
      actions={<div className={`stat-pill ${tweetText.length > 280 ? 'warning' : ''}`}>{tweetText.length} chars</div>}
    >
      <div className="control-grid">
        <label className="toggle-card">
          <span>Style</span>
          <select value={outputStyle} onChange={(event) => setOutputStyle(event.target.value as OutputStyle)}>
            <option value="clean">Clean</option>
            <option value="hype">Hype</option>
            <option value="minimal">Minimal</option>
          </select>
        </label>
        <label className="toggle-card">
          <input
            type="checkbox"
            checked={includeNumbering}
            onChange={(event) => setIncludeNumbering(event.target.checked)}
          />
          <span>Include numbering</span>
        </label>
        <label className="toggle-card">
          <input
            type="checkbox"
            checked={includeTweetLinks}
            onChange={(event) => setIncludeTweetLinks(event.target.checked)}
          />
          <span>Include tweet links</span>
        </label>
      </div>

      <div className="output-grid">
        <div className="stack">
          <label>
            <span>Announcement Tweet</span>
            <textarea value={winners.length ? tweetText : ''} readOnly rows={8} />
          </label>
          <div className="inline-actions wrap">
            <button className="primary-button" type="button" onClick={() => void onCopy(tweetText)} disabled={!winners.length}>
              Copy Tweet
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void onCopy(winnersOnlyText)}
              disabled={!winners.length}
            >
              Copy Winners Only
            </button>
            <button className="ghost-button" type="button" onClick={() => void onCopy(handlesOnlyText)} disabled={!winners.length}>
              Copy Tagged Handles
            </button>
          </div>
        </div>
        <div className="stack">
          <label>
            <span>Alternate Output</span>
            <textarea value={winners.length ? tweetLinksOnlyText : ''} readOnly rows={8} />
          </label>
          <div className="inline-actions wrap">
            <button className="ghost-button" type="button" onClick={() => void onCopy(tweetLinksOnlyText)} disabled={!winners.length}>
              Copy Tweet Links
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}
