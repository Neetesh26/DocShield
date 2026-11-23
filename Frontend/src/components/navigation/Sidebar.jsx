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
  FileCheck2
} from 'lucide-react';
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

export const Sidebar = () => {
  const { unreadCount } = useNotifications();

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col h-screen select-none border-r border-slate-200 shrink-0 shadow-sm">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-purple-100 bg-purple-50/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-700 to-violet-500 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-wide text-base flex items-center gap-1.5">
              DocuShield
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">GxP</span>
            </div>
            <div className="text-[11px] text-purple-600 font-medium tracking-tight">by VidyaGxP</div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navigationGroups.map((group) => (
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
                      flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all
                      ${isActive
                        ? 'bg-purple-100/70 text-purple-800 font-semibold border-l-4 border-purple-600 shadow-sm'
                        : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'}
                      ${item.highlight ? 'text-purple-600 font-semibold' : ''}
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
      <div className="p-3.5 border-t border-purple-100 bg-purple-50/30 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
          <span className="font-medium text-slate-700">21 CFR Part 11</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">v1.0.4-PROD</span>
      </div>
    </aside>
  );
};

