import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './common.css';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="ct-modal-overlay" onClick={onClose}>
      <div className="ct-modal-content" onClick={e => e.stopPropagation()}>
        <div className="ct-modal-header">
          <h3 className="ct-modal-title">{title}</h3>
          <button className="ct-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="ct-modal-body">
          {children}
        </div>
        {footer && (
          <div className="ct-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
