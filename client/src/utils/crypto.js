/**
 * Zero-Knowledge Client-Side Encryption Utility using Web Crypto API
 * 
 * - PBKDF2 (100,000 iterations, SHA-256) for Master Key derivation
 * - AES-256-GCM for authenticated symmetric encryption & decryption
 */

// Helper: Convert hex string to Uint8Array
function hexToUint8Array(hexString) {
  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
  }
  const match = hexString.match(/.{1,2}/g) || [];
  return new Uint8Array(match.map(byte => parseInt(byte, 16)));
}

// Helper: Convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derive a 256-bit AES-GCM CryptoKey from master password and user salt using PBKDF2
 * @param {string} masterPassword 
 * @param {string} saltHex 
 * @returns {Promise<CryptoKey>}
 */
export async function deriveMasterKey(masterPassword, saltHex) {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(masterPassword);
  const saltBytes = hexToUint8Array(saltHex || '00112233445566778899aabbccddeeff');

  // Import raw password as PBKDF2 base key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-256-GCM key with 100,000 PBKDF2 iterations
  const masterKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // Non-extractable for security
    ['encrypt', 'decrypt']
  );

  return masterKey;
}

/**
 * Encrypt any JavaScript object using AES-256-GCM with a 12-byte random IV
 * @param {Object} dataObj 
 * @param {CryptoKey} masterKey 
 * @returns {Promise<{ encryptedData: string, iv: string }>}
 */
export async function encryptData(dataObj, masterKey) {
  const encoder = new TextEncoder();
  const jsonString = JSON.stringify(dataObj);
  const encodedPayload = encoder.encode(jsonString);

  // Generate random 12-byte initialization vector (nonce)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Perform AES-GCM encryption
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    masterKey,
    encodedPayload
  );

  return {
    encryptedData: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt base64-encoded ciphertext using AES-256-GCM and Master Key
 * @param {string} encryptedDataBase64 
 * @param {string} ivBase64 
 * @param {CryptoKey} masterKey 
 * @returns {Promise<Object>} Decrypted object payload
 */
export async function decryptData(encryptedDataBase64, ivBase64, masterKey) {
  const decoder = new TextDecoder();
  const encryptedBuffer = base64ToArrayBuffer(encryptedDataBase64);
  const ivBuffer = base64ToArrayBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    masterKey,
    encryptedBuffer
  );

  const jsonString = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonString);
}
