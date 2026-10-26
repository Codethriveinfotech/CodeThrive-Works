import React, { useRef, useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import './DateInput.css';

/**
 * Standardized Date Input Component
 * Displays and accepts dates in DD/MM/YYYY (date, then month, then year) format.
 * Internally synchronizes with standard ISO (YYYY-MM-DD) values for seamless database compatibility.
 */

// Converts YYYY-MM-DD or ISO string to DD/MM/YYYY
export const toDisplayDate = (isoStr) => {
  if (!isoStr) return '';
  const str = String(isoStr).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  
  const cleanStr = str.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  const dateObj = new Date(str);
  if (!isNaN(dateObj.getTime())) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return str;
};

// Converts DD/MM/YYYY to YYYY-MM-DD
export const toIsoDate = (displayStr) => {
  if (!displayStr) return '';
  const parts = displayStr.trim().split(/[/.-]/);
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (d && m && y && y.length === 4) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return displayStr;
};

const DateInput = ({
  value = '',
  onChange,
  className = 'input-box',
  style = {},
  wrapperStyle = {},
  placeholder = 'dd/mm/yyyy',
  min,
  max,
  disabled = false,
  required = false,
  name,
  id,
  showIcon = true,
  ...rest
}) => {
  const hiddenPickerRef = useRef(null);

  // Derive initial values
  const isoValue = value ? (value.includes('/') ? toIsoDate(value) : String(value).split('T')[0]) : '';
  const [inputText, setInputText] = useState(toDisplayDate(value));

  useEffect(() => {
    setInputText(toDisplayDate(value));
  }, [value]);

  const triggerPicker = () => {
    if (disabled) return;
    if (hiddenPickerRef.current) {
      if (typeof hiddenPickerRef.current.showPicker === 'function') {
        try {
          hiddenPickerRef.current.showPicker();
        } catch {
          hiddenPickerRef.current.focus();
        }
      } else {
        hiddenPickerRef.current.focus();
      }
    }
  };

  const handleNativeChange = (e) => {
    const newIso = e.target.value; // YYYY-MM-DD
    setInputText(toDisplayDate(newIso));
    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          name: name || e.target.name,
          value: newIso
        }
      });
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (val === '') {
      if (onChange) {
        onChange({
          target: { name: name || '', value: '' }
        });
      }
      return;
    }

    // If fully typed DD/MM/YYYY
    const parts = val.trim().split(/[/.-]/);
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (d.length === 2 && m.length === 2 && y.length === 4) {
        const dayNum = parseInt(d, 10);
        const monthNum = parseInt(m, 10);
        const yearNum = parseInt(y, 10);
        if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
          const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          if (onChange) {
            onChange({
              target: { name: name || '', value: iso }
            });
          }
        }
      }
    }
  };

  return (
    <div
      className="date-input-container"
      style={{ ...wrapperStyle }}
      onClick={triggerPicker}
    >
      <input
        type="text"
        id={id}
        name={name}
        placeholder={placeholder}
        value={inputText}
        onChange={handleTextChange}
        disabled={disabled}
        required={required}
        className={className}
        style={{
          width: '100%',
          paddingRight: showIcon ? '2.5rem' : undefined,
          cursor: disabled ? 'not-allowed' : 'pointer',
          ...style
        }}
        {...rest}
      />

      {showIcon && (
        <div className="date-input-calendar-icon">
          <Calendar size={16} />
        </div>
      )}

      {/* Hidden native input for calendar pop-up across browsers */}
      <input
        type="date"
        ref={hiddenPickerRef}
        value={isoValue}
        min={min ? (min.includes('/') ? toIsoDate(min) : min) : undefined}
        max={max ? (max.includes('/') ? toIsoDate(max) : max) : undefined}
        onChange={handleNativeChange}
        tabIndex={-1}
        aria-hidden="true"
        className="date-input-native-hidden"
      />
    </div>
  );
};

export default DateInput;
