import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Database,
  Building,
  FolderKanban,
  Users,
  Plus,
  CheckCircle,
  ShieldCheck,
  Search as SearchIcon,
  X,
  RotateCw,
  MapPin,
  Box,
  Layers,
  Calendar,
  BadgeCheck,
  Lock,
  Mail,
  Phone,
  UserCheck,
  HardDrive,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { masterDataService } from '../../services';
import { toast } from '../../context/ToastContext';

export const MasterData = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [data, setData] = useState({
    departments: [],
    documentTypes: [],
    locations: [],
    users: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // New Department Form State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptHead, setDeptHead] = useState('');

  // New Document Type Form State
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [typePrefix, setTypePrefix] = useState('');
  const [retention, setRetention] = useState(5);
  const [reviewInterval, setReviewInterval] = useState(12);

  // New Storage Location Form State
  const [showLocModal, setShowLocModal] = useState(false);
  const [locBuilding, setLocBuilding] = useState('Building A');
  const [locArea, setLocArea] = useState('Main Vault');
  const [locRoom, setLocRoom] = useState('101');
  const [locRack, setLocRack] = useState('01');
  const [locShelf, setLocShelf] = useState('01');
  const [locBin, setLocBin] = useState('01');
  const [locCapacity, setLocCapacity] = useState(50);
  const [locDept, setLocDept] = useState('Quality Assurance');

  // New User Form State
  const [showUserModal, setShowUserModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('DocuShield@2026');
  const [userRole, setUserRole] = useState('User');
  const [userDepartment, setUserDepartment] = useState('Quality Assurance');
  const [userEmployeeId, setUserEmployeeId] = useState('');
  const [userDesignation, setUserDesignation] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const fetchData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      const res = await masterDataService.getMasterData();
      if (res.success && res.data) {
        setData(res.data);
        if (showToast) {
          toast.success('Master data refreshed with latest records');
        }
      }
    } catch (err) {
      console.error('Error fetching master data:', err);
      toast.error('Failed to load master data registry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Department Creation
  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      const res = await masterDataService.createDepartment({
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
        description: deptDesc.trim(),
        headName: deptHead.trim()
      });
      if (res.success) {
        toast.success(`Department ${deptCode} created successfully`);
        setShowDeptModal(false);
        setDeptName('');
        setDeptCode('');
        setDeptDesc('');
        setDeptHead('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    }
  };

  // Document Type Creation
  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      const res = await masterDataService.createDocumentType({
        name: typeName.trim(),
        code: typeCode.trim().toUpperCase(),
        prefix: typePrefix.trim().toUpperCase(),
        retentionYears: Number(retention) || 5,
        reviewIntervalMonths: Number(reviewInterval) || 12
      });
      if (res.success) {
        toast.success(`Document Type ${typeCode} created successfully`);
        setShowTypeModal(false);
        setTypeName('');
        setTypeCode('');
        setTypePrefix('');
        setRetention(5);
        setReviewInterval(12);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create document type');
    }
  };

  // Storage Location Creation
  const handleCreateLocation = async (e) => {
    e.preventDefault();
    try {
      const res = await masterDataService.createStorageLocation({
        building: locBuilding.trim(),
        area: locArea.trim(),
        room: locRoom.trim(),
        rack: locRack.trim(),
        shelf: locShelf.trim(),
        bin: locBin.trim(),
        capacity: Number(locCapacity) || 50,
        department: locDept
      });
      if (res.success) {
        toast.success(`Storage coordinate created successfully`);
        setShowLocModal(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create storage coordinate');
    }
  };

  // User Creation
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await masterDataService.createUser({
        name: userName.trim(),
        email: userEmail.trim().toLowerCase(),
        password: userPassword,
        role: userRole,
        department: userDepartment,
        employeeId: userEmployeeId.trim().toUpperCase(),
        designation: userDesignation.trim(),
        phone: userPhone.trim()
      });
      if (res.success) {
        toast.success(`User ${userName} added to GxP directory`);
        setShowUserModal(false);
        setUserName('');
        setUserEmail('');
        setUserPassword('DocuShield@2026');
        setUserEmployeeId('');
        setUserDesignation('');
        setUserPhone('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  // Filtered Datasets based on live search box
  const filteredDepartments = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return data.departments || [];
    return (data.departments || []).filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.headName?.toLowerCase().includes(q)
    );
  }, [data.departments, searchFilter]);

  const filteredDocumentTypes = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return data.documentTypes || [];
    return (data.documentTypes || []).filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.code?.toLowerCase().includes(q) ||
      t.prefix?.toLowerCase().includes(q)
    );
  }, [data.documentTypes, searchFilter]);

  const filteredLocations = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return data.locations || [];
    return (data.locations || []).filter(l =>
      l.code?.toLowerCase().includes(q) ||
      l.building?.toLowerCase().includes(q) ||
      l.area?.toLowerCase().includes(q) ||
      l.department?.toLowerCase().includes(q)
    );
  }, [data.locations, searchFilter]);

  const filteredUsers = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return data.users || [];
    return (data.users || []).filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.employeeId?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.designation?.toLowerCase().includes(q)
    );
  }, [data.users, searchFilter]);

  // Role Badge Styling Helper
  const formatRoleLabel = (role) => (
    ['Employee', 'User / Viewer', 'Viewer'].includes(role) ? 'User' : role
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'QA':
      case 'QA Manager':
        return 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'Document Controller':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Custodian':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Department Head':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Master Data Governance
            </h1>
          </div>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            title="Refresh Master Data"
            className="p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
          </button>

          {activeTab === 'departments' && (
            <button
              type="button"
              onClick={() => setShowDeptModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
          )}

          {activeTab === 'documentTypes' && (
            <button
              type="button"
              onClick={() => setShowTypeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Document Type</span>
            </button>
          )}

          {activeTab === 'locations' && (
            <button
              type="button"
              onClick={() => setShowLocModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Storage Coordinate</span>
            </button>
          )}

          {activeTab === 'users' && (
            <button
              type="button"
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Personnel</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Highlights Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        
        {/* Card 1: Departments */}
        <div
          onClick={() => setActiveTab('departments')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs ${
            activeTab === 'departments'
              ? 'bg-orange-50/60 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 ring-2 ring-orange-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Departments
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {loading ? '-' : data.departments?.length || 0}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Operating Functional Units
            </span>
          </div>
        </div>

        {/* Card 2: Document Types */}
        <div
          onClick={() => setActiveTab('documentTypes')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs ${
            activeTab === 'documentTypes'
              ? 'bg-orange-50/60 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 ring-2 ring-orange-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Document Types
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {loading ? '-' : data.documentTypes?.length || 0}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Controlled Numbering Schemes
            </span>
          </div>
        </div>

        {/* Card 3: Storage Locations */}
        <div
          onClick={() => setActiveTab('locations')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs ${
            activeTab === 'locations'
              ? 'bg-orange-50/60 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 ring-2 ring-orange-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Storage Vaults
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {loading ? '-' : data.locations?.length || 0}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Physical Bins & Shelves
            </span>
          </div>
        </div>

        {/* Card 4: Personnel Directory */}
        <div
          onClick={() => setActiveTab('users')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs ${
            activeTab === 'users'
              ? 'bg-orange-50/60 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 ring-2 ring-orange-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Personnel
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {loading ? '-' : data.users?.length || 0}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Authorized Signers & Staff
            </span>
          </div>
        </div>

      </div>

      {/* Tab Navigation & Live Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
          {[
            { id: 'departments', label: 'Departments', count: data.departments?.length || 0, icon: Building },
            { id: 'documentTypes', label: 'Document Types', count: data.documentTypes?.length || 0, icon: FolderKanban },
            { id: 'locations', label: 'Storage Coordinates', count: data.locations?.length || 0, icon: Box },
            { id: 'users', label: 'Personnel Directory', count: data.users?.length || 0, icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchFilter('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-orange-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Filter Input */}
        <div className="relative flex items-center min-w-[200px] sm:max-w-xs">
          <SearchIcon className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={`Filter ${activeTab}...`}
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 dark:text-white"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

      </div>

      {/* Main Tab Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Loading master governance records...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: DEPARTMENTS */}
            {activeTab === 'departments' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Dept Code</th>
                      <th className="py-3 px-4">Department Name</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Department Head</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDepartments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          No departments matching "{searchFilter}"
                        </td>
                      </tr>
                    ) : (
                      filteredDepartments.map((d) => (
                        <tr key={d._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-orange-700 dark:text-orange-400 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800">
                              {d.code}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {d.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {d.description || 'Core Regulatory Department'}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {d.headName || 'Assigned Lead'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: DOCUMENT TYPES */}
            {activeTab === 'documentTypes' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Prefix</th>
                      <th className="py-3 px-4">Classification Name</th>
                      <th className="py-3 px-4">Retention Period</th>
                      <th className="py-3 px-4 text-right">Physical Tracking</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDocumentTypes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          No document types matching "{searchFilter}"
                        </td>
                      </tr>
                    ) : (
                      filteredDocumentTypes.map((t) => (
                        <tr key={t._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-orange-700 dark:text-orange-400 whitespace-nowrap">
                            {t.code}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {t.prefix}-
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {t.name}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {t.retentionYears || 5} Years
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3 text-orange-600" />
                              Enforced
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: STORAGE COORDINATES */}
            {activeTab === 'locations' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Coordinate Code</th>
                      <th className="py-3 px-4">Facility Building</th>
                      <th className="py-3 px-4">Vault Area / Room</th>
                      <th className="py-3 px-4">Physical Coordinates</th>
                      <th className="py-3 px-4 text-right">Capacity & Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLocations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          No storage coordinates matching "{searchFilter}"
                        </td>
                      </tr>
                    ) : (
                      filteredLocations.map((l) => {
                        const occupancy = l.currentOccupancy || 0;
                        const capacity = l.capacity || 50;
                        const percent = Math.min(100, Math.round((occupancy / capacity) * 100));
                        return (
                          <tr key={l._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4 font-mono font-bold text-orange-700 dark:text-orange-400 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800">
                                {l.code}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                              {l.building}
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                              {l.area} (Room {l.room})
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                              RK-{l.rack} / SH-{l.shelf} / BIN-{l.bin} {l.box && `• ${l.box}`}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${percent >= 80 ? 'bg-rose-500' : 'bg-orange-500'}`}
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {occupancy}/{capacity}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: USERS DIRECTORY */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Authorized Personnel</th>
                      <th className="py-3 px-4">Corporate Email</th>
                      <th className="py-3 px-4">GxP Role</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4 text-right">Designation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400">
                          No personnel matching "{searchFilter}"
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {u.employeeId}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-bold flex items-center justify-center text-[10px]">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span>{u.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {u.email}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(u.role)}`}>
                              {formatRoleLabel(u.role)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {u.department}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                            {u.designation || 'Staff'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </div>
    </div>

      {/* ========================================================
          MODAL: ADD DEPARTMENT
          ======================================================== */}
      {showDeptModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in my-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Functional Department</h3>
              </div>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Microbiology Quality Control"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MQC"
                  className="w-full px-3 py-2 font-mono uppercase border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Department Head</label>
                <input
                  type="text"
                  value={deptHead}
                  onChange={(e) => setDeptHead(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Functional responsibilities and scope"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                ></textarea>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: ADD DOCUMENT TYPE
          ======================================================== */}
      {showTypeModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in my-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Document Type & Prefix</h3>
              </div>
              <button onClick={() => setShowTypeModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateType} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Type Name *</label>
                <input
                  type="text"
                  required
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="e.g. Deviation Investigation Report"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={typeCode}
                    onChange={(e) => setTypeCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DEV"
                    className="w-full px-3 py-2 font-mono uppercase border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Numbering Prefix *</label>
                  <input
                    type="text"
                    required
                    value={typePrefix}
                    onChange={(e) => setTypePrefix(e.target.value.toUpperCase())}
                    placeholder="e.g. DEV"
                    className="w-full px-3 py-2 font-mono uppercase border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Retention (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={retention}
                    onChange={(e) => setRetention(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Review Interval (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={reviewInterval}
                    onChange={(e) => setReviewInterval(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Document Type
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: ADD STORAGE LOCATION
          ======================================================== */}
      {showLocModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in my-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Register Vault Storage Coordinate</h3>
              </div>
              <button onClick={() => setShowLocModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateLocation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Building *</label>
                  <input
                    type="text"
                    required
                    value={locBuilding}
                    onChange={(e) => setLocBuilding(e.target.value)}
                    placeholder="e.g. Building A"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Vault Area *</label>
                  <input
                    type="text"
                    required
                    value={locArea}
                    onChange={(e) => setLocArea(e.target.value)}
                    placeholder="e.g. Main Vault"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Room *</label>
                  <input
                    type="text"
                    required
                    value={locRoom}
                    onChange={(e) => setLocRoom(e.target.value)}
                    placeholder="101"
                    className="w-full px-2 py-1.5 font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Rack *</label>
                  <input
                    type="text"
                    required
                    value={locRack}
                    onChange={(e) => setLocRack(e.target.value)}
                    placeholder="01"
                    className="w-full px-2 py-1.5 font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Shelf *</label>
                  <input
                    type="text"
                    required
                    value={locShelf}
                    onChange={(e) => setLocShelf(e.target.value)}
                    placeholder="01"
                    className="w-full px-2 py-1.5 font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bin *</label>
                  <input
                    type="text"
                    required
                    value={locBin}
                    onChange={(e) => setLocBin(e.target.value)}
                    placeholder="01"
                    className="w-full px-2 py-1.5 font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Binder Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={locCapacity}
                    onChange={(e) => setLocCapacity(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Designated Department</label>
                  <select
                    value={locDept}
                    onChange={(e) => setLocDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Quality Control">Quality Control</option>
                    <option value="Production">Production</option>
                    <option value="General">General Archive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLocModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Register Coordinate
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: ADD GXP USER
          ======================================================== */}
      {showUserModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in my-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Authorized Personnel</h3>
              </div>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="rajesh.kumar@docushield.com"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={userEmployeeId}
                    onChange={(e) => setUserEmployeeId(e.target.value.toUpperCase())}
                    placeholder="EMP-QA-006"
                    className="w-full px-3 py-2 font-mono uppercase border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">GxP System Role *</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Admin">Admin</option>
                    <option value="QA">QA</option>
                    <option value="QA Manager">QA Manager</option>
                    <option value="Document Controller">Document Controller</option>
                    <option value="Custodian">Custodian</option>
                    <option value="Department Head">Department Head</option>
                    <option value="User">User</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
                  <select
                    value={userDepartment}
                    onChange={(e) => setUserDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  >
                    {data.departments?.length > 0 ? (
                      data.departments.map((d) => (
                        <option key={d._id} value={d.name}>{d.name} ({d.code})</option>
                      ))
                    ) : (
                      <>
                        <option value="Quality Assurance">Quality Assurance</option>
                        <option value="Quality Control">Quality Control</option>
                        <option value="Production">Production</option>
                        <option value="Document Control">Document Control</option>
                        <option value="Warehouse & Logistics">Warehouse & Logistics</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={userDesignation}
                    onChange={(e) => setUserDesignation(e.target.value)}
                    placeholder="e.g. Senior QC Executive"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Create Personnel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
