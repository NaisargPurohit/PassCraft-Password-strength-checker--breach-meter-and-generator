function calculateEntropy(pwd) {
  let pool = 0;
  if (/[a-z]/.test(pwd)) pool += 26;
  if (/[A-Z]/.test(pwd)) pool += 26;
  if (/[0-9]/.test(pwd)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pwd)) pool += 33;
  return pool > 0 ? Math.round(pwd.length * Math.log2(pool)) : 0;
}

async function checkPwnedBreach(pwd) {
  try {
    const enc = new TextEncoder();
    const data = enc.encode(pwd);
    const hashBuf = await window.crypto.subtle.digest("SHA-1", data);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    const sha1Hex = hashArr.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    const prefix = sha1Hex.slice(0, 5);
    const suffix = sha1Hex.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (res.ok) {
      const text = await res.text();
      const lines = text.split("\r\n");
      for (const line of lines) {
        const [h, count] = line.split(":");
        if (h === suffix) {
          return { isCompromised: true, breachCount: parseInt(count, 10) };
        }
      }
    }
  } catch (err) {
    console.error("[VaultHealth] PwnedPasswords API range lookup failed:", err);
  }
  return { isCompromised: false, breachCount: 0 };
}

export async function analyzeVaultHealth(vaultEntries = []) {
  if (!vaultEntries?.length) {
    return {
      score: 100,
      total: 0,
      compromised: [],
      reused: [],
      weak: [],
      healthy: [],
      details: []
    };
  }

  const pwdFrequencyMap = vaultEntries.reduce((acc, entry) => {
    const pwd = (entry.password ?? '').trim();
    if (pwd) acc[pwd] = (acc[pwd] ?? 0) + 1;
    return acc;
  }, {});

  const details = [];

  for (const entry of vaultEntries) {
    const pwd = (entry.password ?? '').trim();
    const entropy = calculateEntropy(pwd);
    const isReused = (pwdFrequencyMap[pwd] ?? 0) > 1;
    const isWeak = pwd.length < 8 || entropy < 50;

    const breachInfo = await checkPwnedBreach(pwd);

    details.push({
      ...entry,
      entropy,
      isReused,
      isWeak,
      isCompromised: breachInfo.isCompromised,
      breachCount: breachInfo.breachCount
    });
  }

  const buckets = details.reduce(
    (acc, item) => {
      if (item.isCompromised) acc.compromised.push(item);
      else if (item.isReused) acc.reused.push(item);
      else if (item.isWeak) acc.weak.push(item);
      else acc.healthy.push(item);
      return acc;
    },
    { compromised: [], reused: [], weak: [], healthy: [] }
  );

  const deductions =
    buckets.compromised.length * 25 +
    buckets.reused.length * 15 +
    buckets.weak.length * 10;

  const score = Math.max(0, Math.min(100, Math.round(100 - deductions)));

  return {
    score,
    total: vaultEntries.length,
    ...buckets,
    details
  };
}
