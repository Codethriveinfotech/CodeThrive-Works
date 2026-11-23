import React from 'react';

// Lightweight, rock-solid page container with zero animation failure or opacity-0 blank screen risk
const PageTransition = ({ children }) => {
  return (
    <div style={{ width: '100%', minHeight: '100%' }}>
      {children}
    </div>
  );
};

export default PageTransition;
