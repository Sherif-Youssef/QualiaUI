import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, ProjectPage, ProfilePage, ProjectsPage, TestCaseDetailsPage, TestSuitePage, AuthCallbackPage, ForgotPasswordPage, TestSuiteManagerPage, AdminUsersPage } from './pages/PagesExporter';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/project/:projectId" element={<ProjectPage />} />
        <Route path="/project/:projectId/suite/:suiteId" element={<TestSuitePage />} />
        <Route path="/project/:projectId/suite/:suiteId/case/:caseId" element={<TestCaseDetailsPage />} />
        <Route path="/project/:projectId/suite/:suiteId/manager" element={<TestSuiteManagerPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/profile/:userId?" element={<ProfilePage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Routes>
    </Router>
  );
}

export default App;
