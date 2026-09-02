import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './common.css';

const Card = ({ title, children, className = '', action, variants }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div 
      className={`ct-card ${className}`}
      variants={variants}
      whileHover={shouldReduceMotion ? {} : { y: -3, transition: { duration: 0.2 } }}
    >
      {(title || action) && (
        <div className="ct-card-header">
          {title && <h3 className="ct-card-title">{title}</h3>}
          {action && <div className="ct-card-action">{action}</div>}
        </div>
      )}
      <div className="ct-card-body">
        {children}
      </div>
    </motion.div>
  );
};

export default Card;
