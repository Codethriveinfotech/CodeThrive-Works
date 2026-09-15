import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Phone, Video, Mic, MicOff, VideoOff, Monitor, PhoneOff, 
  Search, X, ShieldCheck, MessageCircle, BellRing, PhoneCall, Check,
  Volume2, PhoneIncoming, AlertCircle, MessageSquare, Smartphone, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './TeamsCallWidget.css';

// 1. Leadership & Management Contact Directory (For Employees to Contact Management)
const MANAGEMENT_CONTACTS = [
  {
    _id: 'lead-1',
    name: 'Mahadhevan',
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
    role: 'HR Operations Manager',
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

const TeamsCallWidget = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || location.pathname.startsWith('/admin');

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredEmployees, setRegisteredEmployees] = useState([]);
  
  // Call Overlay State
  const [activeCall, setActiveCall] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [ringCount, setRingCount] = useState(1);
  const [notificationToast, setNotificationToast] = useState(null);

  // Audio / Video Control States
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Fetch real registered employees dynamically from DB & localStorage
  const fetchRegisteredContacts = async () => {
    try {
      const res = await api.get('/employees').catch(() => ({ data: { success: false, data: [] } }));
      let dbEmps = res.data && res.data.success && Array.isArray(res.data.data) ? res.data.data : [];
      
      // Also get local users if registered in browser session
      const localUsers = JSON.parse(localStorage.getItem('cti_local_users') || '[]');
      
      // Combine & format
      const combined = [...dbEmps];
      localUsers.forEach(lu => {
        const exists = combined.some(e => e.personalEmailAddress === lu.email || e.employeeId === lu.employeeId);
        if (!exists) {
          combined.push({
            _id: lu._id || 'local_' + Date.now(),
            fullName: lu.fullName || lu.name,
            employeeId: lu.employeeId,
            personalEmailAddress: lu.email,
            personalPhoneNumber: lu.phoneNumber || '9876543210',
            designation: lu.role || 'Software Engineer',
            department: lu.department || 'Engineering',
            status: 'Active'
          });
        }
      });

      // Filter out admin account itself so only staff/employees show
      const formattedList = combined
        .filter(emp => emp.personalEmailAddress !== 'admin@codethrive.com' && emp.employeeId !== 'CTI-ADM-001')
        .map((emp, idx) => {
          const rawPhone = emp.personalPhoneNumber || '9876543210';
          const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
          const colors = [
            'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
            'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)'
          ];
          return {
            _id: emp._id || `emp-${idx}`,
            name: emp.fullName || 'Registered Employee',
            role: emp.designation || 'Team Member',
            phone: cleanPhone,
            formattedPhone: cleanPhone.length === 10 ? `+91 ${cleanPhone.slice(0,5)} ${cleanPhone.slice(5)}` : cleanPhone,
            dept: emp.department || 'Engineering',
            status: 'Online',
            statusColor: '#34d399',
            avatarBg: colors[idx % colors.length]
          };
        });

      setRegisteredEmployees(formattedList);
    } catch (err) {
      console.warn('Failed to load registered contacts for Contact Hub:', err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchRegisteredContacts();
    }
  }, [isAdmin, isOpen]);

  // Request browser Notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Web Audio Ringtone Generator for continuous alert sound when calling
  useEffect(() => {
    let audioCtx = null;
    let ringInterval = null;

    if (activeCall && activeCall.callStatus === 'Ringing...') {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          const playTonePattern = () => {
            if (!audioCtx || audioCtx.state === 'closed') return;
            if (audioCtx.state === 'suspended') {
              audioCtx.resume();
            }
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
            osc2.frequency.setValueAtTime(480, audioCtx.currentTime);

            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(audioCtx.currentTime + 1.2);
            osc2.stop(audioCtx.currentTime + 1.2);
          };

          playTonePattern();
          ringInterval = setInterval(() => {
            playTonePattern();
            setRingCount(prev => prev + 1);
          }, 1800);
        }
      } catch (e) {
        console.log('Web Audio tone error:', e);
      }
    }

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [activeCall]);

  // Call timer counter when call connected
  useEffect(() => {
    let timerInterval = null;
    if (activeCall && activeCall.callStatus === 'Connected') {
      timerInterval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => { if (timerInterval) clearInterval(timerInterval); };
  }, [activeCall]);

  // Ring timer auto-accept / auto-advance simulation
  useEffect(() => {
    let ringInterval = null;
    if (activeCall && activeCall.callStatus === 'Ringing...') {
      ringInterval = setInterval(() => {
        setRingCount(prev => prev + 1);
      }, 1800);
    }
    return () => { if (ringInterval) clearInterval(ringInterval); };
  }, [activeCall]);

  // Hide widget completely on unauthenticated / login / register pages or when not logged in
  const isAuthPage = !user || (
    location.pathname.includes('/login') ||
    location.pathname.includes('/register') ||
    location.pathname.includes('/forgot-password') ||
    location.pathname.includes('/create-credentials') ||
    location.pathname === '/'
  );

  if (isAuthPage) {
    return null;
  }

  const triggerMobileNotification = (contact) => {
    const callerName = user?.fullName || user?.name || 'Employee User';
    
    // In-app toast banner
    setNotificationToast({
      title: `📲 Dialing & Pinging Mobile (+91 ${contact.phone})`,
      message: `Initiating continuous ring tone sound & direct SMS/call dispatch from ${callerName} to +91 ${contact.phone}.`
    });

    // Browser Push Notification (visible even if tab is minimized)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🔔 Urgent Portal Call from ${callerName}`, {
          body: `Calling ${contact.name} (${contact.role}) on registered mobile line +91 ${contact.phone}.`,
          icon: '/logo.png',
          requireInteraction: true
        });
      } catch (e) {
        console.log('System Notification error:', e);
      }
    }
  };

  const handleStartCall = (contact, type = 'audio') => {
    setIsOpen(true);
    triggerMobileNotification(contact);
    
    if (contact.phone) {
      const telUrl = `tel:+91${contact.phone}`;
      try {
        const a = document.createElement('a');
        a.href = telUrl;
        a.target = '_self';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        window.location.href = telUrl;
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
        title: `🔴 Call Ended`,
        message: `Direct line call with ${name} disconnected.`
      });
      setTimeout(() => setNotificationToast(null), 3500);
    }
  };

  const handleWhatsAppCall = (contact) => {
    triggerMobileNotification(contact);
    const callerName = user?.fullName || user?.name || 'Employee User';
    const callerPhone = user?.phone || user?.mobile || '';
    const callerRole = user?.role === 'admin' ? 'Management' : (user?.designation || 'Team Member');
    
    const isManagement = contact.role.includes('CEO') || contact.role.includes('MD') || contact.role.includes('HR') || contact.role.includes('Lead') || (contact.dept && contact.dept.includes('Executive'));
    const salutation = isManagement ? `Respected ${contact.name}` : `Dear ${contact.name}`;
    
    const msg = `Hello ${salutation},\n\nI am contacting you from the CodeThrive Infotech Portal.\n\n👤 Sender: ${callerName} (${callerRole})\n📱 Mobile: +91 ${callerPhone || 'Contact'}\n\nPlease join the live portal session or return my call.\nThank you!`;
    
    const waUrl = `https://wa.me/91${contact.phone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleSMSAlert = (contact) => {
    triggerMobileNotification(contact);
    const callerName = user?.fullName || user?.name || 'Employee User';
    const callerPhone = user?.phone || user?.mobile || '';
    const callerRole = user?.role === 'admin' ? 'Management' : (user?.designation || 'Team Member');
    
    const isManagement = contact.role.includes('CEO') || contact.role.includes('MD') || contact.role.includes('HR') || contact.role.includes('Lead') || (contact.dept && contact.dept.includes('Executive'));
    const salutation = isManagement ? `Respected ${contact.name}` : `Dear ${contact.name}`;
    
    const textMsg = `[URGENT PORTAL CALL ALERT] ${salutation}, Employee ${callerName} (${callerRole}${callerPhone ? `, Mob: +91 ${callerPhone}` : ''}) is calling your mobile line +91 ${contact.phone}. Please connect or check portal.`;
    
    const smsUrl = `sms:+91${contact.phone}?body=${encodeURIComponent(textMsg)}`;
    window.open(smsUrl, '_blank');
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Employees see Management Contacts ONLY; Management/Admins see REAL Registered Employees
  const listToFilter = isAdmin ? registeredEmployees : MANAGEMENT_CONTACTS;
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

      {/* Floating Trigger Button - Icon Only FAB */}
      <button 
        className={`teams-trigger-btn ${isOpen ? 'active' : ''} ${activeCall && activeCall.callStatus === 'Ringing...' ? 'ringing-pulse-btn' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={activeCall ? (activeCall.callStatus === 'Ringing...' ? 'Ringing...' : 'In Call...') : 'CodeThrive Contact Hub'}
        aria-label="Contact Hub"
      >
        <div className="teams-icon-badge">
          <PhoneCall size={20} color="#fff" />
        </div>
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
                <span className="teams-status-subtext">
                  {isAdmin ? 'Registered Employees Directory' : 'Management & HR Directory'}
                </span>
              </div>
            </div>
            <button className="teams-close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

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
                  placeholder={isAdmin ? "Search registered employees by name, role..." : "Search CEO, MD, HR, Team Leads..."} 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="teams-employee-list">
                {filteredList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'rgba(255,255,255,0.6)' }}>
                    <Users size={32} style={{ marginBottom: '0.75rem', opacity: 0.5, color: '#60a5fa' }} />
                    <h5 style={{ margin: '0 0 0.4rem 0', color: '#fff', fontSize: '0.95rem' }}>
                      {isAdmin ? 'No Registered Employees Found' : 'No Contacts Match Search'}
                    </h5>
                    <p style={{ fontSize: '0.8rem', margin: 0, lineHeight: '1.4' }}>
                      {isAdmin 
                        ? 'As new employees register on the portal, their details and phone numbers will appear here automatically.' 
                        : 'Try searching for Mahadhevan, Kirubakaran, or HR.'}
                    </p>
                  </div>
                ) : (
                  filteredList.map(contact => (
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
                      </div>

                      <div className="emp-call-actions">
                        {/* Official WhatsApp Call / Chat Button */}
                        {contact.phone && (
                          <button 
                            className="btn-call-action whatsapp"
                            onClick={() => handleWhatsAppCall(contact)}
                            title={`WhatsApp Message & Call with ${contact.name} (${contact.formattedPhone})`}
                          >
                            <MessageCircle size={15} />
                          </button>
                        )}

                        {/* Direct Mobile SMS Alert Button */}
                        {contact.phone && (
                          <button 
                            className="btn-call-action sms"
                            onClick={() => handleSMSAlert(contact)}
                            title={`Send Instant Mobile SMS Alert to ${contact.name} (${contact.formattedPhone})`}
                          >
                            <MessageSquare size={14} />
                          </button>
                        )}

                        {/* Direct Audio Call */}
                        <button 
                          className="btn-call-action audio"
                          onClick={() => handleStartCall(contact, 'audio')}
                          title={`Direct Line Call to ${contact.name} (${contact.formattedPhone})`}
                        >
                          <Phone size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamsCallWidget;
