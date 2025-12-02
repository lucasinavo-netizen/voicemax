# 第三方平台與服務清單

本文檔列出專案中使用的所有第三方平台和服務，方便您決定哪些需要保留，哪些可以移除。

## 📋 服務分類

### 🔴 核心服務（必要）

這些服務是專案的核心功能，移除後會影響主要功能：

#### 1. **AssemblyAI** - 語音轉文字
- **用途**：將 YouTube 影片音訊轉換為文字逐字稿
- **環境變數**：`ASSEMBLYAI_API_KEY`
- **使用位置**：
  - `server/_core/voiceTranscription.ts`
  - `server/youtubeService.ts`
- **必要性**：⭐️⭐️⭐️⭐️⭐️ 核心功能，無法移除
- **替代方案**：無（或需重寫整個轉錄邏輯）

#### 2. **Google Gemini API** - AI 內容分析
- **用途**：
  - 分析 YouTube 影片內容
  - 生成摘要（200-300 字）
  - 生成 Podcast 腳本（第三人稱敘事）
- **環境變數**：`GOOGLE_GEMINI_API_KEY`
- **使用位置**：
  - `server/_core/llm.ts`
  - `server/youtubeService.ts`
- **必要性**：⭐️⭐️⭐️⭐️⭐️ 核心功能，無法移除
- **替代方案**：OpenAI GPT、Claude（需修改代碼）

#### 3. **Google OAuth 2.0** - 用戶認證
- **用途**：用戶登入認證
- **環境變數**：
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`
- **使用位置**：
  - `server/_core/googleOAuth.ts`
  - `server/_core/oauth.ts`
- **必要性**：⭐️⭐️⭐️⭐️⭐️ 核心功能，無法移除
- **替代方案**：可改用其他 OAuth 提供者（需修改代碼）

#### 4. **MySQL 資料庫** - 資料儲存
- **用途**：儲存用戶資料、任務記錄、Podcast 內容等
- **環境變數**：`DATABASE_URL`
- **使用位置**：整個後端
- **必要性**：⭐️⭐️⭐️⭐️⭐️ 核心功能，無法移除
- **替代方案**：PostgreSQL、MongoDB（需修改 schema）

---

### 🟡 重要服務（建議保留）

這些服務提供重要功能，但可以找到替代方案：

#### 5. **ListenHub (MarsWave)** - TTS 語音合成
- **用途**：生成中文男女對話 Podcast 音檔
- **API 端點**：`https://api.marswave.ai/openapi/v1`
- **環境變數**：`LISTENHUB_API_KEY`
- **使用位置**：
  - `server/listenHubService.ts`
  - `server/routers.ts` (generateChinesePodcast)
- **必要性**：⭐️⭐️⭐️⭐️ 重要功能，但可替代
- **替代方案**：
  - ElevenLabs API
  - Azure Speech Services
  - Google Cloud Text-to-Speech
  - 其他 TTS 服務

#### 6. **Cloudflare R2** - 儲存服務 ⭐
- **用途**：儲存音檔、影片等檔案
- **環境變數**：
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_ACCESS_KEY_ID`
  - `CLOUDFLARE_SECRET_ACCESS_KEY`
  - `CLOUDFLARE_R2_BUCKET`
  - `CLOUDFLARE_R2_PUBLIC_URL` (選用)
- **使用位置**：`server/storage.ts`
- **必要性**：⭐️⭐️⭐️⭐️⭐️ 核心功能，必須配置
- **免費額度**：10GB 儲存 + 每月 100 萬次讀取

---


---

## 📊 服務依賴關係圖

```
核心流程：
YouTube 影片 
  ↓
AssemblyAI (轉錄) 
  ↓
Google Gemini (分析 + 生成摘要/腳本)
  ↓
ListenHub (生成 Podcast 音檔)
  ↓
Cloudflare R2 (儲存音檔)
  ↓
完成
```

---

---

## 💰 成本估算

### 免費/低成本的服務：
- ✅ Google Gemini API - 免費額度充足
- ✅ Google OAuth - 完全免費
- ✅ Cloudflare R2 - 10GB 免費
- ⚠️ AssemblyAI - 每月 5 小時免費轉錄
- ⚠️ ListenHub - 需查看定價

---

## 📝 總結

**必須保留的服務（6 個）：**
1. AssemblyAI - 語音轉文字
2. Google Gemini API - AI 內容分析
3. Google OAuth - 用戶認證
4. MySQL 資料庫 - 資料儲存
5. Cloudflare R2 - 檔案儲存
6. ListenHub - TTS 語音合成

**已移除的服務：**
- ✅ HeyGen API - 已移除
- ✅ Kling AI - 已移除
- ✅ Manus Forge API - 已移除

