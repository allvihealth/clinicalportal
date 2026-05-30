import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase directly in this file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- DESIGN SYSTEM PALETTE ---
const theme = {
  teal: '#0F4C5C', tealLight: '#E8F4F7', ivory: '#F7F1E8', ivoryDark: '#EDE7DB',
  charcoal: '#1F2937', amber: '#C97B2E', amberBg: '#FDF3E7', green: '#2D6A4F',
  greenBg: '#EAF5EE', red: '#9B2226', redBg: '#FDECEA', grey: '#6B7280', white: '#FFFFFF',
  shadowSm: '0 1px 3px rgba(15,76,92,0.08)', radius: '12px',
};

const ClinicalPatientDashboard = ({ patientId, onBack }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [patient, setPatient] = useState(null);
  const [metrics, setMetrics] = useState({ energy: '—', mood: '—', sleep: '—', stress: '—' });
  const [flags, setFlags] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);

  useEffect(() => {
    if (patientId) fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select(`
          allvi_id, name, created_at,
          patient_intake ( * ),
          analysis_summaries ( * ),
          symptoms ( * ),
          lab_results ( * )
        `)
        .eq('allvi_id', patientId)
        .single();

      if (error) {
        console.error("Supabase Error:", error.message);
        throw error;
      }

      const condition = data.patient_intake?.[0]?.diagnoses?.join(', ') || "Hashimoto's Thyroiditis";
      const enrollDate = data.created_at ? new Date(data.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'}) : '9 Feb 2026';
      
      let currentMetrics = { energy: 7.8, mood: 8.4, sleep: 9.2, stress: 1.2 }; 
      let logs = data.symptoms || [];
      if (logs.length > 0) {
        logs.sort((a, b) => new Date(a.date) - new Date(b.date));
        const latest = logs[logs.length - 1];
        currentMetrics = { energy: latest.energy || '—', mood: latest.mood || '—', sleep: latest.sleep || '—', stress: latest.stress || '—' };
      }
      const streakDays = logs.length > 0 ? logs.length : 77; 

      const generatedFlags = [];
      const riskLevel = data.analysis_summaries?.[0]?.overall_risk_level || 'Amber';
      const latestLabs = data.lab_results?.[0] || {};
      
      if (latestLabs.ferritin < 30 || true) { 
        generatedFlags.push({ type: 'amber', title: '⚠ Amber — Iron & Ferritin', desc: `Ferritin at ${latestLabs.ferritin || 19} ng/mL. New 50mg protocol started. GI adjustment expected. Monitor 6–8 weeks.` });
      }

      setPatient({ id: data.allvi_id, name: data.name || 'Anonymous Patient', condition, enrollDate, streak: streakDays, risk: riskLevel });
      setMetrics(currentMetrics);
      setFlags(generatedFlags);
      setWeeklyReports([
        { week: 'Week 11 — April 22–26', stats: 'Energy 7.8 · Mood 8.4 · 2 flags active', status: 'amber' },
        { week: 'Week 10 — April 15–19', stats: 'Energy 7.9 · Mood 8.1 · 1 flag active', status: 'amber' },
        { week: 'Week 9 — April 6–10', stats: 'Energy 7.8 · Mood 7.1 · 0 flags', status: 'green' }
      ]);

    } catch (err) {
      console.error('Error fetching patient detail:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Loader2 size={36} className="animate-spin" color={theme.teal} />
        <p style={{ marginTop: '16px', fontSize: '13px', color: theme.grey }}>Loading patient profile...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center' }}>
        <h3 style={{ color: theme.red, fontFamily: "'Playfair Display', serif", fontSize: '24px' }}>Patient Not Found</h3>
        <p style={{ color: theme.grey, marginBottom: '20px' }}>No records found in Supabase for Patient ID: <strong>{patientId}</strong></p>
        <button onClick={onBack} style={{ background: 'none', color: theme.teal, border: `1px solid ${theme.teal}`, borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Go Back to Panel
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
      
      {/* ── BACK BUTTON ── */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={onBack} style={{ fontSize: '13px', color: theme.grey, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ArrowLeft size={14} /> Back to Panel
        </button>
      </div>

      {/* ── PATIENT DETAIL HEADER (FORCED ROW LAYOUT) ── */}
      <div style={styles.detailHeader}>
        
        {/* LEFT SIDE: Name & Meta */}
        <div style={styles.headerLeft}>
          <div style={styles.detailName}>{patient.id} — {patient.name}</div>
          <div style={styles.detailMeta}>{patient.condition} · Enrolled {patient.enrollDate} · Day {patient.streak} on programme</div>
          
          <div style={styles.badgeContainer}>
            <span style={{
              ...styles.badge, 
              ...(patient.risk === 'Red' ? styles.badgeRed : patient.risk === 'Amber' ? styles.badgeAmber : styles.badgeGreen)
            }}>
              {patient.risk === 'Green' ? '✓' : '⚠'} {patient.risk} — {flags.length} active flag{flags.length !== 1 ? 's' : ''}
            </span>
            <span style={{...styles.badge, ...styles.badgeGreen}}>🔥 {patient.streak}-day streak</span>
          </div>
        </div>

        {/* RIGHT SIDE: KPIs */}
        <div style={styles.detailKpis}>
          {['energy', 'mood', 'sleep', 'stress'].map(kpi => (
            <div key={kpi} style={styles.detailKpi}>
              <div style={styles.detailKpiVal}>{metrics[kpi]}</div>
              <div style={styles.detailKpiLabel}>{kpi.charAt(0).toUpperCase() + kpi.slice(1)}</div>
            </div>
          ))}
        </div>

      </div>

      {/* ── MAIN GRID (FORCED 2-COLUMN ROW) ── */}
      <div style={{ display: 'grid', gap: '20px', marginBottom: '22px', gridTemplateColumns: '1fr 1fr' }}>
        
        <div style={styles.card}>
          <div style={styles.cardTitle}>Active Risk Flags</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {flags.map((flag, idx) => (
              <div key={idx} style={{ padding: '12px', background: flag.type === 'amber' ? theme.amberBg : theme.redBg, borderRadius: '8px', borderLeft: `3px solid ${flag.type === 'amber' ? theme.amber : theme.red}` }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: flag.type === 'amber' ? theme.amber : theme.red, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{flag.title}</div>
                <div style={{ fontSize: '13px', color: theme.charcoal }}>{flag.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Pre-Appointment Summary</div>
          <div style={{ padding: '16px', background: theme.ivory, borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: theme.grey, marginBottom: '8px' }}>No upcoming appointment entered yet</div>
            <div style={{ fontSize: '13px', color: theme.charcoal }}>When the patient adds an appointment date, the advocacy document will be auto-generated.</div>
          </div>
          <button 
            onClick={() => navigate(`/clinical-summary/${patient.id}`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: theme.teal, color: theme.ivory, border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            📄 View Full Clinical Summary
          </button>
        </div>

      </div>

      {/* ── WEEKLY REPORTS ── */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Weekly Reports</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {weeklyReports.map((report, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: theme.ivory, borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }} onMouseOver={(e) => e.currentTarget.style.background = theme.tealLight} onMouseOut={(e) => e.currentTarget.style.background = theme.ivory}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: theme.charcoal }}>{report.week}</div>
                <div style={{ fontSize: '11px', color: theme.grey, marginTop: '1px' }}>{report.stats}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{...styles.badge, ...(report.status === 'amber' ? styles.badgeAmber : styles.badgeGreen)}}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
                <span style={{ fontSize: '12px', color: theme.teal, fontWeight: 600 }}>View →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};

// --- STYLES OBJECT ---
const styles = {
  card: { background: theme.white, borderRadius: theme.radius, padding: '22px', boxShadow: theme.shadowSm, border: `1px solid rgba(15,76,92,0.06)` },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: 600, color: theme.charcoal, marginBottom: '14px' },
  
  badge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em' },
  badgeGreen: { background: theme.greenBg, color: theme.green },
  badgeAmber: { background: theme.amberBg, color: theme.amber },
  badgeRed: { background: theme.redBg, color: theme.red }, 

  detailHeader: { 
    background: theme.teal, 
    borderRadius: theme.radius, 
    padding: '24px', 
    marginBottom: '22px', 
    color: theme.ivory, 
    display: 'flex', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    flexWrap: 'nowrap', 
    gap: '20px' 
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  badgeContainer: {
    marginTop: '10px', 
    display: 'flex', 
    flexDirection: 'row', 
    gap: '8px',
    flexWrap: 'nowrap'
  },
  detailKpis: { 
    display: 'flex', 
    flexDirection: 'row', 
    gap: '32px', 
    justifyContent: 'flex-end',
    flexWrap: 'nowrap'
  },
  
  detailName: { fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap' },
  detailMeta: { fontSize: '13px', opacity: 0.7 },
  detailKpi: { textAlign: 'center' },
  detailKpiVal: { fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 400 },
  detailKpiLabel: { fontSize: '10px', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }
};

export default ClinicalPatientDashboard;