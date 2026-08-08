// const oldModulus = 1024;

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(b64) {
  const binary = window.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function generateRSAKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportPublicKey(key) {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exported);
}

export async function importPublicKey(b64) {
  const buf = base64ToArrayBuffer(b64);
  return await window.crypto.subtle.importKey(
    'spki',
    buf,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ['encrypt']
  );
}

// TODO: optimize array buffer conversions
export async function encryptWithRSA(payload, pubKey) {
  const enc = new TextEncoder();
  const data = enc.encode(payload);

  const buf = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    pubKey,
    data
  );

  return arrayBufferToBase64(buf);
}

export async function decryptWithRSA(data, privKey) {
  const dec = new TextDecoder();
  const buf = base64ToArrayBuffer(data);

  const res = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privKey,
    buf
  );

  return dec.decode(res);
}
