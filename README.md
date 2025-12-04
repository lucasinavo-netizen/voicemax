# VoiceMax - 一站式 Podcast 製作工具

一個自動化的 Podcast 製作工具，能夠將 YouTube 影片自動轉換為文字內容，包括完整逐字稿、精華摘要和 Podcast 腳本。

## 功能特色

- 🎬 **YouTube 影片下載**：支援多種 YouTube 網址格式
- 🎤 **語音轉文字**：使用 AssemblyAI 進行高精度語音轉錄
- 🤖 **AI 內容分析**：使用 Google Gemini API 自動生成摘要和腳本
- 📝 **多種輸出格式**：
  - 完整逐字稿
  - 精華摘要（200-300 字）
  - Podcast 腳本（第三人稱敘事格式）
- 💾 **多種儲存方案**：支援 Cloudflare R2、Backblaze B2、AWS S3

## 技術棧

- **前端**：React 19 + TypeScript + Vite + Tailwind CSS
- **後端**：Node.js + Express + tRPC
- **資料庫**：MySQL (Drizzle ORM)
- **認證**：Google OAuth 2.0
- **部署**：Railway

## 快速開始

### 本地開發

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd voicemax
   ```

2. **安裝依賴**
   ```bash
   pnpm install
   ```

3. **設定環境變數**
   ```bash
   cp .env.example .env
   # 編輯 .env 文件，填入你的 API Keys
   ```

4. **啟動開發伺服器**
   ```bash
   pnpm dev
   ```

5. **執行資料庫遷移**
   ```bash
   pnpm db:push
   ```

### Railway 部署

#### 前置準備

1. **GitHub 帳號**：確保程式碼已推送到 GitHub
2. **Railway 帳號**：前往 [railway.app](https://railway.app) 註冊/登入
3. **環境變數值**：準備好所有需要的 API Key 和設定值

#### 部署步驟

1. **在 Railway 建立新專案**
   - 登入 Railway Dashboard
   - 點擊 **"New Project"**
   - 選擇 **"Deploy from GitHub repo"**
   - 選擇你的 repository
   - Railway 會自動偵測 `Dockerfile` 並開始建置

2. **設定資料庫**
   - 在 Railway 專案中點擊 **"New"** → **"Database"** → **"MySQL"**
   - Railway 會自動建立 MySQL 資料庫
   - 複製資料庫連接字串

3. **設定環境變數**
   - 在 Railway 專案的 **Variables** 標籤頁中，新增環境變數
   - 詳細環境變數清單請參考 [RAILWAY_ENV_SETUP.md](./RAILWAY_ENV_SETUP.md)

   **必要環境變數：**
   ```bash
   DATABASE_URL=mysql://user:password@host:port/database
   JWT_SECRET=your-strong-random-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=https://your-domain.railway.app/api/oauth/callback
   ASSEMBLYAI_API_KEY=your-assemblyai-api-key
   GOOGLE_GEMINI_API_KEY=your-google-gemini-api-key
   ```

   **Storage 服務（必須選擇一個）：**
   - Cloudflare R2（推薦，完全免費）
   - Backblaze B2（推薦，免費額度大）
   - AWS S3

4. **執行資料庫遷移**
   - Railway 會在應用啟動時自動執行資料庫遷移
   - 或使用 Railway CLI：
     ```bash
     railway run pnpm db:push
     ```

5. **設定網域**
   - 在 Railway 專案中，點擊你的服務
   - 進入 **"Settings"** → **"Networking"**
   - 點擊 **"Generate Domain"** 或 **"Custom Domain"**
   - Railway 會自動設定 HTTPS

#### 詳細部署文件

- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Railway 部署完整指南
- [RAILWAY_ENV_SETUP.md](./RAILWAY_ENV_SETUP.md) - 環境變數設定詳細說明

## 專案結構

```
voicemax/
├── client/              # 前端 React 應用
│   ├── src/
│   │   ├── components/  # React 組件
│   │   ├── pages/       # 頁面組件
│   │   └── ...
│   └── public/          # 靜態資源
├── server/              # 後端 Express 應用
│   ├── _core/           # 核心功能
│   ├── services/        # 業務邏輯服務
│   └── routers.ts       # tRPC 路由
├── shared/              # 共享類型定義
├── drizzle/             # 資料庫 schema 和遷移
├── Dockerfile           # Docker 建置配置
├── railway.json         # Railway 部署配置
└── package.json         # 專案依賴
```

## 開發指令

```bash
# 開發模式
pnpm dev

# 建置專案
pnpm build

# 生產模式啟動
pnpm start

# 類型檢查
pnpm check

# 執行測試
pnpm test

# 資料庫遷移
pnpm db:push
pnpm db:migrate
```

## 環境變數說明

詳細的環境變數說明請參考 [RAILWAY_ENV_SETUP.md](./RAILWAY_ENV_SETUP.md)

### 核心變數（必要）

- `DATABASE_URL` - MySQL 資料庫連接字串
- `JWT_SECRET` - JWT 認證密鑰
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GOOGLE_REDIRECT_URI` - Google OAuth 回調 URI
- `ASSEMBLYAI_API_KEY` - AssemblyAI API Key（語音轉文字）
- `GOOGLE_GEMINI_API_KEY` - Google Gemini API Key（LLM 分析）

### Storage 服務（必須選擇一個）

- **Cloudflare R2**：`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ACCESS_KEY_ID`, `CLOUDFLARE_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET`
- **Backblaze B2**：`BACKBLAZE_KEY_ID`, `BACKBLAZE_APPLICATION_KEY`, `BACKBLAZE_BUCKET_NAME`, `BACKBLAZE_REGION`
- **AWS S3**：`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`

## 故障排除

### 建置失敗

- 檢查 Railway 建置日誌
- 確認 `Dockerfile` 語法正確
- 確認 `package.json` 中的依賴都正確

### 應用啟動失敗

- 檢查環境變數是否全部設定
- 檢查 `DATABASE_URL` 是否正確
- 查看 Railway 日誌找出錯誤訊息

### 資料庫連接失敗

- 確認 `DATABASE_URL` 格式正確
- 確認資料庫服務正在運行
- 檢查資料庫是否允許外部連接

## 相關文件

- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Railway 部署指南
- [RAILWAY_ENV_SETUP.md](./RAILWAY_ENV_SETUP.md) - 環境變數設定指南
- [README_USER_GUIDE.md](./README_USER_GUIDE.md) - 使用者使用說明
- [STORAGE_ALTERNATIVES.md](./STORAGE_ALTERNATIVES.md) - Storage 服務設定指南

## 授權

MIT License

## 支援

如有問題，請查看：
- Railway 官方文件：https://docs.railway.app
- 專案 GitHub Issues

