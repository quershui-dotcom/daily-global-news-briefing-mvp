import { env } from '../env.mjs';
import { extractJsonObject, truncate, unique } from '../utils/text.mjs';

function extractOutputText(responseJson) {
  if (typeof responseJson?.output_text === 'string' && responseJson.output_text.trim()) {
    return responseJson.output_text.trim();
  }

  const chunks = [];
  const visit = (node) => {
    if (!node) {
      return;
    }
    if (Array.isArray(node)) {
      for (const value of node) {
        visit(value);
      }
      return;
    }
    if (typeof node !== 'object') {
      return;
    }
    if (node.type === 'output_text' && typeof node.text === 'string') {
      chunks.push(node.text);
    }
    if (Array.isArray(node.content)) {
      visit(node.content);
    }
  };

  visit(responseJson?.output);
  return chunks.join('\n').trim();
}

async function callResponsesApi({ instructions, input, maxOutputTokens = 1800 }) {
  if (!env.OPENAI_API_KEY) {
    throw new Error('未设置 OPENAI_API_KEY');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
    }),
    signal: AbortSignal.timeout(env.OPENAI_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI Responses API 调用失败: ${response.status} ${detail}`);
  }

  return response.json();
}

function fallbackItem(cluster) {
  const top = cluster.articles[0];
  const second = cluster.articles[1];
  const sources = unique(cluster.articles.map((article) => article.sourceName));

  return {
    clusterId: cluster.id,
    headline: truncate(top.title, 34),
    summary: truncate(
      second
        ? `${top.title}。多家媒体围绕“${cluster.keywords.slice(0, 3).join(' / ')}”持续跟进，事件正在快速演变。`
        : `${top.title}。当前热度主要来自 ${top.sourceName}，建议人工确认后发布。`,
      120,
    ),
    whyImportant: truncate(
      `涉及 ${cluster.region} 方向，当前聚合到 ${cluster.articles.length} 条报道，来源包括 ${sources.slice(0, 3).join('、')}。`,
      80,
    ),
    angle: cluster.keywords.slice(0, 3).join(' / '),
    tags: unique([cluster.region, ...cluster.keywords.slice(0, 3)]).slice(0, 5),
    region: cluster.region,
  };
}

export async function generateBriefingCopy({ date, clusters }) {
  if (!clusters.length) {
    return {
      mode: 'empty',
      title: `全球热点简报 · ${date}`,
      overview: '当前没有可用的新闻聚类结果，请稍后重试。',
      videoScript: '今天暂时没有可发布的全球热点，请等待下一轮采集。',
      items: [],
    };
  }

  const clusterPayload = clusters.map((cluster) => ({
    clusterId: cluster.id,
    rank: cluster.rank,
    region: cluster.region,
    keywords: cluster.keywords,
    sourceCount: cluster.articles.length,
    sources: cluster.articles.slice(0, 4).map((article) => ({
      source: article.sourceName,
      title: article.title,
      publishedAt: article.publishedAt,
      url: article.link,
    })),
  }));

  if (!env.OPENAI_API_KEY) {
    const fallbackItems = clusters.map(fallbackItem);
    return {
      mode: 'fallback',
      title: `全球热点简报 · ${date}`,
      overview: `今天重点聚焦 ${clusters
        .slice(0, 3)
        .map((cluster) => cluster.keywords.slice(0, 2).join('/'))
        .join('、')}。`,
      videoScript: fallbackItems
        .slice(0, 5)
        .map((item, index) => `${index + 1}，${item.headline}，${item.summary}`)
        .join('\n'),
      items: fallbackItems,
    };
  }

  const instructions =
    '你是一名中文国际新闻编审，请把输入的新闻聚类整理成适合手机推送和视频展示的中文简报。只返回 JSON，不要 Markdown。';

  const input = `
日期：${date}

请根据以下聚类数据，输出一个 JSON 对象，结构必须严格如下：
{
  "title": "字符串",
  "overview": "80字以内概览",
  "videoScript": "一段约150-220字的口播稿",
  "items": [
    {
      "clusterId": "必须回填输入中的 clusterId",
      "headline": "20字以内中文标题",
      "summary": "60-90字中文摘要",
      "whyImportant": "40字以内说明为什么重要",
      "angle": "一句话提炼角度",
      "tags": ["标签1", "标签2"],
      "region": "地区"
    }
  ]
}

要求：
1. items 数量与输入聚类数量一致，顺序保持一致；
2. 不要编造输入中没有出现的事实；
3. 标题适合推送，摘要适合卡片阅读；
4. 口播稿要自然、适合 60 秒视频开场。

聚类数据：
${JSON.stringify(clusterPayload, null, 2)}
`.trim();

  try {
    const responseJson = await callResponsesApi({
      instructions,
      input,
      maxOutputTokens: 2400,
    });

    const rawText = extractOutputText(responseJson);
    const parsed = extractJsonObject(rawText);

    return {
      mode: 'openai',
      title: parsed.title || `全球热点简报 · ${date}`,
      overview: parsed.overview || '',
      videoScript: parsed.videoScript || '',
      items: Array.isArray(parsed.items) ? parsed.items : [],
      rawResponseId: responseJson.id || '',
    };
  } catch (error) {
    const fallbackItems = clusters.map(fallbackItem);
    return {
      mode: 'fallback',
      title: `全球热点简报 · ${date}`,
      overview: `OpenAI 调用失败，已自动切换为本地摘要。当前重点关注 ${clusters
        .slice(0, 3)
        .map((cluster) => cluster.keywords.slice(0, 2).join('/'))
        .join('、')}。`,
      videoScript: fallbackItems
        .slice(0, 5)
        .map((item, index) => `${index + 1}，${item.headline}，${item.summary}`)
        .join('\n'),
      items: fallbackItems,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function answerBriefingQuestion({ briefing, question }) {
  if (!briefing?.items?.length) {
    return {
      mode: 'empty',
      answer: '今天还没有可用简报，先生成或导入一份日报再提问。',
    };
  }

  if (!env.OPENAI_API_KEY) {
    const match =
      briefing.items.find((item) => question.includes(item.region) || item.tags?.some((tag) => question.includes(tag))) ||
      briefing.items[0];

    return {
      mode: 'fallback',
      answer: `结合今天简报，最相关的是「${match.headline}」。简要看：${match.summary} 重点在于 ${match.whyImportant}。如果你接入 OPENAI_API_KEY，就能得到更自然的追问回答。`,
    };
  }

  const instructions =
    '你是简报产品里的 AI 新闻助理。只能基于用户提供的当日简报回答，使用简体中文，直接给结论，再补充2-4条要点。';

  const input = `
今天的简报 JSON：
${JSON.stringify(
    {
      date: briefing.date,
      title: briefing.title,
      overview: briefing.overview,
      items: briefing.items.map((item) => ({
        headline: item.headline,
        summary: item.summary,
        whyImportant: item.whyImportant,
        tags: item.tags,
        region: item.region,
        sources: item.sources?.map((source) => ({
          sourceName: source.sourceName,
          title: source.title,
          link: source.link,
        })),
      })),
    },
    null,
    2,
  )}

用户问题：${question}

回答要求：
1. 只能基于上述简报内容，不要编造未提供的信息；
2. 如信息不足，要明确说“基于当前简报，暂时无法确认”；
3. 适合手机端展示，语言简洁。
`.trim();

  try {
    const responseJson = await callResponsesApi({
      instructions,
      input,
      maxOutputTokens: 1000,
    });

    const answer = extractOutputText(responseJson) || '基于当前简报，暂时无法确认更多信息。';

    return {
      mode: 'openai',
      answer,
      rawResponseId: responseJson.id || '',
    };
  } catch (error) {
    const match =
      briefing.items.find((item) => question.includes(item.region) || item.tags?.some((tag) => question.includes(tag))) ||
      briefing.items[0];

    return {
      mode: 'fallback',
      answer: `OpenAI 当前不可用，先给你本地应答：最相关的是「${match.headline}」。${match.summary} 这条之所以重要，在于 ${match.whyImportant}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
