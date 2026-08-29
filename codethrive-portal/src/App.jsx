import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import SplashScreen from './components/SplashScreen';
import Dashboard from './pages/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import CreateCredentials from './pages/Auth/CreateCredentials';
import TwoFactorAuth from './pages/Auth/TwoFactorAuth';
import Attendance from './pages/Attendance';
import Timesheet from './pages/Timesheet';
import Team from './pages/Team';
import Projects from './pages/Projects';
import HRMS from './pages/HRMS';
import Payroll from './pages/Payroll';
import Performance from './pages/Performance';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Employees from './pages/Employees';
import Notifications from './pages/Notifications';
import MyProfile from './pages/MyProfile';
import MyTasks from './pages/MyTasks';
import DailyReports from './pages/DailyReports';
import Meetings from './pages/Meetings';
import Leave from './pages/Leave';
import Documents from './pages/Documents';
import Support from './pages/Support';
import './App.css';

const Toast = ({ message, show }) => {
  return (
    <div className={`toast-container ${show ? 'show' : ''}`}>
      <div className="toast-icon">✓</div>
      <div className="toast-message">{message}</div>
    </div>
  );
};

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen isFading={false} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Account status check
  if (user.status === 'pending' || user.status === 'inactive' || user.status === 'rejected') {
    // If somehow they bypassed the login error, kick them out
    return <Navigate to="/login" replace />;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If admin, go to admin. If employee, go to dashboard.
    if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'hr') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

const MainLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AuthLayout = () => {
  return (
    <div className="auth-split-container">
      <div className="auth-split-image">
        <div className="auth-overlay"></div>
        <img src="/auth-bg.png" alt="Premium Modern Architecture" />
        <div className="auth-quote">
           <h2>Building the Future.</h2>
           <p>Experience the luxury of seamless operations and unparalleled enterprise management.</p>
        </div>
      </div>
      <div className="auth-split-content">
        <Outlet />
      </div>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFading(true), 1500);
    const removeTimer = setTimeout(() => setLoading(false), 2000);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  if (loading) {
    return <SplashScreen isFading={isFading} />;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/create-credentials" element={<CreateCredentials />} />
            <Route path="/2fa" element={<TwoFactorAuth />} />
          </Route>

          {/* Protected Employee Routes */}
          <Route element={<ProtectedRoute allowedRoles={['employee', 'teamlead', 'intern']} />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/timesheet" element={<Timesheet />} />
              <Route path="/team" element={<Team />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/profile" element={<MyProfile />} />
              <Route path="/tasks" element={<MyTasks />} />
              <Route path="/work/daily-report" element={<DailyReports />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/leave" element={<Leave />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/support" element={<Support />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>

          {/* Protected Admin/HR Routes */}
          <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr']} />}>
            <Route element={<MainLayout />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/employees" element={<Employees />} />
              <Route path="/hrms" element={<HRMS />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>
        </Routes>
        <Toast message={toast.message} show={toast.show} />
      </Router>
    </AuthProvider>
  );
}

export default App;
