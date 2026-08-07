document.addEventListener('DOMContentLoaded', async () => {
  const authView = document.getElementById('auth-view');
  const vaultView = document.getElementById('vault-view');
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');
  const toggleAuthMode = document.getElementById('toggle-auth-mode');
  const errorMsg = document.getElementById('error-msg');
  const userEmailSpan = document.getElementById('user-email');
  const logoutBtn = document.getElementById('logout-btn');

  let isRegisterMode = false;

  // Toggle Auth Mode (Login vs Register)
  toggleAuthMode.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    hideError();

    if (isRegisterMode) {
      loginBtn.textContent = 'Create Account & Unlock';
      toggleAuthMode.textContent = 'Already have an account? Sign In';
    } else {
      loginBtn.textContent = 'Unlock Vault';
      toggleAuthMode.textContent = "Don't have an account? Register";
    }
  });

  // Check current session on open
  chrome.runtime.sendMessage({ action: 'GET_SESSION' }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('Get session error:', chrome.runtime.lastError.message);
      showAuthView();
      return;
    }
    if (response && response.success && response.token && response.user) {
      showVaultView(response.user.email);
    } else {
      showAuthView();
    }
  });

  // Handle Login / Register Form Submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Please enter both email and master password.');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = isRegisterMode ? 'Registering Account...' : 'Unlocking Vault...';

    const action = isRegisterMode ? 'REGISTER' : 'LOGIN';

    chrome.runtime.sendMessage(
      { action, email, password },
      (response) => {
        loginBtn.disabled = false;
        loginBtn.textContent = isRegisterMode ? 'Create Account & Unlock' : 'Unlock Vault';

        if (chrome.runtime.lastError) {
          showError(`Extension Error: ${chrome.runtime.lastError.message}`);
          return;
        }

        if (response && response.success && response.user) {
          // Store Master Password and Salt in session for client-side Web Crypto decryption
          if (chrome.storage.session) {
            chrome.storage.session.set({ masterPassword: password, salt: response.user.salt });
          } else {
            chrome.storage.local.set({ masterPassword: password, salt: response.user.salt });
          }
          showVaultView(response.user.email);
        } else {
          let errText = response ? response.error : 'Authentication failed';
          if (!isRegisterMode && (errText.includes('Invalid credentials') || errText.includes('user not found'))) {
            errText = 'Account not found or password incorrect. If this is your first time, click "Register" below to create your account.';
          }
          showError(errText);
        }
      }
    );
  });

  // Handle Logout
  logoutBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'LOGOUT' }, () => {
      showAuthView();
    });
  });

  function showAuthView() {
    authView.classList.remove('hidden');
    vaultView.classList.add('hidden');
  }

  function showVaultView(email) {
    userEmailSpan.textContent = email;
    authView.classList.add('hidden');
    vaultView.classList.remove('hidden');
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  }

  function hideError() {
    errorMsg.classList.add('hidden');
  }
});
