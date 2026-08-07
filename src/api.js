/**
 * PassCraft API Client
 * Handles password analysis and passphrase generation endpoints.
 */

/**
 * Sends a candidate password to the backend analysis endpoint.
 * @param {string} password 
 * @returns {Promise<Object>}
 */
export async function checkPasswordStrength(password) {
  const res = await fetch('/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });

  if (!res.ok) {
    throw new Error(`API analysis error: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetches a newly generated Diceware-style passphrase.
 * @returns {Promise<string>}
 */
export async function generatePassphrase() {
  const res = await fetch('/api/generate');
  if (!res.ok) {
    throw new Error(`Passphrase generation error: ${res.status}`);
  }
  const data = await res.json();
  return data.password;
}
