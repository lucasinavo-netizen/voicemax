# 上傳到 GitHub 指南

## 📋 步驟 1：準備 Git Repository

專案已經初始化 Git，現在需要提交並推送到 GitHub。

## 📋 步驟 2：在 GitHub 建立 Repository

1. 前往 [GitHub](https://github.com) 並登入
2. 點擊右上角的 **"+"** → **"New repository"**
3. 填寫 Repository 資訊：
   - **Repository name**: `podcast-maker`（或您想要的名稱）
   - **Description**: Podcast 一站式製作工具
   - **Visibility**: 選擇 **Public** 或 **Private**
   - **不要**勾選 "Initialize this repository with a README"（因為我們已經有文件）
4. 點擊 **"Create repository"**

## 📋 步驟 3：提交並推送代碼

在終端機執行以下命令：

```bash
# 進入專案目錄
cd /Users/idea3c/Downloads/podcast-maker-backup-20251201-224457

# 提交所有文件
git commit -m "Initial commit: Podcast Maker 專案準備部署到 Railway"

# 添加 GitHub remote（將 YOUR_USERNAME 和 REPO_NAME 替換為您的實際值）
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

## 📋 步驟 4：使用 SSH（推薦）

如果您使用 SSH 金鑰，可以使用：

```bash
# 添加 SSH remote（將 YOUR_USERNAME 和 REPO_NAME 替換為您的實際值）
git remote set-url origin git@github.com:YOUR_USERNAME/REPO_NAME.git

# 推送到 GitHub
git push -u origin main
```

## 📋 步驟 5：驗證

1. 前往您的 GitHub repository 頁面
2. 確認所有文件都已上傳
3. 確認 `.env` 文件**沒有**被上傳（應該在 `.gitignore` 中）

## ⚠️ 重要提醒

### 確保不會上傳敏感資訊

以下文件**不應該**被上傳到 GitHub：
- ✅ `.env` - 已在 `.gitignore` 中
- ✅ `node_modules/` - 已在 `.gitignore` 中
- ✅ `.env.local` - 已在 `.gitignore` 中
- ✅ `dist/` - 已在 `.gitignore` 中

### 檢查敏感資訊

在推送前，確認以下內容**沒有**出現在代碼中：
- API Keys
- 密碼
- 資料庫連接字串
- 私鑰

## 🔧 如果遇到問題

### 問題 1：認證失敗

如果推送時要求輸入帳號密碼：
- 使用 **Personal Access Token** 代替密碼
- 或設定 SSH 金鑰

**建立 Personal Access Token：**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. 選擇 `repo` 權限
4. 複製 token，在推送時使用它作為密碼

### 問題 2：Remote 已存在

如果 `git remote add origin` 失敗：
```bash
# 移除現有的 remote
git remote remove origin

# 重新添加
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

### 問題 3：推送被拒絕

如果推送被拒絕：
```bash
# 先拉取遠端變更（如果有的話）
git pull origin main --allow-unrelated-histories

# 然後推送
git push -u origin main
```

## ✅ 完成後

上傳完成後，您就可以：
1. 在 Railway 中連接這個 GitHub repository
2. Railway 會自動偵測變更並部署
3. 每次推送新代碼，Railway 會自動重新部署

## 📝 後續更新

之後如果要更新代碼：

```bash
# 添加變更
git add .

# 提交
git commit -m "描述您的變更"

# 推送
git push
```

