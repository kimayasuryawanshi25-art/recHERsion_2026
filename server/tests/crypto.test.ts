import { describe, it, expect } from 'vitest';
import { CryptoService } from '../src/services/crypto.service.js';

describe('CryptoService — AES-256-GCM Field Encryption', () => {
  const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const service = new CryptoService(testKey);

  it('encrypts and decrypts sensitive text round-trip', () => {
    const sensitive = 'Took 400mg ibuprofen for severe lower back pain and fatigue';
    const ciphertext = service.encrypt(sensitive);

    expect(ciphertext).toBeDefined();
    expect(ciphertext).not.toBe(sensitive);
    expect(ciphertext.startsWith('enc:v1:')).toBe(true);

    const decrypted = service.decrypt(ciphertext);
    expect(decrypted).toBe(sensitive);
  });

  it('handles null and undefined fields properly', () => {
    expect(service.encryptField(null)).toBeNull();
    expect(service.encryptField(undefined)).toBeNull();
    expect(service.decryptField(null)).toBeNull();
    expect(service.decryptField(undefined)).toBeNull();
  });

  it('produces distinct ciphertexts for identical plaintexts (due to unique IVs)', () => {
    const text = 'Repeat check-in note';
    const c1 = service.encrypt(text);
    const c2 = service.encrypt(text);

    expect(c1).not.toBe(c2);
    expect(service.decrypt(c1)).toBe(text);
    expect(service.decrypt(c2)).toBe(text);
  });

  it('detects tampering or corruption in ciphertext or auth tag', () => {
    const original = 'Confidential symptoms list';
    const ciphertext = service.encrypt(original);
    const parts = ciphertext.split(':');

    // Tamper with the ciphertext byte
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}:${parts[4].slice(0, -2)}ff`;
    expect(() => service.decrypt(tampered)).toThrow();
  });
});
