import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { 
  UserCircle, Mail, Phone, MapPin, Building,
  Briefcase, Banknote, Shield, Camera, Edit3
} from 'lucide-react';
import './Modules.css';

const MyProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    personalPhoneNumber: '',
    personalEmailAddress: '',
    currentAddress: '',
    permanentAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
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
        api.get('/employees/me'),
        api.get('/attendance/summary'),
        api.get('/attendance/history')
      ]);

      const data = profileRes.data || {};
      setProfile(data);
      setAttendanceSummary(summaryRes.data?.data || null);
      setAttendanceHistory(historyRes.data?.data || []);

      setFormData({
        personalPhoneNumber: data.personalPhoneNumber || '',
        personalEmailAddress: data.personalEmailAddress || '',
        currentAddress: data.currentAddress || '',
        permanentAddress: data.permanentAddress || '',
        emergencyContactName: data.emergencyContact?.name || '',
        emergencyContactPhone: data.emergencyContact?.phone || '',
        emergencyContactRelation: data.emergencyContact?.relationship || '',
        skills: data.skills?.join(', ') || ''
      });
    } catch (err) {
      console.error('Failed to fetch profile data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const updatePayload = {
        personalPhoneNumber: formData.personalPhoneNumber,
        personalEmailAddress: formData.personalEmailAddress,
        currentAddress: formData.currentAddress,
        permanentAddress: formData.permanentAddress,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelation
        },
        skills: formData.skills.split(',').map(s => s.trim())
      };
      
      const res = await api.put('/employees/me', updatePayload);
      setProfile(res.data || {});
      setIsEditModalOpen(false);
      alert('Profile updated successfully');
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
      alert('Password updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update password');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Profile...</p>
    </div>
  );

  if (!profile) return <div className="empty-state"><h3>Profile not found</h3></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>My Profile</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your personal and professional information.</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left Column - ID Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Card style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem', borderRadius: '50%', background: 'var(--primary-bg)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt={profile.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '3rem', color: 'var(--primary)', fontWeight: 'bold' }}>{profile.fullName.charAt(0)}</span>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '0.2rem', cursor: 'pointer' }}>
                <Camera size={16} color="var(--text-main)" />
              </div>
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>{profile.fullName}</h2>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)' }}>{profile.designation}</p>
            <StatusBadge status={profile.status} />
            
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Briefcase size={18} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Employee ID</div>
                  <div style={{ fontWeight: 500 }}>{profile.employeeId || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Mail size={18} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</div>
                  <div style={{ fontWeight: 500 }}>{profile.personalEmailAddress}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Phone size={18} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone</div>
                  <div style={{ fontWeight: 500 }}>{profile.personalPhoneNumber}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <Card title="Employment Information (Read-Only)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Department</span>
                <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{profile.department || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Designation</span>
                <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{profile.designation || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reporting Manager</span>
                <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{profile.reportingManager?.fullName || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date of Joining</span>
                <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Employment Type</span>
                <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{profile.employmentType || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Work Location</span>
                <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{profile.workLocation || 'N/A'}</div>
              </div>
            </div>
          </Card>

          <Card title="Address & Emergency Contact">
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
               <div>
                 <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><MapPin size={16} /> Addresses</h4>
                 <div style={{ marginBottom: '1rem' }}>
                   <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Address</span>
                   <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{profile.currentAddress || 'Not Provided'}</div>
                 </div>
                 <div>
                   <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Permanent Address</span>
                   <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{profile.permanentAddress || 'Not Provided'}</div>
                 </div>
               </div>
               <div>
                 <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}><UserCircle size={16} /> Emergency Contact</h4>
                 <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contact Name</span>
                      <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{profile.emergencyContact?.name || 'Not Provided'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phone Number</span>
                      <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{profile.emergencyContact?.phone || 'Not Provided'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Relationship</span>
                      <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{profile.emergencyContact?.relationship || 'Not Provided'}</div>
                    </div>
                 </div>
               </div>
             </div>
          </Card>

          <Card title="Skills & Expertise">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {profile.skills?.length > 0 ? (
                profile.skills.map((skill, i) => (
                  <span key={i} style={{ padding: '0.4rem 0.8rem', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem' }}>
                    {skill}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No skills listed. Update your profile.</span>
              )}
            </div>
          </Card>

          {/* New: Attendance Summary */}
          {attendanceSummary && (
            <Card title="Work & Attendance Summary (This Month)">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Working Days</span>
                  <div style={{ fontWeight: 600, fontSize: '1.5rem', marginTop: '0.25rem' }}>{attendanceSummary.totalWorkingDays}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Days Present</span>
                  <div style={{ fontWeight: 600, fontSize: '1.5rem', marginTop: '0.25rem', color: 'var(--success)' }}>{attendanceSummary.presentDays}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Days Absent</span>
                  <div style={{ fontWeight: 600, fontSize: '1.5rem', marginTop: '0.25rem', color: 'var(--danger)' }}>{attendanceSummary.absentDays}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Avg. Hours / Day</span>
                  <div style={{ fontWeight: 600, fontSize: '1.5rem', marginTop: '0.25rem', color: 'var(--primary)' }}>{attendanceSummary.averageWorkingHours}h</div>
                </div>
              </div>
            </Card>
          )}

          {/* New: Work History */}
          <Card title="Recent Work History">
            {attendanceHistory.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No recent work history found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.slice(0, 5).map(att => (
                      <tr key={att._id}>
                        <td>{new Date(att.date).toLocaleDateString()}</td>
                        <td><StatusBadge status={att.status} /></td>
                        <td>{att.firstLoginTime ? new Date(att.firstLoginTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                        <td>{att.lastLogoutTime ? new Date(att.lastLogoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                        <td>
                          {att.totalWorkDurationInSeconds 
                            ? `${Math.floor(att.totalWorkDurationInSeconds / 3600)}h ${Math.floor((att.totalWorkDurationInSeconds % 3600) / 60)}m` 
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profile">
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" className="input-field" value={formData.personalPhoneNumber} onChange={e => setFormData({...formData, personalPhoneNumber: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Personal Email</label>
              <input type="email" className="input-field" value={formData.personalEmailAddress} onChange={e => setFormData({...formData, personalEmailAddress: e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>Current Address</label>
            <textarea className="input-field" rows="2" value={formData.currentAddress} onChange={e => setFormData({...formData, currentAddress: e.target.value})}></textarea>
          </div>
          <div className="form-group">
            <label>Permanent Address</label>
            <textarea className="input-field" rows="2" value={formData.permanentAddress} onChange={e => setFormData({...formData, permanentAddress: e.target.value})}></textarea>
          </div>
          
          <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Emergency Contact</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Name</label>
              <input type="text" className="input-field" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" className="input-field" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Relationship</label>
              <input type="text" className="input-field" value={formData.emergencyContactRelation} onChange={e => setFormData({...formData, emergencyContactRelation: e.target.value})} />
            </div>
          </div>

          <h4 style={{ margin: '0.5rem 0 0 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Professional</h4>
          <div className="form-group">
            <label>Skills (comma separated)</label>
            <input type="text" className="input-field" placeholder="e.g. React, Node.js, Project Management" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
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
