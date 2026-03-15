import { createServer } from 'node:http';
import { env } from './src/env.mjs';
import { routeRequest } from './src/router.mjs';
import { ensureStorage } from './src/storage.mjs';

ensureStorage();

const server = createServer(async (req, res) => {
  try {
    await routeRequest(req, res);
  } catch (error) {
    console.error('[server]', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
    }
    res.end(
      JSON.stringify({
        ok: false,
        error: '服务器内部错误',
        detail: error instanceof Error ? error.message : String(error),
      }),
    );
  }
});

server.listen(env.PORT, () => {
  console.log(`Daily Global News Briefing MVP running at ${env.PUBLIC_BASE_URL}`);
});
