import React, { useMemo } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { getDailyQuote } from '../../utils/dailyQuotes';
import './DailyQuoteBanner.css';

const DEFAULT_QUOTE = {
  quote: "Your focus determines your reality. Push beyond limits and craft excellence today.",
  author: "CodeThrive Infotech Inspiration",
  theme: "Focus & Craft",
  badge: "Focus"
};

const DailyQuoteBanner = ({ variant = 'default', className = '', showBadge = false }) => {
  const quote = useMemo(() => {
    try {
      const q = getDailyQuote();
      return q && q.quote ? q : DEFAULT_QUOTE;
    } catch {
      return DEFAULT_QUOTE;
    }
  }, []);

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
              Daily Strength &bull; {quote?.badge || 'Strength'}
            </span>
          </div>
        )}
        <div className="dq-text-row">
          <p className="dq-quote-text">
            &ldquo;{quote?.quote || DEFAULT_QUOTE.quote}&rdquo;
          </p>
          <span className="dq-author">&mdash; {quote?.author || DEFAULT_QUOTE.author}</span>
        </div>
      </div>
    </div>
  );
};

export default DailyQuoteBanner;
