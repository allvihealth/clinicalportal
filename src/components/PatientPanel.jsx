import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react'; // Clean spinner icon for asynchronous tracking transitions

const PatientPanel = ({
    conditionFilter,
    setConditionFilter,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    getBadgeStyle = () => ({ bg: '#FFF', text: '#000', label: '—' }),
    getPreApptBadge = () => ({ bg: '#FFF', text: '#000', label: '—' }),
    handleViewPatient = () => {},
    navigate = () => {},
    setActiveTab = () => {},
    styles = {},
    theme = {}
}) => {
    // 🚀 LIVE API SYSTEM STATES
    const [livePatients, setLivePatients] = useState([]);
    const [liveMetrics, setLiveMetrics] = useState({ totalEnrolled: 0, activeThisWeek: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🚀 FETCH PANEL METRICS DIRECTLY FROM BACKEND ROUTE HOOKS ON MOUNT
    useEffect(() => {
        const fetchPortalPanelData = async () => {
            try {
                setLoading(true);
                setError(null);

                const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://127.0.0.1:5000'
                    : import.meta.env.VITE_SERVER_URL || '';

                const token = localStorage.getItem('allvi_auth_token');

                // 🛡️ Secure GET query pulling full panel telemetry
                const res = await axios.get(`${baseURL}/api/clinical/panel-summary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.data?.success) {
                    setLivePatients(res.data.patients || []);
                    setLiveMetrics({
                        totalEnrolled: res.data.metrics?.totalEnrolled || res.data.patients?.length || 0,
                        activeThisWeek: res.data.metrics?.activeThisWeek || 0
                    });
                }
            } catch (err) {
                console.error("❌ Panel Sync Failure:", err);
                setError(err.response?.data?.error || "Failed to establish synchronization link with clinical database.");
            } finally {
                setLoading(false);
            }
        };

        fetchPortalPanelData();
    }, []);

    // 🚀 FILTER ENGINE: Computes text searches and filter selection variables dynamically over the live array
    const computedFilteredPatients = livePatients.filter(patient => {
        const matchesCondition = conditionFilter === 'All' || 
            (patient.condition && patient.condition.toLowerCase().includes(conditionFilter.toLowerCase())) ||
            (conditionFilter === 'Thyroid Disease' && String(patient.condition).toLowerCase().includes('thyroid'));
        
        const matchesStatus = statusFilter === 'All' || 
            (patient.risk && patient.risk.toLowerCase() === statusFilter.toLowerCase());
        
        const normalizedSearch = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' || 
            (patient.id && patient.id.toLowerCase().includes(normalizedSearch)) ||
            (patient.name && patient.name.toLowerCase().includes(normalizedSearch));

        return matchesCondition && matchesStatus && matchesSearch;
    });

    // LOADING STATE RENDER WHEEL
    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
                <Loader2 style={{ animate: 'spin 1s linear infinite', color: theme.teal || '#0F4C5C' }} size={32} />
                <div style={{ fontSize: '13px', color: theme.grey, fontStyle: 'italic' }}>Synchronizing comprehensive panel records from core schema data streams...</div>
            </div>
        );
    }

    // ERROR ALIGNMENT PANEL
    if (error) {
        return (
            <div style={{ padding: '16px', background: '#FDECEA', color: '#9B2226', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' }}>
                ⚠️ {error}
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.15s ease-in-out' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <div style={styles.pageTitle}>Patient Panel</div>
                    <div style={styles.pageSub}>
                        {liveMetrics.totalEnrolled} enrolled · {liveMetrics.activeThisWeek} active · 0 pending · 0 inactive
                    </div>
                </div>
                <button style={styles.primaryBtn} onClick={() => setActiveTab('enrol')}>＋ Enrol Patient</button>
            </div>

            {/* Filter Control Board */}
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

            {/* Patient Table Vector */}
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
                        {computedFilteredPatients.map(patient => {
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
                                        <div style={{ fontSize: '11px', color: theme.grey }}>Chronic Vector</div>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ fontSize: '12px', color: theme.grey }}>{patient.enrollDate || '—'}</div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.streakPill}>{patient.streak || 0} 🔥Days</span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ fontSize: '13px' }}>{patient.lastCheckin || 'No submissions'}</div>
                                        {patient.streak && parseInt(patient.streak) > 0 && <div style={{ fontSize: '11px', color: theme.green }}>✓ Active Stream</div>}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.badge, backgroundColor: badge.bg, color: badge.text }}>
                                            {badge.label || patient.risk || 'Green'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ fontSize: '12px', color: theme.grey }}>{patient.protocol || '—'}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.badge, backgroundColor: apptBadge.bg, color: apptBadge.text }}>
                                            {apptBadge.label || 'None Pending'}
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
                {computedFilteredPatients.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: theme.grey, fontSize: '13px' }}>
                        No matching patients found in database records.
                    </div>
                )}
            </div>

            {/* Growth Promo Block */}
            <div style={{ marginTop: '14px', padding: '14px 16px', background: theme.tealLight, borderRadius: '10px', border: '1px dashed rgba(15,76,92,0.2)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: theme.teal, marginBottom: '4px' }}>Ready to grow the panel?</div>
                <div style={{ fontSize: '13px', color: theme.grey }}>Enrol your next patient with a personalised magic link — takes 30 seconds.</div>
                <button style={{ ...styles.primaryBtn, marginTop: '10px', fontSize: '13px', padding: '8px 16px' }} onClick={() => setActiveTab('enrol')}>Enrol Next Patient →</button>
            </div>
        </div>
    );
};

export default PatientPanel;