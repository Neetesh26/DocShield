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
  TrendingUp,
  Box,
  FileCheck,
  ChevronRight,
  ExternalLink,
  ArrowUpRight,
  RotateCw,
  FolderKanban,
  Sparkles,
  Bot,
  Zap
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services';
import { Button3D } from '../../components/common/Button3D';

// GxP-compliant palette for dynamically returned API document types
const DONUT_PALETTE = [
  '#7c3aed', // Royal Violet
  '#9333ea', // Vivid Purple
  '#f59e0b', // Amber
  '#e11d48', // Crimson Rose
  '#a855f7', // Bright Purple
  '#c084fc', // Light Violet
  '#d97706', // Bronze Amber
  '#64748b', // Slate
  '#ec4899', // Pink
  '#ea580c', // Orange
  '#84cc16', // Lime
  '#1e1b4b', // Deep Indigo
  '#6b21a8', // Deep Violet
  '#8b5cf6', // Soft Purple
  '#94a3b8'  // Light Slate
];

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [widgets, setWidgets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDonutIndex, setActiveDonutIndex] = useState(null);
  const [dashboardAiQuery, setDashboardAiQuery] = useState('');

  const handleDashboardAiSearch = (e) => {
    if (e) e.preventDefault();
    if (dashboardAiQuery.trim()) {
      navigate(`/workspace/search?q=${encodeURIComponent(dashboardAiQuery.trim())}&mode=ai`);
    }
  };

  // Pure API Fetching - strictly live data from MongoDB
  const fetchDashboardData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [statsRes, chartsRes, widgetsRes] = await Promise.allSettled([
        reportService.getDashboardStats(),
        reportService.getDashboardCharts(),
        reportService.getDashboardWidgets()
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.data);
      }
      if (chartsRes.status === 'fulfilled' && chartsRes.value?.success) {
        setCharts(chartsRes.value.data);
      }
      if (widgetsRes.status === 'fulfilled' && widgetsRes.value?.success) {
        setWidgets(widgetsRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data from API', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
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
        <div className="w-9 h-9 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-purple-800">Fetching Live GxP KPI Metrics from Database...</p>
      </div>
    );
  }

  // 8 Fully Clickable KPI Cards mapping directly to database fields
  const statCards = [
    {
      label: 'Total Documents',
      value: stats?.totalDocuments ?? 0,
      icon: FileText,
      color: 'text-purple-700',
      bg: 'bg-purple-100',
      link: '/workspace/repository',
      desc: 'All active indexed records'
    },
    {
      label: 'Effective Documents',
      value: stats?.effectiveDocuments ?? 0,
      icon: CheckCircle,
      color: 'text-violet-700',
      bg: 'bg-violet-100',
      link: '/workspace/repository?status=Effective',
      desc: 'Released & verified'
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingApprovals ?? 0,
      icon: Clock,
      color: 'text-amber-700',
      bg: 'bg-amber-100',
      link: '/workflow/approvals',
      desc: '21 CFR sign-off needed'
    },
    {
      label: 'Pending Requests',
      value: stats?.pendingRequests ?? 0,
      icon: FileCheck,
      color: 'text-purple-800',
      bg: 'bg-purple-50',
      link: '/workflow/requests',
      desc: 'Issuance & revision queues'
    },
    {
      label: 'Due for Review',
      value: stats?.dueForReview ?? 0,
      icon: Calendar,
      color: 'text-rose-700',
      bg: 'bg-rose-100',
      link: '/workflow/review-retention',
      desc: 'Approaching review cycle'
    },
    {
      label: 'Overdue Checkouts',
      value: stats?.overdueCheckouts ?? 0,
      icon: AlertTriangle,
      color: 'text-rose-800',
      bg: 'bg-rose-50',
      link: '/physical/checkout',
      desc: 'Physical loans past return date'
    },
    {
      label: 'Pending Handovers',
      value: stats?.pendingHandovers ?? 0,
      icon: ArrowRightLeft,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      link: '/physical/custody',
      desc: 'Custody transfer confirmations'
    },
    {
      label: 'Uploaded Recently',
      value: stats?.uploadedRecently ?? 0,
      icon: TrendingUp,
      color: 'text-amber-800',
      bg: 'bg-amber-50',
      link: '/workspace/repository?sort=newest',
      desc: 'Past 30 days intake'
    }
  ];

  // Quick Action Buttons
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

  // Strictly Real API Data for Donut Chart (NO static types, NO fallback arrays)
  const donutData = (charts?.byType || []).map((item, idx) => ({
    name: item.name || 'Unclassified',
    value: item.value,
    color: DONUT_PALETTE[idx % DONUT_PALETTE.length]
  }));

  // Strictly Real API Data for Uploads Over Time (NO defaultCurve, NO fake values)
  const trendData = (charts?.uploadTrends || []).map((t) => ({
    month: t.month,
    documents: t.documents ?? 0
  }));

  // Strictly Real API Data for Storage Utilization (NO fake buildings)
  const storageStats = charts?.storageStats || [];

  // Strictly Real API Data for Recent Ingestions
  const recentDocs = widgets?.recentDocuments || [];

  return (
    <div className="space-y-6">
      
      {/* Greeting & Date Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-purple-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Quality Officer'}
            </h1>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
              {user?.role || 'Admin'}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {todayStr} • GxP Document Repository Active • Facility: Main Campus Vault
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh Live Data Button */}
          <Button3D
            variant="light"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            title="Re-fetch live KPIs from API"
          >
            <RotateCw className={`w-3.5 h-3.5 text-purple-700 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Live API'}</span>
          </Button3D>

          {/* Upload Button */}
          <Button3D
            onClick={() => navigate('/workspace/upload')}
            variant="primary"
            size="md"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Upload Document
          </Button3D>
        </div>
      </div>

      {/* Advanced AI Search Bar in Dashboard (Compact AI System) */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50/50 p-4 rounded-2xl border border-purple-200 shadow-xs space-y-2.5">
        <form onSubmit={handleDashboardAiSearch} className="space-y-2.5">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-purple-600 pointer-events-none flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <input
              type="text"
              value={dashboardAiQuery}
              onChange={(e) => setDashboardAiQuery(e.target.value)}
              placeholder="Ask DocuShield AI in natural language (e.g. 'Show HPLC SOPs in QC Lab', 'Paracetamol BMR', 'Records in Building A Vault')..."
              className="w-full pl-11 pr-28 py-2.5 text-xs md:text-sm bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-medium text-slate-800 placeholder:text-slate-400 transition shadow-2xs"
            />
            <div className="absolute right-1.5">
              <Button3D
                type="submit"
                variant="primary"
                size="sm"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                <span>Ask AI</span>
              </Button3D>
            </div>
          </div>

          {/* 1-Click AI Quick Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Bot className="w-3 h-3 text-purple-600" /> AI Suggestions:
            </span>
            {[
              'HPLC Calibration SOP in QC',
              'Paracetamol 500mg Master BMR',
              'Cleaning Validation Protocols',
              'Finished Product Specifications'
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => navigate(`/workspace/search?q=${encodeURIComponent(chip)}&mode=ai`)}
                className="shrink-0 px-2.5 py-0.5 rounded-full bg-white border border-purple-200 text-purple-900 hover:bg-purple-100 hover:border-purple-300 transition text-[11px] font-medium shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-2.5 h-2.5 text-purple-600" />
                <span>{chip}</span>
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* 8 Statistics Metric Cards - Strictly Fetched from Database */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(card.link)}
              className="group p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer relative overflow-hidden"
              title={`Click to open ${card.label}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 group-hover:text-purple-700 transition">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${card.bg} ${card.color} flex items-center justify-center transition group-hover:scale-110 shadow-xs`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-baseline justify-between">
                <span>{card.value}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">{card.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Action Bar - Tactile Clickable */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
          Quick Launch Actions (Clickable)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {quickActions.map((act, i) => {
            const Icon = act.icon;
            return (
              <button
                key={i}
                onClick={() => navigate(act.path)}
                className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition active:translate-y-[2px] cursor-pointer ${
                  act.primary
                    ? 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-purple-50/50 hover:border-purple-200 text-slate-700 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${act.primary ? 'text-purple-700' : 'text-slate-500'}`} />
                <span className="text-[11px] leading-tight">{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics Charts: Pure API Data Only */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: Documents by Type (Donut Chart strictly from API charts.byType) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Documents by type</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 font-semibold">
                {stats?.totalDocuments ?? 0} Total
              </span>
            </div>
            <button
              onClick={() => navigate('/workspace/repository')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 hover:underline flex items-center gap-1 cursor-pointer"
              title="Browse all documents in repository"
            >
              Browse
            </button>
          </div>

          {donutData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-slate-400 text-xs">
              <FolderKanban className="w-8 h-8 text-slate-300 mb-2" />
              <span>No documents indexed in database yet</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-4">
              {/* Donut Chart View */}
              <div className="md:col-span-6 h-56 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveDonutIndex(index)}
                      onMouseLeave={() => setActiveDonutIndex(null)}
                      onClick={(entry) => navigate(`/workspace/repository?type=${encodeURIComponent(entry.name)}`)}
                      className="cursor-pointer"
                    >
                      {donutData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#ffffff"
                          strokeWidth={activeDonutIndex === index ? 3 : 1.5}
                          className="transition-all hover:opacity-90 cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                              <p className="font-bold">{data.name}</p>
                              <p className="text-slate-300">{data.value} Documents</p>
                              <p className="text-[10px] text-purple-300 mt-0.5">Click to view in repository</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend: Strictly renders real API document types */}
              <div className="md:col-span-6 max-h-56 overflow-y-auto pr-1">
                <div className="flex flex-col gap-1.5 text-[11px]">
                  {donutData.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(`/workspace/repository?type=${encodeURIComponent(item.name)}`)}
                      onMouseEnter={() => setActiveDonutIndex(idx)}
                      onMouseLeave={() => setActiveDonutIndex(null)}
                      className={`flex items-center justify-between p-1.5 rounded-lg transition cursor-pointer ${
                        activeDonutIndex === idx ? 'bg-purple-100 font-bold text-purple-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                      title={`Click to filter by ${item.name}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate max-w-[150px]">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-purple-800 text-[11px] ml-2">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CHART 2: Uploads Over Time (Spline Area Chart strictly from API charts.uploadTrends) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Uploads over time</h2>
            <span
              onClick={() => navigate('/workspace/repository?sort=createdAt')}
              className="text-xs text-slate-400 font-medium cursor-pointer hover:text-purple-600 transition"
              title="Click to view chronological archive"
            >
              last 12 months
            </span>
          </div>

          <div className="h-60 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 15, left: -25, bottom: 0 }}
                onClick={() => navigate('/workspace/repository')}
                className="cursor-pointer"
              >
                <defs>
                  <linearGradient id="uploadsSpline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                          <p className="font-bold text-purple-300">{data.month}</p>
                          <p className="text-slate-100">{data.documents} Documents Uploaded</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Click to view repository</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="documents"
                  stroke="#9333ea"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#uploadsSpline)"
                  activeDot={{ r: 6, fill: '#9333ea', stroke: '#ffffff', strokeWidth: 2 }}
                  dot={{ r: 4, fill: '#ffffff', stroke: '#9333ea', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Storage Utilization & Live Operational Tables (Pure API Data Only) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Storage Capacity Overview - Strictly Real Data from charts.storageStats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Physical Vault Utilization
            </h2>
            <button
              onClick={() => navigate('/physical/storage-map')}
              className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Storage Map <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-4 pt-1">
            {storageStats.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">
                No storage facilities registered in database
              </div>
            ) : (
              storageStats.map((loc, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/physical/storage-map?building=${encodeURIComponent(loc.building)}`)}
                  className="space-y-1.5 p-2 rounded-lg hover:bg-purple-50/50 transition cursor-pointer"
                  title="Click to view vault coordinates"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{loc.building}</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {loc.occupancy} / {loc.capacity} ({loc.utilization}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        loc.utilization > 80 ? 'bg-amber-500' : 'bg-purple-600'
                      }`}
                      style={{ width: `${Math.min(100, loc.utilization)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Repository Ingestions Table - Strictly Real Data from widgets.recentDocuments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Repository Ingestions (Live API Data)
            </h2>
            <button
              onClick={() => navigate('/workspace/repository')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
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
                {recentDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No recent document ingestions found in database
                    </td>
                  </tr>
                ) : (
                  recentDocs.map((doc) => (
                    <tr
                      key={doc._id}
                      onClick={() => navigate(`/documents/${doc._id}`)}
                      className="hover:bg-purple-50/60 transition cursor-pointer"
                      title={`Open ${doc.documentNumber}`}
                    >
                      <td className="py-2.5 font-mono font-bold text-purple-700">{doc.documentNumber}</td>
                      <td className="py-2.5 text-slate-800 font-medium truncate max-w-[220px]" title={doc.title}>
                        {doc.title}
                      </td>
                      <td className="py-2.5 text-slate-500 font-mono">{doc.version}</td>
                      <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                        {doc.storageLocation?.code || 'Vault Coordinate'}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="p-1 text-slate-400 hover:text-purple-700 inline-flex items-center gap-1">
                          View <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
