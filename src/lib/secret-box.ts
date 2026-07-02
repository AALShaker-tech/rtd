import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Symmetric encryption for settings stored in the DB (e.g. API keys / SMTP
 * password). The key is derived from AUTH_SECRET, so ciphertext is useless
 * without the app's secret. Format: `v1:<iv>:<tag>:<ciphertext>` (all base64),
 * AES-256-GCM.
 */

function key(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHash("sha256").update(secret).digest(); // 32 bytes
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const [v, ivb, tagb, ctb] = payload.split(":");
  if (v !== "v1" || !ivb || !tagb || !ctb) throw new Error("Unrecognized secret format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivb, "base64"));
  decipher.setAuthTag(Buffer.from(tagb, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctb, "base64")), decipher.final()]).toString(
    "utf8",
  );
}
