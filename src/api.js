// api fetch helper functions

// check password strength against backend api
export async function checkPasswordStrength(pwd) {
  // console.log("sending password to check:", pwd);
  const res = await fetch('/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pwd })
  });

  if (!res.ok) {
    // TODO: add proper toast notification on error
    throw new Error(`API analysis error: ${res.status}`);
  }

  return res.json();
}

// get a new passphrase
export async function generatePassphrase() {
  const res = await fetch('/api/generate');
  if (!res.ok) {
    throw new Error(`Passphrase generation error: ${res.status}`);
  }
  const data = await res.json();
  // console.log("generated passphrase response:", data);
  return data.password;
}
