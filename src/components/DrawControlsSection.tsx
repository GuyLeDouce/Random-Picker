import type { GiveawayEntry } from '../types';
import { Section } from './Section';

interface DrawControlsSectionProps {
  entries: GiveawayEntry[];
  eligibleEntriesCount: number;
  winnerCount: number;
  setWinnerCount: (value: number) => void;
  excludePreviousWinners: boolean;
  setExcludePreviousWinners: (value: boolean) => void;
  lockWinners: boolean;
  setLockWinners: (value: boolean) => void;
  revealMode: 'all' | 'one';
  setRevealMode: (value: 'all' | 'one') => void;
  onPickWinners: () => Promise<void>;
  onReroll: () => Promise<void>;
}

export function DrawControlsSection({
  entries,
  eligibleEntriesCount,
  winnerCount,
  setWinnerCount,
  excludePreviousWinners,
  setExcludePreviousWinners,
  lockWinners,
  setLockWinners,
  revealMode,
  setRevealMode,
  onPickWinners,
  onReroll,
}: DrawControlsSectionProps) {
  return (
    <Section
      eyebrow="Draw"
      title="Draw Controls"
      subtitle="Run a fair, unique draw with optional one-by-one reveal and winner locking."
      actions={<div className="stat-pill">{eligibleEntriesCount} eligible</div>}
    >
      <div className="control-grid">
        <label className="toggle-card">
          <span>Winner count</span>
          <input
            type="number"
            min={1}
            max={Math.max(1, eligibleEntriesCount)}
            value={winnerCount}
            onChange={(event) => setWinnerCount(Number(event.target.value) || 1)}
          />
        </label>
        <label className="toggle-card">
          <input
            type="checkbox"
            checked={excludePreviousWinners}
            onChange={(event) => setExcludePreviousWinners(event.target.checked)}
          />
          <span>Exclude previous winners</span>
        </label>
        <label className="toggle-card">
          <input type="checkbox" checked={lockWinners} onChange={(event) => setLockWinners(event.target.checked)} />
          <span>Lock winners until reroll</span>
        </label>
        <label className="toggle-card">
          <span>Reveal mode</span>
          <select value={revealMode} onChange={(event) => setRevealMode(event.target.value as 'all' | 'one')}>
            <option value="all">Reveal all at once</option>
            <option value="one">Reveal one by one</option>
          </select>
        </label>
      </div>

      <div className="inline-actions wrap">
        <button className="primary-button large" type="button" onClick={() => void onPickWinners()}>
          Pick {winnerCount} Winner{winnerCount === 1 ? '' : 's'}
        </button>
        <button className="secondary-button" type="button" onClick={() => void onReroll()} disabled={!entries.length}>
          Reroll
        </button>
      </div>
    </Section>
  );
}
