export type SortMode = 'recent' | 'name' | 'handle';
export type OutputStyle = 'clean' | 'hype' | 'minimal';
export type PickerMode = 'tweet' | 'comment';
export type AppLanguage = 'en' | 'fr';

export interface GiveawayEntry {
  id: string;
  tweetUrl: string;
  normalizedTweetUrl: string;
  tweetId: string;
  displayName: string;
  handle: string;
  avatarUrl: string;
  commentText: string;
  note: string;
  prize: string;
  createdAt: string;
  updatedAt: string;
  metadataStatus: 'manual' | 'parsed' | 'enhanced' | 'failed';
}

export interface WinnerSnapshot {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl: string;
  commentText: string;
  tweetUrl: string;
  tweetId: string;
  prize: string;
  note: string;
}

export interface DrawRecord {
  id: string;
  createdAt: string;
  winnerIds: string[];
  randomizedOrder: string[];
  winners: WinnerSnapshot[];
}

export interface AppStateExport {
  exportedAt: string;
  mode: PickerMode;
  targetTweetUrl?: string;
  entries: GiveawayEntry[];
  drawHistory: DrawRecord[];
  currentDraw: DrawRecord | null;
}

export interface EntryDraft {
  displayName: string;
  handle: string;
  avatarUrl: string;
  tweetUrl: string;
  commentText: string;
  note: string;
  prize: string;
}

export interface ParsedTweetUrl {
  isValid: boolean;
  error?: string;
  normalizedUrl: string;
  handle: string;
  tweetId: string;
}

export interface TweetOutputOptions {
  style: OutputStyle;
  includeNumbering: boolean;
  includeTweetLinks: boolean;
  language: AppLanguage;
}
