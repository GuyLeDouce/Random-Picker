import type { AppLanguage, OutputStyle, TweetOutputOptions, WinnerSnapshot } from '../types';

function getWinnerLabel(winner: WinnerSnapshot) {
  return winner.handle ? `@${winner.handle}` : winner.displayName;
}

function buildLines(
  winners: WinnerSnapshot[],
  options: TweetOutputOptions,
  compact: boolean,
) {
  const winnerCount = winners.length;
  const introByLanguage: Record<AppLanguage, Record<OutputStyle, string>> = {
    en: {
      clean: compact ? 'Winners:' : 'Winners are in',
      hype: compact ? 'Giveaway winners:' : 'The giveaway winners are locked in',
      minimal: compact ? 'Winners' : 'Winners',
    },
    fr: {
      clean: compact ? 'Gagnants :' : 'Les gagnants sont là',
      hype: compact ? 'Gagnants du giveaway :' : 'Les gagnants du giveaway sont confirmés',
      minimal: compact ? 'Gagnants' : 'Gagnants',
    },
  };

  const outroByLanguage: Record<AppLanguage, Record<OutputStyle, string>> = {
    en: {
      clean: compact ? 'DM me to claim.' : 'DM me to claim',
      hype:
        compact
          ? 'Congrats. DM me.'
          : `Congrats to all ${winnerCount} of you. DM me to claim your prize.`,
      minimal: '',
    },
    fr: {
      clean: compact ? 'DM-moi pour réclamer.' : 'DM-moi pour réclamer',
      hype:
        compact
          ? 'Bravo. DM-moi.'
          : `Bravo à vous ${winnerCount}. DM-moi pour réclamer votre lot.`,
      minimal: '',
    },
  };

  const labels = winners.map((winner, index) => {
    const prefix = options.includeNumbering ? `${index + 1}. ` : '';
    const suffix = options.includeTweetLinks ? ` ${winner.tweetUrl}` : '';
    return `${prefix}${getWinnerLabel(winner)}${suffix}`.trim();
  });

  const lines = [introByLanguage[options.language][options.style], '', ...labels];
  const outro = outroByLanguage[options.language][options.style];
  if (outro) {
    lines.push('', outro);
  }

  return lines.filter((line, index, array) => {
    if (line !== '') {
      return true;
    }
    return array[index - 1] !== '';
  });
}

export function buildTweetText(winners: WinnerSnapshot[], options: TweetOutputOptions) {
  const full = buildLines(winners, options, false).join('\n');
  if (full.length <= 280) {
    return full;
  }

  const compact = buildLines(winners, { ...options, includeTweetLinks: false }, true).join('\n');
  if (compact.length <= 280) {
    return compact;
  }

  return winners
    .map((winner, index) => {
      const prefix = options.includeNumbering ? `${index + 1}. ` : '';
      return `${prefix}${getWinnerLabel(winner)}`;
    })
    .join('\n');
}

export function buildWinnersOnly(winners: WinnerSnapshot[], includeNumbering: boolean) {
  return winners
    .map((winner, index) => `${includeNumbering ? `${index + 1}. ` : ''}${getWinnerLabel(winner)}`)
    .join('\n');
}

export function buildHandlesOnly(winners: WinnerSnapshot[]) {
  return winners
    .map((winner) => (winner.handle ? `@${winner.handle}` : winner.displayName))
    .join(' ');
}

export function buildTweetLinksOnly(winners: WinnerSnapshot[]) {
  return winners.map((winner) => winner.tweetUrl).join('\n');
}
