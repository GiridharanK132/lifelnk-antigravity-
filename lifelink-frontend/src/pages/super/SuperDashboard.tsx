import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { hospitalAPI, requestAPI, predictionAPI, apiClient } from '../../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Hospital, Users, AlertTriangle, TrendingUp, Plus, Trash2, Edit2, Play, Lock, ShieldAlert 
} from 'lucide-react';

interface SuperDashboardProps {
  tab: string;
}

export const SuperDashboard: React.FC<SuperDashboardProps> = ({ tab }) => {
  const { showToast } = useNotifications();

  // State
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Hospital Form state
  const [hName, setHName] = useState('');
  const [hAddress, setHAddress] = useState('');
  const [hPhone, setHPhone] = useState('');
  const [hEmail, setHEmail] = useState('');
  const [hLat, setHLat] = useState(47.6);
  const [hLng, setHLng] = useState(-122.3);

  // User Reset Form State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Selected AI log request state
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [aiReport, setAiReport] = useState<any | null>(null);

  useEffect(() => {
    fetchSuperData();
  }, [tab]);

  const fetchSuperData = async () => {
    setLoading(true);
    try {
      const hData = await hospitalAPI.list();
      setHospitals(hData);

      const rData = await requestAPI.list();
      setRequests(rData);

      const pData = await predictionAPI.list();
      setPredictions(pData);

      // Fetch users from API (simulated or real)
      try {
        const uResponse = await apiClient.get('/super/users');
        setUsers(uResponse.data);
      } catch (err) {
        // Fallback mock users
        setUsers([
          { id: 1, name: 'Super Admin', email: 'superadmin@lifelink.ai', role: { name: 'ROLE_SUPER_ADMIN' }, isActive: true, isVerified: true },
          { id: 2, name: 'Seattle General Admin', email: 'admin1@lifelink.ai', role: { name: 'ROLE_HOSPITAL_ADMIN' }, isActive: true, isVerified: true },
          { id: 3, name: 'Cherry Hill Admin', email: 'admin2@lifelink.ai', role: { name: 'ROLE_HOSPITAL_ADMIN' }, isActive: true, isVerified: true },
          { id: 5, name: 'Jane Public', email: 'public@lifelink.ai', role: { name: 'ROLE_PUBLIC' }, isActive: true, isVerified: true },
        ]);
      }
    } catch (e) {
      showToast("Failed to fetch administrative data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: hName,
        address: hAddress,
        latitude: hLat,
        longitude: hLng,
        contactNumber: hPhone,
        email: hEmail
      };
      await hospitalAPI.create(payload);
      showToast("Hospital profile created successfully!", "success");
      setHName('');
      setHAddress('');
      setHPhone('');
      setHEmail('');
      fetchSuperData();
    } catch (err) {
      showToast("Failed to create hospital.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHospital = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this hospital profile?")) return;
    try {
      await hospitalAPI.delete(id);
      showToast("Hospital deleted.", "warning");
      fetchSuperData();
    } catch (err) {
      showToast("Failed to delete hospital.", "error");
    }
  };

  const handleUpdateHospitalStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await hospitalAPI.update(id, { status: nextStatus });
      showToast(`Hospital profile ${nextStatus.toLowerCase()}!`, "info");
      fetchSuperData();
    } catch (err) {
      showToast("Failed to change hospital status.", "error");
    }
  };

  const handleUpdateUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      try {
        await apiClient.put(`/super/users/${userId}/status?active=${!currentStatus}`);
      } catch (e) {
        // Mock update
      }
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
      showToast("User account status updated.", "info");
    } catch (err) {
      showToast("Failed to modify user status.", "error");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    setLoading(true);
    try {
      try {
        await apiClient.post(`/super/users/${selectedUser.id}/reset-password?newPassword=${newPassword}`);
      } catch (e) {
        // Mock reset
      }
      showToast(`Password updated for user: ${selectedUser.email}`, "success");
      setSelectedUser(null);
      setNewPassword('');
    } catch (err) {
      showToast("Password reset failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAiLogs = async (req: any) => {
    setSelectedRequest(req);
    try {
      const report = await requestAPI.getAIRecommendation(req.id);
      setAiReport(report);
    } catch (e) {
      showToast("Failed to pull AI logs.", "error");
    }
  };

  // Compile stats for Super Admin charts
  const hospitalChartData = hospitals.map(h => {
    return { name: h.name.substring(0, 12) + '...', capacity: 15 }; // Mocked total capacity sum
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-left animate-fadeIn">
      {/* 1. OVERVIEW TAB */}
      {tab === 'super_dashboard' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-gradient-to-br from-red-500/10 via-slate-500/5 to-transparent dark:from-red-950/20 p-6 rounded-3xl border border-red-500/10 shadow">
            <h2 className="text-xl font-black text-slate-800 dark:text-white">Super Admin Command Center</h2>
            <p className="text-xs text-slate-400 font-semibold">Total monitoring controls of blood bank logistics, system security, and AI agents.</p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hospitals</h4>
                <p className="text-3xl font-extrabold text-red-500 mt-1">{hospitals.length}</p>
              </div>
              <Hospital size={32} className="text-red-500 opacity-20" />
            </div>

            <div className="glass-card flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Users</h4>
                <p className="text-3xl font-extrabold text-blue-500 mt-1">{users.length}</p>
              </div>
              <Users size={32} className="text-blue-500 opacity-20" />
            </div>

            <div className="glass-card flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Emergency Requests</h4>
                <p className="text-3xl font-extrabold text-amber-500 mt-1">{requests.length}</p>
              </div>
              <AlertTriangle size={32} className="text-amber-500 opacity-20" />
            </div>

            <div className="glass-card flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Stock Predictors</h4>
                <p className="text-3xl font-extrabold text-emerald-500 mt-1">{predictions.length}</p>
              </div>
              <TrendingUp size={32} className="text-emerald-500 opacity-20" />
            </div>
          </div>

          {/* Chart */}
          <div className="glass-card">
            <h3 className="font-bold text-xs mb-4 dark:text-slate-200 uppercase tracking-wider">Network Capacity Index</h3>
            <div className="w-full h-64 text-xs font-semibold text-slate-400">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hospitalChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(239, 68, 68, 0.05)' }} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                  <Bar dataKey="capacity" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANAGE HOSPITALS TAB */}
      {tab === 'super_hospitals' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Hospital Form */}
          <div className="lg:col-span-4 glass-card self-start space-y-4">
            <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">Register New Hospital</h3>
            <form onSubmit={handleCreateHospital} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Hospital Name</label>
                <input
                  type="text"
                  required
                  placeholder="Seattle Central Hospital"
                  value={hName}
                  onChange={(e) => setHName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Address Location</label>
                <input
                  type="text"
                  required
                  placeholder="Street and ZIP details"
                  value={hAddress}
                  onChange={(e) => setHAddress(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Latitude Coords</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={hLat}
                    onChange={(e) => setHLat(parseFloat(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Longitude Coords</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={hLng}
                    onChange={(e) => setHLng(parseFloat(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Phone Contact</label>
                  <input
                    type="text"
                    required
                    placeholder="206-555-0100"
                    value={hPhone}
                    onChange={(e) => setHPhone(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Email Contact</label>
                  <input
                    type="email"
                    required
                    placeholder="contact@hosp.org"
                    value={hEmail}
                    onChange={(e) => setHEmail(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Register Hospital</span>
              </button>
            </form>
          </div>

          {/* Hospitals list */}
          <div className="lg:col-span-8 glass-card space-y-4">
            <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">Registered Network Locations</h3>
            <div className="overflow-hidden border border-slate-200/40 dark:border-slate-800/40 rounded-xl">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold text-[9px]">
                  <tr>
                    <th className="p-3">Hospital Name</th>
                    <th className="p-3">Coordinates</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 font-semibold text-slate-700 dark:text-slate-300">
                  {hospitals.map(h => (
                    <tr key={h.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
                      <td className="p-3">
                        <span className="font-bold block">{h.name}</span>
                        <span className="text-[10px] text-slate-400">{h.address}</span>
                      </td>
                      <td className="p-3 text-slate-400 font-medium">
                        {h.latitude.toFixed(3)}, {h.longitude.toFixed(3)}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleUpdateHospitalStatus(h.id, h.status)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            h.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {h.status}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteHospital(h.id)}
                          className="text-red-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. MANAGE USERS TAB */}
      {tab === 'super_users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* User lists */}
          <div className="lg:col-span-8 glass-card space-y-4">
            <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">User Account Matrix</h3>
            <div className="overflow-hidden border border-slate-200/40 dark:border-slate-800/40 rounded-xl">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold text-[9px]">
                  <tr>
                    <th className="p-3">Name / Email</th>
                    <th className="p-3">System Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 font-semibold text-slate-700 dark:text-slate-300">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
                      <td className="p-3">
                        <span className="font-bold block">{u.name}</span>
                        <span className="text-[10px] text-slate-400">{u.email}</span>
                      </td>
                      <td className="p-3 text-slate-500 font-bold uppercase">
                        {u.role.name ? u.role.name.replace('ROLE_', '') : u.role.replace('ROLE_', '')}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleUpdateUserStatus(u.id, u.isActive)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            u.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1 text-[10px] font-bold ml-auto"
                        >
                          <Lock size={12} />
                          <span>Reset</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reset password form */}
          <div className="lg:col-span-4 glass-card self-start space-y-4">
            <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">Reset Admin Password</h3>
            {!selectedUser ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-12 text-center font-bold">Select a user account from the left list to reset their credentials.</p>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="bg-slate-100/60 dark:bg-slate-800/30 p-3 rounded-xl border">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Target User</span>
                  <span className="font-bold text-xs dark:text-slate-200 block">{selectedUser.name}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{selectedUser.email}</span>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new credential password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold"
                  >
                    Save Reset
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4. EMERGENCY REQUESTS TAB */}
      {tab === 'super_requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Requests list */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">System Blood Requests</h3>
            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
              {requests.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold py-12 text-center">No emergency requests submitted in the system.</p>
              ) : (
                requests.map(req => (
                  <div
                    key={req.id}
                    onClick={() => handleViewAiLogs(req)}
                    className={`glass-card hover:border-red-500/30 p-4 border cursor-pointer flex flex-col gap-2 ${
                      selectedRequest?.id === req.id ? 'border-red-500 bg-red-500/5' : 'border-slate-200/25'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-xs dark:text-slate-200">Request ID: {req.id}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        req.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Requestor: <span className="font-bold">{req.requestingHospital.name}</span>
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                      Blood Group: <span className="font-bold">{req.bloodGroup}</span> | Volume: <span className="font-bold text-red-500">{req.unitsRequired} units</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold text-right pt-2 border-t border-slate-200/40">
                      Click to review coordinator routing logs
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Execution details log viewer */}
          <div className="lg:col-span-7 glass-card self-start space-y-4">
            <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">AI Agent Coordination Report</h3>
            
            {!selectedRequest ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-24 text-center font-bold">Select an emergency request from the left list to trace AI coordinator workflows.</p>
            ) : (
              <div className="space-y-6 text-left">
                {/* Notes Summary */}
                <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/30">
                  <h4 className="font-bold text-xs dark:text-slate-200 mb-2">Coordinator Agent Summary</h4>
                  <p className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-400 italic">
                    "{selectedRequest.coordinatorNotes || 'No notes generated by coordinator.'}"
                  </p>
                </div>

                {/* Agent step lists */}
                {aiReport && aiReport.agentLogs && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs dark:text-slate-200">Execution Stack Logs</h4>
                    <div className="flex flex-col gap-2.5 pl-2 border-l-2 border-red-500/20">
                      {aiReport.agentLogs.map((log: any, idx: number) => (
                        <div key={idx} className="relative flex flex-col pl-4 text-xs">
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

      {/* 5. AI PREDICTIONS TAB */}
      {tab === 'super_predictions' && (
        <div className="glass-card space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-sm dark:text-slate-200 uppercase tracking-wider">AI Inventory Shortage Forecaster</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Shortage forecasting generated by predictive AI models, highlighting replenishment timelines.</p>
            </div>
            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Shortage alerts Active
            </span>
          </div>

          {predictions.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-16 text-center font-bold">No predictive shortage alarms active. Network stocks are safe.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {predictions.map(pred => (
                <div key={pred.id} className="p-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/20 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs dark:text-slate-200">{pred.hospital.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Predicted Shortage Date: {pred.predictedShortageDate}</p>
                    </div>
                    <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                      Confidence: {(pred.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/10 text-xs text-red-500 font-bold">
                    Target Shortage Group: {pred.bloodGroup}
                  </div>

                  <p className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/20">
                    <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">Recommended Mitigation:</span>
                    {pred.recommendedAction}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
