import React from 'react';

const BAR_COLORS = ['#ef4444', '#ef4444', '#f97316', '#eab308', '#22c55e', '#2563eb'];

export default function StrengthMeter({ data, hasInput }) {
  const score = hasInput && data ? data.score : 0;
  const strengthText = hasInput && data ? data.strength : 'Empty';
  const color = hasInput && data ? (BAR_COLORS[score] || '#94a3b8') : '#94a3b8';

  // Calculate time to crack based on entropy
  const getCrackTime = (entropy) => {
    if (entropy < 30) return 'Instantly';
    if (entropy < 50) return 'Minutes';
    if (entropy < 75) return 'Years';
    return 'Centuries';
  };

  return (
    <div className="space-y-6">
      {/* Strength Meter Section */}
      <div>
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
          <span>Strength Meter</span>
          <span style={{ color }}>{strengthText}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 h-1.5">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="h-full rounded-full transition-colors duration-300"
              style={{
                backgroundColor: hasInput && index < score ? BAR_COLORS[score] : '#e2e8f0'
              }}
            />
          ))}
        </div>
      </div>

      {/* Entropy & Time to Crack Stats */}
      {hasInput && data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
              Entropy
            </span>
            <span className="text-lg font-extrabold text-slate-800 mt-0.5 block">
              {data.entropy} bits
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
              Time to Crack
            </span>
            <span className="text-lg font-extrabold text-slate-800 mt-0.5 block">
              {getCrackTime(data.entropy)}
            </span>
          </div>
        </div>
      )}

      {/* Breach Warning Alert Box */}
      {hasInput && data && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold leading-relaxed ${
            data.is_breached || data.is_common
              ? 'bg-red-50 border border-red-100 text-red-800'
              : 'bg-green-50 border border-green-100 text-green-800'
          }`}
        >
          {data.is_breached ? (
            <span>
              ⚠️ Leaked! Found in <strong>{data.breach_count.toLocaleString()}</strong> public breaches. Do not use!
            </span>
          ) : data.is_common ? (
            <span>⚠️ Common password! Easily guessed by dictionary attacks.</span>
          ) : (
            <span>🛡️ Safe! Not found in any known public database breaches.</span>
          )}
        </div>
      )}

      {/* Recommendations Box */}
      {hasInput && data && data.suggestions && data.suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
          <h4 className="text-xs font-bold text-blue-800 mb-1.5">💡 Recommendations:</h4>
          <ul className="list-disc list-inside text-xs text-blue-900 space-y-1">
            {data.suggestions.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
