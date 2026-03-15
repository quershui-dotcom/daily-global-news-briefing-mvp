import { env } from '../env.mjs';
import { getBriefing, saveBriefing } from '../storage.mjs';
import { chunkText } from '../utils/text.mjs';
import { buildTelegramBriefingText } from '../formatters/telegram-formatter.mjs';

async function callTelegram(method, payload) {
  const response = await fetch(`${env.TELEGRAM_API_BASE}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = { ok: false, rawText };
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram API 调用失败: ${response.status}`);
  }

  return data.result;
}

export function previewBriefingForTelegram(date) {
  const briefing = getBriefing(date);
  if (!briefing) {
    throw new Error(`找不到 ${date} 的简报`);
  }

  const text = buildTelegramBriefingText(briefing);
  const chunks = chunkText(text, env.TELEGRAM_CHUNK_SIZE);

  return {
    date,
    text,
    chunks,
    chunkCount: chunks.length,
    configReady: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
  };
}

export async function publishBriefingToTelegram(date) {
  const briefing = getBriefing(date);
  if (!briefing) {
    throw new Error(`找不到 ${date} 的简报`);
  }

  const preview = previewBriefingForTelegram(date);

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    const previewResult = {
      mode: 'preview',
      message: '缺少 Telegram Bot Token 或 Chat ID，已返回文稿预览。',
      chunkCount: preview.chunkCount,
      text: preview.text,
      chatId: env.TELEGRAM_CHAT_ID || '',
    };

    const nextBriefing = {
      ...briefing,
      publishChannels: {
        ...(briefing.publishChannels || {}),
        telegram: {
          sentAt: new Date().toISOString(),
          ok: false,
          ...previewResult,
        },
      },
      updatedAt: new Date().toISOString(),
    };
    saveBriefing(nextBriefing);
    return previewResult;
  }

  const results = [];
  for (const chunk of preview.chunks) {
    const result = await callTelegram('sendMessage', {
      chat_id: env.TELEGRAM_CHAT_ID,
      text: chunk,
      parse_mode: env.TELEGRAM_PARSE_MODE || undefined,
      link_preview_options: {
        is_disabled: env.TELEGRAM_DISABLE_WEB_PAGE_PREVIEW,
      },
      disable_notification: env.TELEGRAM_DISABLE_NOTIFICATION,
      protect_content: env.TELEGRAM_PROTECT_CONTENT,
    });
    results.push(result);
  }

  const publishResult = {
    mode: 'sent',
    ok: true,
    sentAt: new Date().toISOString(),
    chunkCount: preview.chunkCount,
    messageIds: results.map((item) => item.message_id),
    chatId: env.TELEGRAM_CHAT_ID,
    textPreview: preview.text.slice(0, 600),
  };

  const nextBriefing = {
    ...briefing,
    status: 'published',
    publishedAt: briefing.publishedAt || new Date().toISOString(),
    publishChannels: {
      ...(briefing.publishChannels || {}),
      telegram: publishResult,
    },
    updatedAt: new Date().toISOString(),
  };

  saveBriefing(nextBriefing);
  return publishResult;
}
