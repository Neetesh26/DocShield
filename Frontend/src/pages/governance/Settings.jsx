import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Lock, Clock, FileCode, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Settings = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    sessionTimeoutMin: '30',
    maxPasswordAgeDays: '90',
    electronicSignatureStatement: 'I certify that this record has been reviewed and executed in compliance with 21 CFR Part 11 and current Good Manufacturing Practices (cGMP).',
    autoArchiveExpiredYears: '7',
    requireDualSignOffForDestruction: true,
    enforceBarcodeScanOnReturn: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System & Compliance Governance Settings</h1>
        <p className="text-xs text-slate-500">
          Configure global 21 CFR Part 11 electronic records, audit trail retentions, and quality parameters.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>System configuration parameters successfully updated and logged to audit trail.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: 21 CFR Part 11 Electronic Signature Statement */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              21 CFR Part 11 Electronic Signature Mandates
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Standard Electronic Signature Meaning Statement
            </label>
            <textarea
              rows="3"
              value={form.electronicSignatureStatement}
              onChange={(e) => setForm({ ...form, electronicSignatureStatement: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
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
                className="rounded text-teal-600 border-slate-300"
              />
              <span className="font-semibold text-slate-800">
                Enforce Dual-Party QA Sign-Off for Record Destruction or De-accession
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={form.enforceBarcodeScanOnReturn}
                onChange={(e) => setForm({ ...form, enforceBarcodeScanOnReturn: e.target.checked })}
                className="rounded text-teal-600 border-slate-300"
              />
              <span className="font-semibold text-slate-800">
                Enforce Physical QR Code Verification during Check-In Return
              </span>
            </label>
          </div>
        </div>

        {/* Section 2: Security & Session Controls */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Lock className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Security & Operator Session Governance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Operator Inactivity Auto-Lockout (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={form.sessionTimeoutMin}
                onChange={(e) => setForm({ ...form, sessionTimeoutMin: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password Lifecycle Expiry (Days)
              </label>
              <input
                type="number"
                min="30"
                max="365"
                value={form.maxPasswordAgeDays}
                onChange={(e) => setForm({ ...form, maxPasswordAgeDays: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Save Configuration Changes
          </button>
        </div>
      </form>
    </div>
  );
};

