import React from 'react';
import './common.css';

const Card = ({ title, children, className = '', action }) => {
  return (
    <div className={`ct-card ${className}`}>
      {(title || action) && (
        <div className="ct-card-header">
          {title && <h3 className="ct-card-title">{title}</h3>}
          {action && <div className="ct-card-action">{action}</div>}
        </div>
      )}
      <div className="ct-card-body">
        {children}
      </div>
    </div>
  );
};

export default Card;
