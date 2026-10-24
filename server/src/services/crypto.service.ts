import crypto from 'node:crypto';
import { config } from '../config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for AES-GCM

export class CryptoService {
  private key: Buffer;

  constructor(hexKey: string = config.DATA_KEY) {
    if (!hexKey || hexKey.length !== 64) {
      if (config.NODE_ENV === 'production') {
        throw new Error('FATAL: DATA_KEY must be a valid 64-character (32-byte) hex string in production');
      }
      this.key = crypto.createHash('sha256').update(hexKey || 'fallback-dev-key').digest();
    } else {
      this.key = Buffer.from(hexKey, 'hex');
    }
  }

  encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
    return `enc:v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;
    if (!encryptedText.startsWith('enc:v1:')) {
      // Legacy or unencrypted text fallback
      return encryptedText;
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 5) {
      throw new Error('Malformed encrypted ciphertext payload');
    }

    const [, , ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  encryptField(val: string | null | undefined): string | null {
    if (val === null || val === undefined) return null;
    return this.encrypt(val);
  }

  decryptField(val: string | null | undefined): string | null {
    if (val === null || val === undefined) return null;
    return this.decrypt(val);
  }
}

export const cryptoService = new CryptoService();
