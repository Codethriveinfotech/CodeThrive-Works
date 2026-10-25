/**
 * Contact Action Helpers
 * Provides cross-platform handling for direct email compose and phone actions (WhatsApp & Calls)
 */

/**
 * Directly opens email composer for the given address.
 * On desktop browsers, opens Gmail web composer in a new tab (bypassing unconfigured Outlook/Windows Mail errors).
 * On mobile devices, triggers native mail client via mailto: protocol.
 */
export const openDirectEmail = (email, e) => {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  if (!email || email === 'N/A' || email === 'No Email') return;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    window.location.href = `mailto:${email}`;
  } else {
    // Open Gmail web compose in a new tab - works 100% reliably on desktop web browsers
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
    const newTab = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    
    // In case popup blockers prevent opening new tab, fallback gracefully to mailto
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      window.location.href = `mailto:${email}`;
    }
  }
};

/**
 * Normalizes phone numbers for WhatsApp direct chat link (adds '91' for 10-digit Indian numbers).
 */
export const cleanPhoneNumberForWhatsApp = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
};
