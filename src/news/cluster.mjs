import { hashString, tokenize, unique } from '../utils/text.mjs';

function toTokenSet(article) {
  return new Set(tokenize(`${article.title} ${article.summary} ${article.categories?.join(' ') || ''}`));
}

function jaccard(left, right) {
  if (!left.size || !right.size) {
    return 0;
  }
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) {
      overlap += 1;
    }
  }
  return overlap / (left.size + right.size - overlap);
}

function scoreSimilarity(left, right) {
  const titleLeft = new Set(tokenize(left.title));
  const titleRight = new Set(tokenize(right.title));
  const fullLeft = left._tokens ?? toTokenSet(left);
  const fullRight = right._tokens ?? toTokenSet(right);
  return jaccard(titleLeft, titleRight) * 0.7 + jaccard(fullLeft, fullRight) * 0.3;
}

function recencyScore(articles) {
  const latest = Math.max(...articles.map((article) => new Date(article.publishedAt || 0).getTime() || 0));
  const ageHours = Math.max(1, (Date.now() - latest) / (1000 * 60 * 60));
  return Math.max(0.2, 1 / ageHours);
}

function keywordSummary(articles) {
  const scores = new Map();
  for (const article of articles) {
    for (const token of tokenize(`${article.title} ${article.summary}`)) {
      scores.set(token, (scores.get(token) ?? 0) + 1);
    }
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([token]) => token);
}

function regionFromArticles(articles) {
  const text = `${articles.map((article) => `${article.title} ${article.summary}`).join(' ')}`.toLowerCase();
  if (/(europe|eu|uk|britain|france|germany|italy|russia|ukraine)/.test(text)) return '欧洲';
  if (/(china|beijing|japan|india|asia|taiwan|korea|singapore)/.test(text)) return '亚太';
  if (/(us|usa|america|white house|washington|canada|mexico)/.test(text)) return '美洲';
  if (/(middle east|israel|iran|saudi|gaza|syria)/.test(text)) return '中东';
  if (/(africa|sudan|nigeria|kenya|ethiopia|egypt)/.test(text)) return '非洲';
  return '全球';
}

export function clusterArticles(items, threshold = 0.3) {
  const prepared = items.map((item) => ({ ...item, _tokens: toTokenSet(item) }));
  const clusters = [];

  for (const article of prepared) {
    let bestCluster = null;
    let bestScore = 0;

    for (const cluster of clusters) {
      const score = scoreSimilarity(article, cluster.representative);
      if (score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    }

    if (bestCluster && bestScore >= threshold) {
      bestCluster.articles.push(article);
      if (new Date(article.publishedAt || 0).getTime() > new Date(bestCluster.representative.publishedAt || 0).getTime()) {
        bestCluster.representative = article;
      }
      bestCluster.similarity = Math.max(bestCluster.similarity, bestScore);
    } else {
      clusters.push({
        id: `cluster-${hashString(article.title)}`,
        representative: article,
        articles: [article],
        similarity: bestScore,
      });
    }
  }

  return clusters.map((cluster) => {
    const diversity = unique(cluster.articles.map((article) => article.sourceId)).length;
    const sourceWeight = cluster.articles.reduce((sum, article) => sum + (article.editorialWeight ?? 1), 0);
    const freshness = recencyScore(cluster.articles);

    return {
      ...cluster,
      keywords: keywordSummary(cluster.articles),
      region: regionFromArticles(cluster.articles),
      diversity,
      score: cluster.articles.length * 0.55 + diversity * 0.2 + sourceWeight * 0.15 + freshness * 0.1,
    };
  });
}

export function selectTopClusters(clusters, limit = 8) {
  return [...clusters]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((cluster, index) => ({
      ...cluster,
      rank: index + 1,
    }));
}
