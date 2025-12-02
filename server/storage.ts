// Storage helpers for Cloudflare R2 (S3-compatible)

import { ENV } from './_core/env';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

// Get Cloudflare R2 client
function getR2Client(): { client: S3Client; bucket: string; publicUrl?: string } {
  if (!ENV.cloudflareAccountId || !ENV.cloudflareAccessKeyId || !ENV.cloudflareSecretAccessKey || !ENV.cloudflareR2Bucket) {
    throw new Error(
      'Cloudflare R2 storage not configured. ' +
      'Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET environment variables.'
    );
  }

  // Trim whitespace from credentials (common issue when copying)
  const accessKeyId = ENV.cloudflareAccessKeyId.trim();
  const secretAccessKey = ENV.cloudflareSecretAccessKey.trim();
  const accountId = ENV.cloudflareAccountId.trim();
  const bucket = ENV.cloudflareR2Bucket.trim();
  
  // Log for debugging (without exposing full keys)
  console.log(`[Storage] Cloudflare R2 config - Account ID: ${accountId.substring(0, 8)}..., Access Key ID length: ${accessKeyId.length}, Bucket: ${bucket}`);
  
  return {
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    }),
    bucket: bucket,
    publicUrl: ENV.cloudflareR2PublicUrl?.trim(),
  };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  
  try {
    const { client, bucket, publicUrl } = getR2Client();
    const buffer = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);
    
    console.log(`[Storage] Using Cloudflare R2: bucket=${bucket}`);
    
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    
    await client.send(command);
    
    // Generate public URL or signed URL
    let url: string;
    
    // Priority 1: Custom public URL
    if (publicUrl) {
      url = `${publicUrl}/${key}`;
    }
    // Priority 2: Cloudflare R2 custom domain
    else if (ENV.cloudflareR2PublicUrl) {
      url = `${ENV.cloudflareR2PublicUrl}/${key}`;
    }
    // Priority 3: Generate signed URL (required for private access)
    else {
      console.log(`[Storage] Generating signed URL for Cloudflare R2...`);
      try {
        const getCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        });
        url = await getSignedUrl(client, getCommand, { expiresIn: 3600 * 24 * 7 }); // 7 days
        console.log(`[Storage] Cloudflare R2 generated signed URL (valid for 7 days)`);
      } catch (signError) {
        console.error(`[Storage] Failed to generate signed URL:`, signError);
        throw new Error(`Failed to generate Cloudflare R2 signed URL: ${signError instanceof Error ? signError.message : 'Unknown error'}. Please ensure R2 credentials are correct.`);
      }
    }
    
    console.log(`[Storage] Cloudflare R2 upload successful`);
    console.log(`[Storage] File URL: ${url.substring(0, 150)}...`);
    return { key, url };
  } catch (error) {
    console.error(`[Storage] Cloudflare R2 upload failed:`, error);
    throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const key = normalizeKey(relKey);
  
  try {
    const { client, bucket } = getR2Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    // Generate signed URL (valid for 1 hour)
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    
    return { key, url };
  } catch (error) {
    throw new Error(`Storage get failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
