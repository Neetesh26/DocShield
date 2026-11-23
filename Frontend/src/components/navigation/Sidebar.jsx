import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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

  if (role === 'User / Viewer' || role === 'Viewer' || role === 'Employee') {
    const allowed = [
      '/workspace/dashboard',
      '/workspace/search',
      '/workspace/repository',
      '/workflow/tasks',
      '/workflow/requests'
    ];
    return allowed.includes(itemPath);
  }

  return true;
};

export const Sidebar = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const userRole = user?.role || 'User / Viewer';

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
      className={`bg-white text-slate-700 flex flex-col h-screen select-none border-r border-slate-200 shrink-0 shadow-xs transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 bg-white">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-orange-500 shadow-xs shrink-0">
                <Shield className="w-5 h-5 text-orange-500" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 tracking-tight text-base flex items-center gap-1.5 truncate">
                  VidyaGxP
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200 font-mono">
                    GxP
                  </span>
                </div>
                <div className="text-[11px] text-orange-600 font-semibold tracking-tight truncate">
                  Pharma Vault
                </div>
              </div>
            </div>

            {/* Collapse Button Symbol */}
            <button
              type="button"
              onClick={toggleSidebar}
              title="Collapse Sidebar (Symbols Only)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          /* Collapsed Header with Click to Expand */
          <div className="w-full flex items-center justify-center">
            <button
              type="button"
              onClick={toggleSidebar}
              title="Expand Sidebar"
              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-orange-500 shadow-xs hover:bg-slate-800 transition cursor-pointer relative group"
            >
              <Shield className="w-5 h-5 text-orange-500" />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center text-[9px] shadow-xs">
                <PanelLeftOpen className="w-2.5 h-2.5" />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Nav List - Strictly Filtered by Role Access */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {filteredGroups.map((group) => (
          <div key={group.title}>
            {!isCollapsed ? (
              <div className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                {group.title}
              </div>
            ) : (
              <div className="h-px bg-slate-200 my-2.5 mx-2" title={group.title} />
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.name : undefined}
                    className={({ isActive }) => `
                      flex items-center transition-all rounded-xl
                      ${isCollapsed ? 'justify-center w-12 h-10 mx-auto' : 'justify-between px-3 py-2 text-[13px] font-medium'}
                      ${
                        isActive
                          ? 'bg-orange-50 text-orange-950 font-bold border-l-4 border-orange-600 shadow-2xs'
                          : 'text-slate-600 hover:text-orange-900 hover:bg-orange-50/40'
                      }
                      ${item.highlight ? 'text-orange-600 font-semibold' : ''}
                    `}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>

                    {item.hasBadge && unreadCount > 0 && (
                      !isCollapsed ? (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          {unreadCount}
                        </span>
                      ) : (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
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
      <div className="p-2.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-center">
        <button
          type="button"
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className={`flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-orange-900 hover:bg-orange-50 border border-slate-200 transition cursor-pointer ${
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
