import './SplashScreen.css';

const SplashScreen = ({ isFading }) => {
  return (
    <div className={`splash-screen ${isFading ? 'fade-out' : ''}`}>
      {/* Background glowing spheres */}
      <div className="glow-sphere sphere-1"></div>
      <div className="glow-sphere sphere-2"></div>
      
      {/* Particles */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}></div>
        ))}
      </div>

      <div className="splash-content">
        {/* Clean Logo without any box or border */}
        <div className="logo-wrapper">
          <img 
            src="/logo-clean.png" 
            alt="CodeThrive Logo" 
            className="splash-logo"
            onError={(e) => {
              e.target.src = '/logo.png';
            }}
          />
        </div>

        {/* Company Title */}
        <div className="company-title">
          <span className="brand-main">CODETHRIVE</span>
          <span className="brand-sub">INFOTECH</span>
        </div>

        {/* Loading Progress Bar */}
        <div className="splash-loader-bar">
          <div className="splash-loader-progress"></div>
        </div>
      </div>

    </div>
  );
};

export default SplashScreen;
