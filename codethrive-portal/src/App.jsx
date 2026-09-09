import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';
import SplashScreen from './components/SplashScreen';
import PageTransition from './components/PageTransition';
import './App.css';

// Lazy loading all pages to significantly improve initial load performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Auth/Login'));
const AdminLogin = lazy(() => import('./pages/Auth/AdminLogin'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const CreateCredentials = lazy(() => import('./pages/Auth/CreateCredentials'));

const Attendance = lazy(() => import('./pages/Attendance'));
const Timesheet = lazy(() => import('./pages/Timesheet'));
const Team = lazy(() => import('./pages/Team'));
const Projects = lazy(() => import('./pages/Projects'));
const HRMS = lazy(() => import('./pages/HRMS'));
const Payroll = lazy(() => import('./pages/Payroll'));
const Performance = lazy(() => import('./pages/Performance'));
const Reports = lazy(() => import('./pages/Reports'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminTasks = lazy(() => import('./pages/AdminTasks'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const AdminPayroll = lazy(() => import('./pages/AdminPayroll'));
const AdminDocuments = lazy(() => import('./pages/AdminDocuments'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeDetail = lazy(() => import('./pages/EmployeeDetail'));
const MyProfile = lazy(() => import('./pages/MyProfile'));
const MyTasks = lazy(() => import('./pages/MyTasks'));
const DailyReports = lazy(() => import('./pages/DailyReports'));
const Meetings = lazy(() => import('./pages/Meetings'));
const Leave = lazy(() => import('./pages/Leave'));
const AdminLeave = lazy(() => import('./pages/AdminLeave'));
const Documents = lazy(() => import('./pages/Documents'));

const Toast = ({ message, show }) => {
  return (
    <div className={`toast-container ${show ? 'show' : ''}`}>
      <div className="toast-icon">✓</div>
      <div className="toast-message">{message}</div>
    </div>
  );
};

const PageLoader = () => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh', flexDirection: 'column' }}
  >
    <div className="loader-small" style={{ width: '30px', height: '30px', borderColor: 'var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }}></div>
  </motion.div>
);

// Error Boundary to prevent blank screen crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI Render Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem', textAlign: 'center', color: '#fff' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#00d2ff' }}>Application Workspace Ready</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '500px', marginBottom: '1.5rem' }}>
            We updated your view. Click below to continue seamlessly.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/employee/dashboard';
            }}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}
          >
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const normalizeRole = (role) => {
  if (!role) return 'employee';
  const r = String(role).toLowerCase().trim();
  if (r.includes('admin') || r.includes('superadmin')) return 'admin';
  if (r.includes('hr')) return 'hr';
  if (r.includes('lead') || r.includes('manager') || r.includes('head')) return 'teamlead';
  if (r.includes('intern')) return 'intern';
  return 'employee';
};

const ProtectedRoute = ({ allowedRoles, loginPath = '/employee/login' }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen isFading={false} />;
  }

  if (!user) {
    return <Navigate to={loginPath} replace />;
  }

  // Account status check (default to active for local/demo users)
  const status = String(user.status || 'active').toLowerCase();
  if (status === 'inactive' || status === 'rejected') {
    return <Navigate to={loginPath} replace />;
  }

  const effectiveRole = normalizeRole(user.role);

  // Check if role is allowed
  const isAllowed = allowedRoles && (
    allowedRoles.includes(effectiveRole) || 
    allowedRoles.includes(user.role) || 
    allowedRoles.includes(String(user.role).toLowerCase())
  );

  if (!isAllowed) {
    if (['admin', 'superadmin', 'hr'].includes(effectiveRole)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/employee/dashboard" replace />;
  }

  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  );
};


const EmployeeLayout = () => {
  const location = useLocation();
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar />
        <main className="main-content">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </PageTransition>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const location = useLocation();
  return (
    <div className="app-container">
      <AdminSidebar />
      <div className="main-wrapper">
        <AdminTopbar />
        <main className="main-content">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Suspense fallback={<PageLoader />}>
                  <Outlet />
                </Suspense>
              </PageTransition>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};


const AuthLayout = () => {
  const location = useLocation();
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
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </PageTransition>
        </AnimatePresence>
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
          <Route path="/" element={<Navigate to="/employee/login" replace />} />

          <Route element={<AuthLayout />}>
            <Route path="/employee/login" element={<Login />} />
            <Route path="/employee/register" element={<Register />} />
            <Route path="/employee/forgot-password" element={<ForgotPassword />} />
            <Route path="/employee/create-credentials" element={<CreateCredentials />} />
            
            <Route path="/admin/login" element={<AdminLogin />} />
          </Route>

          {/* Protected Employee Routes */}
          <Route element={<ProtectedRoute allowedRoles={['employee', 'teamlead', 'intern']} loginPath="/employee/login" defaultRedirect="/employee/dashboard" />}>
            <Route element={<EmployeeLayout />}>
              <Route path="/employee/dashboard" element={<Dashboard />} />
              <Route path="/employee/tasks" element={<MyTasks />} />
              <Route path="/employee/reports" element={<DailyReports />} />
              <Route path="/employee/payslips" element={<Payroll />} />
              <Route path="/employee/documents" element={<Documents />} />
              <Route path="/employee/profile" element={<MyProfile />} />
              
              {/* Other legacy Employee routes (optional but kept for existing components) */}
              <Route path="/employee/attendance" element={<Attendance />} />
              <Route path="/employee/timesheet" element={<Timesheet />} />
              <Route path="/employee/team" element={<Team />} />
              <Route path="/employee/projects" element={<Projects />} />
              <Route path="/employee/performance" element={<Performance />} />
              <Route path="/employee/meetings" element={<Meetings />} />
              <Route path="/employee/leave" element={<Leave />} />
            </Route>
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'hr']} loginPath="/admin/login" defaultRedirect="/admin/dashboard" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<Admin />} />
              <Route path="/admin/employees" element={<Employees />} />
              <Route path="/admin/employees/:id" element={<EmployeeDetail />} />
              <Route path="/admin/tasks" element={<AdminTasks />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/leave" element={<AdminLeave />} />
              <Route path="/admin/payroll" element={<AdminPayroll />} />
              <Route path="/admin/documents" element={<AdminDocuments />} />
              <Route path="/admin/profile" element={<MyProfile />} />
            </Route>
          </Route>
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/employee/login" replace />} />
        </Routes>
        <Toast message={toast.message} show={toast.show} />
      </Router>
    </AuthProvider>
  );
}

export default App;
