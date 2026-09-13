import React, { useState } from 'react';
import { PhoneCall, X, Headset } from 'lucide-react';
import './FloatingContact.css';

const FloatingContact = ({ 
  phoneNumber = "+919876543210", 
  whatsappNumber = "919876543210",
  whatsappMessage = "Hello CodeThrive Team! I need some assistance." 
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const encodedMsg = encodeURIComponent(whatsappMessage);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMsg}`;
  const callUrl = `tel:${phoneNumber}`;

  return (
    <div className="floating-contact-container">
      {isOpen && (
        <div className="floating-buttons-wrapper">
          {/* WhatsApp Button */}
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="floating-btn whatsapp-btn"
            title="Chat on WhatsApp"
          >
            <div className="btn-icon">
              {/* Official WhatsApp SVG Icon */}
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.16 4.234 4.303-1.127zm10.776-6.666c-.305-.153-1.806-.891-2.086-.993-.28-.102-.484-.153-.688.153-.204.306-.791.993-.969 1.197-.178.204-.357.229-.662.076-.305-.153-1.288-.475-2.454-1.514-.908-.809-1.521-1.809-1.699-2.115-.178-.306-.019-.471.133-.623.137-.137.305-.357.458-.535.153-.178.204-.306.306-.51.102-.204.051-.382-.025-.535-.076-.153-.688-1.657-.943-2.271-.248-.598-.501-.517-.688-.527l-.586-.01c-.204 0-.535.076-.815.382-.28.306-1.07 1.045-1.07 2.55 0 1.505 1.096 2.957 1.249 3.162.153.204 2.156 3.292 5.223 4.617.729.315 1.299.503 1.743.644.733.233 1.399.2 1.926.121.588-.088 1.806-.738 2.061-1.453.255-.714.255-1.325.178-1.453-.076-.128-.28-.204-.585-.357z"/>
              </svg>
            </div>
            <span className="btn-label">WhatsApp</span>
          </a>

          {/* Phone Call Button */}
          <a 
            href={callUrl} 
            className="floating-btn call-btn"
            title="Call Support"
          >
            <div className="btn-icon">
              <PhoneCall size={20} />
            </div>
            <span className="btn-label">Call Us</span>
          </a>
        </div>
      )}

      {/* Main Trigger / Toggle Floating Button */}
      <button 
        className={`floating-main-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close Contact Menu" : "Quick Contact Support"}
        aria-label="Quick Contact Support"
      >
        <span className="pulse-ring"></span>
        <span className="pulse-ring-outer"></span>
        {isOpen ? <X size={22} /> : <Headset size={24} />}
      </button>
    </div>
  );
};

export default FloatingContact;
