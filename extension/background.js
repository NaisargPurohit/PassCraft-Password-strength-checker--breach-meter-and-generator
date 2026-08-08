// background service worker for extension
const API_BASE_URL = 'http://localhost:5000/api';

let unusedCache = null;

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'LOGIN': {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: request.email, password: request.password }),
          });
          const data = await res.json();
          if (res.ok) {
            await chrome.storage.local.set({
              token: data.token,
              user: data.user,
            });
            sendResponse({ success: true, user: data.user, token: data.token });
          } else {
            sendResponse({ success: false, error: data.error || 'Invalid credentials' });
          }
          break;
        }

        case 'REGISTER': {
          const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: request.email, password: request.password }),
          });
          const data = await res.json();
          if (res.ok) {
            await chrome.storage.local.set({
              token: data.token,
              user: data.user,
            });
            sendResponse({ success: true, user: data.user, token: data.token });
          } else {
            sendResponse({ success: false, error: data.error || 'Registration failed' });
          }
          break;
        }

        case 'GET_SESSION': {
          const session = await chrome.storage.local.get(['token', 'user']);
          sendResponse({ success: true, token: session.token, user: session.user });
          break;
        }

        case 'LOGOUT': {
          await chrome.storage.local.remove(['token', 'user']);
          if (chrome.storage.session) {
            await chrome.storage.session.remove(['masterPassword', 'salt']);
          }
          sendResponse({ success: true });
          break;
        }

        case 'FETCH_VAULT': {
          const { token } = await chrome.storage.local.get('token');
          if (!token) {
            sendResponse({ success: false, error: 'Not authenticated' });
            return;
          }

          const res = await fetch(`${API_BASE_URL}/vault`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            sendResponse({ success: true, items: data.items || [] });
          } else {
            const errData = await res.json();
            sendResponse({ success: false, error: errData.error || 'Failed to fetch vault' });
          }
          break;
        }

        case 'GET_ACTIVE_TAB_DOMAIN': {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url) {
            try {
              const url = new URL(tab.url);
              sendResponse({ success: true, domain: url.hostname, fullUrl: tab.url });
            } catch (e) {
              sendResponse({ success: false, domain: 'unknown', fullUrl: '' });
            }
          } else {
            sendResponse({ success: false, domain: 'unknown', fullUrl: '' });
          }
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (err) {
      console.error('Background SW error:', err);
      sendResponse({ success: false, error: 'Could not connect to PassCraft backend (http://localhost:5000)' });
    }
  })();

  return true; // Keep message channel open for async sendResponse
});
