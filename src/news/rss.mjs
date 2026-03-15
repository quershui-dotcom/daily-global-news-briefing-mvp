import { decodeHtmlEntities, hashString, normalizeWhitespace, stripHtml } from '../utils/text.mjs';

function escapeTagName(tagName) {
  return tagName.replace(':', '\\:');
}

function extractTag(block, tagNames) {
  for (const tagName of tagNames) {
    const regex = new RegExp(`<${escapeTagName(tagName)}\\b[^>]*>([\\s\\S]*?)<\\/${escapeTagName(tagName)}>`, 'i');
    const match = block.match(regex);
    if (match) {
      return normalizeWhitespace(stripHtml(match[1]));
    }
  }
  return '';
}

function extractAttribute(block, tagName, attributeName) {
  const regex = new RegExp(`<${escapeTagName(tagName)}\\b[^>]*${attributeName}="([^"]+)"[^>]*\\/?>`, 'i');
  const match = block.match(regex);
  return match?.[1] ?? '';
}

function extractAllTags(block, tagNames) {
  const values = [];
  for (const tagName of tagNames) {
    const regex = new RegExp(`<${escapeTagName(tagName)}\\b[^>]*>([\\s\\S]*?)<\\/${escapeTagName(tagName)}>`, 'gi');
    for (const match of block.matchAll(regex)) {
      const cleaned = normalizeWhitespace(stripHtml(match[1]));
      if (cleaned) {
        values.push(cleaned);
      }
    }
  }
  return values;
}

function parseRssItems(xml, source) {
  const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  return itemBlocks.map((block) => {
    const title = extractTag(block, ['title']);
    const link = decodeHtmlEntities(extractTag(block, ['link']));
    const summary = extractTag(block, ['description', 'content:encoded']);
    const publishedAt = extractTag(block, ['pubDate', 'dc:date', 'published']);
    const categories = extractAllTags(block, ['category']);

    return {
      id: `${source.id}-${hashString(`${title}|${link}`)}`,
      sourceId: source.id,
      sourceName: source.name,
      editorialWeight: source.editorialWeight,
      title,
      link,
      summary,
      publishedAt,
      categories,
    };
  });
}

function parseAtomItems(xml, source) {
  const entryBlocks = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  return entryBlocks.map((block) => {
    const title = extractTag(block, ['title']);
    const link =
      decodeHtmlEntities(extractAttribute(block, 'link', 'href')) ||
      decodeHtmlEntities(extractTag(block, ['link', 'id']));
    const summary = extractTag(block, ['summary', 'content']);
    const publishedAt = extractTag(block, ['updated', 'published']);
    const categories = extractAllTags(block, ['category']);

    return {
      id: `${source.id}-${hashString(`${title}|${link}`)}`,
      sourceId: source.id,
      sourceName: source.name,
      editorialWeight: source.editorialWeight,
      title,
      link,
      summary,
      publishedAt,
      categories,
    };
  });
}

export function parseFeed(xml, source) {
  const text = xml.trim();
  const items = text.includes('<entry') ? parseAtomItems(text, source) : parseRssItems(text, source);
  return items.filter((item) => item.title && item.link);
}
