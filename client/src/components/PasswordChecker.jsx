import React, { useState, useEffect } from 'react';
import StrengthMeter from './StrengthMeter';
import SecurityChecklist from './SecurityChecklist';
import PassphraseGenerator from './PassphraseGenerator';

export default function PasswordChecker() {
  const [candidatePassword, setCandidatePassword] = useState('');
  const [isPlaintextVisible, setIsPlaintextVisible] = useState(false);
  const [passwordStrengthMetrics, setPasswordStrengthMetrics] = useState(null);

  // TODO: Implement AbortController signal handling to cancel in-flight telemetry requests during rapid typing or component unmount.

  useEffect(() => {
    // Guard clause: Reset telemetry metrics if candidate input is empty
    if (!candidatePassword) {
      setPasswordStrengthMetrics(null);
      return;
    }

    const analysisDebounceTimer = setTimeout(async () => {
      try {
        const telemetryResponse = await fetch('/api/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: candidatePassword }),
        });

        // Guard clause: Early return if server response status is non-2xx
        if (!telemetryResponse.ok) {
          console.warn(`[Telemetry API] Analysis request returned status ${telemetryResponse.status}`);
          return;
        }

        const strengthMetricsData = await telemetryResponse.json();
        setPasswordStrengthMetrics(strengthMetricsData);
      } catch (telemetryNetworkError) {
        console.error('[Telemetry API] Error fetching password strength analysis:', telemetryNetworkError);
      }
    }, 300);

    return () => clearTimeout(analysisDebounceTimer);
  }, [candidatePassword]);

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
            type={isPlaintextVisible ? 'text' : 'password'}
            value={candidatePassword}
            onChange={(e) => setCandidatePassword(e.target.value)}
            placeholder="Type password here..."
            autoComplete="off"
            className="w-full py-3.5 pl-5 pr-12 font-mono-code text-base border border-slate-300 rounded-xl bg-slate-50 outline-none transition-all duration-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
          />
          <button
            type="button"
            onClick={() => setIsPlaintextVisible(!isPlaintextVisible)}
            title="Toggle Visibility"
            className="absolute right-4 text-base cursor-pointer hover:opacity-75 transition-opacity"
          >
            {isPlaintextVisible ? '🙈' : '👁️'}
          </button>
        </div>

        {/* Dynamic Strength Meter & Detailed Metrics */}
        <StrengthMeter data={passwordStrengthMetrics} hasInput={Boolean(candidatePassword)} />
      </div>

      {/* Right Column: Security Checklist & Passphrase Generator */}
      <div className="flex flex-col gap-6">
        <SecurityChecklist checks={passwordStrengthMetrics?.checks || {}} />
        <PassphraseGenerator />
      </div>
    </div>
  );
}
