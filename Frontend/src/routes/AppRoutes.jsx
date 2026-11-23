import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../layouts/MainLayout';

// Auth
import { Login } from '../pages/auth/Login';

// Workspace
import { Dashboard } from '../pages/workspace/Dashboard';
import { Search } from '../pages/workspace/Search';
import { Repository } from '../pages/workspace/Repository';
import { UploadWizard } from '../pages/workspace/UploadWizard';
import { BulkUpload } from '../pages/workspace/BulkUpload';
import { ScanQrPage } from '../pages/workspace/ScanQrPage';
import { DocumentDetails } from '../pages/workspace/DocumentDetails';

// Physical
import { StorageMap } from '../pages/physical/StorageMap';
import { CustodyHandovers } from '../pages/physical/CustodyHandovers';
import { CheckoutRegister } from '../pages/physical/CheckoutRegister';
import { PhysicalAudit } from '../pages/physical/PhysicalAudit';

// Workflow
import { MyTasks } from '../pages/workflow/MyTasks';
import { Requests } from '../pages/workflow/Requests';
import { Approvals } from '../pages/workflow/Approvals';
import { ReviewRetention } from '../pages/workflow/ReviewRetention';

// Governance
import { Reports } from '../pages/governance/Reports';
import { MasterData } from '../pages/governance/MasterData';
import { AuditTrail } from '../pages/governance/AuditTrail';
import { Settings } from '../pages/governance/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-300">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login initialRegister={true} />} />

      {/* Protected Routes inside MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/workspace/dashboard" replace />} />
        
        {/* Workspace */}
        <Route path="workspace/dashboard" element={<Dashboard />} />
        <Route path="workspace/search" element={<Search />} />
        <Route path="workspace/repository" element={<Repository />} />
        <Route path="workspace/upload" element={<UploadWizard />} />
        <Route path="workspace/bulk-upload" element={<BulkUpload />} />
        <Route path="workspace/scan-qr" element={<ScanQrPage />} />
        <Route path="documents/:id" element={<DocumentDetails />} />

        {/* Physical */}
        <Route path="physical/storage-map" element={<StorageMap />} />
        <Route path="physical/custody" element={<CustodyHandovers />} />
        <Route path="physical/checkout" element={<CheckoutRegister />} />
        <Route path="physical/audit" element={<PhysicalAudit />} />

        {/* Workflow */}
        <Route path="workflow/tasks" element={<MyTasks />} />
        <Route path="workflow/requests" element={<Requests />} />
        <Route path="workflow/approvals" element={<Approvals />} />
        <Route path="workflow/review-retention" element={<ReviewRetention />} />

        {/* Governance */}
        <Route path="governance/reports" element={<Reports />} />
        <Route path="governance/master-data" element={<MasterData />} />
        <Route path="governance/audit-trail" element={<AuditTrail />} />
        <Route path="governance/settings" element={<Settings />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/workspace/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

