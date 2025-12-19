import {createBrowserRouter, RouterProvider,Navigate} from 'react-router-dom';
import { TestSuiteManagerPage } from './pages/TestSuiteManagerPage';
import {LoginPage}  from './pages/LoginPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace/>,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/test-suite-manager',
    element: <TestSuiteManagerPage />,
  }
]);
function App() {
  return(
    <RouterProvider router={router} />
  );
}

export default App;
