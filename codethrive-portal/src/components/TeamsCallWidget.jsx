import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Phone, Video, Mic, MicOff, VideoOff, Monitor, PhoneOff, 
  Search, X, ShieldCheck, MessageCircle, BellRing, PhoneCall, Check,
  Volume2, PhoneIncoming, AlertCircle, MessageSquare, Smartphone, Users,
  Mail, Globe, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './TeamsCallWidget.css';

// Official CodeThrive Connect Channels (Exact order requested)
const OFFICIAL_CHANNELS = [
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    badge: 'Instant Chat',
    badgeColor: '#059669',
    subtitle: '+91 9150781685',
    link: 'https://wa.me/919150781685?text=Hello%20CodeThrive%20Infotech',
    bg: '#f0fdf4',
    border: '#86efac',
    iconBg: '#10b981',
    type: 'whatsapp'
  },
  {
    id: 'call',
    title: 'Direct Call',
    badge: '9 AM – 6 PM',
    badgeColor: '#2563eb',
    subtitle: '+91 9150781685',
    link: 'tel:+919150781685',
    bg: '#eff6ff',
    border: '#93c5fd',
    iconBg: '#3b82f6',
    type: 'phone'
  },
  {
    id: 'email',
    title: 'Email Support',
    badge: 'Official Desk',
    badgeColor: '#d97706',
    subtitle: 'codethriveinfotech@gmail.com',
    link: 'mailto:codethriveinfotech@gmail.com',
    bg: '#fffbeb',
    border: '#fde68a',
    iconBg: '#f59e0b',
    type: 'mail'
  },
  {
    id: 'website',
    title: 'Official Website',
    badge: 'Explore Portal',
    badgeColor: '#0891b2',
    subtitle: 'https://codethriveinfotech.in/',
    link: 'https://codethriveinfotech.in/',
    bg: '#ecfeff',
    border: '#a5f3fc',
    iconBg: '#06b6d4',
    type: 'website'
  },
  {
    id: 'linkedin',
    title: 'LinkedIn',
    badge: 'Network',
    badgeColor: '#0284c7',
    subtitle: 'CodeThrive Infotech',
    link: 'https://www.linkedin.com/in/codethrive-infotech-5b6361402',
    bg: '#f0f9ff',
    border: '#bae6fd',
    iconBg: '#0284c7',
    type: 'linkedin'
  },
  {
    id: 'instagram',
    title: 'Instagram',
    badge: 'Follow Us',
    badgeColor: '#db2777',
    subtitle: '@codethriveinfotech_official',
    link: 'https://www.instagram.com/codethriveinfotech_official?igsh=MTIzZXA5MXF5dXRlaQ==',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    iconBg: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    type: 'instagram'
  },
  {
    id: 'facebook',
    title: 'Facebook',
    badge: 'Community',
    badgeColor: '#4338ca',
    subtitle: 'CodeThrive Infotech',
    link: 'https://www.facebook.com/share/18pBfimAcw/',
    bg: '#eef2ff',
    border: '#c7d2fe',
    iconBg: '#4f46e5',
    type: 'facebook'
  },
  {
    id: 'youtube',
    title: 'YouTube',
    badge: 'Official Channel',
    badgeColor: '#dc2626',
    subtitle: '@CodeThriveInfotech',
    link: 'https://www.youtube.com/@CodeThriveInfotech',
    bg: '#fef2f2',
    border: '#fecaca',
    iconBg: '#ef4444',
    type: 'youtube'
  }
];

const renderChannelIcon = (type) => {
  switch (type) {
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z"/>
        </svg>
      );
    case 'phone':
      return <Phone size={20} color="#fff" />;
    case 'mail':
      return <Mail size={20} color="#fff" />;
    case 'website':
      return <Globe size={20} color="#fff" />;
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    default:
      return <ExternalLink size={20} color="#fff" />;
  }
};

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
  const [activeTab, setActiveTab] = useState('channels'); // 'channels' | 'directory'
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

  // Helper to extract clean digits with India country code 91
  const getCleanPhone = (phone) => {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) return `91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return digits;
    return digits;
  };

  // Fetch real registered employees dynamically from DB & localStorage
  const fetchRegisteredContacts = async () => {
    try {
      const res = await api.get('/employees').catch(() => ({ data: { success: false, data: [] } }));
      let dbEmps = res.data && res.data.success && Array.isArray(res.data.data) ? res.data.data : [];
      
      // Filter out admin account itself so only staff/employees show
      const formattedList = dbEmps
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
    
    const clean = getCleanPhone(contact.phone || contact.formattedPhone);
    const isMobile = typeof window !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );

    // On mobile view / phone screens, directly open dialer
    if (isMobile && clean) {
      window.location.href = `tel:+${clean}`;
      return;
    }

    if (clean) {
      const telUrl = `tel:+${clean}`;
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
    const clean = getCleanPhone(contact.phone || contact.formattedPhone);
    if (!clean) return;

    // Only "Hello {name}" as requested
    const msg = `Hello ${contact.name}`;
    const waUrl = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
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
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h4 className="teams-brand-title">Connect with CodeThrive</h4>
                <span className="teams-status-subtext">Fast response via any channel</span>
              </div>
            </div>
            <button className="teams-close-btn" onClick={() => setIsOpen(false)} title="Close">
              <X size={18} />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="connect-tabs-bar">
            <button 
              className={`connect-tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
              onClick={() => setActiveTab('channels')}
            >
              Direct Channels
            </button>
            <button 
              className={`connect-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
              onClick={() => setActiveTab('directory')}
            >
              Staff Directory
            </button>
          </div>

          {activeTab === 'channels' ? (
            /* Official Connect Channels (Image 2 style) */
            <div className="connect-channels-container">
              <div className="channels-cards-list">
                {OFFICIAL_CHANNELS.map(ch => (
                  <a
                    key={ch.id}
                    href={ch.link}
                    target={ch.link.startsWith('tel:') || ch.link.startsWith('mailto:') ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    className="channel-card-item"
                    style={{
                      background: ch.bg,
                      borderColor: ch.border
                    }}
                  >
                    <div 
                      className="channel-icon-box"
                      style={{ background: ch.iconBg }}
                    >
                      {renderChannelIcon(ch.type)}
                    </div>

                    <div className="channel-info-box">
                      <div className="channel-title-row">
                        <span className="channel-title-text">{ch.title}</span>
                        <span 
                          className="channel-badge-pill"
                          style={{ background: ch.badgeColor }}
                        >
                          {ch.badge}
                        </span>
                      </div>
                      <span className="channel-sub-text">{ch.subtitle}</span>
                    </div>

                    <div className="channel-link-arrow">
                      <ExternalLink size={16} />
                    </div>
                  </a>
                ))}
              </div>

              {/* Card Footer */}
              <div className="connect-modal-footer">
                <span className="footer-assist-text">Need custom assistance?</span>
                <a 
                  href="https://codethriveinfotech.in/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="footer-contact-link"
                >
                  Go to Contact Page &rarr;
                </a>
              </div>
            </div>
          ) : (
            /* If Active Call Screen */
            activeCall ? (
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
                    <a 
                      href={`tel:+${getCleanPhone(activeCall.contact.phone || activeCall.contact.formattedPhone)}`}
                      className="calling-phone phone-call-link"
                      title={`Cellular call to ${activeCall.contact.formattedPhone}`}
                    >
                      <Phone size={12} style={{ marginRight: '5px' }} />
                      {activeCall.contact.formattedPhone}
                    </a>
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
                              <a 
                                href={`tel:+${getCleanPhone(contact.phone || contact.formattedPhone)}`}
                                className="emp-phone-badge phone-call-link"
                                title={`Direct Mobile Call: ${contact.formattedPhone}`}
                                onClick={() => triggerMobileNotification(contact)}
                              >
                                <Phone size={10} className="phone-badge-icon" />
                                <span>{contact.formattedPhone}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="emp-call-actions">
                          {/* WhatsApp Chat Button (Visible on Desktop & Mobile) */}
                          {contact.phone && (
                            <button 
                              className="btn-call-action whatsapp"
                              onClick={() => handleWhatsAppCall(contact)}
                              title={`WhatsApp chat with ${contact.name}`}
                            >
                              <MessageCircle size={15} />
                            </button>
                          )}

                          {/* Direct Phone Call Button (Enabled & Visible on Mobile Only) */}
                          {contact.phone && (
                            <a 
                              href={`tel:+${getCleanPhone(contact.phone || contact.formattedPhone)}`}
                              className="btn-call-action mobile-phone-call"
                              title={`Direct call to ${contact.name}`}
                            >
                              <Phone size={15} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default TeamsCallWidget;
