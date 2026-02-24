import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectPage } from './pages/ProjectPage';
import { TestSuitePage } from './pages/TestSuitePage';
import { TestCaseDetailsPage } from './pages/TestCaseDetailsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/project/:projectId" element={<ProjectPage />} />
        <Route path="/project/:projectId/suite/:suiteId" element={<TestSuitePage />} />
        <Route path="/project/:projectId/suite/:suiteId/case/:caseId" element={<TestCaseDetailsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
