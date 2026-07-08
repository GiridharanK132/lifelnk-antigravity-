import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Home, Search, Hospital, Heart, HelpCircle, LogOut, 
  Database, AlertTriangle, FileText, Settings, UserPlus, 
  Users, TrendingUp, Sun, Moon 
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  const MenuItem = ({ tab, label, icon: Icon }: { tab: string; label: string; icon: any }) => {
    const active = currentTab === tab;
    return (
      <button
        onClick={() => handleTabChange(tab)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
          active 
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Icon size={18} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 glass border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col h-screen fixed left-0 top-0 z-40 p-4 transition-colors duration-300">
      {/* Brand Title */}
      <div className="flex items-center gap-2 px-3 py-4 mb-4">
        <div className="bg-red-500 text-white p-2 rounded-xl">
          <Heart size={20} fill="currentColor" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg leading-tight tracking-tight text-slate-800 dark:text-slate-200">
            LifeLink <span className="text-red-500">AI</span>
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Connecting Hearts, Saving Lives</p>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1">
        {/* Public / Common tab items */}
        <p className="px-4 py-2 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Portal</p>
        <MenuItem tab="home" label="Home" icon={Home} />
        <MenuItem tab="search" label="Search Blood" icon={Search} />
        <MenuItem tab="hospitals" label="View Hospitals" icon={Hospital} />
        <MenuItem tab="donor" label="Become a Donor" icon={Heart} />
        <MenuItem tab="faq" label="FAQs & Resources" icon={HelpCircle} />

        {/* Hospital Admin Tabs */}
        {user && user.role === 'ROLE_HOSPITAL_ADMIN' && (
          <>
            <p className="px-4 py-2 mt-4 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Blood Bank</p>
            <MenuItem tab="admin_dashboard" label="Overview" icon={Home} />
            <MenuItem tab="admin_inventory" label="Manage Stock" icon={Database} />
            <MenuItem tab="admin_requests" label="Allocations" icon={AlertTriangle} />
            <MenuItem tab="admin_reports" label="Reports" icon={FileText} />
            <MenuItem tab="admin_profile" label="Hospital Profile" icon={Settings} />
          </>
        )}

        {/* Super Admin Tabs */}
        {user && user.role === 'ROLE_SUPER_ADMIN' && (
          <>
            <p className="px-4 py-2 mt-4 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Admin Desk</p>
            <MenuItem tab="super_dashboard" label="Overview" icon={Home} />
            <MenuItem tab="super_hospitals" label="Hospitals List" icon={Hospital} />
            <MenuItem tab="super_users" label="User Accounts" icon={Users} />
            <MenuItem tab="super_requests" label="All Requests" icon={AlertTriangle} />
            <MenuItem tab="super_predictions" label="AI Predictions" icon={TrendingUp} />
          </>
        )}
      </div>

      {/* Footer controls & Profile */}
      <div className="mt-auto border-t border-slate-200/50 dark:border-slate-800/50 pt-4 flex flex-col gap-2">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 w-full"
        >
          {theme === 'light' ? (
            <>
              <Moon size={18} />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun size={18} />
              <span>Light Mode</span>
            </>
          )}
        </button>

        {user ? (
          <div className="flex flex-col gap-2">
            {/* User Profile Summary */}
            <div className="bg-slate-100/60 dark:bg-slate-800/30 rounded-xl p-3 flex flex-col">
              <span className="font-bold text-xs truncate dark:text-slate-200">{user.name}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">{user.role.replace('ROLE_', '').replace('_', ' ')}</span>
            </div>
            
            {/* Logout button */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors duration-300"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleTabChange('login')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          >
            <UserPlus size={18} />
            <span>Login / Register</span>
          </button>
        )}
      </div>
    </aside>
  );
};
