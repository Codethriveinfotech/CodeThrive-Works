import React, { useEffect, useState } from 'react';
import { Sun, Sunrise, Moon, Sparkles, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/logo.png';
import './LoginGreetingSplash.css';

const LoginGreetingSplash = ({ user, isFirstLogin, onFinish, customRedirectText, isAdmin }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Keep greeting splash visible for 4 to 5 seconds before fading out and entering dashboard
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 4200);

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 4800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  // Determine time-based greeting
  const hour = new Date().getHours();
  let timeGreeting = 'Good Morning';
  let GreetingIcon = Sunrise;
  let iconTheme = 'morning';
  let timeBadge = '☀️ MORNING WORKSPACE';
  let subtitle = 'Wishing you an inspiring and productive day ahead.';

  if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good Afternoon';
    GreetingIcon = Sun;
    iconTheme = 'afternoon';
    timeBadge = '🌤️ AFTERNOON SESSION';
    subtitle = 'Keep up the great momentum and focus.';
  } else if (hour >= 17 || hour < 4) {
    timeGreeting = 'Good Evening';
    GreetingIcon = Moon;
    iconTheme = 'evening';
    timeBadge = '✨ EVENING WORKSPACE';
    subtitle = 'Wrapping up milestones and crafting excellence today.';
  }

  // Name handling
  const rawName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Team Member';
  // Capitalize properly
  const displayName = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  const firstName = displayName.split(' ')[0] || displayName;
  const employeeId = user?.employeeId || null;
  const designation = user?.designation || (user?.role === 'admin' ? 'System Administrator' : 'Software Developer');

  const isFirstTime = Boolean(isFirstLogin);

  return (
    <div className={`login-greeting-overlay ${isFading ? 'fade-out' : ''}`}>
      {/* Background Animated Glowing Spheres */}
      <div className="greeting-sphere sphere-one"></div>
      <div className="greeting-sphere sphere-two"></div>

      {/* Ambient Floating Particles */}
      <div className="greeting-particles">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="greeting-particle"
            style={{
              left: `${(i * 6.25 + (i % 3) * 2)}%`,
              animationDelay: `${(i * 0.18) % 2.5}s`,
              animationDuration: `${2.2 + (i % 4) * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Main Greeting Card */}
      <div className="greeting-content-card">
        {/* CodeThrive Logo with Aura Glow */}
        <div className="greeting-logo-wrapper">
          <div className="greeting-logo-glow"></div>
          <img
            src={logoImg}
            alt="CodeThrive Infotech"
            className="greeting-splash-logo"
          />
        </div>

        {isAdmin || user?.role === 'admin' ? (
          <>
            {/* Simple Executive Greeting for Admin */}
            <div className="greeting-title-container" style={{ margin: '1.25rem 0 0.5rem 0' }}>
              <h1 className="greeting-main-heading welcome-heading" style={{ fontSize: '2.1rem' }}>
                Welcome Back Admin
              </h1>
            </div>

            {/* Progress Loading Indicator */}
            <div className="greeting-progress-container" style={{ marginTop: '1rem' }}>
              <div className="greeting-progress-track">
                <div className="greeting-progress-fill">
                  <div className="progress-glow-head"></div>
                </div>
              </div>
              <span className="greeting-loading-text">
                {customRedirectText || 'Entering CodeThrive Infotech Workspace...'}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Dynamic Badge */}
            <div className="greeting-badge-row">
              {isFirstTime ? (
                <span className="greeting-badge welcome-badge">
                  <Sparkles size={14} className="sparkle-spin" />
                  <span>FIRST TIME ONBOARDING • WELCOME</span>
                </span>
              ) : (
                <span className={`greeting-badge ${iconTheme}-badge`}>
                  <GreetingIcon size={14} className="greeting-icon-pulse" />
                  <span>{timeBadge}</span>
                </span>
              )}
            </div>

            {/* Primary Greeting Title */}
            <div className="greeting-title-container">
              {isFirstTime ? (
                <h1 className="greeting-main-heading welcome-heading">
                  Welcome To CTI
                </h1>
              ) : (
                <h1 className="greeting-main-heading time-heading">
                  {timeGreeting}, <span className="greeting-user-name">{firstName}</span>
                </h1>
              )}
            </div>

            {/* User Details Pill */}
            <div className="greeting-user-pill">
              <div className="user-avatar-mini">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt={displayName} />
                ) : (
                  <span>{firstName.charAt(0)}</span>
                )}
              </div>
              <div className="user-info-text">
                <span className="user-name-full">{displayName}</span>
                <span className="user-meta-sub">
                  {designation} {employeeId ? `• ID: ${employeeId}` : ''}
                </span>
              </div>
            </div>

            {/* Subtitle Message */}
            <p className="greeting-subtitle">
              {isFirstTime
                ? `Welcome to the CodeThrive Infotech family, ${firstName}! We're thrilled to have you onboard.`
                : subtitle}
            </p>

            {/* Progress Loading Indicator */}
            <div className="greeting-progress-container">
              <div className="greeting-progress-track">
                <div className="greeting-progress-fill">
                  <div className="progress-glow-head"></div>
                </div>
              </div>
              <span className="greeting-loading-text">
                {customRedirectText || 'Entering CodeThrive Infotech Workspace...'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginGreetingSplash;
