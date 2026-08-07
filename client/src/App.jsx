import React, { useState } from 'react';
import PasswordChecker from './components/PasswordChecker';
import Vault from './components/Vault';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('checker'); // 'checker' | 'vault' | 'dashboard' | 'admin'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authState, setAuthState] = useState(null); // { token, user, masterKey }

  const handleAuthSuccess = (newAuthState) => {
    setAuthState(newAuthState);
    setActiveTab('dashboard'); // Switch to dashboard automatically on login
  };

  const handleLogout = () => {
    setAuthState(null);
    setActiveTab('checker');
  };

  return (
    <div className="max-w-[950px] mx-auto px-6 py-8">
      {/* Top Navbar */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            🛡️ Pass<span className="text-blue-600">Craft</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Password Strength Analyzer, Zero-Knowledge Vault & Enterprise Portal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation Tabs */}
          <div className="bg-slate-200/70 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab('checker')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'checker'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Strength Checker
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔐 Vault
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 Admin
            </button>
          </div>

          {/* User Auth Controls */}
          {authState ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg font-semibold border border-slate-200">
                👤 {authState.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-500 hover:text-red-600 font-semibold px-2 py-1 cursor-pointer transition-colors"
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Tab Content */}
      <main>
        {activeTab === 'checker' && <PasswordChecker />}
        {activeTab === 'vault' && (
          <Vault
            authState={authState}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard
            authState={authState}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSwitchToVault={() => setActiveTab('vault')}
          />
        )}
        {activeTab === 'admin' && (
          <AdminDashboard
            authState={authState}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
