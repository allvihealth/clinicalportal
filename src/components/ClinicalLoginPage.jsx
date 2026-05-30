import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ClinicalLoginPage = () => {
  const navigate = useNavigate();
  
  // State for form inputs
  const [email, setEmail] = useState('sarah.chen@greenfieldendo.com');
  const [password, setPassword] = useState('••••••••••');
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle the form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Replace this timeout with your actual backend authentication API call
      // Example: const response = await api.post('/login', { email, password });
      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      // Set session token (matching your App.jsx logic)
      localStorage.setItem('allvi_clinic_token', 'authenticated');
      
      // Route to dashboard on success
      navigate('/clinic-dashboard');
    } catch (error) {
      console.error("Login failed", error);
      // Handle error state here (e.g., show error message)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen active" style={{ display: 'block', minHeight: '100vh' }}>
      <div style={{
        minHeight: '100vh',
        background: '#F7F1E8', // --ivory
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'DM Sans', sans-serif"
      }}>

        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '36px',
            fontWeight: '600',
            color: '#0F4C5C', // --teal
            letterSpacing: '0.02em'
          }}>
            Allvi
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: '400',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#6B7280', // --grey
            marginTop: '4px'
          }}>
            Organisation Dashboard
          </div>
        </div>

        {/* Login Card */}
        <div style={{
          background: '#FFFFFF', // --white
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 8px 32px rgba(15,76,92,0.10)',
          border: '1px solid rgba(15,76,92,0.06)'
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '22px',
            fontWeight: '600',
            color: '#1F2937', // --charcoal
            marginBottom: '6px'
          }}>
            Sign in
          </h2>
          <p style={{
            fontSize: '13px',
            color: '#6B7280', // --grey
            marginBottom: '28px'
          }}>
            Access your organisation dashboard
          </p>

          <form onSubmit={handleLogin}>
            {/* Email Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#6B7280', // --grey
                display: 'block',
                marginBottom: '6px'
              }}>
                Work email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1px solid rgba(15,76,92,0.2)',
                  borderRadius: '8px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  color: '#1F2937', // --charcoal
                  background: '#FFFFFF', // --white
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#6B7280', // --grey
                display: 'block',
                marginBottom: '6px'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1px solid rgba(15,76,92,0.2)',
                  borderRadius: '8px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  color: '#1F2937', // --charcoal
                  background: '#FFFFFF', // --white
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Forgot Password */}
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <span style={{
                fontSize: '13px',
                color: '#0F4C5C', // --teal
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                Forgot password?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                width: '100%',
                background: '#0F4C5C', // --teal
                color: '#F7F1E8', // --ivory
                border: 'none',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
                fontFamily: "'DM Sans', sans-serif",
                cursor: isLoading ? 'wait' : 'pointer',
                letterSpacing: '0.01em',
                opacity: (isHovered || isLoading) ? '0.9' : '1',
                transition: 'opacity 0.2s'
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Role Access Indicator */}
          <div style={{
            marginTop: '20px',
            padding: '14px',
            background: '#F7F1E8', // --ivory
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#6B7280', // --grey
              marginBottom: '6px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              Role access
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              fontSize: '12px',
              color: '#6B7280' // --grey
            }}>
              <span>📊 Executive</span>
              <span>👥 Programme Manager</span>
            </div>
          </div>
        </div>

        {/* Footer Security Note */}
        <div style={{
          marginTop: '24px',
          fontSize: '12px',
          color: '#6B7280' // --grey
        }}>
          🔒 HIPAA-compliant · 256-bit encrypted · SOC 2
        </div>
      </div>
    </div>
  );
};

export default ClinicalLoginPage;