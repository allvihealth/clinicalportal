import React, { useState, useEffect } from 'react';
import ClinicalPatientDashboard from './ClinicalPatientDashboard';
import EnrolPatientForm from './clinicalTabs/EnrolPatientForm';
import SymptomImprovementCard from './clinicalTabs/SymptomImprovementCard';
import PatientPanel from './PatientPanel';
import { useNavigate } from 'react-router-dom';
import { Loader2, Menu, X } from 'lucide-react'; // Added Menu and X for the dynamic drawer panel toggle
import axios from 'axios';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // 🚀 Handles sliding side menu overlay status
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Panel Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [orgName, setOrgName] = useState('NA');
  const [orgRole, setOrgRole] = useState('NA');
  const [symptoms, setSymptoms] = useState([]);

  // Executive Metrics State
  const [metrics, setMetrics] = useState({
    totalEnrolled: 0,
    activeThisWeek: 0,
    avgCompliance: '94%',
    avgQol: 7.2,
    escalationsCount: 0
  });

  // Dynamic Outcomes State
  const [outcomes, setOutcomes] = useState({
    apptsAvoided: 0,
    medAdherence: 97,
    suppAdherence: 94,
    dietCompliance: 93
  });

  // Dynamic SVG Chart State
  const [chartData, setChartData] = useState({
    energy: "0,115 40,70 80,65 120,55 160,85 200,72 240,45 280,60 320,78 360,80",
    mood: "0,112 40,45 80,48 120,52 160,92 200,100 240,28 280,62 320,98 360,74",
    sleep: "0,118 40,30 80,36 120,76 160,78 200,80 240,50 280,75 320,72 360,38",
    labels: ["W1 Feb", "W3", "W5", "W7", "W9", "W11 Apr"],
    latest: { energy: 80, mood: 74, sleep: 38 }
  });

  // --- LIFECYCLE & DATA FETCHING ---
  useEffect(() => {
    const handleResize = () => {
      const mobileStatus = window.innerWidth <= 800;
      setIsMobile(mobileStatus);
      if (!mobileStatus) setMobileMenuOpen(false); // Clean up open menus if resizing back up to wide monitors
    };
    window.addEventListener('resize', handleResize);
    const cachedUser = localStorage.getItem('allvi_user_info');
    if (cachedUser) {
      const parsedUser = JSON.parse(cachedUser);
      if (parsedUser.orgName) setOrgName(parsedUser.orgName);
      if (parsedUser.orgRole) {
        // Formats 'org_admin' or 'programme_manager' cleanly into plain words
        const formattedRole = parsedUser.orgRole.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        setOrgRole(formattedRole);
      }
    }
    fetchClinicalPortalData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchClinicalPortalData = async () => {
    try {
      setLoading(true);

      const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000'
        : import.meta.env.VITE_SERVER_URL || '';

      const token = localStorage.getItem('allvi_auth_token');

      const res = await axios.get(`${baseURL}/api/clinical/panel-summary`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.data?.success) {
        const backendPatients = res.data.patients || [];
        setPatients(backendPatients);
        setSymptoms(res.data.symptomImprovement || []);
        const total = backendPatients.length;
        const ambersAndReds = backendPatients.filter(p => p.risk === 'Amber' || p.risk === 'Red').length;
        const activeCount = res.data.metrics?.activeThisWeek || backendPatients.filter(p => parseInt(p.streak) > 0).length;

        setMetrics({
          totalEnrolled: res.data.metrics?.totalEnrolled || total,
          activeThisWeek: activeCount,
          avgCompliance: total > 0 ? '94%' : '0%',
          avgQol: total > 0 ? 7.2 : 0,
          escalationsCount: ambersAndReds
        });

        setOutcomes({
          apptsAvoided: total * 3,
          medAdherence: total > 0 ? 97 : 0,
          suppAdherence: total > 0 ? 94 : 0,
          dietCompliance: total > 0 ? 93 : 0
        });

        if (total > 0) {
          setChartData({
            energy: "0,80 72,75 144,70 216,65 288,55 360,50",
            mood: "0,90 72,82 144,75 216,70 288,62 360,58",
            sleep: "0,100 72,92 144,85 216,80 288,72 360,65",
            labels: ["Start", "W2", "W4", "W6", "W8", "Current"],
            latest: { energy: 50, mood: 58, sleep: 65 }
          });
        }
      }
    } catch (err) {
      console.error('❌ Error synchronizing Clinical Dashboard context fields:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('allvi_clinic_token');
    navigate('/clinical-login');
  };

  const handleViewPatient = (id) => {
    setSelectedPatientId(id);
    setActiveTab('patientDetail');
    setMobileMenuOpen(false); // Close overlay after routing
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
    if (status === 'Approved' || status === 'none') return { bg: theme.greenBg, text: theme.green, label: '✓ Delivered' };
    return { bg: theme.ivoryDark, text: theme.grey, label: status };
  };

  const handleEnrollSubmit = async () => {
    await fetchClinicalPortalData();
    setActiveTab('panel');
  };

  // Shared inner sidebar tracking button structure
  const renderSidebarContents = () => (
    <>
      <div style={styles.sidebarSection}>Views</div>
      <div
        style={{ ...styles.sidebarItem, ...(activeTab === 'executive' ? styles.sidebarItemActive : {}) }}
        onClick={() => { setActiveTab('executive'); setMobileMenuOpen(false); }}
      >
        <span style={styles.sidebarIcon}>📊</span> Executive
      </div>

      <div
        style={{ ...styles.sidebarItem, ...(activeTab === 'panel' ? styles.sidebarItemActive : {}) }}
        onClick={() => { setActiveTab('panel'); setMobileMenuOpen(false); }}
      >
        <span style={styles.sidebarIcon}>👥</span> Patient Panel
      </div>

      <div
        style={{ ...styles.sidebarItem, ...(activeTab === 'alerts' ? styles.sidebarItemActive : {}) }}
        onClick={() => { setActiveTab('alerts'); setMobileMenuOpen(false); }}
      >
        <span style={styles.sidebarIcon}>⚠️</span> Alerts
        {metrics.escalationsCount > 0 && <span style={styles.sidebarBadge}>{metrics.escalationsCount}</span>}
      </div>

      <div style={styles.sidebarSection}>Actions</div>
      <div
        style={{ ...styles.sidebarItem, ...(activeTab === 'enrol' ? styles.sidebarItemActive : {}) }}
        onClick={() => { setActiveTab('enrol'); setMobileMenuOpen(false); }}
      >
        <span style={styles.sidebarIcon}>＋</span> Enrol Patient
      </div>
    </>
  );

  return (
    <div style={styles.body}>

      {/* ── TOP BAR ── */}
      <div style={{ ...styles.topbar, padding: isMobile ? '0 16px' : '0 32px' }}>
        <div style={styles.topbarLeft}>
          {/* 🚀 Mobile Trigger Drawer Button Control Module */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', color: theme.ivory, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', marginRight: '4px' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          <div style={styles.topbarLogo}>
            Allvi <span style={styles.topbarLogoSpan}>Organisation Dashboard</span>
          </div>
          {!isMobile && <div style={styles.topbarOrg}>🏥 {orgName}</div>}
        </div>
        <div style={styles.topbarRight}>
          {!isMobile && <span style={styles.topbarRole}>{orgRole}</span>}
          <div style={styles.topbarAvatar} onClick={handleLogout} title="Log Out">SC</div>
        </div>
      </div>

      {/* ── LAYOUT ── */}
      <div style={styles.layout}>

        {/* ── DESKTOP SIDEBAR ── */}
        {!isMobile && (
          <aside style={styles.sidebar}>
            {renderSidebarContents()}
          </aside>
        )}

        {/* 🚀 MOBILE SLIDING DRAWER OVERLAY TRACK */}
        {isMobile && mobileMenuOpen && (
          <>
            <div
              onClick={() => setMobileMenuOpen(false)}
              style={{ position: 'fixed', top: '64px', left: 0, width: '100vw', height: 'calc(100vh - 64px)', background: 'rgba(31,41,55,0.4)', zIndex: 998, animation: 'fadeIn 0.2s ease' }}
            />
            <aside style={{ ...styles.sidebar, position: 'fixed', top: '64px', left: 0, height: 'calc(100vh - 64px)', zIndex: 999, boxShadow: '4px 0 10px rgba(0,0,0,0.1)', animation: 'slideIn 0.2s ease-out' }}>
              <div style={{ padding: '8px 18px', display: 'block', background: theme.tealLight, margin: '10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: theme.teal }}>
                🏥 Greenfield Endocrinology
              </div>
              {renderSidebarContents()}
            </aside>
          </>
        )}

        {/* ── MAIN CONTENT ── */}
        <main style={{ ...styles.main, padding: isMobile ? '16px' : '28px 32px' }}>

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
                    <div style={styles.pageSub}>{patients.organisation}· Allvi Thyroid 360</div>
                  </div>

                  {/* Top KPIs */}
                  <div style={{ ...styles.grid, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
                    <div style={{ ...styles.kpiCard, borderTop: `3px solid ${theme.teal}` }}>
                      <div style={styles.kpiLabel}>Enrolled</div>
                      <div style={styles.kpiValue}>{metrics.totalEnrolled}</div>
                      <div style={styles.kpiSub}>↑ Active</div>
                    </div>
                    <div style={{ ...styles.kpiCard, borderTop: `3px solid ${theme.green}` }}>
                      <div style={styles.kpiLabel}>Compliance</div>
                      <div style={{ ...styles.kpiValue, color: theme.green, fontSize: isMobile ? '28px' : '34px' }}>{metrics.avgCompliance}</div>
                      <div style={styles.kpiSub}>High engagement</div>
                    </div>
                    <div style={{ ...styles.kpiCard, borderTop: `3px solid ${theme.green}` }}>
                      <div style={styles.kpiLabel}>Avg QoL</div>
                      <div style={{ ...styles.kpiValue, color: theme.green }}>{metrics.avgQol}</div>
                      <div style={styles.kpiSub}>Panel avg</div>
                    </div>
                    <div style={{ ...styles.kpiCard, borderTop: `3px solid ${theme.amber}` }}>
                      <div style={styles.kpiLabel}>Active Flags</div>
                      <div style={{ ...styles.kpiValue, color: theme.amber }}>{metrics.escalationsCount}</div>
                      <div style={styles.kpiSub}>Review needed</div>
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
                      <div style={{ display: 'flex', gap: '14px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: theme.grey }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.teal }}></div>Energy</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: theme.grey }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.green }}></div>Mood</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: theme.grey }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.amber }}></div>Sleep</div>
                      </div>
                      <svg viewBox="0 0 360 140" width="100%">
                        <line x1="0" y1="115" x2="360" y2="115" stroke={theme.ivoryDark} strokeWidth="1" />
                        <line x1="0" y1="85" x2="360" y2="85" stroke={theme.ivoryDark} strokeWidth="1" />
                        <line x1="0" y1="55" x2="360" y2="55" stroke={theme.ivoryDark} strokeWidth="1" />
                        <line x1="0" y1="25" x2="360" y2="25" stroke={theme.ivoryDark} strokeWidth="1" />
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
                      <div style={{ fontSize: '12px', color: theme.grey, marginBottom: '16px' }}>{metrics.totalEnrolled || 1} patient(s) × $99 revenue basis</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '10px 12px', background: theme.ivory, borderRadius: '8px' }}>
                          <span style={{ color: theme.grey }}>Month 1</span><span style={{ fontWeight: '600' }}>${metrics.totalEnrolled * 99}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '10px 12px', background: theme.ivory, borderRadius: '8px' }}>
                          <span style={{ color: theme.grey }}>Month 2</span><span style={{ fontWeight: '600' }}>${metrics.totalEnrolled * 99}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ ...styles.grid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>

                      {/* Your revenue card element or alternative modules... 
                      <div style={styles.card}>...</div>*/}

                      {/* 🚀 YOUR CLEAN INDEPENDENT SYMPTOM CARD COMPONENT */}
                      <SymptomImprovementCard
                        symptoms={symptoms}
                        theme={theme}
                        styles={styles}
                      />

                    </div>
                  </div>
                </div>
              )}

              {/* ================= PATIENT PANEL TAB ================= */}
              {activeTab === 'panel' && (
                <PatientPanel
                  conditionFilter={conditionFilter}
                  setConditionFilter={setConditionFilter}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filteredPatients={filteredPatients}
                  getBadgeStyle={getBadgeStyle}
                  getPreApptBadge={getPreApptBadge}
                  handleViewPatient={handleViewPatient}
                  navigate={navigate}
                  setActiveTab={setActiveTab}
                  styles={styles}
                  theme={theme}
                />
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
                        <div key={p.id} style={{ ...styles.alertItem, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                            <div style={{ ...styles.alertIcon, backgroundColor: p.risk === 'Red' ? theme.redBg : theme.amberBg }}>
                              {p.risk === 'Red' ? '🚨' : '⚠️'}
                            </div>
                            <div>
                              <div style={styles.alertTitle}>{p.id} — Status: {p.risk}</div>
                              <div style={styles.alertDetail}>Automated triage flag based on recent daily logs. Review timeline logs.</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'center' : 'flex-end', justifyContent: isMobile ? 'space-between' : 'flex-start', gap: '6px', marginTop: isMobile ? '12px' : '0' }}>
                            <div style={{ fontSize: '11px', color: theme.grey }}>Recent flag</div>
                            <button style={styles.ghostBtn} onClick={() => handleViewPatient(p.id)}>View</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ================= ENROL TAB ================= */}
              {activeTab === 'enrol' && (
                <EnrolPatientForm
                  theme={theme}
                  styles={styles}
                  onCancel={() => setActiveTab('panel')}
                  onEnrollSuccess={handleEnrollSubmit}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

// --- STYLES OBJECT ---
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
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  topbarLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
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

  main: { flex: 1, maxWidth: '1000px', width: '100%', boxSizing: 'border-box' },

  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 600, color: theme.charcoal },
  pageSub: { fontSize: '13px', color: theme.grey, marginTop: '3px' },

  grid: { display: 'grid', gap: '16px', marginBottom: '22px' },

  card: { background: theme.white, borderRadius: theme.radius, padding: '22px', boxShadow: theme.shadowSm, border: `1px solid rgba(15,76,92,0.06)`, boxSizing: 'border-box' },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: 600, color: theme.charcoal, marginBottom: '14px' },

  kpiCard: { background: theme.white, borderRadius: theme.radius, padding: '16px 20px', boxShadow: theme.shadowSm, border: `1px solid rgba(15,76,92,0.06)`, position: 'relative', overflow: 'hidden', boxSizing: 'border-box' },
  kpiLabel: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.grey, marginBottom: '8px' },
  kpiValue: { fontFamily: "'Playfair Display', serif", fontSize: '34px', fontWeight: 400, color: theme.teal, lineHeight: 1 },
  kpiSub: { fontSize: '12px', color: theme.grey, marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  progressWrap: { height: '6px', background: theme.ivoryDark, borderRadius: '3px', overflow: 'hidden', marginTop: '6px' },
  progressFill: { height: '100%', background: theme.teal, borderRadius: '3px' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.grey, padding: '10px 14px', textAlign: 'left', borderBottom: `2px solid ${theme.ivoryDark}`, background: theme.ivory },
  td: { padding: '14px 14px', fontSize: '13px', borderBottom: `1px solid ${theme.ivory}`, color: theme.charcoal, verticalAlign: 'middle' },
  trHover: { borderBottom: '1px solid rgba(15,76,92,0.04)', transition: 'background-color 0.15s ease' },

  streakPill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    whiteSpace: 'nowrap',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    background: theme.ivoryDark,
    color: 'var(--charcoal)'
  },

  alertItem: { display: 'flex', gap: '12px', padding: '14px 0', borderBottom: `1px solid ${theme.ivoryDark}` },
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