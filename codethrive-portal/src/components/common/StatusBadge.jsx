import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './common.css';

const StatusBadge = ({ status, text }) => {
  const shouldReduceMotion = useReducedMotion();
  
  // Determine color based on status string (success, warning, danger, info, neutral)
  let statusClass = 'neutral';
  const s = status?.toLowerCase();
  
  if (['active', 'completed', 'approved', 'present', 'done', 'working'].includes(s)) {
    statusClass = 'success';
  } else if (['pending', 'in progress', 'review', 'half-day'].includes(s)) {
    statusClass = 'warning';
  } else if (['inactive', 'rejected', 'failed', 'absent'].includes(s)) {
    statusClass = 'danger';
  } else if (['new', 'leave', 'on break'].includes(s)) {
    statusClass = 'info';
  }

  return (
    <motion.span 
      layout={!shouldReduceMotion}
      initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`ct-badge ${statusClass}`}
    >
      {text || status}
    </motion.span>
  );
};

export default StatusBadge;
