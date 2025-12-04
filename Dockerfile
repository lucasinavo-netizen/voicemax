# 使用 Node.js 22 作為基礎映像
FROM node:22-slim

# 安裝必要的系統工具（僅用於建置和運行）
# 包括 ffmpeg 和必要的依賴
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 直接下載 yt-dlp 二進位檔（不需要 Python）
# 這是更可靠的方式，避免 Python 環境問題
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# 驗證安裝
RUN yt-dlp --version && ffmpeg -version | head -n 1

# 設定工作目錄
WORKDIR /app

# 安裝 pnpm（全局安裝，用於後續步驟）
RUN npm install -g pnpm

# 複製 package.json 和 pnpm-lock.yaml（優化 Docker 層級緩存）
COPY package.json pnpm-lock.yaml* ./

# 安裝依賴（使用 --frozen-lockfile 確保一致性，Railway 會自動處理）
RUN pnpm install --frozen-lockfile

# 複製專案檔案
COPY . .

# 建置前端和後端
RUN echo "Starting build process..." && \
    pnpm run build && \
    echo "Build command completed. Verifying build output..." && \
    echo "Checking dist directory:" && \
    ls -la dist/ || echo "ERROR: dist directory does not exist!" && \
    echo "Checking dist/public directory:" && \
    ls -la dist/public/ || echo "ERROR: dist/public directory does not exist!" && \
    echo "Checking dist/index.js:" && \
    ls -la dist/index.js || echo "ERROR: dist/index.js does not exist!" && \
    echo "Build verification complete"

# 暴露端口（Railway 會自動設定 PORT 環境變數）
EXPOSE 3000

# 設定環境變數
ENV NODE_ENV=production

# 啟動應用
CMD ["pnpm", "start"]
