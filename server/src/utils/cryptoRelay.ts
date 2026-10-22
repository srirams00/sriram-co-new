import crypto from 'crypto';

const RELAY_SECRET = process.env.EMAIL_RELAY_SECRET || 'src_sec_8f93b2a1c0d45e67a9b8c7d6e5f4a3b2';
const KEY = crypto.createHash('sha256').update(RELAY_SECRET).digest();

export function encryptPayload(payload: object): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptPayload(encryptedStr: string): any {
  const [ivHex, authTagHex, encryptedData] = encryptedStr.split(':');
  if (!ivHex || !authTagHex || !encryptedData) {
    throw new Error('Invalid encrypted payload format');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}
