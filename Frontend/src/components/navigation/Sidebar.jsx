import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  FolderKanban,
  UploadCloud,
  Layers,
  QrCode,
  Box,
  ArrowRightLeft,
  ClipboardList,
  CheckSquare,
  ListTodo,
  FileText,
  ShieldCheck,
  CalendarClock,
  BarChart3,
  Database,
  History,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import logo from '/assets/logo.png';

const navigationGroups = [
  {
    title: 'WORKSPACE',
    items: [
      { name: 'Dashboard', path: '/workspace/dashboard', icon: LayoutDashboard },
      { name: 'Search', path: '/workspace/search', icon: Search },
      { name: 'Repository', path: '/workspace/repository', icon: FolderKanban },
      { name: 'Upload', path: '/workspace/upload', icon: UploadCloud, highlight: true },
      { name: 'Bulk Upload', path: '/workspace/bulk-upload', icon: Layers },
      { name: 'Scan QR', path: '/workspace/scan-qr', icon: QrCode }
    ]
  },
  {
    title: 'PHYSICAL',
    items: [
      { name: 'Storage Map', path: '/physical/storage-map', icon: Box },
      { name: 'Custody & Handovers', path: '/physical/custody', icon: ArrowRightLeft },
      { name: 'Check-out Register', path: '/physical/checkout', icon: ClipboardList },
      { name: 'Physical Audit', path: '/physical/audit', icon: CheckSquare }
    ]
  },
  {
    title: 'WORKFLOW',
    items: [
      { name: 'My Tasks', path: '/workflow/tasks', icon: ListTodo },
      { name: 'Requests', path: '/workflow/requests', icon: FileText },
      { name: 'Approvals', path: '/workflow/approvals', icon: ShieldCheck, hasBadge: true },
      { name: 'Review & Retention', path: '/workflow/review-retention', icon: CalendarClock }
    ]
  },
  {
    title: 'GOVERNANCE',
    items: [
      { name: 'Reports', path: '/governance/reports', icon: BarChart3 },
      { name: 'Master Data', path: '/governance/master-data', icon: Database },
      { name: 'Audit Trail', path: '/governance/audit-trail', icon: History },
      { name: 'Settings', path: '/governance/settings', icon: Settings }
    ]
  }
];

// Strict Role-Based Access Control Mapping
export const isRouteAllowedForRole = (itemPath, role) => {
  if (!role || role === 'Admin') return true;

  if (role === 'QA Manager' || role === 'QA') {
    const allowed = [
      '/workspace/dashboard',
      '/workspace/search',
      '/workspace/repository',
      '/physical/storage-map',
      '/physical/custody',
      '/physical/checkout',
      '/physical/audit',
      '/workflow/tasks',
      '/workflow/requests',
      '/workflow/approvals',
      '/workflow/review-retention',
      '/governance/reports',
      '/governance/audit-trail'
    ];
    return allowed.includes(itemPath);
  }

  if (role === 'Document Controller') {
    const allowed = [
      '/workspace/dashboard',
      '/workspace/search',
      '/workspace/repository',
      '/workspace/upload',
      '/workspace/bulk-upload',
      '/workspace/scan-qr',
      '/physical/storage-map',
      '/physical/custody',
      '/physical/checkout',
      '/physical/audit',
      '/workflow/tasks',
      '/workflow/requests'
    ];
    return allowed.includes(itemPath);
  }

  if (role === 'Custodian') {
    const allowed = [
      '/workspace/dashboard',
      '/workspace/search',
      '/workspace/repository',
      '/workspace/scan-qr',
      '/physical/storage-map',
      '/physical/custody',
      '/physical/checkout',
      '/workflow/tasks',
      '/workflow/requests'
    ];
    return allowed.includes(itemPath);
  }

  if (role === 'User' || role === 'User / Viewer' || role === 'Viewer' || role === 'Employee') {
    const allowed = [
      '/workspace/dashboard',
      '/workspace/search',
      '/workspace/repository',
      '/workspace/scan-qr',
      '/physical/storage-map',
      '/physical/checkout',
      '/workflow/tasks',
      '/workflow/requests',
      '/governance/settings'
    ];
    return allowed.includes(itemPath);
  }

  return true;
};

export const Sidebar = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { t } = useLanguage();
  const userRole = user?.role || 'User';

  // Toggle Collapse State (persists in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('vidyagxp_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('vidyagxp_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Filter navigation groups according to active persona's RBAC permissions
  const filteredGroups = navigationGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => isRouteAllowedForRole(item.path, userRole))
    }))
    .filter(group => group.items.length > 0);

  return (
    <aside
      className={`bg-gradient-to-b from-orange-100/85 via-amber-95/50 to-white dark:from-slate-900 dark:via-orange-950/20 dark:to-slate-900 text-slate-700 dark:text-slate-300 flex flex-col h-screen select-none border-r border-orange-2  300/80 dark:border-slate-800 shrink-0 shadow-xs transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-orange-250/80 dark:border-slate-800 bg-transparent transition-colors duration-200">
        {!isCollapsed ? (
          <>
            <Link
              to="/workspace/dashboard"
              title="VidyaGxP Pharma Vault - Go to Dashboard"
              className="flex items-center gap-3 min-w-0 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-300 border-slate-800 flex items-center justify-center text-orange-500 shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                <img src={logo} alt="DocShield Logo" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 dark:text-white tracking-tight text-base flex items-center gap-1.5 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  VidyaGxP
                </div>
                <div className="text-[11px] text-orange-600 dark:text-orange-400 font-extrabold tracking-tight truncate">
                  Pharma Vault
                </div>
              </div>
            </Link>

            {/* Collapse Button Symbol */}
            <button
              type="button"
              onClick={toggleSidebar}
              title="Collapse Sidebar (Symbols Only)"
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-100/60 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          /* Collapsed Header with Click to Redirect & Expand */
          <div className="w-full flex items-center justify-center relative group">
            <Link
              to="/workspace/dashboard"
              title="Go to Dashboard"
              className="w-10 h-10 rounded-xl bg-slate-300 border border-slate-400/40 dark:border-slate-800 flex items-center justify-center text-orange-500 shadow-xs hover:scale-105 transition-transform cursor-pointer"
            >
              <img src={logo} alt="DocShield Logo" className="w-6 h-6" />
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              title="Expand Sidebar"
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center text-[9px] shadow-xs cursor-pointer transition-colors"
            >
              <PanelLeftOpen className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>

      {/* Nav List - Strictly Filtered by Role Access */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {filteredGroups.map((group) => (
          <div key={group.title}>
            {!isCollapsed ? (
              <div className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-2">
                {t(group.title, group.title)}
              </div>
            ) : (
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2.5 mx-2" title={t(group.title, group.title)} />
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const translatedName = t(item.name, item.name);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? translatedName : undefined}
                    className={({ isActive }) => `
                      group flex items-center transition-all duration-200 ease-spring rounded-xl active:scale-[0.98]
                      ${isCollapsed ? 'justify-center w-12 h-10 mx-auto' : 'justify-between px-3 py-2 text-[13px] font-medium hover:translate-x-1'}
                      ${
                        isActive
                          ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-950 dark:text-orange-300 font-bold border-l-4 border-orange-600 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-orange-900 dark:hover:text-orange-300 hover:bg-orange-50/40 dark:hover:bg-slate-800/60'
                      }
                      ${item.highlight ? 'text-orange-600 dark:text-orange-400 font-semibold' : ''}
                    `}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                      <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      {!isCollapsed && <span>{translatedName}</span>}
                    </div>

                    {item.hasBadge && unreadCount > 0 && (
                      !isCollapsed ? (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse-glow">
                          {unreadCount}
                        </span>
                      ) : (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                      )
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Quick Toggle Control */}
      <div className="p-2.5 border-t border-orange-200/50 dark:border-slate-800 bg-orange-50/40 dark:bg-slate-900/40 flex items-center justify-center transition-colors duration-200">
        <button
          type="button"
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className={`flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-orange-950 dark:hover:text-orange-300 hover:bg-orange-100/60 dark:hover:bg-slate-800 border border-orange-200/60 dark:border-slate-700/80 transition cursor-pointer ${
            isCollapsed ? 'w-10 h-9' : 'w-full px-3'
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-orange-600" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-orange-600" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
