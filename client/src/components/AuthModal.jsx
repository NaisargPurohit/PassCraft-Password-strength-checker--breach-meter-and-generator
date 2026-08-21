import React, { useState } from 'react';
import { deriveMasterKey } from '../utils/crypto';
import { API_BASE_URL } from '../api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? `${API_BASE_URL}/api/auth/register` : `${API_BASE_URL}/api/auth/login`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Zero-Knowledge Master Key Derivation on Client Side
      const masterKey = await deriveMasterKey(password, data.user.salt);

      onAuthSuccess({
        token: data.token,
        user: data.user,
        masterKey,
      });

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg"
        >
          ✕
        </button>

        <h2 className="text-xl font-extrabold text-slate-800 text-center mb-1">
          🔐 Pass<span className="text-blue-600">Craft</span> Vault
        </h2>
        <p className="text-xs text-slate-500 text-center mb-6">
          {isRegister
            ? 'Create an account for your Zero-Knowledge Password Vault'
            : 'Sign in to unlock your encrypted password vault'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Master Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              🔒 Your master password derives your encryption key locally and is never sent to our servers.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading
              ? 'Deriving Key & Authenticating...'
              : isRegister
              ? 'Create Account & Unlock Vault'
              : 'Sign In & Unlock Vault'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
