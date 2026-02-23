import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { TestSuiteManagerPage, LoginPage, ForgotPassword, AdminDashboard } from './pages/PagesExporter';
import { MainLayout } from './components/MainLayout';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: '/test-suite-manager',
        element: <TestSuiteManagerPage />,
      },
      {
        path: '/dashboard',
        element: <AdminDashboard />,
      },
    ]
  }
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
