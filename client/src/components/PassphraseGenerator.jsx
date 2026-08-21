import React, { useState } from 'react';
import { API_BASE_URL } from '../api';

export default function PassphraseGenerator() {
  const [passphrase, setPassphrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const triggerPassphraseGen = async () => {
    setLoading(true);
    try {
      const genRes = await fetch(`${API_BASE_URL}/api/generate`);
      if (genRes.ok) {
        const genResult = await genRes.json();
        setPassphrase(genResult.password ?? '');
        setCopied(false);
      }
    } catch (err) {
      console.error('[PassphraseGen] Generator endpoint failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyPassphraseToClipboard = () => {
    if (!passphrase) return;
    navigator.clipboard.writeText(passphrase);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-800 mb-1">Passphrase Generator</h3>
      <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
        Generate high-entropy Diceware passphrase.
      </p>

      <div className="flex gap-2 mb-3.5">
        <input
          type="text"
          readOnly
          value={passphrase}
          placeholder="Generate passphrase..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono-code text-xs bg-slate-50 outline-none"
        />
        <button
          onClick={copyPassphraseToClipboard}
          disabled={!passphrase}
          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <button
        onClick={triggerPassphraseGen}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
      >
        {loading ? 'Generating...' : '🔄 Generate Password'}
      </button>
    </div>
  );
}
