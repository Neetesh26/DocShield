
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef
} from 'react';

import { createPortal } from 'react-dom';

import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';

const ToastContext = createContext();

const TOAST_EVENT = 'vidyagxp-toast-event';
const EXIT_DURATION = 250;

// Global event-driven Toast dispatcher
export const toast = {
  show: (message, type = 'info', options = {}) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(TOAST_EVENT, {
          detail: { message, type, ...options }
        })
      );
    }
  },

  success: (msg, opts) => toast.show(msg, 'success', opts),
  error: (msg, opts) => toast.show(msg, 'error', opts),
  warning: (msg, opts) => toast.show(msg, 'warning', opts),
  info: (msg, opts) => toast.show(msg, 'info', opts)
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Store timeout references
  const timersRef = useRef(new Map());

  // Immediately remove toast
  const removeToast = useCallback((id) => {
    const timer = timersRef.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Animate toast out before removing it
  const dismissToast = useCallback((id) => {
    setToasts(prev =>
      prev.map(t =>
        t.id === id ? { ...t, exiting: true } : t
      )
    );

    const existingTimer = timersRef.current.get(id);

    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const exitTimer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timersRef.current.delete(id);
    }, EXIT_DURATION);

    timersRef.current.set(id, exitTimer);
  }, []);

  // Add new toast
  const addToast = useCallback((
    message,
    type = 'info',
    options = {}
  ) => {
    if (!message) return;

    const id =
      Date.now() + Math.random().toString(36).substring(2, 9);

    const duration = options.duration ?? 4500;
    const title = options.title;

    const newToast = {
      id,
      message,
      type,
      title,
      duration,
      exiting: false
    };

    setToasts(prev => [...prev.slice(-4), newToast]);

    // Auto dismiss with exit animation
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissToast(id);
      }, duration);

      timersRef.current.set(id, timer);
    }

    return id;
  }, [dismissToast]);

  // Toast methods
  const success = useCallback(
    (msg, opts) => addToast(msg, 'success', opts),
    [addToast]
  );

  const error = useCallback(
    (msg, opts) => addToast(msg, 'error', opts),
    [addToast]
  );

  const warning = useCallback(
    (msg, opts) => addToast(msg, 'warning', opts),
    [addToast]
  );

  const info = useCallback(
    (msg, opts) => addToast(msg, 'info', opts),
    [addToast]
  );

  // Listen to global toast events
  useEffect(() => {
    const handleToastEvent = (e) => {
      if (e.detail?.message) {
        addToast(
          e.detail.message,
          e.detail.type || 'info',
          e.detail
        );
      }
    };

    window.addEventListener(TOAST_EVENT, handleToastEvent);

    // Legacy alert compatibility
    const originalAlert = window.alert;

    window.alert = (msg) => {
      const message = String(msg);

      if (
        message.toLowerCase().includes('fail') ||
        message.toLowerCase().includes('error')
      ) {
        error(message);
      } else {
        info(message);
      }
    };

    return () => {
      window.removeEventListener(
        TOAST_EVENT,
        handleToastEvent
      );

      window.alert = originalAlert;
    };
  }, [addToast, error, info]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  // Toast styles
  const toasterElement = (
    <>
      <style>
        {`
          @keyframes toast-enter {
            from {
              opacity: 0;
              transform: translate3d(0, -24px, 0) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          @keyframes toast-exit {
            from {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
              max-height: 120px;
              margin-bottom: 0;
            }
            to {
              opacity: 0;
              transform: translate3d(0, -18px, 0) scale(0.96);
              max-height: 0;
              margin-bottom: -10px;
            }
          }

          .toast-enter {
            animation: toast-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .toast-exit {
            animation: toast-exit 0.25s ease-in both;
            pointer-events: none !important;
            overflow: hidden;
          }

          @media (prefers-reduced-motion: reduce) {
            .toast-enter,
            .toast-exit {
              animation-duration: 0.01ms;
            }
          }
        `}
      </style>

      <div
        id="vidyagxp-toaster-root"
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2.5 pointer-events-none w-full max-w-md px-4"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          let icon = (
            <Info className="w-5 h-5 text-sky-500 shrink-0" />
          );

          let borderClass =
            'border-slate-200 dark:border-slate-700';

          let accentBg =
            'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400';

          let title = t.title || 'Notification';

          if (t.type === 'success') {
            icon = (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            );

            borderClass =
              'border-emerald-300 dark:border-emerald-800/80 shadow-emerald-500/10';

            accentBg =
              'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400';

            title = t.title || 'Success';

          } else if (t.type === 'error') {
            icon = (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            );

            borderClass =
              'border-rose-300 dark:border-rose-800/80 shadow-rose-500/10';

            accentBg =
              'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400';

            title = t.title || 'Error';

          } else if (t.type === 'warning') {
            icon = (
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            );

            borderClass =
              'border-amber-300 dark:border-amber-800/80 shadow-amber-500/10';

            accentBg =
              'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400';

            title = t.title || 'Warning';
          }

          return (
            <div
              key={t.id}
              className={`
                pointer-events-auto w-full flex items-start gap-3 p-3.5 rounded-2xl
                bg-white dark:bg-slate-900 border ${borderClass}
                text-slate-800 dark:text-slate-100
                shadow-[0_15px_35px_-5px_rgba(0,0,0,0.2),0_5px_15px_rgba(0,0,0,0.1)]
                ${t.exiting ? 'toast-exit' : 'toast-enter'}
              `}
            >
              {/* Icon */}
              <div className={`p-2 rounded-xl shrink-0 ${accentBg}`}>
                {icon}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">
                  {title}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed break-words font-medium">
                  {t.message}
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition shrink-0 cursor-pointer"
                aria-label="Dismiss Notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <ToastContext.Provider
      value={{
        toast,
        success,
        error,
        warning,
        info,
        removeToast
      }}
    >
      {children}

      {typeof document !== 'undefined' &&
        createPortal(toasterElement, document.body)}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      'useToast must be used within a ToastProvider'
    );
  }

  return context;
};
