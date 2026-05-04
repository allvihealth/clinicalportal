import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import Papa from 'papaparse';
import {
    Activity, Printer, FileUp, Shield, Clock, UserCheck, Info,
    Calendar, Send, X, Loader2, FlaskConical, Search, ChevronDown,
    ChevronUp, AlertTriangle, ClipboardList, FilePlus, CheckCircle2, FileText
} from 'lucide-react';
import AIInsights from './AIInsights';

// ─── LAB MARKER REGISTRY ───────────────────────────────────────────────────────

const MARKER_REGISTRY = {
    thyroid: {
        label: 'Thyroid',
        icon: '⊕',
        color: '#0F4C5C',
        accent: '#d1fae5',
        markers: {
            tsh: { label: 'TSH', unit: 'mIU/L', range: [0.4, 4.0], optimal: [0.5, 2.5], note: 'Optimal for fertility: 0.5–2.5' },
            free_t3: { label: 'Free T3', unit: 'pg/mL', range: [2.3, 4.2], optimal: [3.0, 4.2], note: null },
            free_t4: { label: 'Free T4', unit: 'ng/dL', range: [0.8, 1.8], optimal: [1.1, 1.8], note: null },
            tpo_antibodies: { label: 'TPO Antibodies', unit: 'IU/mL', range: [0, 35], optimal: [0, 15], note: "Elevated suggests Hashimoto's" },
            tgab: { label: 'TgAb', unit: 'IU/mL', range: [0, 4], optimal: [0, 2], note: null },
            tsi: { label: 'TSI', unit: '%', range: [0, 140], optimal: [0, 100], note: "Elevated suggests Graves'" },
            trab: { label: 'TRAb', unit: 'IU/L', range: [0, 1.75], optimal: [0, 1.0], note: null },
        }
    },
    metabolic: {
        label: 'Metabolic / Insulin',
        icon: '◈',
        color: '#92400e',
        accent: '#fef3c7',
        markers: {
            fasting_glucose: { label: 'Fasting Glucose', unit: 'mg/dL', range: [70, 99], optimal: [72, 90], note: 'Prediabetes: 100–125' },
            fasting_insulin: { label: 'Fasting Insulin', unit: 'µIU/mL', range: [2, 10], optimal: [2, 7], note: 'Optimal <7 for PCOS' },
            homa_ir: { label: 'HOMA-IR', unit: 'index', range: [0, 1.9], optimal: [0, 1.5], note: '>2.5 suggests insulin resistance' },
            hba1c: { label: 'HbA1c', unit: '%', range: [4.0, 5.6], optimal: [4.0, 5.3], note: 'Prediabetes: 5.7–6.4%' },
        }
    },
    pcos: {
        label: 'PCOS-Related',
        icon: '◎',
        color: '#7c3aed',
        accent: '#ede9fe',
        markers: {
            lh: { label: 'LH', unit: 'IU/L', range: [1, 12], optimal: [1, 7], note: 'Varies by cycle day' },
            fsh: { label: 'FSH', unit: 'IU/L', range: [1, 10], optimal: [3, 10], note: 'Day 3 reference: 3–10' },
            lh_fsh_ratio: { label: 'LH:FSH Ratio', unit: 'ratio', range: [0, 2], optimal: [0, 1.5], note: '>2 suggests PCOS' },
            total_testosterone: { label: 'Total Testosterone', unit: 'ng/dL', range: [15, 70], optimal: [15, 55], note: 'Female range' },
            free_testosterone: { label: 'Free Testosterone', unit: 'pg/mL', range: [0.1, 6.4], optimal: [0.1, 5.0], note: null },
            dhea_s: { label: 'DHEA-S', unit: 'µg/dL', range: [35, 430], optimal: [35, 300], note: 'Age-dependent' },
            shbg: { label: 'SHBG', unit: 'nmol/L', range: [18, 114], optimal: [40, 114], note: 'Low SHBG → more free androgens' },
            amh: { label: 'AMH', unit: 'ng/mL', range: [1.0, 3.5], optimal: [1.0, 3.5], note: 'High in PCOS (>3.5)' },
        }
    },
    fertility: {
        label: 'Fertility-Relevant',
        icon: '◉',
        color: '#be185d',
        accent: '#fce7f3',
        markers: {
            amh: { label: 'AMH', unit: 'ng/mL', range: [1.0, 3.5], optimal: [1.5, 3.5], note: 'Ovarian reserve marker' },
            afc: { label: 'AFC', unit: 'count', range: [8, 24], optimal: [10, 24], note: 'Antral follicle count via ultrasound' },
            day3_fsh: { label: 'Day 3 FSH', unit: 'IU/L', range: [3, 10], optimal: [3, 8], note: '>10 may suggest diminished reserve' },
            estradiol: { label: 'Estradiol', unit: 'pg/mL', range: [12, 166], optimal: [30, 80], note: 'Day 3: <80 pg/mL ideal' },
        }
    },
    inflammatory: {
        label: 'Inflammatory',
        icon: '◆',
        color: '#dc2626',
        accent: '#fee2e2',
        markers: {
            crp: { label: 'CRP (hs-CRP)', unit: 'mg/L', range: [0, 1.0], optimal: [0, 0.5], note: '<1 low risk; 1–3 moderate; >3 high' },
            ferritin: { label: 'Ferritin', unit: 'ng/mL', range: [12, 150], optimal: [50, 100], note: 'Optimal for women: 50–100' },
        }
    },
    general: {
        label: 'General',
        icon: '○',
        color: '#0369a1',
        accent: '#e0f2fe',
        markers: {
            vitamin_d: { label: 'Vitamin D (25-OH)', unit: 'ng/mL', range: [30, 80], optimal: [50, 70], note: 'Optimal: 50–70' },
            b12: { label: 'Vitamin B12', unit: 'pg/mL', range: [200, 900], optimal: [400, 900], note: 'Optimal: >400' },
            iron: { label: 'Iron (Serum)', unit: 'µg/dL', range: [60, 170], optimal: [80, 160], note: null },
            haemoglobin: { label: 'Haemoglobin', unit: 'g/dL', range: [12.0, 16.0], optimal: [13.0, 16.0], note: 'Female range' },
        }
    }
};

const GOAL_MARKERS = {
    fertility: ['amh', 'day3_fsh', 'lh', 'fsh', 'lh_fsh_ratio', 'estradiol', 'tsh', 'free_t3', 'free_t4'],
    pcos: ['lh', 'fsh', 'lh_fsh_ratio', 'total_testosterone', 'free_testosterone', 'dhea_s', 'shbg', 'amh', 'fasting_insulin', 'homa_ir'],
    thyroid: ['tsh', 'free_t3', 'free_t4', 'tpo_antibodies', 'tgab'],
    metabolic: ['fasting_glucose', 'fasting_insulin', 'homa_ir', 'hba1c', 'crp'],
    general: ['vitamin_d', 'b12', 'iron', 'haemoglobin', 'ferritin'],
};

// ─── TRAFFIC LIGHT SCORING ─────────────────────────────────────────────────────

function getTrafficLight(value, def) {
    if (value === undefined || value === null || value === '') return 'missing';
    const v = parseFloat(value);
    if (isNaN(v)) return 'missing';

    const [cLow, cHigh] = def.range;
    const [oLow, oHigh] = def.optimal || def.range;

    if (v < cLow || v > cHigh) return 'red';
    if (v >= oLow && v <= oHigh) return 'green';
    return 'amber';
}

const TRAFFIC_CFG = {
    green: { bg: '#dcfce7', text: '#15803d', border: '#86efac', dot: '#22c55e', label: 'OPTIMAL', emoji: '🟢' },
    amber: { bg: '#fef9c3', text: '#92400e', border: '#fde68a', dot: '#f59e0b', label: 'SUBOPTIMAL', emoji: '🟡' },
    red: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', dot: '#ef4444', label: 'OUT OF RANGE', emoji: '🔴' },
    missing: { bg: '#f1f5f9', text: '#94a3b8', border: '#e2e8f0', dot: '#cbd5e1', label: 'NOT TESTED', emoji: '⚪' },
};

function getCategoryScore(cat, labData) {
    const statuses = Object.entries(cat.markers).map(([k, def]) => getTrafficLight(labData[k], def));
    const tested = statuses.filter(s => s !== 'missing');
    if (tested.length === 0) return 'missing';
    if (tested.includes('red')) return 'red';
    if (tested.includes('amber')) return 'amber';
    return 'green';
}

// ─── FERTILITY RISK FLAG ───────────────────────────────────────────────────────

function computeFertilityRisk(labData) {
    const reasons = [];
    let riskLevel = 'LOW';

    const lhFsh = parseFloat(labData.lh_fsh_ratio);
    if (!isNaN(lhFsh) && lhFsh > 2) {
        reasons.push('Elevated LH:FSH ratio (>2) — suggests PCOS pattern');
        riskLevel = riskLevel === 'LOW' ? 'MODERATE' : 'ELEVATED';
    }

    const homaIr = parseFloat(labData.homa_ir);
    if (!isNaN(homaIr) && homaIr > 2.5) {
        reasons.push('Insulin resistance detected (HOMA-IR >2.5)');
        riskLevel = 'ELEVATED';
    }

    const tsh = parseFloat(labData.tsh);
    if (!isNaN(tsh) && (tsh < 0.5 || tsh > 2.5)) {
        reasons.push(`TSH ${tsh} mIU/L — outside fertility-optimal range (0.5–2.5)`);
        riskLevel = riskLevel === 'LOW' ? 'MODERATE' : 'ELEVATED';
    }

    const amh = parseFloat(labData.amh);
    if (!isNaN(amh) && amh < 1.0) {
        reasons.push('Low AMH (<1.0 ng/mL) — may indicate diminished ovarian reserve');
        riskLevel = 'ELEVATED';
    }

    const fsh = parseFloat(labData.day3_fsh);
    if (!isNaN(fsh) && fsh > 10) {
        reasons.push('Elevated Day 3 FSH (>10 IU/L) — potential diminished reserve');
        riskLevel = 'ELEVATED';
    }

    const tt = parseFloat(labData.total_testosterone);
    if (!isNaN(tt) && tt > 70) {
        reasons.push('Elevated total testosterone (>70 ng/dL) — androgen excess');
        riskLevel = riskLevel === 'LOW' ? 'MODERATE' : 'ELEVATED';
    }

    const vitD = parseFloat(labData.vitamin_d);
    if (!isNaN(vitD) && vitD < 20) {
        reasons.push('Severe Vitamin D deficiency (<20 ng/mL)');
        riskLevel = riskLevel === 'LOW' ? 'MODERATE' : riskLevel;
    }

    return { riskLevel, reasons };
}

const FertilityRiskBanner = ({ labData }) => {
    const { riskLevel, reasons } = computeFertilityRisk(labData);
    const [expanded, setExpanded] = useState(false);

    const cfg = {
        LOW: { bg: '#f0fdf4', border: '#86efac', accent: '#15803d', badge: '#dcfce7', badgeText: '#15803d', icon: '🟢', label: 'LOW' },
        MODERATE: { bg: '#fffbeb', border: '#fcd34d', accent: '#92400e', badge: '#fef9c3', badgeText: '#92400e', icon: '🟡', label: 'MODERATE' },
        ELEVATED: { bg: '#fff1f2', border: '#fca5a5', accent: '#991b1b', badge: '#fee2e2', badgeText: '#991b1b', icon: '🔴', label: 'ELEVATED' },
    }[riskLevel];

    return (
        <div style={{
            backgroundColor: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: '16px',
            padding: '18px 20px', marginBottom: '24px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '22px' }}>{cfg.icon}</span>
                    <div>
                        <p style={{ fontSize: '9px', fontWeight: 900, color: cfg.accent, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 3px' }}>
                            Ovulatory Risk Assessment
                        </p>
                        <p style={{ fontSize: '18px', fontWeight: 900, color: cfg.accent, margin: 0, lineHeight: 1 }}>
                            {riskLevel}
                        </p>
                    </div>
                </div>
                {reasons.length > 0 && (
                    <button
                        onClick={() => setExpanded(e => !e)}
                        style={{
                            background: 'none', border: `1px solid ${cfg.border}`,
                            borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
                            fontSize: '9px', fontWeight: 800, color: cfg.accent,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            display: 'flex', alignItems: 'center', gap: 5
                        }}
                    >
                        {reasons.length} signal{reasons.length !== 1 ? 's' : ''}
                        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                )}
            </div>

            {expanded && reasons.length > 0 && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {reasons.map((r, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 8,
                            backgroundColor: '#fff', borderRadius: '10px',
                            padding: '8px 12px', border: `1px solid ${cfg.border}`
                        }}>
                            <span style={{ color: cfg.accent, marginTop: 1, flexShrink: 0 }}>
                                <AlertTriangle size={11} />
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: cfg.accent, lineHeight: 1.5 }}>{r}</span>
                        </div>
                    ))}
                    <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, margin: '4px 0 0', fontStyle: 'italic' }}>
                        This is a pattern-based signal, not a diagnosis. Please consult your clinician.
                    </p>
                </div>
            )}
            {riskLevel === 'LOW' && (
                <p style={{ fontSize: '10px', fontWeight: 700, color: cfg.accent, margin: '10px 0 0' }}>
                    No significant fertility risk signals detected from available markers.
                </p>
            )}
        </div>
    );
};

// ─── CATEGORY SCORE SUMMARY ────────────────────────────────────────────────────

const CategoryScoreSummary = ({ labData }) => {
    return (
        <div style={{
            backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
            overflow: 'hidden', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
            <div style={{
                backgroundColor: '#0F4C5C', padding: '12px 18px',
                display: 'flex', alignItems: 'center', gap: 8
            }}>
                <Activity size={13} color="#F7F1E8" />
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#F7F1E8', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    Category Health Summary
                </span>
            </div>
            <div style={{ padding: '4px 0' }}>
                {Object.entries(MARKER_REGISTRY).map(([ck, cat]) => {
                    const score = getCategoryScore(cat, labData);
                    const cfg = TRAFFIC_CFG[score];
                    const tested = Object.entries(cat.markers).filter(([k]) =>
                        labData[k] !== undefined && labData[k] !== null && labData[k] !== ''
                    ).length;
                    const total = Object.keys(cat.markers).length;

                    return (
                        <div key={ck} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px',
                            borderBottom: '1px solid #f8fafc',
                        }}>
                            <span style={{
                                width: 28, height: 28, borderRadius: '8px', backgroundColor: cat.accent,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', color: cat.color, fontWeight: 900, flexShrink: 0
                            }}>{cat.icon}</span>
                            <span style={{ flex: 1, fontSize: '11px', fontWeight: 800, color: '#1e293b' }}>
                                {cat.label}
                            </span>
                            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, marginRight: 8 }}>
                                {tested}/{total}
                            </span>
                            <span style={{ fontSize: '14px' }}>{cfg.emoji}</span>
                            <span style={{
                                backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
                                fontSize: '9px', fontWeight: 900, letterSpacing: '0.12em',
                                padding: '3px 10px', borderRadius: '99px', minWidth: 90, textAlign: 'center'
                            }}>
                                {cfg.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── LAB ANALYSIS SUB-COMPONENTS ───────────────────────────────────────────────

function findMarkerMeta(key) {
    for (const [, cat] of Object.entries(MARKER_REGISTRY)) {
        if (cat.markers[key]) return { cat, def: cat.markers[key] };
    }
    return null;
}

const TrafficPill = ({ status }) => {
    const cfg = TRAFFIC_CFG[status] || TRAFFIC_CFG.missing;
    return (
        <span style={{
            backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
            fontSize: '9px', fontWeight: 900, letterSpacing: '0.12em', padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap',
            display: 'inline-flex', alignItems: 'center', gap: 4
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.dot, flexShrink: 0 }} />
            {cfg.label}
        </span>
    );
};

const MarkerRow = ({ markerKey, def, value, patientLabRanges }) => {
    const trafficStatus = getTrafficLight(value, def);
    const hasValue = trafficStatus !== 'missing';
    const patientRange = patientLabRanges?.[markerKey];
    const labRangeDiffers = patientRange &&
        (patientRange[0] !== def.range[0] || patientRange[1] !== def.range[1]);

    const cfg = TRAFFIC_CFG[trafficStatus];
    const isSuboptimal = trafficStatus === 'amber';
    const optRange = def.optimal;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', marginBottom: '5px',
            backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`
        }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, backgroundColor: cfg.dot }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b', display: 'block' }}>{def.label}</span>
                {isSuboptimal && optRange && (
                    <span style={{ fontSize: '8px', color: '#92400e', fontWeight: 700 }}>
                        Optimal: {optRange[0]}–{optRange[1]} {def.unit}
                    </span>
                )}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F4C5C', minWidth: 90, textAlign: 'right' }}>
                {hasValue ? `${value} ${def.unit}` : '—'}
            </span>
            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, minWidth: 100, textAlign: 'right' }}>
                {def.range[0]}–{def.range[1]} {def.unit}
            </span>
            <TrafficPill status={trafficStatus} />
            {labRangeDiffers && (
                <span title={`Your lab range: ${patientRange[0]}–${patientRange[1]} (differs from standard)`}
                    style={{ color: '#f59e0b', cursor: 'help', flexShrink: 0 }}>
                    <AlertTriangle size={12} />
                </span>
            )}
        </div>
    );
};

const MissingMarkersAlert = ({ goal, presentKeys }) => {
    const required = GOAL_MARKERS[goal] || [];
    const missing = required.filter(k => !presentKeys.includes(k));
    if (missing.length === 0) return null;
    return (
        <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={14} color="#ea580c" />
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#ea580c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Missing markers for your {goal} goal
                </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {missing.map(k => {
                    const found = findMarkerMeta(k);
                    if (!found) return null;
                    const { cat, def } = found;
                    return (
                        <span key={k} style={{
                            backgroundColor: '#fff', border: '1px solid #fed7aa', borderRadius: '99px', padding: '3px 10px',
                            fontSize: '10px', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: 4
                        }}>
                            {def.label}
                            <span style={{ color: '#cbd5e1' }}>·</span>
                            <span style={{ color: '#64748b', fontSize: '9px' }}>{cat.label}</span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

const CategorySection = ({ cat, labData, patientLabRanges }) => {
    const [open, setOpen] = useState(true);
    const entries = Object.entries(cat.markers);
    const testedCount = entries.filter(([k]) => labData[k] !== undefined && labData[k] !== null && labData[k] !== '').length;
    const score = getCategoryScore(cat, labData);
    const scoreCfg = TRAFFIC_CFG[score];

    return (
        <div style={{
            backgroundColor: '#fff', borderRadius: '14px', border: `1px solid ${scoreCfg.border}`, marginBottom: '10px', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
            <button onClick={() => setOpen(o => !o)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: open ? '1px solid #f1f5f9' : 'none'
            }}>
                <span style={{
                    width: 30, height: 30, borderRadius: '8px', backgroundColor: cat.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', flexShrink: 0, color: cat.color, fontWeight: 900
                }}>{cat.icon}</span>
                <span style={{ flex: 1, textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#1e293b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {cat.label}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', marginRight: 6 }}>
                    {testedCount}/{entries.length} tested
                </span>
                <span style={{ fontSize: '13px', marginRight: 4 }}>{scoreCfg.emoji}</span>
                <span style={{
                    backgroundColor: scoreCfg.bg, color: scoreCfg.text, border: `1px solid ${scoreCfg.border}`,
                    fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '99px', marginRight: 6, letterSpacing: '0.1em'
                }}>{scoreCfg.label}</span>
                {open ? <ChevronUp size={13} color="#94a3b8" /> : <ChevronDown size={13} color="#94a3b8" />}
            </button>
            {open && (
                <div style={{ padding: '12px 16px' }}>
                    {entries.map(([k, def]) => (
                        <MarkerRow key={k} markerKey={k} def={def} value={labData[k]} patientLabRanges={patientLabRanges} />
                    ))}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                        {entries.filter(([, d]) => d.note).map(([k, d]) => (
                            <span key={k} style={{
                                fontSize: '9px', color: '#64748b', backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0', borderRadius: '8px', padding: '3px 8px', fontWeight: 600
                            }}>
                                <strong style={{ color: '#0F4C5C' }}>{d.label}:</strong> {d.note}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const LabAnalysis = ({ labData = {}, patientGoal = 'general', patientLabRanges = {} }) => {
    const [activeGoal, setActiveGoal] = useState(patientGoal);
    const [searchQuery, setSearchQuery] = useState('');

    const presentKeys = Object.keys(labData).filter(k => labData[k] !== undefined && labData[k] !== '');

    let totalMarkers = 0, testedMarkers = 0;
    let greenCount = 0, amberCount = 0, redCount = 0;

    for (const cat of Object.values(MARKER_REGISTRY)) {
        for (const [k, def] of Object.entries(cat.markers)) {
            totalMarkers++;
            const st = getTrafficLight(labData[k], def);
            if (st !== 'missing') testedMarkers++;
            if (st === 'green') greenCount++;
            if (st === 'amber') amberCount++;
            if (st === 'red') redCount++;
        }
    }

    const filteredCategories = Object.entries(MARKER_REGISTRY).filter(([, cat]) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return cat.label.toLowerCase().includes(q) ||
            Object.values(cat.markers).some(d => d.label.toLowerCase().includes(q));
    });

    return (
        <div>
            <div className="flex items-center gap-2 mb-5">
                <FlaskConical size={16} color="#0F4C5C" />
                <h2 className="text-[11px] font-black text-[#1F2937]/40 uppercase tracking-widest">
                    Lab Marker Analysis & Normalisation
                </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                    { label: 'Total Markers', value: totalMarkers, color: '#0F4C5C', bg: '#f0fdf9', border: '#99f6e4' },
                    { label: 'Optimal', value: greenCount, color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
                    { label: 'Suboptimal', value: amberCount, color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
                    { label: 'Out of Range', value: redCount, color: redCount > 0 ? '#dc2626' : '#15803d', bg: redCount > 0 ? '#fef2f2' : '#f0fdf4', border: redCount > 0 ? '#fca5a5' : '#86efac' },
                ].map(c => (
                    <div key={c.label} style={{
                        backgroundColor: c.bg, borderRadius: '12px', padding: '12px 14px', border: `1px solid ${c.border}`
                    }}>
                        <p style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
                            {c.label}
                        </p>
                        <p style={{ fontSize: '24px', fontWeight: 900, color: c.color, margin: 0, lineHeight: 1 }}>
                            {c.value}
                        </p>
                    </div>
                ))}
            </div>

            {(patientGoal === 'fertility' || patientGoal === 'pcos') && (
                <FertilityRiskBanner labData={labData} />
            )}

            <CategoryScoreSummary labData={labData} />

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {Object.keys(GOAL_MARKERS).map(g => (
                    <button key={g} onClick={() => setActiveGoal(g)} style={{
                        padding: '5px 13px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                        fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                        backgroundColor: activeGoal === g ? '#0F4C5C' : '#f1f5f9',
                        color: activeGoal === g ? '#F7F1E8' : '#64748b',
                        transition: 'all 0.15s'
                    }}>{g}</button>
                ))}
            </div>

            <MissingMarkersAlert goal={activeGoal} presentKeys={presentKeys} />

            <div style={{
                display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: '10px',
                border: '1px solid #e2e8f0', padding: '8px 12px', marginBottom: 14
            }}>
                <Search size={12} color="#94a3b8" />
                <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search markers…"
                    style={{
                        border: 'none', background: 'none', outline: 'none', fontSize: '11px', fontWeight: 600, color: '#1e293b', width: '100%'
                    }}
                />
            </div>

            <div style={{
                display: 'flex', gap: 10, flexWrap: 'wrap', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '10px', padding: '10px 14px', marginBottom: 14
            }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 4 }}>Key:</span>
                {[
                    { emoji: '🟢', label: 'Optimal — within optimal range' },
                    { emoji: '🟡', label: 'Suboptimal — normal but not ideal' },
                    { emoji: '🔴', label: 'Out of Range — requires attention' },
                    { emoji: '⚪', label: 'Not tested' },
                ].map(item => (
                    <span key={item.label} style={{ fontSize: '9px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>{item.emoji}</span>{item.label}
                    </span>
                ))}
            </div>

            <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#f0f9ff', border: '1px solid #bae6fd',
                borderRadius: '10px', padding: '10px 14px', marginBottom: 18
            }}>
                <Info size={12} color="#0369a1" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '10px', color: '#0369a1', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                    Standard clinical reference ranges are shown. <strong>Optimal ranges</strong> are narrower, evidence-based targets (e.g., TSH 0.5–2.5 for fertility vs. clinical range 0.4–4.0).
                    Where your lab's reported range differs, a <AlertTriangle size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> flag appears.
                    Ranges may vary by age, sex, and cycle day — consult your clinician for personalised interpretation.
                </p>
            </div>

            {filteredCategories.map(([ck, cat]) => (
                <CategorySection key={ck} cat={cat} labData={labData} patientLabRanges={patientLabRanges} />
            ))}
        </div>
    );
};

// ─── INTAKE SUMMARY COMPONENT ─────────────────────────────────────────────

const IntakeSummary = ({ intake }) => {
    if (!intake || Object.keys(intake).length === 0) return null;

    return (
        <section className="print-full-width" style={{ breakInside: 'avoid', marginBottom: '32px' }}>
            <div className="flex items-center gap-2 mb-5">
                <ClipboardList size={16} color="#0F4C5C" />
                <h2 className="text-[11px] font-black text-[#1F2937]/40 uppercase tracking-widest">
                    Patient Intake Summary
                </h2>
            </div>

            <div className="bg-white p-6 rounded-xl border border-black/10 print:border-black print:border-[0.5pt] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">

                {intake.diagnoses && intake.diagnoses.length > 0 && (
                    <div>
                        <h3 className="text-[10px] font-black text-[#0F4C5C] uppercase tracking-widest mb-3">Diagnosed Conditions</h3>
                        <div className="flex flex-wrap gap-2">
                            {intake.diagnoses.map((d, i) => (
                                <span key={i} className="bg-[#e0f2fe] text-[#0369a1] px-3 py-1.5 rounded-md text-[10px] font-bold border border-[#bae6fd]">
                                    {d}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {intake.symptoms && intake.symptoms.length > 0 && (
                    <div>
                        <h3 className="text-[10px] font-black text-[#0F4C5C] uppercase tracking-widest mb-3">Current Symptoms</h3>
                        <div className="flex flex-wrap gap-2">
                            {intake.symptoms.map((s, i) => (
                                <span key={i} className="bg-[#fef3c7] text-[#92400e] px-3 py-1.5 rounded-md text-[10px] font-bold border border-[#fde68a]">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {intake.goals && (
                    <div className="md:col-span-2">
                        <h3 className="text-[10px] font-black text-[#0F4C5C] uppercase tracking-widest mb-2">Primary Goals (Next 3 Months)</h3>
                        <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 leading-relaxed">
                            {intake.goals}
                        </p>
                    </div>
                )}

                {intake.stated_concern && (
                    <div className="md:col-span-2">
                        <h3 className="text-[10px] font-black text-[#0F4C5C] uppercase tracking-widest mb-2">Main Request / Extra Notes</h3>
                        <p className="text-sm text-gray-700 bg-[#f0fdf4] p-4 rounded-lg border border-[#86efac] leading-relaxed">
                            {intake.stated_concern}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

// ─── PATIENT REVIEW VIEW COMPONENT ──────────────────────────────────────────

const PatientReviewView = ({ reviews }) => {
    if (!reviews || reviews.length === 0) return null;

    const latestReview = reviews[0];
    const date = new Date(latestReview.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Split to remove the AI summary text from the patient view
    const cleanMessage = latestReview.message_text
        ? latestReview.message_text.split('=== AI SUMMARY REFERENCE ===')[0].trim()
        : '';

    return (
        <section className="mb-8 print-full-width" style={{ breakInside: 'avoid' }}>
            <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} color="#0F4C5C" />
                <h2 className="text-[11px] font-black text-[#1F2937]/40 uppercase tracking-widest">
                    Your Specialist's Review
                </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-[#0F4C5C]/5 border border-[#0F4C5C]/20 overflow-hidden">
                <div className="bg-[#f0f9ff] border-b border-[#bae6fd] px-6 py-4 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#0F4C5C] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                            {latestReview.reviewed_by?.charAt(0) || 'S'}
                        </div>
                        <div>
                            <p className="text-sm font-black text-gray-900">{latestReview.reviewed_by || 'Specialist'}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{date}</p>
                        </div>
                    </div>

                    {latestReview.next_step && (
                        <span className="bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Next Step: {latestReview.next_step}
                        </span>
                    )}
                </div>

                <div className="p-6">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                        {cleanMessage}
                    </p>
                </div>

                {latestReview.protocol_attachment_url && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                        <FileText size={18} className="text-[#0F4C5C]" />
                        <div className="flex-1">
                            <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Protocol Attachment</p>
                        </div>
                        <a
                            href={latestReview.protocol_attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#0F4C5C] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#0a3540] transition-colors"
                        >
                            View Document
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
};

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────

const Dashboard = ({ patientId }) => {
    const navigate = useNavigate();
    const [data, setData] = useState({ labs: [], symptoms: [], specialistReviews: [] });
    const [demographics, setDemographics] = useState({ age: '—', gender: '—' });
    const [intakeData, setIntakeData] = useState(null);

    // ✅ HOOK MOVED HERE: Safely inside the component
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [sending, setSending] = useState(false);

    const dashboardRef = useRef(null);

    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000'
        : 'https://allvibackend.onrender.com';

    useEffect(() => {
        setIsMounted(true);
        fetchDashboardData();
    }, [patientId]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${baseURL}/api/patient/dashboard/${patientId}`);
            if (res.data.success) {
                setData({
                    labs: res.data.labs,
                    symptoms: res.data.symptoms,
                    specialistReviews: res.data.specialistReviews
                });
                setDemographics(res.data.profile);
                setIntakeData(res.data.intake);
            }
        } catch (err) {
            console.error("Fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAppointmentSubmit = async () => {
        setSending(true);
        try {
            await axios.post(`${baseURL}/api/patient/request-appointment`, {
                patientId, notes
            });
            alert("Your appointment request has been sent to support@allvihealth.com!");
            setIsModalOpen(false);
            setNotes('');
        } catch {
            alert("Failed to send request. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const getDynamicBiomarkers = () => {
        if (!data.labs || data.labs.length === 0) return [];
        const keys = new Set();
        data.labs.forEach(report => {
            Object.keys(report).forEach(key => {
                if (!['id', 'test_date', 'report_type', 'created_at', 'patient_id', 'meta'].includes(key)) {
                    keys.add(key);
                }
            });
        });
        return Array.from(keys);
    };

    const getMergedLabData = () => {
        // Initialize the merged object with an empty 'meta' object so it can hold the units/ranges
        const merged = { meta: {} };

        if (data.labs && data.labs.length > 0) {
            [...data.labs].reverse().forEach(report => {
                Object.entries(report).forEach(([k, v]) => {
                    // Skip the structural keys
                    if (!['id', 'test_date', 'report_type', 'created_at', 'patient_id', 'meta'].includes(k) && !(k in merged)) {
                        merged[k] = v; // Save the value (e.g., 2.5)

                        // CRITICAL FIX: Also grab the meta info (unit, ref_range) for this specific marker
                        if (report.meta && report.meta[k]) {
                            merged.meta[k] = report.meta[k];
                        }
                    }
                });
            });
        }
        return merged;
    };

    const handleDownload = () => {
        const originalTitle = document.title;
        document.title = `Allvi health_${patientId}`;
        window.print();
        document.title = originalTitle;
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("patientId", patientId);

        try {
            const response = await axios.post(`${baseURL}/api/patient/import-symptoms`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { message, newSymptoms } = response.data;

            // Update the state locally so the chart refreshes instantly
            if (newSymptoms && newSymptoms.length > 0) {
                setData(prev => ({
                    ...prev,
                    // Combine old symptoms with new ones and sort by date
                    symptoms: [...prev.symptoms, ...newSymptoms].sort((a, b) =>
                        new Date(a.date) - new Date(b.date)
                    )
                }));
            }

            alert(message || "Data imported successfully!");
        } catch (err) {
            console.error("Import failed", err);
            alert(`Upload Error: ${err.response?.data?.error || "Failed to upload file."}`);
        }
    };
    const ChartCard = ({ title, dataKey, color, data }) => {
        const latestEntry = [...data].reverse().find(entry => entry[dataKey] !== undefined);
        const meta = latestEntry?.meta?.[dataKey] || {};
        const currentValue = latestEntry?.[dataKey] || '—';

        return (
            <div className="bg-white p-6 rounded-xl border border-black/10 print:border-black print:border-[0.5pt] w-full mb-8 shadow-sm flex flex-col" style={{ breakInside: 'avoid' }}>
                <div className="flex items-center justify-between mb-8 gap-2">
                    <div className="flex items-center gap-2 flex-1">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                        <h3 className="text-[#1F2937] text-[11px] font-black uppercase tracking-widest leading-tight truncate">
                            {meta.key || title.replace(/_/g, ' ')}
                        </h3>
                    </div>
                    <div className="flex flex-col items-center justify-center flex-1 px-2 border-x border-slate-100">
                        <p className="text-[10px] font-bold text-[#0F4C5C] uppercase tracking-tighter">{meta.unit || 'Unit'}</p>
                        <p className="text-[8px] text-[#1F2937]/40 font-bold uppercase tracking-tighter whitespace-nowrap">Ref: {meta.ref_range || 'N/A'}</p>
                    </div>
                    <div className="text-right flex-1">
                        <p className="text-[10px] font-bold text-[#0F4C5C] uppercase tracking-tighter">Value: {currentValue}</p>
                    </div>
                </div>
                <div style={{ width: '100%', height: 250 }}>
                    {isMounted && (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="test_date"
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                    axisLine={{ stroke: '#f1f5f9' }}
                                    tickLine={true}
                                    label={{ value: 'Timeline', position: 'insideBottomRight', offset: -15, fontSize: 8, fontWeight: 900, fill: '#cbd5e1', textAnchor: 'end' }}
                                />
                                <YAxis
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                    axisLine={true}
                                    tickLine={true}
                                    domain={['auto', 'auto']}
                                    label={{
                                        value: meta.unit || 'Value', angle: -90, position: 'insideLeft',
                                        style: { textAnchor: 'middle', fontSize: 8, fontWeight: 900, fill: '#cbd5e1', textTransform: 'uppercase' }
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1F2937', color: '#fff', fontSize: '10px' }}
                                    itemStyle={{ color: '#F7F1E8' }}
                                    formatter={(value) => [`${value} ${meta.unit || ''}`, meta.label || title]}
                                />
                                <Line connectNulls type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} isAnimationActive={true} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F1E8]">
            <Loader2 className="animate-spin text-[#0F4C5C]" size={40} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F7F1E8] p-4 md:p-8">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4; margin: 0; }
                    body { background-color: #F7F1E8 !important; -webkit-print-color-adjust: exact; margin: 0 !important; }
                    .no-print { display: none !important; }
                    .print-only { display: flex !important; }
                    #dashboard-content {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 210mm !important;
                        padding: 15mm !important;
                        margin: 0 !important;
                        display: block !important;
                    }
                    .grid { display: block !important; }
                    .recharts-responsive-container { width: 100% !important; height: 300px !important; }
                }
            `}} />

            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 no-print">
                    <div className="flex items-center gap-4">
                        <Activity className="text-[#0F4C5C]" size={36} />
                        <div>
                            <h1 className="text-3xl font-black text-[#1F2937] tracking-tighter uppercase">ALLVI Dashboard</h1>
                            <div className="flex gap-4 text-[11px] font-bold text-[#0F4C5C] uppercase tracking-tight">
                                <span className="flex items-center gap-1"><UserCheck size={14} /> ID: {patientId}</span>
                                <span>AGE: {demographics.age}</span>
                                <span>GENDER: {demographics.gender}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <label className="bg-[#0F4C5C] text-[#F7F1E8] px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md">
                            <FileUp size={18} /> Import additional data
                            <input
                                type="file"
                                accept="., .pdf, application/pdf, text/csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                        <button onClick={handleDownload} className="bg-[#1F2937] text-[#F7F1E8] px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md">
                            <Printer size={18} /> Download Report
                        </button>
                    </div>
                </div>

                <div ref={dashboardRef} id="dashboard-content" className="space-y-8 bg-[#F7F1E8]">
                    <div className="hidden print-only flex-row justify-between items-center border-b-[1.5pt] border-black pb-4 mb-6">
                        <div className="flex items-center gap-3">
                            <Shield className="text-[#0F4C5C]" size={40} />
                            <div>
                                <h1 className="text-2xl font-black text-[#1F2937]">ALLVI HEALTH</h1>
                                <p className="text-[10px] font-bold text-[#0F4C5C] uppercase tracking-widest">Clinical Analysis Report</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-lg font-black text-[#1F2937] uppercase">BIO-ANALYSIS SUMMARY</h2>
                            <div className="text-[10px] font-bold text-[#1F2937]/50 uppercase mt-1">
                                <span>Patient: {patientId}</span> | <span>Age: {demographics.age}</span> | <span>{demographics.gender}</span>
                            </div>
                            <div className="text-[9px] font-bold text-[#1F2937]/30 uppercase">Date: {new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* ── NEW: PATIENT REVIEW VIEW ── */}
                    <PatientReviewView reviews={data.specialistReviews} />

                    <IntakeSummary intake={intakeData} />

                    <section className="print-full-width">
                        <h2 className="text-[11px] font-black text-[#1F2937]/40 uppercase tracking-widest mb-4">Biomarker Trends & Lab Ranges</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:block">
                            {getDynamicBiomarkers().map(markerKey => (
                                <ChartCard key={markerKey} title={markerKey} dataKey={markerKey} color="#0F4C5C" data={data.labs} />
                            ))}
                        </div>
                    </section>

                    <section className="print-full-width" style={{ breakInside: 'avoid' }}>
                        <div className="bg-white p-6 rounded-xl border border-black/10 print:border-black print:border-[0.5pt] shadow-sm">
                            <LabAnalysis
                                labData={getMergedLabData()}
                                patientGoal={demographics.goal || 'general'}
                                patientLabRanges={data.labRanges || {}}
                            />
                        </div>
                    </section>

                    <section className="print-full-width" style={{ breakInside: 'avoid' }}>
                        <h2 className="text-[11px] font-black text-[#1F2937]/40 uppercase tracking-widest mb-4">
                            Symptom Correlation Trends
                        </h2>
                        <div className="bg-white p-6 rounded-xl border border-black/10 shadow-sm">
                            <div style={{ width: '100%', height: 320, minHeight: 320 }}>
                                {isMounted && data.symptoms && data.symptoms.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.symptoms} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                            />
                                            <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', backgroundColor: '#1F2937', color: '#fff' }}
                                            />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />

                                            {/* Dynamic Lines for Symptoms */}
                                            <Line type="monotone" dataKey="energy" stroke="#0F4C5C" strokeWidth={2} dot={{ r: 3 }} />
                                            <Line type="monotone" dataKey="mood" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                                            <Line type="monotone" dataKey="stress" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                                            <Line type="monotone" dataKey="joint_pain" stroke="#be185d" strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <Activity size={32} className="opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No symptom data recorded</p>
                                        <p className="text-[10px]">Import a CSV or PDF to see trends</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="print-full-width">
                        <div className="bg-white p-6 rounded-xl border border-black/10 print:border-black print:border-[0.5pt] shadow-sm">
                            <AIInsights
                                patientId={patientId}
                                labData={getMergedLabData()}
                                patientGoal={demographics.goal || 'general'}
                                demographics={demographics}
                                intake={intakeData}
                            />
                        </div>

                    </section>

                    {/* ── BUTTON TO NAVIGATE TO NEW PAGE ── */}
                    <section className="no-print pt-8 flex justify-center">
                        <button
                            disabled={isGeneratingSummary}
                            onClick={async () => {
                                setIsGeneratingSummary(true);
                                try {
                                    // 1. Ask the backend to generate the AI insights based on ALL data
                                    const response = await axios.get(`${baseURL}/api/patient/insights/${patientId}`);
                                    const generatedInsights = response.data.success ? response.data.insights : "AI Analysis unavailable.";

                                    // 2. Navigate to the new page and pass the fresh insights through state
                                    navigate(`/clinical-summary/${patientId}`, {
                                        state: {
                                            profile: demographics,
                                            intake: intakeData,
                                            labData: getMergedLabData(),
                                            aiInsights: generatedInsights // <-- Replaced null with actual AI data!
                                        }
                                    });
                                } catch (err) {
                                    console.error("Failed to generate insights:", err);
                                    alert("Failed to generate AI insights. Please try again.");
                                } finally {
                                    setIsGeneratingSummary(false);
                                }
                            }}
                            className={`px-8 py-5 rounded-2xl font-black uppercase text-sm tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl w-full max-w-lg ${isGeneratingSummary
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-[#0F4C5C] text-[#F7F1E8] hover:scale-[1.02] active:scale-95'
                                }`}
                        >
                            {isGeneratingSummary ? (
                                <><Loader2 className="animate-spin" size={22} /> Analyzing Patient Data...</>
                            ) : (
                                <><FilePlus size={22} /> Generate Clinical Summary</>
                            )}
                        </button>
                    </section>

                    <section className="no-print pt-8 pb-12">
                        <div className="bg-[#0F4C5C] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-[#0F4C5C]/20 border border-white/10">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-[#F7F1E8] text-[#0F4C5C] px-8 mb-4 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shadow-xl"
                            >
                                <Calendar size={18} /> Request an Appointment
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-[#F7F1E8] text-[#0F4C5C] px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shadow-xl"
                            >
                                <Calendar size={18} /> Ask us anything
                            </button>
                        </div>
                    </section>
                </div>
            </div>

            {/* ── Appointment Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 no-print">
                    <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
                        <div className="bg-[#0F4C5C] p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Calendar size={20} />
                                <h3 className="font-black uppercase tracking-widest text-sm">Appointment Request</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                Share your notes or questions
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="E.g., I'm concerned about my thyroid levels or energy drops..."
                                className="w-full h-32 p-4 bg-[#F7F1E8]/50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#0F4C5C] transition-all text-sm font-medium resize-none text-[#1F2937]"
                            />
                            <button
                                onClick={handleAppointmentSubmit}
                                disabled={sending}
                                className="w-full mt-6 bg-[#1F2937] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#0F4C5C] transition-all disabled:opacity-50"
                            >
                                {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                {sending ? "Sending Request..." : "Submit Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;