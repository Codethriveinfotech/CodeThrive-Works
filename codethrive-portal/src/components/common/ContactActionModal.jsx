import React from 'react';
import { PhoneCall, X, MessageSquare, Phone } from 'lucide-react';
import './ContactActionModal.css';

export const cleanPhoneNumberForWhatsApp = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
};

const ContactActionModal = ({ isOpen, onClose, name = 'Employee', phone = '' }) => {
  if (!isOpen || !phone) return null;

  const cleanDigits = cleanPhoneNumberForWhatsApp(phone);
  const whatsappUrl = `https://wa.me/${cleanDigits}`;
  const callUrl = `tel:${phone.replace(/\s+/g, '')}`;

  const handleWhatsApp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCall = () => {
    window.location.href = callUrl;
    onClose();
  };

  return (
    <div className="contact-modal-backdrop" onClick={onClose}>
      <div className="contact-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="contact-modal-header">
          <div className="contact-header-title">
            <div className="contact-icon-bubble">
              <PhoneCall size={20} />
            </div>
            <div>
              <h3>Contact {name}</h3>
              <p className="contact-phone-subtitle">{phone}</p>
            </div>
          </div>
          <button className="contact-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Action Choice Prompt */}
        <div className="contact-modal-body">
          <p className="contact-prompt-text">How would you like to connect with {name}?</p>

          <div className="contact-options-grid">
            {/* Option 1: WhatsApp */}
            <button 
              type="button"
              className="contact-action-card whatsapp"
              onClick={handleWhatsApp}
            >
              <div className="action-card-icon-wrap whatsapp">
                {/* Official WhatsApp SVG Icon */}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.16 4.234 4.303-1.127zm10.776-6.666c-.305-.153-1.806-.891-2.086-.993-.28-.102-.484-.153-.688.153-.204.306-.791.993-.969 1.197-.178.204-.357.229-.662.076-.305-.153-1.288-.475-2.454-1.514-.908-.809-1.521-1.809-1.699-2.115-.178-.306-.019-.471.133-.623.137-.137.305-.357.458-.535.153-.178.204-.306.306-.51.102-.204.051-.382-.025-.535-.076-.153-.688-1.657-.943-2.271-.248-.598-.501-.517-.688-.527l-.586-.01c-.204 0-.535.076-.815.382-.28.306-1.07 1.045-1.07 2.55 0 1.505 1.096 2.957 1.249 3.162.153.204 2.156 3.292 5.223 4.617.729.315 1.299.503 1.743.644.733.233 1.399.2 1.926.121.588-.088 1.806-.738 2.061-1.453.255-.714.255-1.325.178-1.453-.076-.128-.28-.204-.585-.357z"/>
                </svg>
              </div>
              <div className="action-card-text">
                <span className="action-title">WhatsApp Message</span>
                <span className="action-desc">Open WhatsApp to send a direct message</span>
              </div>
            </button>

            {/* Option 2: Phone Call */}
            <button 
              type="button"
              className="contact-action-card call"
              onClick={handleCall}
            >
              <div className="action-card-icon-wrap call">
                <Phone size={22} />
              </div>
              <div className="action-card-text">
                <span className="action-title">Direct Phone Call</span>
                <span className="action-desc">Dial number using your default phone app</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="contact-modal-footer">
          <button type="button" className="btn-contact-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactActionModal;
