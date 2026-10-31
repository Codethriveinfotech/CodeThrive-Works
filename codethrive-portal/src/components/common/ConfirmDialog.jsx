import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import './ConfirmDialog.css';

const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message = 'Do you really want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  icon = null,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="ct-confirm-overlay" onClick={onCancel}>
          <motion.div 
            className="ct-confirm-card"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Top Close Button */}
            <button className="ct-confirm-close-btn" onClick={onCancel} title="Close">
              <X size={18} />
            </button>

            {/* Glowing Icon Header */}
            <div className={`ct-confirm-icon-ring ${confirmVariant}`}>
              {icon || (confirmVariant === 'danger' ? <LogOut size={26} /> : <AlertTriangle size={26} />)}
            </div>

            {/* Sub-label */}
            <span className="ct-confirm-tag">CodeThrive Portal &bull; Confirmation</span>

            {/* Title & Description */}
            <h3 className="ct-confirm-title">{title}</h3>
            <p className="ct-confirm-message">{message}</p>

            {/* Action Buttons */}
            <div className="ct-confirm-actions">
              <button 
                type="button" 
                className="ct-confirm-btn ct-confirm-btn-cancel" 
                onClick={onCancel}
              >
                {cancelText}
              </button>
              <button 
                type="button" 
                className={`ct-confirm-btn ct-confirm-btn-confirm ${confirmVariant}`} 
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
