import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { TestSuiteManagerPage } from './pages/TestSuiteManagerPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPassword } from './pages/ForgotPassword';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/test-suite-manager" replace />,
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
    path: '/test-suite-manager',
    element: <TestSuiteManagerPage />,
  }
]);
function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
