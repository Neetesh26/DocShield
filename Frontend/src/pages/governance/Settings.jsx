
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Loader2,
  AlertCircle
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { Button3D } from '../../components/common/Button3D';
import { settingService } from '../../services';
import { toast } from '../../context/ToastContext';

const DEFAULT_SIGNATURE =
  'I certify that this record has been reviewed and executed in compliance with 21 CFR Part 11 and current Good Manufacturing Practices (cGMP).';

export const Settings = () => {
  const { user } = useAuth();
  const canEditSettings = ['Admin', 'QA', 'QA Manager'].includes(user?.role);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    sessionTimeoutMin: '30',
    maxPasswordAgeDays: '90',
    electronicSignatureStatement: DEFAULT_SIGNATURE,
    autoArchiveExpiredYears: '7',
    requireDualSignOffForDestruction: true,
    enforceBarcodeScanOnReturn: true
  });

  // Fetch settings from database
  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      try {
        setLoading(true);

        const res = await settingService.getSettings();

        if (!isMounted) return;

        if (res?.data) {
          setForm({
            sessionTimeoutMin:
              String(res.data.sessionTimeoutMin ?? 30),

            maxPasswordAgeDays:
              String(res.data.maxPasswordAgeDays ?? 90),

            electronicSignatureStatement:
              res.data.electronicSignatureStatement ?? DEFAULT_SIGNATURE,

            autoArchiveExpiredYears:
              String(res.data.autoArchiveExpiredYears ?? 7),

            requireDualSignOffForDestruction:
              res.data.requireDualSignOffForDestruction ?? true,

            enforceBarcodeScanOnReturn:
              res.data.enforceBarcodeScanOnReturn ?? true
          });
        }

      } catch (err) {
        console.error('Failed to load settings:', err);

        if (isMounted) {
          setError(
            err?.response?.data?.message ||
            'Failed to load settings from database.'
          );
        }

      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Save settings
  const handleSave = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (saving) return;

    try {
      setSaving(true);
      setError(null);

      await settingService.updateSettings({
        ...form,
        sessionTimeoutMin: Number(form.sessionTimeoutMin),
        maxPasswordAgeDays: Number(form.maxPasswordAgeDays),
        autoArchiveExpiredYears: Number(form.autoArchiveExpiredYears)
      });

      // Show success toast only once after API success
      toast.success('Settings saved successfully.');

    } catch (err) {
      console.error('Failed to save settings:', err);

      const errorMessage =
        err?.response?.data?.message ||
        'Failed to persist settings to database.';

      setError(errorMessage);
      toast.error(errorMessage);

    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />

        <span className="ml-2 text-xs text-slate-500 font-medium">
          Loading system compliance settings from MongoDB...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          System & Compliance Governance Settings
        </h1>
        {!canEditSettings && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Lock className="w-3 h-3" /> Read-Only Policy View
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <fieldset disabled={!canEditSettings} className="space-y-6 disabled:opacity-85">

        {/* Section 1: Electronic Signature */}
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
              name="electronicSignatureStatement"
              value={form.electronicSignatureStatement}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 transition"
            />

            <span className="text-[11px] text-slate-400 mt-1 block">
              Required by 21 CFR § 11.50 (signature manifestations: printed name, date/time, and meaning).
            </span>
          </div>

          <div className="space-y-2 pt-2">

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                name="requireDualSignOffForDestruction"
                checked={form.requireDualSignOffForDestruction}
                onChange={handleChange}
                className="rounded text-orange-600 border-slate-300 focus:ring-orange-500"
              />

              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Enforce Dual-Party QA Sign-Off for Record Destruction or De-accession
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                name="enforceBarcodeScanOnReturn"
                checked={form.enforceBarcodeScanOnReturn}
                onChange={handleChange}
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
                name="sessionTimeoutMin"
                min="5"
                max="120"
                value={form.sessionTimeoutMin}
                onChange={handleChange}
                required
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password Lifecycle Expiry (Days)
              </label>

              <input
                type="number"
                name="maxPasswordAgeDays"
                min="30"
                max="365"
                value={form.maxPasswordAgeDays}
                onChange={handleChange}
                required
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>

          </div>
        </div>

        </fieldset>

        {/* Save Button */}
        {canEditSettings && (
          <div className="flex justify-end">
            <Button3D
              type="submit"
              variant="primary"
              size="md"
              disabled={saving}
            >
              {saving
                ? 'Saving to Database...'
                : 'Save Configuration Changes'}
            </Button3D>
          </div>
        )}

      </form>
    </div>
  );
};