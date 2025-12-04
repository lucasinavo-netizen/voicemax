export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // AssemblyAI API key for speech-to-text transcription
  assemblyaiApiKey: process.env.ASSEMBLYAI_API_KEY ?? "",
  // Storage configuration - Cloudflare R2 (S3-compatible, free 10GB)
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
  cloudflareAccessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID ?? "",
  cloudflareSecretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY ?? "",
  cloudflareR2Bucket: process.env.CLOUDFLARE_R2_BUCKET ?? "",
  cloudflareR2PublicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "", // Optional: custom domain
  // Google Gemini API for LLM (content analysis)
  googleGeminiApiKey: process.env.GOOGLE_GEMINI_API_KEY ?? "",
  // Google OAuth (optional, for Google login)
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
  // Azure Speech Services (TTS)
  azureSpeechKey: process.env.AZURE_SPEECH_KEY ?? "",
  azureSpeechRegion: process.env.AZURE_SPEECH_REGION ?? "eastus",
  // ListenHub (legacy TTS, optional)
  listenHubApiKey: process.env.LISTENHUB_API_KEY ?? "",
};
