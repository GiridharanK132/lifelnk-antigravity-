import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LandingPages } from './pages/public/LandingPages';
import { AuthPages } from './pages/public/AuthPages';
import { AdminDashboard } from './pages/hospital/AdminDashboard';
import { SuperDashboard } from './pages/super/SuperDashboard';
import { requestAPI } from './services/api';
import { Heart, ShieldAlert, X, Activity, Play } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [currentTab, setCurrentTab] = useState('home');
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');

  // Diagnostic AI Simulator Overlay State
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [reqBg, setReqBg] = useState('O-');
  const [reqUnits, setReqUnits] = useState(5);
  const [reqPriority, setReqPriority] = useState('CRITICAL');
  const [simLoading, setSimLoading] = useState(false);
  const [simReport, setSimReport] = useState<any | null>(null);

  // Map tab name to readable Navbar title
  const getNavbarTitle = () => {
    switch (currentTab) {
      case 'home': return 'Emergency Command Center';
      case 'search': return 'Locate Blood Stock';
      case 'hospitals': return 'Hospital Registry Directory';
      case 'donor': return 'Emergency Donor Registry';
      case 'faq': return 'Frequently Asked Questions';
      case 'login':
        return authTab === 'login' ? 'Portal Authentication' : 
               authTab === 'register' ? 'Register Account' : 
               authTab === 'forgot' ? 'Forgot Password' : 'Reset Credentials';
      case 'admin_dashboard': return 'Hospital Stock Overview';
      case 'admin_inventory': return 'Inventory Stock Ledger';
      case 'admin_requests': return 'Emergency Allocations & Alerts';
      case 'admin_reports': return 'Logistics Turnover Audits';
      case 'admin_profile': return 'Hospital Profile Manager';
      case 'super_dashboard': return 'Platform Dashboard Command';
      case 'super_hospitals': return 'Hospitals Management';
      case 'super_users': return 'System User Profiles';
      case 'super_requests': return 'Emergency Request Ledger';
      case 'super_predictions': return 'Predictive Shortage Forecasting';
      default: return 'LifeLink AI';
    }
  };

  const handleTriggerEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setSimReport(null);
    try {
      // Sourcing from hospital ID 1 (Seattle General) for demo, or from user's hospital if logged in
      const sourceHospId = user?.hospitalId || 1;
      const report = await requestAPI.submit(sourceHospId, reqBg, reqUnits, reqPriority);
      
      setSimReport(report);
      showToast("AI Agent loop finished! Allocation matrix mapped.", "success", "Agentic Dispatcher");
    } catch (err: any) {
      showToast("Emergency allocation failed.", "error");
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={(tab) => {
        setCurrentTab(tab);
        if (tab === 'login') setAuthTab('login');
      }} />

      {/* Main Container */}
      <div className="pl-64 pt-16 min-h-screen flex flex-col">
        {/* Navbar Header */}
        <Navbar title={getNavbarTitle()} setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'login') setAuthTab('login');
        }} />

        {/* Diagnostic Simulator Trigger Float Button */}
        <button
          onClick={() => {
            setShowEmergencyModal(true);
            setSimReport(null);
          }}
          className="fixed bottom-6 left-72 z-40 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold transition-all duration-300 border border-white/20 animate-pulse hover:scale-105"
        >
          <Activity size={16} />
          <span>Launch AI Dispatch Simulation</span>
        </button>

        {/* Tab content router */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Public Views */}
          {['home', 'search', 'hospitals', 'donor', 'faq'].includes(currentTab) && (
            <LandingPages tab={currentTab} setCurrentTab={setCurrentTab} />
          )}

          {/* Auth Views */}
          {currentTab === 'login' && (
            <AuthPages authTab={authTab} setAuthTab={setAuthTab} setCurrentTab={setCurrentTab} />
          )}

          {/* Hospital Admin Panel */}
          {currentTab.startsWith('admin_') && (
            <AdminDashboard tab={currentTab} />
          )}

          {/* Super Admin Panel */}
          {currentTab.startsWith('super_') && (
            <SuperDashboard tab={currentTab} />
          )}
        </main>
      </div>

      {/* Diagnostic Emergency AI Workflow Simulator Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-3xl border border-white/20 p-6 shadow-2xl space-y-6 animate-scaleUp text-left">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                <ShieldAlert className="text-red-500" />
                Emergency AI Coordination Simulator
              </h3>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Manually dispatch a mock emergency request to observe the 11 coordinating AI Agents as they run haversine calculations, fraud scans, optimization filters, donor recommendations, and shortage alarms.
            </p>

            <form onSubmit={handleTriggerEmergency} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 mb-1 block">Blood Type</label>
                <select
                  value={reqBg}
                  onChange={(e) => setReqBg(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 mb-1 block">Units Required</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={reqUnits}
                  onChange={(e) => setReqUnits(parseInt(e.target.value))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 mb-1 block">Priority</label>
                <select
                  value={reqPriority}
                  onChange={(e) => setReqPriority(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border px-3 py-2.5 rounded-xl text-xs font-semibold dark:text-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={simLoading}
                className="md:col-span-3 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play size={14} />
                <span>{simLoading ? "Executing AI Agent Loops..." : "Trigger AI Agent Dispatch"}</span>
              </button>
            </form>

            {/* Simulated execution stack log */}
            {simReport && (
              <div className="space-y-4 border-t border-slate-200/50 dark:border-slate-800/40 pt-4">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">AI Coordination Trace Output</h4>
                
                {simReport.fraudFlagged ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold leading-relaxed">
                    <span className="font-bold block uppercase mb-1">FRAUD PREVENTION BLOCKED</span>
                    {simReport.fraudReason}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Allocation summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-100/50 dark:bg-slate-800/30 p-3 rounded-xl border">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Allocation Status</span>
                        <span className={`font-extrabold text-xs ${simReport.isAllocated ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {simReport.isAllocated ? 'Fully Allocated from Network' : 'Partially Sourced (Requires Donors)'}
                        </span>
                      </div>
                      <div className="bg-slate-100/50 dark:bg-slate-800/30 p-3 rounded-xl border">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Matched Sourcing Nodes</span>
                        <span className="font-extrabold text-xs dark:text-slate-200">
                          {simReport.allocations.length} Hospital(s)
                        </span>
                      </div>
                    </div>

                    {/* Sourced allocations list */}
                    {simReport.allocations.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sourced Units Details</span>
                        <div className="flex flex-col gap-2">
                          {simReport.allocations.map((a: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-semibold p-2 bg-slate-100/30 dark:bg-slate-800/20 rounded-lg border border-slate-200/10">
                              <span className="dark:text-slate-200">{a.hospitalName}</span>
                              <span className="text-red-500">{a.unitsProvided} units ({a.distance.toFixed(1)} km)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Backup donor notifications */}
                    {simReport.compatibleDonors.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Backup Donors Alerted</span>
                        <div className="flex flex-col gap-2">
                          {simReport.compatibleDonors.map((d: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-semibold p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                              <span>Donor: {d.donorName} ({d.bloodGroup})</span>
                              <span>Proximity: {d.distance.toFixed(1)} km | Contact: {d.contact}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Detailed chronological steps list */}
                {simReport.agentLogs && (
                  <div className="space-y-3 pt-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Chronological Agent Multi-Agent trace</span>
                    <div className="flex flex-col gap-2.5 pl-2 border-l-2 border-red-500/20 max-h-60 overflow-y-auto pr-1">
                      {simReport.agentLogs.map((log: any, idx: number) => (
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

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};
export default App;
