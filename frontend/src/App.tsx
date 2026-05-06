import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { UpdatePasswordModal } from './components/Modal/UpdatePasswordModal';
import {
  LoginPage,
  ProjectPage,
  ProfilePage,
  ProjectsPage,
  TestCaseDetailsPage,
  TestSuitePage,
  AuthCallbackPage,
  ForgotPasswordPage,
  TestSuiteManagerPage,
  AdminUsersPage,
  ProjectMembersPage,
  ProjectHistoryPage,
  ProjectHistoryDetailsPage,
  ProjectSuiteHistoryDetailsPage,
  ProjectCaseHistoryDetailsPage,
  TestSuiteRunDashboardPage
} from './pages/PagesExporter';

import { TooltipProvider } from './components/ui/tooltip';

function App() {
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const checkPasswordStatus = () => {
      setMustChangePassword(localStorage.getItem('must_change_password') === 'true');
    };

    checkPasswordStatus();

    window.addEventListener('storage', checkPasswordStatus);

    const interval = setInterval(checkPasswordStatus, 1000);

    return () => {
      window.removeEventListener('storage', checkPasswordStatus);
      clearInterval(interval);
    };
  }, []);

  return (
    <TooltipProvider>
      <Router>
        {mustChangePassword && (
          <UpdatePasswordModal
            isForced={true}
            onClose={() => {
              localStorage.removeItem('must_change_password');
              setMustChangePassword(false);
            }}
          />
        )}
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/project/:projectId" element={<ProjectPage />} />
            <Route path="/project/:projectId/members" element={<ProjectMembersPage />} />
            <Route path="/project/:projectId/history" element={<ProjectHistoryPage />} />
            <Route path="/project/:projectId/history/:runId" element={<ProjectHistoryDetailsPage />} />
            <Route path="/project/:projectId/history/:runId/suite/:suiteRunId" element={<ProjectSuiteHistoryDetailsPage />} />
            <Route path="/project/:projectId/history/:runId/suite/:suiteRunId/case/:caseRunId" element={<ProjectCaseHistoryDetailsPage />} />

            <Route path="/project/:projectId/suite/:suiteId" element={<TestSuitePage />} />
            <Route path="/project/:projectId/suite/:suiteId/run/:runId" element={<TestSuiteRunDashboardPage />} />
            <Route path="/project/:projectId/suite/:suiteId/case/:caseId" element={<TestCaseDetailsPage />} />
            <Route path="/project/:projectId/suite/:suiteId/manager" element={<TestSuiteManagerPage />} />
            <Route path="/project/:projectId/manager" element={<TestSuiteManagerPage />} />
            <Route path="/project/:projectId/suite/:suiteId/case/:caseId/manager" element={<TestSuiteManagerPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/profile/:userId?" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </TooltipProvider>
  );
}

export default App;
