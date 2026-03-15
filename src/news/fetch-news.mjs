import { env } from '../env.mjs';
import { DEFAULT_NEWS_SOURCES } from './sources.mjs';
import { parseFeed } from './rss.mjs';

function isRecentEnough(publishedAt, lookbackHours) {
  if (!publishedAt) {
    return true;
  }
  const timestamp = new Date(publishedAt).getTime();
  if (Number.isNaN(timestamp)) {
    return true;
  }
  const diffMs = Date.now() - timestamp;
  return diffMs <= lookbackHours * 60 * 60 * 1000;
}

export async function fetchNewsSources(options = {}) {
  const sources = options.sources ?? DEFAULT_NEWS_SOURCES;
  const lookbackHours = options.lookbackHours ?? env.NEWS_LOOKBACK_HOURS;

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const response = await fetch(source.url, {
        headers: {
          'user-agent': 'daily-global-news-briefing-mvp/0.1',
          accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`${source.name} 拉取失败: ${response.status}`);
      }

      const xml = await response.text();
      const items = parseFeed(xml, source).filter((item) => isRecentEnough(item.publishedAt, lookbackHours));

      return {
        source,
        itemCount: items.length,
        items,
      };
    }),
  );

  const items = [];
  const reports = [];
  const errors = [];
  const seen = new Set();

  for (const result of results) {
    if (result.status === 'fulfilled') {
      reports.push({
        sourceId: result.value.source.id,
        sourceName: result.value.source.name,
        url: result.value.source.url,
        itemCount: result.value.itemCount,
        ok: true,
      });

      for (const item of result.value.items) {
        const dedupeKey = `${item.link}|${item.title}`.toLowerCase();
        if (seen.has(dedupeKey)) {
          continue;
        }
        seen.add(dedupeKey);
        items.push(item);
      }
    } else {
      errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
    }
  }

  items.sort((a, b) => {
    const left = new Date(a.publishedAt || 0).getTime();
    const right = new Date(b.publishedAt || 0).getTime();
    return right - left;
  });

  return {
    items,
    reports,
    errors,
  };
}
