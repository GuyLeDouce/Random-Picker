import type { DrawRecord, WinnerSnapshot } from '../types';
import { Avatar } from './Avatar';
import { Section } from './Section';

interface WinnersSectionProps {
  mode: 'tweet' | 'comment';
  currentDraw: DrawRecord | null;
  visibleWinners: WinnerSnapshot[];
}

export function WinnersSection({ mode, currentDraw, visibleWinners }: WinnersSectionProps) {
  return (
    <Section
      eyebrow="Reveal"
      title={mode === 'tweet' ? 'Winners' : 'Comment Winners'}
      subtitle="Premium reveal cards with winner details, ready for stream or screenshot."
      actions={currentDraw ? <div className="stat-pill">{new Date(currentDraw.createdAt).toLocaleString()}</div> : null}
    >
      {currentDraw ? (
        <div className="winner-grid">
          {visibleWinners.map((winner, index) => (
            <article className="winner-card" key={winner.id}>
              <div className="winner-rank">#{index + 1}</div>
              <Avatar src={winner.avatarUrl} label={winner.displayName || winner.handle} />
              <h3>{winner.displayName || winner.handle}</h3>
              <p className="winner-handle">@{winner.handle || 'unknown'}</p>
              {winner.commentText ? <p className="entry-note">{winner.commentText}</p> : null}
              {winner.prize ? <p className="chip">Prize: {winner.prize}</p> : null}
              {winner.note ? <p className="entry-note">{winner.note}</p> : null}
              <a className="entry-link" href={winner.tweetUrl} target="_blank" rel="noreferrer">
                {winner.tweetUrl}
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">No draw yet. Pick winners to reveal them here.</div>
      )}
    </Section>
  );
}
