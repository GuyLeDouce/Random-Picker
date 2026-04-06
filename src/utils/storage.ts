import type { DrawRecord, GiveawayEntry } from '../types';

export const STORAGE_KEYS = {
  tweetEntries: 'giveaway-picker.tweet.entries',
  tweetHistory: 'giveaway-picker.tweet.history',
  tweetCurrentDraw: 'giveaway-picker.tweet.current-draw',
  commentEntries: 'giveaway-picker.comment.entries',
  commentHistory: 'giveaway-picker.comment.history',
  commentCurrentDraw: 'giveaway-picker.comment.current-draw',
  commentTargetTweetUrl: 'giveaway-picker.comment.target-tweet-url',
} as const;

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadTweetEntries() {
  return safeRead<GiveawayEntry[]>(STORAGE_KEYS.tweetEntries, []);
}

export function saveTweetEntries(entries: GiveawayEntry[]) {
  window.localStorage.setItem(STORAGE_KEYS.tweetEntries, JSON.stringify(entries));
}

export function loadTweetHistory() {
  return safeRead<DrawRecord[]>(STORAGE_KEYS.tweetHistory, []);
}

export function saveTweetHistory(history: DrawRecord[]) {
  window.localStorage.setItem(STORAGE_KEYS.tweetHistory, JSON.stringify(history));
}

export function loadTweetCurrentDraw() {
  return safeRead<DrawRecord | null>(STORAGE_KEYS.tweetCurrentDraw, null);
}

export function saveTweetCurrentDraw(draw: DrawRecord | null) {
  if (draw) {
    window.localStorage.setItem(STORAGE_KEYS.tweetCurrentDraw, JSON.stringify(draw));
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.tweetCurrentDraw);
}

export function loadCommentEntries() {
  return safeRead<GiveawayEntry[]>(STORAGE_KEYS.commentEntries, []);
}

export function saveCommentEntries(entries: GiveawayEntry[]) {
  window.localStorage.setItem(STORAGE_KEYS.commentEntries, JSON.stringify(entries));
}

export function loadCommentHistory() {
  return safeRead<DrawRecord[]>(STORAGE_KEYS.commentHistory, []);
}

export function saveCommentHistory(history: DrawRecord[]) {
  window.localStorage.setItem(STORAGE_KEYS.commentHistory, JSON.stringify(history));
}

export function loadCommentCurrentDraw() {
  return safeRead<DrawRecord | null>(STORAGE_KEYS.commentCurrentDraw, null);
}

export function saveCommentCurrentDraw(draw: DrawRecord | null) {
  if (draw) {
    window.localStorage.setItem(STORAGE_KEYS.commentCurrentDraw, JSON.stringify(draw));
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.commentCurrentDraw);
}

export function loadCommentTargetTweetUrl() {
  return safeRead<string>(STORAGE_KEYS.commentTargetTweetUrl, '');
}

export function saveCommentTargetTweetUrl(url: string) {
  if (url) {
    window.localStorage.setItem(STORAGE_KEYS.commentTargetTweetUrl, JSON.stringify(url));
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.commentTargetTweetUrl);
}
