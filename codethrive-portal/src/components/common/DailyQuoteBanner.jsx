import React, { useMemo } from 'react';
import { Sparkles, Zap, Flame, Compass } from 'lucide-react';
import { getDailyQuote } from '../../utils/dailyQuotes';
import './DailyQuoteBanner.css';

const DailyQuoteBanner = ({ variant = 'default', className = '', showBadge = true }) => {
  const quote = useMemo(() => getDailyQuote(), []);

  return (
    <div className={`daily-quote-card ${variant} ${className}`}>
      <div className="dq-glow-accent"></div>
      <div className="dq-icon-container">
        <Sparkles size={15} className="dq-sparkle-icon" />
      </div>

      <div className="dq-content-wrap">
        {showBadge && (
          <div className="dq-badge-row">
            <span className="dq-category-badge">
              <Zap size={11} className="dq-badge-zap" />
              Daily Strength &bull; {quote.badge}
            </span>
          </div>
        )}
        <div className="dq-text-row">
          <p className="dq-quote-text">
            &ldquo;{quote.quote}&rdquo;
          </p>
          <span className="dq-author">&mdash; {quote.author}</span>
        </div>
      </div>
    </div>
  );
};

export default DailyQuoteBanner;
