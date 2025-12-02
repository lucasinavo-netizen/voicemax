# Railway 部署檢查清單

使用此檢查清單確保部署順利完成。

## 📋 部署前準備

### 1. 程式碼準備
- [ ] 程式碼已推送到 GitHub
- [ ] 確認 `.gitignore` 已正確設定（排除 `.env`、`node_modules` 等）
- [ ] 確認 `Dockerfile` 存在且正確
- [ ] 確認 `railway.json` 存在且正確
- [ ] 確認 `package.json` 中的腳本正確

### 2. API Keys 準備
- [ ] Google OAuth Client ID 和 Secret
- [ ] AssemblyAI API Key
- [ ] Google Gemini API Key
- [ ] Cloudflare R2 配置（Account ID、Access Key、Secret Key、Bucket）
- [ ] ListenHub API Key（選用）

## 🚀 Railway 設定

### 3. 建立專案
- [ ] 在 Railway 建立新專案
- [ ] 連接 GitHub repository
- [ ] Railway 自動偵測 Dockerfile

### 4. 建立資料庫
- [ ] 建立 MySQL 資料庫服務
- [ ] 複製 `DATABASE_URL` 連接字串

### 5. 設定環境變數

#### 核心變數
- [ ] `DATABASE_URL` - MySQL 連接字串
- [ ] `JWT_SECRET` - 強隨機字串（至少 32 字元）
- [ ] `NODE_ENV=production`

#### Google OAuth
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REDIRECT_URI` - 設定為 Railway 網域

#### AI 服務
- [ ] `ASSEMBLYAI_API_KEY`
- [ ] `GOOGLE_GEMINI_API_KEY`

#### Cloudflare R2
- [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] `CLOUDFLARE_ACCESS_KEY_ID`
- [ ] `CLOUDFLARE_SECRET_ACCESS_KEY`
- [ ] `CLOUDFLARE_R2_BUCKET`
- [ ] `CLOUDFLARE_R2_PUBLIC_URL`（選用）

#### 其他
- [ ] `LISTENHUB_API_KEY`（選用）
- [ ] `VITE_APP_TITLE`（選用）

## 🔍 部署後驗證

### 6. 檢查建置
- [ ] 建置成功完成
- [ ] 沒有建置錯誤
- [ ] 所有依賴正確安裝

### 7. 檢查啟動
- [ ] 應用成功啟動
- [ ] 沒有啟動錯誤
- [ ] 資料庫遷移自動執行成功

### 8. 檢查功能
- [ ] 可以訪問首頁
- [ ] Google OAuth 登入正常
- [ ] 可以提交 YouTube URL
- [ ] 檔案上傳到 Cloudflare R2 正常

### 9. 設定網域
- [ ] 生成或設定自訂網域
- [ ] HTTPS 自動設定
- [ ] 更新 `GOOGLE_REDIRECT_URI` 為新網域

## 📝 部署後維護

### 10. 監控設定
- [ ] 設定使用量警告
- [ ] 定期檢查日誌
- [ ] 監控 API 使用量

### 11. 備份
- [ ] 定期備份資料庫
- [ ] 備份環境變數設定

## ✅ 完成

當所有項目都完成後，您的應用應該已經成功部署到 Railway！

如有問題，請參考 `RAILWAY_DEPLOY.md` 中的故障排除章節。

