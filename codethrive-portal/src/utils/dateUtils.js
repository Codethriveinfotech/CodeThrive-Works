/**
 * Standardized Date Formatting Utility
 * Enforces DD/MM/YYYY (Date/Month/4-Digit Year) format strictly across the entire portal.
 */

export const formatDate = (dateInput) => {
  if (!dateInput && dateInput !== 0) return '';
  const str = String(dateInput).trim();
  if (!str || str === 'undefined' || str === 'null') return '';

  // If already in DD/MM/YYYY format, return directly
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

  // Handle YYYY-MM-DD cleanly without timezone shift issues
  const cleanStr = str.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [y, m, d] = parts;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return str;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateFull = (dateInput) => {
  return formatDate(dateInput);
};

export const formatDateWithDay = (dateInput) => {
  if (!dateInput && dateInput !== 0) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    // Attempt parse if YYYY-MM-DD
    const str = String(dateInput).trim();
    const cleanStr = str.split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const parsed = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      if (!isNaN(parsed.getTime())) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `${days[parsed.getDay()]}, ${formatDate(parsed)}`;
      }
    }
    return String(dateInput);
  }
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[d.getDay()];
  return `${dayName}, ${formatDate(d)}`;
};
