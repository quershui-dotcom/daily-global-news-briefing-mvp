import { escapeHtml } from './utils/text.mjs';

function layout({ title, body, scriptPath }) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    ${body}
    ${scriptPath ? `<script type="module" src="${scriptPath}"></script>` : ''}
  </body>
</html>`;
}

export function renderAdminPage() {
  return layout({
    title: '每日全球热点新闻简报中台',
    scriptPath: '/admin.js',
    body: `
      <main class="shell shell-admin">
        <section class="hero">
          <div>
            <span class="badge">MVP 中台</span>
            <h1>每日全球热点新闻简报中台</h1>
            <p>采集 → 去重聚类 → OpenAI 摘要 → 审核发布 → 华为 Push Kit 推送 → 手机端追问</p>
          </div>
          <div class="hero-actions">
            <button id="generateBtn" class="btn btn-primary">生成今日简报</button>
            <button id="demoBtn" class="btn">载入演示数据</button>
            <button id="refreshBtn" class="btn btn-ghost">刷新</button>
          </div>
        </section>

        <section class="grid">
          <article class="panel">
            <h2>系统状态</h2>
            <div id="statusPanel" class="status-list">加载中…</div>
          </article>
          <article class="panel">
            <h2>设备接入</h2>
            <form id="deviceForm" class="stack">
              <label>设备昵称<input name="nickname" placeholder="典的华为 Mate" /></label>
              <label>Push Token<textarea name="token" rows="3" placeholder="从华为手机壳 App 上报的 token"></textarea></label>
              <button class="btn" type="submit">登记设备</button>
            </form>
            <pre id="deviceResult" class="code-box"></pre>
          </article>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>简报编辑与审核</h2>
            <div class="inline-actions">
              <button id="saveBtn" class="btn">保存修改</button>
              <button id="publishBtn" class="btn btn-primary">发布到华为 Push Kit</button>
            </div>
          </div>
          <div id="briefingEditor" class="editor-empty">还没有简报，先点击“生成今日简报”或“载入演示数据”。</div>
        </section>
      </main>
    `,
  });
}

export function renderBriefingPage(date) {
  return layout({
    title: `手机端简报 · ${date}`,
    scriptPath: '/mobile.js',
    body: `
      <main class="shell shell-mobile">
        <div id="mobileApp" data-briefing-date="${escapeHtml(date)}">加载中…</div>
      </main>
    `,
  });
}
