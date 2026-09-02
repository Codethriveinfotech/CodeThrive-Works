import './SplashScreen.css';

const SplashScreen = ({ isFading }) => {
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
        <img 
          src="/full_logo.png" 
          alt="CodeThrive Infotech Logo" 
          className="splash-logo"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <div className="fallback-logo" style={{ display: 'none' }}>
          CODETHRIVE INFOTECH
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
