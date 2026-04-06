import type { AppLanguage, DrawRecord } from '../types';
import { Section } from './Section';

interface AuditHistorySectionProps {
  currentDraw: DrawRecord | null;
  language: AppLanguage;
  history: DrawRecord[];
  onExportHistoryCsv: () => void;
  onResetHistory: () => void;
}

export function AuditHistorySection({
  currentDraw,
  language,
  history,
  onExportHistoryCsv,
  onResetHistory,
}: AuditHistorySectionProps) {
  return (
    <Section
      eyebrow="Audit"
      title={language === 'fr' ? 'Audit / Historique' : 'Audit / History'}
      subtitle={
        language === 'fr'
          ? 'Suivez lordre aleatoire, les horodatages et les gagnants precedents entre les sessions.'
          : 'Track the randomized order, draw timestamps, and previous winners across sessions.'
      }
      actions={
        <div className="inline-actions wrap">
          <button className="ghost-button" type="button" onClick={onExportHistoryCsv}>
            {language === 'fr' ? 'Exporter lhistoire CSV' : 'Export History CSV'}
          </button>
          <button className="danger-button" type="button" onClick={onResetHistory}>
            {language === 'fr' ? 'Reinitialiser lhistoire' : 'Reset History'}
          </button>
        </div>
      }
    >
      {currentDraw ? (
        <details className="audit-card" open>
          <summary>{language === 'fr' ? 'Audit du tirage actuel' : 'Current draw audit'}</summary>
          <p className="muted">{language === 'fr' ? 'Heure du tirage :' : 'Draw time:'} {new Date(currentDraw.createdAt).toLocaleString()}</p>
          <textarea value={currentDraw.randomizedOrder.join('\n')} readOnly rows={6} />
        </details>
      ) : null}

      <div className="history-list">
        {history.length ? (
          history.map((draw) => (
            <article className="history-card" key={draw.id}>
              <div className="history-meta">
                <h3>{new Date(draw.createdAt).toLocaleString()}</h3>
                <p className="muted">{draw.winners.length} {language === 'fr' ? 'gagnants enregistres' : 'winners stored'}</p>
              </div>
              <p>{draw.winners.map((winner) => (winner.handle ? `@${winner.handle}` : winner.displayName)).join(', ')}</p>
            </article>
          ))
        ) : (
          <div className="empty-state">{language === 'fr' ? 'Lhistoire des gagnants est vide.' : 'Winner history is empty.'}</div>
        )}
      </div>
    </Section>
  );
}
