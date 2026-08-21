import React, { useState, useEffect } from 'react';
import { encryptData, decryptData } from '../utils/crypto';
import { API_BASE_URL } from '../api';

export default function Vault({ authState, onOpenAuth }) {
  const { token, user, masterKey } = authState || {};

  const [vaultItems, setVaultItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Visibility toggle for individual item passwords
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Helper to record audit log actions
  const recordAuditLog = async (action, vaultItemId, itemTitle) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/audit-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, vaultItemId, itemTitle }),
      });
    } catch (e) {}
  };

  // Fetch & Decrypt Vault Items
  useEffect(() => {
    if (!token || !masterKey) return;

    const fetchVault = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/api/vault`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch vault items');
        }

        const data = await res.json();
        const decryptedList = [];

        for (const item of data.items || []) {
          try {
            const decryptedPayload = await decryptData(
              item.encryptedData,
              item.iv,
              masterKey
            );
            decryptedList.push({
              id: item._id,
              title: decryptedPayload.title || decryptedPayload.url || 'Untitled',
              url: decryptedPayload.url || '',
              username: decryptedPayload.username || '',
              password: decryptedPayload.password || '',
              createdAt: item.createdAt,
            });
          } catch (decryptErr) {
            console.error('Decryption failed for item:', item._id, decryptErr);
          }
        }

        setVaultItems(decryptedList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVault();
  }, [token, masterKey]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingId(null);
    setTitle('');
    setUrl('');
    setUsername('');
    setPassword('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setUrl(item.url);
    setUsername(item.username);
    setPassword(item.password);
    setIsModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!title || !password) return;

    setSaving(true);
    try {
      const { encryptedData, iv } = await encryptData(
        { title, url, username, password },
        masterKey
      );

      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId ? `${API_BASE_URL}/api/vault/${editingId}` : `${API_BASE_URL}/api/vault`;

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ encryptedData, iv }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save item');
      }

      const resData = await res.json();
      const savedId = resData.item._id;

      const newItem = {
        id: savedId,
        title,
        url,
        username,
        password,
        createdAt: resData.item.createdAt,
      };

      if (editingId) {
        setVaultItems((prev) => prev.map((it) => (it.id === editingId ? newItem : it)));
        recordAuditLog('UPDATE', savedId, title);
      } else {
        setVaultItems((prev) => [newItem, ...prev]);
        recordAuditLog('CREATE', savedId, title);
      }

      setIsModalOpen(false);
    } catch (err) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id, itemTitle) => {
    if (!window.confirm('Are you sure you want to delete this vault item?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/vault/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete item');

      setVaultItems((prev) => prev.filter((it) => it.id !== id));
      recordAuditLog('DELETE', id, itemTitle);
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  // Toggle Password Visibility (Record VIEW action)
  const toggleVisibility = (item) => {
    const isNowVisible = !visiblePasswords[item.id];
    setVisiblePasswords((prev) => ({ ...prev, [item.id]: isNowVisible }));
    if (isNowVisible) {
      recordAuditLog('VIEW', item.id, item.title);
    }
  };

  // Copy to Clipboard (Record COPY action)
  const handleCopy = (text, type, item) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${item.id}-${type}`);
    recordAuditLog('COPY', item.id, `${item.title} (${type.toUpperCase()})`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Filter items by search query
  const filteredItems = vaultItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q) ||
      item.username.toLowerCase().includes(q)
    );
  });

  if (!token || !masterKey) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
        <div className="text-4xl mb-3">🔐</div>
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">
          Zero-Knowledge Password Vault
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Sign in or create an account to unlock your encrypted vault. All data is encrypted on your device using AES-256-GCM before reaching our servers.
        </p>
        <button
          onClick={onOpenAuth}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors cursor-pointer"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            🛡️ Encrypted Vault
            <span className="text-xs font-semibold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
              Zero-Knowledge (AES-256-GCM)
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as <strong className="text-slate-700">{user?.email}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none focus:bg-white focus:border-blue-600"
          />
          <button
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            + Add Password
          </button>
        </div>
      </div>

      {/* Vault Items List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
          Decrypting vault items locally using Web Crypto API...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm">
          {searchQuery ? 'No vault items match your search.' : 'Your vault is empty. Click "+ Add Password" to store your first encrypted login!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isPasswordVisible = visiblePasswords[item.id];
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{item.title}</h3>
                      {item.url && (
                        <a
                          href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline block mt-0.5 truncate max-w-[220px]"
                        >
                          {item.url}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="text-xs text-slate-400 hover:text-slate-600 p-1"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        className="text-xs text-slate-400 hover:text-red-600 p-1"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Username Row */}
                  {item.username && (
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-lg text-xs mb-2">
                      <span className="text-slate-500 font-semibold truncate mr-2">
                        {item.username}
                      </span>
                      <button
                        onClick={() => handleCopy(item.username, 'user', item)}
                        className="text-[11px] font-bold text-slate-600 hover:text-blue-600 cursor-pointer"
                      >
                        {copiedId === `${item.id}-user` ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  )}

                  {/* Password Row */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-lg text-xs font-mono">
                    <span className="text-slate-800 font-bold truncate mr-2">
                      {isPasswordVisible ? item.password : '••••••••••••'}
                    </span>
                    <div className="flex items-center gap-2 font-sans">
                      <button
                        onClick={() => toggleVisibility(item)}
                        className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        {isPasswordVisible ? '🙈' : '👁️'}
                      </button>
                      <button
                        onClick={() => handleCopy(item.password, 'pwd', item)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        {copiedId === `${item.id}-pwd` ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Vault Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg"
            >
              ✕
            </button>

            <h3 className="text-lg font-extrabold text-slate-800 mb-4">
              {editingId ? 'Edit Vault Entry' : 'Add New Vault Entry'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Title / Service *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GitHub, Google, Netflix"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:bg-white focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  placeholder="https://github.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:bg-white focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Username / Email
                </label>
                <input
                  type="text"
                  placeholder="user@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:bg-white focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:bg-white focus:border-blue-600 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Encrypting & Saving...' : 'Save Encrypted Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
