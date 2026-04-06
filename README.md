# Giveaway Tweet Picker

Local desktop-friendly giveaway winner picker built with Vite, React, and TypeScript. It runs fully in the browser with `localStorage` persistence, no backend, and no Twitter API keys.

## Setup

1. `npm install`
2. `npm run dev`
3. Open the localhost URL shown in the terminal, usually `http://localhost:5173`

## What It Does

- Paste up to 100 `x.com` or `twitter.com` tweet links
- Switch between `Tweet Selector` and `Comment Selector` modes
- Parse and normalize tweet URLs
- Keep working even when Twitter metadata fetch fails
- Edit entries manually with display name, handle, avatar URL, note, and prize
- Import and export CSV
- Import and export full app state as JSON
- Deduplicate duplicate tweet links
- Warn on duplicate handles
- Randomly pick any number of unique winners fairly
- Reveal winners all at once or one by one
- Lock winners until you intentionally reroll
- Exclude previous winners from future draws
- Persist entries, current draw, and winner history in `localStorage`
- Export winner history to CSV
- Generate tweet-ready winner announcements with character counting

## Metadata Behavior

The app uses a fallback-first strategy:

- It tries the public Twitter oEmbed endpoint when available
- If metadata enhancement fails, the entry still stays valid
- Parsed handle and tweet ID are kept
- Display name falls back to the handle
- Avatar falls back to a generated local placeholder

This means the app remains usable with tweet URLs alone.

## Comment Selector Mode

The app now includes a separate local `Comment Selector` mode:

- Set one target tweet URL
- Import reply/comment URLs for that tweet
- Or add comment entrants manually / by CSV
- Draw winners from that imported comment pool locally

Important:

- The app does not auto-fetch all X/Twitter replies in-browser
- Reply collection is still local/manual or CSV-based
- This keeps the app backend-free and reliable on your own machine

## CSV Format

Header row example:

```csv
displayName,handle,avatarUrl,tweetUrl,tweetId,commentText,note,prize
Jane Doe,janedoe,,https://x.com/janedoe/status/1770000000000000001,1770000000000000001,Excited for this!,VIP winner,Gold Pass
```

Minimal CSV example:

```csv
displayName,handle,avatarUrl,tweetUrl,tweetId,commentText,note,prize
,,,"https://twitter.com/sample/status/1770000000000000002",1770000000000000002,,,
```

## JSON Export

The JSON export contains:

- `entries`
- `drawHistory`
- `currentDraw`
- `exportedAt`

You can export that state from the UI and import it later on the same machine.

## Notes

- The app is dark by default and works on desktop and mobile.
- Winner announcements support `Clean`, `Hype`, and `Minimal` styles.
- Copy actions use the browser clipboard API, so use the app from the browser tab created by `npm run dev`.
