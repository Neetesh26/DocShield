import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

// Global handler so toast can also be called outside React tree if needed
let globalToastRef = null;

export const toast = {
  success: (msg, opts) => globalToastRef?.success(msg, opts),
  error: (msg, opts) => globalToastRef?.error(msg, opts),
  warning: (msg, opts) => globalToastRef?.warning(msg, opts),
  info: (msg, opts) => globalToastRef?.info(msg, opts)
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const duration = options.duration ?? 4000;
    const title = options.title;

    const newToast = { id, message, type, title, duration };
    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5 visible toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const success = useCallback((msg, opts) => addToast(msg, 'success', opts), [addToast]);
  const error = useCallback((msg, opts) => addToast(msg, 'error', opts), [addToast]);
  const warning = useCallback((msg, opts) => addToast(msg, 'warning', opts), [addToast]);
  const info = useCallback((msg, opts) => addToast(msg, 'info', opts), [addToast]);

  // Connect global object
  useEffect(() => {
    globalToastRef = { success, error, warning, info };
    
    // Transparently catch window.alert so all existing alerts automatically become Top-Center Toasts
    const originalAlert = window.alert;
    window.alert = (message) => {
      if (typeof message === 'string' && (message.toLowerCase().includes('fail') || message.toLowerCase().includes('error'))) {
        error(message);
      } else {
        info(message);
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [success, error, warning, info]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, removeToast }}>
      {children}

      {/* TOP-CENTER TOASTER CONTAINER */}
      <div
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2.5 pointer-events-none w-full max-w-md px-4"
        role="region"
        aria-live="polite"
      >
        {toasts.map((t) => {
          let icon = <Info className="w-5 h-5 text-sky-500 shrink-0" />;
          let borderClass = 'border-slate-200 dark:border-slate-700';
          let accentBg = 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400';
          let title = t.title || 'Information';

          if (t.type === 'success') {
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
            borderClass = 'border-emerald-200 dark:border-emerald-800/60';
            accentBg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400';
            title = t.title || 'Success';
          } else if (t.type === 'error') {
            icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
            borderClass = 'border-rose-200 dark:border-rose-800/60';
            accentBg = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400';
            title = t.title || 'Error';
          } else if (t.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
            borderClass = 'border-amber-200 dark:border-amber-800/60';
            accentBg = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400';
            title = t.title || 'Warning';
          }

          return (
            <div
              key={t.id}
              className={`
                pointer-events-auto w-full flex items-start gap-3 p-3.5 rounded-xl
                bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border ${borderClass}
                text-slate-800 dark:text-slate-100 transition-all duration-300
                animate-in slide-in-from-top-4 fade-in
              `}
              style={{
                boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.15), 0 4px 10px -2px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${accentBg}`}>
                {icon}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {title}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed break-words">
                  {t.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition shrink-0 cursor-pointer"
                aria-label="Close Notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
