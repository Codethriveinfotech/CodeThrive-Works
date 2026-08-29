import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import { 
  Bell, CheckCircle2, AlertCircle, Calendar, 
  FileText, Briefcase, MailOpen, Trash2
} from 'lucide-react';
import './Modules.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'Task': return <CheckCircle2 size={20} color="var(--primary)" />;
      case 'Leave': return <Calendar size={20} color="var(--warning)" />;
      case 'Meeting': return <Briefcase size={20} color="var(--success)" />;
      case 'Document': return <FileText size={20} color="var(--accent)" />;
      case 'System': return <AlertCircle size={20} color="var(--danger)" />;
      default: return <Bell size={20} color="var(--text-muted)" />;
    }
  };

  const filteredNotifications = filter === 'All' 
    ? notifications 
    : notifications.filter(n => n.notificationType === filter);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Notifications...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Notification Center</h1>
          <p style={{ color: 'var(--text-muted)' }}>Stay updated with your latest tasks, meetings, and announcements.</p>
        </div>
        <button className="btn btn-outline" onClick={markAllAsRead}>
          <MailOpen size={16} style={{marginRight: '0.5rem'}} /> Mark All as Read
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', paddingBottom: '1px' }}>
        {['All', 'Task', 'Leave', 'Meeting', 'Document', 'System'].map(tab => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            style={{ 
              padding: '0.75rem 1rem', background: 'transparent',
              border: 'none', borderBottom: filter === tab ? '2px solid var(--primary)' : '2px solid transparent',
              color: filter === tab ? 'var(--primary-light)' : 'var(--text-muted)',
              fontWeight: filter === tab ? 600 : 500,
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {tab} {tab !== 'All' && `(${notifications.filter(n => n.notificationType === tab && !n.isRead).length})`}
          </button>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <Bell size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h3>No Notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredNotifications.map(notif => (
              <div key={notif._id} style={{ 
                display: 'flex', gap: '1.5rem', padding: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                background: notif.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                transition: 'background 0.2s'
              }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  background: 'var(--bg-main)', border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {getIcon(notif.notificationType)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: notif.isRead ? 500 : 600, color: notif.isRead ? 'var(--text-main)' : '#fff' }}>
                      {notif.title}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {notif.description}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <StatusBadge status={notif.priority} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>{notif.notificationType}</span>
                    
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                      {!notif.isRead && (
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => markAsRead(notif._id)}>
                          Mark Read
                        </button>
                      )}
                      {notif.actionLink && (
                        <a href={notif.actionLink} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                          View Details
                        </a>
                      )}
                      <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }} onClick={() => deleteNotification(notif._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Notifications;
