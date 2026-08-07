import express from 'express';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

// ==========================================
// 1. LOCAL DICTIONARY OF COMMON PASSWORDS
// ==========================================
const COMMON_PASSWORDS = new Set([
  '123456', 'password', '123456789', 'qwerty', 'admin', 'welcome', 'letmein'
]);

// ==========================================
// 2. ENTROPY MATHEMATICS (L * log2(R))
// ==========================================
function getEntropy(pwd) {
  let pool = 0;
  if (/[a-z]/.test(pwd)) pool += 26;
  if (/[A-Z]/.test(pwd)) pool += 26;
  if (/[0-9]/.test(pwd)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pwd)) pool += 33;

  return pool > 0 ? Math.round(pwd.length * Math.log2(pool)) : 0;
}

// ==========================================
// 3. K-ANONYMITY BREACH CHECK (PWNED PASSWORDS API)
// ==========================================
async function checkBreach(pwd) {
  // Hash password using SHA-1 (uppercase)
  const sha1 = crypto.createHash('sha1').update(pwd).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    // Zero-Knowledge Privacy: send only 5-character prefix
    const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`, {
      timeout: 3000
    });

    if (response.status === 200) {
      const lines = response.data.split('\r\n');
      for (const line of lines) {
        const [h, count] = line.split(':');
        if (h === suffix) {
          return { isBreached: true, breachCount: parseInt(count, 10) };
        }
      }
    }
  } catch (err) {
    // Fail silently if offline or API unreachable
  }
  return { isBreached: false, breachCount: 0 };
}

// ==========================================
// 4. API ENDPOINT: PASSWORD STRENGTH CHECK
// ==========================================
router.post('/check', async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: 'Empty password' });
  }

  // A. Checklist Rules
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  // B. Calculate Score (0 to 5)
  let score = Object.values(checks).filter(Boolean).length;

  // C. Check Local Dictionary
  const isCommon = COMMON_PASSWORDS.has(password.toLowerCase().trim());
  if (isCommon) {
    score = 1; // Force score to Weak (1) if common password
  }

  // D. Generate Recommendations
  const suggestions = [];
  if (password.length < 8) suggestions.push('Make it 8 or more characters long.');
  if (!checks.upper) suggestions.push('Add an uppercase letter (A-Z).');
  if (!checks.lower) suggestions.push('Add a lowercase letter (a-z).');
  if (!checks.number) suggestions.push('Add a number (0-9).');
  if (!checks.special) suggestions.push('Add a symbol (!@#$%).');
  if (isCommon) suggestions.push('This is a highly common password. Choose something unique.');

  // E. Check Online Leaks
  const { isBreached, breachCount } = await checkBreach(password);

  const ratings = { 0: 'Weak', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong', 5: 'Excellent' };

  return res.json({
    score,
    strength: isCommon ? 'Very Weak (Common)' : (ratings[score] || 'Weak'),
    entropy: getEntropy(password),
    checks,
    suggestions,
    is_common: isCommon,
    is_breached: isBreached,
    breach_count: breachCount
  });
});

// ==========================================
// 5. API ENDPOINT: PASSPHRASE GENERATOR
// ==========================================
router.get('/generate', (req, res) => {
  const adjs = ['Blue', 'Swift', 'Bright', 'Silent', 'Golden', 'Clever', 'Secure', 'Wild'];
  const nouns = ['River', 'Mountain', 'Falcon', 'Shield', 'Forest', 'Ocean', 'Castle', 'Haven'];

  const randomAdj = adjs[Math.floor(Math.random() * adjs.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 90) + 10; // 10 - 99

  const passphrase = `${randomAdj}${randomNoun}${randomNum}!`;
  return res.json({ password: passphrase });
});

export default router;
