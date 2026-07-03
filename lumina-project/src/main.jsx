import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LuminaApp from './lumina-mobile-app.jsx';
import LuminaAdmin from './lumina-admin-dashboard.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Viewer + provider mobile-style app */}
        <Route path="/" element={<LuminaApp />} />
        {/* Admin validation dashboard */}
        <Route path="/admin" element={<LuminaAdmin />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
