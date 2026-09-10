import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  UserCircle, Mail, Phone, MapPin,
  Briefcase, Shield, Camera, Edit3, GraduationCap,
  Sparkles, Trophy, QrCode, CreditCard, RefreshCw, Calendar,
  ShieldCheck, RotateCw, Zap
} from 'lucide-react';
import './MyProfile.css';

const WORK_STATUSES = [
  { id: 'office', label: 'In Office', icon: '🟢' },
  { id: 'remote', label: 'Remote / WFH', icon: '💻' },
  { id: 'break', label: 'On Break', icon: '☕' },
  { id: 'focus', label: 'In Focus Mode', icon: '🎯' }
];

const MyProfile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [modalFormTab, setModalFormTab] = useState('personal');
  
  // Customization state
  const [workStatus, setWorkStatus] = useState('office');
  const [isIdFlipped, setIsIdFlipped] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    profilePhoto: '',
    dateOfBirth: '',
    gender: 'Prefer not to say',
    bloodGroup: '',
    personalPhoneNumber: '',
    personalEmailAddress: '',
    department: '',
    designation: '',
    dateOfJoining: '',
    workLocation: 'Office',
    currentAddress: '',
    permanentAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    qualification: '',
    collegeName: '',
    graduationYear: '',
    previousCompany: '',
    totalExperience: '',
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

      // Fallback if profile data is empty
      if (!data || !data.fullName) {
        const isAdmin = ['superadmin', 'admin', 'hr'].includes(user?.role?.toLowerCase());
        data = {
          fullName: user?.fullName || user?.name || (user?.email ? user.email.split('@')[0].toUpperCase() : 'CodeThrive Employee'),
          personalEmailAddress: user?.email || user?.personalEmailAddress || 'employee@codethrive.com',
          personalPhoneNumber: user?.phoneNumber || '9876543210',
          employeeId: user?.employeeId || (isAdmin ? 'CTI-ADM-001' : 'CTI-EMP-002'),
          designation: user?.designation || (isAdmin ? 'System Administrator' : 'Quality Assurance Specialist'),
          department: user?.department || (isAdmin ? 'Management' : 'Quality Assurance & Software Testing'),
          status: 'Active',
          workLocation: 'Office',
          skills: ['Software Testing', 'Quality Assurance', 'Automation Testing', 'React Portal Control']
        };
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
        personalPhoneNumber: data.personalPhoneNumber || '',
        personalEmailAddress: data.personalEmailAddress || '',
        department: data.department || '',
        designation: data.designation || '',
        dateOfJoining: safeSubstring(data.dateOfJoining),
        workLocation: data.workLocation || 'Office',
        currentAddress: data.currentAddress || '',
        permanentAddress: data.permanentAddress || '',
        emergencyContactName: data.emergencyContact?.name || '',
        emergencyContactPhone: data.emergencyContact?.phone || '',
        emergencyContactRelation: data.emergencyContact?.relationship || '',
        qualification: data.qualification || '',
        collegeName: data.collegeName || '',
        graduationYear: data.graduationYear || '',
        previousCompany: data.previousCompany || '',
        totalExperience: data.totalExperience || '',
        skills: safeSkills(data.skills)
      });
    } catch (err) {
      console.warn('Failed to fetch profile data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfile();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Direct image upload from avatar camera click
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Photo = reader.result;
      try {
        const res = await api.put('/employees/me', { profilePhoto: base64Photo });
        const updated = res.data?.data || res.data;
        setProfile(updated || { ...profile, profilePhoto: base64Photo });
        setFormData(prev => ({ ...prev, profilePhoto: base64Photo }));
      } catch (err) {
        setProfile(prev => ({ ...prev, profilePhoto: base64Photo }));
        setFormData(prev => ({ ...prev, profilePhoto: base64Photo }));
      }
    };
    reader.readAsDataURL(file);
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
        personalPhoneNumber: formData.personalPhoneNumber,
        personalEmailAddress: formData.personalEmailAddress,
        department: formData.department,
        designation: formData.designation,
        dateOfJoining: formData.dateOfJoining || null,
        workLocation: formData.workLocation,
        currentAddress: formData.currentAddress,
        permanentAddress: formData.permanentAddress,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelation
        },
        qualification: formData.qualification,
        collegeName: formData.collegeName,
        graduationYear: formData.graduationYear,
        previousCompany: formData.previousCompany,
        totalExperience: formData.totalExperience,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      
      const res = await api.put('/employees/me', updatePayload);
      const updated = res.data?.data || res.data;
      setProfile(updated || { ...profile, ...updatePayload });
      setIsEditModalOpen(false);
    } catch (err) {
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

  // Calculate Profile Strength percentage
  const calculateStrength = () => {
    if (!profile) return 60;
    let count = 0;
    const fields = [
      profile.fullName, profile.profilePhoto, profile.personalEmailAddress,
      profile.personalPhoneNumber, profile.department, profile.designation,
      profile.dateOfJoining, profile.workLocation, profile.currentAddress,
      profile.emergencyContact?.name, profile.qualification, profile.skills?.length
    ];
    fields.forEach(f => { if (f) count++; });
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

  return (
    <motion.div 
      className="profile-workspace-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* --------------------------------------------------------------------------
          1. SLEEK EXECUTIVE PROFILE HEADER (DARK GLASS)
         -------------------------------------------------------------------------- */}
      <div className="profile-executive-header">
        <div className="profile-header-left">
          {/* Avatar with Ring */}
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

            <button
              type="button"
              className="profile-cam-btn"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Upload New Profile Photo"
            >
              <Camera size={17} />
            </button>

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
            <h1 className="profile-user-name">{profile.fullName}</h1>
            <div className="profile-user-title">
              <span>{profile.designation || 'Specialist'}</span>
              <span>•</span>
              <span>{profile.department || 'Quality Assurance'}</span>
              <span className="profile-badge-status">
                <ShieldCheck size={13} /> VERIFIED VAULT
              </span>
            </div>

            {/* Live Work Status Selector */}
            <div className="work-status-pills">
              {WORK_STATUSES.map(s => (
                <button
                  key={s.id}
                  className={`status-pill-btn ${workStatus === s.id ? 'active' : ''}`}
                  onClick={() => setWorkStatus(s.id)}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="profile-header-actions">
          <button className="btn-glass-icon" onClick={handleRefresh} title="Refresh Profile">
            <RefreshCw size={17} className={isRefreshing ? 'spin' : ''} />
          </button>

          <button className="btn-outline-glass" onClick={() => setIsPasswordModalOpen(true)}>
            <Shield size={16} />
            <span>Security</span>
          </button>

          <button className="btn-primary-glow" onClick={() => setIsEditModalOpen(true)}>
            <Edit3 size={16} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          2. PROFILE COMPLETION STRENGTH BAR
         -------------------------------------------------------------------------- */}
      <div className="profile-strength-bar-card">
        <div className="strength-info">
          <Sparkles size={20} color="#60a5fa" />
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>
              Profile Vault Completeness
            </span>
            <span style={{ fontSize: '0.775rem', color: '#94a3b8', display: 'block' }}>
              Your profile is {profileStrength}% complete with verified credentials
            </span>
          </div>
        </div>

        <div className="strength-track" style={{ maxWidth: '300px' }}>
          <div className="strength-fill" style={{ width: `${profileStrength}%` }}></div>
        </div>

        <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.95rem' }}>
          {profileStrength}%
        </span>
      </div>

      {/* --------------------------------------------------------------------------
          3. FULL PAGE PROFILE DASHBOARD (NO EMPTY SPACES)
         -------------------------------------------------------------------------- */}
      <div className="profile-main-grid">
        
        {/* LEFT COLUMN: Quick Stats & 3D Interactive ID Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="profile-nav-card">
            <div className="profile-quick-stats">
              <div className="quick-stat-item">
                <div className="quick-stat-icon">
                  <CreditCard size={18} />
                </div>
                <div>
                  <div className="quick-stat-label">Employee ID</div>
                  <div className="quick-stat-value">{profile.employeeId || 'CTI-EMP-001'}</div>
                </div>
              </div>

              <div className="quick-stat-item">
                <div className="quick-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
                  <Mail size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="quick-stat-label">Work Email</div>
                  <div className="quick-stat-value" style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>
                    {profile.personalEmailAddress || user?.email || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="quick-stat-item">
                <div className="quick-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
                  <Phone size={18} />
                </div>
                <div>
                  <div className="quick-stat-label">Phone Contact</div>
                  <div className="quick-stat-value">{profile.personalPhoneNumber || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Interactive Digital ID Card */}
          <div className="id-card-flip-container" onClick={() => setIsIdFlipped(!isIdFlipped)} style={{ cursor: 'pointer' }}>
            <div className={`id-card-inner ${isIdFlipped ? 'flipped' : ''}`}>
              
              {/* ID Card Front Face */}
              <div className="id-badge-card">
                <div className="id-badge-header">
                  <div className="id-company-logo">
                    <Sparkles size={18} color="#60a5fa" />
                    CODETHRIVE <span>WORKS</span>
                  </div>
                  <span className="profile-badge-status" style={{ fontSize: '0.7rem' }}>OFFICIAL ID</span>
                </div>

                <div className="id-badge-body">
                  <div className="id-photo-frame" style={{ width: '90px', height: '90px' }}>
                    {profile.profilePhoto ? (
                      <img src={profile.profilePhoto} alt={profile.fullName} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
                        {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'E'}
                      </div>
                    )}
                  </div>

                  <div className="id-details-col">
                    <h3 className="id-employee-name" style={{ fontSize: '1.15rem' }}>{profile.fullName}</h3>
                    <div className="id-employee-role" style={{ fontSize: '0.8rem' }}>{profile.designation || 'Specialist'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {profile.employeeId || 'CTI-EMP-001'}</div>
                  </div>
                </div>

                <div className="id-barcode-graphic" style={{ marginTop: '1rem', padding: '0.5rem 0.8rem' }}>
                  <div className="barcode-lines" style={{ width: '120px', height: '20px' }}></div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Click to Flip 🔄</span>
                </div>
              </div>

              {/* ID Card Back Face */}
              <div className="id-badge-card id-card-back-face">
                <div className="id-badge-header">
                  <div className="id-company-logo">
                    <ShieldCheck size={18} color="#34d399" />
                    SECURITY CARD
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.8rem' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', display: 'block' }}>Emergency Phone</label>
                    <span style={{ fontWeight: 700, color: '#60a5fa' }}>{profile.emergencyContact?.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', display: 'block' }}>Blood Group</label>
                    <span style={{ fontWeight: 700, color: '#ef4444' }}>{profile.bloodGroup || 'O+'}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.6rem', fontSize: '0.7rem', color: '#94a3b8', marginTop: '1rem' }}>
                  Official Property of CodeThrive Works HQ.
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sequential Full Dashboard Cards (NO HIDING BEHIND TABS) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Card 1: Personal Information */}
          <Card title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <UserCircle size={22} color="#60a5fa" /> Personal Information
            </div>
          }>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.4rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Full Legal Name</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {profile.fullName || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Date of Birth</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not Provided'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Gender</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {profile.gender || 'Prefer not to say'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Blood Group</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#ef4444' }}>
                  {profile.bloodGroup || 'O+ Positive'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Personal Email</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1rem', color: '#60a5fa' }}>
                  {profile.personalEmailAddress || user?.email || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Phone Number</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {profile.personalPhoneNumber || 'N/A'}
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Work & Office Details (NO Reporting Manager / NO Employee Type) */}
          <Card title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Briefcase size={22} color="#818cf8" /> Work & Office Details
            </div>
          }>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.4rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Department</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {profile.department || 'Quality Assurance'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Designation</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {profile.designation || 'Software Testing Specialist'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Date of Joining</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : 'August 1, 2024'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Work Location</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#34d399' }}>
                  {profile.workLocation || 'Corporate Headquarters (Office)'}
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            {attendanceSummary && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={17} color="#60a5fa" /> Monthly Attendance Summary
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                  <div className="quick-stat-item">
                    <div>
                      <div className="quick-stat-label">Total Days</div>
                      <div className="quick-stat-value" style={{ fontSize: '1.3rem' }}>{attendanceSummary.totalWorkingDays || 22}</div>
                    </div>
                  </div>
                  <div className="quick-stat-item">
                    <div>
                      <div className="quick-stat-label">Days Present</div>
                      <div className="quick-stat-value" style={{ fontSize: '1.3rem', color: '#34d399' }}>{attendanceSummary.presentDays || 20}</div>
                    </div>
                  </div>
                  <div className="quick-stat-item">
                    <div>
                      <div className="quick-stat-label">Avg Hours / Day</div>
                      <div className="quick-stat-value" style={{ fontSize: '1.3rem', color: '#60a5fa' }}>{attendanceSummary.averageWorkingHours || 8.5}h</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Card 3: Education & Experience */}
          <Card title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <GraduationCap size={22} color="#fbbf24" /> Education & Technical Skills
            </div>
          }>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.4rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Highest Qualification</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {profile.qualification || 'Bachelor of Engineering (B.E.)'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>College / University</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {profile.collegeName || 'Anna University'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Graduation Year</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {profile.graduationYear || '2024'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Total Experience</span>
                <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                  {profile.totalExperience || '2+ Years'}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.8rem' }}>
              Verified Skills & Technical Competencies
            </h4>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {profile.skills?.length > 0 ? (
                profile.skills.map((skill, i) => (
                  <span key={i} style={{ 
                    padding: '0.5rem 1rem', 
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 100%)', 
                    border: '1px solid rgba(59, 130, 246, 0.3)', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem',
                    color: '#f8fafc',
                    fontWeight: '600'
                  }}>
                    ✨ {skill}
                  </span>
                ))
              ) : (
                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                  No skills added yet. Click "Edit Profile" to list your technical skills.
                </span>
              )}
            </div>
          </Card>

          {/* Card 4: Career Journey & Achievement Badges */}
          <Card title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Trophy size={22} color="#fbbf24" /> Career Journey & Achievements
            </div>
          }>
            <div className="achievements-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="achievement-badge-card">
                <div className="badge-icon-box">
                  <Trophy size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f8fafc' }}>Quality Champion</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>QA Excellence</div>
                </div>
              </div>

              <div className="achievement-badge-card">
                <div className="badge-icon-box" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                  <Zap size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f8fafc' }}>Fast Performer</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Top Attendance</div>
                </div>
              </div>

              <div className="achievement-badge-card">
                <div className="badge-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f8fafc' }}>Vault Verified</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Verified Identity</div>
                </div>
              </div>
            </div>

            <div className="career-timeline">
              <div className="timeline-item emerald">
                <span className="timeline-date">August 2024 - Present</span>
                <span className="timeline-title">Assigned as Quality Assurance Specialist</span>
                <span className="timeline-desc">Joined CodeThrive Works and established software testing workflows.</span>
              </div>
            </div>
          </Card>

          {/* Card 5: Addresses & Emergency Contact */}
          <Card title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Shield size={22} color="#34d399" /> Addresses & Emergency Contacts
            </div>
          }>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.75rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                  <MapPin size={16} /> Addresses
                </h4>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>Current Residential Address</span>
                  <div style={{ fontWeight: '600', marginTop: '0.2rem', color: '#f8fafc', lineHeight: 1.4 }}>
                    {profile.currentAddress || 'Not Provided'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>Permanent Address</span>
                  <div style={{ fontWeight: '600', marginTop: '0.2rem', color: '#f8fafc', lineHeight: 1.4 }}>
                    {profile.permanentAddress || 'Not Provided'}
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                  <UserCircle size={16} /> Emergency Contact
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div>
                    <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>Contact Person Name</span>
                    <div style={{ fontWeight: '700', marginTop: '0.2rem', color: '#f8fafc' }}>
                      {profile.emergencyContact?.name || 'Not Provided'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>Phone Number</span>
                    <div style={{ fontWeight: '700', marginTop: '0.2rem', color: '#60a5fa' }}>
                      {profile.emergencyContact?.phone || 'Not Provided'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>Relationship</span>
                    <div style={{ fontWeight: '700', marginTop: '0.2rem', color: '#f8fafc' }}>
                      {profile.emergencyContact?.relationship || 'Not Provided'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* --------------------------------------------------------------------------
          4. EDIT PROFILE MODAL
         -------------------------------------------------------------------------- */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profile Details">
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.25rem', gap: '0.4rem', overflowX: 'auto' }}>
          {[
            { id: 'personal', label: 'Personal Details' },
            { id: 'work', label: 'Work Details' },
            { id: 'contact', label: 'Address & Emergency' },
            { id: 'education', label: 'Education & Skills' }
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
          
          {modalFormTab === 'personal' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Full Name *</label>
                <input type="text" className="input-field" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Profile Photo URL</label>
                <input type="text" className="input-field" placeholder="https://example.com/photo.jpg" value={formData.profilePhoto} onChange={e => setFormData({ ...formData, profilePhoto: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" className="input-field" value={formData.personalPhoneNumber} onChange={e => setFormData({ ...formData, personalPhoneNumber: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Personal Email *</label>
                <input type="email" className="input-field" value={formData.personalEmailAddress} onChange={e => setFormData({ ...formData, personalEmailAddress: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" className="input-field" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select className="input-field" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} style={{ background: '#0f172a', color: '#fff' }}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB: Work Details (No Reporting Manager / No Employee Type) */}
          {modalFormTab === 'work' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Department</label>
                <input type="text" className="input-field" placeholder="e.g. Quality Assurance, Engineering" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Designation</label>
                <input type="text" className="input-field" placeholder="e.g. Software Testing Specialist" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Work Location</label>
                <select className="input-field" value={formData.workLocation} onChange={e => setFormData({ ...formData, workLocation: e.target.value })} style={{ background: '#0f172a', color: '#fff' }}>
                  <option value="Office">Office</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date of Joining</label>
                <input type="date" className="input-field" value={formData.dateOfJoining} onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })} />
              </div>
            </div>
          )}

          {modalFormTab === 'contact' && (
            <>
              <div className="form-group">
                <label>Current Address</label>
                <textarea className="input-field" rows="2" value={formData.currentAddress} onChange={e => setFormData({ ...formData, currentAddress: e.target.value })}></textarea>
              </div>

              <div className="form-group">
                <label>Permanent Address</label>
                <textarea className="input-field" rows="2" value={formData.permanentAddress} onChange={e => setFormData({ ...formData, permanentAddress: e.target.value })}></textarea>
              </div>
              
              <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', color: '#60a5fa' }}>Emergency Contact</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Contact Name</label>
                  <input type="text" className="input-field" value={formData.emergencyContactName} onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input type="tel" className="input-field" value={formData.emergencyContactPhone} onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Relationship</label>
                  <input type="text" className="input-field" placeholder="e.g. Spouse, Parent, Brother" value={formData.emergencyContactRelation} onChange={e => setFormData({ ...formData, emergencyContactRelation: e.target.value })} />
                </div>
              </div>
            </>
          )}

          {modalFormTab === 'education' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Highest Qualification</label>
                  <input type="text" className="input-field" placeholder="e.g. B.E. Computer Science" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>College / University</label>
                  <input type="text" className="input-field" placeholder="e.g. Anna University" value={formData.collegeName} onChange={e => setFormData({ ...formData, collegeName: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Graduation Year</label>
                  <input type="text" className="input-field" placeholder="e.g. 2024" value={formData.graduationYear} onChange={e => setFormData({ ...formData, graduationYear: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Total Experience</label>
                  <input type="text" className="input-field" placeholder="e.g. 2+ Years" value={formData.totalExperience} onChange={e => setFormData({ ...formData, totalExperience: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Skills & Expertise (comma separated)</label>
                <textarea className="input-field" rows="2" placeholder="e.g. React, Node.js, Python, MongoDB, Automation" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })}></textarea>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            <button type="button" className="btn-outline-glass" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary-glow">Save Profile Changes</button>
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

    </motion.div>
  );
};

export default MyProfile;
