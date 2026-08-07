import React, { useState, useEffect } from 'react';
import StrengthMeter from './StrengthMeter';
import SecurityChecklist from './SecurityChecklist';
import PassphraseGenerator from './PassphraseGenerator';

export default function PasswordChecker() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);

  // 300ms Debounced API Fetch Effect
  useEffect(() => {
    if (!password) {
      setAnalysisData(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        if (res.ok) {
          const data = await res.json();
          setAnalysisData(data);
        }
      } catch (err) {
        console.error('Error fetching password strength analysis:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [password]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-6">
      {/* Left Column: Password Input & Strength Analysis Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Enter Password
        </label>
        
        {/* Password Input Box with Visibility Eye Toggle */}
        <div className="relative flex items-center mb-6">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type password here..."
            autoComplete="off"
            className="w-full py-3.5 pl-5 pr-12 font-mono-code text-base border border-slate-300 rounded-xl bg-slate-50 outline-none transition-all duration-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            title="Toggle Visibility"
            className="absolute right-4 text-base cursor-pointer hover:opacity-75 transition-opacity"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        {/* Dynamic Strength Meter & Detailed Metrics */}
        <StrengthMeter data={analysisData} hasInput={Boolean(password)} />
      </div>

      {/* Right Column: Security Checklist & Passphrase Generator */}
      <div className="flex flex-col gap-6">
        <SecurityChecklist checks={analysisData?.checks || {}} />
        <PassphraseGenerator />
      </div>
    </div>
  );
}
