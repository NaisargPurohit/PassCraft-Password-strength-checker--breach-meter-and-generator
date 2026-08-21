// API base URL configuration for production and local environment
export const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : '';

export async function checkPasswordStrength(password) {
  const res = await fetch(`${API_BASE_URL}/api/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) {
    throw new Error(`API analysis error: ${res.status}`);
  }
  return res.json();
}

export async function generatePassphrase() {
  const res = await fetch(`${API_BASE_URL}/api/generate`);
  if (!res.ok) {
    throw new Error(`Passphrase generation error: ${res.status}`);
  }
  const data = await res.json();
  return data.password;
}
