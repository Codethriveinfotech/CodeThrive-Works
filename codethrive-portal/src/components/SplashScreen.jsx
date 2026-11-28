import './SplashScreen.css';

const SplashScreen = ({ isFading }) => {
  return (
    <div className={`splash-screen ${isFading ? 'fade-out' : ''}`}>
      {/* Premium ambient glowing spheres & nebulas */}
      <div className="glow-sphere sphere-1"></div>
      <div className="glow-sphere sphere-2"></div>
      <div className="glow-sphere sphere-3"></div>

      {/* Ambient floating tech particles */}
      <div className="particles-container">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${(i * 4.16 + (i % 5) * 1.5)}%`,
              animationDelay: `${(i * 0.15) % 2.5}s`,
              animationDuration: `${2.4 + (i % 4) * 0.6}s`,
              opacity: 0.35 + (i % 3) * 0.2
            }}
          ></div>
        ))}
      </div>

      <div className="splash-content">
        {/* Luminous Logo Emblem */}
        <div className="logo-wrapper">
          <img 
            src="/logo-clean.png" 
            alt="CodeThrive Logo" 
            className="splash-logo"
            onError={(e) => {
              e.target.src = '/full_logo.png';
            }}
          />
        </div>

        {/* Brand Name Typography */}
        <div className="company-title">
          <span className="brand-main">CODETHRIVE</span>
          <span className="brand-sub">INFOTECH</span>
        </div>

        {/* Enterprise Identity Pill Badge */}
        <div className="splash-tagline-container">
          <span className="splash-tagline-pill">
            <span className="splash-tagline-dot"></span>
            <span>Enterprise Workspace &bull; Building The Future</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
