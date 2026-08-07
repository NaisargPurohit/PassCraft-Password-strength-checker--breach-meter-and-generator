import React from 'react';

const CHECKLIST_ITEMS = [
  { key: 'length', label: '8+ Characters' },
  { key: 'upper', label: 'Uppercase (A-Z)' },
  { key: 'lower', label: 'Lowercase (a-z)' },
  { key: 'number', label: 'Numbers (0-9)' },
  { key: 'special', label: 'Symbols (!@#$%)' },
];

export default function SecurityChecklist({ checks = {} }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-800 mb-4">Security Checklist</h3>
      <div className="flex flex-col gap-2">
        {CHECKLIST_ITEMS.map(({ key, label }) => {
          const isPassed = Boolean(checks[key]);
          return (
            <div
              key={key}
              className={`px-3.5 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                isPassed
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-slate-50 border-slate-100 text-slate-500'
              }`}
            >
              {isPassed ? '✅' : '❌'} {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
