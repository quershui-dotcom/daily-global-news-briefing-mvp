import { env } from '../env.mjs';
import { truncate } from '../utils/text.mjs';

function pickPublishedItems(briefing) {
  return (briefing.items || []).filter((item) => item.included !== false && item.approved !== false);
}

function formatItem(item, index) {
  const parts = [
    `${index + 1}. ${item.headline}`,
    item.summary,
    `为什么重要：${item.whyImportant}`,
  ];

  if (item.angle) {
    parts.push(`角度：${item.angle}`);
  }

  if (item.tags?.length) {
    parts.push(`标签：${item.tags.join(' / ')}`);
  }

  if (item.sources?.length) {
    const sourceNames = item.sources.slice(0, 3).map((source) => source.sourceName);
    parts.push(`来源：${sourceNames.join('、')}`);
  }

  return parts.filter(Boolean).join('\n');
}

export function buildTelegramBriefingText(briefing, options = {}) {
  const items = pickPublishedItems(briefing);
  const maxItems = options.maxItems ?? items.length;
  const deepLinkUrl = `${env.PUBLIC_BASE_URL}/briefings/${briefing.date}`;

  const sections = [
    `${briefing.date}`,
    briefing.title,
  ];

  if (briefing.overview) {
    sections.push(`今日概览：\n${briefing.overview}`);
  }

  if (items.length) {
    sections.push(items.slice(0, maxItems).map(formatItem).join('\n\n'));
  } else {
    sections.push('当前没有可对外发布的新闻条目。');
  }

  if (briefing.videoScript) {
    sections.push(`60 秒口播稿：\n${truncate(briefing.videoScript, 500)}`);
  }

  sections.push(`查看完整简报：\n${deepLinkUrl}`);

  return sections.filter(Boolean).join('\n\n').trim();
}
