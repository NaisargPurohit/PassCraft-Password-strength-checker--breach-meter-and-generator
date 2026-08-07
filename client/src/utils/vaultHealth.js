/**
 * Password Health & Security Scoring Engine
 * Analyzes decrypted vault items locally on the client using zero-knowledge checks.
 */

// Helper to compute entropy
function calculateEntropy(pwd) {
  let pool = 0;
  if (/[a-z]/.test(pwd)) pool += 26;
  if (/[A-Z]/.test(pwd)) pool += 26;
  if (/[0-9]/.test(pwd)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pwd)) pool += 33;
  return pool > 0 ? Math.round(pwd.length * Math.log2(pool)) : 0;
}

// Helper to check SHA-1 prefix against Pwned Passwords API (K-Anonymity)
async function checkPwnedBreach(pwd) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha1Hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = sha1Hex.slice(0, 5);
    const suffix = sha1Hex.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\r\n');
      for (const line of lines) {
        const [h, count] = line.split(':');
        if (h === suffix) {
          return { isCompromised: true, breachCount: parseInt(count, 10) };
        }
      }
    }
  } catch (err) {
    // Fail gracefully if network unreachable
  }
  return { isCompromised: false, breachCount: 0 };
}

/**
 * Analyzes a list of decrypted vault items and categorizes them.
 * @param {Array} items - List of decrypted vault objects [{ id, title, url, username, password }]
 * @returns {Promise<Object>} Health report with security score (0-100) and categorized items
 */
export async function analyzeVaultHealth(items = []) {
  if (!items || items.length === 0) {
    return {
      score: 100,
      total: 0,
      compromised: [],
      reused: [],
      weak: [],
      healthy: [],
      details: [],
    };
  }

  // 1. Password Reuse Map
  const frequencyMap = {};
  items.forEach(item => {
    const pwd = (item.password || '').trim();
    if (pwd) {
      frequencyMap[pwd] = (frequencyMap[pwd] || 0) + 1;
    }
  });

  const analyzedItems = [];

  // 2. Evaluate Each Vault Entry
  for (const item of items) {
    const pwd = (item.password || '').trim();
    const entropy = calculateEntropy(pwd);
    const isReused = frequencyMap[pwd] > 1;
    const isWeak = pwd.length < 8 || entropy < 50;

    // Check breach status via zero-knowledge API
    const breachResult = await checkPwnedBreach(pwd);

    const itemAnalysis = {
      ...item,
      entropy,
      isReused,
      isWeak,
      isCompromised: breachResult.isCompromised,
      breachCount: breachResult.breachCount,
    };

    analyzedItems.push(itemAnalysis);
  }

  // 3. Categorize into 4 Groups
  const compromised = [];
  const reused = [];
  const weak = [];
  const healthy = [];

  analyzedItems.forEach(item => {
    if (item.isCompromised) {
      compromised.push(item);
    } else if (item.isReused) {
      reused.push(item);
    } else if (item.isWeak) {
      weak.push(item);
    } else {
      healthy.push(item);
    }
  });

  // 4. Calculate Overall Vault Security Score (0 - 100)
  // Deductions: Compromised -25, Reused -15, Weak -10
  const totalDeductions =
    compromised.length * 25 +
    reused.length * 15 +
    weak.length * 10;

  const score = Math.max(0, Math.min(100, Math.round(100 - totalDeductions)));

  return {
    score,
    total: items.length,
    compromised,
    reused,
    weak,
    healthy,
    details: analyzedItems,
  };
}
