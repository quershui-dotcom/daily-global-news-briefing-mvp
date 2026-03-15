import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const envFile = path.join(rootDir, '.env');

if (fs.existsSync(envFile)) {
  const raw = fs.readFileSync(envFile, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function intEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) ? value : fallback;
}

function boolEnv(name, fallback = false) {
  const raw = process.env[name];
  if (raw == null || raw === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

const port = intEnv('PORT', 3000);

export const env = {
  ROOT_DIR: rootDir,
  PORT: port,
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || `http://localhost:${port}`,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  OPENAI_TIMEOUT_MS: intEnv('OPENAI_TIMEOUT_MS', 45000),
  NEWS_LOOKBACK_HOURS: intEnv('NEWS_LOOKBACK_HOURS', 48),
  MAX_CLUSTER_ITEMS: intEnv('MAX_CLUSTER_ITEMS', 8),
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  TELEGRAM_API_BASE: (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/+$/, ''),
  TELEGRAM_PARSE_MODE: process.env.TELEGRAM_PARSE_MODE || '',
  TELEGRAM_DISABLE_WEB_PAGE_PREVIEW: boolEnv('TELEGRAM_DISABLE_WEB_PAGE_PREVIEW', true),
  TELEGRAM_DISABLE_NOTIFICATION: boolEnv('TELEGRAM_DISABLE_NOTIFICATION', false),
  TELEGRAM_PROTECT_CONTENT: boolEnv('TELEGRAM_PROTECT_CONTENT', false),
  TELEGRAM_CHUNK_SIZE: intEnv('TELEGRAM_CHUNK_SIZE', 4000),
  HUAWEI_APP_ID: process.env.HUAWEI_APP_ID || '',
  HUAWEI_CLIENT_ID: process.env.HUAWEI_CLIENT_ID || '',
  HUAWEI_CLIENT_SECRET: process.env.HUAWEI_CLIENT_SECRET || '',
  HUAWEI_VALIDATE_ONLY: boolEnv('HUAWEI_VALIDATE_ONLY', true),
};
