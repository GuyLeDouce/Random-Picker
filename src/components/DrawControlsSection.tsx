import type { AppLanguage, GiveawayEntry } from '../types';
import { Section } from './Section';

interface DrawControlsSectionProps {
  entries: GiveawayEntry[];
  language: AppLanguage;
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
  language,
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
      eyebrow={language === 'fr' ? 'Tirage' : 'Draw'}
      title={language === 'fr' ? 'Controles du tirage' : 'Draw Controls'}
      subtitle={
        language === 'fr'
          ? 'Lancez un tirage equitable et unique avec revelation optionnelle et verrouillage des gagnants.'
          : 'Run a fair, unique draw with optional one-by-one reveal and winner locking.'
      }
      actions={<div className="stat-pill">{eligibleEntriesCount} {language === 'fr' ? 'eligibles' : 'eligible'}</div>}
    >
      <div className="control-grid">
        <label className="toggle-card">
          <span>{language === 'fr' ? 'Nombre de gagnants' : 'Winner count'}</span>
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
          <span>{language === 'fr' ? 'Exclure les gagnants precedents' : 'Exclude previous winners'}</span>
        </label>
        <label className="toggle-card">
          <input type="checkbox" checked={lockWinners} onChange={(event) => setLockWinners(event.target.checked)} />
          <span>{language === 'fr' ? 'Verrouiller les gagnants jusquau reroll' : 'Lock winners until reroll'}</span>
        </label>
        <label className="toggle-card">
          <span>{language === 'fr' ? 'Mode de revelation' : 'Reveal mode'}</span>
          <select value={revealMode} onChange={(event) => setRevealMode(event.target.value as 'all' | 'one')}>
            <option value="all">{language === 'fr' ? 'Tout reveler en une fois' : 'Reveal all at once'}</option>
            <option value="one">{language === 'fr' ? 'Reveler un par un' : 'Reveal one by one'}</option>
          </select>
        </label>
      </div>

      <div className="inline-actions wrap">
        <button className="primary-button large" type="button" onClick={() => void onPickWinners()}>
          {language === 'fr'
            ? `Choisir ${winnerCount} gagnant${winnerCount === 1 ? '' : 's'}`
            : `Pick ${winnerCount} Winner${winnerCount === 1 ? '' : 's'}`}
        </button>
        <button className="secondary-button" type="button" onClick={() => void onReroll()} disabled={!entries.length}>
          Reroll
        </button>
      </div>
    </Section>
  );
}
