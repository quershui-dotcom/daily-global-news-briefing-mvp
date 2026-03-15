const root = document.querySelector('#mobileApp');

function escapeHtml(value = '') {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

function renderBriefing(briefing) {
  if (!briefing) {
    root.innerHTML = '<div class="mobile-hero">未找到这一天的简报。</div>';
    return;
  }

  const notice = briefing.demoMode
    ? '<div class="notice">当前页面展示的是演示数据，适合录制产品演示视频。</div>'
    : '';

  root.innerHTML = `
    <section class="mobile-hero hero">
      <div>
        <span class="badge">Huawei Deep Link</span>
        <h1>${escapeHtml(briefing.title)}</h1>
        <p>${escapeHtml(briefing.overview || '暂无概览')}</p>
        ${notice}
        <div class="mobile-meta">
          <span class="chip">${escapeHtml(briefing.date)}</span>
          <span class="chip">${escapeHtml(briefing.status)}</span>
          <span class="chip">${briefing.items.length} 条要闻</span>
        </div>
      </div>
      <div class="hero-actions">
        <button id="jumpScript" class="btn btn-primary">60 秒速览</button>
        <button id="jumpAsk" class="btn">追问 AI</button>
      </div>
    </section>

    <section id="videoScriptCard" class="mobile-card">
      <h3>60 秒视频口播稿</h3>
      <div class="qa-answer">${escapeHtml(briefing.videoScript || '暂无口播稿')}</div>
    </section>

    <section class="chip-row" style="margin-top:16px;">
      <button class="chip filter-chip" data-filter="all">全部</button>
      ${[...new Set(briefing.items.map((item) => item.region))]
        .map((region) => `<button class="chip filter-chip" data-filter="${escapeHtml(region)}">${escapeHtml(region)}</button>`)
        .join('')}
    </section>

    <section id="storyList">
      ${briefing.items
        .filter((item) => item.included !== false)
        .map(
          (item) => `
            <article class="mobile-card" data-region="${escapeHtml(item.region)}">
              <div class="pill-row">${item.tags?.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join('') || ''}</div>
              <h3>${escapeHtml(item.headline)}</h3>
              <p>${escapeHtml(item.summary)}</p>
              <div class="qa-answer">${escapeHtml(item.whyImportant)}</div>
              <div class="source-list" style="margin-top:12px;">
                ${
                  item.sources?.map(
                    (source) =>
                      `<a href="${source.link}" target="_blank" rel="noreferrer">${escapeHtml(source.sourceName)}：${escapeHtml(source.title)}</a>`,
                  ).join('') || ''
                }
              </div>
            </article>
          `,
        )
        .join('')}
    </section>

    <section id="qaSection" class="qa-box">
      <h3>追问 AI</h3>
      <p class="muted">示例：这条对 A 股有什么影响？ / 用更口语化的方式讲 / 帮我写 30 秒视频解说。</p>
      <form id="qaForm" class="stack">
        <textarea name="question" rows="3" placeholder="请输入你想追问的问题"></textarea>
        <button type="submit" class="btn btn-primary">提问</button>
      </form>
      <div id="qaAnswer" class="qa-answer" style="display:none;"></div>
    </section>
  `;

  document.querySelector('#jumpScript')?.addEventListener('click', () => {
    document.querySelector('#videoScriptCard')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelector('#jumpAsk')?.addEventListener('click', () => {
    document.querySelector('#qaSection')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('.filter-chip').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      document.querySelectorAll('#storyList .mobile-card').forEach((card) => {
        card.style.display = filter === 'all' || card.dataset.region === filter ? '' : 'none';
      });
    });
  });

  document.querySelector('#qaForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const question = String(formData.get('question') || '').trim();
    if (!question) return;
    const answerBox = document.querySelector('#qaAnswer');
    answerBox.style.display = 'block';
    answerBox.textContent = 'AI 思考中…';

    try {
      const result = await api('/api/ask', {
        method: 'POST',
        body: JSON.stringify({
          date: briefing.date,
          question,
        }),
      });
      answerBox.textContent = result.answer;
    } catch (error) {
      answerBox.textContent = error.message;
    }
  });
}

async function init() {
  try {
    const date = root.dataset.briefingDate;
    const payload = await api(`/api/briefings?date=${encodeURIComponent(date)}`);
    renderBriefing(payload.briefing);
  } catch (error) {
    root.innerHTML = `<div class="mobile-hero">${error.message}</div>`;
  }
}

init();
