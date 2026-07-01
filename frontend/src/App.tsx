import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { UpdatePasswordModal } from './components/Modal/UpdatePasswordModal';
import {
  LoginPage,
  ProjectPage,
  ProfilePage,
  ProjectsPage,
  TestCasePage,
  TestSuitePage,
  ForgotPasswordPage,
  AdminUsersPage,
  SiteSettingsPage,
  TestSuiteRunDashboardPage,
  TestCaseRunPage
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
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/project/:projectId" element={<ProjectPage />} />
            <Route path="/project/:projectId/suite/:suiteId" element={<TestSuitePage />} />
            <Route path="/project/:projectId/suite/:suiteId/run/:runId" element={<TestSuiteRunDashboardPage />} />
            <Route path="/project/:projectId/suite/:suiteId/case/:caseId" element={<TestCasePage />} />
            <Route path="/project/:projectId/case/:caseId/run" element={<TestCaseRunPage />} />
            <Route path="/project/:projectId/suite/:suiteId/case/:caseId/run" element={<TestCasePage />} />
            <Route path="/project/:projectId/suite/:suiteId/case/:caseId/run/:runId" element={<TestCaseRunPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/settings" element={<SiteSettingsPage />} />
            <Route path="/profile/:userId?" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </TooltipProvider>
  );
}

export default App;
