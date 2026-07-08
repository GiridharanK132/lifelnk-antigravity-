import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { inventoryAPI, requestAPI, hospitalAPI } from '../../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Database, AlertTriangle, Check, X, ShieldAlert, Plus, Trash2, Edit2, Play 
} from 'lucide-react';

interface AdminDashboardProps {
  tab: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ tab }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  // State
  const [hospital, setHospital] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [pendingTxs, setPendingTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New stock form state
  const [addBg, setAddBg] = useState('O-');
  const [addUnits, setAddUnits] = useState<number>(10);
  const [addExpiry, setAddExpiry] = useState('');

  // Selected allocation log state
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [aiReport, setAiReport] = useState<any | null>(null);

  // Edit profile state
  const [profileName, setProfileName] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  useEffect(() => {
    if (user && user.hospitalId) {
      fetchDashboardData();
    }
  }, [user, tab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get hospital details
      const hData = await hospitalAPI.list();
      const currentHosp = hData.find((h: any) => h.id === user?.hospitalId);
      if (currentHosp) {
        setHospital(currentHosp);
        setProfileName(currentHosp.name);
        setProfileAddress(currentHosp.address);
        setProfilePhone(currentHosp.contactNumber);
        setProfileEmail(currentHosp.email);
      }

      // Get inventory
      const invData = await inventoryAPI.getByHospital(user?.hospitalId || 0);
      setInventory(invData);

      // Get pending transactions
      const txData = await requestAPI.getPendingTransactions(user?.hospitalId || 0);
      setPendingTxs(txData);
    } catch (e) {
      showToast("Failed to load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addExpiry) {
      showToast("Please enter an expiry date.", "warning");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        hospitalId: user?.hospitalId,
        bloodGroup: addBg,
        availableUnits: addUnits,
        collectionDate: new Date().toISOString().split('T')[0],
        expiryDate: addExpiry
      };
      await inventoryAPI.add(payload);
      showToast(`${addUnits} units of ${addBg} added to stock!`, "success");
      setAddExpiry('');
      fetchDashboardData();
    } catch (err) {
      showToast("Failed to add inventory.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUnits = async (id: number, currentUnits: number, modifier: number) => {
    const newUnits = Math.max(0, currentUnits + modifier);
    try {
      await inventoryAPI.updateUnits(id, newUnits);
      showToast("Stock units updated.", "success");
      fetchDashboardData();
    } catch (e) {
      showToast("Failed to update units.", "error");
    }
  };

  const handleCleanupExpired = async () => {
    try {
      await inventoryAPI.cleanup();
      showToast("Scanning completed. Expired units flagged.", "info");
      fetchDashboardData();
    } catch (e) {
      showToast("Cleanup failed.", "error");
    }
  };

  const handleApproveTx = async (id: number) => {
    try {
      await requestAPI.approveTransaction(id);
      showToast("Allocation approved. Blood reserved & transferred.", "success");
      setSelectedTx(null);
      setAiReport(null);
      fetchDashboardData();
    } catch (e: any) {
      showToast(e.message || "Failed to approve transaction.", "error");
    }
  };

  const handleRejectTx = async (id: number) => {
    try {
      await requestAPI.rejectTransaction(id);
      showToast("Allocation rejected successfully.", "warning");
      setSelectedTx(null);
      setAiReport(null);
      fetchDashboardData();
    } catch (e) {
      showToast("Failed to reject transaction.", "error");
    }
  };

  const handleViewAiReport = async (tx: any) => {
    setSelectedTx(tx);
    try {
      const report = await requestAPI.getAIRecommendation(tx.request.id);
      setAiReport(report);
    } catch (e) {
      showToast("Failed to retrieve AI report details.", "error");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await hospitalAPI.update(user?.hospitalId || 0, {
        name: profileName,
        address: profileAddress,
        contactNumber: profilePhone,
        email: profileEmail
      });
      setHospital(updated);
      showToast("Profile details updated successfully!", "success");
    } catch (e) {
      showToast("Failed to update profile.", "error");
    }
  };

  // Process data for Recharts (units per blood group)
  const chartData = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => {
    const matched = inventory.filter(item => item.bloodGroup === group && item.status === 'AVAILABLE');
    const units = matched.reduce((sum, item) => sum + item.availableUnits, 0);
    return { name: group, units };
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-left animate-fadeIn">
      {/* 1. OVERVIEW TAB */}
      {tab === 'admin_dashboard' && (
        <div className="space-y-8">
          {/* Header Summary */}
          {hospital && (
            <div className="bg-gradient-to-br from-red-500/10 via-slate-500/5 to-transparent dark:from-red-950/20 p-6 rounded-3xl border border-red-500/10 shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">{hospital.name} Dashboard</h2>
                <p className="text-xs text-slate-400 font-semibold">{hospital.address}</p>
              </div>
              <span className="bg-red-500/10 text-red-500 font-extrabold text-xs px-3.5 py-1.5 rounded-full uppercase border border-red-500/20">
                Hospital Node: Active
              </span>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Stock</h4>
                <p className="text-3xl font-extrabold text-red-500 mt-1">
                  {inventory.filter(i => i.status === 'AVAILABLE').reduce((sum, i) => sum + i.availableUnits, 0)} units
                </p>
              </div>
              <Database size={32} className="text-red-500 opacity-20" />
            </div>

            <div className="glass-card flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Allocations</h4>
                <p className="text-3xl font-extrabold text-blue-500 mt-1">
                  {pendingTxs.length} request(s)
                </p>
              </div>
              <AlertTriangle size={32} className="text-blue-500 opacity-20" />
            </div>

            <div className="glass-card flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Safety Status</h4>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  <Check size={16} className="text-emerald-500" />
                  No expired flags
                </p>
              </div>
              <ShieldAlert size={32} className="text-emerald-500 opacity-20" />
            </div>
          </div>

          {/* Chart Section */}
          <div className="glass-card">
            <h3 className="font-bold text-xs mb-4 dark:text-slate-200 uppercase tracking-wider">Blood Stock Analytics</h3>
            <div className="w-full h-64 text-xs font-semibold text-slate-400">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(239, 68, 68, 0.05)' }} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                  <Bar dataKey="units" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. INVENTORY TAB */}
      {tab === 'admin_inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Add inventory form */}
          <div className="lg:col-span-4 glass-card self-start space-y-4">
            <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">Add Stock Units</h3>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Blood Group</label>
                <select
                  value={addBg}
                  onChange={(e) => setAddBg(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Units (Volume Bags)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addUnits}
                  onChange={(e) => setAddUnits(parseInt(e.target.value))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={addExpiry}
                  onChange={(e) => setAddExpiry(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add Inventory</span>
              </button>
            </form>
          </div>

          {/* Stock Table List */}
          <div className="lg:col-span-8 glass-card space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">Current Stock Logs</h3>
              <button
                onClick={handleCleanupExpired}
                className="text-[10px] font-bold text-red-500 hover:underline border border-red-500/20 px-3 py-1 rounded-full bg-red-500/5"
              >
                Run Expiry Check
              </button>
            </div>

            {inventory.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-12 text-center font-bold">No blood stocks logged.</p>
            ) : (
              <div className="overflow-hidden border border-slate-200/40 dark:border-slate-800/40 rounded-xl">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold text-[9px]">
                    <tr>
                      <th className="p-3">Blood Type</th>
                      <th className="p-3">Units Available</th>
                      <th className="p-3">Expiration</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Adjustment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 font-semibold text-slate-700 dark:text-slate-300">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
                        <td className="p-3 font-bold text-red-500">{item.bloodGroup}</td>
                        <td className="p-3 font-extrabold">{item.availableUnits} bags</td>
                        <td className="p-3 font-medium">{item.expiryDate}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            item.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right flex justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateUnits(item.id, item.availableUnits, 1)}
                            className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleUpdateUnits(item.id, item.availableUnits, -1)}
                            className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. REQUESTS ALLOCATIONS TAB */}
      {tab === 'admin_requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Pending allocations list */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">Pending Coordinator Allocations</h3>
            <div className="flex flex-col gap-4">
              {pendingTxs.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold py-12 text-center">No allocations mapping to your hospital stock.</p>
              ) : (
                pendingTxs.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => handleViewAiReport(tx)}
                    className={`glass-card hover:border-red-500/30 p-4 border cursor-pointer flex flex-col gap-2 ${
                      selectedTx?.id === tx.id ? 'border-red-500 bg-red-500/5' : 'border-slate-200/20'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-xs dark:text-slate-200">Request ID: {tx.request.id}</h4>
                      <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                        Pending Approval
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Destination: <span className="font-bold text-red-500">{tx.destinationHospital.name}</span>
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                      Blood Requested: <span className="font-bold">{tx.bloodGroup}</span> | Units Needed: <span className="font-bold text-red-500">{tx.units} bags</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold text-right pt-2 border-t border-slate-200/40">
                      Click to review AI coordination logs
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Allocation Logs detailed viewer */}
          <div className="lg:col-span-7 glass-card self-start space-y-4">
            <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">AI Agent Coordination HUD</h3>
            
            {!selectedTx ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-24 text-center font-bold">Select a pending request to inspect chronological agent decisions and authorize transfers.</p>
            ) : (
              <div className="space-y-6 text-left">
                {/* Summary Details */}
                <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/30">
                  <h4 className="font-bold text-xs dark:text-slate-200 mb-2">Transfer Allocation Authorization</h4>
                  <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                    The Coordinator Agent has generated a multi-hospital allocation split. Your blood bank is requested to supply <span className="font-bold text-red-500">{selectedTx.units} bags</span> of <span className="font-bold">{selectedTx.bloodGroup}</span> to <span className="font-bold text-blue-500">{selectedTx.destinationHospital.name}</span>.
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleApproveTx(selectedTx.id)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold flex items-center gap-1"
                    >
                      <Check size={12} />
                      <span>Approve & Dispatch</span>
                    </button>
                    <button
                      onClick={() => handleRejectTx(selectedTx.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-bold flex items-center gap-1"
                    >
                      <X size={12} />
                      <span>Decline Request</span>
                    </button>
                  </div>
                </div>

                {/* Chronological agent logs */}
                {aiReport && aiReport.agentLogs && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs dark:text-slate-200">Coordinator Agent Execution Logs</h4>
                    <div className="flex flex-col gap-2.5 pl-2 border-l-2 border-red-500/20">
                      {aiReport.agentLogs.map((log: any, idx: number) => (
                        <div key={idx} className="relative flex flex-col pl-4 text-xs">
                          {/* Dotted pin node */}
                          <span className="absolute -left-[15px] top-1.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
                          <span className="font-bold text-red-500 text-[10px] uppercase tracking-wider">{log.agentName}</span>
                          <span className="text-[10px] text-slate-400 font-bold mt-0.5">{log.action}</span>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed mt-1">{log.decision}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. HOSPITAL REPORTS TAB */}
      {tab === 'admin_reports' && (
        <div className="glass-card space-y-6">
          <div>
            <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">Hospital Performance & Analytics</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">Audit report summarizing inventory turnover, pending emergency logistics, and donor matches.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-xs dark:text-slate-200">Stock Threshold Checks</h4>
              <div className="space-y-2.5">
                {chartData.map(c => {
                  const status = c.units < 5 ? 'CRITICAL (LOW)' : 'SAFE';
                  return (
                    <div key={c.name} className="flex justify-between items-center p-2.5 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg text-xs font-semibold">
                      <span className="font-bold">{c.name} Group</span>
                      <span>{c.units} bags</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        status === 'SAFE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'
                      }`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-xs dark:text-slate-200">AI predictions Summary</h4>
              <div className="p-6 bg-slate-100/30 dark:bg-slate-800/20 rounded-2xl border border-slate-200/15 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold leading-relaxed">
                  Historical moving averages predict high emergency demand in Seattle Central cluster for group O- in the next 15 days. Safety backup drives are recommended.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADMIN PROFILE TAB */}
      {tab === 'admin_profile' && (
        <div className="glass-card text-left max-w-xl mx-auto space-y-6">
          <div>
            <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">Hospital Profile Settings</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">Update email, phone, and geographic coordinates of your hospital profile.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">Hospital Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">Address Location</label>
              <input
                type="text"
                required
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">Contact Number</label>
                <input
                  type="text"
                  required
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">Contact Email</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/25 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
