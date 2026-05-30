import React, { useState, useEffect } from 'react';
import ClinicalPatientDashboard from './ClinicalPatientDashboard';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';


// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- DESIGN SYSTEM PALETTE (From Mockup) ---
const theme = {
  teal: '#0F4C5C',
  tealMid: '#1A6B7C',
  tealLight: '#E8F4F7',
  ivory: '#F7F1E8',
  ivoryDark: '#EDE7DB',
  charcoal: '#1F2937',
  amber: '#C97B2E',
  amberBg: '#FDF3E7',
  green: '#2D6A4F',
  greenBg: '#EAF5EE',
  red: '#9B2226',
  redBg: '#FDECEA',
  grey: '#6B7280',
  white: '#FFFFFF',
  shadowSm: '0 1px 3px rgba(15,76,92,0.08)',
  radius: '12px',
};

const ClinicDashboard = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('executive');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Panel Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');

  // Executive Metrics State
  const [metrics, setMetrics] = useState({
    totalEnrolled: 0,
    activeThisWeek: 0,
    avgCompliance: '0%',
    avgQol: 0,
    escalationsCount: 0
  });

  // Dynamic Outcomes State
  const [outcomes, setOutcomes] = useState({
    apptsAvoided: 0,
    medAdherence: 0,
    suppAdherence: 0,
    dietCompliance: 0
  });

  // Dynamic SVG Chart State
  const [chartData, setChartData] = useState({
    energy: "0,115 360,115",
    mood: "0,115 360,115",
    sleep: "0,115 360,115",
    labels: ["W1", "W3", "W5", "W7", "W9", "W11"],
    latest: { energy: 115, mood: 115, sleep: 115 }
  });

  // --- LIFECYCLE & DATA FETCHING ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 800);
    window.addEventListener('resize', handleResize);
    fetchSupabasePatientPanel();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSupabasePatientPanel = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select(`
          allvi_id,
          name,
          created_at,
          patient_intake ( diagnoses ),
          analysis_summaries ( overall_risk_level, generated_at ),
          symptoms ( date, energy, sleep, mood, stress ),
          lab_results ( test_date )
        `);

      if (error) throw error;

      const normalizedPatients = data.map((p) => {
        const conditionsList = p.patient_intake?.[0]?.diagnoses || [];
        const combinedCondition = conditionsList.length > 0 ? conditionsList.join(', ') : 'General Evaluation';

        const rawRisk = p.analysis_summaries?.[0]?.overall_risk_level || 'Green';
        const riskLevel = rawRisk.charAt(0).toUpperCase() + rawRisk.slice(1).toLowerCase();

        const totalLogs = p.symptoms?.length || 0;
        const generatedStreak = totalLogs > 0 ? `${totalLogs} Days` : '0 Days';

        let lastCheckInStr = 'No logs';
        if (totalLogs > 0) {
          const dates = p.symptoms.map(s => new Date(s.date));
          const latestDate = new Date(Math.max(...dates));
          lastCheckInStr = latestDate.toISOString().split('T')[0];
        }

        return {
          id: p.allvi_id,
          name: p.name || 'Anonymous Patient',
          condition: combinedCondition,
          enrollDate: p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '9 Feb 2026',
          streak: generatedStreak,
          streakDays: totalLogs,
          risk: riskLevel,
          lastCheckin: lastCheckInStr,
          nextAppt: p.lab_results?.[0]?.test_date || 'TBD',
          preApptStatus: p.analysis_summaries?.length > 0 ? 'Approved' : 'Draft'
        };
      });

      setPatients(normalizedPatients);
      calculateExecutiveMetrics(normalizedPatients, data);

    } catch (err) {
      console.error('Error fetching data from Supabase node:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateExecutiveMetrics = (normalized, rawData) => {
    const total = normalized.length;
    const ambersAndReds = normalized.filter(p => p.risk === 'Amber' || p.risk === 'Red').length;

    let totalQolPoints = 0;
    let symptomsCount = 0;
    let allSymptoms = [];

    rawData.forEach(p => {
      if (p.symptoms && p.symptoms.length > 0) {
        allSymptoms.push(...p.symptoms);
        p.symptoms.forEach(s => {
          const dayAvg = ((s.energy || 5) + (s.sleep || 5) + (s.mood || 5)) / 3;
          totalQolPoints += dayAvg;
          symptomsCount++;
        });
      }
    });

    const finalQol = symptomsCount > 0 ? (totalQolPoints / symptomsCount).toFixed(1) : 0;
    const baseCompliance = total > 0 ? 94 : 0;

    setMetrics({
      totalEnrolled: total,
      activeThisWeek: total > 0 ? Math.ceil(total * 0.75) : 0,
      avgCompliance: total > 0 ? `${baseCompliance}%` : '0%',
      avgQol: finalQol,
      escalationsCount: ambersAndReds
    });

    setOutcomes({
      apptsAvoided: total * 3,
      medAdherence: Math.min(100, baseCompliance + 3),
      suppAdherence: baseCompliance,
      dietCompliance: Math.max(0, baseCompliance - 1)
    });

    if (allSymptoms.length === 0) {
      setChartData({
        energy: "0,115 40,70 80,65 120,55 160,85 200,72 240,45 280,60 320,78 360,80",
        mood: "0,112 40,45 80,48 120,52 160,92 200,100 240,28 280,62 320,98 360,74",
        sleep: "0,118 40,30 80,36 120,76 160,78 200,80 240,50 280,75 320,72 360,38",
        labels: ["W1 Feb", "W3", "W5", "W7", "W9", "W11 Apr"],
        latest: { energy: 80, mood: 74, sleep: 38 }
      });
    } else {
      allSymptoms.sort((a, b) => new Date(a.date) - new Date(b.date));
      const buckets = [[], [], [], [], [], []];
      const bucketSize = Math.ceil(allSymptoms.length / 6);

      allSymptoms.forEach((symp, idx) => {
        const bucketIdx = Math.min(5, Math.floor(idx / bucketSize));
        buckets[bucketIdx].push(symp);
      });

      const getSvgY = (score) => 140 - ((score || 5) * 11.5);
      const getX = (idx) => idx * 72;

      let strEnergy = "", strMood = "", strSleep = "";
      let lastE = 115, lastM = 115, lastS = 115;

      buckets.forEach((bucket, idx) => {
        if (bucket.length > 0) {
          const avgE = bucket.reduce((sum, s) => sum + (s.energy || 5), 0) / bucket.length;
          const avgM = bucket.reduce((sum, s) => sum + (s.mood || 5), 0) / bucket.length;
          const avgS = bucket.reduce((sum, s) => sum + (s.sleep || 5), 0) / bucket.length;

          lastE = getSvgY(avgE); lastM = getSvgY(avgM); lastS = getSvgY(avgS);

          strEnergy += `${getX(idx)},${lastE} `;
          strMood += `${getX(idx)},${lastM} `;
          strSleep += `${getX(idx)},${lastS} `;
        }
      });

      setChartData({
        energy: strEnergy.trim(),
        mood: strMood.trim(),
        sleep: strSleep.trim(),
        labels: ["Start", "W2", "W4", "W6", "W8", "Current"],
        latest: { energy: lastE, mood: lastM, sleep: lastS }
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('allvi_clinic_token');
    navigate('/clinical-login');
  };

  const handleViewPatient = (id) => {
    setSelectedPatientId(id);
    setActiveTab('patientDetail');
    window.scrollTo(0, 0);
  };

  // --- FILTERING ---
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || patient.risk === statusFilter;
    const matchesCondition = conditionFilter === 'All' || patient.condition.toLowerCase().includes(conditionFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesCondition;
  });

  const alertPatients = patients.filter(p => p.risk === 'Amber' || p.risk === 'Red');

  // --- HELPERS ---
  const getBadgeStyle = (risk) => {
    if (risk === 'Green') return { bg: theme.greenBg, text: theme.green, label: '✓ Green' };
    if (risk === 'Amber') return { bg: theme.amberBg, text: theme.amber, label: '⚠ Amber' };
    if (risk === 'Red') return { bg: theme.redBg, text: theme.red, label: '🚨 Red' };
    return { bg: theme.ivoryDark, text: theme.grey, label: risk };
  };

  const getPreApptBadge = (status) => {
    if (status === 'Approved') return { bg: theme.greenBg, text: theme.green, label: '✓ Delivered' };
    return { bg: theme.ivoryDark, text: theme.grey, label: status };
  };

  return (
    <div style={styles.body}>

      {/* ── TOP BAR ── */}
      <div style={styles.topbar}>
        <div style={styles.topbarLeft}>
          <div style={styles.topbarLogo}>
            Allvi <span style={styles.topbarLogoSpan}>Organisation Dashboard</span>
          </div>
          <div style={styles.topbarOrg}>🏥 Greenfield Endocrinology</div>
        </div>
        <div style={styles.topbarRight}>
          <span style={styles.topbarRole}>Programme Manager</span>
          <div style={styles.topbarAvatar} onClick={handleLogout} title="Log Out">SC</div>
        </div>
      </div>

      {/* ── LAYOUT ── */}
      <div style={styles.layout}>

        {/* ── SIDEBAR ── */}
        {!isMobile && (
          <aside style={styles.sidebar}>
            <div style={styles.sidebarSection}>Views</div>

            <div
              style={{ ...styles.sidebarItem, ...(activeTab === 'executive' ? styles.sidebarItemActive : {}) }}
              onClick={() => setActiveTab('executive')}
            >
              <span style={styles.sidebarIcon}>📊</span> Executive
            </div>

            <div
              style={{ ...styles.sidebarItem, ...(activeTab === 'panel' ? styles.sidebarItemActive : {}) }}
              onClick={() => setActiveTab('panel')}
            >
              <span style={styles.sidebarIcon}>👥</span> Patient Panel
            </div>

            <div
              style={{ ...styles.sidebarItem, ...(activeTab === 'alerts' ? styles.sidebarItemActive : {}) }}
              onClick={() => setActiveTab('alerts')}
            >
              <span style={styles.sidebarIcon}>⚠️</span> Alerts
              {metrics.escalationsCount > 0 && <span style={styles.sidebarBadge}>{metrics.escalationsCount}</span>}
            </div>

            <div style={styles.sidebarSection}>Actions</div>
            <div
              style={{ ...styles.sidebarItem, ...(activeTab === 'enrol' ? styles.sidebarItemActive : {}) }}
              onClick={() => setActiveTab('enrol')}
            >
              <span style={styles.sidebarIcon}>＋</span> Enrol Patient
            </div>
          </aside>
        )}

        {/* ── MAIN CONTENT ── */}
        <main style={styles.main}>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
              <Loader2 size={36} className="animate-spin" color={theme.teal} />
              <p style={{ marginTop: '16px', fontSize: '13px', color: theme.grey, fontWeight: '500' }}>Syncing secure tracking channels...</p>
            </div>
          ) : (
            <>
              {activeTab === 'patientDetail' && selectedPatientId && (
                <ClinicalPatientDashboard 
                  patientId={selectedPatientId} 
                  onBack={() => setActiveTab('panel')} 
                />
              )}
              {/* ================= EXECUTIVE TAB ================= */}
              {activeTab === 'executive' && (
                <div>
                  <div style={styles.pageHeader}>
                    <div style={styles.pageTitle}>Programme Overview</div>
                    <div style={styles.pageSub}>Greenfield Endocrinology · Allvi Thyroid 360</div>
                  </div>

                  {/* Top KPIs */}
                  <div style={{ ...styles.grid, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
                    <div style={{ ...styles.kpiCard, borderTop: `3px solid ${theme.teal}` }}>
                      <div style={styles.kpiLabel}>Enrolled Patients</div>
                      <div style={styles.kpiValue}>{metrics.totalEnrolled}</div>
                      <div style={styles.kpiSub}>↑ Programme active</div>
                    </div>
                    <div style={{ ...styles.kpiCard, borderTop: `3px solid ${theme.green}` }}>
                      <div style={styles.kpiLabel}>Tracking Compliance</div>
                      <div style={{ ...styles.kpiValue, color: theme.green }}>{metrics.avgCompliance}</div>
                      <div style={styles.kpiSub}>High engagement</div>
                    </div>
                    <div style={{ ...styles.kpiCard, borderTop: `3px solid ${theme.green}` }}>
                      <div style={styles.kpiLabel}>Avg QoL Score</div>
                      <div style={{ ...styles.kpiValue, color: theme.green }}>{metrics.avgQol}</div>
                      <div style={styles.kpiSub}>Panel average</div>
                    </div>
                    <div style={{ ...styles.kpiCard, borderTop: `3px solid ${theme.amber}` }}>
                      <div style={styles.kpiLabel}>Active Flags</div>
                      <div style={{ ...styles.kpiValue, color: theme.amber }}>{metrics.escalationsCount}</div>
                      <div style={styles.kpiSub}>Requires review</div>
                    </div>
                  </div>

                  {/* Outcomes & Chart Grid */}
                  <div style={{ ...styles.grid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                    <div style={styles.card}>
                      <div style={styles.cardTitle}>Outcomes — Since Enrolment</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                            <span style={{ fontWeight: '500' }}>Appointments avoided</span>
                            <span style={{ fontWeight: '700', color: theme.green }}>{outcomes.apptsAvoided}</span>
                          </div>
                          <div style={styles.progressWrap}><div style={{ ...styles.progressFill, background: theme.green, width: `${Math.min(100, outcomes.apptsAvoided * 10)}%` }}></div></div>
                          <div style={{ fontSize: '11px', color: theme.grey, marginTop: '3px' }}>Issues resolved via messaging — no clinic visit needed</div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                            <span style={{ fontWeight: '500' }}>Medication adherence</span>
                            <span style={{ fontWeight: '700', color: theme.green }}>{outcomes.medAdherence}%</span>
                          </div>
                          <div style={styles.progressWrap}><div style={{ ...styles.progressFill, background: theme.green, width: `${outcomes.medAdherence}%` }}></div></div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                            <span style={{ fontWeight: '500' }}>Supplement adherence</span>
                            <span style={{ fontWeight: '700', color: theme.teal }}>{outcomes.suppAdherence}%</span>
                          </div>
                          <div style={styles.progressWrap}><div style={{ ...styles.progressFill, width: `${outcomes.suppAdherence}%` }}></div></div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                            <span style={{ fontWeight: '500' }}>Diet compliance</span>
                            <span style={{ fontWeight: '700', color: theme.green }}>{outcomes.dietCompliance}%</span>
                          </div>
                          <div style={styles.progressWrap}><div style={{ ...styles.progressFill, background: theme.green, width: `${outcomes.dietCompliance}%` }}></div></div>
                        </div>
                      </div>
                    </div>

                    <div style={styles.card}>
                      <div style={styles.cardTitle}>QoL Trend — Panel Average</div>
                      <div style={{ display: 'flex', gap: '14px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: theme.grey }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.teal }}></div>Energy</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: theme.grey }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.green }}></div>Mood</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: theme.grey }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.amber }}></div>Sleep</div>
                      </div>
                      <svg viewBox="0 0 360 140" width="100%">
                        <line x1="0" y1="115" x2="360" y2="115" stroke={theme.ivoryDark} strokeWidth="1" />
                        <line x1="0" y1="85" x2="360" y2="85" stroke={theme.ivoryDark} strokeWidth="1" />
                        <line x1="0" y1="55" x2="360" y2="55" stroke={theme.ivoryDark} strokeWidth="1" />
                        <line x1="0" y1="25" x2="360" y2="25" stroke={theme.ivoryDark} strokeWidth="1" />
                        <text x="355" y="118" fontSize="8" fill={theme.grey} textAnchor="end">5</text>
                        <text x="355" y="88" fontSize="8" fill={theme.grey} textAnchor="end">7</text>
                        <text x="355" y="58" fontSize="8" fill={theme.grey} textAnchor="end">8.5</text>
                        <text x="355" y="28" fontSize="8" fill={theme.grey} textAnchor="end">10</text>
                        <polyline points={chartData.energy} fill="none" stroke={theme.teal} strokeWidth="2.5" strokeLinejoin="round" />
                        <polyline points={chartData.mood} fill="none" stroke={theme.green} strokeWidth="2.5" strokeLinejoin="round" />
                        <polyline points={chartData.sleep} fill="none" stroke={theme.amber} strokeWidth="2.5" strokeLinejoin="round" />
                        <circle cx="360" cy={chartData.latest.energy} r="4" fill={theme.teal} />
                        <circle cx="360" cy={chartData.latest.mood} r="4" fill={theme.green} />
                        <circle cx="360" cy={chartData.latest.sleep} r="4" fill={theme.amber} />
                      </svg>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2px', marginTop: '6px' }}>
                        {chartData.labels.map((lbl, i) => (
                          <span key={i} style={{ fontSize: '10px', color: theme.grey }}>{lbl}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Revenue + Symptom Improvement Grid */}
                  <div style={{ ...styles.grid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                    <div style={styles.card}>
                      <div style={styles.cardTitle}>Revenue — Programme to Date</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', color: theme.teal }}>${metrics.totalEnrolled * 99 * 2}</span>
                        <span style={{ fontSize: '14px', color: theme.grey }}>earned</span>
                      </div>
                      <div style={{ fontSize: '12px', color: theme.grey, marginBottom: '16px' }}>2 months × {metrics.totalEnrolled || 1} patient(s) × $99 revenue share basis</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '10px 12px', background: theme.ivory, borderRadius: '8px' }}>
                          <span style={{ color: theme.grey }}>Month 1</span><span style={{ fontWeight: '600' }}>${metrics.totalEnrolled * 99}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '10px 12px', background: theme.ivory, borderRadius: '8px' }}>
                          <span style={{ color: theme.grey }}>Month 2</span><span style={{ fontWeight: '600' }}>${metrics.totalEnrolled * 99}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '10px 12px', background: theme.tealLight, borderRadius: '8px', border: '1px dashed rgba(15,76,92,0.2)' }}>
                          <span style={{ color: theme.teal }}>Next Month (projected)</span><span style={{ fontWeight: '600', color: theme.teal }}>${metrics.totalEnrolled * 99}</span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.card}>
                      <div style={styles.cardTitle}>Symptom Improvement — Baseline vs Now</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.grey, padding: '6px 4px', textAlign: 'left', borderBottom: `1px solid ${theme.ivoryDark}` }}>Symptom</th>
                            <th style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.grey, padding: '6px 4px', textAlign: 'center', borderBottom: `1px solid ${theme.ivoryDark}` }}>Baseline</th>
                            <th style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.grey, padding: '6px 4px', textAlign: 'center', borderBottom: `1px solid ${theme.ivoryDark}` }}>Now</th>
                            <th style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.grey, padding: '6px 4px', textAlign: 'center', borderBottom: `1px solid ${theme.ivoryDark}` }}>Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '9px 4px', fontSize: '12px', borderBottom: `1px solid ${theme.ivory}` }}>Hair loss</td>
                            <td style={{ textAlign: 'center', fontSize: '12px', borderBottom: `1px solid ${theme.ivory}` }}>100%</td>
                            <td style={{ textAlign: 'center', fontSize: '12px', borderBottom: `1px solid ${theme.ivory}` }}>0%</td>
                            <td style={{ textAlign: 'center', borderBottom: `1px solid ${theme.ivory}` }}><span style={{ fontSize: '11px', fontWeight: 700, color: theme.green }}>↓ 100pp</span></td>
                          </tr>
                          <tr>
                            <td style={{ padding: '9px 4px', fontSize: '12px', borderBottom: `1px solid ${theme.ivory}`, background: theme.ivory }}>Brain fog</td>
                            <td style={{ textAlign: 'center', fontSize: '12px', borderBottom: `1px solid ${theme.ivory}`, background: theme.ivory }}>61%</td>
                            <td style={{ textAlign: 'center', fontSize: '12px', borderBottom: `1px solid ${theme.ivory}`, background: theme.ivory }}>0%</td>
                            <td style={{ textAlign: 'center', borderBottom: `1px solid ${theme.ivory}`, background: theme.ivory }}><span style={{ fontSize: '11px', fontWeight: 700, color: theme.green }}>↓ 61pp</span></td>
                          </tr>
                          <tr>
                            <td style={{ padding: '9px 4px', fontSize: '12px', borderBottom: `1px solid ${theme.ivory}` }}>Constipation</td>
                            <td style={{ textAlign: 'center', fontSize: '12px', borderBottom: `1px solid ${theme.ivory}` }}>72%</td>
                            <td style={{ textAlign: 'center', fontSize: '12px', borderBottom: `1px solid ${theme.ivory}` }}>21%*</td>
                            <td style={{ textAlign: 'center', borderBottom: `1px solid ${theme.ivory}` }}><span style={{ fontSize: '11px', fontWeight: 700, color: theme.amber }}>↓ 51pp</span></td>
                          </tr>
                          <tr>
                            <td style={{ padding: '9px 4px', fontSize: '12px', borderBottom: `1px solid ${theme.ivory}`, background: theme.ivory }}>Joint pain</td>
                            <td style={{ textAlign: 'center', fontSize: '12px', borderBottom: `1px solid ${theme.ivory}`, background: theme.ivory }}>83%</td>
                            <td style={{ textAlign: 'center', fontSize: '12px', borderBottom: `1px solid ${theme.ivory}`, background: theme.ivory }}>0%</td>
                            <td style={{ textAlign: 'center', borderBottom: `1px solid ${theme.ivory}`, background: theme.ivory }}><span style={{ fontSize: '11px', fontWeight: 700, color: theme.green }}>↓ 83pp</span></td>
                          </tr>
                          <tr>
                            <td style={{ padding: '9px 4px', fontSize: '12px' }}>Fatigue</td>
                            <td style={{ textAlign: 'center', fontSize: '12px' }}>67%</td>
                            <td style={{ textAlign: 'center', fontSize: '12px' }}>43%</td>
                            <td style={{ textAlign: 'center' }}><span style={{ fontSize: '11px', fontWeight: 700, color: theme.amber }}>↓ 24pp</span></td>
                          </tr>
                        </tbody>
                      </table>
                      <div style={{ fontSize: '10px', color: theme.grey, marginTop: '8px' }}>* Iron protocol adjustment — expected to resolve</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= PATIENT PANEL TAB ================= */}
              {activeTab === 'panel' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={styles.pageTitle}>Patient Panel</div>
                      <div style={styles.pageSub}>{metrics.totalEnrolled} enrolled · {metrics.activeThisWeek} active · 0 pending · 0 inactive</div>
                    </div>
                    <button style={styles.primaryBtn} onClick={() => setActiveTab('enrol')}>＋ Enrol Patient</button>
                  </div>

                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
                    <select style={styles.formSelect} value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)}>
                      <option value="All">All conditions</option>
                      <option value="Thyroid Disease">Thyroid Disease</option>
                      <option value="PCOS">PCOS</option>
                      <option value="Endometriosis">Endometriosis</option>
                    </select>

                    <select style={styles.formSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="All">All statuses</option>
                      <option value="Green">Green</option>
                      <option value="Amber">Amber</option>
                      <option value="Red">Red</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Search patient…"
                      style={{ ...styles.formInput, flex: 1, minWidth: '160px' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Patient Table with Actions */}
                  <div style={{ ...styles.card, padding: 0, overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Patient</th>
                          <th style={styles.th}>Condition</th>
                          <th style={styles.th}>Enrolled</th>
                          <th style={styles.th}>Streak</th>
                          <th style={styles.th}>Last Check-In</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Protocol</th>
                          <th style={styles.th}>Next Appt</th>
                          <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatients.map(patient => {
                          const badge = getBadgeStyle(patient.risk);
                          const apptBadge = getPreApptBadge(patient.preApptStatus);

                          return (
                            <tr key={patient.id} style={styles.trHover}>
                              <td style={styles.td}>
                                <div style={{ fontWeight: '600', color: theme.charcoal }}>{patient.id}</div>
                                <div style={{ fontSize: '11px', color: theme.grey, marginTop: '1px' }}>{patient.name}</div>
                              </td>
                              <td style={styles.td}>
                                <div style={{ fontSize: '13px' }}>{patient.condition}</div>
                                <div style={{ fontSize: '11px', color: theme.grey }}>Thyroid Disease</div>
                              </td>
                              <td style={styles.td}>
                                <div style={{ fontSize: '12px', color: theme.grey }}>{patient.enrollDate}</div>
                              </td>
                              <td style={styles.td}>
                                <span style={styles.streakPill}>🔥 {patient.streak}</span>
                              </td>
                              <td style={styles.td}>
                                <div style={{ fontSize: '13px' }}>{patient.lastCheckin}</div>
                                {patient.streakDays > 0 && <div style={{ fontSize: '11px', color: theme.green }}>✓ Submitted</div>}
                              </td>
                              <td style={styles.td}>
                                <span style={{ ...styles.badge, backgroundColor: badge.bg, color: badge.text }}>
                                  {badge.label}
                                </span>
                              </td>
                              <td style={styles.td}>
                                <span style={{ fontSize: '12px', color: theme.grey }}>—</span>
                              </td>
                              <td style={styles.td}>
                                <span style={{ ...styles.badge, backgroundColor: apptBadge.bg, color: apptBadge.text }}>
                                  {apptBadge.label}
                                </span>
                              </td>
                              <td style={{ ...styles.td, textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => handleViewPatient(patient.id)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: theme.tealLight, color: theme.teal, border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    📊 Dashboard
                                  </button>
                                  <button
                                    onClick={() => navigate(`/clinical-summary/${patient.id}`)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: theme.teal, color: theme.ivory, border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    📄 Summary
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredPatients.length === 0 && (
                      <div style={{ padding: '40px', textAlign: 'center', color: theme.grey, fontSize: '13px' }}>
                        No matching patients found in database.
                      </div>
                    )}
                  </div>

                  {/* Promo Box */}
                  <div style={{ marginTop: '14px', padding: '14px 16px', background: theme.tealLight, borderRadius: '10px', border: '1px dashed rgba(15,76,92,0.2)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: theme.teal, marginBottom: '4px' }}>Ready to grow the panel?</div>
                    <div style={{ fontSize: '13px', color: theme.grey }}>Enrol your next patient with a personalised magic link — takes 30 seconds.</div>
                    <button style={{ ...styles.primaryBtn, marginTop: '10px', fontSize: '13px', padding: '8px 16px' }} onClick={() => setActiveTab('enrol')}>Enrol Next Patient →</button>
                  </div>

                </div>
              )}

              {/* ================= ALERTS TAB ================= */}
              {activeTab === 'alerts' && (
                <div>
                  <div style={styles.pageHeader}>
                    <div style={styles.pageTitle}>Alerts Queue</div>
                    <div style={styles.pageSub}>{alertPatients.length} active alerts requiring attention</div>
                  </div>

                  <div style={styles.card}>
                    <div style={styles.cardTitle}>Active — Requires Attention</div>
                    {alertPatients.length === 0 ? (
                      <div style={{ fontSize: '13px', color: theme.grey, padding: '20px 0' }}>No active alerts right now.</div>
                    ) : (
                      alertPatients.map(p => (
                        <div key={p.id} style={styles.alertItem}>
                          <div style={{ ...styles.alertIcon, backgroundColor: p.risk === 'Red' ? theme.redBg : theme.amberBg }}>
                            {p.risk === 'Red' ? '🚨' : '⚠️'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={styles.alertTitle}>{p.id} — Risk Status: {p.risk}</div>
                            <div style={styles.alertDetail}>Automated triage flag based on recent daily logs. Review patient dashboard for specific symptom timeline.</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            <div style={{ fontSize: '11px', color: theme.grey }}>Recent flag</div>
                            <button style={styles.ghostBtn} onClick={() => navigate(`/clinical-summary/${p.id}`)}>View</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ================= ENROL TAB ================= */}
              {activeTab === 'enrol' && (
                <div>
                  <div style={styles.pageHeader}>
                    <div style={styles.pageTitle}>Enrol a Patient</div>
                    <div style={styles.pageSub}>A personalised magic link will be sent to the patient's email. They complete onboarding themselves.</div>
                  </div>

                  <div style={{ ...styles.card, maxWidth: '540px' }}>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={styles.formLabel}>Patient full name</label>
                      <input style={styles.formInput} type="text" placeholder="e.g. Sarah Johnson" />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={styles.formLabel}>Patient email address</label>
                      <input style={styles.formInput} type="email" placeholder="patient@email.com" />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={styles.formLabel}>Primary condition</label>
                      <select style={styles.formSelect}>
                        <option value="">Select condition…</option>
                        <option>Thyroid Disease (Hashimoto's, Hypothyroid, Hyperthyroid, Graves')</option>
                        <option>PCOS</option>
                        <option>Endometriosis</option>
                        <option>Perimenopause</option>
                        <option>Menopause</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={styles.formLabel}>Referring clinician (optional)</label>
                      <input style={styles.formInput} type="text" placeholder="e.g. Dr. Sarah Chen" />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={styles.formLabel}>Treating clinician email (for pre-appointment summaries)</label>
                      <input style={styles.formInput} type="email" placeholder="clinician@practice.com" />
                    </div>

                    <div style={{ padding: '14px', background: theme.tealLight, borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: theme.teal, lineHeight: '1.5' }}>
                      ℹ️ A magic link will be sent to the patient's email. They'll complete a condition-specific intake form and set their daily check-in time. The patient will appear in your panel immediately on account creation.
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={styles.primaryBtn} onClick={() => setActiveTab('panel')}>Send Invitation →</button>
                      <button style={styles.ghostBtn} onClick={() => setActiveTab('panel')}>Cancel</button>
                    </div>

                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

// --- STYLES OBJECT (Translated exactly from Mockup HTML/CSS) ---
const styles = {
  body: {
    fontFamily: "'DM Sans', sans-serif",
    background: theme.ivory,
    color: theme.charcoal,
    minHeight: '100vh',
    margin: 0,
    padding: 0
  },
  topbar: {
    background: theme.teal,
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  topbarLeft: { display: 'flex', alignItems: 'center', gap: '20px' },
  topbarLogo: { fontFamily: "'Playfair Display', serif", fontSize: '20px', color: theme.ivory, letterSpacing: '0.02em' },
  topbarLogoSpan: { fontSize: '9px', fontFamily: "'DM Sans', sans-serif", fontWeight: 300, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(247,241,232,0.55)', display: 'block', marginTop: '-2px' },
  topbarOrg: { background: 'rgba(247,241,232,0.12)', borderRadius: '6px', padding: '5px 12px', fontSize: '13px', color: theme.ivory, fontWeight: 500 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  topbarRole: { fontSize: '12px', color: 'rgba(247,241,232,0.6)' },
  topbarAvatar: { width: '34px', height: '34px', borderRadius: '50%', background: theme.ivoryDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: theme.teal, cursor: 'pointer' },

  layout: { display: 'flex', minHeight: 'calc(100vh - 64px)' },

  sidebar: {
    width: '210px',
    minWidth: '210px',
    background: theme.white,
    borderRight: `1px solid rgba(15,76,92,0.08)`,
    padding: '20px 0',
    position: 'sticky',
    top: '64px',
    height: 'calc(100vh - 64px)',
    overflowY: 'auto'
  },
  sidebarSection: { padding: '14px 18px 5px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(107,114,128,0.6)' },
  sidebarItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', fontSize: '14px', fontWeight: 500, color: theme.grey, cursor: 'pointer', borderLeft: '3px solid transparent', transition: 'all 0.15s' },
  sidebarItemActive: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s', background: theme.tealLight, color: theme.teal, borderLeft: `3px solid ${theme.teal}`, fontWeight: 600 },
  sidebarIcon: { fontSize: '15px', width: '20px', textAlign: 'center' },
  sidebarBadge: { marginLeft: 'auto', background: theme.amber, color: theme.white, borderRadius: '10px', padding: '1px 7px', fontSize: '10px', fontWeight: 700 },

  main: { flex: 1, padding: '28px 32px', maxWidth: '1000px' },

  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 600, color: theme.charcoal },
  pageSub: { fontSize: '13px', color: theme.grey, marginTop: '3px' },

  grid: { display: 'grid', gap: '16px', marginBottom: '22px' },

  card: { background: theme.white, borderRadius: theme.radius, padding: '22px', boxShadow: theme.shadowSm, border: `1px solid rgba(15,76,92,0.06)` },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: 600, color: theme.charcoal, marginBottom: '14px' },

  kpiCard: { background: theme.white, borderRadius: theme.radius, padding: '20px', boxShadow: theme.shadowSm, border: `1px solid rgba(15,76,92,0.06)`, position: 'relative', overflow: 'hidden' },
  kpiLabel: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.grey, marginBottom: '8px' },
  kpiValue: { fontFamily: "'Playfair Display', serif", fontSize: '34px', fontWeight: 400, color: theme.teal, lineHeight: 1 },
  kpiSub: { fontSize: '12px', color: theme.grey, marginTop: '6px' },

  progressWrap: { height: '6px', background: theme.ivoryDark, borderRadius: '3px', overflow: 'hidden', marginTop: '6px' },
  progressFill: { height: '100%', background: theme.teal, borderRadius: '3px' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.grey, padding: '10px 14px', textAlign: 'left', borderBottom: `2px solid ${theme.ivoryDark}`, background: theme.ivory },
  td: { padding: '14px 14px', fontSize: '13px', borderBottom: `1px solid ${theme.ivory}`, color: theme.charcoal, verticalAlign: 'middle' },
  trHover: { borderBottom: '1px solid rgba(15,76,92,0.04)', transition: 'background-color 0.15s ease' },

  streakPill: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: theme.ivoryDark, borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: theme.charcoal },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em' },

  alertItem: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 0', borderBottom: `1px solid ${theme.ivoryDark}` },
  alertIcon: { width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 },
  alertTitle: { fontSize: '13px', fontWeight: 600, color: theme.charcoal, marginBottom: '2px' },
  alertDetail: { fontSize: '12px', color: theme.grey },

  formLabel: { fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: theme.grey, display: 'block', marginBottom: '6px' },
  formInput: { width: '100%', padding: '10px 14px', border: '1px solid rgba(15,76,92,0.15)', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: theme.charcoal, background: theme.ivory, outline: 'none', boxSizing: 'border-box' },
  formSelect: { padding: '10px 14px', border: '1px solid rgba(15,76,92,0.15)', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: theme.charcoal, background: theme.ivory, outline: 'none' },

  primaryBtn: { background: theme.teal, color: theme.ivory, border: 'none', borderRadius: '8px', padding: '11px 22px', fontSize: '14px', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' },
  ghostBtn: { background: 'none', color: theme.teal, border: `1px solid ${theme.teal}`, borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }
};

export default ClinicDashboard;