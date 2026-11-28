import React, { useMemo } from 'react';
import { Sun, Sunrise, Moon, Sparkles } from 'lucide-react';
import './SplashScreen.css';

const SplashScreen = ({ isFading }) => {
  // Check if a user is already cached in localStorage
  const cachedUser = useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  const hour = new Date().getHours();
  let timeGreeting = 'Good Morning';
  let Icon = Sunrise;
  let themeClass = 'morning';

  if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good Afternoon';
    Icon = Sun;
    themeClass = 'afternoon';
  } else if (hour >= 17 || hour < 4) {
    timeGreeting = 'Good Evening';
    Icon = Moon;
    themeClass = 'evening';
  }

  const rawName = cachedUser?.fullName || cachedUser?.name || '';
  const firstName = rawName.split(' ')[0] || '';
  const isFirst = Boolean(cachedUser?.isFirstLogin || sessionStorage.getItem('cti_just_first_login') === 'true');

  return (
    <div className={`splash-screen ${isFading ? 'fade-out' : ''}`}>
      {/* Premium animated background elements */}
      <div className="glow-sphere sphere-1"></div>
      <div className="glow-sphere sphere-2"></div>
      <div className="particles-container">
        {/* Simple CSS-based particles */}
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}></div>
        ))}
      </div>

      <div className="splash-content">
        <div className="logo-wrapper">
          <img 
            src="/full_logo.png" 
            alt="CodeThrive Infotech Logo" 
            className="splash-logo"
          />
        </div>

        {cachedUser && (
          <div className="splash-greeting-wrapper">
            <div className={`splash-greeting-badge ${isFirst ? 'welcome' : themeClass}`}>
              {isFirst ? (
                <>
                  <Sparkles size={13} />
                  <span>WELCOME TO CTI</span>
                </>
              ) : (
                <>
                  <Icon size={13} />
                  <span>{timeGreeting.toUpperCase()}</span>
                </>
              )}
            </div>
            <h2 className="splash-greeting-title">
              {isFirst ? (
                <>Welcome To CTI{firstName ? `, ${firstName}` : ''}!</>
              ) : (
                <>{timeGreeting}{firstName ? `, ${firstName}` : ''}!</>
              )}
            </h2>
            <p className="splash-greeting-sub">
              {isFirst ? "Initializing your new workspace..." : "Preparing CodeThrive Workspace..."}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default SplashScreen;
