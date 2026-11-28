import './SplashScreen.css';

const SplashScreen = ({ isFading }) => {
  return (
    <div className={`splash-screen ${isFading ? 'fade-out' : ''}`}>
      {/* Background ambient glowing spheres */}
      <div className="glow-sphere sphere-1"></div>
      <div className="glow-sphere sphere-2"></div>

      {/* Ambient floating tech particles */}
      <div className="particles-container">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${(i * 5 + (i % 3) * 1.5)}%`,
              animationDelay: `${(i * 0.18) % 2.5}s`,
              animationDuration: `${2.5 + (i % 4) * 0.6}s`,
              opacity: 0.35 + (i % 3) * 0.2
            }}
          ></div>
        ))}
      </div>

      <div className="splash-content">
        {/* User Official Logo Emblem */}
        <div className="logo-wrapper">
          <img 
            src="/logo-clean.png" 
            alt="CodeThrive Infotech Logo" 
            className="splash-logo"
          />
        </div>

        {/* Company Title */}
        <div className="company-title">
          <span className="brand-main">CODETHRIVE</span>
          <span className="brand-sub">INFOTECH</span>
        </div>

        {/* Official Tagline */}
        <p className="splash-tagline">
          Progress, Innovate, Cultivate
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
