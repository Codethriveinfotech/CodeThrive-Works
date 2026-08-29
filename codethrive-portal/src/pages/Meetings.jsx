import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { 
  Briefcase, Calendar, Clock, Video, 
  MapPin, Users, PlusCircle, CheckCircle2 
} from 'lucide-react';
import './Modules.css';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    agenda: '',
    meetingLink: '',
    location: '',
    participants: []
  });

  useEffect(() => {
    fetchMeetings();
    fetchEmployees();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/meetings/my-meetings');
      setMeetings(res.data.data);
    } catch (err) {
      console.error('Failed to fetch meetings', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/meetings', formData);
      setMeetings([...meetings, res.data.data]);
      setIsScheduleModalOpen(false);
      setFormData({
        title: '', date: '', time: '', agenda: '', meetingLink: '', location: '', participants: []
      });
      alert('Meeting scheduled successfully');
      fetchMeetings(); // Refresh to get populated data
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule meeting');
    }
  };

  const today = new Date();
  today.setHours(0,0,0,0);

  const todaysMeetings = meetings.filter(m => {
    const d = new Date(m.date);
    d.setHours(0,0,0,0);
    return d.getTime() === today.getTime() && m.status === 'Scheduled';
  });

  const upcomingMeetings = meetings.filter(m => {
    const d = new Date(m.date);
    d.setHours(0,0,0,0);
    return d.getTime() > today.getTime() && m.status === 'Scheduled';
  });

  const completedMeetings = meetings.filter(m => m.status === 'Completed' || m.status === 'Cancelled' || new Date(m.date) < today);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Meetings...</p>
    </div>
  );

  const MeetingCard = ({ meeting }) => (
    <div style={{ background: 'var(--bg-main)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{meeting.title}</h4>
          <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14}/> {new Date(meeting.date).toLocaleDateString()}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14}/> {meeting.time}</span>
          </div>
        </div>
        <StatusBadge status={meeting.status} />
      </div>

      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
        <strong>Agenda:</strong> {meeting.agenda}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
        {meeting.meetingLink && (
          <a href={meeting.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', textDecoration: 'none' }}>
            <Video size={14} style={{marginRight: '0.5rem'}}/> Join Meeting
          </a>
        )}
        {meeting.location && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'var(--glass-bg)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
            <MapPin size={14}/> {meeting.location}
          </span>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Users size={16} color="var(--text-muted)" />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Organizer: {meeting.organizer?.name || 'CodeThrive Admin'}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Meetings & Schedule</h1>
          <p style={{ color: 'var(--text-muted)' }}>Keep track of your online and offline meetings.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsScheduleModalOpen(true)}>
          <PlusCircle size={16} style={{marginRight: '0.5rem'}} /> Schedule Meeting
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Today's Meetings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0, paddingBottom: '0.5rem', borderBottom: '2px solid var(--primary)' }}>Today's Meetings</h3>
          {todaysMeetings.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} style={{ opacity: 0.2, margin: '0 auto 1rem', color: 'var(--success)' }} />
              <p>No meetings scheduled for today.</p>
            </Card>
          ) : (
            todaysMeetings.map(m => <MeetingCard key={m._id} meeting={m} />)
          )}
        </div>

        {/* Upcoming Meetings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0, paddingBottom: '0.5rem', borderBottom: '2px solid var(--accent)' }}>Upcoming</h3>
          {upcomingMeetings.length === 0 ? (
             <Card style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p>No upcoming meetings.</p>
             </Card>
          ) : (
            upcomingMeetings.map(m => <MeetingCard key={m._id} meeting={m} />)
          )}
        </div>
      </div>

      {/* Completed Meetings */}
      <div>
        <h3 style={{ fontSize: '1.2rem', margin: '1rem 0', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Past Meetings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {completedMeetings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No past meetings.</p>
          ) : (
            completedMeetings.map(m => <MeetingCard key={m._id} meeting={m} />)
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Schedule Meeting">
        <form onSubmit={handleScheduleMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label>Meeting Title</label>
            <input type="text" className="input-field" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Date</label>
              <input type="date" className="input-field" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Time (HH:MM)</label>
              <input type="time" className="input-field" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label>Agenda / Description</label>
            <textarea className="input-field" rows="3" required value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})}></textarea>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Meeting Link (Google Meet / Zoom)</label>
              <input type="url" className="input-field" value={formData.meetingLink} onChange={e => setFormData({...formData, meetingLink: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Physical Location (Optional)</label>
              <input type="text" className="input-field" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label>Participants</label>
            <select multiple className="input-field" style={{ height: '100px' }} value={formData.participants} onChange={e => {
              const options = [...e.target.selectedOptions];
              const values = options.map(option => option.value);
              setFormData({...formData, participants: values});
            }}>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.fullName} ({emp.designation})</option>
              ))}
            </select>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hold Ctrl/Cmd to select multiple</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsScheduleModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Schedule Meeting</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Meetings;
