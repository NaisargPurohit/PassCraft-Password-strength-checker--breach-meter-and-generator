import React, { useState, useEffect } from "react";
import PassphraseGenerator from './PassphraseGenerator';
import SecurityChecklist from './SecurityChecklist';
import StrengthMeter from "./StrengthMeter";
import { API_BASE_URL } from '../api';

export default function PasswordChecker() {
  const [candidatePwd, setCandidatePwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [analysisMetrics, setAnalysisMetrics] = useState(null);

  useEffect(() => {
    if (!candidatePwd) {
      setAnalysisMetrics(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const checkRes = await fetch(`${API_BASE_URL}/api/check`, {
          method: "POST",
          headers: { 'Content-Type': "application/json" },
          body: JSON.stringify({ password: candidatePwd }),
        });

        if (!checkRes.ok) return;

        const pwdAnalysis = await checkRes.json();
        setAnalysisMetrics(pwdAnalysis);
      } catch (err) {
        console.error('[PasswordChecker] Strength analysis failed:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [candidatePwd]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Enter Password
        </label>

        <div className="relative flex items-center mb-6">
          <input
            type={showPwd ? 'text' : 'password'}
            value={candidatePwd}
            onChange={(e) => setCandidatePwd(e.target.value)}
            placeholder="Type candidate password..."
            autoComplete="off"
            className="w-full py-3.5 pl-5 pr-12 font-mono-code text-base border border-slate-300 rounded-xl bg-slate-50 outline-none transition-all duration-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            title="Toggle Visibility"
            className="absolute right-4 text-base cursor-pointer hover:opacity-75 transition-opacity"
          >
            {showPwd ? '🙈' : '👁️'}
          </button>
        </div>

        <StrengthMeter data={analysisMetrics} hasInput={Boolean(candidatePwd)} />
      </div>

      <div className="flex flex-col gap-6">
        <SecurityChecklist checks={analysisMetrics?.checks ?? {}} />
        <PassphraseGenerator />
      </div>
    </div>
  );
}
