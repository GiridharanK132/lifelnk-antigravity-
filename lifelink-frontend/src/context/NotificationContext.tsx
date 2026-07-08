import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface NotificationContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, title?: string) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    
    // Automatically remove toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <NotificationContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Render Toasts Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`cursor-pointer glass rounded-xl p-4 shadow-xl border flex flex-col transition-all duration-300 transform translate-y-0 scale-100 hover:scale-102 ${
              toast.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                : toast.type === 'error'
                ? 'border-red-500/30 bg-red-500/10 dark:bg-red-950/20 text-red-800 dark:text-red-300'
                : toast.type === 'warning'
                ? 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
                : 'border-blue-500/30 bg-blue-500/10 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300'
            }`}
          >
            {toast.title && <h4 className="font-bold text-sm mb-1">{toast.title}</h4>}
            <p className="text-xs font-medium opacity-90">{toast.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
