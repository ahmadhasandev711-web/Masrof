import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type UploadFolder = "blog" | "receipts" | "branding";

export type StoredObject = {
  /** Public URL or site-relative path returned to clients */
  url: string;
  key: string;
};

function isObjectStorageConfigured(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_PUBLIC_BASE_URL,
  );
}

function getS3Client(): S3Client {
  const region = process.env.S3_REGION || "auto";
  const endpoint = process.env.S3_ENDPOINT;
  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

function publicUrlForKey(key: string): string {
  const base = process.env.S3_PUBLIC_BASE_URL!.replace(/\/$/, "");
  return `${base}/${key}`;
}

/**
 * Persists a binary object. Uses S3-compatible storage (R2/S3) when configured;
 * otherwise falls back to `public/uploads` (local/Hostinger without object storage).
 */
export async function storePublicObject(input: {
  folder: UploadFolder;
  filename: string;
  body: Buffer;
  contentType: string;
}): Promise<StoredObject> {
  const key = `${input.folder}/${input.filename}`;

  if (isObjectStorageConfigured()) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return { url: publicUrlForKey(key), key };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", input.folder);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, input.filename), input.body);
  return { url: `/uploads/${key}`, key };
}

export function usesObjectStorage(): boolean {
  return isObjectStorageConfigured();
}
