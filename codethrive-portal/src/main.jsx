import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Performance: Pre-warm backend API in background so cold starts are eliminated
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  setTimeout(() => {
    fetch('https://codethrive-backend.onrender.com/', { mode: 'no-cors', priority: 'low' }).catch(() => {});
  }, 50);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
