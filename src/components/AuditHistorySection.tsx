import type { DrawRecord } from '../types';
import { Section } from './Section';

interface AuditHistorySectionProps {
  currentDraw: DrawRecord | null;
  history: DrawRecord[];
  onExportHistoryCsv: () => void;
  onResetHistory: () => void;
}

export function AuditHistorySection({
  currentDraw,
  history,
  onExportHistoryCsv,
  onResetHistory,
}: AuditHistorySectionProps) {
  return (
    <Section
      eyebrow="Audit"
      title="Audit / History"
      subtitle="Track the randomized order, draw timestamps, and previous winners across sessions."
      actions={
        <div className="inline-actions wrap">
          <button className="ghost-button" type="button" onClick={onExportHistoryCsv}>
            Export History CSV
          </button>
          <button className="danger-button" type="button" onClick={onResetHistory}>
            Reset History
          </button>
        </div>
      }
    >
      {currentDraw ? (
        <details className="audit-card" open>
          <summary>Current draw audit</summary>
          <p className="muted">Draw time: {new Date(currentDraw.createdAt).toLocaleString()}</p>
          <textarea value={currentDraw.randomizedOrder.join('\n')} readOnly rows={6} />
        </details>
      ) : null}

      <div className="history-list">
        {history.length ? (
          history.map((draw) => (
            <article className="history-card" key={draw.id}>
              <div className="history-meta">
                <h3>{new Date(draw.createdAt).toLocaleString()}</h3>
                <p className="muted">{draw.winners.length} winners stored</p>
              </div>
              <p>{draw.winners.map((winner) => (winner.handle ? `@${winner.handle}` : winner.displayName)).join(', ')}</p>
            </article>
          ))
        ) : (
          <div className="empty-state">Winner history is empty.</div>
        )}
      </div>
    </Section>
  );
}
