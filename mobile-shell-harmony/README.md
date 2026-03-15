# HarmonyOS / 华为手机壳接入说明

这个目录放的是 **接入约定**，不是完整可编译工程。原因是 Push Kit 的最终落地依赖你的：

- AG Connect 项目
- 应用包名 / 签名
- Push Kit 开通状态
- 真机调试环境

## 最小接入链路

1. 手机壳 App 集成 HUAWEI Push Kit，获取设备 `token`
2. App 首次启动时把 `token` POST 到中台：

```http
POST /api/devices/register
Content-Type: application/json

{
  "nickname": "My Huawei Phone",
  "token": "DEVICE_PUSH_TOKEN",
  "platform": "huawei"
}
```

3. 中台审核后，点击“发布到华为 Push Kit”
4. 中台会：
   - 先请求华为 OAuth token  
     `https://oauth-login.cloud.huawei.com/oauth2/v3/token`
   - 再调用消息发送接口  
     `https://push-api.cloud.huawei.com/v1/{appId}/messages:send`
5. 推送体中始终包含：
   - `date`
   - `deepLinkUrl`
   - `title`
   - `overview`

## Deep Link 约定

当前 MVP 默认把深链指向：

```text
https://你的域名/briefings/YYYY-MM-DD
```

你有两种接法：

### 方案 A：直接打开浏览器

- 点击推送后，直接打开上面的 HTTPS 链接
- 适合最快速的 MVP 和视频演示

### 方案 B：壳 App 拦截后打开 WebView / 原生页

- App 读取 push data 中的 `deepLinkUrl`
- 进入壳 App 内部的 `BriefingPage`
- `BriefingPage` 再加载远端 H5 简报页或映射到原生卡片页

## 推荐的 App 侧动作

- 冷启动时上报 token
- 点击通知时读取 `date` 和 `deepLinkUrl`
- 如果已有登录态，直接进入 `/briefings/:date`
- 页面内保留“追问 AI”入口，继续调用中台 `/api/ask`

## 官方文档

- Push Kit Codelab: [https://developer.huawei.com/consumer/en/codelab/HMSPushKit/](https://developer.huawei.com/consumer/en/codelab/HMSPushKit/)
- Push Kit 产品页: [https://developer.huawei.com/consumer/cn/hms/huawei-pushkit/](https://developer.huawei.com/consumer/cn/hms/huawei-pushkit/)
- App Linking Codelab: [https://developer.huawei.com/consumer/en/codelab/AppLinking-HarmonyOS/](https://developer.huawei.com/consumer/en/codelab/AppLinking-HarmonyOS/)
