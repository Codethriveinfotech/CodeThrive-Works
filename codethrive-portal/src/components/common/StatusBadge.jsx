import React from 'react';
import './common.css';

const StatusBadge = ({ status, text }) => {
  // Determine color based on status string (success, warning, danger, info, neutral)
  let statusClass = 'neutral';
  const s = status?.toLowerCase();
  
  if (['active', 'completed', 'approved', 'present', 'done'].includes(s)) {
    statusClass = 'success';
  } else if (['pending', 'in progress', 'review', 'half-day'].includes(s)) {
    statusClass = 'warning';
  } else if (['inactive', 'rejected', 'failed', 'absent'].includes(s)) {
    statusClass = 'danger';
  } else if (['new', 'leave'].includes(s)) {
    statusClass = 'info';
  }

  return (
    <span className={`ct-badge ${statusClass}`}>
      {text || status}
    </span>
  );
};

export default StatusBadge;
