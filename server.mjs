import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 3000);
const host = '0.0.0.0';
const distDir = join(process.cwd(), 'dist');

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

function sendNotFound(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}

const server = createServer(async (request, response) => {
  try {
    const rawPath = request.url?.split('?')[0] || '/';
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
