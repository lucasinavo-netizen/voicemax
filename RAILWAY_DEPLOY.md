# Railway 部署指南

## 前置準備

1. **GitHub 帳號**：確保程式碼已推送到 GitHub
2. **Railway 帳號**：前往 [railway.app](https://railway.app) 註冊/登入
3. **環境變數值**：準備好所有需要的 API Key 和設定值

## 部署步驟

### 1. 在 Railway 建立新專案

1. 登入 Railway Dashboard
2. 點擊 **"New Project"**
3. 選擇 **"Deploy from GitHub repo"**
4. 選擇你的 `podcast-maker` repository
5. Railway 會自動偵測 `Dockerfile` 並開始建置

### 2. 設定資料庫

1. 在 Railway 專案中點擊 **"New"** → **"Database"** → **"MySQL"**
2. Railway 會自動建立 MySQL 資料庫
3. 複製資料庫連接字串（Connection URL）

### 3. 設定環境變數

在 Railway 專案的 **Variables** 標籤頁中，新增以下環境變數：

#### 🔴 核心環境變數（必要）

```bash
# 資料庫連接（從 Railway MySQL 服務複製）
DATABASE_URL=mysql://user:password@host:port/database

# JWT 認證密鑰（請使用強隨機字串，至少 32 字元）
# 產生方式：openssl rand -base64 32
JWT_SECRET=your-strong-random-secret-key-here

# Node 環境
NODE_ENV=production
```

#### 🔴 Google OAuth 設定（必要）

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.railway.app/api/oauth/callback
```

**如何取得 Google OAuth：**
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 **Google+ API**
4. 前往 **Credentials** → **Create Credentials** → **OAuth client ID**
5. 應用程式類型選擇 **Web application**
6. 授權的重新導向 URI 設定為：`https://your-domain.railway.app/api/oauth/callback`
7. 複製 **Client ID** 和 **Client Secret**

#### 🔴 AI 服務 API Keys（必要）

```bash
# AssemblyAI API - 語音轉文字
ASSEMBLYAI_API_KEY=your-assemblyai-api-key

# Google Gemini API - LLM 分析（生成摘要和腳本）
GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key
```

**如何取得：**
- **AssemblyAI**：前往 [AssemblyAI](https://www.assemblyai.com/) 註冊並取得 API Key（每月 5 小時免費）
- **Google Gemini**：前往 [Google AI Studio](https://aistudio.google.com/) 取得 API Key（免費額度充足）

#### 🔴 Cloudflare R2 Storage（必要）

```bash
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-cloudflare-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-cloudflare-secret-access-key
CLOUDFLARE_R2_BUCKET=your-bucket-name
CLOUDFLARE_R2_PUBLIC_URL=https://your-custom-domain.com
```

**如何設定 Cloudflare R2：**
1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 選擇你的帳號
3. 前往 **R2** → **Create bucket**
4. 建立 bucket 後，前往 **Manage R2 API Tokens**
5. 建立 API Token，複製 **Account ID**、**Access Key ID** 和 **Secret Access Key**
6. （選用）設定自訂網域作為 `CLOUDFLARE_R2_PUBLIC_URL`

**免費額度**：10GB 儲存 + 每月 100 萬次讀取

#### 🟡 ListenHub TTS API（建議保留）

```bash
LISTENHUB_API_KEY=your-listenhub-api-key
```

**如何取得：**
- 前往 ListenHub 平台註冊並取得 API Key
- 如果沒有，可以暫時留空（但 TTS 功能會無法使用）

#### 🟢 前端環境變數（選用）

```bash
VITE_APP_TITLE=Podcast Maker
VITE_APP_LOGO=https://example.com/logo.png
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### 4. 執行資料庫遷移

部署後，資料庫遷移會在應用啟動時自動執行。如果需要手動執行：

**使用 Railway CLI：**
```bash
# 安裝 Railway CLI
npm i -g @railway/cli

# 登入
railway login

# 連結專案
railway link

# 執行遷移
railway run pnpm db:push
```

**或使用 Railway Dashboard：**
1. 在 Railway 專案中，點擊你的服務
2. 進入 **"Deployments"** 標籤
3. 點擊最新的部署
4. 進入 **"View Logs"** 查看遷移狀態

### 5. 設定網域

1. 在 Railway 專案中，點擊你的服務
2. 進入 **"Settings"** → **"Networking"**
3. 點擊 **"Generate Domain"** 或 **"Custom Domain"**
4. Railway 會自動設定 HTTPS
5. **重要**：更新 `GOOGLE_REDIRECT_URI` 為新的網域

### 6. 驗證部署

部署完成後，測試以下功能：

- ✅ 訪問首頁（應顯示登入頁面）
- ✅ 使用 Google OAuth 登入
- ✅ 提交 YouTube URL 測試下載
- ✅ 檢查日誌確認沒有錯誤

## 環境變數檢查清單

在 Railway Variables 中確認以下變數都已設定：

### 必要變數 ✓
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REDIRECT_URI`
- [ ] `ASSEMBLYAI_API_KEY`
- [ ] `GOOGLE_GEMINI_API_KEY`
- [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] `CLOUDFLARE_ACCESS_KEY_ID`
- [ ] `CLOUDFLARE_SECRET_ACCESS_KEY`
- [ ] `CLOUDFLARE_R2_BUCKET`

### 建議變數
- [ ] `LISTENHUB_API_KEY`

### 選用變數
- [ ] `VITE_APP_TITLE`
- [ ] `VITE_APP_LOGO`
- [ ] `CLOUDFLARE_R2_PUBLIC_URL`

## 故障排除

### 建置失敗

- 檢查 Railway 建置日誌
- 確認 `Dockerfile` 語法正確
- 確認 `package.json` 中的依賴都正確
- 確認 `pnpm-lock.yaml` 存在且是最新的

### 應用啟動失敗

- 檢查環境變數是否全部設定
- 檢查 `DATABASE_URL` 是否正確
- 查看 Railway 日誌找出錯誤訊息
- 確認所有必要的 API Key 都已設定

### 資料庫連接失敗

- 確認 `DATABASE_URL` 格式正確
- 確認資料庫服務正在運行
- 檢查資料庫是否允許外部連接
- 確認資料庫遷移已執行

### YouTube 下載失敗

- 確認 `yt-dlp` 已正確安裝（在 Dockerfile 中）
- 檢查網路連接
- 查看服務日誌確認錯誤訊息

### Storage 上傳失敗

- 確認 Cloudflare R2 配置正確
- 檢查 `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_ACCESS_KEY_ID`、`CLOUDFLARE_SECRET_ACCESS_KEY` 是否正確
- 確認 `CLOUDFLARE_R2_BUCKET` 已建立
- 檢查 R2 API Token 權限

## 監控與維護

### 查看日誌

在 Railway Dashboard 中：
1. 選擇你的服務
2. 進入 **"Deployments"** → 選擇最新部署
3. 點擊 **"View Logs"** 查看即時日誌

### 重新部署

- **自動部署**：每次推送到 GitHub 主分支會自動觸發部署
- **手動部署**：在 Railway Dashboard 中點擊 **"Redeploy"**

### 更新環境變數

1. 在 **Variables** 標籤頁修改
2. Railway 會自動重新部署

## 成本估算

Railway 免費方案包含：
- $5 免費額度/月
- 足夠運行一個小型應用
- 超出後按使用量計費

建議：
- 監控使用量避免超出預算
- 設定使用量警告
- 考慮升級到付費方案以獲得更多資源

## 支援

如有問題，請查看：
- Railway 官方文件：https://docs.railway.app
- 專案 GitHub Issues
- Railway Discord 社群
