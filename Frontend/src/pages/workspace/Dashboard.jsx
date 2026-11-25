import React, { useState, useEffect, useRef } from 'react';
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
  Compass,
  Zap,
  Building2
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
import { isRouteAllowedForRole } from '../../components/navigation/Sidebar';
import { toast } from '../../context/ToastContext';

// GxP Clinical Palette for dynamically returned API document types
const DONUT_PALETTE = [
  '#ea580c', // Deep Teal
  '#f59e0b', // Medical Cyan
  '#c2410c', // Clinical Blue
  '#f97316', // Emerald Teal
  '#f59e0b', // Amber
  '#e11d48', // Rose
  '#475569', // Slate
  '#059669', // Emerald
  '#334155'  // Deep Slate
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
  const [showTypeahead, setShowTypeahead] = useState(false);
  const typeaheadRef = useRef(null);

  // Close typeahead dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeaheadRef.current && !typeaheadRef.current.contains(e.target)) {
        setShowTypeahead(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDashboardAiSearch = (e, customQuery) => {
    if (e) e.preventDefault();
    const queryToRun = (customQuery !== undefined ? customQuery : dashboardAiQuery).trim();
    if (queryToRun) {
      setShowTypeahead(false);
      navigate(`/workspace/search?q=${encodeURIComponent(queryToRun)}&mode=ai`);
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
      if (isManual) {
        toast.success('Refreshed data successfully.');
      }
    } catch (err) {
      console.error('Failed to load dashboard data from API', err);
      if (isManual) {
        toast.error('Failed to sync live dashboard data.');
      }
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
        <div className="w-9 h-9 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-orange-800">Fetching Live GxP KPI Metrics from Database...</p>
      </div>
    );
  }

  // 8 Fully Clickable KPI Cards mapping directly to database fields
  const allStatCards = [
    {
      label: 'Total Documents',
      value: stats?.totalDocuments ?? 0,
      icon: FileText,
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      link: '/workspace/repository',
      desc: 'All active indexed records'
    },
    {
      label: 'Effective Documents',
      value: stats?.effectiveDocuments ?? 0,
      icon: CheckCircle,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      link: '/workspace/repository?status=Effective',
      desc: 'Released & verified'
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingApprovals ?? 0,
      icon: Clock,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      link: '/workflow/approvals',
      desc: '21 CFR sign-off needed'
    },
    {
      label: 'Pending Requests',
      value: stats?.pendingRequests ?? 0,
      icon: FileCheck,
      color: 'text-orange-800',
      bg: 'bg-orange-50',
      link: '/workflow/requests',
      desc: 'Issuance & revision queues'
    },
    {
      label: 'Due for Review',
      value: stats?.dueForReview ?? 0,
      icon: Calendar,
      color: 'text-rose-700',
      bg: 'bg-rose-50',
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
      color: 'text-orange-600',
      bg: 'bg-orange-50',
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

  // Strictly filter visible KPI cards by active role permissions
  const statCards = allStatCards.filter(card => isRouteAllowedForRole(card.link.split('?')[0], user?.role));

  // Quick Action Buttons strictly filtered by active role permissions
  const allQuickActions = [
    { label: 'Upload Document', icon: UploadCloud, path: '/workspace/upload', primary: true },
    { label: 'Search Archive', icon: Search, path: '/workspace/search' },
    { label: 'Scan QR Label', icon: QrCode, path: '/workspace/scan-qr' },
    { label: 'Bulk Ingestion', icon: Layers, path: '/workspace/bulk-upload' },
    { label: 'New Request', icon: FileText, path: '/workflow/requests' },
    { label: 'Check Out Record', icon: ClipboardList, path: '/physical/checkout' },
    { label: 'Custody Handover', icon: ArrowRightLeft, path: '/physical/custody' },
    { label: 'Storage Map', icon: Box, path: '/physical/storage-map' }
  ];

  const quickActions = allQuickActions.filter(act => isRouteAllowedForRole(act.path, user?.role));

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

  // Suggestion Chips strictly derived from live MongoDB documents (NO static/hardcoded dummy queries)
  const aiSuggestionChips = recentDocs.slice(0, 6).map(d => ({
    label: d.documentNumber,
    query: d.documentNumber,
    title: d.title,
    badge: d.department || (d.version ? `v${d.version}` : 'Vault')
  }));

  // Dynamic Typeahead matches in dashboard search against live database documents
  const typeaheadMatches = dashboardAiQuery.trim().length >= 1
    ? recentDocs.filter(d =>
        (d.title || '').toLowerCase().includes(dashboardAiQuery.toLowerCase()) ||
        (d.department || '').toLowerCase().includes(dashboardAiQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      
      {/* Greeting & Date Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Quality Officer'}
            </h1>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200 font-mono">
              {user?.role || 'Admin'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {todayStr}
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
            <RotateCw className={`w-3.5 h-3.5 text-orange-700 dark:text-orange-400 mr-1.5 inline ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </Button3D>

          {/* Upload Button (Only if authorized for upload) */}
          {isRouteAllowedForRole('/workspace/upload', user?.role) && (
            <Button3D
              onClick={() => navigate('/workspace/upload')}
              variant="primary"
              size="md"
            >
              <UploadCloud className="w-4 h-4 mr-1.5 inline" />
              Upload
            </Button3D>
          )}
        </div>
      </div>

      {/* Advanced Repository Search Bar in Dashboard (Live Typeahead Search) */}
      <div className="bg-gradient-to-r from-orange-50/60 via-white to-slate-50/60 p-4 rounded-2xl border border-orange-200/80 shadow-xs space-y-2.5 relative" ref={typeaheadRef}>
        <form onSubmit={handleDashboardAiSearch} className="space-y-2.5">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-orange-600 pointer-events-none flex items-center gap-1.5">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={dashboardAiQuery}
              onChange={(e) => {
                setDashboardAiQuery(e.target.value);
                setShowTypeahead(true);
              }}
              onFocus={() => setShowTypeahead(true)}
              placeholder="Search repository"
              className="w-full pl-11 pr-28 py-2.5 text-xs md:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 font-medium text-slate-800 placeholder:text-slate-400 transition shadow-2xs"
            />
            <div className="absolute right-1.5">
              <Button3D
                type="submit"
                variant="primary"
                size="sm"
              >
                <Search className="w-3.5 h-3.5 mr-1 inline" />
                <span>Search</span>
              </Button3D>
            </div>
          </div>

          {/* Live Autocomplete Typeahead Dropdown */}
          {showTypeahead && typeaheadMatches.length > 0 && (
            <div className="absolute left-4 right-4 top-[56px] bg-white border border-orange-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
              <div className="p-2.5 bg-orange-50/80 border-b border-orange-100 flex items-center justify-between text-[11px] font-semibold text-orange-900">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-orange-600" />
                  Indexed Records Matching Query:
                </span>
                <span className="text-[10px] text-orange-700 font-mono">
                  {typeaheadMatches.length} Matches
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {typeaheadMatches.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => {
                      setShowTypeahead(false);
                      navigate(`/documents/${doc._id}`);
                    }}
                    className="p-2.5 hover:bg-orange-50/60 transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <FileCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-orange-800">{doc.documentNumber}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                            {doc.department}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium truncate mt-0.5 text-[11px]">{doc.title}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-orange-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1-Click Fast Inquiries & Database Document Identifiers */}
          {aiSuggestionChips.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <Compass className="w-3 h-3 text-orange-600" /> Quick Inquiries:
              </span>
              {aiSuggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDashboardAiQuery(chip.query);
                    handleDashboardAiSearch(null, chip.query);
                  }}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-800 hover:bg-orange-50 hover:border-orange-300 transition text-[11px] font-medium shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title={chip.title || chip.query}
                >
                  <Zap className="w-2.5 h-2.5 text-orange-600 shrink-0" />
                  <span className="font-semibold text-slate-800">{chip.label}</span>
                  {chip.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-50 text-orange-700 font-mono font-semibold">
                      {chip.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
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
              className="group p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer relative overflow-hidden"
              title={`Click to open ${card.label}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 group-hover:text-orange-700 transition">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${card.bg} ${card.color} flex items-center justify-center transition group-hover:scale-110 shadow-xs`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-baseline justify-between">
                <span>{card.value}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 transition" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">{card.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Action Bar - Tactile Clickable */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
          QUICK LAUNCH ACTIONS
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
                    ? 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100 font-semibold shadow-xs'
                    : 'border-slate-200 hover:bg-orange-50/50 hover:border-orange-200 text-slate-700 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${act.primary ? 'text-orange-700' : 'text-slate-500'}`} />
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
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Documents by Type</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200 font-semibold">
                {stats?.totalDocuments ?? 0} Total
              </span>
            </div>
            <button
              onClick={() => navigate('/workspace/repository')}
              className="text-xs font-semibold text-orange-700 hover:text-orange-800 hover:underline flex items-center gap-1 cursor-pointer"
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
                              <p className="text-[10px] text-orange-300 mt-0.5">Click to view in repository</p>
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
                <div className="flex flex-col gap-1 text-[11px]">
                  {donutData.map((item, idx) => {
                    const totalDocs = stats?.totalDocuments || donutData.reduce((acc, c) => acc + c.value, 0) || 1;
                    const percent = Math.round((item.value / totalDocs) * 100);
                    return (
                      <div
                        key={idx}
                        onClick={() => navigate(`/workspace/repository?type=${encodeURIComponent(item.name)}`)}
                        onMouseEnter={() => setActiveDonutIndex(idx)}
                        onMouseLeave={() => setActiveDonutIndex(null)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition cursor-pointer ${
                          activeDonutIndex === idx ? 'bg-orange-50 font-bold text-orange-900 shadow-2xs' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        title={`Click to filter by ${item.name}`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-xs shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate max-w-[155px] font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="font-mono font-bold text-orange-800 text-[11px]">
                            {item.value}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({percent}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
              className="text-xs text-slate-400 font-medium cursor-pointer hover:text-orange-600 transition"
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
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
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
                          <p className="font-bold text-orange-300">{data.month}</p>
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
                  stroke="#f97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#uploadsSpline)"
                  activeDot={{ r: 6, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
                  dot={{ r: 4, fill: '#ffffff', stroke: '#f97316', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Storage Utilization & Live Operational Tables (Pure API Data Only - 3D Dynamic Tables) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* 1. Physical Vault Utilization - 3D Dynamic Table */}
        <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.08),0_4px_12px_-4px_rgba(15,23,42,0.03)] dark:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 xl:col-span-5 flex flex-col">
          {/* Card Top Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-50/60 via-white to-slate-50/40 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Physical Vault Utilization
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {storageStats.length} storage {storageStats.length === 1 ? 'facility' : 'facilities'} registered
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/physical/storage-map')}
              className="text-xs font-semibold text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-900/50 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition cursor-pointer shadow-2xs"
            >
              <span>Storage Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3D Dynamic Table Content */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gradient-to-b from-slate-100/90 via-slate-50 to-slate-100/70 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border-b-2 border-slate-200/90 dark:border-slate-700 sticky top-0 z-10 shadow-2xs">
                <tr className="text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Facility / Building</th>
                  <th className="py-3 px-3">Occupancy</th>
                  <th className="py-3 px-3">Utilization (%)</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {storageStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                      <Box className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      No storage facilities registered in database
                    </td>
                  </tr>
                ) : (
                  storageStats.map((loc, i) => {
                    const util = loc.utilization || 0;
                    const isHigh = util >= 85;
                    const isMedium = util >= 65 && util < 85;

                    return (
                      <tr
                        key={i}
                        onClick={() => navigate(`/physical/storage-map?building=${encodeURIComponent(loc.building)}`)}
                        className="hover:bg-gradient-to-r hover:from-orange-50/50 hover:via-white hover:to-orange-50/20 dark:hover:from-slate-800/80 dark:hover:via-slate-800/40 dark:hover:to-slate-800/80 transition-all duration-150 group cursor-pointer"
                        title={`Click to view vault coordinates for ${loc.building}`}
                      >
                        {/* Facility / Building */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-orange-100/80 dark:bg-orange-950/60 border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-center text-orange-700 dark:text-orange-400 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                              <Box className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                {loc.building}
                              </span>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">Vault Location</p>
                            </div>
                          </div>
                        </td>

                        {/* Occupancy */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            {loc.occupancy} <span className="text-slate-400 font-normal">/</span> {loc.capacity}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">units allocated</span>
                        </td>

                        {/* Utilization Bar + % */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-20 sm:w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isHigh
                                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_1px_3px_rgba(244,63,94,0.4)]'
                                    : isMedium
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_1px_3px_rgba(249,115,22,0.4)]'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_1px_3px_rgba(16,185,129,0.3)]'
                                }`}
                                style={{ width: `${Math.min(100, util)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 min-w-[42px]">
                              {util}%
                            </span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span
                            className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${
                              isHigh
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                                : isMedium
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                            }`}
                          >
                            {isHigh ? 'High' : isMedium ? 'Moderate' : 'Optimal'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Recent Repository Ingestions - 3D Dynamic Table */}
        <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.08),0_4px_12px_-4px_rgba(15,23,42,0.03)] dark:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 xl:col-span-7 flex flex-col">
          {/* Card Top Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-50/60 via-white to-slate-50/40 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Recent Repository Ingestions
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {recentDocs.length} latest verified documents from repository
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/workspace/repository')}
              className="text-xs font-semibold text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-900/50 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition cursor-pointer shadow-2xs"
            >
              <span>View Repository</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3D Dynamic Table Content */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gradient-to-b from-slate-100/90 via-slate-50 to-slate-100/70 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border-b-2 border-slate-200/90 dark:border-slate-700 sticky top-0 z-10 shadow-2xs">
                <tr className="text-slate-700 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Doc #</th>
                  <th className="py-3 px-3">Document Title</th>
                  <th className="py-3 px-3 text-center">Rev</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Vault Coordinate</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {recentDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                      <FolderKanban className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      No recent document ingestions found in database
                    </td>
                  </tr>
                ) : (
                  recentDocs.map((doc) => {
                    const statusColor =
                      doc.status === 'Effective'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                        : doc.status === 'Under Review' || doc.status === 'In Review'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                    return (
                      <tr
                        key={doc._id}
                        onClick={() => navigate(`/documents/${doc._id}`)}
                        className="hover:bg-gradient-to-r hover:from-orange-50/50 hover:via-white hover:to-orange-50/20 dark:hover:from-slate-800/80 dark:hover:via-slate-800/40 dark:hover:to-slate-800/80 transition-all duration-150 group cursor-pointer"
                        title={`Open document ${doc.documentNumber}`}
                      >
                        {/* Doc Number 3D Mono Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60 shadow-2xs group-hover:border-orange-400 group-hover:shadow-xs transition-all inline-block">
                            {doc.documentNumber}
                          </span>
                        </td>

                        {/* Title & Department */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1 max-w-[200px] xl:max-w-[260px]" title={doc.title}>
                            {doc.title}
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {doc.department || 'GxP Controlled Document'}
                          </p>
                        </td>

                        {/* Rev */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                            {doc.version ? `v${doc.version}` : 'v01'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${statusColor}`}>
                            {doc.status || 'Active'}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                            <Box className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>{doc.storageLocation?.code || 'Vault Coordinate'}</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-orange-600 group-hover:text-white dark:group-hover:bg-orange-600 dark:group-hover:text-white border border-slate-200 dark:border-slate-700 shadow-2xs transition-all text-xs font-semibold">
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
