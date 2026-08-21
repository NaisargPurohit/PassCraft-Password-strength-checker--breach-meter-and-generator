// const oldIvLen = 16;

export async function deriveMasterKey(masterSecret, hexSalt) {
  const enc = new TextEncoder();
  // Note: WebCrypto requires raw ArrayBuffers for PBKDF2 salt, do not pass base64 directly here
  const rawSalt = new Uint8Array((hexSalt.match(/.{1,2}/g) ?? []).map(b => parseInt(b, 16)));

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(masterSecret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: rawSalt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptVaultItem(payload, masterKey) {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const rawBytes = enc.encode(JSON.stringify(payload));

  const cipherBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    rawBytes
  );

  return {
    encryptedData: btoa(String.fromCharCode(...new Uint8Array(cipherBuf))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

export async function decryptVaultItem(b64Cipher, b64Iv, masterKey) {
  try {
    const cipherBuf = Uint8Array.from(atob(b64Cipher), c => c.charCodeAt(0)).buffer;
    const iv = Uint8Array.from(atob(b64Iv), c => c.charCodeAt(0));

    const plainBuf = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      masterKey,
      cipherBuf
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(plainBuf));
  } catch (err) {
    console.error("[WebCrypto] AES-GCM item decryption failed:", err);
    throw new Error('Decryption failure: invalid payload or key mismatch');
  }
}

export const encryptData = encryptVaultItem;
export const decryptData = decryptVaultItem;

