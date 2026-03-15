# 每日全球热点新闻简报中台 MVP

一个可本地运行的 MVP，覆盖：

- 新闻采集（RSS）
- 去重聚类
- OpenAI Responses API 摘要
- 后台审核与发布
- 华为 Push Kit 推送请求
- Deep Link 打开手机端简报页
- 基于当日简报的 AI 追问

> 说明：当前工程刻意做成 **零依赖 Node 版本**，避免你在第一版就被安装依赖、数据库和前端脚手架卡住。后续你可以很容易迁移到 Next.js / NestJS / PostgreSQL。
>
> 另外，这版已经带了 **自动降级策略**：如果 OpenAI 或外网不可用，会回退到本地规则摘要；如果华为凭据或设备 token 不齐，会返回 Push 请求预览，保证你录演示时不至于整条链路直接中断。

## 目录结构

```text
daily-global-news-briefing-mvp/
├─ mobile-shell-harmony/      # 华为手机壳接入说明
├─ public/                    # 管理后台与手机端页面脚本/样式
├─ scripts/                   # 每日任务脚本、演示数据脚本
├─ src/
│  ├─ demo/                   # 演示简报
│  ├─ news/                   # 采集、RSS 解析、聚类
│  ├─ services/               # OpenAI / Push / 业务流程
│  ├─ utils/                  # 文本/HTTP 工具
│  └─ views.mjs               # HTML 页面
├─ storage/                   # 本地 JSON 存储
└─ server.mjs                 # 入口
```

## 运行

1. 复制环境变量：

```powershell
Copy-Item .env.example .env
```

2. 可选：填入 OpenAI 与华为凭据  

- `OPENAI_API_KEY`
- `OPENAI_MODEL`，默认 `gpt-4.1-mini`
- `HUAWEI_APP_ID`
- `HUAWEI_CLIENT_ID`
- `HUAWEI_CLIENT_SECRET`

3. 启动：

```powershell
npm run dev
```

4. 打开后台：

```text
http://localhost:3000
```

## 推荐演示路径

### 无外网 / 无 API Key

```powershell
npm run seed:demo
npm run dev
```

然后：

1. 打开后台
2. 查看“演示数据”
3. 编辑标题与摘要
4. 点击“发布到华为 Push Kit”
5. 查看生成的 Push 请求预览
6. 打开手机端页：`/briefings/当天日期`
7. 现场演示“追问 AI”

### 有外网 / 有 OpenAI Key

1. 配置 `.env`
2. 在后台点击“生成今日简报”
3. 系统会拉取 RSS、聚类并调用 OpenAI Responses API
4. 人工审核后再发布

## API 一览

### 生成简报

```http
POST /api/briefings/generate
```

### 导入演示数据

```http
POST /api/demo/seed
```

### 保存审核内容

```http
POST /api/briefings/:date/save
```

### 发布到华为 Push Kit

```http
POST /api/briefings/:date/publish
```

### 设备注册

```http
POST /api/devices/register
```

### AI 追问

```http
POST /api/ask
```

请求体示例：

```json
{
  "date": "2026-03-15",
  "question": "这条对 A 股科技板块有什么影响？"
}
```

## 每日自动运行

只生成：

```powershell
npm run daily
```

生成后直接推送：

```powershell
node .\scripts\run-daily.mjs 2026-03-15 --publish
```

## 当前 MVP 的边界

这版是 **能演示、能跑通链路** 的第一版，不是最终生产版。

### 已实现

- 本地 JSON 存储
- 新闻抓取与简易聚类
- OpenAI Responses API 摘要
- 审核编辑页面
- 华为 Push Kit 服务端发送逻辑
- 手机端 H5 简报页
- AI 追问

### 下一步建议

- 改 PostgreSQL + Redis
- 改成队列任务
- 增加来源白名单与黑名单
- 增加风险词审核
- 增加多语言简报
- 增加视频口播稿模板
- 补 HarmonyOS / Android 壳 App 真机工程

## 参考文档

OpenAI：

- Responses API 参考: [https://platform.openai.com/docs/api-reference/responses/create](https://platform.openai.com/docs/api-reference/responses/create)
- Background mode 指南: [https://platform.openai.com/docs/guides/background](https://platform.openai.com/docs/guides/background)
- Webhooks 指南: [https://platform.openai.com/docs/guides/webhooks](https://platform.openai.com/docs/guides/webhooks)
- Models: [https://platform.openai.com/docs/models](https://platform.openai.com/docs/models)

华为：

- Push Kit Codelab: [https://developer.huawei.com/consumer/en/codelab/HMSPushKit/](https://developer.huawei.com/consumer/en/codelab/HMSPushKit/)
- Push Kit 产品页: [https://developer.huawei.com/consumer/cn/hms/huawei-pushkit/](https://developer.huawei.com/consumer/cn/hms/huawei-pushkit/)
- App Linking Codelab: [https://developer.huawei.com/consumer/en/codelab/AppLinking-HarmonyOS/](https://developer.huawei.com/consumer/en/codelab/AppLinking-HarmonyOS/)

## 与官方文档的对应关系

- OpenAI 这部分使用的是 **Responses API** 单接口模式；如果后续要做更稳的长任务，建议切到官方文档里的 **background mode + webhook**。
- 华为推送这部分已按官方 codelab 中的 **OAuth token + messages:send** 链路建好服务端；最终通知点击动作要结合你的壳 App 包名、签名和 App Linking 配置做微调。
