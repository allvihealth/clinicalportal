import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Upload, Users, Menu, X, Calendar, Send, Loader2, LogIn } from 'lucide-react'; // Added LogIn icon
import axios from 'axios';
import allvi_logo from "../assets/allvi_logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000'
    : 'https://allvibackend.onrender.com';

  const navLinkStyle = ({ isActive }) => ({
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    color: isActive ? '#0F4C5C' : '#1F2937',
    opacity: isActive ? 1 : 0.7,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: '0.2s',
  });

  const handleAppointmentSubmit = async () => {
    let patientId = "ALLVI-2784"
    if (!patientId) return alert("Please select a patient first.");
    setSending(true);
    try {
      await axios.post(`${baseURL}/api/patient/request-appointment`, {
        patientId: patientId,
        notes: notes
      });
      alert("Appointment request sent successfully!");
      setIsModalOpen(false);
      setNotes('');
    } catch (error) {
      alert("Failed to send request.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <nav style={styles.nav}>
        <style>{`
          @media (max-width: 850px) {
            .nav-links-desktop { display: none !important; }
            .menu-toggle { display: block !important; order: 4; }
            .logo-section { order: 1; }
            .appointment-btn-container { order: 2; margin-left: auto; margin-right: 10px; }
            .login-btn-container { order: 3; margin-right: 10px; }
            .btn-text { display: none; } 
          }
          @media (min-width: 851px) {
            .nav-links-mobile { display: none !important; }
            .menu-toggle { display: none !important; }
          }
        `}</style>

        {/* LOGO SECTION */}
        <Link to="/" className="logo-section" style={styles.logoLink} onClick={() => setIsOpen(false)}>
          <div style={{
            ...styles.logoTextGroup,
            backgroundColor: '#0F4C5C', 
            width: '64px',              
            height: '64px',
            borderRadius: '50%',        
            display: 'flex',            
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(15, 76, 92, 0.2)' 
          }} >
            <span style={{ fontFamily: 'serif', fontSize: '24px', fontWeight: '700', color: '#b9c6ca' }}>All</span>
            <span style={{ fontFamily: 'serif', fontSize: '24px', fontWeight: '300', fontStyle: 'italic', color: '#bed2d7', opacity: 0.6 }}>vi</span>
          </div>
        </Link>

        {/* RIGHT GROUP (Desktop) */}
        <div className="nav-links-desktop" style={styles.desktopRightGroup}>
          <div style={styles.navGroup}>
            <NavLink to="/phase1upload" style={navLinkStyle}><Upload size={16} /> Upload</NavLink>
            <NavLink to="/admin" style={navLinkStyle}><Users size={16} /> AdminPortal</NavLink>
            <NavLink to="/login" style={navLinkStyle}> <LogIn size={16} />Login</NavLink>
            
            {/* NEW LOGIN NAVLINK */}
            <NavLink to="/register" style={navLinkStyle}>
                <div style={styles.loginIconBtn}>
                    Register
                </div>

            </NavLink>
          </div>
        </div>

        {/* APPOINTMENT BUTTON */}
        <div className="appointment-btn-container">
          <button onClick={() => setIsModalOpen(true)} style={styles.appointmentBtn}>
            <Calendar size={18} />
            <span className="btn-text" style={{ marginLeft: '8px' }}>Book Appointment</span>
          </button>
        </div>

        {/* HAMBURGER TOGGLE */}
        <button className="menu-toggle" style={styles.menuButton} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* MOBILE DROPDOWN */}
        {isOpen && (
          <div className="nav-links-mobile" style={styles.mobileNavGroup}>
            
            <NavLink to="/phase1upload" style={navLinkStyle} onClick={() => setIsOpen(false)}><Upload size={18} /> Upload Report</NavLink>
            <NavLink to="/admin" style={navLinkStyle} onClick={() => setIsOpen(false)}><Users size={18} /> Admin Portal</NavLink>
            <NavLink to="/login" style={navLinkStyle} onClick={() => setIsOpen(false)}><LogIn size={18} />Login</NavLink>
            <NavLink to="/register" style={navLinkStyle,styles.loginIconBtn}  onClick={() => setIsOpen(false)}>Register</NavLink>
          </div>
        )}
      </nav>

      {/* MODAL (Unchanged) */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={20} />
                <h3 style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Request Appointment</h3>
              </div>
              <X size={20} onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ padding: '30px' }}>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Share your clinical notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: I want to discuss my thyroid results..."
                style={styles.textarea}
              />
              <button onClick={handleAppointmentSubmit} disabled={sending} style={styles.submitBtn}>
                {sending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                {sending ? "Sending..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  // Existing styles...
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 60px',
    backgroundColor: '#F7F1E8',
    borderBottom: '1px solid rgba(15, 76, 92, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  logoLink: { display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '12px' },
  logoTextGroup: { display: 'flex', alignItems: 'baseline' },
  desktopRightGroup: { display: 'flex', alignItems: 'center', marginLeft: 'auto', marginRight: '40px' },
  navGroup: { display: 'flex', gap: '30px', alignItems: 'center' },
  
  // Custom Login Button Style inside NavLink
  loginIconBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '10px',
    border: '1.5px solid #0F4C5C',
    color: '#0F4C5C',
    transition: 'all 0.3s ease',
    maxWidth:"6rem",
  },

  appointmentBtn: {
    backgroundColor: '#0F4C5C',
    color: '#F7F1E8',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '14px',
    fontSize: '12px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 15px rgba(15, 76, 92, 0.2)',
  },
  menuButton: { background: 'none', border: 'none', color: '#0F4C5C', cursor: 'pointer', padding: '5px' },
  mobileNavGroup: {
    display: 'flex', flexDirection: 'column', position: 'absolute', top: '100%', right: 0, width: '100%',
    backgroundColor: '#F7F1E8', padding: '30px', gap: '25px', borderBottom: '1px solid rgba(0,0,0,0.05)',
    borderLeft: '1px solid rgba(0,0,0,0.05)', boxShadow: '-10px 10px 20px rgba(0,0,0,0.05)'
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  modalContent: { backgroundColor: '#fff', width: '92%', maxWidth: '420px', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  modalHeader: { backgroundColor: '#0F4C5C', color: '#fff', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  textarea: {
    width: '100%', height: '130px', padding: '18px', borderRadius: '18px', border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc', outline: 'none', fontSize: '14px', resize: 'none', color: '#1F2937'
  },
  submitBtn: {
    width: '100%', marginTop: '20px', backgroundColor: '#1F2937', color: '#fff', padding: '16px',
    borderRadius: '18px', border: 'none', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', cursor: 'pointer', textTransform: 'uppercase', fontSize: '12px'
  }
};

export default Navbar;