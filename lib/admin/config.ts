import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const ENCRYPTED_KEYS = ["ai_api_key"];

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not configured");
  }
  return crypto.scryptSync(secret, "soalatihan-salt", KEY_LENGTH);
}

export function encryptValue(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptValue(ciphertext: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(ciphertext, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function shouldEncrypt(key: string): boolean {
  return ENCRYPTED_KEYS.includes(key);
}

export interface ConfigEntry {
  key: string;
  value: string;
  isEncrypted: boolean;
}

export async function getAllConfig(): Promise<ConfigEntry[]> {
  const configs = await prisma.appConfig.findMany({
    select: { key: true, value: true, isEncrypted: true },
    orderBy: { key: "asc" },
  });

  return configs.map((c) => ({
    key: c.key,
    value: c.isEncrypted ? decryptValue(c.value) : c.value,
    isEncrypted: c.isEncrypted,
  }));
}

export async function getConfigValue(key: string): Promise<string | null> {
  const config = await prisma.appConfig.findUnique({
    where: { key },
    select: { value: true, isEncrypted: true },
  });

  if (!config) return null;

  return config.isEncrypted ? decryptValue(config.value) : config.value;
}

export interface ConfigUpdate {
  key: string;
  value: string;
}

export async function upsertConfig(update: ConfigUpdate): Promise<void> {
  const isEncrypted = shouldEncrypt(update.key);
  const storedValue = isEncrypted ? encryptValue(update.value) : update.value;

  await prisma.appConfig.upsert({
    where: { key: update.key },
    update: { value: storedValue, isEncrypted },
    create: { key: update.key, value: storedValue, isEncrypted },
  });
}

export async function upsertManyConfig(updates: ConfigUpdate[]): Promise<void> {
  await Promise.all(updates.map((u) => upsertConfig(u)));
}

export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  systemPrompt: string;
}

export async function getAIConfig(): Promise<AIConfig> {
  const [apiKey, baseUrl, systemPrompt] = await Promise.all([
    getConfigValue("ai_api_key"),
    getConfigValue("ai_base_url"),
    getConfigValue("ai_system_prompt"),
  ]);

  return {
    apiKey: apiKey || "",
    baseUrl: baseUrl || "",
    systemPrompt: systemPrompt || "",
  };
}

export interface ExamConfig {
  defaultBatchSize: number;
  defaultTimerEnabled: boolean;
  defaultTimerDuration: number;
}

export async function getExamConfig(): Promise<ExamConfig> {
  const [batchSize, timerEnabled, timerDuration] = await Promise.all([
    getConfigValue("exam_default_batch_size"),
    getConfigValue("exam_default_timer_enabled"),
    getConfigValue("exam_default_timer_duration"),
  ]);

  return {
    defaultBatchSize: batchSize ? parseInt(batchSize, 10) : 10,
    defaultTimerEnabled: timerEnabled === "true",
    defaultTimerDuration: timerDuration ? parseInt(timerDuration, 10) : 30,
  };
}
