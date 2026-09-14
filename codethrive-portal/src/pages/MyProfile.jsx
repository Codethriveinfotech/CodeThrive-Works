import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  UserCircle, Mail, Phone, MapPin,
  Briefcase, Shield, Camera, Edit3, GraduationCap,
  Sparkles, Trophy, CreditCard, RefreshCw, Calendar,
  ShieldCheck, Zap, Landmark, CheckCircle2, Sliders,
  RotateCw, ZoomIn, ZoomOut, Move
} from 'lucide-react';
import './MyProfile.css';

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
          designation: user?.designation || (isAdmin ? 'System Administrator' : 'Software Testing Specialist'),
          department: user?.department || (isAdmin ? 'Management' : 'Quality Assurance & Software Testing'),
          employmentType: 'Full-Time',
          status: 'Active',
          workLocation: 'Office',
          skills: ['Software Testing', 'Quality Assurance', 'Automation Testing', 'React Control']
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
        <div className="header-glow-bg"></div>

        <div className="profile-header-left">
          {/* Avatar with Ring & Online Status */}
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
                <Camera size={16} />
              </button>

              {profile.profilePhoto && (
                <button
                  type="button"
                  className="profile-adjust-btn"
                  onClick={handleAdjustCurrentPhoto}
                  title="Adjust & Position Current Photo"
                >
                  <Sliders size={14} />
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
            <div className="profile-badge-row">
              <span className="profile-badge-status">
                <span className="pulse-dot"></span> Active
              </span>
              <span className="profile-badge-id">
                <CreditCard size={13} /> {profile.employeeId || 'CTI-EMP-001'}
              </span>
              <span className="profile-badge-role">
                <ShieldCheck size={13} /> {user?.role ? user.role.toUpperCase() : 'MANAGEMENT'}
              </span>
            </div>

            <h1 className="profile-user-name">{profile.fullName}</h1>

            <div className="profile-user-title">
              <span className="title-highlight">{profile.designation || 'Specialist'}</span>
              <span className="bullet">•</span>
              <span>{profile.department || 'Quality Assurance'}</span>
            </div>

            <div className="profile-meta-tags">
              <span className="profile-meta-tag">
                <Mail size={13} /> {profile.personalEmailAddress || user?.email || 'N/A'}
              </span>
              <span className="profile-meta-tag">
                <Phone size={13} /> {profile.personalPhoneNumber || '9876543210'}
              </span>
              <span className="profile-meta-tag">
                <MapPin size={13} /> {profile.workLocation || 'Office'}
              </span>
              <span className="profile-meta-tag">
                <Calendar size={13} /> Joined {profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Aug 2024'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="profile-header-actions">
          {profile?.profilePhoto && (
            <button className="btn-outline-glass" onClick={handleAdjustCurrentPhoto} title="Adjust Photo Position">
              <Sliders size={16} />
              <span>Adjust Photo</span>
            </button>
          )}

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
          2. EXECUTIVE QUICK STATS BANNER
         -------------------------------------------------------------------------- */}
      <div className="header-stats-strip">
        <div className="header-stat-box">
          <div className="quick-stat-icon">
            <CreditCard size={20} />
          </div>
          <div>
            <div className="quick-stat-label">Employee ID</div>
            <div className="quick-stat-value">{profile.employeeId || 'CTI-EMP-001'}</div>
          </div>
        </div>

        <div className="header-stat-box">
          <div className="quick-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
            <Mail size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="quick-stat-label">Work Email</div>
            <div className="quick-stat-value" style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>
              {profile.personalEmailAddress || user?.email || 'N/A'}
            </div>
          </div>
        </div>

        <div className="header-stat-box">
          <div className="quick-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <Phone size={20} />
          </div>
          <div>
            <div className="quick-stat-label">Phone Contact</div>
            <div className="quick-stat-value">{profile.personalPhoneNumber || '9876543210'}</div>
          </div>
        </div>

        <div className="header-stat-box">
          <div className="quick-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
            <MapPin size={20} />
          </div>
          <div>
            <div className="quick-stat-label">Work Location</div>
            <div className="quick-stat-value">{profile.workLocation || 'Corporate HQ (Office)'}</div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------------
          3. PROFILE COMPLETION STRENGTH BAR (100% FILL TARGET)
         -------------------------------------------------------------------------- */}
      <div className="profile-strength-bar-card">
        <div className="strength-info">
          <Sparkles size={20} color="#60a5fa" />
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>
              Profile Vault Completeness
            </span>
            <span style={{ fontSize: '0.775rem', color: '#94a3b8', display: 'block' }}>
              {profileStrength === 100 
                ? '🎉 Excellent! Your IT Employee profile is 100% complete and fully verified.' 
                : `Your profile is ${profileStrength}% complete. Fill all details in "Edit Profile" to reach 100%.`}
            </span>
          </div>
        </div>

        <div className="strength-track" style={{ maxWidth: '300px' }}>
          <div className="strength-fill" style={{ width: `${profileStrength}%` }}></div>
        </div>

        <span style={{ fontWeight: 800, color: profileStrength === 100 ? '#34d399' : '#60a5fa', fontSize: '0.95rem' }}>
          {profileStrength}%
        </span>
      </div>

      {/* --------------------------------------------------------------------------
          4. FULL PAGE IT PROFILE DASHBOARD (NEAT, ORGANIZED CARDS)
         -------------------------------------------------------------------------- */}
      <div className="profile-main-grid">
        {/* Card 1: Personal Details & Identity */}
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCircle size={22} color="#60a5fa" /> Personal & Identity Details
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
                {profile.bloodGroup || 'Not Provided'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Marital Status</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                {profile.maritalStatus || 'Single'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Nationality</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                {profile.nationality || 'Indian'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Personal Email</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1rem', color: '#60a5fa', wordBreak: 'break-all' }}>
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

        {/* Card 2: Work & Corporate Details */}
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Briefcase size={22} color="#818cf8" /> Work & Corporate Employment
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
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Employment Type</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#34d399' }}>
                {profile.employmentType || 'Full-Time'}
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
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#60a5fa' }}>
                {profile.workLocation || 'Office'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Account Status</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={16} /> Active Verified
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

        {/* Card 3: Bank Account & Payroll Tax Credentials (IT Standard) */}
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Landmark size={22} color="#34d399" /> Bank Account & Tax Credentials
          </div>
        }>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.4rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Bank Account Holder</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                {profile.bankAccountHolderName || profile.fullName || 'Not Provided'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Bank Name</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                {profile.bankName || 'Not Provided'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Account Number</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#60a5fa', fontFamily: 'monospace' }}>
                {profile.accountNumber ? profile.accountNumber : 'Not Provided'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>IFSC Code</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc', fontFamily: 'monospace' }}>
                {profile.ifscCode || 'Not Provided'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Branch Name</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                {profile.branchName || 'Not Provided'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>PAN Card Number</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#fbbf24', fontFamily: 'monospace' }}>
                {profile.panNumber || 'Not Provided'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Aadhaar / National ID</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc', fontFamily: 'monospace' }}>
                {profile.aadhaarOrIdentityProofNumber || 'Not Provided'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>UPI ID (Optional)</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#34d399' }}>
                {profile.upiId || 'Not Provided'}
              </div>
            </div>
          </div>
        </Card>

        {/* Card 4: Education & Technical Skills */}
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
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Previous Organization</span>
              <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '1.05rem', color: '#f8fafc' }}>
                {profile.previousCompany || 'Not Provided'}
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
            Verified Technical Skills & Competencies
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
                No skills listed yet. Click "Edit Profile" to add technical skills.
              </span>
            )}
          </div>
        </Card>

        {/* Card 5: Career Journey & Achievements */}
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Trophy size={22} color="#fbbf24" /> Career Achievements & Milestones
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

        {/* Card 6: Addresses & Emergency Contacts */}
        <Card title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={22} color="#34d399" /> Addresses & Emergency Contact
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

      {/* --------------------------------------------------------------------------
          5. INTERACTIVE IMAGE CROP & ADJUSTMENT MODAL
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
            { id: 'payroll', label: '3. Bank & Tax' },
            { id: 'education', label: '4. Education & Skills' },
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

              <div className="form-group">
                <label>Blood Group</label>
                <input type="text" className="input-field" placeholder="e.g. O+, A+, B+" value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Marital Status</label>
                <select className="input-field" value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })} style={{ background: '#0f172a', color: '#fff' }}>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Nationality</label>
                <input type="text" className="input-field" placeholder="e.g. Indian" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />
              </div>
            </div>
          )}

          {/* TAB 2: Work Details */}
          {modalFormTab === 'work' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Department</label>
                <input type="text" className="input-field" placeholder="e.g. Quality Assurance, Software Engineering" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Designation</label>
                <input type="text" className="input-field" placeholder="e.g. Software Testing Specialist" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Employment Type</label>
                <select className="input-field" value={formData.employmentType} onChange={e => setFormData({ ...formData, employmentType: e.target.value })} style={{ background: '#0f172a', color: '#fff' }}>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="form-group">
                <label>Work Location</label>
                <select className="input-field" value={formData.workLocation} onChange={e => setFormData({ ...formData, workLocation: e.target.value })} style={{ background: '#0f172a', color: '#fff' }}>
                  <option value="Office">Office</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Date of Joining</label>
                <input type="date" className="input-field" value={formData.dateOfJoining} onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })} />
              </div>
            </div>
          )}

          {/* TAB 3: Bank & Tax Details */}
          {modalFormTab === 'payroll' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Account Holder Name</label>
                <input type="text" className="input-field" placeholder="Full name as in bank account" value={formData.bankAccountHolderName} onChange={e => setFormData({ ...formData, bankAccountHolderName: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Bank Name</label>
                <input type="text" className="input-field" placeholder="e.g. HDFC Bank, ICICI Bank, SBI" value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Bank Account Number</label>
                <input type="text" className="input-field" placeholder="e.g. 50100234567890" value={formData.accountNumber} onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} />
              </div>

              <div className="form-group">
                <label>IFSC Code</label>
                <input type="text" className="input-field" placeholder="e.g. HDFC0001234" value={formData.ifscCode} onChange={e => setFormData({ ...formData, ifscCode: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Branch Name</label>
                <input type="text" className="input-field" placeholder="e.g. Main Branch, Chennai" value={formData.branchName} onChange={e => setFormData({ ...formData, branchName: e.target.value })} />
              </div>

              <div className="form-group">
                <label>PAN Card Number</label>
                <input type="text" className="input-field" placeholder="e.g. ABCDE1234F" value={formData.panNumber} onChange={e => setFormData({ ...formData, panNumber: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Aadhaar / National Identity Number</label>
                <input type="text" className="input-field" placeholder="e.g. 1234 5678 9012" value={formData.aadhaarOrIdentityProofNumber} onChange={e => setFormData({ ...formData, aadhaarOrIdentityProofNumber: e.target.value })} />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>UPI ID (Optional)</label>
                <input type="text" className="input-field" placeholder="e.g. user@upi" value={formData.upiId} onChange={e => setFormData({ ...formData, upiId: e.target.value })} />
              </div>
            </div>
          )}

          {/* TAB 4: Education & Skills */}
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
                  <label>Previous Organization</label>
                  <input type="text" className="input-field" placeholder="e.g. Infosys, TCS" value={formData.previousCompany} onChange={e => setFormData({ ...formData, previousCompany: e.target.value })} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Total Experience</label>
                  <input type="text" className="input-field" placeholder="e.g. 2+ Years" value={formData.totalExperience} onChange={e => setFormData({ ...formData, totalExperience: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Technical Skills & Tools (comma separated)</label>
                <textarea className="input-field" rows="2" placeholder="e.g. React, Node.js, Python, Automation Testing, JIRA, Cypress" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })}></textarea>
              </div>
            </>
          )}

          {/* TAB 5: Address & Emergency Contact */}
          {modalFormTab === 'contact' && (
            <>
              <div className="form-group">
                <label>Current Residential Address</label>
                <textarea className="input-field" rows="2" placeholder="House/Flat No, Street, City, State, Pincode" value={formData.currentAddress} onChange={e => setFormData({ ...formData, currentAddress: e.target.value })}></textarea>
              </div>

              <div className="form-group">
                <label>Permanent Address</label>
                <textarea className="input-field" rows="2" placeholder="House/Flat No, Street, City, State, Pincode" value={formData.permanentAddress} onChange={e => setFormData({ ...formData, permanentAddress: e.target.value })}></textarea>
              </div>
              
              <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', color: '#60a5fa' }}>Emergency Contact</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Emergency Contact Name</label>
                  <input type="text" className="input-field" placeholder="Contact Person Name" value={formData.emergencyContactName} onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Phone</label>
                  <input type="tel" className="input-field" placeholder="Emergency Phone" value={formData.emergencyContactPhone} onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Relationship</label>
                  <input type="text" className="input-field" placeholder="e.g. Spouse, Parent, Sibling" value={formData.emergencyContactRelation} onChange={e => setFormData({ ...formData, emergencyContactRelation: e.target.value })} />
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

    </motion.div>
  );
};

export default MyProfile;
