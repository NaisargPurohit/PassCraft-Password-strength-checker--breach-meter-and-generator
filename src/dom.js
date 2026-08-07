/**
 * PassCraft DOM Manipulation & UI Updater
 * Handles element binding, rendering metrics, and event listeners.
 */

import { checkPasswordStrength, generatePassphrase } from './api.js';
import { getState, setState, subscribe } from './state.js';

let timer = null;

// TODO: add clipboard notification toast UI feedback on copy action

export function initDOM() {
  const pwdInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle');
  const genBtn = document.getElementById('gen-btn');
  const genPass = document.getElementById('gen-pass');
  const copyBtn = document.getElementById('copy-btn');

  if (!pwdInput) return;

  toggleBtn?.addEventListener('click', () => {
    const currentState = getState();
    setState({ isPlaintextVisible: !currentState.isPlaintextVisible });
  });

  pwdInput.addEventListener('input', () => {
    clearTimeout(timer);
    const val = pwdInput.value;
    setState({ candidatePassword: val });

    if (!val) {
      setState({ analysisData: null });
      resetUI();
      return;
    }

    timer = setTimeout(async () => {
      try {
        const data = await checkPasswordStrength(val);
        setState({ analysisData: data });
      } catch (err) {
        console.error('Password telemetry error:', err);
      }
    }, 300);
  });

  genBtn?.addEventListener('click', async () => {
    try {
      const pass = await generatePassphrase();
      setState({ generatedPassphrase: pass });
      if (genPass) genPass.value = pass;
      if (copyBtn) {
        copyBtn.disabled = false;
        copyBtn.textContent = 'Copy';
      }
    } catch (err) {
      console.error('Passphrase generation failed:', err);
    }
  });

  copyBtn?.addEventListener('click', () => {
    if (!genPass?.value) return;
    navigator.clipboard.writeText(genPass.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy';
    }, 1500);
  });

  // Subscribe DOM elements to state updates
  subscribe(renderUI);
}

function renderUI(currentState) {
  const pwdInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle');
  const strengthText = document.getElementById('strength');
  const bars = document.querySelectorAll('.bar');
  const stats = document.getElementById('stats');
  const entropyText = document.getElementById('entropy');
  const crackText = document.getElementById('crack-time');
  const breachAlert = document.getElementById('breach');
  const tipsBox = document.getElementById('tips-box');
  const tipsList = document.getElementById('tips-list');

  if (pwdInput && toggleBtn) {
    pwdInput.type = currentState.isPlaintextVisible ? 'text' : 'password';
    toggleBtn.textContent = currentState.isPlaintextVisible ? '🙈' : '👁️';
  }

  const data = currentState.analysisData;
  if (!data) return;

  if (strengthText) {
    const colors = ['#ef4444', '#ef4444', '#f97316', '#eab308', '#22c55e', '#2563eb'];
    const textColors = ['label-weak', 'label-weak', 'label-fair', 'label-good', 'label-strong', 'label-excellent'];

    strengthText.textContent = data.strength;
    strengthText.className = `strength-text ${textColors[data.score] || 'label-weak'}`;
    strengthText.style.color = colors[data.score] || '#ef4444';

    bars.forEach((bar, i) => {
      bar.style.backgroundColor = i < data.score ? colors[data.score] : '#e2e8f0';
    });
  }

  if (stats && entropyText && crackText) {
    stats.classList.remove('hidden');
    entropyText.textContent = `${data.entropy} bits`;

    if (data.entropy < 30) crackText.textContent = 'Instantly';
    else if (data.entropy < 50) crackText.textContent = 'Minutes';
    else if (data.entropy < 75) crackText.textContent = 'Years';
    else crackText.textContent = 'Centuries';
  }

  if (breachAlert) {
    breachAlert.classList.remove('hidden');
    if (data.is_breached) {
      breachAlert.className = 'alert alert-danger';
      breachAlert.innerHTML = `⚠️ Leaked! Found in <strong>${data.breach_count.toLocaleString()}</strong> public breaches. Do not use!`;
    } else if (data.is_common) {
      breachAlert.className = 'alert alert-danger';
      breachAlert.textContent = '⚠️ Common password! Easily guessed by dictionary attacks.';
    } else {
      breachAlert.className = 'alert alert-success';
      breachAlert.textContent = '🛡️ Safe! Not found in any known public database breaches.';
    }
  }

  if (tipsBox && tipsList) {
    if (data.suggestions && data.suggestions.length > 0) {
      tipsBox.classList.remove('hidden');
      tipsList.innerHTML = data.suggestions.map(tip => `<li>${tip}</li>`).join('');
    } else {
      tipsBox.classList.add('hidden');
    }
  }
}

export function resetUI() {
  const strengthText = document.getElementById('strength');
  const bars = document.querySelectorAll('.bar');
  const stats = document.getElementById('stats');
  const breachAlert = document.getElementById('breach');
  const tipsBox = document.getElementById('tips-box');

  if (strengthText) {
    strengthText.textContent = 'Empty';
    strengthText.style.color = '#94a3b8';
  }

  bars.forEach(bar => (bar.style.backgroundColor = '#e2e8f0'));
  stats?.classList.add('hidden');
  breachAlert?.classList.add('hidden');
  tipsBox?.classList.add('hidden');
}
