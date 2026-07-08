import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import { Bell, Heart, LogOut, Moon, Sun, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  title: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationAPI.list(user?.userId || 0);
      setNotifications(data.filter((n: any) => !n.isRead));
    } catch (e) {
      // Ignore
    }
  };

  const handleClearNotifications = async () => {
    try {
      await notificationAPI.readAll();
      setNotifications([]);
      setShowNotifMenu(false);
    } catch (e) {
      // Ignore
    }
  };

  return (
    <header className="h-16 glass border-b border-slate-200/50 dark:border-slate-800/50 fixed top-0 right-0 left-64 z-30 px-6 flex items-center justify-between transition-colors duration-300">
      {/* Tab Title */}
      <h2 className="font-extrabold text-slate-800 dark:text-slate-200 tracking-tight text-lg">
        {title}
      </h2>

      {/* Action panel */}
      <div className="flex items-center gap-4">
        {/* Urgent Emergency Alert Banner for Public View */}
        {!user && (
          <div className="hidden md:flex items-center gap-2 bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 px-3 py-1.5 rounded-full text-xs font-semibold text-red-500">
            <Heart size={12} fill="currentColor" className="animate-pulse" />
            <span>Emergency Coordination Active</span>
          </div>
        )}

        {/* Theme Quick toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications dropdown bell */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 relative"
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 glass border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl p-4 z-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-xs dark:text-slate-200">Pending Alerts ({notifications.length})</h4>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearNotifications}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 py-4 text-center font-medium">No pending requests or alerts</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="bg-slate-100/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-200/20">
                        <h5 className="font-bold text-[11px] text-red-500 dark:text-red-400 mb-0.5">{n.title}</h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User profile dropdown button */}
        {user ? (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200/60 dark:border-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold border border-slate-200/30">
              <User size={16} />
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="font-bold text-xs dark:text-slate-200 truncate max-w-[100px]">{user.name}</span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase">{user.role.replace('ROLE_', '')}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCurrentTab('login')}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/25 transition-all duration-300"
          >
            <User size={14} />
            <span>Portal Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
