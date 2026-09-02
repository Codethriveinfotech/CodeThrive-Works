import React from 'react';
import './SkeletonLoader.css';
import { motion, useReducedMotion } from 'framer-motion';

const SkeletonLoader = ({ type = 'default' }) => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1, 
      transition: { 
        duration: 0.4, 
        staggerChildren: shouldReduceMotion ? 0 : 0.1 
      } 
    },
    exit: { opacity: 0 }
  };

  const itemVariants = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (type === 'dashboard') {
    return (
      <motion.div 
        className="skeleton-container"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}
      >
        {/* Tier 1: Hero */}
        <motion.div className="skeleton-box" style={{ height: '140px', width: '100%', borderRadius: '16px' }} variants={itemVariants}></motion.div>

        {/* Tier 2: Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          {[...Array(4)].map((_, i) => (
            <motion.div key={i} className="skeleton-box" style={{ height: '100px', borderRadius: '12px' }} variants={itemVariants}></motion.div>
          ))}
        </div>

        {/* Tier 3: Workspace */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
          <motion.div className="skeleton-box" style={{ height: '400px', borderRadius: '16px' }} variants={itemVariants}></motion.div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <motion.div className="skeleton-box" style={{ height: '200px', borderRadius: '12px' }} variants={itemVariants}></motion.div>
            <motion.div className="skeleton-box" style={{ height: '200px', borderRadius: '12px' }} variants={itemVariants}></motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === 'table') {
    return (
      <motion.div 
        className="skeleton-container skeleton-box"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div className="skeleton-line medium"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <motion.div key={i} className="skeleton-table-row" variants={itemVariants}>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // Default block
  return (
    <motion.div 
      className="skeleton-container skeleton-box" 
      style={{ padding: '1.5rem' }}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="skeleton-line short"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line medium"></div>
    </motion.div>
  );
};

export default SkeletonLoader;
