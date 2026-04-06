import type { GiveawayEntry, ParsedTweetUrl } from '../types';

interface MetadataEnhancement {
  displayName: string;
  handle: string;
  avatarUrl: string;
  metadataStatus: GiveawayEntry['metadataStatus'];
}

const TWEET_URL_REGEX =
  /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})\/status\/(\d+)(?:\/.*)?(?:\?.*)?$/i;

function sanitizeHandle(handle: string) {
  return handle.replace(/^@+/, '').trim();
}

export function normalizeTweetUrl(url: string) {
  const trimmed = url.trim();
  const match = trimmed.match(TWEET_URL_REGEX);

  if (!match) {
    return '';
  }

  const handle = sanitizeHandle(match[1]);
  const tweetId = match[2];
  return `https://x.com/${handle}/status/${tweetId}`;
}

export function parseTweetUrl(url: string): ParsedTweetUrl {
  const trimmed = url.trim();
  const match = trimmed.match(TWEET_URL_REGEX);

  if (!match) {
    return {
      isValid: false,
      error: 'Enter a valid x.com or twitter.com status URL.',
      normalizedUrl: '',
      handle: '',
      tweetId: '',
    };
  }

  const handle = sanitizeHandle(match[1]);
  const tweetId = match[2];

  return {
    isValid: true,
    normalizedUrl: `https://x.com/${handle}/status/${tweetId}`,
    handle,
    tweetId,
  };
}

export function createPlaceholderAvatar(seed: string) {
  const value = seed || 'GG';
  const chars =
    value
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 2)
      .toUpperCase() || 'GG';

  const colors = ['#f97316', '#ef4444', '#06b6d4', '#8b5cf6', '#10b981'];
  const color = colors[value.length % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="28" fill="${color}"/><text x="80" y="96" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="56" font-weight="700" fill="#0f172a">${chars}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export async function enrichEntryMetadata(entry: GiveawayEntry): Promise<MetadataEnhancement> {
  const fallback: MetadataEnhancement = {
    displayName: entry.displayName || entry.handle || `tweet-${entry.tweetId}`,
    handle: entry.handle,
    avatarUrl: entry.avatarUrl || createPlaceholderAvatar(entry.handle || entry.displayName),
    metadataStatus: entry.metadataStatus === 'manual' ? 'manual' : ('failed' as const),
  };

  try {
    const endpoint = `https://publish.twitter.com/oembed?omit_script=true&url=${encodeURIComponent(
      entry.normalizedTweetUrl,
    )}`;
    const response = await fetch(endpoint, { method: 'GET' });

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as {
      author_name?: string;
      author_url?: string;
    };

    const authorUrl = data.author_url?.trim() ?? '';
    const parsedHandle = authorUrl
      ? authorUrl.replace(/^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\//i, '').split('/')[0]
      : '';
    const handle = sanitizeHandle(parsedHandle || entry.handle);
    const displayName = data.author_name?.trim() || entry.displayName || handle || `tweet-${entry.tweetId}`;

    return {
      displayName,
      handle,
      avatarUrl: entry.avatarUrl || createPlaceholderAvatar(handle || displayName),
      metadataStatus: 'enhanced' as const,
    };
  } catch {
    return fallback;
  }
}
