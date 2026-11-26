import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../layouts/MainLayout';
import { isRouteAllowedForRole } from '../components/navigation/Sidebar';

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
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Guard individual routes based on user GxP role
const RoleRoute = ({ routePath, children }) => {
  const { user } = useAuth();
  const role = user?.role || 'Employee';
  if (!isRouteAllowedForRole(routePath, role)) {
    return <Navigate to="/workspace/dashboard" replace />;
  }
  return children;
};

export const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      {/* Root Route: Default to /login if not authenticated or server off */}
      <Route
        path="/"
        element={
          loading ? (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-300">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : isAuthenticated ? (
            <Navigate to="/workspace/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login initialRegister={true} />} />

      {/* Protected Routes inside MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="workspace/dashboard" element={<RoleRoute routePath="/workspace/dashboard"><Dashboard /></RoleRoute>} />
        <Route path="workspace/search" element={<RoleRoute routePath="/workspace/search"><Search /></RoleRoute>} />
        <Route path="workspace/repository" element={<RoleRoute routePath="/workspace/repository"><Repository /></RoleRoute>} />
        <Route path="workspace/upload" element={<RoleRoute routePath="/workspace/upload"><UploadWizard /></RoleRoute>} />
        <Route path="workspace/bulk-upload" element={<RoleRoute routePath="/workspace/bulk-upload"><BulkUpload /></RoleRoute>} />
        <Route path="workspace/scan-qr" element={<RoleRoute routePath="/workspace/scan-qr"><ScanQrPage /></RoleRoute>} />
        <Route path="documents/:id" element={<DocumentDetails />} />

        {/* Physical */}
        <Route path="physical/storage-map" element={<RoleRoute routePath="/physical/storage-map"><StorageMap /></RoleRoute>} />
        <Route path="physical/custody" element={<RoleRoute routePath="/physical/custody"><CustodyHandovers /></RoleRoute>} />
        <Route path="physical/checkout" element={<RoleRoute routePath="/physical/checkout"><CheckoutRegister /></RoleRoute>} />
        <Route path="physical/audit" element={<RoleRoute routePath="/physical/audit"><PhysicalAudit /></RoleRoute>} />

        {/* Workflow */}
        <Route path="workflow/tasks" element={<RoleRoute routePath="/workflow/tasks"><MyTasks /></RoleRoute>} />
        <Route path="workflow/requests" element={<RoleRoute routePath="/workflow/requests"><Requests /></RoleRoute>} />
        <Route path="workflow/approvals" element={<RoleRoute routePath="/workflow/approvals"><Approvals /></RoleRoute>} />
        <Route path="workflow/review-retention" element={<RoleRoute routePath="/workflow/review-retention"><ReviewRetention /></RoleRoute>} />

        {/* Governance */}
        <Route path="governance/reports" element={<RoleRoute routePath="/governance/reports"><Reports /></RoleRoute>} />
        <Route path="governance/master-data" element={<RoleRoute routePath="/governance/master-data"><MasterData /></RoleRoute>} />
        <Route path="governance/audit-trail" element={<RoleRoute routePath="/governance/audit-trail"><AuditTrail /></RoleRoute>} />
        <Route path="governance/settings" element={<RoleRoute routePath="/governance/settings"><Settings /></RoleRoute>} />

        {/* Protected Inner Fallback */}
        <Route path="*" element={<Navigate to="/workspace/dashboard" replace />} />
      </Route>

      {/* Global Fallback: Route to /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
