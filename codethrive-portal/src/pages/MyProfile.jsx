import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  UserCircle, Mail, Phone, MapPin,
  Briefcase, Shield, Camera, Edit3, GraduationCap,
  Sparkles, Trophy, CreditCard, Calendar,
  ShieldCheck, Zap, Landmark, CheckCircle2, Sliders,
  RotateCw, ZoomIn, Building2, Globe, Users
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import ContactActionModal, { openDirectEmail } from '../components/common/ContactActionModal';
import DateInput from '../components/common/DateInput';
import './MyProfile.css';

const MyProfile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [contactModal, setContactModal] = useState({ isOpen: false, name: '', phone: '' });
  const isAdminPath = window.location.pathname.startsWith('/admin');
  const isCompanyRoute = window.location.pathname.includes('/company') || window.location.pathname === '/admin/profile';
  const [activeProfileTab, setActiveProfileTab] = useState(isCompanyRoute ? 'company' : (isAdminPath ? 'company' : 'personal'));

  const [companyProfile, setCompanyProfile] = useState(() => {
    const defaultData = {
      companyName: 'CodeThrive Infotech Pvt Ltd',
      tagline: 'Enterprise Digital Transformation & Custom Software Solutions',
      registrationNumber: 'UDYAM-TN-2024-0012345',
      gstin: '33AABCC1234D1Z5',
      panNumber: 'AABCC1234D',
      foundedYear: '2024',
      employeeCount: '25+ Active Tech Specialists',
      officialEmail: 'contactcti@gmail.com',
      supportEmail: 'supportcti@gmail.com',
      officialPhone: '+91 78128 64905',
      headquarters: 'CodeThrive Works Tower, Level 4, Tech Park, Coimbatore, TN, India - 641035',
      website: 'https://codethrive.com',
      bankName: 'Canara Bank',
      accountNumber: '50200088991122',
      ifscCode: 'CNRB0001234',
      branchName: 'Tech Park Branch, Coimbatore',
      leadershipMembers: [
        { id: 1, name: 'Mahadhevan', title: 'Chief Executive Officer (CEO)', email: 'mahadhevancti@gmail.com', phone: '+91 97878 57769', role: 'CodeThrive Infotech' },
        { id: 2, name: 'Kirubakaran', title: 'Managing Director (MD)', email: 'kirubakarancti@gmail.com', phone: '+91 78128 64905', role: 'CodeThrive Infotech' },
        { id: 3, name: 'Priyavadhana', title: 'HR Operations Manager', email: 'priyavadhanacti@gmail.com', phone: '+91 94895 10499', role: 'HR Lead' },
        { id: 4, name: 'Priyanga Josephin', title: 'IT Team Lead', email: 'priyangacti@gmail.com', phone: '+91 99432 23938', role: 'Tech Lead' },
        { id: 5, name: 'Jidendran', title: 'IT Team Lead', email: 'jidendrancti@gmail.com', phone: '+91 87547 20031', role: 'Tech Lead' },
        { id: 6, name: 'Soundharya', title: 'Operations Lead (Non-IT)', email: 'soundharyacti@gmail.com', phone: '+91 70927 29025', role: 'Ops Lead' }
      ]
    };
    const saved = localStorage.getItem('cti_company_profile');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        let updated = false;
        // Force update leadership & headquarters if old dummy data, Chennai address, or old CTO/SuperAdmin roles exist
        if (!parsed.leadershipMembers || !Array.isArray(parsed.leadershipMembers) || (parsed.headquarters && parsed.headquarters.includes('Chennai')) || parsed.leadershipMembers.some(m => m?.role === 'SuperAdmin' || m?.name?.includes('Sarah') || m?.email?.includes('@codethrive.com') || (m?.title && m.title.includes('CTO')))) {
          parsed.headquarters = defaultData.headquarters;
          parsed.branchName = defaultData.branchName;
          parsed.leadershipMembers = defaultData.leadershipMembers;
          updated = true;
        }
        if (!parsed.registrationNumber || parsed.registrationNumber.includes('CIN')) {
          parsed.registrationNumber = defaultData.registrationNumber;
          updated = true;
        }
        if (updated) {
          localStorage.setItem('cti_company_profile', JSON.stringify(parsed));
        }
        return parsed; 
      } catch (e) { console.warn(e); }
    }
    return defaultData;
  });

  const [isCompanyEditModalOpen, setIsCompanyEditModalOpen] = useState(false);
  const [companyFormData, setCompanyFormData] = useState(companyProfile);
  const [companyEditModalTab, setCompanyEditModalTab] = useState('general');
  const [editingDirector, setEditingDirector] = useState(null);

  const handleCompanySave = (e) => {
    e.preventDefault();
    const updated = {
      ...companyProfile,
      ...companyFormData,
      leadershipMembers: companyProfile.leadershipMembers || []
    };
    setCompanyProfile(updated);
    setCompanyFormData(updated);
    localStorage.setItem('cti_company_profile', JSON.stringify(updated));
    setIsCompanyEditModalOpen(false);
  };

  const handleSaveSingleDirector = (e) => {
    e.preventDefault();
    if (!editingDirector) return;
    const updatedMembers = (companyProfile.leadershipMembers || []).map(m => 
      (m.id === editingDirector.id || m.name === editingDirector.name) ? editingDirector : m
    );
    const updatedCompany = { ...companyProfile, leadershipMembers: updatedMembers };
    setCompanyProfile(updatedCompany);
    setCompanyFormData(updatedCompany);
    localStorage.setItem('cti_company_profile', JSON.stringify(updatedCompany));
    setEditingDirector(null);
  };

  const [modalFormTab, setModalFormTab] = useState('personal');

  // Interactive Image Adjust / Crop Modal States
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempImageForCrop, setTempImageForCrop] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSavingCrop, setIsSavingCrop] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    profilePhoto: '',
    dateOfBirth: '',
    gender: 'Prefer not to say',
    bloodGroup: '',
    maritalStatus: 'Single',
    nationality: 'Indian',
    personalPhoneNumber: '',
    personalEmailAddress: '',
    department: '',
    designation: '',
    employmentType: 'Full-Time',
    dateOfJoining: '',
    workLocation: 'Office',
    bankAccountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    panNumber: '',
    aadhaarOrIdentityProofNumber: '',
    upiId: '',
    currentAddress: '',
    permanentAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    qualification: '',
    collegeName: '',
    universityName: '',
    graduationYear: '',
    cgpaOrPercentage: '',
    previousCompany: '',
    skills: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, summaryRes] = await Promise.all([
        api.get('/employees/me').catch(() => ({ data: null })),
        api.get('/attendance/summary').catch(() => ({ data: null }))
      ]);

      let data = profileRes?.data?.data || profileRes?.data;
      const isAdminUser = ['superadmin', 'admin', 'hr'].includes(user?.role?.toLowerCase() || '') || window.location.pathname.startsWith('/admin');

      // Check registered local users if any
      const localUsers = JSON.parse(localStorage.getItem('cti_local_users') || '[]');
      const matchedLocal = localUsers.find(u => u.employeeId === user?.employeeId || u.email === user?.email || u.emailId === user?.email);

      const regName = user?.fullName || user?.name || matchedLocal?.fullName || matchedLocal?.name || (user?.email ? user.email.split('@')[0] : '');
      const regEmail = user?.email || user?.personalEmailAddress || matchedLocal?.email || matchedLocal?.emailId || '';
      const regPhone = user?.phoneNumber || user?.personalPhoneNumber || matchedLocal?.phoneNumber || '';
      const regId = user?.employeeId || matchedLocal?.employeeId || (isAdminUser ? 'CTI-ADM-001' : '');
      const regRole = user?.designation || matchedLocal?.designation || matchedLocal?.role || (isAdminUser ? 'Administrator' : 'Employee');

      // Fallback if profile data is empty
      if (!data || !data.fullName) {
        data = {
          fullName: regName || (isAdminUser ? 'CodeThrive Administrator' : 'Employee'),
          personalEmailAddress: regEmail || (isAdminUser ? 'admin@codethrive.com' : ''),
          personalPhoneNumber: regPhone || '',
          employeeId: regId || '',
          designation: regRole,
          department: user?.department || (isAdminUser ? 'Executive Management' : 'Engineering'),
          employmentType: 'Full-Time',
          status: 'Active',
          workLocation: isAdminUser ? 'Corporate HQ (Master Console)' : 'Office',
          skills: []
        };
      } else {
        // Guarantee registered fields from registration aren't overwritten with blank
        if (!data.fullName && regName) data.fullName = regName;
        if (!data.employeeId && regId) data.employeeId = regId;
        if (!data.personalEmailAddress && regEmail) data.personalEmailAddress = regEmail;
        if (!data.personalPhoneNumber && regPhone) data.personalPhoneNumber = regPhone;
        if (!data.designation && regRole) data.designation = regRole;
      }

      setProfile(data);
      setAttendanceSummary(summaryRes?.data?.data || null);

      const safeSubstring = (val) => (typeof val === 'string' ? val.substring(0, 10) : (val ? String(val).substring(0, 10) : ''));
      const safeSkills = (skills) => (Array.isArray(skills) ? skills.join(', ') : (typeof skills === 'string' ? skills : ''));

      setFormData({
        fullName: data.fullName || '',
        profilePhoto: data.profilePhoto || '',
        dateOfBirth: safeSubstring(data.dateOfBirth),
        gender: data.gender || 'Prefer not to say',
        bloodGroup: data.bloodGroup || '',
        maritalStatus: data.maritalStatus || 'Single',
        nationality: data.nationality || 'Indian',
        personalPhoneNumber: data.personalPhoneNumber || '',
        personalEmailAddress: data.personalEmailAddress || '',
        department: data.department || '',
        designation: data.designation || '',
        employmentType: data.employmentType || 'Full-Time',
        dateOfJoining: safeSubstring(data.dateOfJoining),
        workLocation: data.workLocation || 'Office',
        bankAccountHolderName: data.bankAccountHolderName || '',
        bankName: data.bankName || '',
        accountNumber: data.accountNumber || '',
        ifscCode: data.ifscCode || '',
        branchName: data.branchName || '',
        panNumber: data.panNumber || '',
        aadhaarOrIdentityProofNumber: data.aadhaarOrIdentityProofNumber || '',
        upiId: data.upiId || '',
        currentAddress: data.currentAddress || '',
        permanentAddress: data.permanentAddress || '',
        emergencyContactName: data.emergencyContact?.name || '',
        emergencyContactPhone: data.emergencyContact?.phone || '',
        emergencyContactRelation: data.emergencyContact?.relationship || '',
        qualification: data.qualification || '',
        collegeName: data.collegeName || '',
        universityName: data.universityName || '',
        graduationYear: data.graduationYear || '',
        cgpaOrPercentage: data.cgpaOrPercentage || '',
        previousCompany: data.previousCompany || '',
        skills: safeSkills(data.skills)
      });
    } catch (err) {
      console.warn('Failed to fetch profile data', err);
    } finally {
      setLoading(false);
    }
  };

  // Image select handler -> opens interactive adjust/crop modal
  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageForCrop(reader.result);
      setZoomLevel(1);
      setPositionX(0);
      setPositionY(0);
      setRotation(0);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Open crop modal with current profile photo
  const handleAdjustCurrentPhoto = () => {
    if (profile?.profilePhoto) {
      setTempImageForCrop(profile.profilePhoto);
      setZoomLevel(1);
      setPositionX(0);
      setPositionY(0);
      setRotation(0);
      setIsCropModalOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  // Mouse & Touch Drag Pan Handlers
  const handleDragStart = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX - positionX, y: clientY - positionY });
  };

  const handleDragMove = (clientX, clientY) => {
    if (!isDragging) return;
    setPositionX(clientX - dragStart.x);
    setPositionY(clientY - dragStart.y);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Export cropped canvas & save to profile
  const handleSaveCroppedPhoto = async () => {
    if (!tempImageForCrop) return;
    try {
      setIsSavingCrop(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = tempImageForCrop;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const canvasSize = 400; // Resolution for profile avatar
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Failed to get canvas context');

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      ctx.save();
      ctx.translate(canvasSize / 2, canvasSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoomLevel, zoomLevel);

      const scaleFactor = canvasSize / 220; // 220px is crop-viewport size
      ctx.translate((positionX * scaleFactor) / zoomLevel, (positionY * scaleFactor) / zoomLevel);

      const aspect = img.width / img.height;
      let drawWidth = canvasSize;
      let drawHeight = canvasSize;
      if (aspect > 1) {
        drawWidth = canvasSize * aspect;
      } else {
        drawHeight = canvasSize / aspect;
      }

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.92);

      const res = await api.put('/employees/me', { profilePhoto: croppedBase64 });
      const updated = res.data?.data || res.data;
      setProfile(updated || { ...profile, profilePhoto: croppedBase64 });
      setFormData(prev => ({ ...prev, profilePhoto: croppedBase64 }));
      setIsCropModalOpen(false);
    } catch (err) {
      console.error('Failed to crop photo', err);
      alert('Could not save photo adjustment. Please try again.');
    } finally {
      setIsSavingCrop(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const updatePayload = {
        fullName: formData.fullName,
        profilePhoto: formData.profilePhoto,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        maritalStatus: formData.maritalStatus,
        nationality: formData.nationality,
        personalPhoneNumber: formData.personalPhoneNumber,
        personalEmailAddress: formData.personalEmailAddress,
        department: formData.department,
        designation: formData.designation,
        employmentType: formData.employmentType,
        dateOfJoining: formData.dateOfJoining || null,
        workLocation: formData.workLocation,
        bankAccountHolderName: formData.bankAccountHolderName,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        branchName: formData.branchName,
        panNumber: formData.panNumber,
        aadhaarOrIdentityProofNumber: formData.aadhaarOrIdentityProofNumber,
        upiId: formData.upiId,
        currentAddress: formData.currentAddress,
        permanentAddress: formData.permanentAddress,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelation
        },
        qualification: formData.qualification,
        collegeName: formData.collegeName,
        universityName: formData.universityName,
        graduationYear: formData.graduationYear,
        cgpaOrPercentage: formData.cgpaOrPercentage,
        previousCompany: formData.previousCompany,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      
      const res = await api.put('/employees/me', updatePayload);
      const updated = res.data?.data || res.data;
      setProfile(updated || { ...profile, ...updatePayload });
      setIsEditModalOpen(false);
    } catch (err) {
      console.warn('Failed to update profile', err);
      setIsEditModalOpen(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return alert('Passwords do not match');
    }
    try {
      await api.put('/auth/updatepassword', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setIsPasswordModalOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update password');
    }
  };

  // Calculate Profile Strength percentage out of 28 IT standard employee fields
  const calculateStrength = () => {
    if (!profile) return 0;
    let count = 0;
    const fields = [
      profile.fullName,
      profile.profilePhoto,
      profile.dateOfBirth,
      profile.gender,
      profile.bloodGroup,
      profile.maritalStatus,
      profile.nationality,
      profile.personalPhoneNumber,
      profile.personalEmailAddress,
      profile.department,
      profile.designation,
      profile.employmentType,
      profile.dateOfJoining,
      profile.workLocation,
      profile.bankAccountHolderName || profile.bankName,
      profile.accountNumber,
      profile.ifscCode,
      profile.panNumber,
      profile.aadhaarOrIdentityProofNumber,
      profile.currentAddress,
      profile.permanentAddress,
      profile.emergencyContact?.name,
      profile.emergencyContact?.phone,
      profile.qualification,
      profile.collegeName,
      profile.graduationYear,
      profile.totalExperience,
      profile.skills?.length
    ];
    fields.forEach(f => {
      if (f !== undefined && f !== null && String(f).trim().length > 0 && String(f) !== '0') {
        count++;
      }
    });
    return Math.min(100, Math.round((count / fields.length) * 100));
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="loader"></div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading Profile...</p>
    </div>
  );

  if (!profile) return <div className="empty-state"><h3>Profile data unavailable</h3></div>;

  const profileStrength = calculateStrength();
  const isAdmin = ['superadmin', 'admin', 'hr'].includes(user?.role?.toLowerCase() || '') || window.location.pathname.startsWith('/admin');

  return (
    <motion.div 
      className="profile-workspace-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Profile Mode Switcher Tabs (Only for Employees to toggle My Profile & Company Profile) */}
      {!isAdmin && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          marginBottom: '1.25rem',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '5px',
          width: 'fit-content'
        }}>
          <button
            type="button"
            onClick={() => setActiveProfileTab('personal')}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
              border: activeProfileTab === 'personal' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid transparent',
              background: activeProfileTab === 'personal' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
              color: activeProfileTab === 'personal' ? '#34d399' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease'
            }}
          >
            <UserCircle size={16} />
            <span>My Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveProfileTab('company')}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
              border: activeProfileTab === 'company' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
              background: activeProfileTab === 'company' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
              color: activeProfileTab === 'company' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Building2 size={16} />
            <span>Company Profile</span>
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------------
          COMPANY ENTERPRISE PROFILE VIEW (DEFAULT FOR ADMIN, OR WHEN EMPLOYEE CLICKS COMPANY TAB)
         -------------------------------------------------------------------------- */}
      {(isAdmin || activeProfileTab === 'company') && (
        <>
          {/* Company Hero Banner */}
          <div 
            className="company-hero-banner"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(99, 102, 241, 0.15), rgba(15, 23, 42, 0.9))',
              borderRadius: '24px', padding: '2.2rem 2.5rem',
            border: '1px solid rgba(0, 210, 255, 0.3)', backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
              <div style={{
                width: '70px', height: '70px', borderRadius: '20px',
                background: 'linear-gradient(135deg, #00d2ff, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(0, 210, 255, 0.4)', border: '2px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Building2 size={36} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #fff, #a7f3d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {companyProfile.companyName}
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.95rem' }}>
                  {companyProfile.tagline}
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setCompanyFormData(JSON.parse(JSON.stringify(companyProfile)));
                  setCompanyEditModalTab('general');
                  setIsCompanyEditModalOpen(true);
                }}
                style={{
                  padding: '0.75rem 1.4rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff', fontWeight: 700, border: 'none',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
                }}
              >
                <Edit3 size={17} />
                <span>Edit Company Profile</span>
              </button>
            )}
          </div>

          {/* Executive Enterprise Highlights & Governance Bar */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.7))',
            borderRadius: '20px', padding: '1.4rem 1.8rem',
            border: '1px solid rgba(0, 210, 255, 0.25)', backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.2))',
                border: '1px solid rgba(6, 182, 212, 0.4)', color: '#38bdf8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)'
              }}>
                <Zap size={22} color="#00d2ff" />
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.8px' }}>CORE SERVICES & DOMAIN</span>
                <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#fff', marginTop: '0.15rem' }}>Enterprise IT & Software</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)'
              }}>
                <MapPin size={22} color="#fbbf24" />
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.8px' }}>HEADQUARTERS & HUB</span>
                <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#fff', marginTop: '0.15rem' }}>Coimbatore Tech Park HQ</div>
                <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 500, display: 'block', marginTop: '0.1rem' }}>Tamil Nadu, India</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2))',
                border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
              }}>
                <ShieldCheck size={22} color="#34d399" />
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.8px' }}>UDYAM REGISTRATION</span>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#34d399', marginTop: '0.15rem', fontFamily: 'monospace' }}>{companyProfile.registrationNumber}</div>
                <span style={{ fontSize: '0.75rem', color: '#a7f3d0', fontWeight: 500, display: 'block', marginTop: '0.1rem' }}>MSME Verified Enterprise</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(147, 51, 234, 0.2))',
                border: '1px solid rgba(168, 85, 247, 0.4)', color: '#c084fc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.2)'
              }}>
                <Landmark size={22} color="#c084fc" />
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.8px' }}>STATUTORY TAX & BANK</span>
                <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#fff', marginTop: '0.15rem' }}>GSTIN Verified Account</div>
                <span style={{ fontSize: '0.78rem', color: '#e9d5ff', fontWeight: 500, display: 'block', marginTop: '0.1rem' }}>{companyProfile.bankName || 'Canara Bank'} Official</span>
              </div>
            </div>
          </div>

          {/* Executive Leadership & Director Board Card */}
          <Card title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Trophy size={22} color="#fbbf24" /> Executive Leadership & Board of Directors ({(companyProfile.leadershipMembers || []).length})
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Authorized Enterprise Directors</span>
            </div>
          }>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))', gap: '1.25rem' }}>
              {(companyProfile.leadershipMembers || []).map((member, idx) => (
                <div key={member.id || idx} style={{
                  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  position: 'relative'
                }}>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setEditingDirector({ ...member })}
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        borderRadius: '8px',
                        padding: '4px 9px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="Edit Member Details"
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingRight: '3.2rem' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff', fontWeight: 800, fontSize: '1.2rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
                    }}>
                      {member.name ? member.name.charAt(0) : 'D'}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>{member.name || 'Executive Director'}</h4>
                      <span style={{ fontSize: '0.82rem', color: '#a7f3d0', fontWeight: 600, display: 'block', marginTop: '0.1rem' }}>{member.title || 'Board Member'}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.08)', paddingTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                      <Mail size={13} color="#60a5fa" />
                      <span>{member.email || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                      <Phone size={13} color="#fbbf24" />
                      <span>{member.phone || '-'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      <ShieldCheck size={12} /> {member.role || 'Executive Board'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600, whiteSpace: 'nowrap' }}>Active Board Member</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Corporate Headquarters & Statutory Financial Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <Card title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MapPin size={20} color="#60a5fa" /> Registered Headquarters & Statutory
              </div>
            }>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Corporate HQ Address</span>
                  <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.2rem', lineHeight: '1.5' }}>
                    {companyProfile.headquarters}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.8rem' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Official Email</span>
                    <div style={{ fontWeight: 600, color: '#60a5fa', marginTop: '0.2rem' }}>{companyProfile.officialEmail}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Corporate Phone</span>
                    <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>{companyProfile.officialPhone}</div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.6rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Udyam Registration No</span>
                    <div style={{ fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem', fontFamily: 'monospace' }}>{companyProfile.registrationNumber}</div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.6rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GSTIN Number</span>
                    <div style={{ fontWeight: 700, color: '#a7f3d0', marginTop: '0.2rem', fontFamily: 'monospace' }}>{companyProfile.gstin}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Landmark size={20} color="#34d399" /> Corporate Operating Bank Account
              </div>
            }>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Operating Bank</span>
                  <div style={{ fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>{companyProfile.bankName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>IFSC Code</span>
                  <div style={{ fontWeight: 700, color: '#34d399', marginTop: '0.2rem', fontFamily: 'monospace' }}>{companyProfile.ifscCode}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Account Number</span>
                  <div style={{ fontWeight: 700, color: '#60a5fa', marginTop: '0.2rem', fontFamily: 'monospace' }}>{companyProfile.accountNumber}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Branch Name</span>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', marginTop: '0.2rem' }}>{companyProfile.branchName}</div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* --------------------------------------------------------------------------
          EMPLOYEE PERSONAL ACCOUNT VIEW (RENDERED WHEN TAB IS 'personal' FOR EMPLOYEES)
         -------------------------------------------------------------------------- */}
      {!isAdmin && activeProfileTab === 'personal' && (
        <>
      {/* --------------------------------------------------------------------------
          1. SLEEK EXECUTIVE PROFILE HEADER - DISTINGUISHED BOARDROOM DESIGN
         -------------------------------------------------------------------------- */}
      <div className="profile-executive-header">
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
              <span className="pulse-dot"></span> Active
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
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt={profile.fullName} />
              ) : (
                <span className="profile-avatar-initials">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'E'}
                </span>
              )}
            </div>

            <span className="profile-online-indicator" title="Active Account"></span>

            <div className="avatar-action-buttons">
              <button
                type="button"
                className="profile-cam-btn"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Upload & Adjust New Photo"
              >
                <Camera size={15} />
              </button>

              {profile.profilePhoto && (
                <button
                  type="button"
                  className="profile-adjust-btn"
                  onClick={handleAdjustCurrentPhoto}
                  title="Adjust & Position Current Photo"
                >
                  <Sliders size={13} />
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          {/* User Primary Identity Details */}
          <div className="profile-identity-info">
            <div className="profile-name-row">
              <h1 className="profile-user-name">{profile.fullName}</h1>
            </div>

            <div className="profile-executive-title-row">
              <span className="profile-designation-serif">{profile.designation || 'Managing Director'}</span>
              <span className="title-sep">|</span>
              <span className="profile-emp-id-tag" title="Official Employee Identification">
                <CreditCard size={14} /> {profile.employeeId || (isAdmin ? 'CTI-ADM-001' : 'CTI-EMP-001')}
              </span>
              <span className="title-sep">|</span>
              <span className="profile-company-name">CodeThrive Infotech Pvt Ltd</span>
            </div>

            {/* Direct Communication & Tenure Bar */}
            <div className="profile-contact-tenure-bar">
              <a 
                href={`mailto:${profile.personalEmailAddress || user?.email || ''}`}
                onClick={(e) => openDirectEmail(profile.personalEmailAddress || user?.email, e)}
                className="executive-contact-pill email-pill"
                title="Directly open email to compose message"
              >
                <div className="pill-icon-box">
                  <Mail size={14} />
                </div>
                <div className="pill-text-col">
                  <span className="pill-label">Official Email</span>
                  <span className="pill-val">{profile.personalEmailAddress || user?.email || 'N/A'}</span>
                </div>
                <span className="pill-arrow">↗</span>
              </a>

              <button 
                type="button"
                className="executive-contact-pill phone-pill"
                onClick={() => setContactModal({
                  isOpen: true,
                  name: profile.fullName || 'Employee',
                  phone: profile.personalPhoneNumber || '9876543210'
                })}
                title="Connect via WhatsApp or Direct Call"
              >
                <div className="pill-icon-box">
                  <Phone size={14} />
                </div>
                <div className="pill-text-col">
                  <span className="pill-label">Direct Contact</span>
                  <span className="pill-val">{profile.personalPhoneNumber || '9876543210'}</span>
                </div>
                <span className="pill-arrow">↗</span>
              </button>

              <div className="executive-contact-pill tenure-pill">
                <div className="pill-icon-box">
                  <Calendar size={14} />
                </div>
                <div className="pill-text-col">
                  <span className="pill-label">Date of Joining</span>
                  <span className="pill-val">{profile.dateOfJoining ? formatDate(profile.dateOfJoining) : '23/10/2026'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="profile-header-actions">
            <button className="btn-executive-edit" onClick={() => setIsEditModalOpen(true)}>
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          3. PROFILE COMPLETION STRENGTH BAR (100% FILL TARGET)
         -------------------------------------------------------------------------- */}
      <div className="profile-strength-bar-card">
        <div className="strength-info">
          <div className="strength-icon-box">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="strength-title-row">
              <span className="strength-title">Profile Vault Completeness</span>
              <span className={`strength-pct ${profileStrength === 100 ? 'done' : ''}`}>{profileStrength}%</span>
            </div>
            <span className="strength-sub">
              {profileStrength === 100 
                ? '🎉 Excellent! Your profile is 100% complete and fully verified.' 
                : `Your profile is ${profileStrength}% complete. Fill all details in "Edit Profile" to reach 100%.`}
            </span>
          </div>
        </div>

        <div className="strength-track-wrapper">
          <div className="strength-track">
            <div className="strength-fill" style={{ width: `${profileStrength}%` }}></div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          4. FULL PAGE IT PROFILE DASHBOARD (NEAT, ORGANIZED TILES)
         -------------------------------------------------------------------------- */}
      <div className="profile-main-grid">
        {/* Admin Governance & Access Rights Card (For Admin Accounts) */}
        {isAdmin && (
          <Card title={
            <div className="card-custom-header">
              <div className="card-header-icon-bubble amber">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="card-header-title">System Governance & Privileges</span>
                <span className="card-header-subtitle">Executive Administrative Clearance</span>
              </div>
            </div>
          }>
            <div className="gov-cards-grid">
              <div className="gov-card amber">
                <div className="gov-card-top">
                  <Shield size={16} />
                  <span className="gov-card-badge">User Management</span>
                </div>
                <div className="gov-card-status">Full Write & Approval</div>
                <span className="gov-card-desc">Register, deactivate & manage organization staff</span>
              </div>

              <div className="gov-card emerald">
                <div className="gov-card-top">
                  <Zap size={16} />
                  <span className="gov-card-badge">Payroll & Disbursement</span>
                </div>
                <div className="gov-card-status">Disbursement Authorized</div>
                <span className="gov-card-desc">1-Click bulk & single digital payslip generation</span>
              </div>

              <div className="gov-card blue">
                <div className="gov-card-top">
                  <CheckCircle2 size={16} />
                  <span className="gov-card-badge">Leave & Attendance</span>
                </div>
                <div className="gov-card-status">Master Overrides Active</div>
                <span className="gov-card-desc">Approve or reject organization leave applications</span>
              </div>

              <div className="gov-card purple">
                <div className="gov-card-top">
                  <Trophy size={16} />
                  <span className="gov-card-badge">Security Level</span>
                </div>
                <div className="gov-card-status">Tier-1 Root Clearance</div>
                <span className="gov-card-desc">Master system audit logs & security control</span>
              </div>
            </div>
          </Card>
        )}

        {/* Card 1: Personal Details & Identity */}
        <Card title={
          <div className="card-custom-header">
            <div className="card-header-icon-bubble blue">
              <UserCircle size={20} />
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
              <div className="field-tile-val">{profile.fullName || <span className="val-not-set">Not Provided</span>}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Date of Birth</span>
              <div className="field-tile-val">{profile.dateOfBirth ? formatDate(profile.dateOfBirth) : <span className="val-not-set">Not Provided</span>}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Gender</span>
              <div className="field-tile-val">{profile.gender || 'Prefer not to say'}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Blood Group</span>
              <div className="field-tile-val">
                {profile.bloodGroup ? (
                  <span className="blood-group-badge">{profile.bloodGroup}</span>
                ) : (
                  <span className="val-not-set">Not Provided</span>
                )}
              </div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Marital Status</span>
              <div className="field-tile-val">{profile.maritalStatus || 'Single'}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Nationality</span>
              <div className="field-tile-val">{profile.nationality || 'Indian'}</div>
            </div>

            <div className="profile-field-tile email-field-tile">
              <span className="field-tile-label">Personal Email</span>
              <div className="field-tile-val">
                {profile.personalEmailAddress || user?.email ? (
                  <a 
                    href={`mailto:${profile.personalEmailAddress || user?.email}`}
                    onClick={(e) => openDirectEmail(profile.personalEmailAddress || user?.email, e)}
                    className="field-tile-action-link email"
                    title="Open email composer directly"
                  >
                    <Mail size={13} />
                    <span>{profile.personalEmailAddress || user?.email}</span>
                  </a>
                ) : (
                  <span className="val-not-set">Not Provided</span>
                )}
              </div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Phone Number</span>
              <div className="field-tile-val">
                {profile.personalPhoneNumber ? (
                  <button 
                    type="button"
                    className="field-tile-action-btn phone"
                    onClick={() => setContactModal({
                      isOpen: true,
                      name: profile.fullName || 'Employee',
                      phone: profile.personalPhoneNumber
                    })}
                    title="Connect on WhatsApp or Phone Call"
                  >
                    <Phone size={13} />
                    <span>{profile.personalPhoneNumber}</span>
                  </button>
                ) : (
                  <span className="val-not-set">Not Provided</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Work & Corporate Employment */}
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
              <span className="field-tile-label">Department</span>
              <div className="field-tile-val">{profile.department || 'Executive Board'}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Designation</span>
              <div className="field-tile-val highlight-blue">{profile.designation || 'Managing Director'}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Employment Type</span>
              <div className="field-tile-val">
                <span className="employment-type-pill">{profile.employmentType || 'Full-Time'}</span>
              </div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Date of Joining</span>
              <div className="field-tile-val">{profile.dateOfJoining ? formatDate(profile.dateOfJoining) : '01/08/2024'}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Work Location</span>
              <div className="field-tile-val">{profile.workLocation || 'Office'}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Account Status</span>
              <div className="field-tile-val">
                <span className="account-status-pill">
                  <CheckCircle2 size={14} /> Active Verified
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Education & Technical Skills (Moved above Bank Account as requested) */}
        <Card title={
          <div className="card-custom-header">
            <div className="card-header-icon-bubble amber">
              <GraduationCap size={20} />
            </div>
            <div>
              <span className="card-header-title">Education & Technical Skills</span>
              <span className="card-header-subtitle">Academic Credentials & Verified Skillset</span>
            </div>
          </div>
        }>
          <div className="profile-tiles-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="profile-field-tile">
              <span className="field-tile-label">Highest Qualification</span>
              <div className="field-tile-val">{profile.qualification || 'Bachelor of Engineering (B.E.)'}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">College / Institute</span>
              <div className="field-tile-val">{profile.collegeName || 'SRM Institute of Science & Technology'}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">University</span>
              <div className="field-tile-val">{profile.universityName || 'Anna University'}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Graduation Year</span>
              <div className="field-tile-val">{profile.graduationYear || '2024'}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">CGPA / Percentage</span>
              <div className="field-tile-val highlight-emerald">{profile.cgpaOrPercentage || '8.5 CGPA'}</div>
            </div>
          </div>

          <div className="skills-container-box">
            <span className="skills-section-title">Verified Technical Skills & Competencies</span>
            <div className="skills-tags-wrap">
              {profile.skills?.length > 0 ? (
                profile.skills.map((skill, i) => (
                  <span key={i} className="skill-pill-tag">
                    ✨ {skill}
                  </span>
                ))
              ) : (
                <span className="skills-empty-note">
                  No skills listed yet. Click "Edit Profile" to add technical skills.
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Card 4: Bank Account & Tax Credentials */}
        <Card title={
          <div className="card-custom-header">
            <div className="card-header-icon-bubble emerald">
              <Landmark size={20} />
            </div>
            <div>
              <span className="card-header-title">Bank Account & Tax Credentials</span>
              <span className="card-header-subtitle">Secure Payroll Disbursement Vault</span>
            </div>
          </div>
        }>
          <div className="profile-tiles-grid">
            <div className="profile-field-tile">
              <span className="field-tile-label">Bank Account Holder</span>
              <div className="field-tile-val">{profile.bankAccountHolderName || profile.fullName || <span className="val-not-set">Not Provided</span>}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Bank Name</span>
              <div className="field-tile-val">{profile.bankName || <span className="val-not-set">Not Provided</span>}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Account Number</span>
              <div className="field-tile-val mono highlight-blue">
                {profile.accountNumber ? profile.accountNumber : <span className="val-not-set">Not Provided</span>}
              </div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">IFSC Code</span>
              <div className="field-tile-val mono">
                {profile.ifscCode || <span className="val-not-set">Not Provided</span>}
              </div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">Branch Name</span>
              <div className="field-tile-val">{profile.branchName || <span className="val-not-set">Not Provided</span>}</div>
            </div>

            <div className="profile-field-tile">
              <span className="field-tile-label">UPI ID</span>
              <div className="field-tile-val highlight-emerald">
                {profile.upiId || <span className="val-not-set">Not Provided</span>}
              </div>
            </div>
          </div>
        </Card>

        {/* Card 6: Addresses & Emergency Contacts */}
        <Card title={
          <div className="card-custom-header">
            <div className="card-header-icon-bubble emerald">
              <MapPin size={20} />
            </div>
            <div>
              <span className="card-header-title">Addresses & Emergency Contact</span>
              <span className="card-header-subtitle">Residential Location & Safety Contact</span>
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
                <div className="address-text">{profile.currentAddress || <span className="val-not-set">Not Provided</span>}</div>
              </div>
              <div className="address-box" style={{ marginTop: '0.9rem' }}>
                <span className="field-tile-label">Permanent Address</span>
                <div className="address-text">{profile.permanentAddress || <span className="val-not-set">Not Provided</span>}</div>
              </div>
            </div>

            <div className="emergency-column">
              <h4 className="section-subheading">
                <UserCircle size={16} /> Emergency Contact
              </h4>
              <div className="profile-tiles-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="profile-field-tile">
                  <span className="field-tile-label">Contact Person</span>
                  <div className="field-tile-val">{profile.emergencyContact?.name || <span className="val-not-set">Not Provided</span>}</div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Emergency Phone</span>
                  <div className="field-tile-val">
                    {profile.emergencyContact?.phone ? (
                      <button 
                        type="button"
                        className="field-tile-action-btn phone"
                        onClick={() => setContactModal({
                          isOpen: true,
                          name: profile.emergencyContact?.name || 'Emergency Contact',
                          phone: profile.emergencyContact?.phone
                        })}
                        title="WhatsApp or Direct Call"
                      >
                        <Phone size={13} />
                        <span>{profile.emergencyContact?.phone}</span>
                      </button>
                    ) : (
                      <span className="val-not-set">Not Provided</span>
                    )}
                  </div>
                </div>

                <div className="profile-field-tile">
                  <span className="field-tile-label">Relationship</span>
                  <div className="field-tile-val">{profile.emergencyContact?.relationship || <span className="val-not-set">Not Provided</span>}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
        </>
      )}

      {/* --------------------------------------------------------------------------
          5. COMPANY PROFILE EDIT MODAL
         -------------------------------------------------------------------------- */}
      <Modal
        isOpen={isCompanyEditModalOpen}
        onClose={() => setIsCompanyEditModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Building2 size={20} color="#10b981" />
            <span>Edit Corporate Company Profile</span>
          </div>
        }
      >
        <form onSubmit={handleCompanySave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.5rem' }}>
          <div className="form-group">
            <label className="field-label">Company Official Name *</label>
            <input 
              type="text" className="input-box" 
              value={companyFormData.companyName}
              onChange={(e) => setCompanyFormData({...companyFormData, companyName: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="field-label">Corporate Tagline / Mission</label>
            <input 
              type="text" className="input-box" 
              value={companyFormData.tagline}
              onChange={(e) => setCompanyFormData({...companyFormData, tagline: e.target.value})}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="field-label">Udyam Registration Number (Udhayam) *</label>
              <input 
                type="text" className="input-box" 
                value={companyFormData.registrationNumber}
                onChange={(e) => setCompanyFormData({...companyFormData, registrationNumber: e.target.value})}
                placeholder="e.g. UDYAM-TN-2024-0012345"
                required
              />
            </div>
            <div className="form-group">
              <label className="field-label">GSTIN Identification Number *</label>
              <input 
                type="text" className="input-box" 
                value={companyFormData.gstin}
                onChange={(e) => setCompanyFormData({...companyFormData, gstin: e.target.value})}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="field-label">Official Support Email *</label>
              <input 
                type="email" className="input-box" 
                value={companyFormData.officialEmail}
                onChange={(e) => setCompanyFormData({...companyFormData, officialEmail: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="field-label">Official Corporate Phone *</label>
              <input 
                type="text" className="input-box" 
                value={companyFormData.officialPhone}
                onChange={(e) => setCompanyFormData({...companyFormData, officialPhone: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="field-label">Corporate Registered Address *</label>
            <textarea 
              className="input-box" rows={2}
              value={companyFormData.headquarters}
              onChange={(e) => setCompanyFormData({...companyFormData, headquarters: e.target.value})}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="field-label">Primary Corporate Bank</label>
              <input 
                type="text" className="input-box" 
                value={companyFormData.bankName}
                onChange={(e) => setCompanyFormData({...companyFormData, bankName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="field-label">Operating Account Number</label>
              <input 
                type="text" className="input-box" 
                value={companyFormData.accountNumber}
                onChange={(e) => setCompanyFormData({...companyFormData, accountNumber: e.target.value})}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsCompanyEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
              Save Corporate Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* --------------------------------------------------------------------------
          6. INTERACTIVE IMAGE CROP & ADJUSTMENT MODAL
         -------------------------------------------------------------------------- */}
      <Modal isOpen={isCropModalOpen} onClose={() => setIsCropModalOpen(false)} title="Adjust & Position Profile Photo">
        <div className="crop-modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
            🖱️ <strong>Drag image</strong> to pan/position. Use zoom & rotate controls to fit inside circle avatar.
          </p>

          {/* Crop Viewport with Mouse & Touch Event Handlers */}
          <div 
            className="crop-viewport"
            onMouseDown={e => handleDragStart(e.clientX, e.clientY)}
            onMouseMove={e => handleDragMove(e.clientX, e.clientY)}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={e => e.touches[0] && handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={e => e.touches[0] && handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handleDragEnd}
          >
            <img 
              src={tempImageForCrop} 
              alt="Crop target" 
              style={{
                transform: `translate(${positionX}px, ${positionY}px) scale(${zoomLevel}) rotate(${rotation}deg)`,
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              draggable={false}
            />
          </div>

          {/* Controls Bar */}
          <div className="crop-controls-box" style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Zoom Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#cbd5e1', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><ZoomIn size={15} color="#60a5fa" /> Zoom Level</span>
                <span style={{ color: '#60a5fa', fontWeight: 700 }}>{Math.round(zoomLevel * 100)}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <button type="button" className="btn-crop-small" onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.15))}>-</button>
                <input 
                  type="range" 
                  min="0.5" 
                  max="3" 
                  step="0.05" 
                  value={zoomLevel} 
                  onChange={e => setZoomLevel(parseFloat(e.target.value))}
                  className="crop-slider" 
                />
                <button type="button" className="btn-crop-small" onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.15))}>+</button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button type="button" className="btn-outline-glass" onClick={() => setRotation(prev => (prev + 90) % 360)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RotateCw size={14} /> Rotate 90°
              </button>

              <button type="button" className="btn-outline-glass" onClick={() => { setZoomLevel(1); setPositionX(0); setPositionY(0); setRotation(0); }} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                ↩️ Reset Position
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-outline-glass" onClick={() => setIsCropModalOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary-glow" onClick={handleSaveCroppedPhoto} disabled={isSavingCrop}>
              {isSavingCrop ? 'Applying Photo...' : 'Apply & Save Profile Photo'}
            </button>
          </div>
        </div>
      </Modal>

      {/* --------------------------------------------------------------------------
          6. EDIT PROFILE MODAL (5 COMPREHENSIVE TABS FOR 100% COMPLETION)
         -------------------------------------------------------------------------- */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Employee Profile">
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.25rem', gap: '0.4rem', overflowX: 'auto' }}>
          {[
            { id: 'personal', label: '1. Personal & Identity' },
            { id: 'work', label: '2. Work & Corporate' },
            { id: 'education', label: '3. Education & Skills' },
            { id: 'payroll', label: '4. Bank & Tax' },
            { id: 'contact', label: '5. Address & Emergency' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setModalFormTab(tab.id)}
              style={{
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                borderBottom: modalFormTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                color: modalFormTab === tab.id ? '#60a5fa' : '#94a3b8',
                fontWeight: modalFormTab === tab.id ? '700' : '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* TAB 1: Personal & Identity */}
          {modalFormTab === 'personal' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Full Legal Name *</label>
                <input type="text" className="input-field" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Profile Photo URL</label>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <input type="text" className="input-field" placeholder="https://example.com/photo.jpg" value={formData.profilePhoto} onChange={e => setFormData({ ...formData, profilePhoto: e.target.value })} style={{ flex: 1 }} />
                  {formData.profilePhoto && (
                    <button 
                      type="button" 
                      className="btn-outline-glass" 
                      onClick={() => {
                        setTempImageForCrop(formData.profilePhoto);
                        setZoomLevel(1);
                        setPositionX(0);
                        setPositionY(0);
                        setRotation(0);
                        setIsCropModalOpen(true);
                      }}
                      style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.9rem' }}
                    >
                      <Sliders size={15} /> Adjust Photo
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Personal Phone Number *</label>
                <input type="tel" className="input-field" value={formData.personalPhoneNumber} onChange={e => setFormData({ ...formData, personalPhoneNumber: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Personal Email Address *</label>
                <input type="email" className="input-field" value={formData.personalEmailAddress} onChange={e => setFormData({ ...formData, personalEmailAddress: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Date of Birth *</label>
                <DateInput className="input-field" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <select className="input-field" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} style={{ background: '#0f172a', color: '#fff' }} required>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label>Blood Group *</label>
                <input type="text" className="input-field" placeholder="e.g. O+, A+, B+" value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Marital Status *</label>
                <select className="input-field" value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })} style={{ background: '#0f172a', color: '#fff' }} required>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: Work Details */}
          {modalFormTab === 'work' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Department *</label>
                <input type="text" className="input-field" placeholder="e.g. Quality Assurance, Software Engineering" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Designation *</label>
                <input type="text" className="input-field" placeholder="e.g. Software Testing Specialist" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Employment Type *</label>
                <select className="input-field" value={formData.employmentType} onChange={e => setFormData({ ...formData, employmentType: e.target.value })} style={{ background: '#0f172a', color: '#fff' }} required>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="form-group">
                <label>Work Location *</label>
                <select className="input-field" value={formData.workLocation} onChange={e => setFormData({ ...formData, workLocation: e.target.value })} style={{ background: '#0f172a', color: '#fff' }} required>
                  <option value="Office">Office</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Date of Joining *</label>
                <DateInput className="input-field" value={formData.dateOfJoining} onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })} required />
              </div>
            </div>
          )}

          {/* TAB 3: Education & Skills (Moved above Bank & Tax to match external order) */}
          {modalFormTab === 'education' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Highest Qualification *</label>
                  <input type="text" className="input-field" placeholder="e.g. B.E. Computer Science" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>College Name *</label>
                  <input type="text" className="input-field" placeholder="e.g. SRM Institute of Science & Tech" value={formData.collegeName} onChange={e => setFormData({ ...formData, collegeName: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>University Name *</label>
                  <input type="text" className="input-field" placeholder="e.g. Anna University" value={formData.universityName} onChange={e => setFormData({ ...formData, universityName: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>Graduation Year *</label>
                  <input type="text" className="input-field" placeholder="e.g. 2024" value={formData.graduationYear} onChange={e => setFormData({ ...formData, graduationYear: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>CGPA / Percentage *</label>
                  <input type="text" className="input-field" placeholder="e.g. 8.5 CGPA or 85%" value={formData.cgpaOrPercentage} onChange={e => setFormData({ ...formData, cgpaOrPercentage: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label>Technical Skills & Tools * (comma separated)</label>
                <textarea className="input-field" rows="2" placeholder="e.g. React, Node.js, Python, Automation Testing, JIRA, Cypress" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} required></textarea>
              </div>
            </>
          )}

          {/* TAB 4: Bank & Tax Details */}
          {modalFormTab === 'payroll' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Account Holder Name *</label>
                <input type="text" className="input-field" placeholder="Full name as in bank account" value={formData.bankAccountHolderName} onChange={e => setFormData({ ...formData, bankAccountHolderName: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Bank Name *</label>
                <input type="text" className="input-field" placeholder="e.g. HDFC Bank, ICICI Bank, SBI" value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Bank Account Number *</label>
                <input type="text" className="input-field" placeholder="e.g. 50100234567890" value={formData.accountNumber} onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>IFSC Code *</label>
                <input type="text" className="input-field" placeholder="e.g. HDFC0001234" value={formData.ifscCode} onChange={e => setFormData({ ...formData, ifscCode: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Branch Name *</label>
                <input type="text" className="input-field" placeholder="e.g. Main Branch, Chennai" value={formData.branchName} onChange={e => setFormData({ ...formData, branchName: e.target.value })} required />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>UPI ID *</label>
                <input type="text" className="input-field" placeholder="e.g. user@upi" value={formData.upiId} onChange={e => setFormData({ ...formData, upiId: e.target.value })} required />
              </div>
            </div>
          )}

          {/* TAB 5: Address & Emergency Contact */}
          {modalFormTab === 'contact' && (
            <>
              <div className="form-group">
                <label>Current Residential Address *</label>
                <textarea className="input-field" rows="2" placeholder="House/Flat No, Street, City, State, Pincode" value={formData.currentAddress} onChange={e => setFormData({ ...formData, currentAddress: e.target.value })} required></textarea>
              </div>

              <div className="form-group">
                <label>Permanent Address *</label>
                <textarea className="input-field" rows="2" placeholder="House/Flat No, Street, City, State, Pincode" value={formData.permanentAddress} onChange={e => setFormData({ ...formData, permanentAddress: e.target.value })} required></textarea>
              </div>
              
              <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', color: '#60a5fa' }}>Emergency Contact</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Emergency Contact Name *</label>
                  <input type="text" className="input-field" placeholder="Contact Person Name" value={formData.emergencyContactName} onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Phone *</label>
                  <input type="tel" className="input-field" placeholder="Emergency Phone" value={formData.emergencyContactPhone} onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })} required />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Relationship *</label>
                  <input type="text" className="input-field" placeholder="e.g. Spouse, Parent, Sibling" value={formData.emergencyContactRelation} onChange={e => setFormData({ ...formData, emergencyContactRelation: e.target.value })} required />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            <button type="button" className="btn-outline-glass" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary-glow">Save Profile Details</button>
          </div>
        </form>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Change Vault Password">
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" className="input-field" required value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" className="input-field" required minLength="6" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" className="input-field" required minLength="6" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
            <button type="button" className="btn-outline-glass" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary-glow">Update Password</button>
          </div>
        </form>
      </Modal>

      {/* EDIT COMPANY ENTERPRISE PROFILE MODAL */}
      <Modal isOpen={isCompanyEditModalOpen} onClose={() => setIsCompanyEditModalOpen(false)} title="Edit Company Enterprise Profile">
        <form onSubmit={handleCompanySave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Company Legal Name *</label>
              <input type="text" className="input-field" value={companyFormData.companyName || ''} onChange={e => setCompanyFormData({ ...companyFormData, companyName: e.target.value })} required />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Tagline / Corporate Overview *</label>
              <input type="text" className="input-field" value={companyFormData.tagline || ''} onChange={e => setCompanyFormData({ ...companyFormData, tagline: e.target.value })} required />
            </div>

            <div className="form-group">
              <label>Udyam Registration Number (Udhayam) *</label>
              <input type="text" className="input-field" value={companyFormData.registrationNumber || ''} onChange={e => setCompanyFormData({ ...companyFormData, registrationNumber: e.target.value })} placeholder="e.g. UDYAM-TN-2024-0012345" required />
            </div>

            <div className="form-group">
              <label>GSTIN Number *</label>
              <input type="text" className="input-field" value={companyFormData.gstin || ''} onChange={e => setCompanyFormData({ ...companyFormData, gstin: e.target.value })} required />
            </div>

            <div className="form-group">
              <label>Corporate Phone *</label>
              <input type="text" className="input-field" value={companyFormData.officialPhone || ''} onChange={e => setCompanyFormData({ ...companyFormData, officialPhone: e.target.value })} required />
            </div>

            <div className="form-group">
              <label>Official Email *</label>
              <input type="email" className="input-field" value={companyFormData.officialEmail || ''} onChange={e => setCompanyFormData({ ...companyFormData, officialEmail: e.target.value })} required />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Corporate HQ Address *</label>
              <textarea className="input-field" rows="2" value={companyFormData.headquarters || ''} onChange={e => setCompanyFormData({ ...companyFormData, headquarters: e.target.value })} required></textarea>
            </div>

            {/* Corporate Banking Details Section */}
            <h4 style={{ gridColumn: 'span 2', margin: '0.8rem 0 0 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem', color: '#38bdf8', fontSize: '0.95rem' }}>
              🏦 Corporate Banking & Financial Vault Details
            </h4>

            <div className="form-group">
              <label>Corporate Bank Name *</label>
              <input type="text" className="input-field" placeholder="e.g. Canara Bank, HDFC Bank" value={companyFormData.bankName || ''} onChange={e => setCompanyFormData({ ...companyFormData, bankName: e.target.value })} required />
            </div>

            <div className="form-group">
              <label>Account Number *</label>
              <input type="text" className="input-field" placeholder="e.g. 50200088991122" value={companyFormData.accountNumber || ''} onChange={e => setCompanyFormData({ ...companyFormData, accountNumber: e.target.value })} required />
            </div>

            <div className="form-group">
              <label>IFSC Code *</label>
              <input type="text" className="input-field" placeholder="e.g. CNRB0001234" value={companyFormData.ifscCode || ''} onChange={e => setCompanyFormData({ ...companyFormData, ifscCode: e.target.value })} required />
            </div>

            <div className="form-group">
              <label>Branch Name *</label>
              <input type="text" className="input-field" placeholder="e.g. Tech Park Branch, Coimbatore" value={companyFormData.branchName || ''} onChange={e => setCompanyFormData({ ...companyFormData, branchName: e.target.value })} required />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <button type="button" className="btn-outline-glass" onClick={() => setIsCompanyEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary-glow">Save Company Profile</button>
          </div>
        </form>
      </Modal>

      {/* Individual Director Edit Modal */}
      {editingDirector && (
        <Modal
          isOpen={!!editingDirector}
          onClose={() => setEditingDirector(null)}
          title={`Edit Board Member - ${editingDirector.name || 'Director'}`}
        >
          <form onSubmit={handleSaveSingleDirector} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.5rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingDirector.name || ''}
                  onChange={e => setEditingDirector({ ...editingDirector, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Designation / Title *</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingDirector.title || ''}
                  onChange={e => setEditingDirector({ ...editingDirector, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Official Email *</label>
                <input
                  type="email"
                  className="input-field"
                  value={editingDirector.email || ''}
                  onChange={e => setEditingDirector({ ...editingDirector, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Phone Number *</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingDirector.phone || ''}
                  onChange={e => setEditingDirector({ ...editingDirector, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Role / Tag *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. CodeThrive Infotech, HR Lead, Tech Lead"
                  value={editingDirector.role || ''}
                  onChange={e => setEditingDirector({ ...editingDirector, role: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
              <button type="button" className="btn-outline-glass" onClick={() => setEditingDirector(null)}>Cancel</button>
              <button type="submit" className="btn-primary-glow">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Contact Options Modal (WhatsApp vs Call) */}
      <ContactActionModal 
        isOpen={contactModal.isOpen} 
        onClose={() => setContactModal(prev => ({ ...prev, isOpen: false }))} 
        name={contactModal.name} 
        phone={contactModal.phone} 
      />

    </motion.div>
  );
};

export default MyProfile;
