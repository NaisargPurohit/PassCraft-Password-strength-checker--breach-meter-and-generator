// ==========================================
// 1. DOM ELEMENT SELECTION
// ==========================================
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

// Checklist DOM elements
const chks = {
  length: document.getElementById('chk-length'),
  upper: document.getElementById('chk-upper'),
  lower: document.getElementById('chk-lower'),
  number: document.getElementById('chk-number'),
  special: document.getElementById('chk-special'),
};

// Generator DOM elements
const genBtn = document.getElementById('gen-btn');
const genPass = document.getElementById('gen-pass');
const copyBtn = document.getElementById('copy-btn');

// ==========================================
// 2. TOGGLE PASSWORD VISIBILITY (EYE BUTTON)
// ==========================================
toggleBtn.addEventListener('click', () => {
  const isHide = pwdInput.type === 'password';
  pwdInput.type = isHide ? 'text' : 'password';
  toggleBtn.textContent = isHide ? '🙈' : '👁️';
});

// ==========================================
// 3. TYPING LISTENER WITH DEBOUNCE TIMER
// ==========================================
let timer;
pwdInput.addEventListener('input', () => {
  // Clear previous timer to reset countdown
  clearTimeout(timer);
  const val = pwdInput.value;

  // If input is empty, reset the UI to default state
  if (!val) {
    resetUI();
    return;
  }

  // Set a 300ms countdown. If the user stops typing for 300ms, send to Flask.
  timer = setTimeout(async () => {
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: val })
      });
      if (res.ok) {
        const data = await res.json();
        updateUI(data);
      }
    } catch (err) {
      console.error("Could not connect to Flask backend:", err);
    }
  }, 300);
});

// ==========================================
// 4. DYNAMIC UI UPDATES WITH FLASK RESPONSE
// ==========================================
function updateUI(data) {
  // A. Update Strength Label & Color
  strengthText.textContent = data.strength;
  const colors = ['#ef4444', '#ef4444', '#f97316', '#eab308', '#22c55e', '#2563eb'];
  const textColors = ['label-weak', 'label-weak', 'label-fair', 'label-good', 'label-strong', 'label-excellent'];
  
  strengthText.className = `strength-text ${textColors[data.score]}`;
  strengthText.style.color = colors[data.score];

  // B. Fill/Color the 5 Strength Meter Bars
  bars.forEach((bar, i) => {
    bar.style.backgroundColor = i < data.score ? colors[data.score] : '#e2e8f0';
  });

  // C. Update checklist items (Green check or Red X)
  for (const key in chks) {
    const passed = data.checks[key];
    chks[key].className = `chk ${passed ? 'ok' : ''}`;
    chks[key].textContent = `${passed ? '✅' : '❌'} ${chks[key].textContent.slice(2)}`;
  }

  // D. Show Entropy & Crack Time Gauges
  stats.classList.remove('hidden');
  entropyText.textContent = `${data.entropy} bits`;
  
  // Custom crack-time feedback based on entropy
  if (data.entropy < 30) {
    crackText.textContent = 'Instantly';
  } else if (data.entropy < 50) {
    crackText.textContent = 'Minutes';
  } else if (data.entropy < 75) {
    crackText.textContent = 'Years';
  } else {
    crackText.textContent = 'Centuries';
  }

  // E. Handle Breach Warning Alerts
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

  // F. Show/Hide Recommendations suggestions
  if (data.suggestions.length > 0) {
    tipsBox.classList.remove('hidden');
    tipsList.innerHTML = data.suggestions.map(tip => `<li>${tip}</li>`).join('');
  } else {
    tipsBox.classList.add('hidden');
  }
}

// ==========================================
// 5. RESET UI TO DEFAULT EMPTY STATE
// ==========================================
function resetUI() {
  strengthText.textContent = 'Empty';
  strengthText.style.color = '#94a3b8';
  bars.forEach(bar => bar.style.backgroundColor = '#e2e8f0');
  stats.classList.add('hidden');
  breachAlert.classList.add('hidden');
  tipsBox.classList.add('hidden');

  // Reset checklist items back to Red X
  const labels = { 
    length: '8+ Characters', 
    upper: 'Uppercase (A-Z)', 
    lower: 'Lowercase (a-z)', 
    number: 'Numbers (0-9)', 
    special: 'Symbols (!@#$%)' 
  };
  for (const key in chks) {
    chks[key].className = 'chk';
    chks[key].textContent = `❌ ${labels[key]}`;
  }
}

// ==========================================
// 6. PASSPHRASE GENERATOR & COPY TO CLIPBOARD
// ==========================================
genBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/generate');
    if (res.ok) {
      const data = await res.json();
      genPass.value = data.password;
      copyBtn.disabled = false;
      copyBtn.textContent = 'Copy';
    }
  } catch (err) {
    console.error("Could not generate passphrase:", err);
  }
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(genPass.value);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyBtn.textContent = 'Copy';
  }, 1500);
});