
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Search,
  QrCode,
  Bell,
  CheckCheck,
  LogOut,
  UserRound,
  ShieldCheck,
  ChevronDown,
  Moon,
  Sun,
  Check,
  Settings,
  ExternalLink,
  X
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { Button3D } from '../common/Button3D';

export const TopHeader = ({ onOpenScanner }) => {

  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const navigate = useNavigate();

  // ---------------- STATES ----------------

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('All');

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ---------------- REFS ----------------

  const notifRef = useRef(null);
  const userRef = useRef(null);

  // ---------------- OUTSIDE CLICK ----------------

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (
        userRef.current &&
        !userRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };

  }, []);

  // ---------------- SEARCH ----------------

  const handleSearchSubmit = (e) => {

    e.preventDefault();

    if (searchQuery.trim()) {

      navigate(
        `/workspace/search?q=${encodeURIComponent(
          searchQuery.trim()
        )}&mode=${searchMode}`
      );

    }
  };

  // ---------------- LOGOUT ----------------

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  // ---------------- HELPERS ----------------

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : 'U';

  return (

    <header className="
      h-16
      bg-white dark:bg-slate-900
      border-b border-slate-200 dark:border-slate-800
      px-4 md:px-6
      flex items-center justify-between
      gap-4
      z-30 shrink-0
      transition-colors duration-200
    ">

      {/* ---------------- GLOBAL SEARCH ---------------- */}

      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center w-full max-w-lg"
      >

        <div className="
          relative flex items-center w-full
        ">

          <Search className="
            absolute left-3
            w-4 h-4
            text-slate-400
          " />

          <input
            type="text"
            placeholder={`Search repository by ${
              searchMode === 'All'
                ? 'Doc #, title, or keywords...'
                : searchMode + '...'
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full
              pl-9 pr-24 py-2
              text-sm
              bg-slate-50 dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              rounded-lg
              text-slate-700 dark:text-slate-200
              placeholder:text-slate-400
              focus:outline-none
              focus:ring-2 focus:ring-orange-500/20
              focus:border-orange-500
              transition
            "
          />

          <div className="absolute right-1">

            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value)}
              aria-label="Search category"
              className="
                text-xs
                bg-white dark:bg-slate-800
                text-slate-600 dark:text-slate-300
                border border-slate-200 dark:border-slate-700
                rounded-md
                px-2 py-1
                outline-none
                cursor-pointer
              "
            >
              <option value="All">All</option>
              <option value="DocNumber">Doc #</option>
              <option value="Title">Title</option>
              <option value="Batch">Batch</option>
              <option value="Product">Product</option>
            </select>

          </div>

        </div>

      </form>

      {/* ---------------- RIGHT ACTIONS ---------------- */}

      <div className="
        flex items-center gap-1.5 md:gap-3
        shrink-0
      ">

        {/* QR SCANNER */}

        <Button3D
          onClick={() => {
            onOpenScanner
              ? onOpenScanner()
              : navigate('/workspace/scan-qr');
          }}
          variant="light"
          size="sm"
          title="Scan Document QR Code"
        >
          <QrCode className="w-4 h-4 text-orange-600 dark:text-orange-400 inline" />
          <span className="hidden sm:inline">
            Scan QR
          </span>
        </Button3D>

        {/* DARK / LIGHT MODE */}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="
            p-2
            text-slate-600 dark:text-slate-300
            hover:text-orange-600 dark:hover:text-orange-400
            hover:bg-slate-100 dark:hover:bg-slate-800
            rounded-lg
            transition-all duration-200 cursor-pointer
          "
        >

          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5" />
          )}

        </button>

        {/* NOTIFICATIONS */}

        <div className="relative" ref={notifRef}>

          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            aria-label="Notifications"
            aria-expanded={showNotifications}
            className="
              relative p-2
              text-slate-600 dark:text-slate-300
              hover:text-orange-600
              hover:bg-slate-100 dark:hover:bg-slate-800
              rounded-lg
              transition-all duration-200
            "
          >

            <Bell className="w-5 h-5" />

            {unreadCount > 0 && (

              <span className="
                absolute top-1 right-1
                min-w-4 h-4 px-1
                rounded-full
                bg-rose-500
                text-white
                text-[9px] font-bold
                flex items-center justify-center
                ring-2 ring-white dark:ring-slate-900
              ">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>

            )}

          </button>

          {/* NOTIFICATION DROPDOWN */}

          {showNotifications && (

            <div className="
              absolute right-0 mt-2
              w-80 sm:w-96
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-700
              rounded-xl
              shadow-xl
              z-50 overflow-hidden
            ">

              {/* HEADER */}

              <div className="
                p-3
                border-b border-slate-100 dark:border-slate-800
                flex items-center justify-between
                bg-slate-50 dark:bg-slate-800/70
              ">

                <div>
                  <h3 className="
                    text-sm font-semibold
                    text-slate-800 dark:text-slate-100
                  ">
                    Notifications
                  </h3>

                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {unreadCount} unread messages
                  </p>
                </div>

                <div className="flex items-center gap-2">

                  {unreadCount > 0 && (

                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="
                        text-[11px]
                        text-orange-600
                        hover:text-orange-700
                        font-medium
                        flex items-center gap-1
                      "
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>

                  )}

                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close notifications"
                    className="
                      p-1
                      text-slate-400
                      hover:text-slate-700 dark:hover:text-white
                      rounded
                    "
                  >
                    <X className="w-4 h-4" />
                  </button>

                </div>

              </div>

              {/* NOTIFICATION LIST */}

              <div className="
                max-h-80 overflow-y-auto
                divide-y divide-slate-100 dark:divide-slate-800
              ">

                {notifications.length === 0 ? (

                  <div className="p-8 text-center">

                    <Bell className="
                      w-8 h-8 mx-auto
                      text-slate-300 dark:text-slate-600
                    " />

                    <p className="
                      text-xs font-medium
                      text-slate-500 dark:text-slate-400
                      mt-2
                    ">
                      No notifications
                    </p>

                    <p className="text-[11px] text-slate-400 mt-1">
                      You're all caught up!
                    </p>

                  </div>

                ) : (

                  notifications.map((n) => (

                    <div
                      key={n._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        markAsRead(n._id);

                        if (n.link) {
                          navigate(n.link);
                        }

                        setShowNotifications(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          markAsRead(n._id);

                          if (n.link) {
                            navigate(n.link);
                          }

                          setShowNotifications(false);
                        }
                      }}
                      className={`
                        p-3 cursor-pointer
                        transition hover:bg-slate-50 dark:hover:bg-slate-800
                        ${
                          !n.isRead
                            ? 'bg-orange-50/50 dark:bg-orange-500/5'
                            : ''
                        }
                      `}
                    >

                      <div className="flex items-start justify-between gap-2">

                        <p className="
                          text-xs font-semibold
                          text-slate-800 dark:text-slate-100
                        ">
                          {n.title}
                        </p>

                        {!n.isRead && (
                          <span className="
                            w-2 h-2 mt-1
                            rounded-full bg-orange-500 shrink-0
                          " />
                        )}

                      </div>

                      <p className="
                        text-[11px] mt-1
                        leading-relaxed
                        text-slate-500 dark:text-slate-400
                      ">
                        {n.message}
                      </p>

                      <span className="
                        text-[10px] mt-2 block
                        text-slate-400
                      ">
                        {new Date(n.createdAt).toLocaleTimeString(
                          [],
                          {
                            hour: '2-digit',
                            minute: '2-digit'
                          }
                        )}
                      </span>

                    </div>

                  ))

                )}

              </div>

            </div>

          )}

        </div>

        {/* DIVIDER */}

        <div className="
          h-8 w-px
          bg-slate-200 dark:bg-slate-700
          mx-1
        " />

        {/* USER PROFILE */}

        <div className="relative" ref={userRef}>

          <button
            type="button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            aria-label="Open user menu"
            aria-expanded={showUserMenu}
            className="
              flex items-center gap-2
              p-1
              rounded-lg
              hover:bg-slate-50 dark:hover:bg-slate-800
              transition
            "
          >

            {/* AVATAR */}
            <div className="
              w-9 h-9
              rounded-full
              bg-orange-600
              text-white
              font-bold text-sm
              flex items-center justify-center
              shadow-sm
              overflow-hidden
            ">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'User Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitial
              )}
            </div>

            {/* USER DETAILS */}

            <div className="text-left hidden md:block">

              <p className="
                text-xs font-semibold
                text-slate-800 dark:text-slate-100
                leading-tight
              ">
                {user?.name || 'GxP User'}
              </p>

              <p className="
                text-[11px] mt-1
                text-slate-500 dark:text-slate-400
              ">
                {user?.role || 'Employee'}
              </p>

            </div>

            <ChevronDown className="
              w-3.5 h-3.5
              text-slate-400
              hidden sm:block
            " />

          </button>

          {/* USER MENU DROPDOWN */}

          {showUserMenu && (

            <div className="
              absolute right-0 mt-2
              w-60
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-700
              rounded-xl
              shadow-xl
              z-50 overflow-hidden
            ">

              {/* PROFILE INFO (Clean, non-duplicated header) */}
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Signed in as
                </p>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate mt-0.5" title={user?.email}>
                  {user?.email || 'No email available'}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>ID: {user?.employeeId || 'EMP-000'}</span>
                  <span className="px-1.5 py-0.2 rounded bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 font-semibold border border-orange-200 dark:border-orange-800/60">
                    {user?.role || 'Staff'}
                  </span>
                </div>
              </div>

              {/* ACCOUNT SETTINGS */}

              <div className="p-1.5">

                <button
                  type="button"
                  onClick={() => {
                    navigate('/governance/settings');
                    setShowUserMenu(false);
                  }}
                  className="
                    w-full px-3 py-2.5
                    text-xs
                    text-slate-700 dark:text-slate-300
                    hover:bg-slate-50 dark:hover:bg-slate-800
                    rounded-lg
                    flex items-center gap-2.5
                    text-left transition
                  "
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Account & Credentials
                  <ExternalLink className="w-3 h-3 ml-auto text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/governance/audit-trail');
                    setShowUserMenu(false);
                  }}
                  className="
                    w-full px-3 py-2.5
                    text-xs
                    text-slate-700 dark:text-slate-300
                    hover:bg-slate-50 dark:hover:bg-slate-800
                    rounded-lg
                    flex items-center gap-2.5
                    text-left transition
                  "
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  Audit Log Activity
                </button>

              </div>

              {/* LOGOUT */}

              <div className="
                border-t border-slate-100 dark:border-slate-800
                p-1.5
              ">

                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    w-full px-3 py-2.5
                    text-xs font-medium
                    text-rose-600
                    hover:bg-rose-50 dark:hover:bg-rose-500/10
                    rounded-lg
                    flex items-center gap-2.5
                    text-left transition
                  "
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>

              </div>

            </div>

          )}

        </div>

      </div>

    </header>

  );
};
