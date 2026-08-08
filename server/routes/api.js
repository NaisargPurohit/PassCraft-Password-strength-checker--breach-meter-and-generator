import crypto from "crypto";
import express from 'express';
import axios from "axios";

const router = express.Router();

const COMMON_PASSWORDS = new Set([
  '123456', "password", '123456789', "qwerty", 'admin', 'welcome', 'letmein'
]);

function getEntropy(pwd) {
  let pool = 0;
  if (/[a-z]/.test(pwd)) pool += 26;
  if (/[A-Z]/.test(pwd)) pool += 26;
  if (/[0-9]/.test(pwd)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pwd)) pool += 33;
  return pool > 0 ? Math.round(pwd.length * Math.log2(pool)) : 0;
}

// const oldCheck = (pwd) => pwd && pwd.length >= 8;

async function checkBreach(pwd) {
  const sha1 = crypto.createHash("sha1").update(pwd).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    // Note: Range API returns all matching 35-char suffixes for the 5-char SHA1 prefix
    const rangeRes = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`, { timeout: 3000 });
    if (rangeRes.status !== 200) return { isBreached: false, breachCount: 0 };

    const lines = rangeRes.data.split("\r\n");
    for (const line of lines) {
      const [h, count] = line.split(":");
      if (h === suffix) {
        return { isBreached: true, breachCount: parseInt(count, 10) };
      }
    }
  } catch (err) {
    console.error('[API Check] HIBP range API transport failed:', err.message);
  }
  return { isBreached: false, breachCount: 0 };
}

router.post('/check', async (req, res) => {
  const pwd = (req.body?.password ?? '').trim();
  if (!pwd) {
    return res.status(400).json({ error: "Empty password" });
  }

  const checks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd)
  };

  let score = Object.values(checks).filter(Boolean).length;
  const isCommon = COMMON_PASSWORDS.has(pwd.toLowerCase());
  if (isCommon) score = 1;

  const suggestions = [];
  if (pwd.length < 8) suggestions.push('Make it 8 or more characters long.');
  if (!checks.upper) suggestions.push('Add an uppercase letter (A-Z).');
  if (!checks.lower) suggestions.push('Add a lowercase letter (a-z).');
  if (!checks.number) suggestions.push('Add a number (0-9).');
  if (!checks.special) suggestions.push('Add a symbol (!@#$%).');
  if (isCommon) suggestions.push('This is a highly common password. Choose something unique.');

  const breachReport = await checkBreach(pwd);
  const ratings = { 0: 'Weak', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong', 5: 'Excellent' };

  return res.json({
    score,
    strength: isCommon ? "Very Weak (Common)" : (ratings[score] ?? 'Weak'),
    entropy: getEntropy(pwd),
    checks,
    suggestions,
    is_common: isCommon,
    is_breached: breachReport.isBreached,
    breach_count: breachReport.breachCount
  });
});

router.get("/generate", (req, res) => {
  const adjs = ['Blue', 'Swift', 'Bright', 'Silent', 'Golden', 'Clever', 'Secure', 'Wild'];
  const nouns = ['River', 'Mountain', 'Falcon', 'Shield', 'Forest', 'Ocean', 'Castle', 'Haven'];

  const r1 = adjs[Math.floor(Math.random() * adjs.length)];
  const r2 = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 90) + 10;

  return res.json({ password: `${r1}${r2}${num}!` });
});

export default router;
