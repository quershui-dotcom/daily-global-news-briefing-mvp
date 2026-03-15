const state = {
  briefing: null,
};

const statusPanel = document.querySelector('#statusPanel');
const briefingEditor = document.querySelector('#briefingEditor');
const deviceResult = document.querySelector('#deviceResult');
const publishResult = document.querySelector('#publishResult');
const telegramPreview = document.querySelector('#telegramPreview');

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'content-type': 'application/json',
    },
    ...options,
  });

  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.detail || payload.error || '请求失败');
  }
  return payload;
}

function escapeHtml(value = '') {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tagInputValue(tags) {
  return Array.isArray(tags) ? tags.join(', ') : '';
}

function renderStatus(data) {
  statusPanel.innerHTML = `
    <div class="status-item"><span>今天日期</span><strong>${data.today}</strong></div>
    <div class="status-item"><span>最新简报</span><strong>${data.latestBriefingDate || '暂无'}</strong></div>
    <div class="status-item"><span>OpenAI</span><strong>${data.config.hasOpenAIKey ? `已配置 (${data.config.openaiModel})` : '未配置'}</strong></div>
    <div class="status-item"><span>Telegram</span><strong>${data.config.hasTelegramConfig ? 'Bot + Chat 已配置' : '未完全配置'}</strong></div>
    <div class="status-item"><span>华为 Push Kit</span><strong>${data.config.hasHuaweiConfig ? '已配置' : '未配置'}</strong></div>
    <div class="status-item"><span>华为设备数</span><strong>${data.deviceCount}</strong></div>
  `;
}

function renderChannelResults(briefing) {
  const channels = briefing?.publishChannels || {};
  publishResult.textContent = Object.keys(channels).length
    ? JSON.stringify(channels, null, 2)
    : '暂无发布记录';
}

function renderBriefingEditor(briefing) {
  if (!briefing) {
    briefingEditor.innerHTML = '<div class="editor-empty">还没有简报，先点击上方按钮。</div>';
    renderChannelResults(null);
    return;
  }

  renderChannelResults(briefing);

  const notice = briefing.demoMode
    ? '<div class="notice">当前为演示数据，仅用于展示完整发布链路，不代表真实新闻。</div>'
    : '';

  briefingEditor.innerHTML = `
    ${notice}
    <div class="editor-meta">
      <label>简报标题<input id="briefingTitle" value="${escapeHtml(briefing.title)}" /></label>
      <label>状态<input id="briefingStatus" value="${escapeHtml(briefing.status)}" /></label>
      <label>日期<input id="briefingDate" value="${escapeHtml(briefing.date)}" disabled /></label>
    </div>
    <div class="stack" style="margin-top:16px;">
      <label>概览<textarea id="briefingOverview" rows="3">${escapeHtml(briefing.overview)}</textarea></label>
      <label>60 秒口播稿<textarea id="briefingVideoScript" rows="5">${escapeHtml(briefing.videoScript)}</textarea></label>
    </div>
    <div class="story-grid">
      ${briefing.items
        .map(
          (item, index) => `
            <article class="story-card" data-item-index="${index}">
              <div class="story-card-header">
                <h3>#${index + 1} <span class="muted">${escapeHtml(item.region || '全球')}</span></h3>
                <div class="pill-row">
                  ${item.tags?.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join('') || ''}
                </div>
              </div>
              <div class="checkbox-row">
                <label><input type="checkbox" data-field="included" ${item.included ? 'checked' : ''} /> 收录</label>
                <label><input type="checkbox" data-field="approved" ${item.approved ? 'checked' : ''} /> 已审核</label>
              </div>
              <div class="stack" style="margin-top:12px;">
                <label>标题<input data-field="headline" value="${escapeHtml(item.headline)}" /></label>
                <label>摘要<textarea rows="3" data-field="summary">${escapeHtml(item.summary)}</textarea></label>
                <label>为什么重要<textarea rows="2" data-field="whyImportant">${escapeHtml(item.whyImportant)}</textarea></label>
                <label>角度<input data-field="angle" value="${escapeHtml(item.angle || '')}" /></label>
                <label>标签<input data-field="tags" value="${escapeHtml(tagInputValue(item.tags))}" /></label>
              </div>
              <div class="source-list" style="margin-top:12px;">
                ${
                  item.sources?.map(
                    (source) =>
                      `<a href="${source.link}" target="_blank" rel="noreferrer">${escapeHtml(source.sourceName)}：${escapeHtml(source.title)}</a>`,
                  ).join('') || '<span class="muted">暂无来源</span>'
                }
              </div>
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}

function collectBriefingPayload() {
  const title = document.querySelector('#briefingTitle')?.value ?? '';
  const overview = document.querySelector('#briefingOverview')?.value ?? '';
  const videoScript = document.querySelector('#briefingVideoScript')?.value ?? '';
  const status = document.querySelector('#briefingStatus')?.value ?? 'draft';

  const items = [...document.querySelectorAll('.story-card')].map((card, index) => {
    const original = state.briefing.items[index];
    const getField = (field) => card.querySelector(`[data-field="${field}"]`);
    return {
      ...original,
      included: Boolean(getField('included')?.checked),
      approved: Boolean(getField('approved')?.checked),
      headline: getField('headline')?.value ?? original.headline,
      summary: getField('summary')?.value ?? original.summary,
      whyImportant: getField('whyImportant')?.value ?? original.whyImportant,
      angle: getField('angle')?.value ?? original.angle,
      tags: (getField('tags')?.value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };
  });

  return {
    title,
    overview,
    videoScript,
    status,
    items,
  };
}

async function loadStatusAndBriefing() {
  const [statusData, briefingData] = await Promise.all([api('/api/status'), api('/api/briefings/latest')]);
  renderStatus(statusData);
  state.briefing = briefingData.briefing;
  renderBriefingEditor(state.briefing);
}

async function generateBriefing(demo = false) {
  const endpoint = demo ? '/api/demo/seed' : '/api/briefings/generate';
  const payload = await api(endpoint, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  state.briefing = payload.briefing;
  renderBriefingEditor(state.briefing);
  await loadStatusAndBriefing();
}

async function saveBriefing() {
  if (!state.briefing) {
    return null;
  }

  const payload = collectBriefingPayload();
  const saved = await api(`/api/briefings/${state.briefing.date}/save`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  state.briefing = saved.briefing;
  renderBriefingEditor(state.briefing);
  return saved.briefing;
}

async function previewTelegram() {
  if (!state.briefing) {
    return;
  }
  const payload = await api(`/api/briefings/${state.briefing.date}/telegram-preview`);
  telegramPreview.textContent = payload.preview.text || '暂无内容';
}

async function publishTelegram() {
  if (!state.briefing) {
    return;
  }
  const payload = await api(`/api/briefings/${state.briefing.date}/publish/telegram`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  publishResult.textContent = JSON.stringify(payload.result, null, 2);
  await loadStatusAndBriefing();
}

async function publishHuawei() {
  if (!state.briefing) {
    return;
  }
  const payload = await api(`/api/briefings/${state.briefing.date}/publish/huawei`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  publishResult.textContent = JSON.stringify(payload.result, null, 2);
  await loadStatusAndBriefing();
}

document.querySelector('#generateBtn')?.addEventListener('click', async () => {
  try {
    await generateBriefing(false);
  } catch (error) {
    alert(error.message);
  }
});

document.querySelector('#demoBtn')?.addEventListener('click', async () => {
  try {
    await generateBriefing(true);
  } catch (error) {
    alert(error.message);
  }
});

document.querySelector('#refreshBtn')?.addEventListener('click', async () => {
  try {
    await loadStatusAndBriefing();
  } catch (error) {
    alert(error.message);
  }
});

document.querySelector('#saveBtn')?.addEventListener('click', async () => {
  try {
    await saveBriefing();
  } catch (error) {
    alert(error.message);
  }
});

document.querySelector('#previewTelegramBtn')?.addEventListener('click', async () => {
  try {
    await saveBriefing();
    await previewTelegram();
  } catch (error) {
    alert(error.message);
  }
});

document.querySelector('#publishTelegramBtn')?.addEventListener('click', async () => {
  try {
    await saveBriefing();
    await previewTelegram();
    await publishTelegram();
  } catch (error) {
    alert(error.message);
  }
});

document.querySelector('#publishHuaweiBtn')?.addEventListener('click', async () => {
  try {
    await saveBriefing();
    await publishHuawei();
  } catch (error) {
    alert(error.message);
  }
});

document.querySelector('#deviceForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  try {
    const result = await api('/api/devices/register', {
      method: 'POST',
      body: JSON.stringify({
        nickname: formData.get('nickname'),
        token: formData.get('token'),
      }),
    });
    deviceResult.textContent = JSON.stringify(result.device, null, 2);
    event.currentTarget.reset();
    await loadStatusAndBriefing();
  } catch (error) {
    alert(error.message);
  }
});

loadStatusAndBriefing().catch((error) => {
  statusPanel.textContent = error.message;
});
