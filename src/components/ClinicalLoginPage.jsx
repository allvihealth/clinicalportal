import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail, Loader2 } from 'lucide-react';

const ClinicalLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Mobile responsive hook driven by window screen resize event matrix
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    
    // Quick session check: if already authenticated as clinic, drop straight to dashboard
    const isClinicSession = localStorage.getItem('allvi_clinic_token');
    if (isClinicSession) {
      navigate('/clinic-dashboard');
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Baseline validation check
    if (!email || !password) {
      setError('Please fill in all clinical credential fields.');
      setIsLoading(false);
      return;
    }

    try {
      // Simulating a real asynchronous backend authorization check 
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Separate clinic admin tokens clearly from ordinary patient profiles
      localStorage.setItem('allvi_clinic_token', 'authenticated-clinic-session');
      
      // Redirect straight to the new administrative Executive View dashboard layout
      navigate('/clinic-dashboard');
    } catch (err) {
      setError('Invalid clinician credentials or unauthorized panel node. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Compute responsive dynamic properties cleanly before render layout execution
  const dynamicCardStyle = {
    ...styles.loginCard,
    width: isMobile ? '92%' : '100%',
    padding: isMobile ? '28px 20px' : '40px',
    borderRadius: isMobile ? '16px' : '24px',
  };

  return (
    <div style={styles.container}>
      <div style={dynamicCardStyle}>
        
        {/* Allvi Branding Elements */}
        <div style={styles.brandContainer}>
          <div style={styles.logoBadge}>Allvi</div>
          <p style={styles.brandSubtitle}>Clinical Data Systems</p>
        </div>

        <h2 style={styles.title}>Clinician Sign In</h2>
        <p style={styles.subtitle}>Enter credentials to access administrative views</p>

        {/* System Error Notification Flag utilizing exact Amber #B45309 risk tokens */}
        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          
          {/* Email Address Block */}
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Clinician Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@allvihealth.com"
                style={styles.input}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Password Block */}
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Security Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Secure Interactive Action Button */}
          <button 
            type="submit" 
            style={{ 
              ...styles.submitBtn, 
              backgroundColor: isLoading ? '#1A7A8A' : '#0D5C6E', // Transitions Mid Teal to Dark Teal
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.8 : 1
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={styles.loadingSpinnerContainer}>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating Session...</span>
              </div>
            ) : (
              'Secure Log In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// Design System Matrix Tokens mapping exact brand specifications
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '82vh', 
    backgroundColor: '#F7F1E8', // Matches default background system profile palette
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loginCard: {
    backgroundColor: '#ffffff',
    maxWidth: '440px',
    boxShadow: '0 10px 25px -5px rgba(13, 92, 110, 0.08), 0 8px 10px -6px rgba(13, 92, 110, 0.04)',
    boxSizing: 'border-box',
    border: '1px solid rgba(26, 122, 138, 0.1)',
  },
  brandContainer: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoBadge: {
    display: 'inline-block',
    backgroundColor: '#0D5C6E', // Dark Teal brand anchor
    color: '#D6EDF1',           // Light Teal text accent
    fontFamily: 'serif',
    fontSize: '28px',
    fontWeight: '700',
    padding: '6px 26px',
    borderRadius: '30px',
    boxShadow: '0 4px 12px rgba(13, 92, 110, 0.15)',
  },
  brandSubtitle: {
    fontSize: '12px',
    color: '#1A7A8A',          // Mid Teal subtitle
    margin: '12px 0 0 0',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    fontWeight: '700',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0D5C6E',          // Dark Teal Header text
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#4B5563',
    margin: '0 0 24px 0',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '22px',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0D5C6E',
    marginBottom: '8px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#1A7A8A',          // Mid teal icon accents
  },
  input: {
    width: '100%',
    padding: '12px 16px 12px 42px',
    fontSize: '15px',
    borderRadius: '10px',
    border: '1.5px solid #D6EDF1', // Light Teal border layout frames
    backgroundColor: '#fcfdfd',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1F2937',
    transition: 'border-color 0.2s ease',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FEF3C7', // Soft warning containment background
    color: '#B45309',           // Custom Amber Risk Flag Identity color
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '20px',
    border: '1px solid rgba(180, 83, 9, 0.2)',
    lineHeight: '1.4',
  },
  submitBtn: {
    color: '#D6EDF1',           // Light teal text metrics representation
    padding: '14px',
    fontSize: '15px',
    fontWeight: '700',
    borderRadius: '12px',
    border: 'none',
    marginTop: '6px',
    boxShadow: '0 4px 12px rgba(13, 92, 110, 0.12)',
    transition: 'all 0.2s ease',
  },
  loadingSpinnerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  }
};

export default ClinicalLoginPage;  