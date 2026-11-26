import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, Clock, ShieldCheck, ArrowRightLeft, ClipboardList, CheckCircle2, ChevronRight } from 'lucide-react';
import { approvalService, handoverService, checkoutService } from '../../services';
import { useAuth } from '../../context/AuthContext';

export const MyTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [approvals, setApprovals] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const checkoutParams = (user?.role === 'Admin' || user?.role === 'QA Manager')
          ? { status: 'Active' }
          : { user: user?._id, status: 'Active' };

        const [appRes, hndRes, chkRes] = await Promise.all([
          approvalService.getApprovals({ status: 'Pending' }),
          handoverService.getHandovers({ myOnly: true, status: 'Pending Acceptance' }),
          checkoutService.getCheckouts(checkoutParams)
        ]);
        if (appRes.success) setApprovals(appRes.data || []);
        if (hndRes.success) setHandovers(hndRes.data || []);
        if (chkRes.success) {
          const records = Array.isArray(chkRes.data) ? chkRes.data : (chkRes.data?.records || []);
          setCheckouts(records);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user]);

  const totalTasks = approvals.length + handovers.length + checkouts.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Action Tasks</h1>
          <p className="text-xs text-slate-500">
            Unified cockpit of pending QA approvals, custody transfers requiring sign-off, and active borrowed files.
          </p>
        </div>
        <div className="text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 shadow-xs">
          Open Action Items: <strong className="text-orange-700 font-bold">{totalTasks}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Task Section 1: Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Approvals Pending ({approvals.length})
              </h2>
            </div>
            <button
              onClick={() => navigate('/workflow/approvals')}
              className="text-[11px] font-semibold text-orange-600 hover:underline"
            >
              All Approvals
            </button>
          </div>

          <div className="space-y-2.5">
            {approvals.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No pending approvals for your role</div>
            ) : (
              approvals.map((app) => (
                <div
                  key={app._id}
                  onClick={() => navigate('/workflow/approvals')}
                  className="p-3 rounded-xl border border-slate-200 hover:border-orange-500 cursor-pointer bg-slate-50/50 hover:bg-orange-50/20 transition text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{app.type}</span>
                    <span className="font-mono text-[10px] text-orange-700">{app.document?.documentNumber}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] truncate">{app.comments || 'Awaiting electronic review'}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Task Section 2: Pending Handovers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-orange-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Handovers Awaiting Acceptance ({handovers.length})
              </h2>
            </div>
            <button
              onClick={() => navigate('/physical/custody')}
              className="text-[11px] font-semibold text-orange-600 hover:underline"
            >
              Custody
            </button>
          </div>

          <div className="space-y-2.5">
            {handovers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No pending custody transfers</div>
            ) : (
              handovers.map((hnd) => (
                <div
                  key={hnd._id}
                  onClick={() => navigate('/physical/custody')}
                  className="p-3 rounded-xl border border-slate-200 hover:border-purple-500 cursor-pointer bg-slate-50/50 hover:bg-slate-100/20 transition text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-purple-800">{hnd.handoverNumber}</span>
                    <span className="text-[10px] text-slate-400">{new Date(hnd.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-700 font-medium">From: {hnd.previousCustodian?.name}</p>
                  <p className="text-slate-500 text-[11px] truncate">Reason: {hnd.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Task Section 3: Active Checked-out Documents */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                My Checked-Out Binders ({checkouts.length})
              </h2>
            </div>
            <button
              onClick={() => navigate('/physical/checkout')}
              className="text-[11px] font-semibold text-amber-600 hover:underline"
            >
              Registry
            </button>
          </div>

          <div className="space-y-2.5">
            {checkouts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No documents checked out</div>
            ) : (
              checkouts.map((chk) => (
                <div
                  key={chk._id}
                  onClick={() => navigate('/physical/checkout')}
                  className={`p-3 rounded-xl border cursor-pointer transition text-xs space-y-1 ${
                    chk.isOverdue 
                      ? 'border-rose-200 bg-rose-50/30 hover:border-rose-400' 
                      : 'border-slate-200 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/20'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-800">{chk.document?.documentNumber}</span>
                    <span className={`font-mono text-[10px] font-semibold ${chk.isOverdue ? 'text-rose-600' : 'text-amber-700'}`}>
                      {chk.badge?.label || `Due: ${new Date(chk.expectedReturnDate).toLocaleDateString()}`}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] truncate">{chk.document?.title}</p>
                  {chk.user?.name && (
                    <p className="text-slate-400 text-[10px]">Borrower: {chk.user.name}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

