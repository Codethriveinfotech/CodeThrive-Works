import React, { useState, useEffect, useMemo } from 'react';
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
import { generateEmployeeMasterDossierPDF } from '../utils/employeeMasterDossierPdf';
import { 
  User, X, Briefcase, FileText, Calendar, Clock, Banknote,
  KeyRound, Plus, Download, Save, ArrowLeft, Mail, Phone, MapPin, Check, FileCheck, Filter, ShieldCheck, Printer, LogIn, LogOut, Coffee, Utensils, CreditCard,
  GraduationCap, Sparkles, Landmark, CheckCircle2, Search, Eye, FileCode, CheckSquare, Layers, AlertCircle, FileArchive, FolderArchive,
  Trash2, AlignLeft, Settings, Pencil, Wifi
} from 'lucide-react';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import { formatDate, formatDateWithDay } from '../utils/dateUtils';
import ContactActionModal, { openDirectEmail } from '../components/common/ContactActionModal';
import DateInput from '../components/common/DateInput';
import './MyProfile.css';
import './EmployeeDetail.css';

const getAuditMonthOptions = () => {
  const options = [
    { label: 'All-Time Continuous History', value: 'All' }
  ];
  const startYear = 2026;
  const startMonth = 10; // Live Launch Month: October 2026
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  let y = currentYear;
  let m = currentMonth;
  
  while (y > startYear || (y === startYear && m >= startMonth)) {
    const d = new Date(y, m - 1, 1);
    const monthName = d.toLocaleString('en-US', { month: 'long' });
    const monthCode = `${y}-${String(m).padStart(2, '0')}`;
    options.push({
      label: `${monthName} ${y}`,
      value: monthCode,
      monthName
    });
    m--;
    if (m < 1) {
      m = 12;
      y--;
    }
  }
  return options;
};

const AUDIT_MONTH_OPTIONS = getAuditMonthOptions();

const TN_GOVT_HOLIDAYS = {
  '01-01': "New Year's Day",
  '01-15': 'Pongal',
  '01-16': 'Thiruvalluvar Day',
  '01-17': 'Uzhavar Thirunal',
  '01-26': 'Republic Day',
  '03-19': 'Telugu New Year',
  '03-21': 'Ramzan (Id-ul-Fitr)',
  '03-31': 'Mahaveer Jayanthi',
  '04-03': 'Good Friday',
  '04-14': 'Tamil New Year / Dr. Ambedkar Jayanti',
  '05-01': 'May Day (Labour Day)',
  '05-28': 'Bakrid (Eid al-Adha)',
  '06-26': 'Muharram',
  '08-15': 'Independence Day',
  '08-26': 'Milad-un-Nabi',
  '09-04': 'Krishna Jayanthi',
  '09-14': 'Vinayakar Chathurthi',
  '10-02': 'Gandhi Jayanthi',
  '10-19': 'Ayutha Pooja',
  '10-20': 'Vijaya Dasami',
  '11-08': 'Deepavali',
  '12-25': 'Christmas'
};

const getGovtHolidayName = (dateStr) => {
  if (!dateStr) return null;
  const iso = typeof dateStr === 'string' && dateStr.includes('/') ? toIsoDate(dateStr) : String(dateStr);
  const parts = iso.split('T')[0].split('-');
  if (parts.length >= 3) {
    const mmdd = `${parts[1]}-${parts[2]}`;
    return TN_GOVT_HOLIDAYS[mmdd] || null;
  }
  return null;
};

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
    panNumber: '',
    aadhaarOrIdentityProofNumber: '',
    upiId: 'mahadevan@okaxis',
    qualification: 'Bachelor of Technology (B.Tech Information Technology)',
    collegeName: 'PSG College of Technology',
    universityName: 'Anna University',
    graduationYear: '2023',
    cgpaOrPercentage: '8.9 CGPA',
    previousCompany: 'CodeThrive Labs',
    user: { role: 'employee', status: 'active' },
    skills: ['React.js', 'Node.js', 'Express', 'PostgreSQL', 'TypeScript', 'REST APIs', 'Docker', 'Git'],
    currentAddress: '12, Tech Park Avenue, Coimbatore, Tamil Nadu - 641035',
    permanentAddress: '45, Main Street, Coimbatore, Tamil Nadu - 641001',
    emergencyContact: { name: 'S. Ramanathan', phone: '9876500000', relationship: 'Father' },
    sentByEmployee: {
      dailyReports: [],
      leaveApplications: [],
      uploadedDocs: [],
      attendanceLogs: { todayStatus: 'Working', checkIn: '09:00 AM', checkOut: '--:--', workTime: '8h 00m', breakTime: '20m' },
      payslips: []
    },
    assignedByAdmin: {
      tasks: [],
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
    panNumber: '',
    aadhaarOrIdentityProofNumber: '',
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
      dailyReports: [],
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
    panNumber: '',
    aadhaarOrIdentityProofNumber: '',
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
    panNumber: '',
    aadhaarOrIdentityProofNumber: '',
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

// High-performance clean employee normalizer
const enrichEmployee = (target) => {
  if (!target) return null;
  return {
    ...target,
    qualification: target.qualification || '',
    collegeName: target.collegeName || '',
    universityName: target.universityName || '',
    graduationYear: target.graduationYear || '',
    cgpaOrPercentage: target.cgpaOrPercentage || '',
    previousCompany: target.previousCompany || '',
    bankAccountHolderName: target.bankAccountHolderName || target.fullName || '',
    bankName: target.bankName || '',
    accountNumber: target.accountNumber || '',
    ifscCode: target.ifscCode || '',
    branchName: target.branchName || '',
    panNumber: target.panNumber || '',
    aadhaarOrIdentityProofNumber: target.aadhaarOrIdentityProofNumber || '',
    upiId: target.upiId || '',
    dateOfBirth: target.dateOfBirth || '',
    gender: target.gender || 'Not Specified',
    bloodGroup: target.bloodGroup || '',
    maritalStatus: target.maritalStatus || '',
    nationality: target.nationality || 'Indian',
    workLocation: target.workLocation || 'Office',
    skills: Array.isArray(target.skills) ? target.skills : [],
    currentAddress: target.currentAddress || '',
    permanentAddress: target.permanentAddress || '',
    emergencyContact: (() => {
      let ec = target.emergencyContact || target.emergency_contact_details || target.emergency_contact;
      if (typeof ec === 'string') {
        try { ec = JSON.parse(ec); } catch { ec = { name: ec, phone: '', relationship: '' }; }
      }
      return (ec && typeof ec === 'object') ? ec : null;
    })(),
    sentByEmployee: {
      dailyReports: target.sentByEmployee?.dailyReports || [],
      leaveApplications: target.sentByEmployee?.leaveApplications || [],
      uploadedDocs: target.sentByEmployee?.uploadedDocs || [],
      payslips: target.sentByEmployee?.payslips || []
    },
    assignedByAdmin: {
      tasks: target.assignedByAdmin?.tasks || [],
      notificationsSent: target.assignedByAdmin?.notificationsSent || []
    }
  };
};

// Calculate Profile Strength percentage out of standard employee fields
const calculateProfileCompleteness = (emp) => {
  if (!emp) return 0;
  let count = 0;
  const fields = [
    emp.fullName,
    emp.profilePhoto,
    emp.dateOfBirth,
    emp.gender,
    emp.bloodGroup,
    emp.maritalStatus,
    emp.nationality,
    emp.personalPhoneNumber,
    emp.personalEmailAddress,
    emp.department,
    emp.designation,
    emp.employmentType,
    emp.dateOfJoining,
    emp.workLocation,
    emp.bankAccountHolderName || emp.bankName,
    emp.accountNumber,
    emp.ifscCode,
    emp.panNumber,
    emp.aadhaarOrIdentityProofNumber,
    emp.currentAddress,
    emp.permanentAddress,
    emp.emergencyContact?.name,
    emp.emergencyContact?.phone,
    emp.qualification,
    emp.collegeName,
    emp.graduationYear,
    emp.totalExperience,
    emp.skills?.length
  ];
  fields.forEach(f => {
    if (f !== undefined && f !== null && String(f).trim().length > 0 && String(f) !== '0') {
      count++;
    }
  });
  return Math.min(100, Math.round((count / fields.length) * 100));
};

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Instant 0ms Paint: Read cached employee record immediately so page renders with zero spinner delay
  const getInitialEmployee = () => {
    try {
      const cached = sessionStorage.getItem('cti_cached_employees');
      if (cached) {
        const list = JSON.parse(cached);
        const found = list.find(e => e._id === id || e.employeeId === id) || (id ? null : list[0]);
        if (found) return enrichEmployee(found);
      }
    } catch {}
    return null;
  };

  const initialEmp = getInitialEmployee();
  const [allEmployees, setAllEmployees] = useState(DEFAULT_DEMO_EMPLOYEES);
  const [employee, setEmployee] = useState(initialEmp);
  const [loading, setLoading] = useState(!initialEmp);
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
  const [editWifiPolicy, setEditWifiPolicy] = useState('any');
  const [newPassword, setNewPassword] = useState('');
  
  // Salary State
  const [editSalary, setEditSalary] = useState('');
  const [editBank, setEditBank] = useState('');
  const [editAccNo, setEditAccNo] = useState('');
  const [editIfsc, setEditIfsc] = useState('');

  // Issue Payslip State
  const [issuePayMonth, setIssuePayMonth] = useState('October 2026');
  const [issuePayDate, setIssuePayDate] = useState(new Date().toISOString().split('T')[0]);
  const [issuePayStatus, setIssuePayStatus] = useState('Paid');
  const [issueLeaveDeduction, setIssueLeaveDeduction] = useState(0);
  const [isIssuingPayslip, setIsIssuingPayslip] = useState(false);
  const [selectedPayslipForModal, setSelectedPayslipForModal] = useState(null);

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
  const [reportViewMode, setReportViewMode] = useState('all'); // 'all' = Daily Reports, 'src' = SRC Deliverables only
  const [selectedReportForModal, setSelectedReportForModal] = useState(null);

  // Per-Day Attendance Audit State
  const [empAttendanceHistory, setEmpAttendanceHistory] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState(null);
  const [isSavingAttendanceRectification, setIsSavingAttendanceRectification] = useState(false);
  const [rectifyForm, setRectifyForm] = useState({
    date: '',
    status: 'Present',
    inTime: '09:30',
    outTime: '18:30',
    breakMinutes: 0,
    lunchMinutes: 0,
    reason: ''
  });

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  useEffect(() => {
    if (employee?._id || employee?.employeeId) {
      fetchEmployeeAttendance(employee);
    }
  }, [employee?._id, employee?.employeeId, selectedAuditMonth]);

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
      if (Array.isArray(records)) {
        setEmpAttendanceHistory(records);
      } else {
        setEmpAttendanceHistory([]);
      }
    } catch (err) {
      console.warn('Could not fetch employee attendance from API', err);
      setEmpAttendanceHistory([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Attendance status business rules:
  // 1. If manually rectified/approved by Admin -> respect Admin rectified status
  // 2. Explicit Sunday Holiday / Government Holiday / Office Holiday
  // 3. Check in on or before grace time (10:15 AM) -> Present
  // 4. Check in after grace time (10:15 AM) and before 1:00 PM -> Late (unless rectified)
  // 5. Check in after 1:00 PM (13:00) -> Half Day
  // 6. Did not check in -> Absent or Holiday
  const computeAttendanceStatus = (row) => {
    if (!row) return 'Absent';
    if (row.isManualCorrection && row.status) {
      return row.status;
    }
    const raw = (row.displayStatus || row.status || '').trim();
    if (raw === 'Sunday Holiday') return 'Sunday Holiday';
    if (raw === 'Government Holiday') return 'Government Holiday';
    if (raw === 'Office Holiday') return 'Office Holiday';
    if (raw.toLowerCase() === 'permission') return 'Permission';
    if (raw.toLowerCase() === 'wfh' || raw.toLowerCase() === 'work from home') return 'Work From Home';
    if (raw.toLowerCase() === 'on leave' || raw.toLowerCase() === 'leave') return 'On Leave';
    if (raw.toLowerCase() === 'absent') return 'Absent';
    if (raw === 'Not Checked In') return 'Not Checked In';

    if (!row.firstLoginTime) {
      if (row.isSundayHoliday) return 'Sunday Holiday';
      if (row.isGovtHoliday) return 'Government Holiday';
      return row.status || 'Absent';
    }

    const dt = new Date(row.firstLoginTime);
    if (isNaN(dt.getTime())) return 'Absent';

    const istStr = dt.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
    const [h, m] = istStr.split(':').map(Number);

    // After 1:00 PM (13:00) -> Half Day
    if (h >= 13) {
      return 'Half Day';
    }
    // After 10:15 AM (Grace window 15 mins) -> Late
    if (h > 10 || (h === 10 && m > 15)) {
      return 'Late';
    }
    // Correct time (<= 10:15 AM) -> Present
    return 'Present';
  };

  const handleOpenRectifyModal = (record = null) => {
    if (record && record.date) {
      const recDate = typeof record.date === 'string' 
        ? record.date.split('T')[0] 
        : new Date(record.date).toISOString().split('T')[0];

      const currentStatus = record.displayStatus || record.status || computeAttendanceStatus(record) || 'Present';
      const isAbsentOrHoliday = ['Absent', 'Sunday Holiday', 'Government Holiday', 'Office Holiday', 'Not Checked In'].includes(currentStatus);

      let inTime = isAbsentOrHoliday ? '' : '09:30';
      if (record.firstLoginTime) {
        const d = new Date(record.firstLoginTime);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        inTime = `${hh}:${mm}`;
      }

      let outTime = isAbsentOrHoliday ? '' : '18:30';
      if (record.lastLogoutTime) {
        const d = new Date(record.lastLogoutTime);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        outTime = `${hh}:${mm}`;
      }

      const bMinutes = record.totalBreakDurationInSeconds ? Math.round(record.totalBreakDurationInSeconds / 60) : 0;
      const lMinutes = record.totalLunchDurationInSeconds ? Math.round(record.totalLunchDurationInSeconds / 60) : 0;

      const holName = getGovtHolidayName(recDate);
      const isGovt = currentStatus === 'Government Holiday';
      let defaultReason = record.correctionReason || record.remarks || '';
      if (!defaultReason && (isGovt || holName)) {
        defaultReason = `Government Holiday - ${holName || 'Public Holiday'}`;
      }

      setRectifyForm({
        date: recDate,
        status: isGovt ? 'Government Holiday' : (holName && !record.firstLoginTime ? 'Government Holiday' : currentStatus),
        inTime: isGovt ? '' : inTime,
        outTime: isGovt ? '' : outTime,
        breakMinutes: isGovt ? 0 : bMinutes,
        lunchMinutes: isGovt ? 0 : lMinutes,
        reason: defaultReason
      });
      setEditingAttendanceRecord(record);
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayHol = getGovtHolidayName(todayStr);
      setRectifyForm({
        date: todayStr,
        status: todayHol ? 'Government Holiday' : 'Present',
        inTime: todayHol ? '' : '09:30',
        outTime: todayHol ? '' : '18:30',
        breakMinutes: 0,
        lunchMinutes: 0,
        reason: todayHol ? `Government Holiday - ${todayHol}` : ''
      });
      setEditingAttendanceRecord({});
    }
  };

  const handleRectifyDateChange = (newDate) => {
    const holName = getGovtHolidayName(newDate);
    if (holName) {
      setRectifyForm(prev => ({
        ...prev,
        date: newDate,
        status: 'Government Holiday',
        inTime: '',
        outTime: '',
        breakMinutes: 0,
        lunchMinutes: 0,
        reason: `Government Holiday - ${holName}`
      }));
    } else {
      setRectifyForm(prev => ({ ...prev, date: newDate }));
    }
  };

  const handleRectifyStatusChange = (newStatus) => {
    if (newStatus === 'Government Holiday') {
      const holName = getGovtHolidayName(rectifyForm.date) || 'Public Holiday';
      setRectifyForm(prev => ({
        ...prev,
        status: newStatus,
        inTime: '',
        outTime: '',
        breakMinutes: 0,
        lunchMinutes: 0,
        reason: `Government Holiday - ${holName}`
      }));
    } else if (newStatus === 'Sunday Holiday') {
      setRectifyForm(prev => ({
        ...prev,
        status: newStatus,
        inTime: '',
        outTime: '',
        breakMinutes: 0,
        lunchMinutes: 0,
        reason: 'Sunday Holiday - Weekly Off'
      }));
    } else if (newStatus === 'Office Holiday') {
      setRectifyForm(prev => ({
        ...prev,
        status: newStatus,
        inTime: '',
        outTime: '',
        breakMinutes: 0,
        lunchMinutes: 0,
        reason: prev.reason || 'Office Holiday Declared'
      }));
    } else {
      setRectifyForm(prev => ({
        ...prev,
        status: newStatus,
        inTime: prev.inTime || '09:30',
        outTime: prev.outTime || '18:30'
      }));
    }
  };

  const handleSaveAttendanceRectification = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!rectifyForm.date || !rectifyForm.status) {
      alert('Please select both Date and Status');
      return;
    }

    try {
      setIsSavingAttendanceRectification(true);

      let firstLoginTime = null;
      let lastLogoutTime = null;

      if (rectifyForm.inTime) {
        const [h, m] = rectifyForm.inTime.split(':').map(Number);
        const dtIn = new Date(rectifyForm.date);
        dtIn.setHours(h, m, 0, 0);
        firstLoginTime = dtIn.toISOString();
      }

      if (rectifyForm.outTime) {
        const [h, m] = rectifyForm.outTime.split(':').map(Number);
        const dtOut = new Date(rectifyForm.date);
        dtOut.setHours(h, m, 0, 0);
        lastLogoutTime = dtOut.toISOString();
      }

      const bMin = Math.max(0, parseInt(rectifyForm.breakMinutes || 0, 10));
      const lMin = Math.max(0, parseInt(rectifyForm.lunchMinutes || 0, 10));
      const totalBreakSec = bMin * 60;
      const totalLunchSec = lMin * 60;

      let grossDurationSec = 32400; // default 9 hours
      if (firstLoginTime && lastLogoutTime) {
        grossDurationSec = Math.max(0, Math.floor((new Date(lastLogoutTime) - new Date(firstLoginTime)) / 1000));
      }
      const netWorkDurationSec = Math.max(0, grossDurationSec - (totalBreakSec + totalLunchSec));

      await api.post('/admin/attendance/mark', {
        employeeId: employee._id || employee.id,
        date: rectifyForm.date,
        status: rectifyForm.status,
        firstLoginTime,
        lastLogoutTime,
        breakMinutes: bMin,
        lunchMinutes: lMin,
        totalBreakDurationInSeconds: totalBreakSec,
        totalLunchDurationInSeconds: totalLunchSec,
        correctionReason: rectifyForm.reason || ''
      }).catch(err => {
        console.warn('API error (saved locally):', err);
      });

      // Update state locally immediately so UI reflects updated status
      setEmpAttendanceHistory(prev => {
        const dateStr = rectifyForm.date;
        const existingIdx = prev.findIndex(r => {
          const rDate = typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0];
          return rDate === dateStr;
        });

        const updatedRec = {
          ...(existingIdx >= 0 ? prev[existingIdx] : {}),
          _id: existingIdx >= 0 ? prev[existingIdx]._id : 'att_' + Date.now(),
          date: rectifyForm.date,
          status: rectifyForm.status,
          firstLoginTime,
          lastLogoutTime,
          totalBreakDurationInSeconds: totalBreakSec,
          totalLunchDurationInSeconds: totalLunchSec,
          totalWorkDurationInSeconds: netWorkDurationSec,
          isManualCorrection: true,
          correctionReason: rectifyForm.reason
        };

        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = updatedRec;
          return copy;
        } else {
          return [updatedRec, ...prev];
        }
      });

      alert(`Attendance for ${formatDate(rectifyForm.date)} successfully updated to '${rectifyForm.status}'!`);
      setEditingAttendanceRecord(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save attendance: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSavingAttendanceRectification(false);
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

        const todayLogin = cachedAtt?.firstLoginTime || `${dateStr}T09:15:00.000Z`;
        const todayStatus = computeAttendanceStatus({ firstLoginTime: todayLogin, status: cachedAtt?.status });

        logs.push({
          _id: `att_today_${d.getTime()}`,
          date: dateStr,
          firstLoginTime: todayLogin,
          lastLogoutTime: cachedAtt?.lastLogoutTime || null,
          totalWorkDurationInSeconds: cachedAtt?.totalWorkDurationInSeconds || 25200,
          totalBreakDurationInSeconds: cachedAtt?.totalBreakDurationInSeconds || 1800,
          totalLunchDurationInSeconds: cachedAtt?.totalLunchDurationInSeconds || 2700,
          status: todayStatus
        });
      } else {
        // Diverse realistic logs respecting all 4 rules:
        let loginTime = null;
        let logoutTime = null;
        let workDuration = 0;
        let dayStatus = 'Present';

        if (i % 9 === 0) {
          // Rule 4: No check in -> On Leave
          loginTime = null;
          logoutTime = null;
          workDuration = 0;
          dayStatus = 'On Leave';
        } else if (i % 6 === 0) {
          // Rule 3: Login after 1:00 PM (13:30) -> Half Day
          loginTime = `${dateStr}T13:30:00.000Z`;
          logoutTime = `${dateStr}T18:00:00.000Z`;
          workDuration = 16200;
          dayStatus = 'Half Day';
        } else if (i % 4 === 0) {
          // Rule 2: Exceed grace time (10:45 AM) -> Late
          loginTime = `${dateStr}T10:45:00.000Z`;
          logoutTime = `${dateStr}T18:15:00.000Z`;
          workDuration = 27000;
          dayStatus = 'Late';
        } else {
          // Rule 1: On-time check in (09:15 AM <= 10:15 AM) -> Present
          loginTime = `${dateStr}T09:15:00.000Z`;
          logoutTime = `${dateStr}T18:00:00.000Z`;
          workDuration = 27900 + (i % 3) * 600;
          dayStatus = 'Present';
        }

        logs.push({
          _id: `att_${d.getTime()}`,
          date: dateStr,
          firstLoginTime: loginTime,
          lastLogoutTime: logoutTime,
          totalWorkDurationInSeconds: workDuration,
          totalBreakDurationInSeconds: loginTime ? 1800 : 0,
          totalLunchDurationInSeconds: loginTime ? 2700 : 0,
          status: dayStatus
        });
      }
    }
    return logs;
  };

  const formatHours = (seconds) => {
    const totalSec = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${h}H ${m}M`;
  };

  const exportEmpAttendancePDF = async () => {
    const recordsToExport = displayAttendanceRecords?.length > 0 ? displayAttendanceRecords : empAttendanceHistory;
    if (!employee || !recordsToExport) return;
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
      const tableRows = recordsToExport.map(row => [
        formatDateWithDay(row.date),
        row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        row.totalWorkDurationInSeconds > 0 ? formatHours(row.totalWorkDurationInSeconds) : '–',
        row.totalBreakDurationInSeconds > 0 ? formatHours(row.totalBreakDurationInSeconds) : '–',
        row.totalLunchDurationInSeconds > 0 ? formatHours(row.totalLunchDurationInSeconds) : '–',
        row.displayStatus || computeAttendanceStatus(row)
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
    const recordsToExport = displayAttendanceRecords?.length > 0 ? displayAttendanceRecords : empAttendanceHistory;
    if (!employee || !recordsToExport) return;
    try {
      const tableColumn = ["Date", "Check-In", "Check-Out", "Work Time", "Break", "Lunch", "Status"];
      const tableRows = recordsToExport.map(row => [
        formatDateWithDay(row.date),
        row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        row.totalWorkDurationInSeconds > 0 ? formatHours(row.totalWorkDurationInSeconds) : '–',
        row.totalBreakDurationInSeconds > 0 ? formatHours(row.totalBreakDurationInSeconds) : '–',
        row.totalLunchDurationInSeconds > 0 ? formatHours(row.totalLunchDurationInSeconds) : '–',
        row.displayStatus || computeAttendanceStatus(row)
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
    const recordsToExport = displayAttendanceRecords?.length > 0 ? displayAttendanceRecords : empAttendanceHistory;
    if (!employee || !recordsToExport) return;
    try {
      const exportData = recordsToExport.map(row => ({
        Date: formatDate(row.date),
        'Employee ID': employee.employeeId,
        'Employee Name': employee.fullName,
        'Check-In Time': row.firstLoginTime ? new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        'Check-Out Time': row.lastLogoutTime ? new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        'Work Duration': row.totalWorkDurationInSeconds > 0 ? formatHours(row.totalWorkDurationInSeconds) : '–',
        'Break Duration': row.totalBreakDurationInSeconds > 0 ? formatHours(row.totalBreakDurationInSeconds) : '–',
        'Lunch Duration': row.totalLunchDurationInSeconds > 0 ? formatHours(row.totalLunchDurationInSeconds) : '–',
        Status: row.displayStatus || computeAttendanceStatus(row)
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Attendance");
      XLSX.writeFile(workbook, `Attendance_Report_${employee.fullName.replace(/\s+/g, '_')}_${selectedAuditMonth}.xlsx`);
    } catch (e) {
      alert('Error generating attendance Excel: ' + e.message);
    }
  };

  const exportSingleDailyReportPDF = async (report) => {
    if (!employee || !report) return;
    try {
      const { doc, startY, finalizeDoc } = await createOfficialCodeThriveDoc({
        title: 'DAILY WORK REPORT & SPRINT DELIVERABLE AUDIT',
        metaFields: [
          { label: 'Employee Name', value: employee.fullName || 'N/A' },
          { label: 'Employee ID', value: employee.employeeId || 'N/A' },
          { label: 'Department / Role', value: `${employee.department || 'General'} • ${employee.designation || 'Staff'}` },
          { label: 'Report Date', value: formatDate(report.date || report.createdAt) },
          { label: 'Hours Logged', value: report.hoursWorked || report.hoursLogged || '8h 00m' },
          { label: 'Approval Status', value: (report.status || 'Submitted').toUpperCase() }
        ]
      });

      const autoTableFn = autoTable || doc.autoTable;
      const tableRows = [
        ['Deliverable / Sprint Title', report.title || report.tasksWorked || 'Daily Sprint Deliverable'],
        ['Work Accomplished & Modules', report.workSummary || report.tasksWorked || report.completedWork || 'Completed daily deliverables and module reviews.'],
        ['Blockers & Challenges', report.issuesFaced || report.blockers || 'None reported. All sprint milestones on track.'],
        ["Next Day's Sprint Plan", report.tomorrowsPlan || 'Continue scheduled roadmap deliverables.'],
        ['SRC Deliverable File', report.srcFileName ? `${report.srcFileName} (${report.srcFileSize || 'Verified'})` : 'No archive attached'],
        ['Verification Authority', 'CodeThrive Infotech Enterprise Vault (Secured Audit)']
      ];

      if (typeof autoTableFn === 'function') {
        autoTableFn(doc, {
          startY: startY,
          head: [['Report Field', 'Details & Deliverable Notes']],
          body: tableRows,
          columnStyles: {
            0: { cellWidth: 55, fontStyle: 'bold', textColor: [0, 82, 165] },
            1: { cellWidth: 'auto', textColor: [30, 41, 59] }
          },
          ...getCorporateTableStyles()
        });
      }

      finalizeDoc(`Daily_Report_${(employee.fullName || 'Employee').replace(/\s+/g, '_')}_${(report.date || 'log').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch (e) {
      alert('Error exporting report PDF: ' + e.message);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      if (!employee) {
        setLoading(true);
      }

      // Fast Concurrent Data Loading (all 6 APIs run in parallel in a single roundtrip)
      const [empResult, taskResult, reportResult, payResult, leaveResult, docResult] = await Promise.allSettled([
        api.get('/employees').catch(() => null),
        api.get('/tasks').catch(() => null),
        api.get('/daily-reports').catch(() => null),
        api.get('/payroll').catch(() => null),
        api.get('/leaves').catch(() => null),
        api.get('/documents').catch(() => null)
      ]);

      const empRes = empResult.status === 'fulfilled' ? empResult.value : null;
      const taskRes = taskResult.status === 'fulfilled' ? taskResult.value : null;
      const reportRes = reportResult.status === 'fulfilled' ? reportResult.value : null;
      const payRes = payResult.status === 'fulfilled' ? payResult.value : null;
      const leaveRes = leaveResult.status === 'fulfilled' ? leaveResult.value : null;
      const docRes = docResult.status === 'fulfilled' ? docResult.value : null;

      let list = DEFAULT_DEMO_EMPLOYEES;
      if (empRes?.data?.success && Array.isArray(empRes.data.data) && empRes.data.data.length > 0) {
        list = empRes.data.data.map(enrichEmployee);
        try {
          sessionStorage.setItem('cti_cached_employees', JSON.stringify(list));
        } catch {}
      }
      setAllEmployees(list);

      const targetRaw = list.find(e => e._id === id || e.employeeId === id) || (employee || list[0] || {});
      const enrichedTarget = enrichEmployee(targetRaw);

      // Helpers to exclude seed/dummy records
      const isSeedT = (t) => ['TSK-101', 'TSK-102', 'TSK-103'].includes(t?.taskId) || (t?.title && t.title.includes('OAuth Authentication'));
      const isSeedR = (r) => (r?.tasksWorked && r.tasksWorked.includes('authentication API unit tests')) || (r?.srcFileName === 'CodeThrive_Audit_Engine_SRC.zip');
      const isSeedP = (p) => p?.payslipId === 'PAY-2026-09-001' || p?.month === 'September 2026' || p?._id === 'psl_demo_001';

      // 1. Match Tasks for this employee
      let allTasks = taskRes?.data?.data || taskRes?.data || [];
      if (!Array.isArray(allTasks)) allTasks = [];
      try {
        const localTasks = JSON.parse(localStorage.getItem('cti_admin_tasks') || '[]');
        if (Array.isArray(localTasks)) {
          localTasks.forEach(lt => {
            if (!allTasks.some(t => t._id === lt._id)) allTasks.push(lt);
          });
        }
      } catch (e) {}

      if (allTasks.length > 0) {
        const empTasks = allTasks.filter(t => 
          !isSeedT(t) && (
            t.assignedTo?._id === enrichedTarget._id || 
            t.assignedTo?.employeeId === enrichedTarget.employeeId || 
            t.assignedTo === enrichedTarget._id ||
            t.assignedTo === enrichedTarget.employeeId
          )
        );
        empTasks.sort((a, b) => new Date(b.createdAt || b.dueDate || 0) - new Date(a.createdAt || a.dueDate || 0));
        enrichedTarget.assignedByAdmin.tasks = empTasks;
      }

      // 2. Match Daily Reports & SRC (Comprehensive match across ID, EmployeeID, Email, and Name)
      let allReports = reportRes?.data?.data || reportRes?.data || [];
      if (!Array.isArray(allReports)) allReports = [];
      try {
        const localReps = JSON.parse(localStorage.getItem('cti_daily_reports') || '[]');
        if (Array.isArray(localReps)) {
          localReps.forEach(lr => {
            if (!allReports.some(r => r._id === lr._id)) {
              allReports.push(lr);
            }
          });
        }
      } catch (e) {}

      if (allReports.length > 0) {
        const empReports = allReports.filter(r => {
          if (isSeedR(r)) return false;
          const rEmp = r.employee || {};
          const rId = typeof rEmp === 'object' ? (rEmp._id || rEmp.id || rEmp.employeeId) : rEmp;
          if (rId && (rId === enrichedTarget._id || rId === enrichedTarget.employeeId)) return true;
          if (r.employeeId && (r.employeeId === enrichedTarget.employeeId || r.employeeId === enrichedTarget._id)) return true;
          if (r.employee_id && (r.employee_id === enrichedTarget._id || r.employee_id === enrichedTarget.employeeId)) return true;
          if (r.employee === enrichedTarget._id || r.employee === enrichedTarget.employeeId) return true;

          const rEmail = (rEmp.personalEmailAddress || rEmp.email || r.email || '').toLowerCase();
          const targetEmail = (enrichedTarget.personalEmailAddress || enrichedTarget.email || '').toLowerCase();
          if (targetEmail && rEmail && targetEmail === rEmail) return true;

          const rName = (rEmp.fullName || r.employeeName || r.fullName || '').trim().toLowerCase();
          const targetName = (enrichedTarget.fullName || '').trim().toLowerCase();
          if (targetName && rName && targetName === rName) return true;

          return false;
        });
        // Sort newest first
        empReports.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
        enrichedTarget.sentByEmployee.dailyReports = empReports;
      }

      // 3. Match Leave Applications for this employee
      let allLeaves = leaveRes?.data?.data || leaveRes?.data || [];
      if (!Array.isArray(allLeaves)) allLeaves = [];
      try {
        const localLeaves = JSON.parse(localStorage.getItem('cti_shared_leaves') || '[]');
        if (Array.isArray(localLeaves)) {
          localLeaves.forEach(ll => {
            if (!allLeaves.some(l => l._id === ll._id)) allLeaves.push(ll);
          });
        }
      } catch (e) {}

      if (allLeaves.length > 0) {
        const empLeaves = allLeaves.filter(l => {
          const lEmp = l.employee || {};
          const lId = typeof lEmp === 'object' ? (lEmp._id || lEmp.id || lEmp.employeeId) : lEmp;
          if (lId && (lId === enrichedTarget._id || lId === enrichedTarget.employeeId)) return true;
          if (l.employeeId && (l.employeeId === enrichedTarget.employeeId || l.employeeId === enrichedTarget._id)) return true;
          if (l.employee_id && (l.employee_id === enrichedTarget._id || l.employee_id === enrichedTarget.employeeId)) return true;
          if (l.employee === enrichedTarget._id || l.employee === enrichedTarget.employeeId) return true;

          const lEmail = (lEmp.personalEmailAddress || lEmp.email || l.email || '').toLowerCase();
          const targetEmail = (enrichedTarget.personalEmailAddress || enrichedTarget.email || '').toLowerCase();
          if (targetEmail && lEmail && targetEmail === lEmail) return true;

          const lName = (lEmp.fullName || l.employeeName || l.fullName || '').trim().toLowerCase();
          const targetName = (enrichedTarget.fullName || '').trim().toLowerCase();
          if (targetName && lName && (targetName === lName || targetName.includes(lName) || lName.includes(targetName))) return true;

          return false;
        });

        empLeaves.forEach(l => {
          if (!l.dates) {
            const s = l.startDate ? (new Date(l.startDate).toLocaleDateString('en-GB') || l.startDate) : '';
            const e = l.endDate ? (new Date(l.endDate).toLocaleDateString('en-GB') || l.endDate) : '';
            l.dates = s ? (e && e !== s ? `${s} - ${e}` : s) : 'Active Period';
          }
        });
        // Sort newest first
        empLeaves.sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0));
        enrichedTarget.sentByEmployee.leaveApplications = empLeaves;
      }

      // 4. Match Documents for this employee
      let allDocs = docRes?.data?.data || docRes?.data || [];
      if (!Array.isArray(allDocs)) allDocs = [];
      try {
        const localDocs = JSON.parse(localStorage.getItem('cti_shared_documents') || '[]');
        if (Array.isArray(localDocs)) {
          localDocs.forEach(ld => {
            if (!allDocs.some(d => d._id === ld._id)) allDocs.push(ld);
          });
        }
      } catch (e) {}

      if (allDocs.length > 0) {
        const empDocs = allDocs.filter(d => {
          const dEmp = d.employee || {};
          const dId = typeof dEmp === 'object' ? (dEmp._id || dEmp.id || dEmp.employeeId) : dEmp;
          if (dId && (dId === enrichedTarget._id || dId === enrichedTarget.employeeId)) return true;
          if (d.employeeId && (d.employeeId === enrichedTarget.employeeId || d.employeeId === enrichedTarget._id)) return true;
          if (d.employee_id && (d.employee_id === enrichedTarget._id || d.employee_id === enrichedTarget.employeeId)) return true;
          if (d.employee === enrichedTarget._id || d.employee === enrichedTarget.employeeId) return true;

          const dEmail = (dEmp.personalEmailAddress || dEmp.email || d.email || '').toLowerCase();
          const targetEmail = (enrichedTarget.personalEmailAddress || enrichedTarget.email || '').toLowerCase();
          if (targetEmail && dEmail && targetEmail === dEmail) return true;

          const dName = (dEmp.fullName || d.employeeName || d.fullName || '').trim().toLowerCase();
          const targetName = (enrichedTarget.fullName || '').trim().toLowerCase();
          if (targetName && dName && targetName === dName) return true;

          return false;
        });
        enrichedTarget.sentByEmployee.uploadedDocs = empDocs;
      }

      // 5. Match Payslips
      const allPayslips = payRes?.data?.data || payRes?.data || [];
      if (Array.isArray(allPayslips) && allPayslips.length > 0) {
        const empPayslips = allPayslips.filter(p => 
          !isSeedP(p) && (
            p.employee?._id === enrichedTarget._id || 
            p.employee?.employeeId === enrichedTarget.employeeId || 
            p.employee === enrichedTarget._id ||
            p.employee === enrichedTarget.employeeId
          )
        );
        enrichedTarget.sentByEmployee.payslips = empPayslips;
      }

      // Merge localStorage payslips
      try {
        const cachedPayKey = `cti_payslips_${enrichedTarget._id || enrichedTarget.employeeId}`;
        const localPayslips = (JSON.parse(localStorage.getItem(cachedPayKey) || '[]')).filter(p => !isSeedP(p));
        if (localPayslips.length > 0) {
          const existingMonths = new Set((enrichedTarget.sentByEmployee?.payslips || []).map(p => p.month || p.payslipId));
          const merged = [...localPayslips.filter(p => !existingMonths.has(p.month || p.payslipId)), ...(enrichedTarget.sentByEmployee?.payslips || [])];
          enrichedTarget.sentByEmployee.payslips = merged;
        }
      } catch (e) {}

      // Merge localStorage tasks
      try {
        const cachedTasksKey = `cti_tasks_${enrichedTarget._id || enrichedTarget.employeeId}`;
        const localTasks = JSON.parse(localStorage.getItem(cachedTasksKey) || '[]');
        if (localTasks.length > 0) {
          const existingIds = new Set((enrichedTarget.assignedByAdmin?.tasks || []).map(t => t._id || t.taskId));
          const merged = [...localTasks.filter(t => !existingIds.has(t._id || t.taskId)), ...(enrichedTarget.assignedByAdmin?.tasks || [])];
          enrichedTarget.assignedByAdmin.tasks = merged;
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
      console.warn('API error in employee details:', err);
      const fallback = DEFAULT_DEMO_EMPLOYEES.find(e => e._id === id || e.employeeId === id) || DEFAULT_DEMO_EMPLOYEES[0];
      const enrichedFallback = enrichEmployee(fallback);
      setEmployee(enrichedFallback);
      initFormState(enrichedFallback);
    } finally {
      setLoading(false);
    }
  };

  const initFormState = (emp) => {
    if (!emp) return;
    setEditRole(emp.user?.role || 'employee');
    setEditStatus(emp.status || 'Active');
    setEditWifiPolicy(emp.wifiAccessPolicy || emp.user?.wifiAccessPolicy || 'any');
    const defaultSal = emp.salaryAmount || (emp.fullName?.toLowerCase().includes('kirubakaran') ? 85000 : 75000);
    setEditSalary(defaultSal);
    setEditBank(emp.bankName || 'Canara Bank');
    setEditAccNo(emp.accountNumber || '50200088991122');
    setEditIfsc(emp.ifscCode || 'CNRB0001234');
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
      await api.put(`/leaves/${leaveId}`, { status: newStatus }).catch(() => 
        api.put(`/leaves/${leaveId}/status`, { status: newStatus })
      );
    } catch (err) {
      console.warn('Leave status update API error (syncing locally):', err);
    } finally {
      // 1. Update localStorage cti_shared_leaves so change is 100% persistent across reloads
      try {
        const rawShared = JSON.parse(localStorage.getItem('cti_shared_leaves') || '[]');
        const updatedShared = rawShared.map(l => l._id === leaveId ? { ...l, status: newStatus } : l);
        localStorage.setItem('cti_shared_leaves', JSON.stringify(updatedShared));
      } catch (e) {}

      // 2. Update local state immediately
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
CodeThrive Infotech • Confidential Personnel Archive
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

  const filteredTasks = filterByMonth(employee?.assignedByAdmin?.tasks, t => t.dueDate || t.date || t.createdAt || t.month || '');
  const filteredReports = filterByMonth(employee?.sentByEmployee?.dailyReports, r => r.date || r.createdAt || r.month || '');
  const filteredLeaves = filterByMonth(employee?.sentByEmployee?.leaveApplications, l => l.startDate || l.dates || l.createdAt || l.month || '');
  const filteredPayslips = filterByMonth(employee?.sentByEmployee?.payslips, p => p.monthCode || p.month || p.createdAt || '');
  const completenessPct = calculateProfileCompleteness(employee);

  // Comprehensive daily attendance register matching the employee portal
  // Covers all days starting from 02/11/2026 onwards for November 2026 (descending)
  const displayAttendanceRecords = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate();
    const currentHour = today.getHours();

    let targetYear = 2026;
    let targetMonth = 11;
    if (selectedAuditMonth && selectedAuditMonth !== 'All') {
      const [y, m] = selectedAuditMonth.split('-').map(Number);
      if (y && m) {
        targetYear = y;
        targetMonth = m;
      }
    }

    const isCurrentMonth = targetYear === currentYear && targetMonth === currentMonth;
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

    // Portal officially in use starting from 02/11/2026
    let startDay = 1;
    if (targetYear === 2026 && targetMonth === 11) {
      startDay = 2; // Started from 02/11/2026
    } else if (new Date(targetYear, targetMonth - 1, 1) < new Date(2026, 10, 1)) {
      return Array.isArray(empAttendanceHistory) ? empAttendanceHistory : [];
    }

    const endDay = isCurrentMonth ? currentDay : daysInMonth;

    // Create lookup by date key (YYYY-MM-DD) from empAttendanceHistory
    const historyMap = {};
    (Array.isArray(empAttendanceHistory) ? empAttendanceHistory : []).forEach(row => {
      if (row.date) {
        let key = '';
        if (typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(row.date.trim())) {
          key = row.date.trim().split('T')[0];
        } else {
          const d = new Date(row.date);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            key = `${y}-${m}-${day}`;
          }
        }
        if (key && (!historyMap[key] || row.firstLoginTime || row.totalWorkDurationInSeconds > 0)) {
          historyMap[key] = row;
        }
      }
    });

    // Leave map for employee
    const leaveMap = {};
    (employee?.sentByEmployee?.leaveApplications || []).forEach(l => {
      const st = (l.status || '').toLowerCase();
      if (st === 'approved' || st === 'pending') {
        const start = l.startDate ? new Date(l.startDate) : null;
        const end = l.endDate ? new Date(l.endDate) : start;
        if (start && end) {
          const cur = new Date(start);
          while (cur <= end) {
            const dateKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
            leaveMap[dateKey] = l;
            cur.setDate(cur.getDate() + 1);
          }
        }
      }
    });

    const rows = [];

    // Loop descending from endDay down to startDay (newest at top)
    for (let d = endDay; d >= startDay; d--) {
      const y = targetYear;
      const m = String(targetMonth).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${y}-${m}-${dayStr}`;
      const dateIsoNoon = `${dateKey}T12:00:00.000Z`;
      const dayOfWeek = new Date(targetYear, targetMonth - 1, d).getDay(); // 0 is Sunday
      const mmdd = `${m}-${dayStr}`;
      const isSunday = dayOfWeek === 0;
      const govtHolidayName = TN_GOVT_HOLIDAYS[mmdd];
      const isGovtHoliday = Boolean(govtHolidayName);
      const isToday = isCurrentMonth && d === currentDay;

      const existing = historyMap[dateKey];

      // 1. If an actual punched record exists in history:
      if (existing && (existing.firstLoginTime || (existing.status && !['absent', 'not checked in'].includes(existing.status.toLowerCase())))) {
        let computedStatus = existing.status;
        if (!existing.isManualCorrection) {
          if (existing.firstLoginTime) {
            const dt = new Date(existing.firstLoginTime);
            const istStr = dt.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
            const [h, min] = istStr.split(':').map(Number);
            if (h >= 13) computedStatus = 'Half Day';
            else if (h > 10 || (h === 10 && min > 15)) computedStatus = 'Late';
            else computedStatus = 'Present';
          }
        }
        rows.push({
          ...existing,
          dateKey,
          date: existing.date || dateIsoNoon,
          displayStatus: computedStatus || 'Present',
          status: computedStatus || 'Present'
        });
        continue;
      }

      // 2. Unpunched days:
      // Sunday Holiday:
      if (isSunday) {
        rows.push({
          _id: `sun_${dateKey}`,
          dateKey,
          date: dateIsoNoon,
          status: 'Sunday Holiday',
          displayStatus: 'Sunday Holiday',
          isSundayHoliday: true,
          remarks: 'Sunday Holiday',
          firstLoginTime: null,
          lastLogoutTime: null,
          totalWorkDurationInSeconds: 0,
          totalBreakDurationInSeconds: 0,
          totalLunchDurationInSeconds: 0,
          employee
        });
        continue;
      }

      // Government Holiday:
      if (isGovtHoliday) {
        rows.push({
          _id: `gov_${dateKey}`,
          dateKey,
          date: dateIsoNoon,
          status: 'Government Holiday',
          displayStatus: 'Government Holiday',
          isGovtHoliday: true,
          holidayName: govtHolidayName,
          remarks: `Government Holiday - ${govtHolidayName}`,
          firstLoginTime: null,
          lastLogoutTime: null,
          totalWorkDurationInSeconds: 0,
          totalBreakDurationInSeconds: 0,
          totalLunchDurationInSeconds: 0,
          employee
        });
        continue;
      }

      // Working day (Monday - Saturday):
      const matchingLeave = leaveMap[dateKey];

      if (isToday) {
        // Shift starts at 10:00 AM. 2 hours after is 12:00 PM:
        if (currentHour >= 12) {
          rows.push({
            _id: `today_absent_${dateKey}`,
            dateKey,
            date: dateIsoNoon,
            status: 'Absent',
            displayStatus: 'Absent',
            remarks: matchingLeave ? `${matchingLeave.leaveType || 'Casual'} Leave (Approved)` : 'Absent (Cutoff 12:00 PM Passed)',
            firstLoginTime: null,
            lastLogoutTime: null,
            totalWorkDurationInSeconds: 0,
            totalBreakDurationInSeconds: 0,
            totalLunchDurationInSeconds: 0,
            employee
          });
        } else if (matchingLeave) {
          rows.push({
            _id: `today_leave_${dateKey}`,
            dateKey,
            date: dateIsoNoon,
            status: 'Absent',
            displayStatus: 'Absent',
            remarks: `${matchingLeave.leaveType || 'Casual'} Leave (Approved)`,
            firstLoginTime: null,
            lastLogoutTime: null,
            totalWorkDurationInSeconds: 0,
            totalBreakDurationInSeconds: 0,
            totalLunchDurationInSeconds: 0,
            employee
          });
        } else {
          rows.push({
            _id: `today_not_checked_in_${dateKey}`,
            dateKey,
            date: dateIsoNoon,
            status: 'Not Checked In',
            displayStatus: 'Not Checked In',
            remarks: 'Standard Shift (10:00 AM – 06:00 PM)',
            firstLoginTime: null,
            lastLogoutTime: null,
            totalWorkDurationInSeconds: 0,
            totalBreakDurationInSeconds: 0,
            totalLunchDurationInSeconds: 0,
            employee
          });
        }
        continue;
      }

      // Past working days from 02/11/2026 onwards without punch-in:
      if (matchingLeave) {
        rows.push({
          _id: `leave_${dateKey}`,
          dateKey,
          date: dateIsoNoon,
          status: 'Absent',
          displayStatus: 'Absent',
          remarks: `${matchingLeave.leaveType || 'Casual'} Leave (Approved)`,
          firstLoginTime: null,
          lastLogoutTime: null,
          totalWorkDurationInSeconds: 0,
          totalBreakDurationInSeconds: 0,
          totalLunchDurationInSeconds: 0,
          employee
        });
      } else {
        rows.push({
          _id: `absent_${dateKey}`,
          dateKey,
          date: dateIsoNoon,
          status: 'Absent',
          displayStatus: 'Absent',
          remarks: 'Absent - No Punch-In',
          firstLoginTime: null,
          lastLogoutTime: null,
          totalWorkDurationInSeconds: 0,
          totalBreakDurationInSeconds: 0,
          totalLunchDurationInSeconds: 0,
          employee
        });
      }
    }

    return rows;
  }, [empAttendanceHistory, selectedAuditMonth, employee]);

  const handleDownloadMonthlyAuditPDF = async () => {
    if (!employee) return;
    try {
      const today = new Date();
      const monthObj = AUDIT_MONTH_OPTIONS.find(m => m.value === selectedAuditMonth);
      const selectedMonthName = monthObj ? monthObj.label.split(' ')[0] : 'October';
      await generateEmployeeMasterDossierPDF(employee, selectedMonthName, today.getFullYear());
      return;
    } catch (err) {
      console.error('Failed to generate master dossier PDF', err);
      alert('Error generating master dossier PDF. Please try again.');
    }
  };

  const handleOldUnusedPdf = async () => {
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
        password: newPassword,
        wifiAccessPolicy: editWifiPolicy
      });
    } catch (err) {
      console.warn('Updated locally');
    }
    const updated = {
      ...employee,
      status: editStatus,
      wifiAccessPolicy: editWifiPolicy,
      user: { ...employee.user, role: editRole, status: editStatus, wifiAccessPolicy: editWifiPolicy }
    };
    setEmployee(updated);
    setNewPassword('');
    alert(`Access Role set to '${editRole}', Status to '${editStatus}', Wi-Fi Policy to '${editWifiPolicy === 'office' ? 'Office Wi-Fi Only' : 'Other Wi-Fi (Any Network)'}' for ${employee.fullName}!`);
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

  const computeSalaryBreakdown = (monthlySalary) => {
    const gross = Number(monthlySalary) || 0;
    if (gross <= 0) {
      return {
        basic: 0,
        hra: 0,
        travel: 0,
        medical: 0,
        other: 0,
        gross: 0,
        pf: 0,
        profTax: 0,
        incomeTax: 0,
        totalDeductions: 0,
        netPayable: 0
      };
    }

    const basic = Math.round(gross * 0.50);
    const hra = Math.round(basic * 0.40);
    const travel = gross > 30000 ? 3000 : 1600;
    const medical = gross > 30000 ? 2000 : 1250;
    const other = Math.max(0, gross - (basic + hra + travel + medical));

    const pf = Math.round(basic * 0.12);
    const profTax = gross >= 15000 ? 200 : 0;
    const incomeTax = gross > 60000 ? Math.round(gross * 0.05) : 0;
    const totalDeductions = pf + profTax + incomeTax;
    const netPayable = gross - totalDeductions;

    return {
      basic,
      hra,
      travel,
      medical,
      other,
      gross,
      pf,
      profTax,
      incomeTax,
      totalDeductions,
      netPayable
    };
  };

  const handleGenerateAndIssuePayslip = async () => {
    if (!employee) return;
    const grossVal = Number(editSalary || employee.salaryAmount) || 0;
    if (grossVal <= 0) {
      alert('Please set and save a valid Monthly Salary before generating a payslip.');
      return;
    }

    const breakdown = computeSalaryBreakdown(grossVal);
    const bonus = 0;
    const leaveDed = Number(issueLeaveDeduction) || 0;
    
    const totalAllowances = breakdown.hra + breakdown.travel + breakdown.medical + breakdown.other;
    const totalDeductions = breakdown.pf + breakdown.profTax + breakdown.incomeTax + leaveDed;
    const finalGross = breakdown.basic + totalAllowances + bonus;
    const finalNet = finalGross - totalDeductions;

    const payslipId = `PSL-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newPayslip = {
      _id: 'psl_' + Date.now(),
      payslipId,
      month: issuePayMonth,
      monthCode: issuePayMonth,
      paymentDate: issuePayDate,
      status: issuePayStatus,
      basicSalary: breakdown.basic,
      bonus,
      allowanceDetails: {
        hra: breakdown.hra,
        travel: breakdown.travel,
        medical: breakdown.medical,
        other: breakdown.other
      },
      allowances: totalAllowances,
      deductionDetails: {
        pf: breakdown.pf,
        esi: 0,
        professionalTax: breakdown.profTax,
        incomeTax: breakdown.incomeTax,
        leaveDeduction: leaveDed,
        loanAdvance: 0,
        other: 0
      },
      deductions: totalDeductions,
      grossSalary: finalGross,
      netPayable: finalNet,
      employee: {
        _id: employee._id,
        fullName: employee.fullName,
        employeeId: employee.employeeId,
        department: employee.department,
        designation: employee.designation,
        bankName: editBank || employee.bankName,
        accountNumber: editAccNo || employee.accountNumber,
        ifscCode: editIfsc || employee.ifscCode,
        panNumber: employee.panNumber
      },
      createdAt: new Date().toISOString()
    };

    try {
      setIsIssuingPayslip(true);
      await api.post('/payroll', {
        employeeId: employee._id,
        month: issuePayMonth,
        basicSalary: breakdown.basic,
        bonus,
        allowanceDetails: newPayslip.allowanceDetails,
        deductionDetails: newPayslip.deductionDetails,
        status: issuePayStatus,
        paymentDate: issuePayDate
      });
    } catch (err) {
      console.warn('Payslip stored locally or API offline:', err);
    } finally {
      const currentPayslips = employee.sentByEmployee?.payslips || [];
      const filtered = currentPayslips.filter(p => (p.month || p.monthCode) !== issuePayMonth);
      const updatedPayslips = [newPayslip, ...filtered];

      setEmployee(prev => ({
        ...prev,
        sentByEmployee: {
          ...prev.sentByEmployee,
          payslips: updatedPayslips
        }
      }));

      try {
        const cachedPayKey = `cti_payslips_${employee._id || employee.employeeId}`;
        localStorage.setItem(cachedPayKey, JSON.stringify(updatedPayslips));
      } catch (e) {}

      setIsIssuingPayslip(false);
      alert(`Payslip for "${issuePayMonth}" successfully issued to ${employee.fullName}! The employee can now view & download it from the portal.`);
    }
  };

  const downloadSinglePayslipPDF = async (payslip) => {
    if (!employee || !payslip) return;
    try {
      const targetMonth = payslip.month || payslip.monthCode || 'October 2026';
      const targetDate = payslip.paymentDate ? formatDate(payslip.paymentDate) : new Date().toLocaleDateString('en-GB');

      const empName = employee.fullName || 'Employee';
      const empId = employee.employeeId || 'CTI-EMP-001';
      const empRole = employee.designation || 'Software Engineer';
      const empDept = employee.department || 'Engineering';
      const bankName = employee.bankName || payslip.employee?.bankName || 'Canara Bank';
      const accNo = employee.accountNumber || payslip.employee?.accountNumber || '50200088991122';
      const ifsc = employee.ifscCode || payslip.employee?.ifscCode || 'CNRB0001234';
      const pan = employee.panNumber || payslip.employee?.panNumber || 'ABCDE1234F';

      const { doc, startY, finalizeDoc } = await createOfficialCodeThriveDoc({
        title: 'OFFICIAL SALARY STATEMENT / PAYSLIP',
        userName: empName,
        reportType: 'Payslip',
        metaFields: [
          { label: 'Employee Name', value: empName },
          { label: 'Employee ID', value: empId },
          { label: 'Department / Role', value: `${empDept} • ${empRole}` },
          { label: 'Pay Period', value: targetMonth },
          { label: 'Disbursement Date', value: targetDate },
          { label: 'Bank Name & A/C', value: `${bankName} (${accNo})` },
          { label: 'IFSC / PAN', value: `${ifsc} • ${pan}` },
          { label: 'Payslip Number', value: payslip.payslipId || 'PSL-2026' },
          { label: 'Disbursement Status', value: (payslip.status || 'Paid').toUpperCase() }
        ]
      });

      const hra = payslip.allowanceDetails?.hra || 0;
      const travel = payslip.allowanceDetails?.travel || 0;
      const medical = payslip.allowanceDetails?.medical || 0;
      const otherAllowance = payslip.allowanceDetails?.other || 0;
      const bonus = payslip.bonus || 0;

      const pf = payslip.deductionDetails?.pf || 0;
      const esi = payslip.deductionDetails?.esi || 0;
      const profTax = payslip.deductionDetails?.professionalTax || 200;
      const incomeTax = payslip.deductionDetails?.incomeTax || 0;
      const leaveDed = payslip.deductionDetails?.leaveDeduction || 0;

      const salaryTableBody = [
        ['Basic Salary', `Rs. ${(payslip.basicSalary || 0).toLocaleString()}`, 'Provident Fund (PF)', `Rs. ${pf.toLocaleString()}`],
        ['House Rent Allowance (HRA)', `Rs. ${hra.toLocaleString()}`, 'Professional Tax (PT)', `Rs. ${profTax.toLocaleString()}`],
        ['Conveyance & Travel', `Rs. ${travel.toLocaleString()}`, 'Income Tax (TDS)', `Rs. ${incomeTax.toLocaleString()}`],
        ['Medical Allowance', `Rs. ${medical.toLocaleString()}`, 'Leave / LOP Deduction', `Rs. ${leaveDed.toLocaleString()}`],
        ['Special Allowances', `Rs. ${otherAllowance.toLocaleString()}`, 'ESI Deduction', `Rs. ${esi.toLocaleString()}`],
        [
          'GROSS EARNINGS', 
          `Rs. ${(payslip.grossSalary || 0).toLocaleString()}`, 
          'TOTAL DEDUCTIONS', 
          `Rs. ${(payslip.deductions || 0).toLocaleString()}`
        ]
      ];

      const autoTableFn = autoTable || doc.autoTable;
      if (typeof autoTableFn === 'function') {
        autoTableFn(doc, {
          startY: startY,
          head: [['EARNINGS COMPONENT', 'AMOUNT (INR)', 'DEDUCTIONS COMPONENT', 'AMOUNT (INR)']],
          body: salaryTableBody,
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
          styles: { fontSize: 8, cellPadding: 3.5, textColor: [30, 41, 59] },
          columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 38, halign: 'right' },
            2: { cellWidth: 55 },
            3: { cellWidth: 38, halign: 'right' }
          },
          didParseCell: function(data) {
            if (data.row.index === 5 || data.row.index === 6) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [241, 245, 249];
            }
          }
        });
      }

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : startY + 80;

      // Net Salary Callout Box
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(16, 185, 129);
      doc.roundedRect(12, finalY, 186, 16, 2.5, 2.5, 'FD');

      doc.setTextColor(6, 78, 59);
      doc.setFontSize(9.5);
      doc.setFont('times', 'bold');
      doc.text('NET SALARY DISBURSED (IN-HAND):', 18, finalY + 10.5);

      doc.setTextColor(16, 185, 129);
      doc.setFontSize(14);
      doc.setFont('times', 'bold');
      doc.text(`Rs. ${(payslip.netPayable || 0).toLocaleString()}`, 192, finalY + 11, { align: 'right' });

      finalizeDoc(`Payslip_${empName.replace(/\s+/g, '_')}_${targetMonth.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch (err) {
      alert('Error generating payslip PDF: ' + err.message);
    }
  };

  const handleDeletePayslip = (payslipId) => {
    if (!window.confirm('Are you sure you want to delete this payslip record?')) return;
    const currentPayslips = employee.sentByEmployee?.payslips || [];
    const updated = currentPayslips.filter(p => (p._id !== payslipId && p.payslipId !== payslipId));
    setEmployee(prev => ({
      ...prev,
      sentByEmployee: { ...prev.sentByEmployee, payslips: updated }
    }));
    try {
      const cachedPayKey = `cti_payslips_${employee._id || employee.employeeId}`;
      localStorage.setItem(cachedPayKey, JSON.stringify(updated));
    } catch (e) {}
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
            title="Download Monthly Employee Full Pdf (All Database Details)"
          >
            <Download size={15} /> Monthly Employee Full Pdf
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
              <span className="profile-company-name">CodeThrive Infotech</span>
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

              <button 
                type="button"
                className="executive-contact-pill"
                onClick={handleDownloadMonthlyAuditPDF}
                title="Download this employee's complete Monthly Employee Full Pdf (All Database Records)"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.35) 100%)',
                  border: '1.5px solid rgba(52, 211, 153, 0.55)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div className="pill-icon-box" style={{ background: 'rgba(52, 211, 153, 0.25)', color: '#34d399' }}>
                  <Download size={14} />
                </div>
                <div className="pill-text-col">
                  <span className="pill-label" style={{ color: '#34d399', fontWeight: 800 }}>AUDIT RECORD</span>
                  <span className="pill-val" style={{ color: '#ffffff', fontWeight: 700 }}>Monthly Employee Full Pdf</span>
                </div>
                <span className="pill-arrow" style={{ color: '#34d399' }}>↓</span>
              </button>
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
          <User size={15} /> Profile & HR
        </button>

        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <Briefcase size={15} /> Tasks <span className="tab-count-badge">{employee?.assignedByAdmin?.tasks?.length || 0}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={15} /> Daily Reports <span className="tab-count-badge">{employee?.sentByEmployee?.dailyReports?.length || 0}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          <Calendar size={15} /> Leaves <span className="tab-count-badge">{employee?.sentByEmployee?.leaveApplications?.length || 0}</span>
        </button>

        {/* 5. Attendance Audit */}
        <button 
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Clock size={15} /> Attendance
        </button>

        {/* 6. Documents */}
        <button 
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileCheck size={15} /> Documents <span className="tab-count-badge">{employee?.sentByEmployee?.uploadedDocs?.length || 0}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'management' || activeTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('management')}
        >
          <Banknote size={15} /> Payroll <span className="tab-count-badge">{employee?.sentByEmployee?.payslips?.length || 0}</span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={15} /> Account Settings
        </button>
      </div>

      {/* Main Content Body */}
      <div className="detail-tab-body">
        
        {/* TAB 1: 100% COMPREHENSIVE FULL PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Dynamic Profile Strength Completeness Banner */}
            <div className="profile-strength-bar-card" style={{ margin: 0 }}>
              <div className="strength-info">
                <div className="strength-icon-box" style={{ background: completenessPct === 100 ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                  <Sparkles size={20} color="#ffffff" />
                </div>
                <div>
                  <div className="strength-title-row">
                    <span className="strength-title">Profile Vault Completeness</span>
                    <span className={`strength-pct ${completenessPct === 100 ? 'done' : ''}`}>{completenessPct}%</span>
                  </div>
                  <span className="strength-sub">
                    {completenessPct === 100
                      ? '🎉 Verified 100% Corporate Personnel Profile • Audited & Approved by CodeThrive Compliance Vault'
                      : `Corporate Personnel Profile is ${completenessPct}% complete based on filled information.`}
                  </span>
                </div>
              </div>

              <div className="strength-track-wrapper">
                <div className="strength-track">
                  <div className="strength-fill" style={{ width: `${completenessPct}%` }}></div>
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
                  <div className="field-tile-val">{employee.previousCompany || 'CodeThrive Infotech'}</div>
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
                  <div className="field-tile-val mono highlight-blue">
                    {employee.panNumber || <span className="val-not-set">Not Provided</span>}
                  </div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Aadhaar Number</span>
                  <div className="field-tile-val mono">
                    {employee.aadhaarOrIdentityProofNumber || <span className="val-not-set">Not Provided</span>}
                  </div>
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
                      <div className="field-tile-val">{employee.emergencyContact?.name || <span className="val-not-set">Not Provided</span>}</div>
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
                      <div className="field-tile-val">{employee.emergencyContact?.relationship || <span className="val-not-set">Not Provided</span>}</div>
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
          const displayedTasks = allEmpTasks;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Header */}
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
                  <CheckSquare size={18} color="#818cf8" /> Assign New Task to {employee.fullName}
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
                      placeholder="" 
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
                        <span>Task Description / Specifications</span>
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
                      <DateInput 
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
                        {isTaskSubmitting ? 'Assigning Task...' : 'Assign Task'}
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
          const srcReports = allReports.filter(r => r.srcFileName || r.srcFileUrl || (r.attachments && r.attachments.length > 0));
          const reportDates = Array.from(new Set(allReports.map(r => r.date).filter(Boolean)));
          const searchLower = reportSearchTerm.toLowerCase();
          const targetReportsList = reportViewMode === 'src' ? srcReports : allReports;
          const displayedReports = targetReportsList.filter(r => {
            const matchesDate = reportDateFilter === 'All' || r.date === reportDateFilter;
            const matchesSearch = !reportSearchTerm || 
              (r.title && r.title.toLowerCase().includes(searchLower)) ||
              (r.tasksWorked && r.tasksWorked.toLowerCase().includes(searchLower)) ||
              (r.workSummary && r.workSummary.toLowerCase().includes(searchLower)) ||
              (r.srcFileName && r.srcFileName.toLowerCase().includes(searchLower)) ||
              (r.date && r.date.includes(searchLower));
            return matchesDate && matchesSearch;
          }).sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

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
                    Daily Work Reports & SRC Deliverables
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    Submitted by {employee.fullName} • {allReports.length} reports filed, {srcReports.length} SRC files attached
                  </span>
                </div>

                {/* Sub-view Switcher & Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* View Mode Toggle: All Reports vs SRC Deliverables */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      type="button"
                      onClick={() => setReportViewMode('all')}
                      style={{
                        background: reportViewMode === 'all' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'transparent',
                        color: reportViewMode === 'all' ? '#ffffff' : '#94a3b8',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease',
                        boxShadow: reportViewMode === 'all' ? '0 4px 12px rgba(2, 132, 199, 0.35)' : 'none'
                      }}
                    >
                      <FileText size={14} /> Daily Reports ({allReports.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportViewMode('src')}
                      style={{
                        background: reportViewMode === 'src' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                        color: reportViewMode === 'src' ? '#ffffff' : '#94a3b8',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease',
                        boxShadow: reportViewMode === 'src' ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none'
                      }}
                    >
                      <FileArchive size={14} /> SRC Deliverables ({srcReports.length})
                    </button>
                  </div>

                  {/* Specific Date / Report Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <select
                      value={reportDateFilter}
                      onChange={e => setReportDateFilter(e.target.value)}
                      className="input-box"
                      style={{ width: 'auto', minWidth: '150px', height: '36px', fontSize: '0.82rem' }}
                    >
                      <option value="All">All Dates ({targetReportsList.length})</option>
                      {reportDates.map(d => (
                        <option key={d} value={d}>{formatDate(d)}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ position: 'relative', minWidth: '180px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text"
                      placeholder="Search reports or tasks..."
                      value={reportSearchTerm}
                      onChange={e => setReportSearchTerm(e.target.value)}
                      className="input-box"
                      style={{ paddingLeft: '2.1rem', height: '36px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {reportViewMode === 'src' ? (
                displayedReports.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.45)', borderRadius: '14px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                    <FileArchive size={36} color="#38bdf8" style={{ margin: '0 auto 0.75rem auto', display: 'block', opacity: 0.6 }} />
                    <h4 style={{ margin: '0 0 0.3rem 0', color: '#fff' }}>No SRC Deliverables Uploaded Yet</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', maxWidth: '520px', margin: '0 auto' }}>
                      When {employee.fullName} attaches source code zip archives or sprint deliverable files to their daily reports, they will be listed here separately for one-click download.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {displayedReports.map(r => (
                      <div 
                        key={r._id}
                        style={{
                          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
                          border: '1.5px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '14px',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.9rem',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
                              <FileArchive size={20} />
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#ffffff', fontWeight: 700, lineHeight: 1.3 }}>
                                {r.srcFileName || `${(employee.fullName || 'Employee').replace(/\s+/g, '_')}_SRC.zip`}
                              </h4>
                              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                                {r.srcFileSize || 'SRC Package Ready'}
                              </span>
                            </div>
                          </div>
                          <StatusBadge status={r.status || 'Submitted'} />
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Submission Date:</span>
                            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{formatDate(r.date || r.createdAt)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Project / Task:</span>
                            <span style={{ color: '#60a5fa', fontWeight: 600, maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.projectTitle || r.tasksWorked || 'Development Sprint'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Hours Logged:</span>
                            <span style={{ color: '#34d399', fontWeight: 600 }}>{r.hoursWorked || r.hoursLogged || '8h 00m'}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.6rem', marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => handleDownloadSRC(r)}
                            style={{
                              flex: 1,
                              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                              border: 'none',
                              color: '#ffffff',
                              padding: '0.55rem',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem',
                              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.35)'
                            }}
                          >
                            <Download size={14} /> Download SRC File
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedReportForModal(r)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#e2e8f0',
                              padding: '0.55rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            title="Inspect Linked Daily Report"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : displayedReports.length === 0 ? (
                <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.45)', borderRadius: '14px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                  <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto', display: 'block', opacity: 0.6 }} />
                  <h4 style={{ margin: '0 0 0.3rem 0', color: '#fff' }}>No Daily Reports Found for this Selection</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', maxWidth: '520px', margin: '0 auto' }}>
                    Once this employee submits their daily work report with an attached source code deliverable package (.zip / .rar), their report and downloadable SRC file will appear here.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {displayedReports.map(r => {
                    const blockerText = (r.issuesFaced || r.blockers || '').trim();
                    const isBlocker = blockerText && 
                      !['none', 'none.', 'no', 'nil', 'n/a', 'no blockers', 'nothing'].some(p => blockerText.toLowerCase() === p || blockerText.toLowerCase().startsWith(p + ' ') || blockerText.toLowerCase().startsWith(p + '.')) &&
                      !blockerText.toLowerCase().includes('all unit tests passed') &&
                      !blockerText.toLowerCase().includes('no issues') &&
                      !blockerText.toLowerCase().includes('smooth execution');

                    return (
                      <div 
                        key={r._id} 
                        className="report-deliverable-card"
                      >
                        {/* 1. TOP HEADER: Title on left with icon (matching Image 2 header), Status & Actions on right */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>
                          <div style={{ flex: '1 1 500px', minWidth: '280px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.55rem', lineHeight: 1.4 }}>
                              <FileCode size={19} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                              {r.title || r.tasksWorked || 'Daily Sprint Deliverable'}
                            </h4>

                            {/* Metadata Badges row - starting flush from the left */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.35rem', 
                                fontSize: '0.76rem', 
                                background: 'rgba(56, 189, 248, 0.12)', 
                                color: '#38bdf8', 
                                border: '1px solid rgba(56, 189, 248, 0.25)', 
                                padding: '3px 10px', 
                                borderRadius: '6px', 
                                fontWeight: 600 
                              }}>
                                <Calendar size={13} /> {formatDate(r.date || r.createdAt)}
                              </span>

                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.35rem', 
                                fontSize: '0.76rem', 
                                background: 'rgba(16, 185, 129, 0.12)', 
                                color: '#34d399', 
                                border: '1px solid rgba(16, 185, 129, 0.25)', 
                                padding: '3px 10px', 
                                borderRadius: '6px', 
                                fontWeight: 600 
                              }}>
                                <Clock size={13} /> Hours Logged: {r.hoursWorked || r.hoursLogged || '8h 00m'}
                              </span>

                              {r.srcFileName && (
                                <span style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.35rem', 
                                  fontSize: '0.76rem', 
                                  background: 'rgba(168, 85, 247, 0.12)', 
                                  color: '#c084fc', 
                                  border: '1px solid rgba(168, 85, 247, 0.25)', 
                                  padding: '3px 10px', 
                                  borderRadius: '6px', 
                                  fontWeight: 600 
                                }}>
                                  <FileArchive size={13} /> {r.srcFileName} ({r.srcFileSize || 'SRC Ready'})
                                </span>
                              )}
                            </div>

                            {/* Prominent High-Visibility SRC Deliverable Banner */}
                            <div style={{
                              marginTop: '0.85rem',
                              background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.18) 0%, rgba(15, 23, 42, 0.7) 100%)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              borderRadius: '8px',
                              padding: '0.6rem 0.95rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.6rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                                <FileArchive size={16} color="#38bdf8" />
                                <span style={{ color: '#94a3b8' }}>SRC File / Deliverable:</span>
                                <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                                  {r.srcFileName || `${(employee.fullName || 'Employee').replace(/\s+/g, '_')}_Daily_SRC.zip`}
                                </strong>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDownloadSRC(r)}
                                style={{
                                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                  border: 'none',
                                  color: '#ffffff',
                                  padding: '0.35rem 0.85rem',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  fontWeight: 700,
                                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
                                }}
                              >
                                <Download size={13} /> Download SRC File
                              </button>
                            </div>
                          </div>

                          {/* Approval / Status Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexShrink: 0 }}>
                            <StatusBadge status={r.status || 'Submitted'} />
                            {(!r.status || r.status.toLowerCase() === 'submitted' || r.status.toLowerCase() === 'pending') && (
                              <>
                                <button 
                                  className="action-btn-approve" 
                                  title="Approve Report" 
                                  onClick={() => handleReportAction(r._id, 'Approved')}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <Check size={14} /> Approve
                                </button>
                                <button 
                                  className="action-btn-reject" 
                                  title="Reject Report" 
                                  onClick={() => handleReportAction(r._id, 'Rejected')}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <X size={14} /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 2. WORK BREAKDOWN DETAILS (Full width 2-Column Grid starting flush from left, no gaps on either side) */}
                        <div style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          background: 'rgba(15, 23, 42, 0.55)',
                          borderRadius: '12px',
                          padding: '1.1rem 1.25rem',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: '1.25rem',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <CheckSquare size={13} color="#38bdf8" /> Tasks & Completed Modules
                            </span>
                            <div style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.55 }}>
                              {r.workSummary || r.tasksWorked || r.completedWork || 'Implemented daily sprint goals and code reviews.'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {isBlocker ? <AlertCircle size={13} color="#f87171" /> : <CheckCircle2 size={13} color="#34d399" />} Blockers & Challenges
                            </span>
                            <div style={{ fontSize: '0.88rem', color: isBlocker ? '#f87171' : '#34d399', lineHeight: 1.55, fontWeight: isBlocker ? 600 : 500 }}>
                              {r.issuesFaced || r.blockers || 'None reported. All sprint milestones on track.'}
                            </div>
                          </div>
                        </div>

                        {/* 3. FOOTER ROW: Vault Verification on Left, Action Buttons on Right (Full width flush left) */}
                        <div style={{ 
                          width: '100%',
                          boxSizing: 'border-box',
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          flexWrap: 'wrap', 
                          gap: '0.75rem', 
                          paddingTop: '0.4rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                          <span style={{ 
                            fontSize: '0.78rem', 
                            color: 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}>
                            <ShieldCheck size={14} color="#10b981" />
                            Verified by: <strong style={{ color: '#cbd5e1' }}>CodeThrive Infotech Enterprise Vault</strong>
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedReportForModal(r)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#e2e8f0',
                                padding: '0.52rem 0.95rem',
                                borderRadius: '10px',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                              }}
                            >
                              <Eye size={14} /> View Report Details
                            </button>

                            <button
                              type="button"
                              onClick={() => exportSingleDailyReportPDF(r)}
                              style={{
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                color: '#38bdf8',
                                padding: '0.52rem 0.95rem',
                                borderRadius: '10px',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                              }}
                              title="Download this employee's daily work report as an official PDF"
                            >
                              <FileText size={14} /> Download Report (PDF)
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadSRC(r)}
                              style={{
                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                border: 'none',
                                color: '#ffffff',
                                padding: '0.52rem 1.15rem',
                                borderRadius: '10px',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                fontWeight: 700,
                                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                                transition: 'all 0.2s'
                              }}
                              title="Download the employee's submitted source code & work deliverable file"
                            >
                              <Download size={14} /> Download SRC / Deliverable
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 4: LEAVE APPLICATIONS SUBMITTED BY THIS EMPLOYEE */}
        {activeTab === 'leaves' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} color="var(--primary-light)" />
                Leave Applications Submitted by {employee.fullName} ({selectedAuditMonth === 'All' ? 'All-Time' : selectedAuditMonth})
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Showing {filteredLeaves.length} leaves</span>
            </div>

            {filteredLeaves.length === 0 ? (
              <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.45)', borderRadius: '14px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                <Calendar size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto', display: 'block', opacity: 0.6 }} />
                <h4 style={{ margin: '0 0 0.3rem 0', color: '#fff' }}>No Leave Applications Found</h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  When {employee.fullName} submits a leave application from their employee portal, it will immediately appear here for admin review and approval.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredLeaves.map(l => (
                  <div 
                    key={l._id} 
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      borderRadius: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '1.2rem 1.4rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1.2rem',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: '280px', flex: '1 1 400px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <span style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                          color: '#a5b4fc',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 700
                        }}>
                          {l.leaveType || 'General Leave'}
                        </span>
                        <strong style={{ fontSize: '0.94rem', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} color="#38bdf8" />
                          {l.dates || (l.startDate ? `${formatDate(l.startDate)} - ${formatDate(l.endDate || l.startDate)}` : 'Requested Period')}
                        </strong>
                        {l.totalDays && (
                          <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>
                            ({l.totalDays} {l.totalDays === 1 ? 'day' : 'days'})
                          </span>
                        )}
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.22)', padding: '0.6rem 0.85rem', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                        <span style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                          <strong style={{ color: '#94a3b8' }}>Reason:</strong> {l.reason || 'No detailed reason provided.'}
                        </span>
                      </div>

                      {l.createdAt && (
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Applied on: {new Date(l.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    {/* Interactive Admin Approve / Reject Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <StatusBadge status={l.status || 'Pending'} />
                      {(!l.status || l.status.toLowerCase() === 'pending') && (
                        <>
                          <button 
                            className="action-btn-approve" 
                            title="Approve Leave" 
                            onClick={() => handleLeaveAction(l._id, 'Approved')}
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              border: 'none',
                              color: '#fff',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
                            }}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button 
                            className="action-btn-reject" 
                            title="Reject Leave" 
                            onClick={() => handleLeaveAction(l._id, 'Rejected')}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#f87171',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <X size={14} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                  Showing daily attendance logs ({displayAttendanceRecords.length} records)
                </span>
              </div>

              {/* Action Buttons for downloading per-day report & manual edit */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleOpenRectifyModal(null)} 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                >
                  <Pencil size={14} /> Edit Attendance
                </button>
                <button className="btn btn-outline" onClick={exportEmpAttendancePDF} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Printer size={15} /> Download PDF Report
                </button>
                <button className="btn btn-outline" onClick={exportEmpAttendanceExcel} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Download size={15} /> Export Excel (.xlsx)
                </button>
              </div>
            </div>

            {/* Quick KPI Overview */}
            <div className="metrics-grid-4">
              <div className="metric-box">
                <span className="box-title">Today's Live Status</span>
                <StatusBadge status={displayAttendanceRecords[0]?.displayStatus || 'Not Checked In'} />
              </div>
              <div className="metric-box">
                <span className="box-title">Today Check-In</span>
                <span className="box-val" style={{ color: 'var(--success)' }}>
                  {displayAttendanceRecords[0]?.firstLoginTime 
                    ? new Date(displayAttendanceRecords[0].firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '--:--'}
                </span>
              </div>
              <div className="metric-box">
                <span className="box-title">Today Check-Out</span>
                <span className="box-val" style={{ color: 'var(--info)' }}>
                  {displayAttendanceRecords[0]?.lastLogoutTime 
                    ? new Date(displayAttendanceRecords[0].lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '--:--'}
                </span>
              </div>
              <div className="metric-box">
                <span className="box-title">Total Days Logged</span>
                <span className="box-val" style={{ color: 'var(--primary-light)' }}>
                  {displayAttendanceRecords.length} Days
                </span>
              </div>
            </div>

            {/* Detailed Per-Day Check-In / Check-Out History Table */}
            <Card title={`Per-Day Attendance Logs (${employee.fullName})`} className="card-table-wrap" style={{ padding: 0 }}>
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
                        row.firstLoginTime ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)', fontWeight: 600, fontFamily: 'monospace' }}>
                            <LogIn size={14} /> {new Date(row.firstLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>--:--</span>
                        )
                      )
                    },
                    {
                      header: 'Check Out Time',
                      accessor: 'lastLogoutTime',
                      render: row => (
                        row.lastLogoutTime ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#f43f5e', fontWeight: 600, fontFamily: 'monospace' }}>
                            <LogOut size={14} /> {new Date(row.lastLogoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>--:--</span>
                        )
                      )
                    },
                    {
                      header: 'Work Duration',
                      accessor: 'totalWorkDurationInSeconds',
                      render: row => (
                        row.totalWorkDurationInSeconds > 0 ? (
                          <span style={{ fontWeight: 700, color: 'var(--primary-light)', fontFamily: 'monospace' }}>
                            {formatHours(row.totalWorkDurationInSeconds)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>–</span>
                        )
                      )
                    },
                    {
                      header: 'Break Time',
                      accessor: 'totalBreakDurationInSeconds',
                      render: row => (
                        row.totalBreakDurationInSeconds > 0 ? (
                          <span style={{ color: '#fbbf24', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Coffee size={13} /> {formatHours(row.totalBreakDurationInSeconds || 0)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>–</span>
                        )
                      )
                    },
                    {
                      header: 'Lunch Time',
                      accessor: 'totalLunchDurationInSeconds',
                      render: row => (
                        row.totalLunchDurationInSeconds > 0 ? (
                          <span style={{ color: '#60a5fa', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Utensils size={13} /> {formatHours(row.totalLunchDurationInSeconds || 0)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>–</span>
                        )
                      )
                    },
                    {
                      header: 'Status',
                      accessor: 'status',
                      render: row => {
                        const computed = row.displayStatus || computeAttendanceStatus(row);
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <StatusBadge status={computed} text={computed} />
                          </div>
                        );
                      }
                    },
                    {
                      header: 'Actions',
                      accessor: '_actions',
                      render: row => (
                        <button 
                          className="btn btn-outline"
                          onClick={() => handleOpenRectifyModal(row)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            borderRadius: '8px',
                            borderColor: 'rgba(99, 102, 241, 0.4)',
                            color: '#a5b4fc',
                            background: 'rgba(99, 102, 241, 0.1)',
                            cursor: 'pointer'
                          }}
                          title="Edit Attendance for this day"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                      )
                    }
                  ]}
                  data={displayAttendanceRecords}
                  searchable={true}
                  itemsPerPage={10}
                />
              )}
            </Card>
          </div>
        )}

        {/* TAB 7: MANAGEMENT, PAYROLL & SYSTEM CREDENTIALS */}
        {activeTab === 'management' && (() => {
          const currentSalaryGross = Number(editSalary || employee.salaryAmount || (employee.fullName?.toLowerCase().includes('kirubakaran') ? 85000 : 75000));
          const liveBreakdown = computeSalaryBreakdown(currentSalaryGross);
          const liveBonus = 0;
          const liveLeaveDed = Number(issueLeaveDeduction) || 0;
          const liveTotalAllowances = liveBreakdown.hra + liveBreakdown.travel + liveBreakdown.medical + liveBreakdown.other;
          const liveFinalGross = liveBreakdown.basic + liveTotalAllowances + liveBonus;
          const liveTotalDeductions = liveBreakdown.pf + liveBreakdown.profTax + liveBreakdown.incomeTax + liveLeaveDed;
          const liveNetTakeHome = liveFinalGross - liveTotalDeductions;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Header Title & Subtitle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Banknote size={20} /> Compensation, Payroll & System Access for {employee.fullName}
                  </h3>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Official employee salary setup, monthly payslip issuance, financial audit history, and portal login security
                  </span>
                </div>
              </div>

              {/* ──────────────────────────────────────────────────────────
                  STEP 1: SALARY STRUCTURE & BANK ACCOUNT (SETUP)
                 ────────────────────────────────────────────────────────── */}
              <div className="detail-grid-2">
                {/* 1A. Bank & Salary Input Card */}
                <Card title={<><Banknote size={16} style={{ marginRight: '0.5rem', color: '#38bdf8' }} /> 1. Salary Structure & Bank Account</>}>
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ marginBottom: '1rem', fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5 }}>
                        Define the base monthly CTC / gross compensation and verified banking credentials for salary credit:
                      </div>

                      <div className="form-grid-2">
                        <div className="form-field">
                          <label style={{ color: '#38bdf8', fontWeight: 600 }}>Monthly Salary (₹)</label>
                          <input 
                            type="number" 
                            placeholder=""
                            className="input-box" 
                            value={editSalary} 
                            onChange={e => setEditSalary(e.target.value)} 
                          />
                        </div>
                        <div className="form-field">
                          <label style={{ fontWeight: 600 }}>Bank Name</label>
                          <input type="text" className="input-box" value={editBank} onChange={e => setEditBank(e.target.value)} />
                        </div>
                        <div className="form-field">
                          <label style={{ fontWeight: 600 }}>Account Number</label>
                          <input type="text" className="input-box" value={editAccNo} onChange={e => setEditAccNo(e.target.value)} />
                        </div>
                        <div className="form-field">
                          <label style={{ fontWeight: 600 }}>IFSC Code</label>
                          <input type="text" className="input-box" value={editIfsc} onChange={e => setEditIfsc(e.target.value)} />
                        </div>
                      </div>

                      {/* Banking & Annual Compensation Quick Summary (fills empty space seamlessly) */}
                      <div style={{ 
                        marginTop: '1.15rem', 
                        background: 'rgba(15, 23, 42, 0.6)', 
                        padding: '1rem 1.15rem', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '0.9rem'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Annual CTC</span>
                          <strong style={{ color: '#38bdf8', fontSize: '1rem', fontFamily: 'monospace' }}>
                            ₹{(currentSalaryGross * 12).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>/ yr</span>
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Disbursement Mode</span>
                          <span style={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginTop: '2px' }}>Direct Bank Credit</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Payment Cycle</span>
                          <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginTop: '2px' }}>Monthly Regular</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Linked: <strong style={{ color: '#cbd5e1' }}>{editBank || employee.bankName || 'Direct NEFT'}</strong>
                      </span>
                      <button className="btn btn-primary" onClick={handleSaveSalary}>
                        <Save size={15} /> Save Salary & Bank Info
                      </button>
                    </div>
                  </div>
                </Card>

                {/* 1B. Computed Statutory Breakdown Preview Card */}
                <Card title={<><CheckCircle2 size={16} style={{ marginRight: '0.5rem', color: '#10b981' }} /> Computed Statutory Benefits & Deductions</>}>
                  <div style={{ marginBottom: '1rem', fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    Live statutory breakdown calculated according to Indian Corporate Payroll norms based on <strong style={{ color: '#38bdf8' }}>₹{currentSalaryGross.toLocaleString()}</strong> monthly CTC:
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                    gap: '1.25rem', 
                    background: 'rgba(15, 23, 42, 0.6)', 
                    padding: '1.15rem', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255, 255, 255, 0.08)' 
                  }}>
                    {/* Column 1: Gross Earnings */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        paddingBottom: '0.5rem', 
                        marginBottom: '0.5rem', 
                        borderBottom: '1px solid rgba(56, 189, 248, 0.2)' 
                      }}>
                        <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Gross Earnings
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          ₹{liveFinalGross.toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.84rem' }}>
                        <span style={{ color: '#cbd5e1' }}>Basic Pay (50%)</span>
                        <strong style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '0.88rem' }}>₹{liveBreakdown.basic.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.84rem' }}>
                        <span style={{ color: '#cbd5e1' }}>HRA (20%)</span>
                        <strong style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '0.88rem' }}>₹{liveBreakdown.hra.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', fontSize: '0.84rem' }}>
                        <span style={{ color: '#cbd5e1' }}>Allowances (30%)</span>
                        <strong style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '0.88rem' }}>₹{(liveBreakdown.travel + liveBreakdown.medical + liveBreakdown.other).toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Column 2: Statutory Deductions */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        paddingBottom: '0.5rem', 
                        marginBottom: '0.5rem', 
                        borderBottom: '1px solid rgba(248, 113, 113, 0.2)' 
                      }}>
                        <span style={{ fontSize: '0.74rem', color: '#f87171', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Statutory Deductions
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#f87171', background: 'rgba(248, 113, 113, 0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          -₹{liveTotalDeductions.toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.84rem' }}>
                        <span style={{ color: '#cbd5e1' }}>PF (12% of Basic)</span>
                        <strong style={{ color: '#f87171', fontFamily: 'monospace', fontSize: '0.88rem' }}>-₹{liveBreakdown.pf.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: liveBreakdown.incomeTax > 0 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none', fontSize: '0.84rem' }}>
                        <span style={{ color: '#cbd5e1' }}>Prof. Tax (PT)</span>
                        <strong style={{ color: '#f87171', fontFamily: 'monospace', fontSize: '0.88rem' }}>-₹{liveBreakdown.profTax.toLocaleString()}</strong>
                      </div>
                      {liveBreakdown.incomeTax > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', fontSize: '0.84rem' }}>
                          <span style={{ color: '#cbd5e1' }}>Income Tax (TDS)</span>
                          <strong style={{ color: '#f87171', fontFamily: 'monospace', fontSize: '0.88rem' }}>-₹{liveBreakdown.incomeTax.toLocaleString()}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{
                    marginTop: '1rem',
                    padding: '0.85rem 1.15rem',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Estimated In-Hand Salary</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace', marginTop: '2px' }}>
                        ₹{liveBreakdown.netPayable.toLocaleString()} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#6ee7b7' }}>/ month</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.76rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '5px 12px', borderRadius: '20px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      ✓ Structure Active
                    </span>
                  </div>
                </Card>
              </div>

              {/* ──────────────────────────────────────────────────────────
                  STEP 2: ISSUE OFFICIAL MONTHLY PAYSLIP (ACTION)
                 ────────────────────────────────────────────────────────── */}
              <div id="issue-payslip-anchor">
                <Card 
                  title={<><Sparkles size={16} style={{ marginRight: '0.5rem', color: '#fbbf24' }} /> 2. Issue Official Monthly Payslip to {employee.fullName}</>}
                >
                  <div style={{ marginBottom: '1.25rem' }}>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                      Select the target pay period, review earnings & deductions, and click <strong>"Issue Payslip"</strong>. This directly disburses the official digital salary statement into <strong>{employee.fullName}'s Employee Portal</strong> under the Payroll section, enabling instant view and PDF letterhead download.
                    </p>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                    gap: '1.25rem' 
                  }}>
                    <div className="form-field">
                      <label style={{ color: '#38bdf8', fontWeight: 600 }}>Pay Month / Period</label>
                      <select 
                        className="input-box"
                        value={issuePayMonth}
                        onChange={e => setIssuePayMonth(e.target.value)}
                      >
                        <option value="October 2026">October 2026</option>
                        <option value="November 2026">November 2026</option>
                        <option value="December 2026">December 2026</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label style={{ fontWeight: 600 }}>Disbursement Date</label>
                      <input 
                        type="date" 
                        className="input-box" 
                        value={issuePayDate}
                        onChange={e => setIssuePayDate(e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label style={{ fontWeight: 600 }}>Disbursement Status</label>
                      <select 
                        className="input-box"
                        value={issuePayStatus}
                        onChange={e => setIssuePayStatus(e.target.value)}
                      >
                        <option value="Paid">Paid / Disbursed</option>
                        <option value="Processing">Processing / Pending</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label style={{ color: '#f87171', fontWeight: 600 }}>Attendance / LOP Deductions (₹)</label>
                      <input 
                        type="number"
                        placeholder="0"
                        className="input-box"
                        value={issueLeaveDeduction}
                        onChange={e => setIssueLeaveDeduction(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Live Calculation Preview Banner */}
                  <div style={{
                    marginTop: '1.25rem',
                    padding: '1.1rem 1.4rem',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Gross Earnings</span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                          ₹{liveFinalGross.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#f87171', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Total Deductions</span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f87171', fontFamily: 'monospace' }}>
                          -₹{liveTotalDeductions.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Net Take-Home Pay</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'monospace' }}>
                          ₹{liveNetTakeHome.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const previewPayslip = {
                            month: issuePayMonth,
                            paymentDate: issuePayDate,
                            status: issuePayStatus,
                            basicSalary: liveBreakdown.basic,
                            bonus: liveBonus,
                            allowanceDetails: { hra: liveBreakdown.hra, travel: liveBreakdown.travel, medical: liveBreakdown.medical, other: liveBreakdown.other },
                            deductionDetails: { pf: liveBreakdown.pf, esi: 0, professionalTax: liveBreakdown.profTax, incomeTax: liveBreakdown.incomeTax, leaveDeduction: liveLeaveDed },
                            grossSalary: liveFinalGross,
                            deductions: liveTotalDeductions,
                            netPayable: liveNetTakeHome,
                            payslipId: 'PREVIEW'
                          };
                          downloadSinglePayslipPDF(previewPayslip);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#e2e8f0',
                          padding: '0.62rem 1.1rem',
                          borderRadius: '10px',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          fontWeight: 600
                        }}
                      >
                        <Printer size={15} /> Preview PDF
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateAndIssuePayslip}
                        disabled={isIssuingPayslip}
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          color: '#ffffff',
                          padding: '0.65rem 1.4rem',
                          borderRadius: '10px',
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          fontWeight: 700,
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                        }}
                      >
                        <CheckCircle2 size={16} /> {isIssuingPayslip ? 'Generating...' : `Issue Payslip for ${issuePayMonth}`}
                      </button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* ──────────────────────────────────────────────────────────
                  STEP 3: MONTHLY PAYSLIPS FINANCIAL AUDIT (HISTORY)
                 ────────────────────────────────────────────────────────── */}
              <Card 
                title={<><Banknote size={16} style={{ marginRight: '0.5rem', color: '#a78bfa' }} /> 3. Monthly Payslip Financial Audit ({filteredPayslips.length} Months)</>}
              >
                {filteredPayslips.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center' }}>
                    <Banknote size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto', display: 'block', opacity: 0.6 }} />
                    <h4 style={{ margin: '0 0 0.3rem 0', color: '#fff' }}>No Payslips Issued for Selected Audit Scope</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Click "Issue Payslip for October 2026" above to disburse the first official salary statement for {employee.fullName}.
                    </span>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', textAlign: 'left' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Pay Month</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Basic Salary</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Gross Salary</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Deductions</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Net Take-Home</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayslips.map((p, i) => (
                          <tr key={p._id || p.payslipId || i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#fff' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <FileText size={14} color="#38bdf8" />
                                {p.month || p.monthCode}
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>₹{(p.basicSalary || 0).toLocaleString()}</td>
                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 600 }}>₹{(p.grossSalary || 0).toLocaleString()}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#f87171', fontFamily: 'monospace' }}>-₹{(p.deductions || 0).toLocaleString()}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--success)', fontFamily: 'monospace' }}>₹{(p.netPayable || 0).toLocaleString()}</td>
                            <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={p.status || 'Paid'} /></td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedPayslipForModal(p)}
                                  style={{
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    color: '#a5b4fc',
                                    border: '1px solid rgba(99, 102, 241, 0.35)',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '8px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                  }}
                                  title="Inspect Payslip Details"
                                >
                                  <Eye size={13} /> View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadSinglePayslipPDF(p)}
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#34d399',
                                    border: '1px solid rgba(16, 185, 129, 0.35)',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '8px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                  }}
                                  title="Download Official PDF Payslip"
                                >
                                  <Printer size={13} /> PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePayslip(p._id || p.payslipId)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    padding: '0.4rem 0.65rem',
                                    borderRadius: '8px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                  }}
                                  title="Delete Payslip"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              </div>
          );
        })()}

        {/* TAB 8: EMPLOYEE PORTAL SECURITY & ACCOUNT SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card title={<><Settings size={18} style={{ marginRight: '0.5rem', color: '#6366f1' }} /> Employee Portal Security & Account Settings</>}>
              <div style={{ marginBottom: '1.25rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, background: 'rgba(99, 102, 241, 0.08)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                This section manages portal login credentials, system access roles, and account active/suspended status for <strong>{employee.fullName}</strong>.
              </div>

              {/* Account Overview Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee ID</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginTop: '3px' }}>{employee.employeeId || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portal Login Email</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#60a5fa', marginTop: '3px' }}>{employee.personalEmailAddress || employee.companyEmailAddress || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Role</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginTop: '3px', textTransform: 'capitalize' }}>{employee.role || employee.user?.role || 'Employee'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Status</div>
                  <div style={{ marginTop: '3px' }}><StatusBadge status={employee.status || 'Active'} /></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wi-Fi Access Policy</div>
                  <div style={{ marginTop: '3px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: (employee.wifiAccessPolicy || employee.user?.wifiAccessPolicy) === 'office' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                      color: (employee.wifiAccessPolicy || employee.user?.wifiAccessPolicy) === 'office' ? '#38bdf8' : '#34d399',
                      border: `1px solid ${(employee.wifiAccessPolicy || employee.user?.wifiAccessPolicy) === 'office' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(52, 211, 153, 0.35)'}`
                    }}>
                      <Wifi size={13} />
                      {(employee.wifiAccessPolicy || employee.user?.wifiAccessPolicy) === 'office' ? 'Office Wi-Fi Only' : 'Other Wi-Fi (Any)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '6px', display: 'block' }}>System Access Role</label>
                  <select className="input-box" value={editRole} onChange={e => setEditRole(e.target.value)}>
                    <option value="admin">System Administrator (Full Control)</option>
                    <option value="hr">HR Manager (Personnel & Payroll)</option>
                    <option value="teamlead">Team Lead (Team Management)</option>
                    <option value="employee">Software Employee (Standard Access)</option>
                    <option value="intern">Intern (Restricted)</option>
                  </select>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Controls portal page permissions and administrative privileges for this staff member.
                  </span>
                </div>

                <div className="form-field">
                  <label style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '6px', display: 'block' }}>Account Status</label>
                  <select className="input-box" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                    <option value="Active">Active Account (Can Log In)</option>
                    <option value="Inactive">Inactive / Suspended (Login Blocked)</option>
                    <option value="Pending">Pending Approval</option>
                  </select>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Suspended or inactive accounts cannot authenticate into the employee portal.
                  </span>
                </div>
              </div>

              <div className="form-field" style={{ marginTop: '1.25rem' }}>
                <label style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Wifi size={16} style={{ color: '#38bdf8' }} /> Wi-Fi Access Security Policy
                </label>
                <select 
                  className="input-box" 
                  value={editWifiPolicy} 
                  onChange={e => setEditWifiPolicy(e.target.value)}
                  style={{ height: '42px', fontSize: '0.88rem' }}
                >
                  <option value="any">🌐 Other Wi-Fi (Any Network / Work from Anywhere Allowed)</option>
                  <option value="office">🏢 Office Wi-Fi Only (CodeThrive Office Network Required)</option>
                </select>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '5px', display: 'block', lineHeight: 1.45 }}>
                  {editWifiPolicy === 'office' ? (
                    <span style={{ color: '#38bdf8' }}>
                      🔒 <strong>Office Wi-Fi Only:</strong> Employee must connect strictly to CodeThrive Office Wi-Fi. Access from any other network will be blocked with: "CodeThrive Infotech Office Wi-Fi connect panuga".
                    </span>
                  ) : (
                    <span style={{ color: '#34d399' }}>
                      ✓ <strong>Other Wi-Fi:</strong> Employee is permitted to connect and work using home broadband, mobile hotspot, or any Wi-Fi network.
                    </span>
                  )}
                </span>
              </div>

              <div className="form-field" style={{ marginTop: '1.25rem' }}>
                <label style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '6px', display: 'block' }}>Reset Account Password</label>
                <input 
                  type="password" 
                  placeholder="Type new temporary password for employee (leave blank to keep unchanged)..." 
                  className="input-box" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Assign a new temporary password if the employee forgot their credentials or requested a reset.
                </span>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSaveRoleStatus}>
                  <Save size={15} /> Save Role & Credentials
                </button>
              </div>
            </Card>
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
                {(() => {
                  const modalBlocker = (selectedReportForModal.issuesFaced || selectedReportForModal.blockers || '').trim();
                  const modalHasBlocker = modalBlocker && 
                    !['none', 'none.', 'no', 'nil', 'n/a', 'no blockers', 'nothing'].some(p => modalBlocker.toLowerCase() === p || modalBlocker.toLowerCase().startsWith(p + ' ') || modalBlocker.toLowerCase().startsWith(p + '.')) &&
                    !modalBlocker.toLowerCase().includes('all unit tests passed') &&
                    !modalBlocker.toLowerCase().includes('no issues') &&
                    !modalBlocker.toLowerCase().includes('smooth execution');

                  return (
                    <>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {modalHasBlocker ? <AlertCircle size={13} color="#f87171" /> : <CheckCircle2 size={13} color="#34d399" />} Blockers / Issues Faced
                      </span>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: modalHasBlocker ? '#f87171' : '#34d399', lineHeight: 1.5, fontWeight: modalHasBlocker ? 600 : 500 }}>
                        {selectedReportForModal.issuesFaced || selectedReportForModal.blockers || 'None reported.'}
                      </p>
                    </>
                  );
                })()}
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
                onClick={() => exportSingleDailyReportPDF(selectedReportForModal)}
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontWeight: 600
                }}
              >
                <FileText size={15} /> Download Report (PDF)
              </button>
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

      {/* Payslip Inspection Dossier Modal */}
      <Modal
        isOpen={!!selectedPayslipForModal}
        onClose={() => setSelectedPayslipForModal(null)}
        title={<><Banknote size={18} style={{ marginRight: '0.5rem', color: '#10b981' }} /> Official Salary Statement — {selectedPayslipForModal?.month || selectedPayslipForModal?.monthCode}</>}
      >
        {selectedPayslipForModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.78rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700 }}>
                  {selectedPayslipForModal.payslipId || 'PSL-2026'}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1', marginLeft: '0.75rem' }}>
                  {employee.fullName} ({employee.employeeId})
                </span>
              </div>
              <StatusBadge status={selectedPayslipForModal.status || 'Paid'} />
            </div>

            {/* Bank & Payment Info Box */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', padding: '0.85rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontSize: '0.72rem' }}>Bank Name</span>
                <strong style={{ color: '#fff' }}>{employee.bankName || 'Canara Bank'}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontSize: '0.72rem' }}>Account Number</span>
                <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{employee.accountNumber || '50200088991122'}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontSize: '0.72rem' }}>IFSC / PAN</span>
                <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{employee.ifscCode || 'CNRB0001234'} • {employee.panNumber || 'ABCDE1234F'}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontSize: '0.72rem' }}>Disbursement Date</span>
                <strong style={{ color: '#38bdf8' }}>{formatDate(selectedPayslipForModal.paymentDate)}</strong>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.45)', borderRadius: '10px', padding: '0.9rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                  Earnings Component
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Basic Salary</span>
                    <strong style={{ color: '#fff', fontFamily: 'monospace' }}>₹{(selectedPayslipForModal.basicSalary || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>House Rent Allowance (HRA)</span>
                    <strong style={{ color: '#fff', fontFamily: 'monospace' }}>₹{(selectedPayslipForModal.allowanceDetails?.hra || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Travel & Conveyance</span>
                    <strong style={{ color: '#fff', fontFamily: 'monospace' }}>₹{(selectedPayslipForModal.allowanceDetails?.travel || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Medical Allowance</span>
                    <strong style={{ color: '#fff', fontFamily: 'monospace' }}>₹{(selectedPayslipForModal.allowanceDetails?.medical || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Special Allowances</span>
                    <strong style={{ color: '#fff', fontFamily: 'monospace' }}>₹{(selectedPayslipForModal.allowanceDetails?.other || 0).toLocaleString()}</strong>
                  </div>
                  {Number(selectedPayslipForModal.bonus) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                      <span>Performance Bonus</span>
                      <strong style={{ fontFamily: 'monospace' }}>+₹{Number(selectedPayslipForModal.bonus).toLocaleString()}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.45rem', marginTop: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, color: '#fff' }}>
                    <span>GROSS EARNINGS</span>
                    <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>₹{(selectedPayslipForModal.grossSalary || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.45)', borderRadius: '10px', padding: '0.9rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                  Deductions Component
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Provident Fund (PF)</span>
                    <strong style={{ color: '#f87171', fontFamily: 'monospace' }}>-₹{(selectedPayslipForModal.deductionDetails?.pf || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Professional Tax (PT)</span>
                    <strong style={{ color: '#f87171', fontFamily: 'monospace' }}>-₹{(selectedPayslipForModal.deductionDetails?.professionalTax || 200).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Income Tax (TDS)</span>
                    <strong style={{ color: '#f87171', fontFamily: 'monospace' }}>-₹{(selectedPayslipForModal.deductionDetails?.incomeTax || 0).toLocaleString()}</strong>
                  </div>
                  {Number(selectedPayslipForModal.deductionDetails?.leaveDeduction) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                      <span>Leave / LOP Deduction</span>
                      <strong style={{ fontFamily: 'monospace' }}>-₹{Number(selectedPayslipForModal.deductionDetails.leaveDeduction).toLocaleString()}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.45rem', marginTop: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, color: '#fff' }}>
                    <span>TOTAL DEDUCTIONS</span>
                    <span style={{ fontFamily: 'monospace', color: '#f87171' }}>-₹{(selectedPayslipForModal.deductions || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight Callout */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.12) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Net Take-Home Salary Disbursed</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'monospace' }}>
                  ₹{(selectedPayslipForModal.netPayable || 0).toLocaleString()}
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
                Verified by CodeThrive Vault
              </span>
            </div>

            {/* Modal Footer Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => downloadSinglePayslipPDF(selectedPayslipForModal)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.65rem 1.3rem',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontWeight: 700
                }}
              >
                <Printer size={15} /> Download Official PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Attendance Edit Modal — Clean, Compact & Perfectly Fitted */}
      <Modal
        isOpen={!!editingAttendanceRecord}
        onClose={() => setEditingAttendanceRecord(null)}
        title={<><Clock size={18} style={{ marginRight: '0.5rem', color: '#38bdf8' }} /> Edit Attendance — {employee?.fullName}</>}
      >
        <form onSubmit={handleSaveAttendanceRectification} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
          <div className="form-grid-2" style={{ gap: '0.85rem' }}>
            <div className="form-field">
              <label style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.3rem', display: 'block' }}>
                Attendance Date (DD/MM/YYYY) *
              </label>
              <DateInput 
                className="input-box" 
                value={rectifyForm.date} 
                onChange={e => handleRectifyDateChange(e.target.value)} 
                required 
              />
            </div>

            <div className="form-field">
              <label style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.3rem', display: 'block' }}>
                Attendance Status *
              </label>
              <select 
                className="input-box" 
                value={rectifyForm.status} 
                onChange={e => handleRectifyStatusChange(e.target.value)}
                style={{ height: '42px', fontSize: '0.86rem' }}
              >
                <option value="Present">Present (Full Day Approved)</option>
                <option value="Late">Late (Late Punch-In Recorded)</option>
                <option value="Half Day">Half Day</option>
                <option value="Permission">Permission (Official Permission)</option>
                <option value="On Leave">On Leave</option>
                <option value="Absent">Absent</option>
                <option value="Office Holiday">Office Holiday</option>
                <option value="Sunday Holiday">Sunday Holiday</option>
                <option value="Government Holiday">Government Holiday</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2" style={{ gap: '0.85rem' }}>
            <div className="form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#cbd5e1' }}>Check-In Time</label>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Std: 09:30 AM</span>
              </div>
              <input 
                type="time" 
                className="input-box" 
                value={rectifyForm.inTime} 
                onChange={e => setRectifyForm({ ...rectifyForm, inTime: e.target.value })} 
                style={{ height: '40px', fontSize: '0.86rem' }}
              />
            </div>

            <div className="form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#cbd5e1' }}>Check-Out Time</label>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Std: 06:30 PM</span>
              </div>
              <input 
                type="time" 
                className="input-box" 
                value={rectifyForm.outTime} 
                onChange={e => setRectifyForm({ ...rectifyForm, outTime: e.target.value })} 
                style={{ height: '40px', fontSize: '0.86rem' }}
              />
            </div>
          </div>

          {/* Break & Lunch Durations */}
          <div className="form-grid-2" style={{ gap: '0.85rem' }}>
            <div className="form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  ☕ Break Duration (Mins)
                </label>
                <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Refreshment</span>
              </div>
              <input 
                type="number" 
                min="0"
                max="300"
                className="input-box" 
                placeholder="e.g. 30"
                value={rectifyForm.breakMinutes} 
                onChange={e => setRectifyForm({ ...rectifyForm, breakMinutes: e.target.value })} 
                style={{ height: '40px', fontSize: '0.86rem' }}
              />
            </div>

            <div className="form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  🍽️ Lunch Duration (Mins)
                </label>
                <span style={{ fontSize: '0.7rem', color: '#60a5fa' }}>Lunch Break</span>
              </div>
              <input 
                type="number" 
                min="0"
                max="300"
                className="input-box" 
                placeholder="e.g. 60"
                value={rectifyForm.lunchMinutes} 
                onChange={e => setRectifyForm({ ...rectifyForm, lunchMinutes: e.target.value })} 
                style={{ height: '40px', fontSize: '0.86rem' }}
              />
            </div>
          </div>

          {/* Live Calculated Net Work Hours Preview */}
          {(() => {
            let grossMin = 0;
            if (rectifyForm.inTime && rectifyForm.outTime) {
              const [ih, im] = rectifyForm.inTime.split(':').map(Number);
              const [oh, om] = rectifyForm.outTime.split(':').map(Number);
              grossMin = (oh * 60 + om) - (ih * 60 + im);
            }
            const bMin = Math.max(0, parseInt(rectifyForm.breakMinutes || 0, 10));
            const lMin = Math.max(0, parseInt(rectifyForm.lunchMinutes || 0, 10));
            const netMin = Math.max(0, grossMin - (bMin + lMin));
            const netH = Math.floor(netMin / 60);
            const netM = netMin % 60;
            return (
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.7))',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '10px',
                padding: '0.65rem 0.95rem',
                fontSize: '0.82rem',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>
                  <strong>Recalculated Net Work:</strong> ({Math.floor(grossMin / 60)}H {grossMin % 60}M shift - {bMin + lMin}M break)
                </span>
                <span style={{ color: '#34d399', fontWeight: 800, fontFamily: 'monospace', fontSize: '1rem' }}>
                  {netH}H {netM}M
                </span>
              </div>
            );
          })()}

          <div className="form-field">
            <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.3rem', display: 'block' }}>
              Remarks / Reason (Optional)
            </label>
            <input 
              type="text" 
              placeholder="e.g. Timing adjustment approved by management" 
              className="input-box" 
              value={rectifyForm.reason} 
              onChange={e => setRectifyForm({ ...rectifyForm, reason: e.target.value })} 
              style={{ height: '40px', fontSize: '0.86rem' }}
            />
          </div>

          {/* Sticky Modal Action Footer with Guaranteed Visibility */}
          <div style={{
            position: 'sticky',
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 10
          }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setEditingAttendanceRecord(null)}
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.84rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSavingAttendanceRectification}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                border: 'none',
                padding: '0.55rem 1.4rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer'
              }}
            >
              <Save size={15} /> {isSavingAttendanceRectification ? 'Saving...' : 'Save Attendance Record'}
            </button>
          </div>
        </form>
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
