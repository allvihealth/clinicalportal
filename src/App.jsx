import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import your clinical components
import ClinicalLoginPage from './components/ClinicalLoginPage';
import ClinicDashboard from './components/ClinicDashboard';
import ClinicalPatientDashboard from './components/ClinicalPatientDashboard'; 
/**
 * Protected Route Wrapper
 * Checks for the auth token set by ClinicalLoginPage. 
 */
const ProtectedClinicRoute = ({ children }) => {
  const isClinicSession = localStorage.getItem('allvi_clinic_token');
  
  if (!isClinicSession) {
    return <Navigate to="/clinical-login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <div className="app-container" style={{ minHeight: '100vh', backgroundColor: "#F7F1E8" }}>
      <main>
        <Routes>
          {/* Base route automatically redirects to the clinical login */}
          <Route path="/" element={<Navigate to="/clinical-login" replace />} />
          
          {/* Public Authentication Route */}
          <Route path="/clinical-login" element={<ClinicalLoginPage />} />
          
          {/* Protected Organizational Dashboard Route (The Panel) */}
          <Route 
            path="/clinic-dashboard" 
            element={
              <ProtectedClinicRoute>
                <ClinicDashboard />
              </ProtectedClinicRoute>
            } 
          />

          {/* NEW: Protected Individual Patient Dashboard Route */}
          <Route 
            path="/dashboard/:patientId" 
            element={
              <ProtectedClinicRoute>
                <ClinicalPatientDashboard />
              </ProtectedClinicRoute>
            } 
          />

          {/* TEMPORARY: Placeholder for Clinical Summary to prevent 404 errors */}
          <Route 
            path="/clinical-summary/:patientId" 
            element={
              <ProtectedClinicRoute>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', fontFamily: "'DM Sans', sans-serif" }}>
                  <h2 style={{ color: '#0F4C5C' }}>Clinical Summary</h2>
                  <p style={{ color: '#6B7280', marginBottom: '20px' }}>This view is pending implementation.</p>
                  <a href="/clinic-dashboard" style={{ color: '#0F4C5C', fontWeight: 'bold', textDecoration: 'none' }}>← Back to Panel</a>
                </div>
              </ProtectedClinicRoute>
            } 
          />

          {/* 404 Catch-all */}
          <Route path="*" element={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', fontFamily: "'DM Sans', sans-serif" }}>
              <h2 style={{ color: '#0F4C5C', fontSize: '24px', fontWeight: 'bold' }}>404 - Portal Not Found</h2>
              <p style={{ color: '#6B7280', margin: '10px 0 24px 0' }}>The requested clinical route does not exist.</p>
              <a 
                href="/clinical-login" 
                style={{ 
                  backgroundColor: '#0F4C5C', 
                  color: '#F7F1E8', 
                  padding: '12px 24px', 
                  borderRadius: '10px', 
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Return to Login
              </a>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;