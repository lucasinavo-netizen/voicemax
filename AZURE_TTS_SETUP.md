# Azure TTS 設定指南

## 概述

Azure Speech Services 提供高品質的文字轉語音（TTS）功能，支援多種中文聲音，適合生成 Podcast 音檔。

## 優點

- ✅ **穩定可靠**：微軟提供的企業級服務
- ✅ **中文支援佳**：多種中文聲音可選
- ✅ **免費額度**：每月前 5 小時免費
- ✅ **價格合理**：超過免費額度後 $1/小時
- ✅ **多種聲音**：提供 17+ 種中文聲音（男女聲）

## 設定步驟

### 1. 建立 Azure 帳號

1. 前往 [Azure Portal](https://portal.azure.com/)
2. 註冊或登入 Azure 帳號
3. 新用戶可獲得 $200 免費額度

### 2. 建立 Speech Services 資源

1. 在 Azure Portal 中，點擊「建立資源」
2. 搜尋「Speech Services」
3. 點擊「建立」
4. 填寫表單：
   - **訂閱**：選擇您的訂閱
   - **資源群組**：建立新群組或選擇現有群組
   - **區域**：選擇離您最近的區域（例如：`eastus`, `westus2`, `southeastasia`）
   - **名稱**：輸入資源名稱（例如：`voicemax-speech`）
   - **定價層**：選擇「Free F0」（免費層，每月 5 小時）或「Standard S0」（付費層）
5. 點擊「檢閱 + 建立」→「建立」

### 3. 取得 API 金鑰和區域

1. 等待資源建立完成（約 1-2 分鐘）
2. 點擊「前往資源」
3. 在左側選單中，點擊「金鑰和端點」
4. 複製以下資訊：
   - **金鑰 1** 或 **金鑰 2**（任一即可）
   - **位置/區域**（例如：`eastus`）

### 4. 在 Railway 中設定環境變數

在 Railway Variables 中新增：

```
AZURE_SPEECH_KEY=你的-azure-speech-key
AZURE_SPEECH_REGION=eastus
```

**注意**：
- `AZURE_SPEECH_KEY`：從 Azure Portal 複製的金鑰
- `AZURE_SPEECH_REGION`：從 Azure Portal 複製的區域（例如：`eastus`, `westus2`, `southeastasia`）
  - 如果不設定，預設為 `eastus`

### 5. 驗證設定

設定完成後，Railway 會自動重新部署。檢查日誌確認：

```
[Env] ✅ Azure TTS configured
[TTS] Using Azure TTS service
```

## 可用的中文聲音

系統預設提供以下中文聲音：

### 女聲
- 曉曉 (zh-CN-XiaoxiaoNeural)
- 曉辰 (zh-CN-XiaochenNeural)
- 曉涵 (zh-CN-XiaohanNeural)
- 曉曼 (zh-CN-XiaomengNeural)
- 曉墨 (zh-CN-XiaomoNeural)
- 曉秋 (zh-CN-XiaoqiuNeural)
- 曉睿 (zh-CN-XiaoruiNeural)
- 曉雙 (zh-CN-XiaoshuangNeural)
- 曉顏 (zh-CN-XiaoyanNeural)
- 曉悠 (zh-CN-XiaoyouNeural)
- 曉甄 (zh-CN-XiaozhenNeural)

### 男聲
- 雲健 (zh-CN-YunyangNeural)
- 雲飛 (zh-CN-YunfengNeural)
- 雲皓 (zh-CN-YunhaoNeural)
- 雲龍 (zh-CN-YunlongNeural)
- 雲澤 (zh-CN-YunzeNeural)
- 雲野 (zh-CN-YunyeNeural)
- 雲希 (zh-CN-YunxiNeural)

## 價格資訊

### 免費層 (F0)
- **免費額度**：每月前 5 小時
- **限制**：每分鐘最多 20 個請求

### 標準層 (S0)
- **價格**：$1/小時（超過免費額度後）
- **限制**：無請求頻率限制

## 故障排除

### 問題：API 金鑰無效

**解決方案**：
1. 確認 `AZURE_SPEECH_KEY` 已正確設定
2. 確認金鑰沒有多餘的空格
3. 在 Azure Portal 中確認資源狀態為「已啟用」

### 問題：區域錯誤

**解決方案**：
1. 確認 `AZURE_SPEECH_REGION` 與資源建立時的區域一致
2. 常見區域：
   - `eastus`（美國東部）
   - `westus2`（美國西部 2）
   - `southeastasia`（東南亞）

### 問題：超過免費額度

**解決方案**：
1. 升級到標準層（S0）
2. 或等待下個月免費額度重置
3. 或使用 ListenHub 作為備用方案

## 備用方案

如果未配置 Azure TTS，系統會自動回退到 ListenHub（如果已配置 `LISTENHUB_API_KEY`）。

## 相關文件

- [Azure Speech Services 官方文件](https://docs.microsoft.com/azure/cognitive-services/speech-service/)
- [Azure TTS 聲音列表](https://docs.microsoft.com/azure/cognitive-services/speech-service/language-support?tabs=tts)

