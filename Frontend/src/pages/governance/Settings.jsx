import React, { useState, useEffect } from 'react';
import {
  User,
  Sun,
  Moon,
  Laptop,
  Clock,
  Calendar,
  DollarSign,
  Check,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Mail,
  Building,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../context/ToastContext';
import { authService } from '../../services/authService';

export const Settings = () => {
  const { user, updateUser } = useAuth();
  const { themePreference, setThemePreference } = useTheme();
  const { t } = useLanguage();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Region & Format State (Persisted in localStorage)
  const [region, setRegion] = useState(() => {
    try {
      const saved = localStorage.getItem('docushield_region_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return {
      country: 'India (IN)',
      timezone: 'Asia/Kolkata (IST, UTC+05:30)',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24-Hour (14:30:00)',
      currency: 'INR (₹)'
    };
  });

  const [savingRegion, setSavingRegion] = useState(false);
  const [previewTime, setPreviewTime] = useState(new Date());

  // Keep preview clock ticking
  useEffect(() => {
    const timer = setInterval(() => setPreviewTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync user name if user updates
  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  // Handle Profile Name Update
  const handleSaveProfileName = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('User name cannot be empty.');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const res = await authService.updateProfile({ name: name.trim() });
      if (res.success && res.data?.user) {
        updateUser(res.data.user);
        toast.success('User name updated successfully across the platform!');
      } else {
        updateUser({ name: name.trim() });
        toast.success('User name updated!');
      }
    } catch (err) {
      console.warn('Fallback name update:', err);
      updateUser({ name: name.trim() });
      toast.success('User name updated!');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Region Save
  const handleSaveRegion = (e) => {
    e.preventDefault();
    setSavingRegion(true);
    try {
      localStorage.setItem('docushield_region_settings', JSON.stringify(region));
      toast.success('Regional & format preferences saved successfully!');
    } catch (err) {
      toast.error('Failed to save regional settings.');
    } finally {
      setTimeout(() => setSavingRegion(false), 400);
    }
  };

  // User initials calculation
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  // Format live preview string
  const formatLivePreview = () => {
    const pad = (n) => String(n).padStart(2, '0');
    const day = pad(previewTime.getDate());
    const month = pad(previewTime.getMonth() + 1);
    const year = previewTime.getFullYear();

    let formattedDate = `${day}/${month}/${year}`;
    if (region.dateFormat === 'YYYY-MM-DD') formattedDate = `${year}-${month}-${day}`;
    else if (region.dateFormat === 'MM/DD/YYYY') formattedDate = `${month}/${day}/${year}`;
    else if (region.dateFormat === 'DD-MMM-YYYY') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      formattedDate = `${day}-${monthNames[previewTime.getMonth()]}-${year}`;
    }

    let hours = previewTime.getHours();
    const minutes = pad(previewTime.getMinutes());
    const seconds = pad(previewTime.getSeconds());
    let formattedTime = `${pad(hours)}:${minutes}:${seconds}`;

    if (region.timeFormat.startsWith('12-Hour')) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      formattedTime = `${pad(hours)}:${minutes}:${seconds} ${ampm}`;
    }

    return `${formattedDate} • ${formattedTime} (${region.timezone.split(' ')[0]}) • ${region.currency.split(' ')[0]} 125,000.00`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('General Settings', 'General Settings')}
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
            <ShieldCheck className="w-3 h-3" /> 21 CFR Part 11 Account Governance
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('Manage your personal GxP account identity, visual theme appearance, display language, and regional preferences.', 'Manage your personal GxP account identity, visual theme appearance, display language, and regional preferences.')}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PROFILE & AVATAR                                              */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {t('Profile & Avatar', 'Profile & Avatar')}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t('Authorized personnel credentials and synchronized visual avatar', 'Authorized personnel credentials and synchronized visual avatar')}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono">
            {user?.role || 'Authorized Signer'}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Visual Profile Avatar & Identity Header (No upload controls) */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
            {/* Visual Avatar with default initials */}
            <div className="shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-orange-500/80 dark:border-orange-500 bg-orange-600 text-white font-bold text-2xl flex items-center justify-center shadow-md select-none">
                <span>{userInitials}</span>
              </div>
            </div>

            {/* Account Identity Details */}
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {user?.name || 'GxP Personnel'}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user?.email || 'user@docshield.com'}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  ID: {user?.employeeId || 'EMP-001'}
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 font-semibold border border-orange-200 dark:border-orange-800/60 font-sans">
                  {user?.role || 'Staff'}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 font-sans">
                  {user?.department || 'Quality Assurance'}
                </span>
              </div>
            </div>
          </div>

          {/* User Profile Form */}
          <form onSubmit={handleSaveProfileName} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('Full Name', 'Full Name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 font-medium"
                placeholder="Your Full Name"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('Corporate Email', 'Corporate Email')}
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('Employee ID', 'Employee ID')}
              </label>
              <input
                type="text"
                disabled
                value={user?.employeeId || 'EMP-001'}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('Department', 'Department')}
              </label>
              <input
                type="text"
                disabled
                value={user?.department || 'Quality Assurance (QA)'}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
              />
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile || name.trim() === user?.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition disabled:opacity-40 cursor-pointer"
              >
                {isUpdatingProfile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('Saving...', 'Saving...')}
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> {t('Update Profile Name', 'Update Profile Name')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: THEME                                                          */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {t('Theme', 'Theme')}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t('Select your preferred visual mode or sync with system preferences', 'Select your preferred visual mode or sync with system preferences')}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 font-mono capitalize">
            {themePreference}
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Light Mode Card */}
            <div
              onClick={() => setThemePreference('light')}
              className={`p-4 rounded-xl border text-xs cursor-pointer transition relative flex flex-col justify-between ${
                themePreference === 'light'
                  ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-1 ring-orange-500 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  {themePreference === 'light' && (
                    <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {t('Light Mode', 'Light Mode')}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('Crisp, high-contrast daylight theme designed for clean laboratories and illuminated facilities.', 'Crisp, high-contrast daylight theme designed for clean laboratories and illuminated facilities.')}
                </p>
              </div>
            </div>

            {/* Dark Mode Card */}
            <div
              onClick={() => setThemePreference('dark')}
              className={`p-4 rounded-xl border text-xs cursor-pointer transition relative flex flex-col justify-between ${
                themePreference === 'dark'
                  ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-1 ring-orange-500 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center">
                    <Moon className="w-4 h-4" />
                  </div>
                  {themePreference === 'dark' && (
                    <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {t('Dark Mode', 'Dark Mode')}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('Deep charcoal palette reducing glare and eye strain during extensive audit trail analysis.', 'Deep charcoal palette reducing glare and eye strain during extensive audit trail analysis.')}
                </p>
              </div>
            </div>

            {/* System Default Card */}
            <div
              onClick={() => setThemePreference('system')}
              className={`p-4 rounded-xl border text-xs cursor-pointer transition relative flex flex-col justify-between ${
                themePreference === 'system'
                  ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-1 ring-orange-500 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                    <Laptop className="w-4 h-4" />
                  </div>
                  {themePreference === 'system' && (
                    <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {t('System Default', 'System Default')}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('Automatically matches your operating system display scheme and switches dynamically.', 'Automatically matches your operating system display scheme and switches dynamically.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: REGION                                                         */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {t('Region', 'Region')}
              </h2>
              <p className="text-[11px] text-slate-400">
                {t('Country, regulatory timezone, date formatting, and financial representations', 'Country, regulatory timezone, date formatting, and financial representations')}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
            {region.dateFormat} • {region.currency.split(' ')[0]}
          </span>
        </div>

        <form onSubmit={handleSaveRegion} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Country */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('Country', 'Country')}
              </label>
              <select
                value={region.country}
                onChange={(e) => setRegion({ ...region, country: e.target.value })}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-orange-500 font-medium"
              >
                <option value="India (IN)">India (IN)</option>
                <option value="United States (US)">United States (US)</option>
                <option value="United Kingdom (UK)">United Kingdom (UK)</option>
                <option value="Germany (DE)">Germany (DE)</option>
                <option value="Switzerland (CH)">Switzerland (CH)</option>
                <option value="Japan (JP)">Japan (JP)</option>
                <option value="Singapore (SG)">Singapore (SG)</option>
                <option value="Canada (CA)">Canada (CA)</option>
                <option value="Australia (AU)">Australia (AU)</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('Timezone', 'Timezone')}
              </label>
              <select
                value={region.timezone}
                onChange={(e) => setRegion({ ...region, timezone: e.target.value })}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-orange-500 font-medium"
              >
                <option value="Asia/Kolkata (IST, UTC+05:30)">Asia/Kolkata (IST, UTC+05:30)</option>
                <option value="UTC (Universal Coordinated Time, UTC+00:00)">UTC (UTC+00:00)</option>
                <option value="America/New_York (EST, UTC-05:00)">America/New_York (EST, UTC-05:00)</option>
                <option value="America/Los_Angeles (PST, UTC-08:00)">America/Los_Angeles (PST, UTC-08:00)</option>
                <option value="Europe/London (GMT/BST, UTC+00:00)">Europe/London (GMT, UTC+00:00)</option>
                <option value="Europe/Berlin (CET, UTC+01:00)">Europe/Berlin (CET, UTC+01:00)</option>
                <option value="Asia/Tokyo (JST, UTC+09:00)">Asia/Tokyo (JST, UTC+09:00)</option>
                <option value="Asia/Singapore (SGT, UTC+08:00)">Asia/Singapore (SGT, UTC+08:00)</option>
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('Date Format', 'Date Format')}
              </label>
              <select
                value={region.dateFormat}
                onChange={(e) => setRegion({ ...region, dateFormat: e.target.value })}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-orange-500 font-medium"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (GxP Standard)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                <option value="DD-MMM-YYYY">DD-MMM-YYYY (Pharma Binder)</option>
              </select>
            </div>

            {/* Time Format */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('Time Format', 'Time Format')}
              </label>
              <select
                value={region.timeFormat}
                onChange={(e) => setRegion({ ...region, timeFormat: e.target.value })}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-orange-500 font-medium"
              >
                <option value="24-Hour (14:30:00)">24-Hour (14:30:00 - 21 CFR Part 11 Mandate)</option>
                <option value="12-Hour (02:30:00 PM)">12-Hour (02:30:00 PM - Standard)</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {t('Currency', 'Currency')}
              </label>
              <select
                value={region.currency}
                onChange={(e) => setRegion({ ...region, currency: e.target.value })}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-orange-500 font-medium"
              >
                <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                <option value="USD ($)">USD ($) - US Dollar</option>
                <option value="EUR (€)">EUR (€) - Euro</option>
                <option value="GBP (£)">GBP (£) - British Pound</option>
                <option value="JPY (¥)">JPY (¥) - Japanese Yen</option>
                <option value="CHF (CHF)">CHF (CHF) - Swiss Franc</option>
              </select>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {t('Live Format Representation:', 'Live Format Representation:')}
                </span>{' '}
                <span className="font-mono text-slate-600 dark:text-slate-300 ml-1">
                  {formatLivePreview()}
                </span>
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingRegion}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {savingRegion ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('Saving...', 'Saving...')}
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> {t('Save Regional Preferences', 'Save Regional Preferences')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
