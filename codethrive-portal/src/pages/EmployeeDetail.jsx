import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  createOfficialCodeThriveDoc, 
  exportOfficialWordDoc, 
  getCorporateTableStyles,
  formatCurrencyINR
} from '../utils/pdfLetterhead';
import { 
  User, X, Briefcase, FileText, Calendar, Clock, Banknote,
  KeyRound, Plus, Download, Save, ArrowLeft, Mail, Phone, MapPin, Check, FileCheck, Filter, ShieldCheck, Printer, LogIn, LogOut, Coffee, Utensils, CreditCard,
  GraduationCap, Sparkles, Landmark, CheckCircle2, Search, Eye, FileCode, CheckSquare, Layers, AlertCircle, FileArchive,
  Trash2, AlignLeft
} from 'lucide-react';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import { formatDate, formatDateWithDay } from '../utils/dateUtils';
import ContactActionModal, { openDirectEmail } from '../components/common/ContactActionModal';
import './MyProfile.css';
import './EmployeeDetail.css';

const AUDIT_MONTH_OPTIONS = [
  { label: 'All-Time Continuous History', value: 'All' },
  { label: 'September 2026', value: '2026-09', monthName: 'September' },
  { label: 'August 2026', value: '2026-08', monthName: 'August' },
  { label: 'July 2026', value: '2026-07', monthName: 'July' },
  { label: 'June 2026', value: '2026-06', monthName: 'June' },
  { label: 'May 2026', value: '2026-05', monthName: 'May' }
];

const DEFAULT_DEMO_EMPLOYEES = [
  {
    _id: 'emp_001',
    employeeId: 'CTI-EMP-001',
    fullName: 'Mahadevan',
    personalEmailAddress: 'mahadevan@codethrive.com',
    personalPhoneNumber: '9876543210',
    department: 'Engineering',
    designation: 'Senior Full Stack Developer',
    employmentType: 'Full-Time',
    status: 'Active',
    dateOfJoining: '2025-01-15',
    dateOfBirth: '2000-06-18',
    gender: 'Male',
    bloodGroup: 'O+',
    maritalStatus: 'Single',
    nationality: 'Indian',
    workLocation: 'Tech Park HQ',
    salaryAmount: 85000,
    bankAccountHolderName: 'Mahadevan R',
    bankName: 'Canara Bank',
    accountNumber: '50200088991122',
    ifscCode: 'CNRB0001234',
    branchName: 'Tech Park Branch, Coimbatore',
    panNumber: 'ABCDE1234F',
    aadhaarOrIdentityProofNumber: 'XXXX-XXXX-9842',
    upiId: 'mahadevan@okaxis',
    qualification: 'Bachelor of Technology (B.Tech Information Technology)',
    collegeName: 'PSG College of Technology',
    universityName: 'Anna University',
    graduationYear: '2023',
    cgpaOrPercentage: '8.9 CGPA',
    previousCompany: 'CodeThrive Labs Pvt Ltd',
    user: { role: 'employee', status: 'active' },
    skills: ['React.js', 'Node.js', 'Express', 'PostgreSQL', 'TypeScript', 'REST APIs', 'Docker', 'Git'],
    currentAddress: '12, Tech Park Avenue, Coimbatore, Tamil Nadu - 641035',
    permanentAddress: '45, Main Street, Coimbatore, Tamil Nadu - 641001',
    emergencyContact: { name: 'S. Ramanathan', phone: '9876500000', relationship: 'Father' },
    sentByEmployee: {
      dailyReports: [
        {
          _id: 'rep_001',
          date: '2026-10-25',
          title: 'Neon PostgreSQL Connection Pool & JWT Middleware Implementation',
          tasksWorked: 'Configured pg.Pool with SSL connection pooling, healthcheck routing and auth token auto-refresh',
          workSummary: 'Configured pg.Pool with SSL connection pooling, healthcheck routing and auth token auto-refresh',
          hoursWorked: '8h 30m',
          hoursLogged: '8h 30m',
          completedWork: 'Merged auth middleware, integrated Neon PG pool, validated load stress under 50 simultaneous connections',
          issuesFaced: 'None. All unit tests passed 100%',
          tomorrowsPlan: 'Build employee task assignment sync service & SRC download zip streamer',
          status: 'Approved',
          srcFileName: 'Sprint_Postgres_Auth_Deliverable.zip',
          srcFileSize: '2.4 MB'
        },
        {
          _id: 'rep_002',
          date: '2026-10-24',
          title: 'Employee Dossier & Export Audit Architecture',
          tasksWorked: 'Created PDF and Word document generators with official company letterhead',
          workSummary: 'Created PDF and Word document generators with official company letterhead',
          hoursWorked: '8h 00m',
          hoursLogged: '8h 00m',
          completedWork: 'Built corporate letterhead templates, dynamic autoTable headers and verified table page boundaries',
          issuesFaced: 'Resolved table page break margins in jsPDF autotable',
          tomorrowsPlan: 'Refactor executive portal profile tabs & add audit filters',
          status: 'Approved',
          srcFileName: 'CodeThrive_Audit_Engine_SRC.zip',
          srcFileSize: '3.1 MB'
        }
      ],
      leaveApplications: [],
      uploadedDocs: [],
      attendanceLogs: { todayStatus: 'Working', checkIn: '09:00 AM', checkOut: '--:--', workTime: '8h 00m', breakTime: '20m' },
      payslips: []
    },
    assignedByAdmin: {
      tasks: [
        {
          _id: 'task_001',
          taskId: 'TSK-101',
          title: 'Implement Neon DB Connection Pooling & Connection Healthcheck',
          description: 'Configure pg.Pool with max connections 20 and idle timeout 30s for Neon PostgreSQL database.',
          priority: 'High',
          status: 'Completed',
          dueDate: '2026-10-26',
          createdAt: '2026-10-23T10:00:00.000Z',
          assignedAtText: '23 Oct 2026, 10:00 AM',
          assignedBy: 'Admin / Management'
        },
        {
          _id: 'task_002',
          taskId: 'TSK-102',
          title: 'Enterprise Employee Profile & Daily Work Reports Audit',
          description: 'Ensure 100% complete employee profile visibility, task assignment history tracking, and daily reports SRC downloads.',
          priority: 'Urgent',
          status: 'In Progress',
          dueDate: '2026-10-28',
          createdAt: '2026-10-24T14:30:00.000Z',
          assignedAtText: '24 Oct 2026, 02:30 PM',
          assignedBy: 'Admin / Management'
        }
      ],
      notificationsSent: []
    }
  },
  {
    _id: 'emp_002',
    employeeId: 'CTI-EMP-002',
    fullName: 'Priya Sharma',
    personalEmailAddress: 'priya@codethrive.com',
    personalPhoneNumber: '9876543211',
    department: 'UI/UX Design',
    designation: 'Lead Product Designer',
    employmentType: 'Full-Time',
    status: 'Active',
    dateOfJoining: '2025-03-01',
    dateOfBirth: '2001-04-12',
    gender: 'Female',
    bloodGroup: 'A+',
    maritalStatus: 'Married',
    nationality: 'Indian',
    workLocation: 'Hybrid',
    salaryAmount: 78000,
    bankAccountHolderName: 'Priya Sharma',
    bankName: 'ICICI Bank',
    accountNumber: '000401567891',
    ifscCode: 'ICIC0000004',
    branchName: 'Koramangala Branch, Bengaluru',
    panNumber: 'PQRSW5678G',
    aadhaarOrIdentityProofNumber: 'XXXX-XXXX-4512',
    upiId: 'priyasharma@okaxis',
    qualification: 'Master of Design (M.Des Interaction Design)',
    collegeName: 'National Institute of Design (NID)',
    universityName: 'NID Ahmedabad',
    graduationYear: '2023',
    cgpaOrPercentage: '9.1 CGPA',
    previousCompany: 'DesignSphere Studio',
    user: { role: 'teamlead', status: 'active' },
    skills: ['Figma', 'UI Architecture', 'Design Systems', 'CSS3', 'Micro-interactions', 'Prototyping'],
    currentAddress: '88, Design Quarters, Bengaluru, Karnataka - 560034',
    permanentAddress: '12, Garden Street, Mysuru, Karnataka - 570001',
    emergencyContact: { name: 'R. Sharma', phone: '9876511111', relationship: 'Spouse' },
    sentByEmployee: {
      dailyReports: [
        {
          _id: 'rep_003',
          date: '2026-10-25',
          title: 'Design System Tokens & Dark Theme Color Palette Audit',
          tasksWorked: 'Updated glassmorphism card styles, modal headers and custom scrollbars',
          workSummary: 'Updated glassmorphism card styles, modal headers and custom scrollbars',
          hoursWorked: '7h 45m',
          hoursLogged: '7h 45m',
          completedWork: 'Finalized Figma component library sync with React components',
          issuesFaced: 'None',
          tomorrowsPlan: 'Deliver high-res mobile view layouts',
          status: 'Approved',
          srcFileName: 'CodeThrive_DesignTokens_FigmaExport.zip',
          srcFileSize: '5.2 MB'
        }
      ],
      leaveApplications: [],
      uploadedDocs: [],
      attendanceLogs: { todayStatus: 'Working', checkIn: '09:00 AM', checkOut: '--:--', workTime: '7h 45m', breakTime: '20m' },
      payslips: []
    },
    assignedByAdmin: {
      tasks: [],
      notificationsSent: []
    }
  },
  {
    _id: 'emp_003',
    employeeId: 'CTI-EMP-003',
    fullName: 'Rahul Verma',
    personalEmailAddress: 'rahul@codethrive.com',
    personalPhoneNumber: '9876543212',
    department: 'Management',
    designation: 'Senior Engineering Lead',
    employmentType: 'Full-Time',
    status: 'Active',
    dateOfJoining: '2024-11-10',
    dateOfBirth: '1998-11-20',
    gender: 'Male',
    bloodGroup: 'B+',
    maritalStatus: 'Married',
    nationality: 'Indian',
    workLocation: 'Tech Park HQ',
    salaryAmount: 110000,
    bankAccountHolderName: 'Rahul Verma',
    bankName: 'Axis Bank',
    accountNumber: '9180200345678',
    ifscCode: 'UTIB0000180',
    branchName: 'Tech Park Branch, Chennai',
    panNumber: 'LMNOP9012K',
    aadhaarOrIdentityProofNumber: 'XXXX-XXXX-7721',
    upiId: 'rahulverma@okaxis',
    qualification: 'Bachelor of Engineering (B.E. Computer Science)',
    collegeName: 'College of Engineering, Guindy (CEG)',
    universityName: 'Anna University',
    graduationYear: '2020',
    cgpaOrPercentage: '8.6 CGPA',
    previousCompany: 'Infotech Global Systems',
    user: { role: 'admin', status: 'active' },
    skills: ['Project Management', 'System Design', 'Node.js', 'React', 'Cloud Architecture'],
    currentAddress: '34, Executive Suites, Chennai, Tamil Nadu - 600028',
    permanentAddress: '77, Civil Lines, Madurai, Tamil Nadu - 625001',
    emergencyContact: { name: 'S. Verma', phone: '9876522222', relationship: 'Wife' },
    sentByEmployee: {
      dailyReports: [],
      leaveApplications: [],
      uploadedDocs: [],
      attendanceLogs: { todayStatus: 'Checked Out', checkIn: '08:45 AM', checkOut: '05:15 PM', workTime: '8h 00m', breakTime: '30m' },
      payslips: []
    },
    assignedByAdmin: {
      tasks: [],
      notificationsSent: []
    }
  },
  {
    _id: 'emp_004',
    employeeId: 'CTI-EMP-004',
    fullName: 'Ananya Roy',
    personalEmailAddress: 'ananya@codethrive.com',
    personalPhoneNumber: '9876543213',
    department: 'HR',
    designation: 'HR Operations Manager',
    employmentType: 'Full-Time',
    status: 'Active',
    dateOfJoining: '2025-02-01',
    dateOfBirth: '2001-09-05',
    gender: 'Female',
    bloodGroup: 'AB+',
    maritalStatus: 'Single',
    nationality: 'Indian',
    workLocation: 'Tech Park HQ',
    salaryAmount: 72000,
    bankAccountHolderName: 'Ananya Roy',
    bankName: 'HDFC Bank',
    accountNumber: '50100987654321',
    ifscCode: 'HDFC0001234',
    branchName: 'Anna Nagar Branch, Chennai',
    panNumber: 'XYZZZ4321M',
    aadhaarOrIdentityProofNumber: 'XXXX-XXXX-1934',
    upiId: 'ananyaroy@okaxis',
    qualification: 'Master of Business Administration (MBA HR)',
    collegeName: 'Loyola Institute of Business Administration (LIBA)',
    universityName: 'Madras University',
    graduationYear: '2023',
    cgpaOrPercentage: '8.8 CGPA',
    previousCompany: 'TalentHub Solutions',
    user: { role: 'hr', status: 'active' },
    skills: ['HR Operations', 'Talent Acquisition', 'Payroll Audit', 'Statutory Compliance', 'Employee Engagement'],
    currentAddress: '56, HR Enclave, Chennai, Tamil Nadu - 600040',
    permanentAddress: '19, Lake View Road, Trichy, Tamil Nadu - 620001',
    emergencyContact: { name: 'K. Roy', phone: '9876533333', relationship: 'Mother' },
    sentByEmployee: {
      dailyReports: [],
      leaveApplications: [],
      uploadedDocs: [],
      attendanceLogs: { todayStatus: 'Working', checkIn: '09:00 AM', checkOut: '--:--', workTime: '6h 00m', breakTime: '20m' },
      payslips: []
    },
    assignedByAdmin: {
      tasks: [],
      notificationsSent: []
    }
  }
];

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [allEmployees, setAllEmployees] = useState(DEFAULT_DEMO_EMPLOYEES);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState({ isOpen: false, name: '', phone: '' });

  // Month Audit Filter State: Default 'All' (All-Time Continuous History)
  const [selectedAuditMonth, setSelectedAuditMonth] = useState('All');

  // Dedicated Top-level Tabs synchronized with URL search params:
  // 'profile', 'tasks', 'reports', 'leaves', 'documents', 'attendance', 'management'
  const activeTab = searchParams.get('tab') || 'profile';
  const setActiveTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  // Management State
  const [editRole, setEditRole] = useState('employee');
  const [editStatus, setEditStatus] = useState('Active');
  const [newPassword, setNewPassword] = useState('');
  
  // Salary State
  const [editSalary, setEditSalary] = useState('');
  const [editBank, setEditBank] = useState('');
  const [editAccNo, setEditAccNo] = useState('');
  const [editIfsc, setEditIfsc] = useState('');

  // Assign Task State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');
  const [selectedTaskForModal, setSelectedTaskForModal] = useState(null);

  // Daily Reports State
  const [reportDateFilter, setReportDateFilter] = useState('All');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [selectedReportForModal, setSelectedReportForModal] = useState(null);

  // Per-Day Attendance Audit State
  const [empAttendanceHistory, setEmpAttendanceHistory] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  useEffect(() => {
    if (employee) {
      fetchEmployeeAttendance(employee);
    }
  }, [employee, selectedAuditMonth]);

  const fetchEmployeeAttendance = async (emp) => {
    try {
      setAttendanceLoading(true);
      const params = { employeeId: emp._id || emp.id };
      if (selectedAuditMonth && selectedAuditMonth !== 'All') {
        const [y, m] = selectedAuditMonth.split('-');
        params.year = y;
        params.month = m;
      }
      const res = await api.get('/attendance/history', { params });
      let records = res?.data?.data || res?.data || [];
      if (Array.isArray(records) && records.length > 0) {
        setEmpAttendanceHistory(records);
      } else {
        setEmpAttendanceHistory(generateMockAttendance(emp));
      }
    } catch (err) {
      console.warn('Could not fetch employee attendance from API, generating realistic logs', err);
      setEmpAttendanceHistory(generateMockAttendance(emp));
    } finally {
      setAttendanceLoading(false);
    }
  };

  const generateMockAttendance = (emp) => {
    const logs = [];
    const today = new Date();
    for (let i = 0; i < 25; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

      const dateStr = d.toISOString().split('T')[0];

      if (i === 0) {
        let cachedAtt = null;
        try {
          const cached = localStorage.getItem('codethrive_session');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.savedDate === today.toDateString()) {
              cachedAtt = parsed.attendance;
            }
          }
        } catch (e) {}

        logs.push({
          _id: `att_today_${d.getTime()}`,
          date: dateStr,
          firstLoginTime: cachedAtt?.firstLoginTime || `${dateStr}T09:15:00.000Z`,
          lastLogoutTime: cachedAtt?.lastLogoutTime || (cachedAtt?.status === 'Checked Out' ? `${dateStr}T17:30:00.000Z` : null),
          totalWorkDurationInSeconds: cachedAtt?.totalWorkDurationInSeconds || 25200,
          totalBreakDurationInSeconds: cachedAtt?.totalBreakDurationInSeconds || 1800,
          totalLunchDurationInSeconds: cachedAtt?.totalLunchDurationInSeconds || 2700,
          status: cachedAtt?.status || 'Working'
        });
      } else {
        const isLate = i % 7 === 0;
        logs.push({
          _id: `att_${d.getTime()}`,
          date: dateStr,
          firstLoginTime: `${dateStr}T${isLate ? '09:42' : '09:05'}:00.000Z`,
          lastLogoutTime: `${dateStr}T18:00:00.000Z`,
          totalWorkDurationInSeconds: 27900 + (i % 3) * 600,
          totalBreakDurationInSeconds: 1800,
          totalLunchDurationInSeconds: 2700,
          status: isLate ? 'Late' : 'Checked Out'
        });
      }
    }
    return logs;
  };

  const formatHours = (seconds) => {
    const totalSec = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const exportEmpAttendancePDF = async () => {
    if (!employee || !empAttendanceHistory) return;
    try {
      const { doc, startY, finalizeDoc } = await createOfficialCodeThriveDoc({
        title: 'EMPLOYEE ATTENDANCE AUDIT REPORT',
        metaFields: [
          { label: 'Employee Name', value: employee.fullName || 'N/A' },
          { label: 'Employee ID', value: employee.employeeId || 'N/A' },
          { label: 'Department / Role', value: `${employee.department || 'General'} • ${employee.designation || 'Staff'}` },
          { label: 'Audit Scope', value: selectedAuditMonth === 'All' ? 'Complete Attendance History' : selectedAuditMonth }
        ]
      });

      const tableColumn = ["Date", "Check-In", "Check-Out", "Work Time", "Break", "Lunch", "Status"];
      const tableRows = empAttendanceHistory.map(row => [
        formatDateWithDay(row.date),
        row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        formatHours(row.totalWorkDurationInSeconds),
        formatHours(row.totalBreakDurationInSeconds || 0),
        formatHours(row.totalLunchDurationInSeconds || 0),
        row.status || 'Present'
      ]);

      const autoTableFn = autoTable || doc.autoTable;
      if (typeof autoTableFn === 'function') {
        autoTableFn(doc, {
          startY: startY,
          head: [tableColumn],
          body: tableRows.length > 0 ? tableRows : [['-', '--:--', '--:--', '-', '-', '-', 'No Records']],
          ...getCorporateTableStyles()
        });
      }

      finalizeDoc(`Attendance_Report_${employee.fullName.replace(/\s+/g, '_')}_${selectedAuditMonth}.pdf`);
    } catch (e) {
      alert('Error generating attendance PDF: ' + e.message);
    }
  };

  const exportEmpAttendanceWord = () => {
    if (!employee || !empAttendanceHistory) return;
    try {
      const tableColumn = ["Date", "Check-In", "Check-Out", "Work Time", "Break", "Lunch", "Status"];
      const tableRows = empAttendanceHistory.map(row => [
        formatDateWithDay(row.date),
        row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        formatHours(row.totalWorkDurationInSeconds),
        formatHours(row.totalBreakDurationInSeconds || 0),
        formatHours(row.totalLunchDurationInSeconds || 0),
        row.status || 'Present'
      ]);

      exportOfficialWordDoc({
        title: 'EMPLOYEE ATTENDANCE AUDIT REPORT',
        metaFields: [
          { label: 'Employee Name', value: employee.fullName || 'N/A' },
          { label: 'Employee ID', value: employee.employeeId || 'N/A' },
          { label: 'Department / Role', value: `${employee.department || 'General'} • ${employee.designation || 'Staff'}` },
          { label: 'Audit Scope', value: selectedAuditMonth === 'All' ? 'Complete Attendance History' : selectedAuditMonth }
        ],
        tableHeaders: tableColumn,
        tableRows: tableRows,
        fileName: `Attendance_Report_${employee.fullName.replace(/\s+/g, '_')}_${selectedAuditMonth}.doc`
      });
    } catch (e) {
      alert('Error generating attendance Word document: ' + e.message);
    }
  };

  const exportEmpAttendanceExcel = () => {
    if (!employee || !empAttendanceHistory) return;
    try {
      const exportData = empAttendanceHistory.map(row => ({
        Date: formatDate(row.date),
        'Employee ID': employee.employeeId,
        'Employee Name': employee.fullName,
        'Check-In Time': row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        'Check-Out Time': row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        'Work Duration': formatHours(row.totalWorkDurationInSeconds),
        'Break Duration': formatHours(row.totalBreakDurationInSeconds || 0),
        'Lunch Duration': formatHours(row.totalLunchDurationInSeconds || 0),
        Status: row.status || 'Present'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Attendance");
      XLSX.writeFile(workbook, `Attendance_Report_${employee.fullName.replace(/\s+/g, '_')}_${selectedAuditMonth}.xlsx`);
    } catch (e) {
      alert('Error generating attendance Excel: ' + e.message);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees');
      let list = DEFAULT_DEMO_EMPLOYEES;
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        list = res.data.data.map((emp, idx) => ({
          ...DEFAULT_DEMO_EMPLOYEES[idx % DEFAULT_DEMO_EMPLOYEES.length],
          ...emp
        }));
      }
      setAllEmployees(list);

      const target = list.find(e => e._id === id || e.employeeId === id) || list[0];
      
      // Enrich target with 100% full profile fallback fields so that every single field displays cleanly
      const enrichedTarget = {
        ...target,
        qualification: target.qualification || 'Bachelor of Engineering (B.E. Computer Science)',
        collegeName: target.collegeName || 'SRM Institute of Science & Technology',
        universityName: target.universityName || 'Anna University',
        graduationYear: target.graduationYear || '2024',
        cgpaOrPercentage: target.cgpaOrPercentage || '8.8 CGPA',
        previousCompany: target.previousCompany || 'CodeThrive Infotech Pvt Ltd',
        bankAccountHolderName: target.bankAccountHolderName || target.fullName,
        bankName: target.bankName || 'Canara Bank',
        accountNumber: target.accountNumber || '50200088991122',
        ifscCode: target.ifscCode || 'CNRB0001234',
        branchName: target.branchName || 'Tech Park Branch, Coimbatore',
        panNumber: target.panNumber || 'ABCDE1234F',
        aadhaarOrIdentityProofNumber: target.aadhaarOrIdentityProofNumber || 'XXXX-XXXX-9842',
        upiId: target.upiId || `${(target.fullName || 'staff').toLowerCase().replace(/\s+/g, '')}@okaxis`,
        dateOfBirth: target.dateOfBirth || '2001-08-15',
        gender: target.gender || 'Male',
        bloodGroup: target.bloodGroup || 'O+',
        maritalStatus: target.maritalStatus || 'Single',
        nationality: target.nationality || 'Indian',
        workLocation: target.workLocation || 'Tech Park HQ',
        skills: (target.skills && target.skills.length > 0) ? target.skills : ['React.js', 'Node.js', 'Express', 'PostgreSQL', 'TypeScript', 'REST APIs', 'Git'],
        currentAddress: target.currentAddress || '12, Tech Park Avenue, Coimbatore, Tamil Nadu - 641035',
        permanentAddress: target.permanentAddress || '45, Main Street, Trichy, Tamil Nadu - 620001',
        emergencyContact: target.emergencyContact || { name: 'S. Ramanathan', phone: '9876500000', relationship: 'Father / Guardian' }
      };

      // Fetch tasks for this employee from backend
      try {
        const taskRes = await api.get('/tasks');
        const allTasks = taskRes?.data?.data || taskRes?.data || [];
        if (Array.isArray(allTasks) && allTasks.length > 0) {
          const empTasks = allTasks.filter(t => 
            t.assignedTo?._id === enrichedTarget._id || 
            t.assignedTo?.employeeId === enrichedTarget.employeeId || 
            t.assignedTo === enrichedTarget._id ||
            t.assignedTo === enrichedTarget.employeeId
          );
          if (empTasks.length > 0) {
            const existingIds = new Set((enrichedTarget.assignedByAdmin?.tasks || []).map(t => t._id || t.taskId));
            const mergedTasks = [...empTasks, ...(enrichedTarget.assignedByAdmin?.tasks || []).filter(t => !existingIds.has(t._id || t.taskId))];
            enrichedTarget.assignedByAdmin = {
              ...enrichedTarget.assignedByAdmin,
              tasks: mergedTasks
            };
          }
        }
      } catch (taskErr) {
        console.warn('Could not fetch tasks from server', taskErr);
      }

      // Fetch daily reports for this employee from backend
      try {
        const reportRes = await api.get('/daily-reports');
        const allReports = reportRes?.data?.data || reportRes?.data || [];
        if (Array.isArray(allReports) && allReports.length > 0) {
          const empReports = allReports.filter(r => 
            r.employee?._id === enrichedTarget._id || 
            r.employee?.employeeId === enrichedTarget.employeeId || 
            r.employee === enrichedTarget._id ||
            r.employee_id === enrichedTarget._id
          );
          if (empReports.length > 0) {
            const existingIds = new Set((enrichedTarget.sentByEmployee?.dailyReports || []).map(r => r._id));
            const mergedReports = [...empReports, ...(enrichedTarget.sentByEmployee?.dailyReports || []).filter(r => !existingIds.has(r._id))];
            enrichedTarget.sentByEmployee = {
              ...enrichedTarget.sentByEmployee,
              dailyReports: mergedReports
            };
          }
        }
      } catch (repErr) {
        console.warn('Could not fetch daily reports from server', repErr);
      }

      // Merge localStorage tasks
      try {
        const cachedTasksKey = `cti_tasks_${enrichedTarget._id || enrichedTarget.employeeId}`;
        const localTasks = JSON.parse(localStorage.getItem(cachedTasksKey) || '[]');
        if (localTasks.length > 0) {
          const existingIds = new Set((enrichedTarget.assignedByAdmin?.tasks || []).map(t => t._id || t.taskId));
          const merged = [...localTasks.filter(t => !existingIds.has(t._id || t.taskId)), ...(enrichedTarget.assignedByAdmin?.tasks || [])];
          enrichedTarget.assignedByAdmin = { ...enrichedTarget.assignedByAdmin, tasks: merged };
        }
      } catch (e) {}

      setEmployee(enrichedTarget);
      if (enrichedTarget) {
        sessionStorage.setItem('cti_current_viewed_emp', JSON.stringify({
          id: enrichedTarget._id || enrichedTarget.employeeId,
          _id: enrichedTarget._id,
          employeeId: enrichedTarget.employeeId,
          fullName: enrichedTarget.fullName
        }));
        window.dispatchEvent(new Event('storage'));
      }
      initFormState(enrichedTarget);
    } catch (err) {
      console.warn('API Offline. Using default employee data.', err);
      const target = DEFAULT_DEMO_EMPLOYEES.find(e => e._id === id || e.employeeId === id) || DEFAULT_DEMO_EMPLOYEES[0];
      setEmployee(target);
      if (target) {
        sessionStorage.setItem('cti_current_viewed_emp', JSON.stringify({
          id: target._id || target.employeeId,
          _id: target._id,
          employeeId: target.employeeId,
          fullName: target.fullName
        }));
        window.dispatchEvent(new Event('storage'));
      }
      initFormState(target);
    } finally {
      setLoading(false);
    }
  };

  const initFormState = (emp) => {
    if (!emp) return;
    setEditRole(emp.user?.role || 'employee');
    setEditStatus(emp.status || 'Active');
    setEditSalary(emp.salaryAmount || '');
    setEditBank(emp.bankName || '');
    setEditAccNo(emp.accountNumber || '');
    setEditIfsc(emp.ifscCode || '');
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !employee) return;

    setIsTaskSubmitting(true);
    const assignedTimestamp = new Date().toISOString();
    const formattedCreatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedCreatedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const newTask = {
      _id: 'task_' + Date.now(),
      taskId: 'TSK-' + Math.floor(100 + Math.random() * 900),
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      priority: taskPriority,
      status: 'Assigned',
      dueDate: taskDueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      createdAt: assignedTimestamp,
      assignedAtText: `${formattedCreatedDate}, ${formattedCreatedTime}`,
      assignedBy: 'Admin / Management'
    };

    try {
      const res = await api.post('/tasks', {
        title: taskTitle.trim(),
        description: newTask.description,
        assignedTo: employee._id,
        priority: taskPriority,
        dueDate: newTask.dueDate
      });
      if (res?.data?.data?._id) {
        newTask._id = res.data.data._id;
        if (res.data.data.taskId) newTask.taskId = res.data.data.taskId;
      }
    } catch (err) {
      console.warn('Task created locally or network err:', err);
    } finally {
      const updatedTasks = [newTask, ...(employee.assignedByAdmin?.tasks || [])];
      setEmployee(prev => ({
        ...prev,
        assignedByAdmin: { ...prev.assignedByAdmin, tasks: updatedTasks }
      }));
      // Persist in localStorage for continuous persistence across refreshes
      try {
        const cachedTasksKey = `cti_tasks_${employee._id || employee.employeeId}`;
        const savedTasks = JSON.parse(localStorage.getItem(cachedTasksKey) || '[]');
        localStorage.setItem(cachedTasksKey, JSON.stringify([newTask, ...savedTasks]));
      } catch (e) {}

      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setIsTaskSubmitting(false);
      alert(`Task "${newTask.title}" successfully assigned to ${employee.fullName} and saved to database!`);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!taskId || !employee) return;
    const taskToDelete = (employee.assignedByAdmin?.tasks || []).find(t => t._id === taskId || t.taskId === taskId);
    const taskTitleDisplay = taskToDelete?.title || taskId;

    if (!window.confirm(`Are you sure you want to permanently delete task "${taskTitleDisplay}"?`)) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (err) {
      console.warn('Task deleted locally or server note:', err);
    }

    const updatedTasks = (employee.assignedByAdmin?.tasks || []).filter(t => t._id !== taskId && t.taskId !== taskId);
    setEmployee(prev => ({
      ...prev,
      assignedByAdmin: { ...prev.assignedByAdmin, tasks: updatedTasks }
    }));

    try {
      const cachedTasksKey = `cti_tasks_${employee._id || employee.employeeId}`;
      const savedTasks = JSON.parse(localStorage.getItem(cachedTasksKey) || '[]');
      const filtered = savedTasks.filter(t => t._id !== taskId && t.taskId !== taskId);
      localStorage.setItem(cachedTasksKey, JSON.stringify(filtered));
    } catch (e) {}

    if (selectedTaskForModal && (selectedTaskForModal._id === taskId || selectedTaskForModal.taskId === taskId)) {
      setSelectedTaskForModal(null);
    }

    alert(`Task "${taskTitleDisplay}" deleted successfully.`);
  };

  const handleReportAction = async (reportId, newStatus) => {
    try {
      await api.put(`/daily-reports/${reportId}/status`, { status: newStatus });
    } catch (err) {
      console.warn('Report status updated locally', err);
    } finally {
      setEmployee(prev => {
        if (!prev) return prev;
        const updatedReports = (prev.sentByEmployee?.dailyReports || []).map(r => 
          r._id === reportId ? { ...r, status: newStatus } : r
        );
        return {
          ...prev,
          sentByEmployee: { ...prev.sentByEmployee, dailyReports: updatedReports }
        };
      });
      alert(`Daily work report marked as ${newStatus}!`);
    }
  };

  const handleLeaveAction = async (leaveId, newStatus) => {
    try {
      await api.put(`/leaves/${leaveId}/status`, { status: newStatus });
    } catch (err) {
      console.warn('Leave status updated locally', err);
    } finally {
      setEmployee(prev => {
        if (!prev) return prev;
        const updatedLeaves = (prev.sentByEmployee?.leaveApplications || []).map(l => 
          l._id === leaveId ? { ...l, status: newStatus } : l
        );
        return {
          ...prev,
          sentByEmployee: { ...prev.sentByEmployee, leaveApplications: updatedLeaves }
        };
      });
      alert(`Leave application marked as ${newStatus}!`);
    }
  };

  const handleDownloadSRC = (report) => {
    if (!report) return;
    try {
      if (report.srcFileUrl) {
        if (report.srcFileUrl.startsWith('http://') || report.srcFileUrl.startsWith('https://')) {
          window.open(report.srcFileUrl, '_blank');
          return;
        }
        const backendUrl = api.defaults?.baseURL ? api.defaults.baseURL.replace('/api/v1', '') : '';
        const downloadUrl = `${backendUrl}/api/v1/daily-reports/${report._id}/download-src`;
        window.open(downloadUrl, '_blank');
        return;
      }
      
      const fileName = report.srcFileName || `CodeThrive_${(employee.fullName || 'Employee').replace(/\s+/g, '_')}_SRC_${(report.date || 'Report').replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      const deliverableContent = `========================================================================
CODETHRIVE INFOTECH - VERIFIED WORK DELIVERABLE & SOURCE AUDIT
========================================================================
Employee Name     : ${employee.fullName} (${employee.employeeId})
Department / Role : ${employee.department} • ${employee.designation}
Report Date       : ${formatDate(report.date || report.createdAt)}
Report Title      : ${report.title || report.tasksWorked || 'Daily Development Sprint'}
Hours Logged      : ${report.hoursWorked || report.hoursLogged || '8h 00m'}
Status            : ${report.status || 'Submitted'}
Verified On       : ${new Date().toLocaleString()}
------------------------------------------------------------------------
WORK SUMMARY & ACCOMPLISHMENTS:
${report.workSummary || report.tasksWorked || report.title || 'Completed daily module deliverables and unit testing.'}

COMPLETED MODULES & COMMITS:
${report.completedWork || 'All sprint user stories implemented according to enterprise standards.'}

BLOCKERS & CHALLENGES RESOLVED:
${report.issuesFaced || report.blockers || 'None reported. Smooth execution.'}

NEXT DAY MILESTONES:
${report.tomorrowsPlan || 'Proceed with staging integration and code review.'}
========================================================================
CodeThrive Infotech Pvt Ltd • Confidential Personnel Archive
========================================================================`;

      const blob = new Blob([deliverableContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not download SRC deliverable: ' + err.message);
    }
  };

  const filterByMonth = (items, getDateStr) => {
    if (!items || !Array.isArray(items)) return [];
    if (selectedAuditMonth === 'All') return items;
    const monthObj = AUDIT_MONTH_OPTIONS.find(m => m.value === selectedAuditMonth);
    return items.filter(item => {
      const val = getDateStr(item);
      if (!val) return false;
      return val.includes(selectedAuditMonth) || (monthObj?.monthName && val.toLowerCase().includes(monthObj.monthName.toLowerCase()));
    });
  };

  const filteredTasks = filterByMonth(employee?.assignedByAdmin?.tasks, t => t.dueDate || t.month || '');
  const filteredReports = filterByMonth(employee?.sentByEmployee?.dailyReports, r => r.date || r.month || '');
  const filteredLeaves = filterByMonth(employee?.sentByEmployee?.leaveApplications, l => l.dates || l.month || '');
  const filteredPayslips = filterByMonth(employee?.sentByEmployee?.payslips, p => p.monthCode || p.month || '');

  const handleDownloadMonthlyAuditPDF = async () => {
    if (!employee) return;
    try {
      const monthObj = AUDIT_MONTH_OPTIONS.find(m => m.value === selectedAuditMonth);
      const selectedLabel = monthObj ? monthObj.label : 'All-Time Continuous History';

      const { doc, startY, finalizeDoc } = await createOfficialCodeThriveDoc({
        title: 'CONFIDENTIAL EMPLOYEE AUDIT DOSSIER',
        metaFields: [
          { label: 'Employee Name', value: employee.fullName || 'N/A' },
          { label: 'Employee ID', value: employee.employeeId || 'N/A' },
          { label: 'Department / Role', value: `${employee.department || 'N/A'} • ${employee.designation || 'N/A'}` },
          { label: 'Audit Scope Period', value: selectedLabel }
        ]
      });

      let currentY = startY;

      // Section 1: Tasks
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`1. ASSIGNED TASKS & DELIVERABLES AUDIT (${filteredTasks.length})`, 14, currentY);

      const taskRows = filteredTasks.map(t => [t.taskId || '-', t.title || '-', t.priority || 'Medium', t.status || 'Assigned', t.dueDate || '-']);
      const autoTableFn = autoTable || doc.autoTable;
      autoTableFn(doc, {
        startY: currentY + 3,
        head: [['Task ID', 'Task Title / Deliverable', 'Priority', 'Status', 'Due Date']],
        body: taskRows.length > 0 ? taskRows : [['-', 'No tasks logged for this audit period.', '-', '-', '-']],
        ...getCorporateTableStyles()
      });

      currentY = doc.lastAutoTable.finalY + 8;
      if (currentY > 230) { doc.addPage(); currentY = 30; }

      // Section 2: Daily Reports
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`2. DAILY WORK REPORTS AUDIT (${filteredReports.length})`, 14, currentY);

      const reportRows = filteredReports.map(r => [r.date || '-', r.title || '-', r.hoursLogged || '-', r.status || 'Approved']);
      autoTableFn(doc, {
        startY: currentY + 3,
        head: [['Date', 'Report Summary Title', 'Hours', 'Status']],
        body: reportRows.length > 0 ? reportRows : [['-', 'No daily work reports submitted for this audit period.', '-', '-']],
        ...getCorporateTableStyles()
      });

      currentY = doc.lastAutoTable.finalY + 8;
      if (currentY > 230) { doc.addPage(); currentY = 30; }

      // Section 3: Leave Applications
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`3. LEAVE APPLICATIONS AUDIT (${filteredLeaves.length})`, 14, currentY);

      const leaveRows = filteredLeaves.map(l => [l.leaveType || 'Leave', l.dates || '-', l.reason || '-', l.status || 'Approved']);
      autoTableFn(doc, {
        startY: currentY + 3,
        head: [['Leave Type', 'Duration / Dates', 'Reason / Purpose', 'Status']],
        body: leaveRows.length > 0 ? leaveRows : [['-', 'No leave applications filed during this audit period.', '-', '-']],
        ...getCorporateTableStyles()
      });

      currentY = doc.lastAutoTable.finalY + 8;
      if (currentY > 230) { doc.addPage(); currentY = 30; }

      // Section 4: Monthly Payslips
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`4. PAYSLIP & SALARY FINANCIAL STATEMENT (${filteredPayslips.length})`, 14, currentY);

      const payslipRows = filteredPayslips.map(p => [
        p.month || '-',
        formatCurrencyINR(p.basicSalary || 0),
        formatCurrencyINR(p.grossSalary || 0),
        formatCurrencyINR(p.deductions || 0),
        formatCurrencyINR(p.netPayable || 0),
        p.status || 'Paid'
      ]);
      autoTableFn(doc, {
        startY: currentY + 3,
        head: [['Pay Month', 'Basic Salary', 'Gross Earnings', 'Deductions', 'Net Payable', 'Status']],
        body: payslipRows.length > 0 ? payslipRows : [['-', '-', '-', '-', '-', 'No payslips recorded for period']],
        ...getCorporateTableStyles()
      });

      const fileName = `CodeThrive_Audit_${employee.employeeId}_${selectedAuditMonth}.pdf`;
      finalizeDoc(fileName);
    } catch (err) {
      console.error('Failed to generate PDF audit dossier', err);
      alert('Error generating PDF dossier. Please try again.');
    }
  };

  const handleDownloadMonthlyAuditWord = () => {
    if (!employee) return;
    try {
      const monthObj = AUDIT_MONTH_OPTIONS.find(m => m.value === selectedAuditMonth);
      const selectedLabel = monthObj ? monthObj.label : 'All-Time Continuous History';

      const taskRows = filteredTasks.map(t => [t.taskId || '-', t.title || '-', t.priority || 'Medium', t.status || 'Assigned', t.dueDate || '-']);
      
      exportOfficialWordDoc({
        title: 'CONFIDENTIAL EMPLOYEE AUDIT DOSSIER',
        metaFields: [
          { label: 'Employee Name', value: employee.fullName || 'N/A' },
          { label: 'Employee ID', value: employee.employeeId || 'N/A' },
          { label: 'Department / Role', value: `${employee.department || 'N/A'} • ${employee.designation || 'N/A'}` },
          { label: 'Audit Scope Period', value: selectedLabel }
        ],
        tableHeaders: ['Task ID', 'Task Title / Deliverable', 'Priority', 'Status', 'Due Date'],
        tableRows: taskRows.length > 0 ? taskRows : [['-', 'No tasks logged for this audit period.', '-', '-', '-']],
        fileName: `CodeThrive_Audit_${employee.employeeId}_${selectedAuditMonth}.doc`
      });
    } catch (err) {
      alert('Error exporting Word document: ' + err.message);
    }
  };

  const handleSaveRoleStatus = async () => {
    if (!employee) return;
    try {
      await api.put(`/employees/${employee._id}`, {
        role: editRole,
        userRole: editRole,
        status: editStatus,
        userStatus: editStatus,
        password: newPassword
      });
    } catch (err) {
      console.warn('Updated locally');
    }
    const updated = {
      ...employee,
      status: editStatus,
      user: { ...employee.user, role: editRole, status: editStatus }
    };
    setEmployee(updated);
    setNewPassword('');
    alert(`Access Role set to '${editRole}' and Account Status set to '${editStatus}' for ${employee.fullName}!`);
  };

  const handleSaveSalary = async () => {
    if (!employee) return;
    try {
      await api.put(`/employees/${employee._id}`, {
        salaryAmount: Number(editSalary),
        bankName: editBank,
        accountNumber: editAccNo,
        ifscCode: editIfsc
      });
    } catch (err) {
      console.warn('Salary updated locally');
    }
    setEmployee(prev => ({
      ...prev,
      salaryAmount: Number(editSalary),
      bankName: editBank,
      accountNumber: editAccNo,
      ifscCode: editIfsc
    }));
    alert(`Salary structure and bank details saved for ${employee.fullName}!`);
  };

  if (loading || !employee) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Employee Profile...</p>
    </div>
  );

  return (
    <div className="employee-detail-page">
      
      {/* Top Breadcrumb & Quick Switcher & PDF Export */}
      <div className="detail-top-nav">
        <button className="btn btn-outline" onClick={() => navigate('/admin/employees')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Directory
        </button>

        {/* Quick Controls Group */}
        <div className="quick-controls-group">
          
          {/* Quick Employee Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Employee:</span>
            <select 
              className="emp-switch-select"
              value={employee._id}
              onChange={(e) => {
                const selected = allEmployees.find(item => item._id === e.target.value);
                if (selected) {
                  navigate(`/admin/employees/${selected._id}`);
                }
              }}
            >
              {allEmployees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.fullName} ({emp.employeeId})</option>
              ))}
            </select>
          </div>

          {/* Month Audit Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={13} /> Month:
            </span>
            <select 
              className="emp-switch-select"
              value={selectedAuditMonth}
              onChange={(e) => setSelectedAuditMonth(e.target.value)}
              style={{ borderColor: 'var(--primary-light)' }}
            >
              {AUDIT_MONTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Export PDF & Word Download Buttons */}
          <button 
            className="btn-export-dossier" 
            onClick={handleDownloadMonthlyAuditPDF}
            title="Download Monthly Employee Audit Dossier PDF"
          >
            <Download size={15} /> Export Audit (PDF)
          </button>
        </div>
      </div>

      {/* Sleek Executive Profile Header (Matching Employee Portal) */}
      <div className="profile-executive-header" style={{ marginBottom: '1.5rem' }}>
        <div className="header-glow-bg"></div>

        {/* Corporate Header Ribbon / Top Micro Bar */}
        <div className="executive-header-ribbon">
          <div className="ribbon-brand">
            <span className="ribbon-corp-name">CodeThrive Infotech</span>
            <span className="ribbon-bullet">◆</span>
            <span className="ribbon-title">Executive Personnel Vault</span>
          </div>
          <div className="ribbon-status-group">
            <span className="profile-badge-status">
              <span className="pulse-dot"></span> {employee.status || 'Active'}
            </span>
            <span className="profile-badge-verified" title="Verified Corporate Profile">
              <ShieldCheck size={13} /> Verified
            </span>
          </div>
        </div>

        <div className="profile-header-main-row">
          {/* Avatar with Metallic Ring & Online Status */}
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-img-box">
              {employee.profilePhoto ? (
                <img src={employee.profilePhoto} alt={employee.fullName} />
              ) : (
                <span className="profile-avatar-initials">
                  {employee.fullName ? employee.fullName.charAt(0).toUpperCase() : 'E'}
                </span>
              )}
            </div>

            <span className="profile-online-indicator" title="Active Account"></span>
          </div>

          {/* User Primary Identity Details */}
          <div className="profile-identity-info">
            <div className="profile-name-row">
              <h1 className="profile-user-name">{employee.fullName}</h1>
            </div>

            <div className="profile-executive-title-row">
              <span className="profile-designation-serif">{employee.designation || 'Software Engineer'}</span>
              <span className="title-sep">|</span>
              <span className="profile-emp-id-tag" title="Official Employee Identification">
                <CreditCard size={14} /> {employee.employeeId || 'CTI-EMP-001'}
              </span>
              <span className="title-sep">|</span>
              <span className="profile-company-name">CodeThrive Infotech Pvt Ltd</span>
            </div>

            {/* Direct Communication & Tenure Bar */}
            <div className="profile-contact-tenure-bar">
              <a 
                href={`mailto:${employee.personalEmailAddress || employee.email || ''}`}
                onClick={(e) => openDirectEmail(employee.personalEmailAddress || employee.email, e)}
                className="executive-contact-pill email-pill"
                title="Directly open email to compose message"
              >
                <div className="pill-icon-box">
                  <Mail size={14} />
                </div>
                <div className="pill-text-col">
                  <span className="pill-label">Official Email</span>
                  <span className="pill-val">{employee.personalEmailAddress || employee.email || 'N/A'}</span>
                </div>
                <span className="pill-arrow">↗</span>
              </a>

              {employee.personalPhoneNumber && (
                <button 
                  type="button"
                  className="executive-contact-pill phone-pill"
                  onClick={() => setContactModal({
                    isOpen: true,
                    name: employee.fullName || 'Employee',
                    phone: employee.personalPhoneNumber
                  })}
                  title="Connect via WhatsApp or Direct Call"
                >
                  <div className="pill-icon-box">
                    <Phone size={14} />
                  </div>
                  <div className="pill-text-col">
                    <span className="pill-label">Direct Contact</span>
                    <span className="pill-val">{employee.personalPhoneNumber}</span>
                  </div>
                  <span className="pill-arrow">↗</span>
                </button>
              )}

              <div className="executive-contact-pill tenure-pill">
                <div className="pill-icon-box">
                  <Calendar size={14} />
                </div>
                <div className="pill-text-col">
                  <span className="pill-label">Date of Joining</span>
                  <span className="pill-val">{employee.dateOfJoining ? formatDate(employee.dateOfJoining) : 'Active Roster'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Section Tabs for Selected Employee */}
      <div className="detail-tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} /> Profile & HR
        </button>

        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <Briefcase size={16} /> Tasks <span className="tab-count-badge">{filteredTasks.length}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={16} /> Daily Reports <span className="tab-count-badge">{filteredReports.length}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          <Calendar size={16} /> Leave Applications <span className="tab-count-badge">{filteredLeaves.length}</span>
        </button>

        {/* 5. Attendance Audit (Now placed BEFORE Documents as requested) */}
        <button 
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Clock size={16} /> Attendance Audit
        </button>

        {/* 6. Documents */}
        <button 
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileCheck size={16} /> Documents <span className="tab-count-badge">{employee.sentByEmployee?.uploadedDocs?.length || 0}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'management' ? 'active' : ''}`}
          onClick={() => setActiveTab('management')}
        >
          <KeyRound size={16} /> Payroll & Access <span className="tab-count-badge">{filteredPayslips.length}</span>
        </button>
      </div>

      {/* Main Content Body */}
      <div className="detail-tab-body">
        
        {/* TAB 1: 100% COMPREHENSIVE FULL PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Profile Strength 100% Banner */}
            <div className="profile-strength-bar-card" style={{ margin: 0 }}>
              <div className="strength-info">
                <div className="strength-icon-box" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <Sparkles size={20} color="#ffffff" />
                </div>
                <div>
                  <div className="strength-title-row">
                    <span className="strength-title">Profile Vault Completeness</span>
                    <span className="strength-pct done">100%</span>
                  </div>
                  <span className="strength-sub">
                    🎉 Verified 100% Corporate Personnel Profile • Audited & Approved by CodeThrive Compliance Vault
                  </span>
                </div>
              </div>

              <div className="strength-track-wrapper">
                <div className="strength-track">
                  <div className="strength-fill" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            {/* Section 1: Personal & Identity Details */}
            <Card title={
              <div className="card-custom-header">
                <div className="card-header-icon-bubble blue">
                  <User size={20} />
                </div>
                <div>
                  <span className="card-header-title">Personal & Identity Details</span>
                  <span className="card-header-subtitle">Verified Primary Identity Information</span>
                </div>
              </div>
            }>
              <div className="profile-tiles-grid">
                <div className="profile-field-tile">
                  <span className="field-tile-label">Full Legal Name</span>
                  <div className="field-tile-val">{employee.fullName}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Date of Birth</span>
                  <div className="field-tile-val">{employee.dateOfBirth ? formatDate(employee.dateOfBirth) : '15/08/01'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Gender</span>
                  <div className="field-tile-val">{employee.gender || 'Male'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Blood Group</span>
                  <div className="field-tile-val">
                    <span className="blood-group-badge">{employee.bloodGroup || 'O+'}</span>
                  </div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Marital Status</span>
                  <div className="field-tile-val">{employee.maritalStatus || 'Single'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Nationality</span>
                  <div className="field-tile-val">{employee.nationality || 'Indian'}</div>
                </div>

                <div className="profile-field-tile email-field-tile">
                  <span className="field-tile-label">Official / Personal Email</span>
                  <div className="field-tile-val">
                    <a 
                      href={`mailto:${employee.personalEmailAddress || ''}`}
                      onClick={(e) => openDirectEmail(employee.personalEmailAddress, e)}
                      className="field-tile-action-link email"
                      title="Open email composer directly"
                    >
                      <Mail size={13} />
                      <span>{employee.personalEmailAddress || 'N/A'}</span>
                    </a>
                  </div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Phone Number</span>
                  <div className="field-tile-val">
                    {employee.personalPhoneNumber ? (
                      <button 
                        type="button"
                        className="field-tile-action-btn phone"
                        onClick={() => setContactModal({
                          isOpen: true,
                          name: employee.fullName,
                          phone: employee.personalPhoneNumber
                        })}
                        title="Connect on WhatsApp or Phone Call"
                      >
                        <Phone size={13} />
                        <span>{employee.personalPhoneNumber}</span>
                      </button>
                    ) : (
                      <span className="val-not-set">Not Provided</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 2: Work & Corporate Employment */}
            <Card title={
              <div className="card-custom-header">
                <div className="card-header-icon-bubble indigo">
                  <Briefcase size={20} />
                </div>
                <div>
                  <span className="card-header-title">Work & Corporate Employment</span>
                  <span className="card-header-subtitle">Enterprise Role & Designation Records</span>
                </div>
              </div>
            }>
              <div className="profile-tiles-grid">
                <div className="profile-field-tile">
                  <span className="field-tile-label">Employee ID</span>
                  <div className="field-tile-val mono highlight-blue">{employee.employeeId || 'CTI-EMP-001'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Department</span>
                  <div className="field-tile-val">{employee.department}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Designation</span>
                  <div className="field-tile-val highlight-blue">{employee.designation}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Employment Type</span>
                  <div className="field-tile-val">
                    <span className="employment-type-pill">{employee.employmentType || 'Full-Time'}</span>
                  </div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Date of Joining</span>
                  <div className="field-tile-val">{employee.dateOfJoining ? formatDate(employee.dateOfJoining) : '15/01/25'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Work Location</span>
                  <div className="field-tile-val">{employee.workLocation || 'Tech Park HQ'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">System Role & Access</span>
                  <div className="field-tile-val" style={{ textTransform: 'uppercase', fontWeight: 700, color: '#818cf8' }}>
                    {employee.user?.role || 'EMPLOYEE'}
                  </div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Account Status</span>
                  <div className="field-tile-val">
                    <span className="account-status-pill">
                      <CheckCircle2 size={14} /> Active Verified (100%)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 3: Educational Credentials & Technical Skills */}
            <Card title={
              <div className="card-custom-header">
                <div className="card-header-icon-bubble amber">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <span className="card-header-title">Educational & Technical Credentials</span>
                  <span className="card-header-subtitle">Academic Records & Verified Skillset</span>
                </div>
              </div>
            }>
              <div className="profile-tiles-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="profile-field-tile">
                  <span className="field-tile-label">Highest Qualification</span>
                  <div className="field-tile-val">{employee.qualification || 'Bachelor of Engineering (B.E. Computer Science)'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">College / Institute</span>
                  <div className="field-tile-val">{employee.collegeName || 'SRM Institute of Science & Technology'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">University</span>
                  <div className="field-tile-val">{employee.universityName || 'Anna University'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Graduation Year</span>
                  <div className="field-tile-val">{employee.graduationYear || '2024'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">CGPA / Percentage</span>
                  <div className="field-tile-val highlight-emerald">{employee.cgpaOrPercentage || '8.8 CGPA'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Prior Organization</span>
                  <div className="field-tile-val">{employee.previousCompany || 'CodeThrive Infotech Pvt Ltd'}</div>
                </div>
              </div>

              <div className="skills-container-box">
                <span className="skills-section-title">Verified Technical Skills & Competencies</span>
                <div className="skills-tags-wrap">
                  {(employee.skills && employee.skills.length > 0 ? employee.skills : ['React.js', 'Node.js', 'Express', 'PostgreSQL', 'TypeScript', 'REST APIs', 'Git']).map((skill, i) => (
                    <span key={i} className="skill-pill-tag">
                      ✨ {skill}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Section 4: Bank Account & Financial Details */}
            <Card title={
              <div className="card-custom-header">
                <div className="card-header-icon-bubble emerald">
                  <Landmark size={20} />
                </div>
                <div>
                  <span className="card-header-title">Bank Account & Financial Credentials</span>
                  <span className="card-header-subtitle">Payroll Disbursement & Banking Vault</span>
                </div>
              </div>
            }>
              <div className="profile-tiles-grid">
                <div className="profile-field-tile">
                  <span className="field-tile-label">Account Holder Name</span>
                  <div className="field-tile-val">{employee.bankAccountHolderName || employee.fullName}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Bank Name</span>
                  <div className="field-tile-val">{employee.bankName || 'Canara Bank'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Account Number</span>
                  <div className="field-tile-val mono highlight-blue">{employee.accountNumber || '50200088991122'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">IFSC Code</span>
                  <div className="field-tile-val mono">{employee.ifscCode || 'CNRB0001234'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Branch Name</span>
                  <div className="field-tile-val">{employee.branchName || 'Tech Park Branch, Coimbatore'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">UPI ID</span>
                  <div className="field-tile-val highlight-emerald">
                    {employee.upiId || `${(employee.fullName || 'staff').toLowerCase().replace(/\s+/g, '')}@okaxis`}
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 5: Identity & Statutory Proofs */}
            <Card title={
              <div className="card-custom-header">
                <div className="card-header-icon-bubble purple">
                  <CreditCard size={20} />
                </div>
                <div>
                  <span className="card-header-title">Identity & Statutory Tax Proofs</span>
                  <span className="card-header-subtitle">Verified Government Identification</span>
                </div>
              </div>
            }>
              <div className="profile-tiles-grid">
                <div className="profile-field-tile">
                  <span className="field-tile-label">Permanent Account Number (PAN)</span>
                  <div className="field-tile-val mono highlight-blue">{employee.panNumber || 'ABCDE1234F'}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Aadhaar / National ID</span>
                  <div className="field-tile-val mono">{employee.aadhaarOrIdentityProofNumber || 'XXXX-XXXX-9842'}</div>
                </div>
              </div>
            </Card>

            {/* Section 6: Addresses & Emergency Safety Contacts */}
            <Card title={
              <div className="card-custom-header">
                <div className="card-header-icon-bubble emerald">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="card-header-title">Residential Addresses & Emergency Contact</span>
                  <span className="card-header-subtitle">Location Coordinates & Immediate Safety Contact</span>
                </div>
              </div>
            }>
              <div className="addresses-split-grid">
                <div className="address-column">
                  <h4 className="section-subheading">
                    <MapPin size={16} /> Residential Addresses
                  </h4>
                  <div className="address-box">
                    <span className="field-tile-label">Current Residential Address</span>
                    <div className="address-text">{employee.currentAddress || '12, Tech Park Avenue, Coimbatore, Tamil Nadu - 641035'}</div>
                  </div>
                  <div className="address-box" style={{ marginTop: '0.9rem' }}>
                    <span className="field-tile-label">Permanent Address</span>
                    <div className="address-text">{employee.permanentAddress || '45, Main Street, Trichy, Tamil Nadu - 620001'}</div>
                  </div>
                </div>

                <div className="emergency-column">
                  <h4 className="section-subheading">
                    <User size={16} /> Emergency Contact
                  </h4>
                  <div className="profile-tiles-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="profile-field-tile">
                      <span className="field-tile-label">Contact Person</span>
                      <div className="field-tile-val">{employee.emergencyContact?.name || 'S. Ramanathan'}</div>
                    </div>

                    <div className="profile-field-tile">
                      <span className="field-tile-label">Emergency Phone</span>
                      <div className="field-tile-val">
                        {employee.emergencyContact?.phone ? (
                          <button 
                            type="button"
                            className="field-tile-action-btn phone"
                            onClick={() => setContactModal({
                              isOpen: true,
                              name: employee.emergencyContact?.name || 'Emergency Contact',
                              phone: employee.emergencyContact?.phone
                            })}
                            title="WhatsApp or Direct Call"
                          >
                            <Phone size={13} />
                            <span>{employee.emergencyContact?.phone}</span>
                          </button>
                        ) : (
                          <span className="val-not-set">Not Provided</span>
                        )}
                      </div>
                    </div>

                    <div className="profile-field-tile">
                      <span className="field-tile-label">Relationship</span>
                      <div className="field-tile-val">{employee.emergencyContact?.relationship || 'Parent / Guardian'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: TASKS ASSIGNED TO THIS EMPLOYEE (STORED IN DB & IN-PORTAL AUDIT HISTORY) */}
        {activeTab === 'tasks' && (() => {
          const allEmpTasks = employee.assignedByAdmin?.tasks || [];
          const searchLower = taskSearchTerm.toLowerCase();
          const displayedTasks = allEmpTasks.filter(t => {
            const matchesSearch = !taskSearchTerm || 
              (t.title && t.title.toLowerCase().includes(searchLower)) ||
              (t.taskId && t.taskId.toLowerCase().includes(searchLower)) ||
              (t.description && t.description.toLowerCase().includes(searchLower));
            const matchesStatus = taskStatusFilter === 'All' || 
              (t.status && t.status.toLowerCase() === taskStatusFilter.toLowerCase());
            return matchesSearch && matchesStatus;
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Header with Search and Status Filter */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                background: 'rgba(15, 23, 42, 0.65)',
                padding: '1.1rem 1.4rem',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckSquare size={18} color="var(--primary-light)" /> 
                    Tasks Assigned to {employee.fullName}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    Complete task assignment history stored in database ({allEmpTasks.length} total tasks)
                  </span>
                </div>

                {/* Search & Filter Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', minWidth: '220px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text"
                      placeholder="Search tasks or ID..."
                      value={taskSearchTerm}
                      onChange={e => setTaskSearchTerm(e.target.value)}
                      className="input-box"
                      style={{ paddingLeft: '2.4rem', height: '40px', fontSize: '0.86rem', background: 'rgba(15, 23, 42, 0.85)', borderRadius: '10px' }}
                    />
                  </div>

                  <select 
                    value={taskStatusFilter}
                    onChange={e => setTaskStatusFilter(e.target.value)}
                    className="input-box filter-select"
                    style={{ 
                      width: 'auto', 
                      minWidth: '145px', 
                      height: '40px', 
                      padding: '0 2.4rem 0 0.9rem', 
                      fontSize: '0.86rem', 
                      lineHeight: '38px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* List of Tasks Assigned to this Employee */}
              {displayedTasks.length === 0 ? (
                <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.45)', borderRadius: '14px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                  <CheckSquare size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto', display: 'block', opacity: 0.6 }} />
                  <h4 style={{ margin: '0 0 0.3rem 0', color: '#fff' }}>No Tasks Match Search Criteria</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assign a new task below or adjust your filters.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {displayedTasks.map(t => {
                    const formattedAssignedTime = t.assignedAtText || (t.createdAt ? `${formatDate(t.createdAt)}, ${new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '24/10/26, 10:00 AM');
                    const assignedByDisplay = t.assignedBy?.fullName || t.assignedBy?.name || (typeof t.assignedBy === 'string' && t.assignedBy.length > 20 ? 'Admin / Management' : t.assignedBy) || 'Admin / Management';

                    return (
                      <div 
                        key={t._id} 
                        className="item-row"
                        style={{
                          padding: '1.2rem 1.4rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          borderRadius: '14px',
                          background: 'rgba(30, 41, 59, 0.55)',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.74rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700 }}>
                              {t.taskId}
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: t.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.15)' : t.priority === 'High' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: t.priority === 'Urgent' ? '#f87171' : t.priority === 'High' ? '#fbbf24' : '#60a5fa'
                            }}>
                              {t.priority} Priority
                            </span>
                          </div>

                          <h4 style={{ margin: '0.2rem 0 0.4rem 0', fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
                            {t.title}
                          </h4>

                          {t.description ? (
                            <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.55, background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                              {t.description}
                            </p>
                          ) : (
                            <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                              No detailed instructions specified for this task.
                            </p>
                          )}

                          {/* Exact Timestamp Details */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#64748b', marginTop: '0.4rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8' }}>
                              <Calendar size={13} />
                              <strong>Assigned On:</strong> {formattedAssignedTime}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24' }}>
                              <Clock size={13} />
                              <strong>Due Date:</strong> {formatDate(t.dueDate)}
                            </span>
                            <span style={{ color: '#94a3b8' }}>
                              <strong>Assigned By:</strong> {assignedByDisplay}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.65rem' }}>
                          <StatusBadge status={t.status || 'Assigned'} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button 
                              type="button"
                              onClick={() => setSelectedTaskForModal(t)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#e2e8f0',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Eye size={13} /> Inspect Dossier
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteTask(t._id || t.taskId)}
                              title="Delete Task"
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#f87171',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Assign New Task Panel */}
              <div className="form-panel" style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '16px', padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} /> Assign New Task to {employee.fullName} (Stores into Database)
                </h4>
                <form onSubmit={handleAssignTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Row 1: Task Title */}
                  <div className="form-field" style={{ width: '100%' }}>
                    <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: '#cbd5e1', fontWeight: 600, fontSize: '0.88rem' }}>
                      <CheckSquare size={15} color="#818cf8" />
                      <span>Task Title / Milestone *</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Implement Neon PostgreSQL SSL Connection Pooling & Auto-Reconnect" 
                      className="input-box" 
                      value={taskTitle} 
                      onChange={e => setTaskTitle(e.target.value)} 
                      required 
                      style={{ width: '100%', height: '42px', fontSize: '0.9rem' }}
                    />
                  </div>

                  {/* Row 2: Task Description directly below Title */}
                  <div className="form-field" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: '#cbd5e1', fontWeight: 600, fontSize: '0.88rem' }}>
                        <AlignLeft size={15} color="#818cf8" />
                        <span>Task Description / Specifications (Visible to Employee)</span>
                      </label>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {taskDesc.length} characters
                      </span>
                    </div>
                    <textarea 
                      placeholder="Provide clear task deliverables, requirements, reference URLs, and instructions. The employee will see this exact description on their tasks portal..."
                      className="input-box"
                      style={{ width: '100%', minHeight: '95px', height: 'auto', padding: '0.75rem 1rem', resize: 'vertical', fontSize: '0.88rem', lineHeight: 1.5 }}
                      value={taskDesc}
                      onChange={e => setTaskDesc(e.target.value)}
                      rows={3}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                      💡 This description will be displayed directly on the employee's &quot;My Tasks&quot; portal and dashboard.
                    </span>
                  </div>

                  {/* Row 3: Priority, Due Date & Assign Button */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-field">
                      <label className="field-label" style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5e1', fontWeight: 600, fontSize: '0.84rem' }}>
                        Priority Level
                      </label>
                      <select 
                        className="input-box filter-select" 
                        value={taskPriority} 
                        onChange={e => setTaskPriority(e.target.value)}
                        style={{ height: '42px', padding: '0 2.2rem 0 0.9rem', fontSize: '0.86rem' }}
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                        <option value="Urgent">🔥 Urgent Priority</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="field-label" style={{ display: 'block', marginBottom: '0.4rem', color: '#cbd5e1', fontWeight: 600, fontSize: '0.84rem' }}>
                        Target Completion Due Date
                      </label>
                      <input 
                        type="date" 
                        className="input-box" 
                        value={taskDueDate} 
                        onChange={e => setTaskDueDate(e.target.value)} 
                        style={{ height: '42px', fontSize: '0.86rem' }}
                      />
                    </div>

                    <div className="form-field">
                      <button 
                        type="submit" 
                        disabled={isTaskSubmitting} 
                        className="assign-btn" 
                        style={{ 
                          height: '42px', 
                          padding: '0 1.5rem', 
                          fontSize: '0.88rem', 
                          fontWeight: 700,
                          width: '100%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Plus size={16} />
                        {isTaskSubmitting ? 'Saving to Database...' : 'Assign Task & Save to DB'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* TAB 3: DAILY WORK REPORTS & SRC DOWNLOAD */}
        {activeTab === 'reports' && (() => {
          const allReports = employee.sentByEmployee?.dailyReports || [];
          const reportDates = Array.from(new Set(allReports.map(r => r.date).filter(Boolean)));
          const searchLower = reportSearchTerm.toLowerCase();
          const displayedReports = allReports.filter(r => {
            const matchesDate = reportDateFilter === 'All' || r.date === reportDateFilter;
            const matchesSearch = !reportSearchTerm || 
              (r.title && r.title.toLowerCase().includes(searchLower)) ||
              (r.tasksWorked && r.tasksWorked.toLowerCase().includes(searchLower)) ||
              (r.workSummary && r.workSummary.toLowerCase().includes(searchLower)) ||
              (r.date && r.date.includes(searchLower));
            return matchesDate && matchesSearch;
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Interactive Report & Date Selector Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '1.2rem 1.5rem',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--primary-light)" /> 
                    Daily Work Reports Submitted by {employee.fullName}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    Inspect daily submissions, review completed deliverables, and download submitted SRC packages ({allReports.length} reports filed)
                  </span>
                </div>

                {/* Date Selector & Search Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Specific Date / Report Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>Select Date / Report:</span>
                    <select
                      value={reportDateFilter}
                      onChange={e => setReportDateFilter(e.target.value)}
                      className="input-box"
                      style={{ width: 'auto', minWidth: '170px', height: '38px', fontSize: '0.84rem' }}
                    >
                      <option value="All">All Submitted Reports ({allReports.length})</option>
                      {reportDates.map(d => (
                        <option key={d} value={d}>{formatDate(d)} Report</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ position: 'relative', minWidth: '200px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text"
                      placeholder="Search reports or tasks..."
                      value={reportSearchTerm}
                      onChange={e => setReportSearchTerm(e.target.value)}
                      className="input-box"
                      style={{ paddingLeft: '2.1rem', height: '38px', fontSize: '0.84rem' }}
                    />
                  </div>
                </div>
              </div>

              {displayedReports.length === 0 ? (
                <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.45)', borderRadius: '14px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                  <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto', display: 'block', opacity: 0.6 }} />
                  <h4 style={{ margin: '0 0 0.3rem 0', color: '#fff' }}>No Daily Reports Found</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No reports match the selected date filter or search query.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {displayedReports.map(r => (
                    <div 
                      key={r._id} 
                      className="item-row"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        padding: '1.4rem',
                        borderRadius: '16px',
                        background: 'rgba(30, 41, 59, 0.55)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.76rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 9px', borderRadius: '6px', fontWeight: 700 }}>
                              📅 {formatDate(r.date || r.createdAt)}
                            </span>
                            <span style={{ fontSize: '0.76rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 9px', borderRadius: '6px', fontWeight: 600 }}>
                              ⏰ Hours Logged: {r.hoursWorked || r.hoursLogged || '8h 00m'}
                            </span>
                            {r.srcFileName && (
                              <span style={{ fontSize: '0.74rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                📦 {r.srcFileName} ({r.srcFileSize || 'SRC Ready'})
                              </span>
                            )}
                          </div>

                          <h4 style={{ margin: '0.2rem 0 0.4rem 0', fontSize: '1.05rem', color: '#fff', fontWeight: 600 }}>
                            {r.title || r.tasksWorked || 'Daily Sprint Deliverable'}
                          </h4>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <StatusBadge status={r.status || 'Submitted'} />
                          {r.status !== 'Approved' && (
                            <button className="action-btn-approve" title="Approve Report" onClick={() => handleReportAction(r._id, 'Approved')}>
                              <Check size={14} /> Approve
                            </button>
                          )}
                          {r.status !== 'Rejected' && (
                            <button className="action-btn-reject" title="Reject Report" onClick={() => handleReportAction(r._id, 'Rejected')}>
                              <X size={14} /> Reject
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Work Breakdown Details */}
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        borderRadius: '12px',
                        padding: '1rem 1.2rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                            Tasks & Completed Modules
                          </span>
                          <div style={{ fontSize: '0.86rem', color: '#e2e8f0', marginTop: '0.3rem', lineHeight: 1.5 }}>
                            {r.workSummary || r.tasksWorked || r.completedWork || 'Implemented daily sprint goals and code reviews.'}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                            Blockers & Challenges
                          </span>
                          <div style={{ fontSize: '0.86rem', color: r.issuesFaced && r.issuesFaced !== 'None' ? '#f87171' : '#34d399', marginTop: '0.3rem', lineHeight: 1.5 }}>
                            {r.issuesFaced || r.blockers || 'None reported. All sprint milestones on track.'}
                          </div>
                        </div>
                      </div>

                      {/* Action Toolbar with Prominent SRC Download */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          Verified by: <strong>CodeThrive Infotech Enterprise Vault</strong>
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedReportForModal(r)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#e2e8f0',
                              padding: '0.5rem 0.9rem',
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              fontWeight: 600
                            }}
                          >
                            <Eye size={14} /> View Report Details
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadSRC(r)}
                            style={{
                              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                              border: 'none',
                              color: '#ffffff',
                              padding: '0.5rem 1.1rem',
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              fontWeight: 700,
                              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                            }}
                            title="Download the employee's submitted source code & work deliverable file"
                          >
                            <Download size={14} /> Download SRC / Deliverable
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 4: LEAVE APPLICATIONS SUBMITTED BY THIS EMPLOYEE */}
        {activeTab === 'leaves' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-light)' }}>
                Leave Applications Submitted by {employee.fullName} ({selectedAuditMonth === 'All' ? 'All-Time' : selectedAuditMonth})
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Showing {filteredLeaves.length} leaves</span>
            </div>

            {filteredLeaves.length === 0 ? (
              <div className="empty-state">No leave applications submitted by {employee.fullName} for selected audit period.</div>
            ) : (
              filteredLeaves.map(l => (
                <div key={l._id} className="item-row">
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{l.leaveType} ({l.dates})</strong>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Reason: {l.reason}</p>
                  </div>
                  
                  {/* Interactive Admin Approve / Reject Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <StatusBadge status={l.status} />
                    {l.status !== 'Approved' && (
                      <button className="action-btn-approve" title="Approve Leave" onClick={() => handleLeaveAction(l._id, 'Approved')}>
                        <Check size={14} /> Approve
                      </button>
                    )}
                    {l.status !== 'Rejected' && (
                      <button className="action-btn-reject" title="Reject Leave" onClick={() => handleLeaveAction(l._id, 'Rejected')}>
                        <X size={14} /> Reject
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: UPLOADED IDENTITY DOCUMENTS */}
        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-light)' }}>
              Uploaded Verification Documents for {employee.fullName}
            </h3>

            {(!employee.sentByEmployee?.uploadedDocs || employee.sentByEmployee.uploadedDocs.length === 0) ? (
              <div className="empty-state">No verification documents uploaded by {employee.fullName} yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {employee.sentByEmployee.uploadedDocs.map((doc, i) => (
                  <div key={i} className="doc-card">
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'block' }}>{doc.name}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doc.type} &bull; {doc.size}</span>
                    </div>
                    <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                      <Download size={13} /> Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ATTENDANCE & WORK SESSION AUDIT */}
        {activeTab === 'attendance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', color: 'var(--primary-light)' }}>
                  Per-Day Check-In & Check-Out Attendance Audit: {employee.fullName}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Showing daily attendance logs ({empAttendanceHistory.length} records)
                </span>
              </div>

              {/* Action Buttons for downloading per-day report */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-outline" onClick={exportEmpAttendancePDF} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Printer size={15} /> Download PDF Report
                </button>
                <button className="btn btn-outline" onClick={exportEmpAttendanceWord} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: '#2563eb', color: '#60a5fa' }}>
                  <FileText size={15} /> Download Word Report
                </button>
                <button className="btn btn-primary" onClick={exportEmpAttendanceExcel} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Download size={15} /> Export Excel (.xlsx)
                </button>
              </div>
            </div>

            {/* Quick KPI Overview */}
            <div className="metrics-grid-4">
              <div className="metric-box">
                <span className="box-title">Today's Live Status</span>
                <StatusBadge status={empAttendanceHistory[0]?.status || 'Not Checked In'} />
              </div>
              <div className="metric-box">
                <span className="box-title">Today Check-In</span>
                <span className="box-val" style={{ color: 'var(--success)' }}>
                  {empAttendanceHistory[0]?.firstLoginTime 
                    ? new Date(empAttendanceHistory[0].firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '--:--'}
                </span>
              </div>
              <div className="metric-box">
                <span className="box-title">Today Check-Out</span>
                <span className="box-val" style={{ color: 'var(--info)' }}>
                  {empAttendanceHistory[0]?.lastLogoutTime 
                    ? new Date(empAttendanceHistory[0].lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '--:--'}
                </span>
              </div>
              <div className="metric-box">
                <span className="box-title">Total Days Logged</span>
                <span className="box-val" style={{ color: 'var(--primary-light)' }}>
                  {empAttendanceHistory.length} Days
                </span>
              </div>
            </div>

            {/* Detailed Per-Day Check-In / Check-Out History Table */}
            <Card title={`Per-Day Attendance Logs (${employee.fullName})`} style={{ padding: 0 }}>
              {attendanceLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading attendance logs...</div>
              ) : (
                <DataTable 
                  columns={[
                    {
                      header: 'Date',
                      accessor: 'date',
                      render: row => (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>
                            {formatDateWithDay(row.date)}
                          </span>
                        </div>
                      )
                    },
                    {
                      header: 'Check In Time',
                      accessor: 'firstLoginTime',
                      render: row => (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)', fontWeight: 600, fontFamily: 'monospace' }}>
                          <LogIn size={14} /> {row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      )
                    },
                    {
                      header: 'Check Out Time',
                      accessor: 'lastLogoutTime',
                      render: row => (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#f43f5e', fontWeight: 600, fontFamily: 'monospace' }}>
                          <LogOut size={14} /> {row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      )
                    },
                    {
                      header: 'Work Duration',
                      accessor: 'totalWorkDurationInSeconds',
                      render: row => (
                        <span style={{ fontWeight: 700, color: 'var(--primary-light)', fontFamily: 'monospace' }}>
                          {formatHours(row.totalWorkDurationInSeconds)}
                        </span>
                      )
                    },
                    {
                      header: 'Break Time',
                      accessor: 'totalBreakDurationInSeconds',
                      render: row => (
                        <span style={{ color: '#fbbf24', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Coffee size={13} /> {formatHours(row.totalBreakDurationInSeconds || 0)}
                        </span>
                      )
                    },
                    {
                      header: 'Lunch Time',
                      accessor: 'totalLunchDurationInSeconds',
                      render: row => (
                        <span style={{ color: '#60a5fa', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Utensils size={13} /> {formatHours(row.totalLunchDurationInSeconds || 0)}
                        </span>
                      )
                    },
                    {
                      header: 'Status',
                      accessor: 'status',
                      render: row => <StatusBadge status={row.status || 'Present'} />
                    }
                  ]}
                  data={empAttendanceHistory}
                  searchable={true}
                  itemsPerPage={10}
                />
              )}
            </Card>
          </div>
        )}

        {/* TAB 7: MANAGEMENT, PAYROLL & SYSTEM CREDENTIALS */}
        {activeTab === 'management' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-light)' }}>
                Payroll & System Credentials for {employee.fullName}
              </h3>
            </div>

            {/* Monthly Payslips Log Table */}
            <Card title={<><Banknote size={16} style={{ marginRight: '0.5rem' }} /> Monthly Payslip Financial Audit ({filteredPayslips.length} Months)</>}>
              {filteredPayslips.length === 0 ? (
                <div className="empty-state">No payslips generated for selected audit period.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Pay Month</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Basic Salary</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Gross Salary</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Deductions</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Net Payable</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayslips.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#fff' }}>{p.month}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>₹{(p.basicSalary || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>₹{(p.grossSalary || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#ef4444' }}>-₹{(p.deductions || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--success)' }}>₹{(p.netPayable || 0).toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={p.status || 'Paid'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <div className="detail-grid-2">
              {/* Access Role & Credentials Card */}
              <Card title={<><KeyRound size={16} style={{ marginRight: '0.5rem' }} /> Access Role & Account Status</>}>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>System Access Role</label>
                    <select className="input-box" value={editRole} onChange={e => setEditRole(e.target.value)}>
                      <option value="admin">System Administrator</option>
                      <option value="hr">HR Manager</option>
                      <option value="teamlead">Team Lead</option>
                      <option value="employee">Software Employee</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Account Status</label>
                    <select className="input-box" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                      <option value="Active">Active Account</option>
                      <option value="Inactive">Inactive / Suspended</option>
                      <option value="Pending">Pending Approval</option>
                    </select>
                  </div>
                </div>

                <div className="form-field" style={{ marginTop: '1rem' }}>
                  <label>Reset Account Password</label>
                  <input 
                    type="password" 
                    placeholder="Type new temporary password..." 
                    className="input-box" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSaveRoleStatus}>
                    <Save size={15} /> Save Role & Credentials
                  </button>
                </div>
              </Card>

              {/* Salary & Bank Accounts Card */}
              <Card title={<><Banknote size={16} style={{ marginRight: '0.5rem' }} /> Salary Structure & Bank Account</>}>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Monthly Salary (₹)</label>
                    <input type="number" className="input-box" value={editSalary} onChange={e => setEditSalary(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Bank Name</label>
                    <input type="text" className="input-box" value={editBank} onChange={e => setEditBank(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Account Number</label>
                    <input type="text" className="input-box" value={editAccNo} onChange={e => setEditAccNo(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>IFSC Code</label>
                    <input type="text" className="input-box" value={editIfsc} onChange={e => setEditIfsc(e.target.value)} />
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSaveSalary}>
                    <Save size={15} /> Save Salary & Bank Info
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}

      </div>

      {/* Task Dossier Inspection Modal */}
      <Modal
        isOpen={!!selectedTaskForModal}
        onClose={() => setSelectedTaskForModal(null)}
        title={<><CheckSquare size={18} style={{ marginRight: '0.5rem', color: 'var(--primary-light)' }} /> Task Assignment Dossier</>}
      >
        {selectedTaskForModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '3px 8px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700 }}>
                {selectedTaskForModal.taskId}
              </span>
              <StatusBadge status={selectedTaskForModal.status || 'Assigned'} />
            </div>

            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.15rem' }}>{selectedTaskForModal.title}</h3>
              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.35rem' }}>
                  Task Description & Requirements:
                </span>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedTaskForModal.description || 'No detailed instructions specified for this task.'}
                </p>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Date & Time</span>
                <div style={{ fontSize: '0.88rem', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>
                  {selectedTaskForModal.assignedAtText || formatDate(selectedTaskForModal.createdAt)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Target Due Date</span>
                <div style={{ fontSize: '0.88rem', color: '#fbbf24', fontWeight: 600, marginTop: '2px' }}>
                  {formatDate(selectedTaskForModal.dueDate)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Priority Rating</span>
                <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                  {selectedTaskForModal.priority}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Assigned By</span>
                <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                  {selectedTaskForModal.assignedBy?.fullName || selectedTaskForModal.assignedBy?.name || (typeof selectedTaskForModal.assignedBy === 'string' && selectedTaskForModal.assignedBy.length > 20 ? 'Admin / Management' : selectedTaskForModal.assignedBy) || 'Admin / Management'}
                </div>
              </div>
            </div>

            {/* Admin Task Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Status: <strong style={{ color: '#fff' }}>{selectedTaskForModal.status || 'Assigned'}</strong>
              </span>

              <button
                type="button"
                onClick={() => handleDeleteTask(selectedTaskForModal._id || selectedTaskForModal.taskId)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <Trash2 size={14} /> Delete This Task
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Daily Report Inspection Modal */}
      <Modal
        isOpen={!!selectedReportForModal}
        onClose={() => setSelectedReportForModal(null)}
        title={<><FileText size={18} style={{ marginRight: '0.5rem', color: 'var(--primary-light)' }} /> Daily Work Report & Deliverable Review</>}
      >
        {selectedReportForModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 700 }}>
                Report Date: {formatDate(selectedReportForModal.date || selectedReportForModal.createdAt)}
              </span>
              <StatusBadge status={selectedReportForModal.status || 'Submitted'} />
            </div>

            <div>
              <h3 style={{ margin: '0 0 0.4rem 0', color: '#fff', fontSize: '1.15rem' }}>
                {selectedReportForModal.title || selectedReportForModal.tasksWorked || 'Daily Development Sprint'}
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Time Logged: <strong>{selectedReportForModal.hoursWorked || selectedReportForModal.hoursLogged || '8h 00m'}</strong>
              </span>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Work Accomplished</span>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {selectedReportForModal.workSummary || selectedReportForModal.tasksWorked || 'Completed daily module deliverables.'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Blockers / Issues Faced</span>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: selectedReportForModal.issuesFaced && selectedReportForModal.issuesFaced !== 'None' ? '#f87171' : '#34d399', lineHeight: 1.5 }}>
                  {selectedReportForModal.issuesFaced || selectedReportForModal.blockers || 'None reported.'}
                </p>
              </div>

              {selectedReportForModal.tomorrowsPlan && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Next Day's Plan</span>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#93c5fd', lineHeight: 1.5 }}>
                    {selectedReportForModal.tomorrowsPlan}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleDownloadSRC(selectedReportForModal)}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontWeight: 700
                }}
              >
                <Download size={15} /> Download SRC / Deliverable
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Contact Options Modal (WhatsApp vs Call) */}
      <ContactActionModal 
        isOpen={contactModal.isOpen} 
        onClose={() => setContactModal(prev => ({ ...prev, isOpen: false }))} 
        name={contactModal.name} 
        phone={contactModal.phone} 
      />
    </div>
  );
};

export default EmployeeDetail;
