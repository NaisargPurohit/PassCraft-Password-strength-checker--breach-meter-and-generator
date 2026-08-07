import React, { useState } from 'react';

export default function PassphraseGenerator() {
  const [passphrase, setPassphrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate');
      if (res.ok) {
        const data = await res.json();
        setPassphrase(data.password);
        setCopied(false);
      }
    } catch (err) {
      console.error('Failed to generate passphrase:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
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
        Generate a secure and highly memorable password instantly.
      </p>

      <div className="flex gap-2 mb-3.5">
        <input
          type="text"
          readOnly
          value={passphrase}
          placeholder="Click generate..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono-code text-xs bg-slate-50 outline-none"
        />
        <button
          onClick={handleCopy}
          disabled={!passphrase}
          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
      >
        {loading ? 'Generating...' : '🔄 Generate Password'}
      </button>
    </div>
  );
}
