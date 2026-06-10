import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ArrowLeft } from 'lucide-react';

const ClinicalPatientDashboard = ({ patientId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800); // 🚀 Tracks responsive viewport transitions

  const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000'
    : import.meta.env.VITE_SERVER_URL || '';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 800);
    window.addEventListener('resize', handleResize);

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${baseURL}/api/clinical/patient-details/${patientId}`);
        if (res.data.success) setData(res.data.patient);
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    };

    if (patientId) fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, [patientId, baseURL]);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" size={32} /></div>;
  if (!data) return <div className="p-10">Patient data not found.</div>;

  return (
    // 🚀 Added dynamic inline conditional padding limits for mobile contexts
    <main className="main" style={{ padding: isMobile ? '16px' : '20px 40px', background: '#FDFCF9', minHeight: '100vh', boxSizing: 'border-box', width: '100%' }}>
      <button onClick={onBack} style={{ fontSize: '13px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={14} /> Back to Panel
      </button>

      {/* ── HEADER CONTAINER ── */}
      {/* 🚀 Updated flex directions and layouts dynamically to prevent data from clipping over margins */}
      <div style={{ 
        background: '#0F4C5C', 
        color: '#F7F1E8', 
        padding: isMobile ? '20px' : '32px', 
        borderRadius: '12px', 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '24px' : '16px'
      }}>
        <div>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 600, fontFamily: "'Playfair Display', serif", wordBreak: 'break-word' }}>
            {data.id} — {data.name}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px', lineHeight: '1.4' }}>
            {data.condition} · Enrolled {new Date(data.enrollDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})} · Day {data.streak} on programme
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: '#FDF3E7', color: '#C97B2E', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>⚠ Amber — 2 active flags</span>
            <span style={{ background: '#EAF5EE', color: '#2D6A4F', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>🔥 {data.streak}-day streak</span>
          </div>
        </div>
        
        {/* KPI Panel Numbers Row */}
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '20px' : '32px',
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
          borderTop: isMobile ? '1px solid rgba(247,241,232,0.15)' : 'none',
          paddingTop: isMobile ? '16px' : '0'
        }}>
          {Object.entries(data.metrics).map(([k, v]) => (
            <div key={k} style={{ textAlign: 'center', flex: isMobile ? '1' : 'auto' }}>
              <div style={{ fontSize: isMobile ? '24px' : '28px', fontFamily: "'Playfair Display', serif", fontWeight: 'bold' }}>{v}</div>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.7, letterSpacing: '0.08em', marginTop: '2px' }}>{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WEEKLY REPORTS SECTION ── */}
      <div style={{ background: '#FFFFFF', padding: isMobile ? '16px' : '24px', borderRadius: '12px', border: '1px solid #EDE7DB', marginTop: '24px', boxShadow: '0 1px 3px rgba(15,76,92,0.08)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '16px' }}>Weekly Reports</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.weeklyReports.map((report, idx) => (
            <div key={idx} style={{
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center', 
              justifyContent: 'space-between',
              padding: '12px 16px', 
              background: '#F7F1E8', 
              borderRadius: '8px', 
              cursor: 'pointer',
              gap: isMobile ? '12px' : '16px'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>{report.week}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', lineHeight: '1.4' }}>
                  Energy {report.energy} · Mood {report.mood} · {report.flags} flags active
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: isMobile ? 'space-between' : 'flex-end', 
                gap: '12px',
                borderTop: isMobile ? '1px solid rgba(31,41,55,0.05)' : 'none',
                paddingTop: isMobile ? '8px' : '0'
              }}>
                <span style={{ background: report.status === 'amber' ? '#FDF3E7' : '#EAF5EE', color: report.status === 'amber' ? '#C97B2E' : '#2D6A4F', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
                <span style={{ fontSize: '12px', color: '#0F4C5C', fontWeight: 700 }}>View →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default ClinicalPatientDashboard;