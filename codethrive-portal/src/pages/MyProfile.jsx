import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { 
  UserCircle, Mail, Phone, MapPin, Building,
  Briefcase, Banknote, Shield, Camera, Edit3, Upload, CheckCircle2, GraduationCap
} from 'lucide-react';
import './Modules.css';

const MyProfile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'employment', 'contact', 'education'
  
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
    employmentType: 'Full-Time',
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
      const [profileRes, summaryRes, historyRes] = await Promise.all([
        api.get('/employees/me').catch(err => ({ data: null })),
        api.get('/attendance/summary').catch(err => ({ data: null })),
        api.get('/attendance/history').catch(err => ({ data: null }))
      ]);

      let data = profileRes?.data?.data || profileRes?.data;

      // Fallback if profile data is empty
      if (!data || !data.fullName) {
        const isAdmin = ['superadmin', 'admin', 'hr'].includes(user?.role);
        data = {
          fullName: user?.fullName || user?.name || (user?.email ? user.email.split('@')[0].toUpperCase() : 'CodeThrive Employee'),
          personalEmailAddress: user?.email || user?.personalEmailAddress || 'employee@codethrive.com',
          personalPhoneNumber: user?.phoneNumber || '9876543210',
          employeeId: user?.employeeId || (isAdmin ? 'CTI-ADM-001' : 'CTI-EMP-002'),
          designation: user?.designation || (isAdmin ? 'System Administrator' : 'Testing Specialist'),
          department: user?.department || (isAdmin ? 'Management' : 'Quality Assurance & Software Testing'),
          status: 'Active',
          workLocation: 'Office',
          employmentType: 'Full-Time',
          skills: ['Software Testing', 'Quality Assurance', 'React Portal Control', 'Automation Testing']
        };
      }

      setProfile(data);
      setAttendanceSummary(summaryRes?.data?.data || null);
      setAttendanceHistory(historyRes?.data?.data || []);

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
        employmentType: data.employmentType || 'Full-Time',
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
      console.warn('Failed to fetch profile data, using fallback profile', err);
      const fallbackData = {
        fullName: user?.fullName || user?.name || 'Mahadevan',
        personalEmailAddress: user?.email || 'mahadevan@codethrive.com',
        personalPhoneNumber: '9876543210',
        employeeId: user?.employeeId || 'CTI-2026-002',
        designation: user?.designation || 'Testing',
        department: 'Quality Assurance',
        status: 'Active',
        workLocation: 'Office',
        employmentType: 'Full-Time',
        skills: ['Testing', 'Quality Assurance', 'Web Development']
      };
      setProfile(fallbackData);
    } finally {
      setLoading(false);
    }
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
        setProfile(updated);
        setFormData(prev => ({ ...prev, profilePhoto: base64Photo }));
        alert('Profile picture updated successfully!');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to upload photo');
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
        employmentType: formData.employmentType,
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
      setProfile(updated);
      setIsEditModalOpen(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Profile...</p>
    </div>
  );

  if (!profile) return <div className="empty-state"><h3>Profile not found</h3></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: '700' }}>My Profile</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>View and update all your personal, employment, and professional details.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => setIsPasswordModalOpen(true)}>
            <Shield size={16} style={{marginRight: '0.5rem'}} /> Change Password
          </button>
          <button className="btn btn-primary" onClick={() => setIsEditModalOpen(true)}>
            <Edit3 size={16} style={{marginRight: '0.5rem'}} /> Edit Profile
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
        
        {/* Left Column - User Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card style={{ textAlign: 'center', padding: '2rem 1.5rem', position: 'relative' }}>
            
            {/* Avatar Section */}
            <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 1.5rem' }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                border: '3px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}>
                {profile.profilePhoto ? (
                  <img src={profile.profilePhoto} alt={profile.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '3.2rem', color: '#ffffff', fontWeight: 'bold' }}>
                    {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>

              {/* Camera Action Icon Badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Upload Profile Photo"
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  border: '3px solid var(--card-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                  color: '#ffffff',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Camera size={18} />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>

            <h2 style={{ margin: '0 0 0.3rem 0', fontSize: '1.4rem', fontWeight: '700' }}>{profile.fullName}</h2>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>{profile.designation || 'Employee'}</p>
            <StatusBadge status={profile.status || 'Active'} />
            
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={18} color="var(--primary)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee ID</div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{profile.employeeId || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={18} color="var(--primary)" />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', wordBreak: 'break-all' }}>{profile.personalEmailAddress || user?.email || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} color="var(--primary)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{profile.personalPhoneNumber || 'N/A'}</div>
                </div>
              </div>
            </div>

          </Card>
        </div>

        {/* Right Column - Details Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Employment Information */}
          <Card title="Employment Information">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Department</span>
                <div style={{ fontWeight: '600', marginTop: '0.25rem', fontSize: '1rem' }}>{profile.department || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Designation</span>
                <div style={{ fontWeight: '600', marginTop: '0.25rem', fontSize: '1rem' }}>{profile.designation || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reporting Manager</span>
                <div style={{ fontWeight: '600', marginTop: '0.25rem', fontSize: '1rem' }}>{profile.reportingManager?.fullName || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date of Joining</span>
                <div style={{ fontWeight: '600', marginTop: '0.25rem', fontSize: '1rem' }}>{profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Employment Type</span>
                <div style={{ fontWeight: '600', marginTop: '0.25rem', fontSize: '1rem' }}>{profile.employmentType || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Work Location</span>
                <div style={{ fontWeight: '600', marginTop: '0.25rem', fontSize: '1rem' }}>{profile.workLocation || 'N/A'}</div>
              </div>
            </div>
          </Card>

          {/* Address & Emergency Contact */}
          <Card title="Address & Emergency Contact">
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
               <div>
                 <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                   <MapPin size={16} /> Addresses
                 </h4>
                 <div style={{ marginBottom: '1rem' }}>
                   <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Address</span>
                   <div style={{ fontWeight: '500', marginTop: '0.25rem', lineHeight: '1.4' }}>{profile.currentAddress || 'Not Provided'}</div>
                 </div>
                 <div>
                   <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Permanent Address</span>
                   <div style={{ fontWeight: '500', marginTop: '0.25rem', lineHeight: '1.4' }}>{profile.permanentAddress || 'Not Provided'}</div>
                 </div>
               </div>

               <div>
                 <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                   <UserCircle size={16} /> Emergency Contact
                 </h4>
                 <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contact Name</span>
                      <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{profile.emergencyContact?.name || 'Not Provided'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phone Number</span>
                      <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{profile.emergencyContact?.phone || 'Not Provided'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Relationship</span>
                      <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{profile.emergencyContact?.relationship || 'Not Provided'}</div>
                    </div>
                 </div>
               </div>
             </div>
          </Card>

          {/* Education & Experience */}
          <Card title="Education & Professional Experience">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Highest Qualification</span>
                <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{profile.qualification || 'Not Provided'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>College / University</span>
                <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{profile.collegeName || 'Not Provided'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Graduation Year</span>
                <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{profile.graduationYear || 'Not Provided'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Previous Company</span>
                <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{profile.previousCompany || 'Not Provided'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Experience</span>
                <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{profile.totalExperience || 'Not Provided'}</div>
              </div>
            </div>
          </Card>

          {/* Skills & Expertise */}
          <Card title="Skills & Technical Expertise">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {profile.skills?.length > 0 ? (
                profile.skills.map((skill, i) => (
                  <span key={i} style={{ 
                    padding: '0.5rem 1rem', 
                    background: 'rgba(79, 70, 229, 0.12)', 
                    border: '1px solid rgba(79, 70, 229, 0.3)', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem',
                    color: 'var(--text-main)',
                    fontWeight: '500'
                  }}>
                    {skill}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No skills listed. Click "Edit Profile" to add your skills.</span>
              )}
            </div>
          </Card>

          {/* Attendance Summary */}
          {attendanceSummary && (
            <Card title="Work & Attendance Summary (This Month)">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Working Days</span>
                  <div style={{ fontWeight: 700, fontSize: '1.6rem', marginTop: '0.25rem' }}>{attendanceSummary.totalWorkingDays}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Days Present</span>
                  <div style={{ fontWeight: 700, fontSize: '1.6rem', marginTop: '0.25rem', color: 'var(--success)' }}>{attendanceSummary.presentDays}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Days Absent</span>
                  <div style={{ fontWeight: 700, fontSize: '1.6rem', marginTop: '0.25rem', color: 'var(--danger)' }}>{attendanceSummary.absentDays}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Avg. Hours / Day</span>
                  <div style={{ fontWeight: 700, fontSize: '1.6rem', marginTop: '0.25rem', color: 'var(--primary)' }}>{attendanceSummary.averageWorkingHours}h</div>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>

      {/* Comprehensive Edit Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profile Details">
        
        {/* Modal Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', gap: '0.5rem', overflowX: 'auto' }}>
          {[
            { id: 'personal', label: 'Personal Details' },
            { id: 'employment', label: 'Employment Info' },
            { id: 'contact', label: 'Address & Emergency' },
            { id: 'education', label: 'Education & Skills' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? '600' : 'normal',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* TAB 1: Personal Details */}
          {activeTab === 'personal' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Full Name *</label>
                  <input type="text" className="input-field" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Profile Photo URL</label>
                  <input type="text" className="input-field" placeholder="https://example.com/photo.jpg" value={formData.profilePhoto} onChange={e => setFormData({...formData, profilePhoto: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" className="input-field" value={formData.personalPhoneNumber} onChange={e => setFormData({...formData, personalPhoneNumber: e.target.value})} required />
                </div>

                <div className="form-group">
                  <label>Personal Email *</label>
                  <input type="email" className="input-field" value={formData.personalEmailAddress} onChange={e => setFormData({...formData, personalEmailAddress: e.target.value})} required />
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" className="input-field" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select className="input-field" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: Employment Info */}
          {activeTab === 'employment' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" className="input-field" placeholder="e.g. Engineering, HR" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Designation</label>
                  <input type="text" className="input-field" placeholder="e.g. Senior Software Engineer" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Employment Type</label>
                  <select className="input-field" value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})}>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Work Location</label>
                  <select className="input-field" value={formData.workLocation} onChange={e => setFormData({...formData, workLocation: e.target.value})}>
                    <option value="Office">Office</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Date of Joining</label>
                  <input type="date" className="input-field" value={formData.dateOfJoining} onChange={e => setFormData({...formData, dateOfJoining: e.target.value})} />
                </div>
              </div>
            </>
          )}

          {/* TAB 3: Address & Emergency */}
          {activeTab === 'contact' && (
            <>
              <div className="form-group">
                <label>Current Address</label>
                <textarea className="input-field" rows="2" value={formData.currentAddress} onChange={e => setFormData({...formData, currentAddress: e.target.value})}></textarea>
              </div>

              <div className="form-group">
                <label>Permanent Address</label>
                <textarea className="input-field" rows="2" value={formData.permanentAddress} onChange={e => setFormData({...formData, permanentAddress: e.target.value})}></textarea>
              </div>
              
              <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>Emergency Contact</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Contact Name</label>
                  <input type="text" className="input-field" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input type="tel" className="input-field" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Relationship</label>
                  <input type="text" className="input-field" placeholder="e.g. Spouse, Parent, Brother" value={formData.emergencyContactRelation} onChange={e => setFormData({...formData, emergencyContactRelation: e.target.value})} />
                </div>
              </div>
            </>
          )}

          {/* TAB 4: Education & Skills */}
          {activeTab === 'education' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Highest Qualification</label>
                  <input type="text" className="input-field" placeholder="e.g. B.E. Computer Science" value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>College / University</label>
                  <input type="text" className="input-field" placeholder="e.g. Anna University" value={formData.collegeName} onChange={e => setFormData({...formData, collegeName: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Graduation Year</label>
                  <input type="text" className="input-field" placeholder="e.g. 2024" value={formData.graduationYear} onChange={e => setFormData({...formData, graduationYear: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Total Experience</label>
                  <input type="text" className="input-field" placeholder="e.g. 3 Years" value={formData.totalExperience} onChange={e => setFormData({...formData, totalExperience: e.target.value})} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Previous Company</label>
                  <input type="text" className="input-field" placeholder="e.g. Tech Corp Inc" value={formData.previousCompany} onChange={e => setFormData({...formData, previousCompany: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label>Skills & Expertise (comma separated)</label>
                <textarea className="input-field" rows="2" placeholder="e.g. React, Node.js, Python, MongoDB, Communication" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})}></textarea>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {activeTab !== 'personal' && (
                <button type="button" className="btn btn-outline" onClick={() => {
                  const tabs = ['personal', 'employment', 'contact', 'education'];
                  setActiveTab(tabs[tabs.indexOf(activeTab) - 1]);
                }}>Previous Tab</button>
              )}
              {activeTab !== 'education' && (
                <button type="button" className="btn btn-outline" onClick={() => {
                  const tabs = ['personal', 'employment', 'contact', 'education'];
                  setActiveTab(tabs[tabs.indexOf(activeTab) + 1]);
                }}>Next Tab</button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save All Changes</button>
            </div>
          </div>

        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Change Password">
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" className="input-field" required value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" className="input-field" required minLength="6" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" className="input-field" required minLength="6" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Update Password</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default MyProfile;
