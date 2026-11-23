import React from 'react';
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
  FileCheck2,
  Lock
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
    // QA Manager: Approvals, audit trail, reports, review & retention, repository, tasks, requests
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
    // Document Controller: Upload, issue/receive, physical audits, storage map, custody, checkouts
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
    // Custodian: Owns department documents, handovers, checkouts, storage map view
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
    // User / Viewer: Search, view, chat, raise requests
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

  // Filter navigation groups according to active persona's RBAC permissions
  const filteredGroups = navigationGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => isRouteAllowedForRole(item.path, userRole))
    }))
    .filter(group => group.items.length > 0);

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col h-screen select-none border-r border-slate-200 shrink-0 shadow-xs">
      {/* Brand Header: Deep Slate (#0F172A) + Bhagwa Orange Accent */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-orange-500 shadow-xs">
            <Shield className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-tight text-base flex items-center gap-1.5">
              VidyaGxP
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200 font-mono">
                GxP
              </span>
            </div>
            <div className="text-[11px] text-orange-600 font-semibold tracking-tight">
              Pharma Vault
            </div>
          </div>
        </div>
      </div>

      {/* User Persona Profile Pill in Sidebar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <div className="text-xs font-bold text-slate-900 truncate">
            {user?.name || 'Authorized User'}
          </div>
          <div className="text-[10px] text-slate-500 font-medium truncate">
            {user?.department || 'GxP Operations'}
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
          {userRole}
        </span>
      </div>

      {/* Nav List - Strictly Filtered by Role Access */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all
                      ${isActive
                        ? 'bg-orange-50 text-orange-950 font-bold border-l-4 border-orange-600 shadow-2xs'
                        : 'text-slate-600 hover:text-orange-900 hover:bg-orange-50/40'}
                      ${item.highlight ? 'text-orange-600 font-semibold' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.hasBadge && unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        {unreadCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer GxP Status */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></div>
          <span className="font-semibold text-slate-700">21 CFR Part 11</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">v1.0.4-PROD</span>
      </div>
    </aside>
  );
};
