import { getSyncMeta, setSyncMeta } from '../db';

const PIN_META_KEY = 'app_pin_security';

interface PinConfig {
  enabled: boolean;
  saltHex: string;
  hashHex: string;
  autoLockMinutes: number;
}

let isAppLocked = false;
let lastActiveTimestamp = Date.now();

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function derivePinHash(pin: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufferToHex(derivedBits);
}

export const pinLockService = {
  async isPinEnabled(): Promise<boolean> {
    const config = await getSyncMeta<PinConfig>(PIN_META_KEY);
    return Boolean(config && config.enabled);
  },

  async setPin(pin: string, autoLockMinutes = 5): Promise<void> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hashHex = await derivePinHash(pin, salt);
    const config: PinConfig = {
      enabled: true,
      saltHex: bufferToHex(salt.buffer),
      hashHex,
      autoLockMinutes,
    };
    await setSyncMeta(PIN_META_KEY, config);
    isAppLocked = false;
    lastActiveTimestamp = Date.now();
  },

  async verifyPin(pin: string): Promise<boolean> {
    const config = await getSyncMeta<PinConfig>(PIN_META_KEY);
    if (!config || !config.enabled) return true;

    const salt = hexToBytes(config.saltHex);
    const candidateHash = await derivePinHash(pin, salt);
    return candidateHash === config.hashHex;
  },

  async disablePin(): Promise<void> {
    await setSyncMeta(PIN_META_KEY, { enabled: false, saltHex: '', hashHex: '', autoLockMinutes: 5 });
    isAppLocked = false;
  },

  isCurrentlyLocked(): boolean {
    return isAppLocked;
  },

  lock(): void {
    isAppLocked = true;
  },

  async unlock(pin: string): Promise<boolean> {
    const valid = await this.verifyPin(pin);
    if (valid) {
      isAppLocked = false;
      lastActiveTimestamp = Date.now();
      return true;
    }
    return false;
  },

  recordUserActivity(): void {
    lastActiveTimestamp = Date.now();
  },

  async checkInactivityTimeout(): Promise<boolean> {
    const config = await getSyncMeta<PinConfig>(PIN_META_KEY);
    if (!config || !config.enabled) return false;

    const timeoutMs = (config.autoLockMinutes || 5) * 60 * 1000;
    const elapsed = Date.now() - lastActiveTimestamp;
    if (elapsed >= timeoutMs && !isAppLocked) {
      isAppLocked = true;
      return true;
    }
    return isAppLocked;
  },
};
