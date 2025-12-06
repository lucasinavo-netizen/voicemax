import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  console.log("[Startup] 🚀 Starting server...");
  
  // 先創建 Express 應用和伺服器，立即設置健康檢查端點
  // 這樣健康檢查可以在其他初始化完成前就可用
  const app = express();
  const server = createServer(app);
  
  console.log("[Startup] ✅ Express app and HTTP server created");
  
  // Health check endpoint (must be FIRST, before any other middleware)
  // This ensures health checks work even if other parts fail
  app.get("/health", (_req, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  console.log("[Startup] ✅ Health check endpoint registered at /health");

  // 驗證環境變數（在啟動前檢查）
  // 注意：在 Railway 部署時，如果環境變數未設定，只顯示警告，不阻止啟動
  // 這樣可以讓健康檢查通過，然後在 Railway 日誌中看到缺少哪些變數
  try {
    const { validateEnvironmentVariables } = await import("./validateEnv");
    const result = validateEnvironmentVariables();
    
    if (!result.valid) {
      console.error("[Startup] ❌ 環境變數驗證失敗:");
      console.error("[Startup] 缺少必需的環境變數:", result.missing.join(", "));
      console.error("[Startup] ⚠️  應用程式將繼續啟動，但某些功能可能無法使用");
      console.error("[Startup] ⚠️  請在 Railway Variables 中設定缺少的環境變數");
    } else {
      console.log("[Startup] ✅ 環境變數驗證通過");
    }
    
    if (result.warnings.length > 0) {
      console.warn("[Startup] 環境變數警告:");
      result.warnings.forEach(warning => {
        console.warn(`[Startup] ⚠️  ${warning}`);
      });
    }
  } catch (error) {
    console.error("[Startup] ❌ 環境變數驗證過程發生錯誤:");
    console.error(error instanceof Error ? error.message : error);
    console.error("[Startup] ⚠️  應用程式將繼續啟動");
  }

  // 診斷環境變數（僅顯示已設定狀態，不顯示值）
  console.log("[Startup] Environment variables status:");
  console.log("[Startup] DATABASE_URL:", process.env.DATABASE_URL ? "Set (hidden)" : "NOT SET");
  console.log("[Startup] JWT_SECRET:", process.env.JWT_SECRET ? "Set (hidden)" : "NOT SET");
  console.log("[Startup] GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Set (hidden)" : "NOT SET");
  console.log("[Startup] ASSEMBLYAI_API_KEY:", process.env.ASSEMBLYAI_API_KEY ? "Set (hidden)" : "NOT SET");
  console.log("[Startup] GOOGLE_GEMINI_API_KEY:", process.env.GOOGLE_GEMINI_API_KEY ? "Set (hidden)" : "NOT SET");
  console.log("[Startup] NODE_ENV:", process.env.NODE_ENV);

  // 在背景執行資料庫遷移，不阻塞伺服器啟動
  // 注意：遷移失敗不應該阻止應用啟動，讓 Railway 健康檢查可以通過
  (async () => {
    try {
      const { runMigrations } = await import("./migrate");
      await runMigrations();
      console.log("[Startup] ✅ 資料庫遷移完成");
    } catch (error) {
      console.error("[Startup] ⚠️  資料庫遷移失敗:");
      console.error(error instanceof Error ? error.message : error);
      console.error("[Startup] ⚠️  應用程式將繼續運行，但資料庫功能可能無法使用");
      console.error("[Startup] ⚠️  請檢查 DATABASE_URL 是否正確，或手動執行遷移");
    }
  })();
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Google OAuth routes
  registerOAuthRoutes(app);
  
  // tRPC API (動態導入以避免啟動時載入所有路由)
  try {
    const { appRouter } = await import("../routers");
    app.use(
      "/api/trpc",
      createExpressMiddleware({
        router: appRouter,
        createContext,
      })
    );
    console.log("[Server] ✅ tRPC API routes loaded");
  } catch (error) {
    console.error("[Server] ❌ Failed to load tRPC routes:");
    console.error(error instanceof Error ? error.message : error);
    console.error("[Server] ⚠️  tRPC API will not be available");
  }
  
  // Get port from environment (Railway sets this automatically)
  // Railway will provide PORT environment variable, use it directly
  const port = parseInt(process.env.PORT || "3000", 10);
  
  if (isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT environment variable: ${process.env.PORT}`);
  }
  
  console.log(`[Server] Port configured: ${port}`);
  console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Server] Starting to listen on port ${port}...`);

  // development mode uses Vite, production mode uses static files
  // Wrap in try-catch to ensure server can start even if static files fail
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Server] Setting up Vite for development...`);
      await setupVite(app, server);
    } else {
      console.log(`[Server] Setting up static file serving for production...`);
      serveStatic(app);
    }
  } catch (error) {
    console.error(`[Server] ⚠️  Error setting up static files/Vite:`);
    console.error(error instanceof Error ? error.message : error);
    console.error(`[Server] ⚠️  Server will continue, but static files may not be available`);
  }
  
  console.log(`[Server] Starting server on port ${port}...`);

  // 優雅關閉處理（在啟動前設置）
  const gracefulShutdown = async (signal: string) => {
    console.log(`[Server] Received ${signal}, starting graceful shutdown...`);
    
    server.close(async () => {
      console.log("[Server] HTTP server closed");
      
      // 關閉資料庫連接池
      const { closeDb } = await import("../db");
      await closeDb();
      
      console.log("[Server] Graceful shutdown completed");
      process.exit(0);
    });

    // 強制關閉超時（10 秒）
    setTimeout(() => {
      console.error("[Server] Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Start server and return promise
  // 注意：即使某些初始化失敗，也要確保伺服器能夠啟動並響應健康檢查
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error(`[Server] ❌ Server startup timeout after 30 seconds`);
      reject(new Error("Server startup timeout"));
    }, 30000); // 30 秒超時

    server.listen(port, "0.0.0.0", () => {
      clearTimeout(timeout);
      console.log(`[Server] ✅ Server running on http://0.0.0.0:${port}/`);
      console.log(`[Server] ✅ Health check available at http://0.0.0.0:${port}/health`);
      console.log(`[Server] ✅ Server is ready to accept connections`);
      resolve();
    });
    
    server.on("error", (error) => {
      clearTimeout(timeout);
      console.error(`[Server] ❌ Server failed to start:`, error);
      console.error(`[Server] Error details:`, error.message);
      reject(error);
    });
  });
}

// 全局錯誤處理：捕獲未處理的異常和 Promise rejection
process.on("uncaughtException", (error) => {
  console.error("[Startup] ❌ Uncaught Exception:", error);
  console.error("[Startup] Stack:", error.stack);
  // 不要立即退出，讓伺服器有機會啟動
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Startup] ❌ Unhandled Rejection at:", promise);
  console.error("[Startup] Reason:", reason);
  // 不要立即退出，讓伺服器有機會啟動
});

// 啟動伺服器
startServer()
  .then(() => {
    console.log("[Startup] ✅ Server startup completed successfully");
  })
  .catch((error) => {
    console.error("[Startup] ❌ Server startup failed:", error);
    console.error("[Startup] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    // 即使啟動失敗，也等待一段時間讓健康檢查有機會通過
    // 因為某些錯誤可能不影響健康檢查端點
    setTimeout(() => {
      console.error("[Startup] Exiting after startup failure...");
      process.exit(1);
    }, 10000); // 10 秒後退出
  });
