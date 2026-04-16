# æ¯æ—¥å…¨çƒçƒ­ç‚¹æ–°é—»ç®€æŠ¥ä¸­å° MVP

ä¸€ä¸ªå¯æœ¬åœ°è¿è¡Œçš„ MVPï¼Œè¦†ç›–ï¼š

- æ–°é—»é‡‡é›†ï¼ˆRSSï¼‰
- åŽ»é‡èšç±»
- OpenAI Responses API æ‘˜è¦
- åŽå°å®¡æ ¸ä¸Žå‘å¸ƒ
- åŽä¸º Push Kit æŽ¨é€è¯·æ±‚
- Deep Link æ‰“å¼€æ‰‹æœºç«¯ç®€æŠ¥é¡µ
- åŸºäºŽå½“æ—¥ç®€æŠ¥çš„ AI è¿½é—®

> è¯´æ˜Žï¼šå½“å‰å·¥ç¨‹åˆ»æ„åšæˆ **é›¶ä¾èµ– Node ç‰ˆæœ¬**ï¼Œé¿å…ä½ åœ¨ç¬¬ä¸€ç‰ˆå°±è¢«å®‰è£…ä¾èµ–ã€æ•°æ®åº“å’Œå‰ç«¯è„šæ‰‹æž¶å¡ä½ã€‚åŽç»­ä½ å¯ä»¥å¾ˆå®¹æ˜“è¿ç§»åˆ° Next.js / NestJS / PostgreSQLã€‚
>
> å¦å¤–ï¼Œè¿™ç‰ˆå·²ç»å¸¦äº† **è‡ªåŠ¨é™çº§ç­–ç•¥**ï¼šå¦‚æžœ OpenAI æˆ–å¤–ç½‘ä¸å¯ç”¨ï¼Œä¼šå›žé€€åˆ°æœ¬åœ°è§„åˆ™æ‘˜è¦ï¼›å¦‚æžœåŽä¸ºå‡­æ®æˆ–è®¾å¤‡ token ä¸é½ï¼Œä¼šè¿”å›ž Push è¯·æ±‚é¢„è§ˆï¼Œä¿è¯ä½ å½•æ¼”ç¤ºæ—¶ä¸è‡³äºŽæ•´æ¡é“¾è·¯ç›´æŽ¥ä¸­æ–­ã€‚

## ç›®å½•ç»“æž„

```text
daily-global-news-briefing-mvp/
â”œâ”€ mobile-shell-harmony/      # åŽä¸ºæ‰‹æœºå£³æŽ¥å…¥è¯´æ˜Ž
â”œâ”€ public/                    # ç®¡ç†åŽå°ä¸Žæ‰‹æœºç«¯é¡µé¢è„šæœ¬/æ ·å¼
â”œâ”€ scripts/                   # æ¯æ—¥ä»»åŠ¡è„šæœ¬ã€æ¼”ç¤ºæ•°æ®è„šæœ¬
â”œâ”€ src/
â”‚  â”œâ”€ demo/                   # æ¼”ç¤ºç®€æŠ¥
â”‚  â”œâ”€ news/                   # é‡‡é›†ã€RSS è§£æžã€èšç±»
â”‚  â”œâ”€ services/               # OpenAI / Push / ä¸šåŠ¡æµç¨‹
â”‚  â”œâ”€ utils/                  # æ–‡æœ¬/HTTP å·¥å…·
â”‚  â””â”€ views.mjs               # HTML é¡µé¢
â”œâ”€ storage/                   # æœ¬åœ° JSON å­˜å‚¨
â””â”€ server.mjs                 # å…¥å£
```

## è¿è¡Œ

1. å¤åˆ¶çŽ¯å¢ƒå˜é‡ï¼š

```powershell
Copy-Item .env.example .env
```

2. å¯é€‰ï¼šå¡«å…¥ OpenAI ä¸ŽåŽä¸ºå‡­æ®  

- `OPENAI_API_KEY`
- `OPENAI_MODEL`ï¼Œé»˜è®¤ `gpt-4.1-mini`
- `HUAWEI_APP_ID`
- `HUAWEI_CLIENT_ID`
- `HUAWEI_CLIENT_SECRET`

3. å¯åŠ¨ï¼š

```powershell
npm run dev
```

4. æ‰“å¼€åŽå°ï¼š

```text
http://localhost:3000
```

## æŽ¨èæ¼”ç¤ºè·¯å¾„

### æ— å¤–ç½‘ / æ—  API Key

```powershell
npm run seed:demo
npm run dev
```

ç„¶åŽï¼š

1. æ‰“å¼€åŽå°
2. æŸ¥çœ‹â€œæ¼”ç¤ºæ•°æ®â€
3. ç¼–è¾‘æ ‡é¢˜ä¸Žæ‘˜è¦
4. ç‚¹å‡»â€œå‘å¸ƒåˆ°åŽä¸º Push Kitâ€
5. æŸ¥çœ‹ç”Ÿæˆçš„ Push è¯·æ±‚é¢„è§ˆ
6. æ‰“å¼€æ‰‹æœºç«¯é¡µï¼š`/briefings/å½“å¤©æ—¥æœŸ`
7. çŽ°åœºæ¼”ç¤ºâ€œè¿½é—® AIâ€

### æœ‰å¤–ç½‘ / æœ‰ OpenAI Key

1. é…ç½® `.env`
2. åœ¨åŽå°ç‚¹å‡»â€œç”Ÿæˆä»Šæ—¥ç®€æŠ¥â€
3. ç³»ç»Ÿä¼šæ‹‰å– RSSã€èšç±»å¹¶è°ƒç”¨ OpenAI Responses API
4. äººå·¥å®¡æ ¸åŽå†å‘å¸ƒ

## API ä¸€è§ˆ

### ç”Ÿæˆç®€æŠ¥

```http
POST /api/briefings/generate
```

### å¯¼å…¥æ¼”ç¤ºæ•°æ®

```http
POST /api/demo/seed
```

### ä¿å­˜å®¡æ ¸å†…å®¹

```http
POST /api/briefings/:date/save
```

### å‘å¸ƒåˆ°åŽä¸º Push Kit

```http
POST /api/briefings/:date/publish
```

### è®¾å¤‡æ³¨å†Œ

```http
POST /api/devices/register
```

### AI è¿½é—®

```http
POST /api/ask
```

è¯·æ±‚ä½“ç¤ºä¾‹ï¼š

```json
{
  "date": "2026-03-15",
  "question": "è¿™æ¡å¯¹ A è‚¡ç§‘æŠ€æ¿å—æœ‰ä»€ä¹ˆå½±å“ï¼Ÿ"
}
```

## æ¯æ—¥è‡ªåŠ¨è¿è¡Œ

åªç”Ÿæˆï¼š

```powershell
npm run daily
```

ç”ŸæˆåŽç›´æŽ¥æŽ¨é€ï¼š

```powershell
node .\scripts\run-daily.mjs 2026-03-15 --publish
```

## å½“å‰ MVP çš„è¾¹ç•Œ

è¿™ç‰ˆæ˜¯ **èƒ½æ¼”ç¤ºã€èƒ½è·‘é€šé“¾è·¯** çš„ç¬¬ä¸€ç‰ˆï¼Œä¸æ˜¯æœ€ç»ˆç”Ÿäº§ç‰ˆã€‚

### å·²å®žçŽ°

- æœ¬åœ° JSON å­˜å‚¨
- æ–°é—»æŠ“å–ä¸Žç®€æ˜“èšç±»
- OpenAI Responses API æ‘˜è¦
- å®¡æ ¸ç¼–è¾‘é¡µé¢
- åŽä¸º Push Kit æœåŠ¡ç«¯å‘é€é€»è¾‘
- æ‰‹æœºç«¯ H5 ç®€æŠ¥é¡µ
- AI è¿½é—®

### ä¸‹ä¸€æ­¥å»ºè®®

- æ”¹ PostgreSQL + Redis
- æ”¹æˆé˜Ÿåˆ—ä»»åŠ¡
- å¢žåŠ æ¥æºç™½åå•ä¸Žé»‘åå•
- å¢žåŠ é£Žé™©è¯å®¡æ ¸
- å¢žåŠ å¤šè¯­è¨€ç®€æŠ¥
- å¢žåŠ è§†é¢‘å£æ’­ç¨¿æ¨¡æ¿
- è¡¥ HarmonyOS / Android å£³ App çœŸæœºå·¥ç¨‹

## å‚è€ƒæ–‡æ¡£

OpenAIï¼š

- Responses API å‚è€ƒ: [https://platform.openai.com/docs/api-reference/responses/create](https://platform.openai.com/docs/api-reference/responses/create)
- Background mode æŒ‡å—: [https://platform.openai.com/docs/guides/background](https://platform.openai.com/docs/guides/background)
- Webhooks æŒ‡å—: [https://platform.openai.com/docs/guides/webhooks](https://platform.openai.com/docs/guides/webhooks)
- Models: [https://platform.openai.com/docs/models](https://platform.openai.com/docs/models)

åŽä¸ºï¼š

- Push Kit Codelab: [https://developer.huawei.com/consumer/en/codelab/HMSPushKit/](https://developer.huawei.com/consumer/en/codelab/HMSPushKit/)
- Push Kit äº§å“é¡µ: [https://developer.huawei.com/consumer/cn/hms/huawei-pushkit/](https://developer.huawei.com/consumer/cn/hms/huawei-pushkit/)
- App Linking Codelab: [https://developer.huawei.com/consumer/en/codelab/AppLinking-HarmonyOS/](https://developer.huawei.com/consumer/en/codelab/AppLinking-HarmonyOS/)

## ä¸Žå®˜æ–¹æ–‡æ¡£çš„å¯¹åº”å…³ç³»

- OpenAI è¿™éƒ¨åˆ†ä½¿ç”¨çš„æ˜¯ **Responses API** å•æŽ¥å£æ¨¡å¼ï¼›å¦‚æžœåŽç»­è¦åšæ›´ç¨³çš„é•¿ä»»åŠ¡ï¼Œå»ºè®®åˆ‡åˆ°å®˜æ–¹æ–‡æ¡£é‡Œçš„ **background mode + webhook**ã€‚
- åŽä¸ºæŽ¨é€è¿™éƒ¨åˆ†å·²æŒ‰å®˜æ–¹ codelab ä¸­çš„ **OAuth token + messages:send** é“¾è·¯å»ºå¥½æœåŠ¡ç«¯ï¼›æœ€ç»ˆé€šçŸ¥ç‚¹å‡»åŠ¨ä½œè¦ç»“åˆä½ çš„å£³ App åŒ…åã€ç­¾åå’Œ App Linking é…ç½®åšå¾®è°ƒã€‚

## Telegram 发布通道（新增）

这版中台已经内置 Telegram 发布能力，不再依赖额外脚本才能完成发送。

### 新增环境变量

在 `.env` 中增加：

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_API_BASE=https://api.telegram.org
TELEGRAM_PARSE_MODE=
TELEGRAM_DISABLE_WEB_PAGE_PREVIEW=true
TELEGRAM_DISABLE_NOTIFICATION=false
TELEGRAM_PROTECT_CONTENT=false
TELEGRAM_CHUNK_SIZE=4000
