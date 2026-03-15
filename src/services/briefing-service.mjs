import { env } from '../env.mjs';
import { createDemoBriefing } from '../demo/demo-briefing.mjs';
import { clusterArticles, selectTopClusters } from '../news/cluster.mjs';
import { fetchNewsSources } from '../news/fetch-news.mjs';
import { getBriefing, saveBriefing, saveRawIngest } from '../storage.mjs';
import { formatDateTime, unique, toIsoDate } from '../utils/text.mjs';
import { generateBriefingCopy } from './openai.mjs';

function mapAiItem(cluster, aiItem = {}) {
  const topSources = cluster.articles.slice(0, 4).map((article) => ({
    sourceId: article.sourceId,
    sourceName: article.sourceName,
    title: article.title,
    link: article.link,
    publishedAt: article.publishedAt,
  }));

  return {
    id: cluster.id,
    clusterId: cluster.id,
    rank: cluster.rank,
    included: true,
    approved: true,
    headline: aiItem.headline || cluster.representative.title,
    summary: aiItem.summary || cluster.representative.summary || cluster.representative.title,
    whyImportant: aiItem.whyImportant || `当前聚合到 ${cluster.articles.length} 条相关报道。`,
    angle: aiItem.angle || cluster.keywords.slice(0, 3).join(' / '),
    tags: unique([...(aiItem.tags || []), cluster.region, ...cluster.keywords]).slice(0, 6),
    region: aiItem.region || cluster.region,
    sources: topSources,
    rawStats: {
      sourceCount: cluster.articles.length,
      diversity: cluster.diversity,
      score: Number(cluster.score.toFixed(3)),
      latestAt: formatDateTime(cluster.articles[0]?.publishedAt),
    },
  };
}

export async function generateDailyBriefing({ date = toIsoDate(), demo = false } = {}) {
  if (demo) {
    return saveBriefing({
      ...createDemoBriefing(date),
      updatedAt: new Date().toISOString(),
    });
  }

  const ingestResult = await fetchNewsSources();
  const clusters = selectTopClusters(clusterArticles(ingestResult.items), env.MAX_CLUSTER_ITEMS);

  saveRawIngest(date, {
    createdAt: new Date().toISOString(),
    ingestResult,
    clusters: clusters.map((cluster) => ({
      id: cluster.id,
      rank: cluster.rank,
      keywords: cluster.keywords,
      region: cluster.region,
      score: cluster.score,
      articles: cluster.articles.map((article) => ({
        sourceName: article.sourceName,
        title: article.title,
        link: article.link,
        publishedAt: article.publishedAt,
      })),
    })),
  });

  const aiCopy = await generateBriefingCopy({ date, clusters });
  const aiItems = Array.isArray(aiCopy.items) ? aiCopy.items : [];
  const mappedItems = clusters.map((cluster, index) => {
    const matched = aiItems.find((item) => item.clusterId === cluster.id) || aiItems[index] || {};
    return mapAiItem(cluster, matched);
  });

  const briefing = {
    date,
    title: aiCopy.title || `全球热点简报 · ${date}`,
    overview: aiCopy.overview || '',
    videoScript: aiCopy.videoScript || '',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    demoMode: false,
    generation: {
      mode: aiCopy.mode,
      openaiResponseId: aiCopy.rawResponseId || '',
      rawCount: ingestResult.items.length,
      clusterCount: clusters.length,
    },
    sourceReports: ingestResult.reports,
    errors: ingestResult.errors,
    items: mappedItems,
  };

  return saveBriefing(briefing);
}

export function updateBriefing(date, patch) {
  const briefing = getBriefing(date);
  if (!briefing) {
    throw new Error(`简报 ${date} 不存在`);
  }

  const nextBriefing = {
    ...briefing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  return saveBriefing(nextBriefing);
}
