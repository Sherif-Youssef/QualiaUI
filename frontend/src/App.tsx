import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, DashboardPage, ProjectPage, ProfilePage, ProjectsPage, TestCaseDetailsPage, TestSuitePage, AuthCallbackPage, ForgotPasswordPage } from './pages/PagesExporter';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/project/:projectId" element={<ProjectPage />} />
        <Route path="/project/:projectId/suite/:suiteId" element={<TestSuitePage />} />
        <Route path="/project/:projectId/suite/:suiteId/case/:caseId" element={<TestCaseDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Routes>
    </Router>
  );
}

export default App;
