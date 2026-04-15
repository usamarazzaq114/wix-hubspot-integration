import crypto from "node:crypto";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const memorySecrets = new Map<string, string>();

function getSecret(): string {
  const value = process.env.APP_ENCRYPTION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("APP_ENCRYPTION_SECRET must be set and at least 32 chars.");
  }
  return value;
}

function encrypt(value: string): string {
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash("sha256").update(getSecret()).digest();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${encrypted.toString("hex")}`;
}

function decrypt(value: string): string {
  const [ivHex, tagHex, bodyHex] = value.split(".");
  const key = crypto.createHash("sha256").update(getSecret()).digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const text = Buffer.concat([decipher.update(Buffer.from(bodyHex, "hex")), decipher.final()]);
  return text.toString("utf8");
}

export const tokenManager = {
  store(instanceId: string, tokens: StoredTokens): void {
    const blob = encrypt(JSON.stringify(tokens));
    memorySecrets.set(`hubspot-tokens-${instanceId}`, blob);
  },
  remove(instanceId: string): void {
    memorySecrets.delete(`hubspot-tokens-${instanceId}`);
  },
  get(instanceId: string): StoredTokens | null {
    const value = memorySecrets.get(`hubspot-tokens-${instanceId}`);
    if (!value) return null;
    return JSON.parse(decrypt(value)) as StoredTokens;
  }
};
