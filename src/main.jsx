import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initNotifications } from '@/lib/notifications'

// Register service worker for background push notifications
initNotifications();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
