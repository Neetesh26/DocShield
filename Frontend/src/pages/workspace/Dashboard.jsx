import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  UploadCloud,
  QrCode,
  Search,
  Layers,
  ArrowRightLeft,
  ClipboardList,
  Calendar,
  ShieldAlert,
  TrendingUp,
  Box,
  FileCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services';

const COLORS = ['#0D9488', '#0284C7', '#6366F1', '#EC4899', '#F59E0B', '#10B981'];

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [widgets, setWidgets] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, chartsRes, widgetsRes] = await Promise.all([
          reportService.getDashboardStats(),
          reportService.getDashboardCharts(),
          reportService.getDashboardWidgets()
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (chartsRes.success) setCharts(chartsRes.data);
        if (widgetsRes.success) setWidgets(widgetsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-medium">Loading GxP Document Metrics...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Documents', value: stats?.totalDocuments || 0, icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Effective Documents', value: stats?.effectiveDocuments || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', link: '/workflow/approvals' },
    { label: 'Pending Requests', value: stats?.pendingRequests || 0, icon: FileCheck, color: 'text-sky-600', bg: 'bg-sky-50', link: '/workflow/requests' },
    { label: 'Due for Review', value: stats?.dueForReview || 0, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/workflow/review-retention' },
    { label: 'Overdue Checkouts', value: stats?.overdueCheckouts || 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', link: '/physical/checkout' },
    { label: 'Pending Handovers', value: stats?.pendingHandovers || 0, icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-50', link: '/physical/custody' },
    { label: 'Uploaded Recently', value: stats?.uploadedRecently || 0, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' }
  ];

  const quickActions = [
    { label: 'Upload Document', icon: UploadCloud, path: '/workspace/upload', primary: true },
    { label: 'Search Archive', icon: Search, path: '/workspace/search' },
    { label: 'Scan QR Label', icon: QrCode, path: '/workspace/scan-qr' },
    { label: 'Bulk Ingestion', icon: Layers, path: '/workspace/bulk-upload' },
    { label: 'New Request', icon: FileText, path: '/workflow/requests' },
    { label: 'Check Out Record', icon: ClipboardList, path: '/physical/checkout' },
    { label: 'Custody Handover', icon: ArrowRightLeft, path: '/physical/custody' },
    { label: 'Storage Map', icon: Box, path: '/physical/storage-map' }
  ];

  return (
    <div className="space-y-6">
      {/* Greeting & Date Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Quality Officer'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {todayStr} • GxP Document Repository Active • Facility: Main Campus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/workspace/upload')}
            className="flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-teal-600/30 transition"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Document (4-Step Wizard)
          </button>
        </div>
      </div>

      {/* 8 Statistics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => card.link && navigate(card.link)}
              className={`p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition ${
                card.link ? 'cursor-pointer hover:shadow-sm' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
          Quick Launch Actions
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {quickActions.map((act, i) => {
            const Icon = act.icon;
            return (
              <button
                key={i}
                onClick={() => navigate(act.path)}
                className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center gap-1.5 transition ${
                  act.primary
                    ? 'bg-teal-50/70 border-teal-200 text-teal-800 hover:bg-teal-100 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${act.primary ? 'text-teal-600' : 'text-slate-500'}`} />
                <span className="text-[11px] leading-tight">{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Documents by Type */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Documents by Document Type
          </h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.byType || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Document Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Document Status Distribution
          </h2>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.byStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(charts?.byStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Storage Utilization */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Physical Vault Capacity vs Utilization
          </h2>
          <div className="space-y-4 pt-2">
            {(charts?.storageStats || []).map((loc, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{loc.building}</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {loc.occupancy} / {loc.capacity} ({loc.utilization}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      loc.utilization > 80 ? 'bg-amber-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, loc.utilization)}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {(!charts?.storageStats || charts.storageStats.length === 0) && (
              <div className="text-center text-xs text-slate-400 py-8">No storage facilities registered</div>
            )}
          </div>
        </div>
      </div>

      {/* Operational Widgets: Recent Documents & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Widget 1: Recent Documents Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Repository Ingestions
            </h2>
            <button
              onClick={() => navigate('/workspace/repository')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="pb-2">Doc #</th>
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Rev</th>
                  <th className="pb-2">Location</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(widgets?.recentDocuments || []).map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 font-mono font-medium text-teal-700">{doc.documentNumber}</td>
                    <td className="py-2.5 text-slate-800 font-medium truncate max-w-[200px]" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="py-2.5 text-slate-500">{doc.version}</td>
                    <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                      {doc.storageLocation?.code || 'Vault'}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => navigate(`/documents/${doc._id}`)}
                        className="p-1 text-slate-500 hover:text-teal-600 transition"
                        title="View details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Widget 2: Recent GxP Audit Log Stream */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              21 CFR Part 11 Audit Trail Stream
            </h2>
            <button
              onClick={() => navigate('/governance/audit-trail')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              Full Trail <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(widgets?.recentActivities || []).slice(0, 6).map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs pb-2 border-b border-slate-100 last:border-0">
                <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] truncate mt-0.5">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

