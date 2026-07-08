import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  token: string;
  email: string;
  name: string;
  role: string;
  userId: number;
  hospitalId: number | null;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (session: UserSession) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('lifelink_session');
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem('lifelink_session');
      }
    }
    setLoading(false);
  }, []);

  const login = (session: UserSession) => {
    setUser(session);
    localStorage.setItem('lifelink_session', JSON.stringify(session));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lifelink_session');
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
