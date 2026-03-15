import { env } from '../env.mjs';
import { getBriefing, listDevices, saveBriefing } from '../storage.mjs';

async function getHuaweiAccessToken() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_secret: env.HUAWEI_CLIENT_SECRET,
    client_id: env.HUAWEI_CLIENT_ID,
  });

  const response = await fetch('https://oauth-login.cloud.huawei.com/oauth2/v3/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`华为 OAuth 失败: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('华为 OAuth 未返回 access_token');
  }
  return data.access_token;
}

function buildRequestBody({ briefing, tokens }) {
  const deepLinkUrl = `${env.PUBLIC_BASE_URL}/briefings/${briefing.date}`;

  return {
    validate_only: env.HUAWEI_VALIDATE_ONLY,
    message: {
      token: tokens,
      data: JSON.stringify({
        type: 'daily-briefing',
        date: briefing.date,
        deepLinkUrl,
        title: briefing.title,
        overview: briefing.overview,
      }),
      android: {
        notification: {
          title: briefing.title,
          body: briefing.overview,
        },
      },
    },
  };
}

export async function publishBriefingToHuawei(date) {
  const briefing = getBriefing(date);
  if (!briefing) {
    throw new Error(`找不到 ${date} 的简报`);
  }

  const devices = listDevices().filter((device) => device.enabled !== false);
  const tokens = devices.map((device) => device.token).filter(Boolean);
  const requestBody = buildRequestBody({ briefing, tokens });

  if (!tokens.length || !env.HUAWEI_APP_ID || !env.HUAWEI_CLIENT_ID || !env.HUAWEI_CLIENT_SECRET) {
    const previewResult = {
      mode: 'preview',
      message: '缺少设备 Token 或华为 Push Kit 凭据，返回请求预览。',
      requestBody,
      deviceCount: tokens.length,
      ok: false,
      sentAt: new Date().toISOString(),
    };

    const nextBriefing = {
      ...briefing,
      publishChannels: {
        ...(briefing.publishChannels || {}),
        huawei: previewResult,
      },
      updatedAt: new Date().toISOString(),
    };

    saveBriefing(nextBriefing);
    return previewResult;
  }

  const accessToken = await getHuaweiAccessToken();
  const response = await fetch(`https://push-api.cloud.huawei.com/v1/${env.HUAWEI_APP_ID}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(15000),
  });

  const rawText = await response.text();
  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch {
    payload = { rawText };
  }

  const publishResult = {
    sentAt: new Date().toISOString(),
    ok: response.ok,
    status: response.status,
    payload,
    deviceCount: tokens.length,
    mode: 'sent',
  };

  const nextBriefing = {
    ...briefing,
    status: response.ok ? 'published' : briefing.status,
    publishedAt: response.ok ? new Date().toISOString() : briefing.publishedAt,
    publishChannels: {
      ...(briefing.publishChannels || {}),
      huawei: publishResult,
    },
    updatedAt: new Date().toISOString(),
  };

  saveBriefing(nextBriefing);

  if (!response.ok) {
    throw new Error(`华为 Push Kit 推送失败: ${response.status} ${rawText}`);
  }

  return publishResult;
}
