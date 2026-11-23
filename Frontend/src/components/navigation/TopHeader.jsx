import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  QrCode,
  Bell,
  CheckCheck,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button3D } from '../common/Button3D';

export const TopHeader = ({ onOpenScanner }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('All');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/workspace/search?q=${encodeURIComponent(searchQuery.trim())}&mode=${searchMode}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 shrink-0">
      {/* Global Search with Mode Selector */}
      <form onSubmit={handleSearchSubmit} className="flex items-center w-full max-w-lg">
        <div className="relative flex items-center w-full">
          <div className="absolute left-3 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={`Search repository by ${searchMode === 'All' ? 'Doc #, title, or keywords...' : searchMode + '...'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-24 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition placeholder:text-slate-400 text-slate-700"
          />
          <div className="absolute right-1">
            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value)}
              className="text-xs bg-white text-slate-600 border border-slate-200 rounded px-2 py-1 focus:outline-none font-medium cursor-pointer hover:bg-slate-50"
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

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Quick QR Scanner Trigger with 3D Button */}
        <Button3D
          onClick={() => navigate('/workspace/scan-qr')}
          variant="light"
          size="sm"
          title="Scan Document QR Code"
        >
          <QrCode className="w-3.5 h-3.5 text-orange-600" />
          <span>Scan QR</span>
        </Button3D>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-semibold text-xs text-slate-800">Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => {
                        markAsRead(n._id);
                        if (n.link) navigate(n.link);
                        setShowNotifications(false);
                      }}
                      className={`p-3 text-xs cursor-pointer transition hover:bg-slate-50 ${!n.isRead ? 'bg-orange-50/40' : ''}`}
                    >
                      <div className="font-medium text-slate-800 flex items-center justify-between">
                        <span>{n.title}</span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Chip */}
        <div className="relative pl-2 border-l border-slate-200" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition"
          >
            <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'GxP User'}</div>
              <div className="text-[11px] font-medium text-orange-600 flex items-center gap-1">
                <span>{user?.role || 'Employee'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400 font-normal">{user?.department || 'Operations'}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden">
              <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/60">
                <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-slate-400">
                  ID: {user?.employeeId || 'EMP-000'}
                </div>
              </div>
              <button
                onClick={() => {
                  navigate('/governance/settings');
                  setShowUserMenu(false);
                }}
                className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-left"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                Account & Credentials
              </button>
              <button
                onClick={() => {
                  navigate('/governance/audit-trail');
                  setShowUserMenu(false);
                }}
                className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-left"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Audit Log Activity
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-left font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

