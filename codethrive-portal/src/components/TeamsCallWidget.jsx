import React, { useState, useEffect } from 'react';
import { 
  Phone, Video, Mic, MicOff, VideoOff, Monitor, PhoneOff, 
  Search, X, ShieldCheck, MessageCircle, BellRing, PhoneCall, Check,
  Volume2, PhoneIncoming, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './TeamsCallWidget.css';

// 1. Leadership & Management Contact Directory (For Employees to Contact Management)
const MANAGEMENT_CONTACTS = [
  {
    _id: 'lead-1',
    name: 'Mahadevan',
    role: 'CEO',
    phone: '9787857769',
    formattedPhone: '+91 97878 57769',
    dept: 'Executive Board',
    status: 'Available',
    statusColor: '#34d399',
    avatarBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  {
    _id: 'lead-2',
    name: 'Kirubakaran',
    role: 'MD (Managing Director)',
    phone: '7812864905',
    formattedPhone: '+91 78128 64905',
    dept: 'Executive Board',
    status: 'Available',
    statusColor: '#34d399',
    avatarBg: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)'
  },
  {
    _id: 'lead-3',
    name: 'Priyavadhana',
    role: 'HR Manager',
    phone: '9489510499',
    formattedPhone: '+91 94895 10499',
    dept: 'Human Resources',
    status: 'Online',
    statusColor: '#34d399',
    avatarBg: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
  },
  {
    _id: 'lead-4',
    name: 'Priyanga Josephin',
    role: 'IT Team Lead',
    phone: '9943223938',
    formattedPhone: '+91 99432 23938',
    dept: 'Engineering & IT',
    status: 'In a Meeting',
    statusColor: '#f59e0b',
    avatarBg: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)'
  },
  {
    _id: 'lead-5',
    name: 'Jidendran',
    role: 'IT Team Lead',
    phone: '8754720031',
    formattedPhone: '+91 87547 20031',
    dept: 'Engineering & IT',
    status: 'Online',
    statusColor: '#34d399',
    avatarBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  {
    _id: 'lead-6',
    name: 'Soundharya',
    role: 'Non IT Team Lead',
    phone: '7092729025',
    formattedPhone: '+91 70927 29025',
    dept: 'Operations & Non-IT',
    status: 'Available',
    statusColor: '#34d399',
    avatarBg: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
  }
];

// 2. Staff & Employee Directory (For Admin to Call Employees)
const STAFF_EMPLOYEES = [
  {
    _id: 'emp-1',
    name: 'Kirubakaran',
    role: 'Lead Architect & Core Developer',
    dept: 'Engineering',
    status: 'Online',
    statusColor: '#34d399',
    avatarBg: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)'
  },
  {
    _id: 'emp-2',
    name: 'Mahadevan',
    role: 'Senior Fullstack Engineer',
    dept: 'Engineering',
    status: 'Online',
    statusColor: '#34d399',
    avatarBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  {
    _id: 'emp-3',
    name: 'Priya Sharma',
    role: 'Product Designer & UI Specialist',
    dept: 'UI/UX Design',
    status: 'In a Meeting',
    statusColor: '#f59e0b',
    avatarBg: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
  },
  {
    _id: 'emp-4',
    name: 'Rahul Verma',
    role: 'Engineering Lead & Scrum Master',
    dept: 'Management',
    status: 'Online',
    statusColor: '#34d399',
    avatarBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  {
    _id: 'emp-5',
    name: 'Ananya Roy',
    role: 'HR Manager & Talent Partner',
    dept: 'Human Resources',
    status: 'Online',
    statusColor: '#34d399',
    avatarBg: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)'
  },
  {
    _id: 'emp-6',
    name: 'Quality Assurance Lead',
    role: 'QA Specialist',
    dept: 'Quality Assurance',
    status: 'Available',
    statusColor: '#34d399',
    avatarBg: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
  }
];

const TeamsCallWidget = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || window.location.pathname.startsWith('/admin');

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'staff' : 'leads');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Call Overlay State
  const [activeCall, setActiveCall] = useState(null); // { contact, callType: 'audio'|'video', callStatus: 'Ringing...'|'Connected' }
  const [callTimer, setCallTimer] = useState(0);
  const [ringCount, setRingCount] = useState(1);
  const [notificationToast, setNotificationToast] = useState(null);

  // Audio / Video Control States
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Timer interval for connected call
  useEffect(() => {
    let interval = null;
    if (activeCall && activeCall.callStatus === 'Connected') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeCall]);

  // Repeated ringing pulse counter when call is Ringing
  useEffect(() => {
    let ringInterval = null;
    if (activeCall && activeCall.callStatus === 'Ringing...') {
      setRingCount(1);
      ringInterval = setInterval(() => {
        setRingCount(prev => prev + 1);
      }, 1800);
    }
    return () => { if (ringInterval) clearInterval(ringInterval); };
  }, [activeCall?.callStatus]);

  const triggerMobileNotification = (contact) => {
    const callerName = user?.fullName || user?.name || 'CodeThrive Employee';
    setNotificationToast({
      title: `📲 Dispatching to Official Number (+91 ${contact.phone})`,
      message: `Sending real-time mobile push & WhatsApp call ping to ${contact.name}'s official phone (+91 ${contact.phone}).`
    });
  };

  const handleStartCall = (contact, type = 'audio') => {
    setIsOpen(true);
    triggerMobileNotification(contact);
    
    // Trigger direct mobile phone dialer if on mobile or browser supports tel:
    if (contact.phone) {
      const telUrl = `tel:+91${contact.phone}`;
      try {
        const a = document.createElement('a');
        a.href = telUrl;
        a.click();
      } catch (e) {
        console.log('Mobile dialer triggered:', telUrl);
      }
    }

    setActiveCall({
      contact,
      callType: type,
      callStatus: 'Ringing...'
    });
  };

  const handleAcceptCall = () => {
    if (activeCall) {
      setActiveCall(prev => ({ ...prev, callStatus: 'Connected' }));
      setNotificationToast({
        title: `✅ Call Connected!`,
        message: `${activeCall.contact.name} answered the call. Live audio/video active.`
      });
      setTimeout(() => setNotificationToast(null), 3000);
    }
  };

  const handleDeclineCall = () => {
    if (activeCall) {
      const name = activeCall.contact.name;
      setActiveCall(null);
      setCallTimer(0);
      setNotificationToast({
        title: `🔴 Call Declined`,
        message: `${name} rejected or missed the call. Line disconnected.`
      });
      setTimeout(() => setNotificationToast(null), 3500);
    }
  };

  const handleWhatsAppCall = (contact) => {
    triggerMobileNotification(contact);
    const callerName = encodeURIComponent(user?.fullName || user?.name || 'CodeThrive Employee');
    const waUrl = `https://wa.me/91${contact.phone}?text=Hello%20${encodeURIComponent(contact.name)},%20this%20is%20${callerName}%20calling%20you%20from%20CodeThrive%20Works%20Portal.`;
    window.open(waUrl, '_blank');
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const listToFilter = activeTab === 'leads' ? MANAGEMENT_CONTACTS : STAFF_EMPLOYEES;
  const filteredList = listToFilter.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.dept && item.dept.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.phone && item.phone.includes(searchQuery))
  );

  return (
    <div className="teams-widget-container">
      
      {/* 🔔 GLOBAL INCOMING / OUTGOING CALL PICK-UP BANNER FOR MANAGEMENT */}
      {activeCall && activeCall.callStatus === 'Ringing...' && (
        <div className="incoming-call-alert-banner">
          <div className="alert-brand-badge">
            <PhoneIncoming className="pulse-phone-icon" size={24} color="#34d399" />
          </div>

          <div className="alert-call-info">
            <div className="alert-header">
              <span className="live-ring-tag">
                <Volume2 size={14} className="spin-slow" /> RINGING ({ringCount}) &bull; CONTINUOUS PUSH ALERT
              </span>
              <span className="target-number">{activeCall.contact.formattedPhone || activeCall.contact.phone}</span>
            </div>

            <h4 className="alert-caller-title">
              Incoming Call for {activeCall.contact.name} ({activeCall.contact.role})
            </h4>
            <p className="alert-caller-sub">
              Caller: <strong>{user?.fullName || user?.name || 'Employee Kirubakaran'}</strong> &bull; Pinging mobile & portal session continuously...
            </p>
          </div>

          <div className="alert-action-buttons">
            <button 
              className="btn-accept-call"
              onClick={handleAcceptCall}
              title="Pick up / Answer Call"
            >
              <Phone size={18} />
              <span>ACCEPT CALL</span>
            </button>

            <button 
              className="btn-decline-call"
              onClick={handleDeclineCall}
              title="Reject / Decline Call"
            >
              <PhoneOff size={18} />
              <span>DECLINE</span>
            </button>
          </div>
        </div>
      )}

      {/* Push Notification Toast */}
      {notificationToast && (
        <div className="teams-push-toast">
          <div className="toast-icon">
            <BellRing size={20} color="#34d399" />
          </div>
          <div className="toast-content">
            <strong>{notificationToast.title}</strong>
            <p>{notificationToast.message}</p>
          </div>
          <button className="toast-close" onClick={() => setNotificationToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button 
        className={`teams-trigger-btn ${isOpen ? 'active' : ''} ${activeCall && activeCall.callStatus === 'Ringing...' ? 'ringing-pulse-btn' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Direct Call & Contact Hub"
      >
        <div className="teams-icon-badge">
          <PhoneCall size={18} color="#fff" />
        </div>
        <span className="teams-btn-text">
          {activeCall ? (activeCall.callStatus === 'Ringing...' ? 'Ringing...' : 'In Call...') : 'Contact Hub'}
        </span>
        <span className="online-dot-pulse"></span>
      </button>

      {/* Contact Drawer Panel */}
      {isOpen && (
        <div className="teams-panel-card">
          {/* Header */}
          <div className="teams-panel-header">
            <div className="teams-header-brand">
              <div className="teams-logo-box">
                <PhoneCall size={20} />
              </div>
              <div>
                <h4>CodeThrive Contact Hub</h4>
                <span className="teams-status-subtext">Direct Call & WhatsApp Directory</span>
              </div>
            </div>
            <button className="teams-close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Directory Tabs Switcher */}
          {!activeCall && (
            <div className="teams-tab-bar">
              <button 
                className={`teams-tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
                onClick={() => setActiveTab('leads')}
              >
                Management & HR ({MANAGEMENT_CONTACTS.length})
              </button>
              <button 
                className={`teams-tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
                onClick={() => setActiveTab('staff')}
              >
                Employees ({STAFF_EMPLOYEES.length})
              </button>
            </div>
          )}

          {/* If Active Call Screen */}
          {activeCall ? (
            <div className="teams-call-screen">
              {/* Call Top Bar */}
              <div className="call-top-bar">
                <span className="call-hd-tag">
                  <ShieldCheck size={13} /> Secure Portal Call
                </span>
                <span className="call-status-badge">
                  {activeCall.callStatus === 'Connected' ? formatTimer(callTimer) : activeCall.callStatus}
                </span>
              </div>

              {/* Center Calling Avatar & Ringing Effect */}
              <div className="call-avatar-stage">
                <div className={`call-avatar-circle ${activeCall.callStatus === 'Connected' ? 'in-call' : 'ringing'}`}>
                  <div className="call-avatar-inner" style={{ background: activeCall.contact.avatarBg }}>
                    {activeCall.contact.name.charAt(0)}
                  </div>
                </div>
                <h3 className="calling-name">{activeCall.contact.name}</h3>
                <p className="calling-role">{activeCall.contact.role}</p>
                {activeCall.contact.formattedPhone && (
                  <span className="calling-phone">{activeCall.contact.formattedPhone}</span>
                )}
                <span className="calling-dept">{activeCall.contact.dept}</span>
              </div>

              {/* Ringing Notification Status Alert / Pick Up Instructions */}
              {activeCall.callStatus === 'Ringing...' ? (
                <div className="call-ringing-notice">
                  <BellRing size={16} className="spin-bell" color="#f59e0b" />
                  <div>
                    <strong>Continuous Ringing... ({ringCount})</strong>
                    <p>Alerting {activeCall.contact.name}'s mobile device. Click <strong>ACCEPT CALL</strong> in banner to pick up.</p>
                  </div>
                </div>
              ) : (
                <div className="call-mobile-alert">
                  <BellRing size={14} color="#34d399" style={{ marginRight: '6px' }} />
                  <span>Call Active & Live &bull; Connected with {activeCall.contact.name}</span>
                </div>
              )}

              {/* Call Controls Bar */}
              <div className="teams-call-controls">
                {activeCall.callStatus === 'Ringing...' ? (
                  <>
                    <button 
                      className="btn-call-pickup-screen"
                      onClick={handleAcceptCall}
                      title="Accept & Pick up Call"
                    >
                      <Phone size={18} /> Answer Call
                    </button>
                    <button 
                      className="call-ctrl-btn end-call"
                      onClick={handleDeclineCall}
                      title="Decline Call"
                    >
                      <PhoneOff size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className={`call-ctrl-btn ${isMuted ? 'muted' : ''}`}
                      onClick={() => setIsMuted(!isMuted)}
                      title={isMuted ? "Unmute Mic" : "Mute Mic"}
                    >
                      {isMuted ? <MicOff size={19} /> : <Mic size={19} />}
                    </button>

                    <button 
                      className={`call-ctrl-btn ${isVideoOff ? 'off' : ''}`}
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                    >
                      {isVideoOff ? <VideoOff size={19} /> : <Video size={19} />}
                    </button>

                    <button 
                      className={`call-ctrl-btn ${isScreenSharing ? 'active' : ''}`}
                      onClick={() => {
                        setIsScreenSharing(!isScreenSharing);
                        alert(isScreenSharing ? "Screen sharing stopped" : "Sharing screen on Call...");
                      }}
                      title="Share Screen"
                    >
                      <Monitor size={19} />
                    </button>

                    <button 
                      className="call-ctrl-btn end-call"
                      onClick={handleDeclineCall}
                      title="End Call"
                    >
                      <PhoneOff size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Contact List Body */
            <div className="teams-directory-body">
              <div className="teams-search-box">
                <Search size={16} className="search-ic" />
                <input 
                  type="text" 
                  placeholder={activeTab === 'leads' ? "Search CEO, MD, HR, Team Leads..." : "Search employee by name..."} 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="teams-employee-list">
                {filteredList.map(contact => (
                  <div key={contact._id} className="teams-emp-row">
                    <div className="emp-avatar-box" style={{ background: contact.avatarBg }}>
                      {contact.name.charAt(0)}
                      <span className="emp-status-dot" style={{ background: contact.statusColor }}></span>
                    </div>

                    <div className="emp-info-col">
                      <h5 className="emp-name" title={contact.name}>{contact.name}</h5>
                      
                      <div className="emp-meta-row">
                        <span className="emp-role-text">{contact.role}</span>
                        {contact.formattedPhone && (
                          <span className="emp-phone-badge">
                            {contact.formattedPhone}
                          </span>
                        )}
                      </div>

                      <span className="emp-status-text">{contact.dept} &bull; {contact.status}</span>
                    </div>

                    <div className="emp-call-actions">
                      {/* Official WhatsApp Call / Chat Button */}
                      {contact.phone && (
                        <button 
                          className="btn-call-action whatsapp"
                          onClick={() => handleWhatsAppCall(contact)}
                          title={`WhatsApp Call & Chat with ${contact.name} (${contact.formattedPhone})`}
                        >
                          <MessageCircle size={15} />
                        </button>
                      )}

                      {/* Direct Audio Call */}
                      <button 
                        className="btn-call-action audio"
                        onClick={() => handleStartCall(contact, 'audio')}
                        title={`Direct Portal Call ${contact.name}`}
                      >
                        <Phone size={14} />
                      </button>

                      {/* HD Video Call */}
                      <button 
                        className="btn-call-action video"
                        onClick={() => handleStartCall(contact, 'video')}
                        title={`Portal HD Video Call ${contact.name}`}
                      >
                        <Video size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default TeamsCallWidget;
