/**
 * Root router: public auth pages and a protected dashboard.
 */
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import PrivateRoute from './components/PrivateRoute';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VitalsPage from './pages/VitalsPage';
import ShiftsPage from './pages/ShiftsPage';
import ShiftDetailPage from './pages/ShiftDetailPage';
import AlertsPage from './pages/AlertsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/vitals"
          element={
            <PrivateRoute>
              <AppLayout>
                <VitalsPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/shifts"
          element={
            <PrivateRoute>
              <AppLayout>
                <ShiftsPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/shifts/:id"
          element={
            <PrivateRoute>
              <AppLayout>
                <ShiftDetailPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <PrivateRoute>
              <AppLayout>
                <AlertsPage />
              </AppLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
