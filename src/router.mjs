import path from 'node:path';
import { env } from './env.mjs';
import { answerBriefingQuestion } from './services/openai.mjs';
import { generateDailyBriefing, updateBriefing } from './services/briefing-service.mjs';
import { publishBriefingToHuawei } from './services/huawei-push.mjs';
import { getBriefing, getLatestBriefing, listBriefings, listDevices, upsertDevice } from './storage.mjs';
import { methodNotAllowed, notFound, readJsonBody, sendHtml, sendJson, serveStaticFile } from './utils/http.mjs';
import { toIsoDate } from './utils/text.mjs';
import { renderAdminPage, renderBriefingPage } from './views.mjs';

const publicDir = path.join(env.ROOT_DIR, 'public');

function parseDateFromPath(pathname, prefix) {
  const value = pathname.slice(prefix.length);
  return decodeURIComponent(value.split('/')[0]);
}

export async function routeRequest(req, res) {
  const url = new URL(req.url, env.PUBLIC_BASE_URL);
  const pathname = url.pathname;

  if (pathname === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/styles.css') {
    serveStaticFile(res, path.join(publicDir, 'styles.css'));
    return;
  }

  if (pathname === '/admin.js') {
    serveStaticFile(res, path.join(publicDir, 'admin.js'));
    return;
  }

  if (pathname === '/mobile.js') {
    serveStaticFile(res, path.join(publicDir, 'mobile.js'));
    return;
  }

  if (req.method === 'GET' && pathname === '/') {
    sendHtml(res, renderAdminPage());
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/briefings/')) {
    const date = parseDateFromPath(pathname, '/briefings/');
    sendHtml(res, renderBriefingPage(date));
    return;
  }

  if (req.method === 'GET' && pathname === '/api/status') {
    sendJson(res, 200, {
      ok: true,
      today: toIsoDate(),
      latestBriefingDate: getLatestBriefing()?.date ?? null,
      briefingCount: listBriefings().length,
      deviceCount: listDevices().length,
      config: {
        publicBaseUrl: env.PUBLIC_BASE_URL,
        hasOpenAIKey: Boolean(env.OPENAI_API_KEY),
        openaiModel: env.OPENAI_MODEL,
        hasHuaweiConfig: Boolean(env.HUAWEI_APP_ID && env.HUAWEI_CLIENT_ID && env.HUAWEI_CLIENT_SECRET),
      },
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/devices') {
    sendJson(res, 200, {
      ok: true,
      devices: listDevices(),
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/devices/register') {
    const body = await readJsonBody(req);
    if (!body.token) {
      sendJson(res, 400, { ok: false, error: 'token 不能为空' });
      return;
    }
    const device = upsertDevice({
      token: body.token.trim(),
      nickname: body.nickname?.trim() || '',
      platform: body.platform?.trim() || 'huawei',
      enabled: true,
    });
    sendJson(res, 200, { ok: true, device });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/briefings/latest') {
    sendJson(res, 200, { ok: true, briefing: getLatestBriefing() });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/briefings') {
    const date = url.searchParams.get('date');
    const briefing = date ? getBriefing(date) : getLatestBriefing();
    sendJson(res, 200, { ok: true, briefing });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/briefings/generate') {
    const body = await readJsonBody(req);
    const briefing = await generateDailyBriefing({
      date: body.date || toIsoDate(),
      demo: false,
    });
    sendJson(res, 200, { ok: true, briefing });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/demo/seed') {
    const body = await readJsonBody(req);
    const briefing = await generateDailyBriefing({
      date: body.date || toIsoDate(),
      demo: true,
    });
    sendJson(res, 200, { ok: true, briefing });
    return;
  }

  if (req.method === 'POST' && pathname.startsWith('/api/briefings/') && pathname.endsWith('/save')) {
    const date = pathname.slice('/api/briefings/'.length, -'/save'.length);
    const body = await readJsonBody(req);
    const briefing = updateBriefing(date, {
      title: body.title,
      overview: body.overview,
      videoScript: body.videoScript,
      items: Array.isArray(body.items) ? body.items : [],
      status: body.status || 'draft',
    });
    sendJson(res, 200, { ok: true, briefing });
    return;
  }

  if (req.method === 'POST' && pathname.startsWith('/api/briefings/') && pathname.endsWith('/publish')) {
    const date = pathname.slice('/api/briefings/'.length, -'/publish'.length);
    const result = await publishBriefingToHuawei(date);
    sendJson(res, 200, { ok: true, result });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/ask') {
    const body = await readJsonBody(req);
    if (!body.question) {
      sendJson(res, 400, { ok: false, error: 'question 不能为空' });
      return;
    }
    const briefing = body.date ? getBriefing(body.date) : getLatestBriefing();
    const result = await answerBriefingQuestion({
      briefing,
      question: body.question,
    });
    sendJson(res, 200, {
      ok: true,
      ...result,
    });
    return;
  }

  if (pathname.startsWith('/api/')) {
    methodNotAllowed(res);
    return;
  }

  notFound(res);
}
