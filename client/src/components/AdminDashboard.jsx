import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ authState, onOpenAuth }) {
  const { token, user } = authState || {};

  const [teamUsers, setTeamUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Audit Log Filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Team Members & Audit Logs
  useEffect(() => {
    if (!token) return;

    const fetchAdminData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch Users
        const usersRes = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usersRes.ok) {
          const uData = await usersRes.json();
          setTeamUsers(uData.users || []);
        } else {
          const uErr = await usersRes.json();
          throw new Error(uErr.error || 'Failed to load team members');
        }

        // Fetch Audit Logs
        const queryParams = new URLSearchParams();
        if (actionFilter !== 'ALL') queryParams.append('action', actionFilter);
        if (searchQuery) queryParams.append('search', searchQuery);

        const logsRes = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (logsRes.ok) {
          const lData = await logsRes.json();
          setAuditLogs(lData.logs || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [token, actionFilter, searchQuery]);

  // Update User Role (Admin only)
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Role update failed');
      }

      setTeamUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      alert(`Role successfully updated to ${newRole}`);
    } catch (err) {
      alert(`Role change error: ${err.message}`);
    }
  };

  // Export Audit Logs to CSV File
  const handleExportCSV = () => {
    if (!auditLogs || auditLogs.length === 0) {
      alert('No audit logs available to export.');
      return;
    }

    const headers = ['Timestamp', 'User Email', 'Action', 'Credential Title', 'IP Address'];
    const csvRows = [headers.join(',')];

    auditLogs.forEach((log) => {
      const row = [
        `"${new Date(log.createdAt).toLocaleString()}"`,
        `"${log.userEmail || ''}"`,
        `"${log.action || ''}"`,
        `"${(log.itemTitle || '').replace(/"/g, '""')}"`,
        `"${log.ipAddress || ''}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PassCraft_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!token) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
        <div className="text-4xl mb-3">🏢</div>
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">
          Enterprise Admin Dashboard
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Sign in with an Admin or Manager account to manage team roles and review security audit logs.
        </p>
        <button
          onClick={onOpenAuth}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors cursor-pointer"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            🏢 Enterprise Admin Portal
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              RBAC Enabled
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong className="text-slate-700">{user?.email}</strong> ({user?.role || 'Admin'})
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          📥 Export Audit Logs (CSV)
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Team Member Role Management Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          👥 Team Members & Role-Based Access Control
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">Member Email</th>
                <th className="pb-3 px-2">Role</th>
                <th className="pb-3 px-2">Threat Status</th>
                <th className="pb-3 px-2">Joined Date</th>
                {user?.role === 'Admin' && <th className="pb-3 px-2 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="py-3 px-2 font-semibold text-slate-800">{u.email}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.role === 'Admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'Manager'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role || 'Employee'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {u.isBreached ? (
                      <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                        🚨 Threat Flagged
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        ✅ Clean
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  {user?.role === 'Admin' && (
                    <td className="py-3 px-2 text-right">
                      <select
                        value={u.role || 'Employee'}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:border-blue-600"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Employee">Employee</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Viewer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            📜 Security Audit Log History
          </h3>

          {/* Log Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search user or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none focus:bg-white"
            />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 outline-none font-semibold text-slate-700"
            >
              <option value="ALL">All Actions</option>
              <option value="VIEW">VIEW</option>
              <option value="COPY">COPY</option>
              <option value="AUTOFILL">AUTOFILL</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="SHARE">SHARE</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-slate-400 text-xs text-center py-8">Loading audit logs...</div>
        ) : auditLogs.length === 0 ? (
          <div className="text-slate-400 text-xs text-center py-8">
            No audit logs found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-2">Timestamp</th>
                  <th className="pb-3 px-2">User Email</th>
                  <th className="pb-3 px-2">Action</th>
                  <th className="pb-3 px-2">Target Item</th>
                  <th className="pb-3 px-2">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => {
                  let badgeStyle = 'bg-slate-100 text-slate-700';
                  if (log.action === 'COPY') badgeStyle = 'bg-blue-100 text-blue-800';
                  if (log.action === 'AUTOFILL') badgeStyle = 'bg-green-100 text-green-800';
                  if (log.action === 'VIEW') badgeStyle = 'bg-slate-200 text-slate-800';
                  if (log.action === 'DELETE') badgeStyle = 'bg-red-100 text-red-800';
                  if (log.action === 'SHARE') badgeStyle = 'bg-purple-100 text-purple-800';

                  return (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-2 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-slate-800">{log.userEmail}</td>
                      <td className="py-2.5 px-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeStyle}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-medium text-slate-700">{log.itemTitle}</td>
                      <td className="py-2.5 px-2 font-mono text-[11px] text-slate-400">{log.ipAddress}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
