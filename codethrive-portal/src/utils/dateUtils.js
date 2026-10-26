/**
 * Standardized Date Formatting Utility
 * Enforces DD/MM/YYYY (Date/Month/4-Digit Year) format strictly across the entire portal.
 */

export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateFull = (dateInput) => {
  return formatDate(dateInput);
};

export const formatDateWithDay = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[d.getDay()];
  return `${dayName}, ${formatDate(d)}`;
};
