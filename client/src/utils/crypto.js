// pbkdf2 key derivation - webcrypto API is kind of picky with array buffers
export async function deriveMasterKey(password, saltHex) {
  const enc = new TextEncoder();
  const rawSalt = new Uint8Array((saltHex.match(/.{1,2}/g) || []).map(b => parseInt(b, 16)));

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // 100k iterations works good enough for browser speed vs security balance
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: rawSalt, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptVaultItem(payloadObj, masterKey) {
  // console.log("encrypting payload:", payloadObj);
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const rawData = enc.encode(JSON.stringify(payloadObj));

  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    rawData
  );

  return {
    encryptedData: btoa(String.fromCharCode(...new Uint8Array(encryptedBuf))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

export async function decryptVaultItem(encryptedBase64, ivBase64, masterKey) {
  try {
    const encryptedBuf = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0)).buffer;
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

    const decryptedBuf = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      masterKey,
      encryptedBuf
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decryptedBuf));
  } catch (err) {
    // console.error("decryption failed bad password probably:", err);
    throw new Error('Failed to decrypt item. Wrong master key?');
  }
}
