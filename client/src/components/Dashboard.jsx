import React, { useState } from 'react';
import { useVaultHealth } from '../hooks/useVaultHealth';

export default function Dashboard({ authState, onOpenAuth, onSwitchToVault }) {
  const { token, user, masterKey } = authState ?? {};
  const { healthReport: vaultHealthPayload, threatIntel, loading } = useVaultHealth(token, masterKey);
  const [activeFilter, setActiveFilter] = useState('all');

  if (!token || !masterKey) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
        <div className="text-4xl mb-3">📊</div>
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">
          Password Health & Threat Intelligence
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Sign in to analyze vault security score, identify compromised passwords, and view threat alerts.
        </p>
        <button
          onClick={onOpenAuth}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors cursor-pointer"
        >
          Sign In to Unlock Dashboard
        </button>
      </div>
    );
  }

  if (loading || !vaultHealthPayload) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center text-slate-500 text-sm">
        Calculating vault health score and checking threat alerts...
      </div>
    );
  }

  const { score, total, compromised, reused, weak, healthy, details } = vaultHealthPayload;

  let scoreColor = '#22c55e';
  let scoreText = 'Excellent';
  if (score < 50) {
    scoreColor = '#ef4444';
    scoreText = 'Critical';
  } else if (score < 80) {
    scoreColor = '#eab308';
    scoreText = 'Needs Attention';
  }

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getFilteredItems = () => {
    switch (activeFilter) {
      case 'compromised': return compromised;
      case 'reused': return reused;
      case 'weak': return weak;
      case 'healthy': return healthy;
      default: return details;
    }
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Vault Security Score
          </h3>

          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={scoreColor}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-800">{score}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: scoreColor }}>
                {scoreText}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            Evaluated across <strong>{total}</strong> saved credentials
          </p>
        </div>

        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                🛡️ Automated Threat Intelligence
              </h3>
              <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                Breach Scheduler Active
              </span>
            </div>

            {threatIntel?.isBreached ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3 text-xs text-red-800">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-sm">
                  ⚠️ Threat Alert: Account Email Found in Breach!
                </p>
                <p className="text-red-700 leading-relaxed mb-2">
                  Threat scanner detected your email (<strong className="text-slate-800">{user?.email}</strong>) in a public leak.
                </p>
                <ul className="list-disc list-inside space-y-1 text-red-900 font-medium">
                  {threatIntel.breaches.map((b, i) => (
                    <li key={i}>
                      <strong>{b.title}</strong> — {b.description}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3 text-xs text-green-800">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-sm">
                  ✅ Account Email Safe
                </p>
                <p className="text-green-700 leading-relaxed">
                  No public breach alerts associated with (<strong className="text-slate-800">{user?.email}</strong>).
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 flex justify-between">
            <span>Scan Engine: HIBP Range API</span>
            <span>Last Scan: {threatIntel?.lastCheck ? new Date(threatIntel.lastCheck).toLocaleTimeString() : 'Just now'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveFilter('compromised')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === 'compromised'
              ? 'bg-red-500 text-white border-red-600 shadow-sm'
              : 'bg-white border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xl">🚨</span>
            <span className={`text-2xl font-extrabold ${activeFilter === 'compromised' ? 'text-white' : 'text-red-600'}`}>
              {compromised.length}
            </span>
          </div>
          <p className={`text-xs font-bold mt-2 ${activeFilter === 'compromised' ? 'text-white' : 'text-slate-700'}`}>
            Compromised
          </p>
          <p className={`text-[11px] ${activeFilter === 'compromised' ? 'text-red-100' : 'text-slate-400'}`}>
            Leaked in breaches
          </p>
        </button>

        <button
          onClick={() => setActiveFilter('reused')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === 'reused'
              ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
              : 'bg-white border-slate-200 hover:border-orange-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xl">🔄</span>
            <span className={`text-2xl font-extrabold ${activeFilter === 'reused' ? 'text-white' : 'text-orange-600'}`}>
              {reused.length}
            </span>
          </div>
          <p className={`text-xs font-bold mt-2 ${activeFilter === 'reused' ? 'text-white' : 'text-slate-700'}`}>
            Reused
          </p>
          <p className={`text-[11px] ${activeFilter === 'reused' ? 'text-orange-100' : 'text-slate-400'}`}>
            Duplicate passwords
          </p>
        </button>

        <button
          onClick={() => setActiveFilter('weak')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === 'weak'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xl">⚠️</span>
            <span className={`text-2xl font-extrabold ${activeFilter === 'weak' ? 'text-white' : 'text-amber-600'}`}>
              {weak.length}
            </span>
          </div>
          <p className={`text-xs font-bold mt-2 ${activeFilter === 'weak' ? 'text-white' : 'text-slate-700'}`}>
            Weak
          </p>
          <p className={`text-[11px] ${activeFilter === 'weak' ? 'text-amber-100' : 'text-slate-400'}`}>
            Low entropy / short
          </p>
        </button>

        <button
          onClick={() => setActiveFilter('healthy')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === 'healthy'
              ? 'bg-green-600 text-white border-green-700 shadow-sm'
              : 'bg-white border-slate-200 hover:border-green-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xl">🛡️</span>
            <span className={`text-2xl font-extrabold ${activeFilter === 'healthy' ? 'text-white' : 'text-green-600'}`}>
              {healthy.length}
            </span>
          </div>
          <p className={`text-xs font-bold mt-2 ${activeFilter === 'healthy' ? 'text-white' : 'text-slate-700'}`}>
            Healthy
          </p>
          <p className={`text-[11px] ${activeFilter === 'healthy' ? 'text-green-100' : 'text-slate-400'}`}>
            Secure & unique
          </p>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm capitalize">
            {activeFilter === 'all' ? 'All Saved Credentials' : `${activeFilter} Credentials (${filteredItems.length})`}
          </h3>

          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Show All
            </button>
            <button
              onClick={onSwitchToVault}
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Open Vault 🔐
            </button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-6">
            No credentials found in this category.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs">{item.title}</span>
                    {item.username && (
                      <span className="text-[11px] text-slate-400">({item.username})</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {item.isCompromised && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                        🚨 Leaked ({item.breachCount?.toLocaleString()} breaches)
                      </span>
                    )}
                    {item.isReused && (
                      <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md">
                        🔄 Reused Password
                      </span>
                    )}
                    {item.isWeak && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                        ⚠️ Low Entropy ({item.entropy} bits)
                      </span>
                    )}
                    {!item.isCompromised && !item.isReused && !item.isWeak && (
                      <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-md">
                        🛡️ Strong & Unique
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={onSwitchToVault}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer hover:border-blue-300 transition-all self-end sm:self-center"
                >
                  Manage in Vault ➔
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
