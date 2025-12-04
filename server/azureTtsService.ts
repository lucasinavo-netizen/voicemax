/**
 * Azure Text-to-Speech Service
 * 用於生成中文男女對話 Podcast
 */

import { uploadFile } from "./storage";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

const execFileAsync = promisify(execFile);
const FFMPEG_PATH = ffmpegInstaller.path;

// 延遲導入 Azure Speech SDK，避免在模組載入時失敗
let sdk: typeof import("microsoft-cognitiveservices-speech-sdk") | null = null;

async function getAzureSdk() {
  if (!sdk) {
    try {
      sdk = await import("microsoft-cognitiveservices-speech-sdk");
    } catch (error) {
      throw new Error(`Failed to import Azure Speech SDK: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return sdk;
}

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || "eastus";

if (!AZURE_SPEECH_KEY) {
  console.warn("[AzureTTS] API Key not configured");
}

// Azure TTS 支援的中文聲音列表（常用）
export interface AzureTtsVoice {
  name: string;
  speakerId: string; // Azure 聲音名稱（如 "zh-CN-XiaoxiaoNeural"）
  demoAudioUrl?: string;
  gender: "male" | "female";
  language: string;
  locale: string; // 如 "zh-CN"
}

// 預定義的中文聲音列表
const CHINESE_VOICES: AzureTtsVoice[] = [
  // 女聲
  { name: "曉曉", speakerId: "zh-CN-XiaoxiaoNeural", gender: "female", language: "zh", locale: "zh-CN" },
  { name: "曉辰", speakerId: "zh-CN-XiaochenNeural", gender: "female", language: "zh", locale: "zh-CN" },
  { name: "曉涵", speakerId: "zh-CN-XiaohanNeural", gender: "female", language: "zh", locale: "zh-CN" },
  { name: "曉曼", speakerId: "zh-CN-XiaomengNeural", gender: "female", language: "zh", locale: "zh-CN" },
  { name: "曉墨", speakerId: "zh-CN-XiaomoNeural", gender: "female", language: "zh", locale: "zh-CN" },
  { name: "曉秋", speakerId: "zh-CN-XiaoqiuNeural", gender: "female", language: "zh", locale: "zh-CN" },
  { name: "曉睿", speakerId: "zh-CN-XiaoruiNeural", gender: "female", language: "zh", locale: "zh-CN" },
  { name: "曉雙", speakerId: "zh-CN-XiaoshuangNeural", gender: "female", language: "zh", locale: "zh-CN" },
  { name: "曉顏", speakerId: "zh-CN-XiaoyanNeural", gender: "female", language: "zh", locale: "zh-CN" },
  { name: "曉悠", speakerId: "zh-CN-XiaoyouNeural", gender: "female", language: "zh", locale: "zh-CN" },
  { name: "曉甄", speakerId: "zh-CN-XiaozhenNeural", gender: "female", language: "zh", locale: "zh-CN" },
  // 男聲
  { name: "雲健", speakerId: "zh-CN-YunyangNeural", gender: "male", language: "zh", locale: "zh-CN" },
  { name: "雲飛", speakerId: "zh-CN-YunfengNeural", gender: "male", language: "zh", locale: "zh-CN" },
  { name: "雲皓", speakerId: "zh-CN-YunhaoNeural", gender: "male", language: "zh", locale: "zh-CN" },
  { name: "雲龍", speakerId: "zh-CN-YunlongNeural", gender: "male", language: "zh", locale: "zh-CN" },
  { name: "雲澤", speakerId: "zh-CN-YunzeNeural", gender: "male", language: "zh", locale: "zh-CN" },
  { name: "雲野", speakerId: "zh-CN-YunyeNeural", gender: "male", language: "zh", locale: "zh-CN" },
  { name: "雲希", speakerId: "zh-CN-YunxiNeural", gender: "male", language: "zh", locale: "zh-CN" },
];

export interface PodcastEpisode {
  episodeId: string;
  processStatus: "pending" | "success" | "failed";
  title?: string;
  audioUrl?: string;
  audioStreamUrl?: string;
  scripts?: Array<{
    speakerId: string;
    speakerName: string;
    content: string;
  }>;
  credits?: number;
  failCode?: number;
}

/**
 * 獲取所有可用的聲音列表
 */
export async function getVoices(): Promise<AzureTtsVoice[]> {
  if (!AZURE_SPEECH_KEY) {
    throw new Error("Azure Speech API Key not configured");
  }

  // 返回預定義的中文聲音列表
  return CHINESE_VOICES;
}

/**
 * 獲取可用的中文聲音列表
 */
export async function getChineseSpeakers(): Promise<AzureTtsVoice[]> {
  return getVoices();
}

/**
 * 選擇一男一女聲音（用於對話）
 */
export async function selectMaleFemaleSpeakers(): Promise<{
  male: AzureTtsVoice;
  female: AzureTtsVoice;
}> {
  const speakers = await getChineseSpeakers();

  const males = speakers.filter((s) => s.gender === "male");
  const females = speakers.filter((s) => s.gender === "female");

  if (males.length === 0 || females.length === 0) {
    throw new Error("No male or female speakers available");
  }

  // 選擇第一個男聲和女聲
  return {
    male: males[0],
    female: females[0],
  };
}

/**
 * 使用 Azure TTS 生成單段語音
 */
async function synthesizeSpeech(
  text: string,
  voiceName: string,
  locale: string = "zh-CN"
): Promise<Buffer> {
  if (!AZURE_SPEECH_KEY) {
    throw new Error("Azure Speech API Key not configured");
  }

  const azureSdk = await getAzureSdk();
  const speechConfig = azureSdk.SpeechConfig.fromSubscription(
    AZURE_SPEECH_KEY,
    AZURE_SPEECH_REGION
  );
  speechConfig.speechSynthesisVoiceName = voiceName;
  speechConfig.speechSynthesisLanguage = locale;

  const synthesizer = new azureSdk.SpeechSynthesizer(speechConfig, null);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (result) => {
        synthesizer.close();
        if (result.errorDetails) {
          reject(new Error(result.errorDetails));
        } else {
          resolve(Buffer.from(result.audioData));
        }
      },
      (error) => {
        synthesizer.close();
        reject(error);
      }
    );
  });
}

/**
 * 將文字分段為對話格式（簡單實現：按段落或句子分割）
 */
function splitTextIntoDialogue(
  text: string,
  host1Name: string = "主持人1",
  host2Name: string = "主持人2"
): Array<{ speaker: string; content: string }> {
  // 簡單實現：按段落分割，輪流分配給兩個主持人
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const dialogue: Array<{ speaker: string; content: string }> = [];

  paragraphs.forEach((paragraph, index) => {
    // 如果段落包含明確的說話者標記，使用它
    const host1Match = paragraph.match(new RegExp(`^${host1Name}[：:]\\s*(.+)`, "s"));
    const host2Match = paragraph.match(new RegExp(`^${host2Name}[：:]\\s*(.+)`, "s"));

    if (host1Match) {
      dialogue.push({ speaker: host1Name, content: host1Match[1] });
    } else if (host2Match) {
      dialogue.push({ speaker: host2Name, content: host2Match[1] });
    } else {
      // 否則輪流分配
      const speaker = index % 2 === 0 ? host1Name : host2Name;
      dialogue.push({ speaker, content: paragraph });
    }
  });

  return dialogue;
}

/**
 * 合併多個音訊檔案（使用 ffmpeg）
 */
async function mergeAudioFiles(audioBuffers: Buffer[]): Promise<Buffer> {
  if (audioBuffers.length === 0) {
    throw new Error("No audio buffers to merge");
  }

  if (audioBuffers.length === 1) {
    return audioBuffers[0];
  }

  const tempDir = "/tmp";
  const inputFiles: string[] = [];
  const tempFiles: string[] = [];

  try {
    // 1. 將每個音訊緩衝區寫入臨時檔案
    for (let i = 0; i < audioBuffers.length; i++) {
      const tempFile = path.join(tempDir, `azure_tts_${nanoid()}_${i}.wav`);
      await fs.writeFile(tempFile, audioBuffers[i]);
      inputFiles.push(tempFile);
      tempFiles.push(tempFile);
    }

    // 2. 創建 ffmpeg concat 文件
    const concatFile = path.join(tempDir, `azure_tts_concat_${nanoid()}.txt`);
    const concatContent = inputFiles.map(file => `file '${file}'`).join('\n');
    await fs.writeFile(concatFile, concatContent);
    tempFiles.push(concatFile);

    // 3. 使用 ffmpeg 合併音訊
    const outputFile = path.join(tempDir, `azure_tts_merged_${nanoid()}.wav`);
    tempFiles.push(outputFile);

    const args = [
      "-f", "concat",
      "-safe", "0",
      "-i", concatFile,
      "-c", "copy",
      outputFile,
      "-y", // 覆蓋輸出檔案
    ];

    console.log(`[AzureTTS] Merging ${audioBuffers.length} audio files using ffmpeg...`);
    await execFileAsync(FFMPEG_PATH, args, { maxBuffer: 1024 * 1024 * 50 });

    // 4. 讀取合併後的檔案
    const mergedBuffer = await fs.readFile(outputFile);
    console.log(`[AzureTTS] ✅ Successfully merged audio files (${(mergedBuffer.length / 1024 / 1024).toFixed(2)}MB)`);

    return mergedBuffer;
  } finally {
    // 5. 清理臨時檔案
    for (const tempFile of tempFiles) {
      try {
        await fs.unlink(tempFile);
      } catch (error) {
        console.warn(`[AzureTTS] Failed to clean up temp file: ${tempFile}`, error);
      }
    }
  }
}

/**
 * 生成中文對話 Podcast
 * @param content 內容文字（摘要或腳本）
 * @param mode 生成模式（Azure TTS 不支援此參數，保留以保持接口一致）
 * @param customVoiceIds 自訂聲音 ID（可選）
 * @returns 完成的 Episode（包含音檔 URL）
 */
export async function generateChinesePodcast(
  content: string,
  mode: "quick" | "medium" | "deep" = "deep",
  customVoiceIds?: { host1: string; host2: string }
): Promise<PodcastEpisode> {
  if (!AZURE_SPEECH_KEY) {
    throw new Error("Azure Speech API Key not configured");
  }

  let host1Voice: AzureTtsVoice;
  let host2Voice: AzureTtsVoice;

  if (customVoiceIds) {
    // 使用使用者選擇的聲音
    const voices = await getVoices();
    host1Voice = voices.find((v) => v.speakerId === customVoiceIds.host1) || voices[0];
    host2Voice = voices.find((v) => v.speakerId === customVoiceIds.host2) || voices[1];
    console.log(
      `[AzureTTS] Using custom voices: ${host1Voice.name} (${host1Voice.speakerId}) and ${host2Voice.name} (${host2Voice.speakerId})`
    );
  } else {
    // 使用預設聲音（一男一女）
    const { male, female } = await selectMaleFemaleSpeakers();
    host1Voice = male;
    host2Voice = female;
    console.log(
      `[AzureTTS] Selected speakers: ${host1Voice.name} (male) and ${host2Voice.name} (female)`
    );
  }

  // 1. 將文字分段為對話
  const dialogue = splitTextIntoDialogue(content, host1Voice.name, host2Voice.name);
  console.log(`[AzureTTS] Split content into ${dialogue.length} dialogue segments`);

  // 2. 為每個對話段生成語音
  const audioBuffers: Buffer[] = [];
  const scripts: Array<{ speakerId: string; speakerName: string; content: string }> = [];

  for (const segment of dialogue) {
    const isHost1 = segment.speaker === host1Voice.name;
    const voice = isHost1 ? host1Voice : host2Voice;

    console.log(`[AzureTTS] Synthesizing: ${voice.name} - "${segment.content.substring(0, 50)}..."`);

    try {
      const audioBuffer = await synthesizeSpeech(
        segment.content,
        voice.speakerId,
        voice.locale
      );
      audioBuffers.push(audioBuffer);
      scripts.push({
        speakerId: voice.speakerId,
        speakerName: voice.name,
        content: segment.content,
      });
    } catch (error) {
      console.error(`[AzureTTS] Error synthesizing segment:`, error);
      throw new Error(`Failed to synthesize speech: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 3. 合併音訊檔案
  console.log(`[AzureTTS] Merging ${audioBuffers.length} audio segments...`);
  const mergedAudio = await mergeAudioFiles(audioBuffers);

  // 4. 上傳到儲存服務
  const episodeId = nanoid();
  const fileName = `podcast-${episodeId}.wav`;
  console.log(`[AzureTTS] Uploading audio to storage: ${fileName}...`);

  try {
    const audioUrl = await uploadFile(fileName, mergedAudio, "audio/wav");
    console.log(`[AzureTTS] ✅ Audio uploaded successfully: ${audioUrl}`);

    // 5. 返回結果
    return {
      episodeId,
      processStatus: "success",
      title: `Podcast ${episodeId}`,
      audioUrl,
      audioStreamUrl: audioUrl,
      scripts,
    };
  } catch (error) {
    console.error(`[AzureTTS] Error uploading audio:`, error);
    throw new Error(`Failed to upload audio: ${error instanceof Error ? error.message : String(error)}`);
  }
}

