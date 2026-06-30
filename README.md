# Squigs Reloaded Giveaway Picker

Ugly Giveaway Picker for Squigs Reloaded giveaways. Paste the tweet, pull the comments, or drop in tweets, names, wallets, links, and handles manually. The app uses local browser storage, fair crypto-backed shuffling, and copy-ready winner posts.

## Setup

1. `npm install`
2. `npm run dev`
3. Open the localhost URL shown in the terminal, usually `http://localhost:5173`

## Production / Railway

Railway configuration is included:

- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm start`

`npm start` runs `server.mjs`, which serves the built `dist/` folder and powers `/api/replies` for X reply importing.

To enable automatic comment imports, configure:

```bash
X_BEARER_TOKEN=your_x_api_bearer_token
```

## What It Does

- Comment Picker: import direct comments from one main tweet through `/api/replies`
- Twitter Picker: paste tweets, names, wallets, links, handles, or other entries manually
- Accepts up to 500 entries at a time
- Deduplicates entries and direct tweet commenters
- Preserves separate entries, current draw, and winner history for each mode in `localStorage`
- Uses `crypto.getRandomValues` through the fair shuffle utility, not `Math.random`
- Excludes previous winners when enabled
- Exports/imports entries as CSV
- Exports/imports full app state as JSON
- Exports winner history as CSV
- Generates Squigs-flavored winner announcement copy:
  - `THE UGLY RNG HAS SPOKEN`
  - winner list
  - `DM to claim. Stay Ugly.`

## CSV Format

```csv
displayName,handle,avatarUrl,tweetUrl,tweetId,commentText,note,prize
Jane Doe,janedoe,,https://x.com/janedoe/status/1770000000000000001,1770000000000000001,Excited for this!,VIP winner,Gold Pass
```

Minimal manual rows also work. Missing avatars fall back to generated local placeholders.

## Comment Import Notes

The server searches recent X replies by `conversation_id`, filters to replies directly on the main tweet, removes duplicate commenters, and caps each import at 500 entries. X API plan and Recent Search limits still apply.

## Brand

Project name: Squigs Reloaded  
App name: Squigs Reloaded Giveaway Picker  
Core vibe: Stay Ugly, comic-style, Web3/NFT giveaway chaos, but readable enough to run real draws.
