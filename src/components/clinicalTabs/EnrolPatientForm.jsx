import React, { useState } from 'react';

const EnrolPatientForm = ({ theme, styles, onCancel, onEnrollSuccess }) => {
  // 1. Dynamic Environment Base URL Utility Config
  const getBaseURL = () => {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://127.0.0.1:5000'
          : import.meta.env.VITE_SERVER_URL || '';
  };

  // 2. Local UI State Management
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    condition: '',
    referringClinician: '',
    treatingClinicianEmail: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e, field) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // 3. Self-Contained Backend Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Front-end Validation Gate
    if (!formData.fullName || !formData.email || !formData.condition) {
      alert("Please fill in all required properties.");
      return;
    }
    
    try {
      setSubmitting(true);
      const apiBaseUrl = getBaseURL()

      // 🚀 Dispatching network event payload straight to your configured express cluster instance
      const response = await fetch(`${apiBaseUrl}/api/patient/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('allvi_clinic_token')}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          primaryCondition: formData.condition,
          referringClinician: formData.referringClinician,
          treatingClinicianEmail: formData.treatingClinicianEmail,
          orgId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" // Target sandbox tracking key
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "Failed to enrol patient.");
      }

      alert(`🎉 Enrolment invitation dispatched successfully to ${formData.email}!`);
      
      // 4. Notify parent layout shell context structure to drop panels back to list tracker
      if (onEnrollSuccess) {
        onEnrollSuccess();
      }

    } catch (err) {
      console.error("❌ FRONTEND ENROLMENT SUBMIT ERROR:", err.message);
      alert(`Enrolment Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.pageHeader}>
        <div style={styles.pageTitle}>Enrol a Patient</div>
        <div style={styles.pageSub}>
          A personalised magic link will be sent to the patient's email. They complete onboarding themselves.
        </div>
      </div>

      <div style={{ ...styles.card, maxWidth: '540px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={styles.formLabel}>Patient full name *</label>
          <input 
            style={styles.formInput} 
            type="text" 
            placeholder="e.g. Sarah Johnson" 
            value={formData.fullName}
            onChange={(e) => handleChange(e, 'fullName')}
            disabled={submitting}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.formLabel}>Patient email address *</label>
          <input 
            style={styles.formInput} 
            type="email" 
            placeholder="patient@email.com" 
            value={formData.email}
            onChange={(e) => handleChange(e, 'email')}
            disabled={submitting}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.formLabel}>Primary condition *</label>
          <select 
            style={styles.formSelect}
            value={formData.condition}
            onChange={(e) => handleChange(e, 'condition')}
            disabled={submitting}
          >
            <option value="">Select condition…</option>
            <option value="Thyroid Disease">Thyroid Disease (Hashimoto's, Hypothyroid, Hyperthyroid, Graves')</option>
            <option value="PCOS">PCOS</option>
            <option value="Endometriosis">Endometriosis</option>
            <option value="Perimenopause">Perimenopause</option>
            <option value="Menopause">Menopause</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.formLabel}>Referring clinician</label>
          <input 
            style={styles.formInput} 
            type="text" 
            placeholder="e.g. Dr. Sarah Chen" 
            value={formData.referringClinician}
            onChange={(e) => handleChange(e, 'referringClinician')}
            disabled={submitting}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.formLabel}>Treating clinician email (for pre-appointment summaries)</label>
          <input 
            style={styles.formInput} 
            type="email" 
            placeholder="clinician@practice.com" 
            value={formData.treatingClinicianEmail}
            onChange={(e) => handleChange(e, 'treatingClinicianEmail')}
            disabled={submitting}
          />
        </div>

        <div style={{ padding: '14px', background: theme.tealLight, borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: theme.teal, lineHeight: '1.5' }}>
          ℹ️ A magic link will be sent to the patient's email. They'll complete a condition-specific intake form and set their daily check-in time.
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            style={{ ...styles.primaryBtn, opacity: submitting ? 0.7 : 1 }}
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send Invitation →"}
          </button>
          <button 
            type="button" 
            style={styles.ghostBtn} 
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default EnrolPatientForm;