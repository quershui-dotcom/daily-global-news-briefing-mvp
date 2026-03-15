export function decodeHtmlEntities(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

export function stripHtml(value = '') {
  return decodeHtmlEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeWhitespace(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function truncate(value = '', maxLength = 140) {
  if (!value || value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

export function hashString(input = '') {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}

const stopwords = new Set([
  'the',
  'a',
  'an',
  'to',
  'of',
  'in',
  'on',
  'for',
  'and',
  'or',
  'at',
  'from',
  'with',
  'after',
  'before',
  'amid',
  'into',
  'over',
  'under',
  'about',
  'that',
  'this',
  'it',
  'its',
  'their',
  'his',
  'her',
  'as',
  'is',
  'are',
  'was',
  'were',
  'be',
  'by',
  'says',
  'say',
  'new',
  'latest',
  'global',
  'world',
]);

export function tokenize(value = '') {
  return normalizeWhitespace(stripHtml(value).toLowerCase())
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, ' ')
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter((token) => token && token.length > 1 && !stopwords.has(token));
}

export function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function extractJsonObject(text = '') {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('AI 返回中没有找到 JSON 对象');
  }
  return JSON.parse(text.slice(firstBrace, lastBrace + 1));
}

export function toIsoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function formatDateTime(value) {
  if (!value) {
    return '未知时间';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('zh-CN', { hour12: false });
}
