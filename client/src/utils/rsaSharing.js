/**
 * RSA-OAEP Cryptographic Sharing Utility using Web Crypto API
 * Enables secure team password sharing without revealing the sender's Master Key.
 */

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a 2048-bit RSA-OAEP Key Pair for asymmetric user encryption
 * @returns {Promise<CryptoKeyPair>}
 */
export async function generateRSAKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export Public Key to Base64 SPKI format
 * @param {CryptoKey} publicKey
 * @returns {Promise<string>}
 */
export async function exportPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import Base64 SPKI string as RSA-OAEP Public Key
 * @param {string} spkiBase64
 * @returns {Promise<CryptoKey>}
 */
export async function importPublicKey(spkiBase64) {
  const buffer = base64ToArrayBuffer(spkiBase64);
  return await window.crypto.subtle.importKey(
    'spki',
    buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}

/**
 * Encrypt a raw AES key string/bytes using recipient's RSA Public Key
 * @param {string} payload - Serialized secret or key payload
 * @param {CryptoKey} recipientPublicKey
 * @returns {Promise<string>} Base64 encrypted key
 */
export async function encryptWithRSA(payload, recipientPublicKey) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(payload);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPublicKey,
    encoded
  );

  return arrayBufferToBase64(encryptedBuffer);
}

/**
 * Decrypt RSA-encrypted payload using user's RSA Private Key
 * @param {string} encryptedBase64
 * @param {CryptoKey} userPrivateKey
 * @returns {Promise<string>} Decrypted secret payload
 */
export async function decryptWithRSA(encryptedBase64, userPrivateKey) {
  const decoder = new TextDecoder();
  const buffer = base64ToArrayBuffer(encryptedBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    userPrivateKey,
    buffer
  );

  return decoder.decode(decryptedBuffer);
}
