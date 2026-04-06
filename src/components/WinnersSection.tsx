import type { AppLanguage, DrawRecord, WinnerSnapshot } from '../types';
import { Avatar } from './Avatar';
import { Section } from './Section';

interface WinnersSectionProps {
  mode: 'tweet' | 'comment';
  language: AppLanguage;
  currentDraw: DrawRecord | null;
  visibleWinners: WinnerSnapshot[];
}

export function WinnersSection({ mode, language, currentDraw, visibleWinners }: WinnersSectionProps) {
  return (
    <Section
      eyebrow={language === 'fr' ? 'Revelation' : 'Reveal'}
      title={
        mode === 'tweet'
          ? language === 'fr'
            ? 'Gagnants'
            : 'Winners'
          : language === 'fr'
            ? 'Gagnants des commentaires'
            : 'Comment Winners'
      }
      subtitle={
        language === 'fr'
          ? 'Cartes premium de revelation, pretes pour stream ou capture.'
          : 'Premium reveal cards with winner details, ready for stream or screenshot.'
      }
      actions={currentDraw ? <div className="stat-pill">{new Date(currentDraw.createdAt).toLocaleString()}</div> : null}
    >
      {currentDraw ? (
        <div className="winner-grid">
          {visibleWinners.map((winner, index) => (
            <article className="winner-card" key={winner.id}>
              <div className="winner-rank">#{index + 1}</div>
              <Avatar src={winner.avatarUrl} label={winner.displayName || winner.handle} />
              <h3>{winner.displayName || winner.handle}</h3>
              <p className="winner-handle">@{winner.handle || (language === 'fr' ? 'inconnu' : 'unknown')}</p>
              {winner.commentText ? <p className="entry-note">{winner.commentText}</p> : null}
              {winner.prize ? <p className="chip">{language === 'fr' ? 'Lot :' : 'Prize:'} {winner.prize}</p> : null}
              {winner.note ? <p className="entry-note">{winner.note}</p> : null}
              <a className="entry-link" href={winner.tweetUrl} target="_blank" rel="noreferrer">
                {winner.tweetUrl}
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          {language === 'fr' ? 'Aucun tirage pour le moment. Choisissez des gagnants pour les reveler ici.' : 'No draw yet. Pick winners to reveal them here.'}
        </div>
      )}
    </Section>
  );
}
