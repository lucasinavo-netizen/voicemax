import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // 生產環境的建置輸出目錄（根據 vite.config.ts 的 build.outDir）
  // 使用多種方式嘗試找到正確的路徑
  const cwd = process.cwd();
  const possiblePaths: string[] = [
    path.resolve(cwd, "dist", "public"),           // 標準路徑
    path.resolve(cwd, "..", "dist", "public"),     // 如果 cwd 在子目錄
    "/app/dist/public",                            // Docker 容器中的絕對路徑
  ];
  
  // 只在 __dirname 可用時添加（ES modules 中可能不可用）
  if (typeof __dirname !== 'undefined') {
    possiblePaths.push(path.resolve(__dirname, "..", "..", "dist", "public"));
  }
  
  let distPath: string | null = null;
  
  console.log(`[Static] Current working directory: ${cwd}`);
  console.log(`[Static] __dirname: ${typeof __dirname !== 'undefined' ? __dirname : 'not available (ES modules)'}`);
  
  // 嘗試找到存在的路徑
  for (const possiblePath of possiblePaths) {
    console.log(`[Static] Checking: ${possiblePath}`);
    if (fs.existsSync(possiblePath)) {
      distPath = possiblePath;
      console.log(`[Static] ✅ Found build directory at: ${distPath}`);
      break;
    }
  }
  
  if (!distPath) {
    console.error(`[Static] ❌ Could not find build directory in any of these locations:`);
    possiblePaths.forEach(p => console.error(`[Static]   - ${p}`));
    
    // 列出實際存在的目錄結構以便調試
    console.log(`[Static] Listing root directory:`, fs.existsSync(cwd) ? fs.readdirSync(cwd).slice(0, 10) : "cwd does not exist");
    if (fs.existsSync(path.resolve(cwd, "dist"))) {
      console.log(`[Static] Listing dist directory:`, fs.readdirSync(path.resolve(cwd, "dist")));
    }
    
    // 即使目錄不存在，也設置靜態文件服務，避免應用崩潰
    // 這樣健康檢查可以通過，用戶可以在日誌中看到問題
    console.warn(`[Static] ⚠️  Static files will not be served, but server will continue running`);
    
    // 使用第一個可能的路徑作為 fallback
    distPath = possiblePaths[0];
  }

  // 只有在目錄存在時才設置靜態文件服務
  if (distPath && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    console.log(`[Static] ✅ Serving static files from: ${distPath}`);
    
    // fall through to index.html if the file doesn't exist
    app.use("*", (_req, res) => {
      const indexPath = path.resolve(distPath!, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error(`[Static] ❌ index.html not found at: ${indexPath}`);
        res.status(404).json({ error: "Frontend build not found. Please check build process." });
      }
    });
  } else {
    // 如果建置目錄不存在，至少提供一個錯誤頁面
    console.warn(`[Static] ⚠️  Serving error page - build directory not found`);
    app.use("*", (_req, res) => {
      // 健康檢查端點應該已經處理了，這裡只處理其他請求
      if (_req.path === "/health") {
        res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
      } else {
        res.status(503).json({ 
          error: "Frontend build not found",
          message: "The application is running but frontend files are missing. Please check the build process.",
          path: distPath,
          cwd: cwd
        });
      }
    });
  }
}
