// content script for autofill icon injection

// derive key using pbkdf2
async function deriveKey(masterPassword, saltHex) {
  const encoder = new TextEncoder();
  const hexBytes = new Uint8Array((saltHex.match(/.{1,2}/g) || []).map(b => parseInt(b, 16)));
  const baseKey = await window.crypto.subtle.importKey('raw', encoder.encode(masterPassword), { name: 'PBKDF2' }, false, ['deriveKey']);
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: hexBytes, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

async function decryptPayload(encryptedBase64, ivBase64, key) {
  const decoder = new TextDecoder();
  const encryptedBuf = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0)).buffer;
  const ivBuf = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const decryptedBuf = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuf }, key, encryptedBuf);
  return JSON.parse(decoder.decode(decryptedBuf));
}

let activeInput = null;
let activeIframe = null;

// Inject extension stylesheet into host page context if missing
function ensureExtensionStyles() {
  if (!document.getElementById('passcraft-injected-styles')) {
    const link = document.createElement('link');
    link.id = 'passcraft-injected-styles';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('styles.css');
    (document.head || document.documentElement).appendChild(link);
  }
}

// Scan & Inject PassCraft Icon into Input Fields
function scanAndInjectInputs() {
  ensureExtensionStyles();
  const inputs = document.querySelectorAll("input[type='password'], input[type='email'], input[type='text']");

  inputs.forEach((input) => {
    if (input.dataset.passcraftInjected) return;

    const nameOrId = `${input.name || ''} ${input.id || ''} ${input.placeholder || ''} ${input.type || ''}`.toLowerCase();
    const isLoginField = input.type === 'password' || /user|login|email|pass|auth|account/.test(nameOrId);

    if (!isLoginField) return;

    input.dataset.passcraftInjected = 'true';

    const wrapper = document.createElement('div');
    wrapper.className = 'passcraft-input-wrapper';

    const iconBtn = document.createElement('button');
    iconBtn.type = 'button';
    iconBtn.innerHTML = '🛡️';
    iconBtn.title = 'PassCraft Zero-Knowledge Autofill';
    iconBtn.className = 'passcraft-trigger-icon';

    iconBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      activeInput = input;
      openVaultIframe(input);
    });

    if (input.parentNode) {
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
      wrapper.appendChild(iconBtn);
    }
  });
}

// Open Floating Credential Selector Iframe
async function openVaultIframe(targetInput) {
  closeVaultIframe();
  ensureExtensionStyles();

  chrome.runtime.sendMessage({ action: 'GET_SESSION' }, async (sessionRes) => {
    if (!sessionRes || !sessionRes.success || !sessionRes.token) {
      alert('PassCraft: Please click the extension icon in your browser toolbar to unlock your vault first.');
      return;
    }

    let session = {};
    if (chrome.storage.session) {
      session = await chrome.storage.session.get(['masterPassword', 'salt']);
    }
    if (!session.masterPassword || !session.salt) {
      session = await chrome.storage.local.get(['masterPassword', 'salt']);
    }

    if (!session.masterPassword || !session.salt) {
      alert('PassCraft: Vault locked. Please open the extension popup and sign in to unlock your vault.');
      return;
    }

    chrome.runtime.sendMessage({ action: 'FETCH_VAULT' }, async (vaultRes) => {
      if (!vaultRes || !vaultRes.success) {
        alert('PassCraft: Could not fetch vault entries.');
        return;
      }

      const masterKey = await deriveKey(session.masterPassword, session.salt);
      const decryptedItems = [];

      for (const item of vaultRes.items || []) {
        try {
          const payload = await decryptPayload(item.encryptedData, item.iv, masterKey);
          decryptedItems.push({
            id: item._id,
            title: payload.title || payload.url || 'Untitled',
            url: payload.url || '',
            username: payload.username || '',
            password: payload.password || '',
          });
        } catch (e) {
          console.error('Decryption failed for item:', item._id);
        }
      }

      const rect = targetInput.getBoundingClientRect();
      activeIframe = document.createElement('iframe');
      activeIframe.src = chrome.runtime.getURL('iframe.html');
      activeIframe.className = 'passcraft-iframe-overlay';
      activeIframe.style.top = `${Math.min(window.innerHeight - 320, rect.bottom + 6)}px`;
      activeIframe.style.left = `${Math.min(window.innerWidth - 320, rect.left)}px`;

      document.body.appendChild(activeIframe);

      activeIframe.onload = () => {
        activeIframe.contentWindow.postMessage(
          {
            type: 'PASSCRAFT_INIT_DATA',
            currentDomain: window.location.hostname,
            items: decryptedItems,
          },
          '*'
        );
      };
    });
  });
}

function closeVaultIframe() {
  if (activeIframe) {
    activeIframe.remove();
    activeIframe = null;
  }
}

// Listen for messages from injected iframe
window.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'PASSCRAFT_CLOSE_IFRAME') {
    closeVaultIframe();
  }

  if (event.data.type === 'PASSCRAFT_AUTOFILL') {
    const { username, password } = event.data;

    if (activeInput) {
      const form = activeInput.closest('form') || document;

      const pwdInput = activeInput.type === 'password'
        ? activeInput
        : form.querySelector("input[type='password']");

      const userInput = activeInput.type !== 'password'
        ? activeInput
        : form.querySelector("input[type='email'], input[type='text']");

      if (pwdInput && password) {
        pwdInput.value = password;
        pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
        pwdInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (userInput && username) {
        userInput.value = username;
        userInput.dispatchEvent(new Event('input', { bubbles: true }));
        userInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    closeVaultIframe();
  }
});

scanAndInjectInputs();

const observer = new MutationObserver(() => {
  requestAnimationFrame(scanAndInjectInputs);
});
observer.observe(document.body, { childList: true, subtree: true });
