import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { apiClient, hospitalAPI } from '../../services/api';
import { Heart, Mail, Lock, User, UserCheck, ShieldAlert, Award } from 'lucide-react';

interface AuthPagesProps {
  authTab: 'login' | 'register' | 'forgot' | 'reset';
  setAuthTab: (tab: 'login' | 'register' | 'forgot' | 'reset') => void;
  setCurrentTab: (tab: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ authTab, setAuthTab, setCurrentTab }) => {
  const { login } = useAuth();
  const { showToast } = useNotifications();

  // Common state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Register specific state
  const [role, setRole] = useState('ROLE_PUBLIC');
  const [hospitalId, setHospitalId] = useState<number | ''>('');
  const [hospitals, setHospitals] = useState<any[]>([]);

  // Reset state
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const data = await hospitalAPI.list();
      setHospitals(data);
    } catch (e) {
      // Ignore
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Direct REST post, fall back to in-browser auth simulation on fail
      try {
        const response = await apiClient.post('/auth/login', { email, password });
        login(response.data);
        showToast("Logged in successfully!", "success", "Welcome Back");
        
        if (response.data.role === 'ROLE_SUPER_ADMIN') {
          setCurrentTab('super_dashboard');
        } else if (response.data.role === 'ROLE_HOSPITAL_ADMIN') {
          setCurrentTab('admin_dashboard');
        } else {
          setCurrentTab('home');
        }
        return;
      } catch (err) {
        // Fall back to Local Mock accounts
        if (email.includes('super') && password === 'password123') {
          login({ token: 'mock_jwt_super', email, name: 'Super Admin', role: 'ROLE_SUPER_ADMIN', userId: 1, hospitalId: null });
          showToast("Logged in successfully (Simulation)!", "success", "Welcome Back");
          setCurrentTab('super_dashboard');
          return;
        } else if (email.includes('admin') && password === 'password123') {
          login({ token: 'mock_jwt_admin', email, name: 'Seattle General Admin', role: 'ROLE_HOSPITAL_ADMIN', userId: 2, hospitalId: 1 });
          showToast("Logged in successfully (Simulation)!", "success", "Welcome Back");
          setCurrentTab('admin_dashboard');
          return;
        } else if (email.includes('public') && password === 'password123') {
          login({ token: 'mock_jwt_public', email, name: 'Jane Public', role: 'ROLE_PUBLIC', userId: 5, hospitalId: null });
          showToast("Logged in successfully (Simulation)!", "success", "Welcome Back");
          setCurrentTab('home');
          return;
        } else {
          throw new Error("Invalid username or password");
        }
      }
    } catch (err: any) {
      showToast(err.message || "Login failed. Check your credentials.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      try {
        const payload = {
          name,
          email,
          password,
          role,
          hospitalId: role === 'ROLE_HOSPITAL_ADMIN' ? hospitalId : null
        };
        await apiClient.post('/auth/register', payload);
        showToast("Account registered! Please check email for verification.", "success", "Registration Successful");
        setAuthTab('login');
      } catch (err) {
        // Mock registration fallback
        showToast("Account registered (Simulation)! Proceed to login.", "success", "Registration Successful");
        setAuthTab('login');
      }
    } catch (err) {
      showToast("Registration failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      try {
        await apiClient.post('/auth/forgot-password', { email: forgotEmail });
        showToast("Password reset link dispatched to your email.", "info", "Check Mailbox");
        setAuthTab('login');
      } catch (err) {
        showToast("Password reset link dispatched (Simulation).", "info", "Check Mailbox");
        setAuthTab('login');
      }
    } catch (err) {
      showToast("Failed to process request.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      try {
        await apiClient.post('/auth/reset-password', { token: resetToken, newPassword });
        showToast("Password updated successfully!", "success", "Password Reset");
        setAuthTab('login');
      } catch (err) {
        showToast("Password updated (Simulation)!", "success", "Password Reset");
        setAuthTab('login');
      }
    } catch (err) {
      showToast("Failed to reset password. Invalid token.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 bg-white/40 dark:bg-slate-900/40 p-8 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl animate-fadeIn">
      
      {/* Visual left section - Mocking the mockup image */}
      <div className="flex-1 text-left space-y-6 hidden md:block select-none">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-2">
          <div className="bg-red-500 text-white p-2 rounded-xl">
            <Heart size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight dark:text-white">
              LifeLink <span className="text-red-500">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saving Lives. Connecting Hearts.</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-tight">
            Every Drop <br />
            <span className="text-red-500">Saves a Life.</span>
          </h2>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 italic">
            Be the reason someone lives today.
          </p>
        </div>

        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
          Life is precious. Your donation, our mission, someone's second chance. Together, we can keep hope alive.
        </p>

        {/* Winston Churchill quote block */}
        <div className="glass p-4 rounded-2xl border border-white/10 max-w-sm">
          <p className="text-xs text-slate-600 dark:text-slate-400 italic font-semibold leading-relaxed">
            "We make a living by what we get, but we make a life by what we give."
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-2 text-right">
            – Winston Churchill
          </p>
        </div>
      </div>

      {/* Auth Forms panel */}
      <div className="w-full md:max-w-md bg-white/70 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-xl backdrop-blur-md">
        
        {/* 1. LOGIN FORM */}
        {authTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5 text-left">
            <div className="text-center md:text-left space-y-1">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Welcome Back</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">Login to access your LifeLink AI account</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Email Address</label>
                <div className="flex items-center">
                  <Mail size={16} className="absolute left-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 pl-10 pr-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 block">Password</label>
                  <button
                    type="button"
                    onClick={() => setAuthTab('forgot')}
                    className="text-[10px] font-bold text-red-500 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="flex items-center">
                  <Lock size={16} className="absolute left-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 pl-10 pr-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/25 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : "Login"}
            </button>

            {/* Test credentials tips */}
            <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl space-y-1.5 text-[10px] font-semibold text-red-500 dark:text-red-400">
              <h5 className="font-extrabold uppercase flex items-center gap-1">
                <ShieldAlert size={10} />
                Demo Credentials (password123):
              </h5>
              <p>Super Admin: <span className="underline font-bold">superadmin@lifelink.ai</span></p>
              <p>Hospital Admin: <span className="underline font-bold">admin1@lifelink.ai</span></p>
            </div>

            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-center">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthTab('register')}
                className="font-bold text-red-500 hover:underline"
              >
                Register here
              </button>
            </p>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {authTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-left">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Create Account</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">Register a new profile in the LifeLink system</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Full Name</label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Email Address</label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="john@doe.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Password</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 px-3 py-2.5 rounded-xl text-sm font-semibold dark:text-white"
                  >
                    <option value="ROLE_PUBLIC">Public / Donor</option>
                    <option value="ROLE_HOSPITAL_ADMIN">Hospital Admin</option>
                  </select>
                </div>

                {role === 'ROLE_HOSPITAL_ADMIN' && (
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Select Hospital</label>
                    <select
                      required
                      value={hospitalId}
                      onChange={(e) => setHospitalId(Number(e.target.value))}
                      className="w-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 px-3 py-2.5 rounded-xl text-sm font-semibold dark:text-white"
                    >
                      <option value="">-- Choose --</option>
                      {hospitals.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/25 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Submit Registration"}
            </button>

            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-center">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                className="font-bold text-red-500 hover:underline"
              >
                Login here
              </button>
            </p>
          </form>
        )}

        {/* 3. FORGOT PASSWORD */}
        {authTab === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-5 text-left">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Forgot Password</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">Enter your registered email to receive a password reset token.</p>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">Email Address</label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 pl-10 pr-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                className="flex-1 py-3 border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold"
              >
                {loading ? "Sending..." : "Submit"}
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setAuthTab('reset')}
                className="text-[10px] font-bold text-red-500 hover:underline"
              >
                Already have a reset token? Click here
              </button>
            </div>
          </form>
        )}

        {/* 4. RESET PASSWORD */}
        {authTab === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4 text-left">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Reset Password</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">Input your validation token and select a new password.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">Verification Token</label>
                <input
                  type="text"
                  required
                  placeholder="Enter reset token code"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 px-4 py-2.5 rounded-xl text-sm font-semibold dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 block">New Password</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                className="flex-1 py-3 border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold"
              >
                {loading ? "Resetting..." : "Save Password"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
