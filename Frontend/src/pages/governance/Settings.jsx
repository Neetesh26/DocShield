import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Lock, Clock, FileCode, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button3D } from '../../components/common/Button3D';
import { settingService } from '../../services';

export const Settings = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    sessionTimeoutMin: '30',
    maxPasswordAgeDays: '90',
    electronicSignatureStatement: 'I certify that this record has been reviewed and executed in compliance with 21 CFR Part 11 and current Good Manufacturing Practices (cGMP).',
    autoArchiveExpiredYears: '7',
    requireDualSignOffForDestruction: true,
    enforceBarcodeScanOnReturn: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await settingService.getSettings();
        if (res?.data) {
          setForm({
            sessionTimeoutMin: res.data.sessionTimeoutMin || '30',
            maxPasswordAgeDays: res.data.maxPasswordAgeDays || '90',
            electronicSignatureStatement: res.data.electronicSignatureStatement || 'I certify that this record has been reviewed and executed in compliance with 21 CFR Part 11 and current Good Manufacturing Practices (cGMP).',
            autoArchiveExpiredYears: res.data.autoArchiveExpiredYears || '7',
            requireDualSignOffForDestruction: res.data.requireDualSignOffForDestruction !== undefined ? res.data.requireDualSignOffForDestruction : true,
            enforceBarcodeScanOnReturn: res.data.enforceBarcodeScanOnReturn !== undefined ? res.data.enforceBarcodeScanOnReturn : true
          });
        }
      } catch (err) {
        console.error('Failed to load settings from DB:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await settingService.updateSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err?.response?.data?.message || 'Failed to persist settings to database.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
        <span className="ml-2 text-xs text-slate-500 font-medium">Loading system compliance settings from MongoDB...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">System & Compliance Governance Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure global 21 CFR Part 11 electronic records, audit trail retentions, and quality parameters (Synced dynamically with MongoDB).
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System configuration parameters successfully updated in MongoDB and logged to 21 CFR Part 11 audit trail.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: 21 CFR Part 11 Electronic Signature Statement */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-orange-600" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              21 CFR Part 11 Electronic Signature Mandates
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Standard Electronic Signature Meaning Statement
            </label>
            <textarea
              rows="3"
              value={form.electronicSignatureStatement}
              onChange={(e) => setForm({ ...form, electronicSignatureStatement: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 transition"
            ></textarea>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Required by 21 CFR § 11.50 (signature manifestations: printed name, date/time, and meaning).
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={form.requireDualSignOffForDestruction}
                onChange={(e) => setForm({ ...form, requireDualSignOffForDestruction: e.target.checked })}
                className="rounded text-orange-600 border-slate-300 focus:ring-orange-500"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Enforce Dual-Party QA Sign-Off for Record Destruction or De-accession
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={form.enforceBarcodeScanOnReturn}
                onChange={(e) => setForm({ ...form, enforceBarcodeScanOnReturn: e.target.checked })}
                className="rounded text-orange-600 border-slate-300 focus:ring-orange-500"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Enforce Physical QR Code Verification during Check-In Return
              </span>
            </label>
          </div>
        </div>

        {/* Section 2: Security & Session Controls */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-4 h-4 text-orange-600" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Security & Operator Session Governance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operator Inactivity Auto-Lockout (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={form.sessionTimeoutMin}
                onChange={(e) => setForm({ ...form, sessionTimeoutMin: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password Lifecycle Expiry (Days)
              </label>
              <input
                type="number"
                min="30"
                max="365"
                value={form.maxPasswordAgeDays}
                onChange={(e) => setForm({ ...form, maxPasswordAgeDays: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button3D
            type="submit"
            variant="primary"
            size="md"
            disabled={saving}
          >
            {saving ? 'Saving to Database...' : 'Save Configuration Changes'}
          </Button3D>
        </div>
      </form>
    </div>
  );
};
