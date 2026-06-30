import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 3000);
const host = '0.0.0.0';
const distDir = join(process.cwd(), 'dist');
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;
const MAX_REPLY_IMPORT = 500;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const TWEET_URL_REGEX =
  /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})\/status\/(\d+)(?:\/.*)?(?:\?.*)?$/i;

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function sendNotFound(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}

function parseTweetUrl(url) {
  const match = url.trim().match(TWEET_URL_REGEX);
  if (!match) {
    return null;
  }

  return {
    handle: match[1],
    tweetId: match[2],
    normalizedUrl: `https://x.com/${match[1]}/status/${match[2]}`,
  };
}

async function fetchRecentReplies(tweetUrl, limit) {
  const parsed = parseTweetUrl(tweetUrl);
  if (!parsed) {
    return { error: 'Enter a valid x.com or twitter.com status URL.', statusCode: 400 };
  }

  if (!X_BEARER_TOKEN) {
    return { error: 'X_BEARER_TOKEN is not configured on the server.', statusCode: 500 };
  }

  const cappedLimit = Math.max(1, Math.min(limit, MAX_REPLY_IMPORT));
  const seenAuthors = new Set();
  const replies = [];
  let nextToken = '';
  let searchedCount = 0;

  do {
    const searchParams = new URLSearchParams({
      query: `conversation_id:${parsed.tweetId} is:reply`,
      max_results: String(Math.min(cappedLimit - replies.length, 100)),
      expansions: 'author_id',
      'tweet.fields': 'author_id,conversation_id,created_at,text,referenced_tweets,in_reply_to_user_id',
      'user.fields': 'name,username,profile_image_url',
    });

    if (nextToken) {
      searchParams.set('next_token', nextToken);
    }

    const response = await fetch(`https://api.x.com/2/tweets/search/recent?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${X_BEARER_TOKEN}`,
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      const message =
        payload?.detail ||
        payload?.title ||
        payload?.errors?.[0]?.message ||
        'X API request failed.';
      return { error: message, statusCode: response.status };
    }

    searchedCount += payload.meta?.result_count || 0;
    const usersById = new Map((payload.includes?.users || []).map((user) => [user.id, user]));

    for (const tweet of payload.data || []) {
      const repliedToMainTweet = (tweet.referenced_tweets || []).some(
        (reference) => reference.type === 'replied_to' && reference.id === parsed.tweetId,
      );

      if (!repliedToMainTweet || seenAuthors.has(tweet.author_id)) {
        continue;
      }

      seenAuthors.add(tweet.author_id);
      const user = usersById.get(tweet.author_id);
      replies.push({
        tweetUrl: user?.username ? `https://x.com/${user.username}/status/${tweet.id}` : `https://x.com/i/status/${tweet.id}`,
        normalizedTweetUrl: user?.username
          ? `https://x.com/${user.username}/status/${tweet.id}`
          : `https://x.com/i/status/${tweet.id}`,
        tweetId: tweet.id,
        displayName: user?.name || user?.username || `reply-${tweet.id}`,
        handle: user?.username || '',
        avatarUrl: user?.profile_image_url || '',
        commentText: tweet.text || '',
        fetchedAt: new Date().toISOString(),
      });

      if (replies.length >= cappedLimit) {
        break;
      }
    }

    nextToken = payload.meta?.next_token || '';
  } while (nextToken && replies.length < cappedLimit);

  return {
    statusCode: 200,
    targetTweetUrl: parsed.normalizedUrl,
    replies,
    meta: {
      requestedLimit: limit,
      importedCount: replies.length,
      searchedCount,
      cappedLimit,
    },
  };
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || '/', `http://${request.headers.host || `${host}:${port}`}`);

    if (request.method === 'GET' && requestUrl.pathname === '/api/replies') {
      const tweetUrl = requestUrl.searchParams.get('tweetUrl') || '';
      const limit = Number(requestUrl.searchParams.get('limit') || MAX_REPLY_IMPORT);
      const result = await fetchRecentReplies(tweetUrl, limit);
      writeJson(response, result.statusCode, result);
      return;
    }

    const rawPath = requestUrl.pathname || '/';
    const safePath = normalize(rawPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = join(distDir, safePath === '/' ? 'index.html' : safePath);

    if (existsSync(filePath)) {
      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        filePath = join(filePath, 'index.html');
      }
    } else {
      filePath = join(distDir, 'index.html');
    }

    if (!existsSync(filePath)) {
      sendNotFound(response);
      return;
    }

    const extension = extname(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });

    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Server error');
  }
});

server.listen(port, host, () => {
  console.log(`Static server running on http://${host}:${port}`);
});
