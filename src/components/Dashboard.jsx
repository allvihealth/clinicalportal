import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import Papa from 'papaparse';
import {
    Activity, FileUp, Info, Calendar, Send, X, Loader2, FlaskConical, Search,
    ChevronDown, ChevronUp, AlertTriangle, ClipboardList, FilePlus, CheckCircle2,
    FileText, LayoutDashboard, CheckSquare, BarChart2, BookOpen, MessageSquare, PhoneCall, Printer, LogOut, Menu,PanelLeftOpen,PanelLeftClose
} from 'lucide-react';
import AIInsights from './AIInsights';

// ─── LAB MARKER REGISTRY ───────────────────────────────────────────────────────
const MARKER_REGISTRY = {
    thyroid: {
        label: 'Thyroid',
        icon: '⊕',
        color: '#0F4C5C',
        accent: '#E8F4F7',
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
        color: '#C97B2E',
        accent: '#FDF3E7',
        markers: {
            fasting_glucose: { label: 'Fasting Glucose', unit: 'mg/dL', range: [70, 99], optimal: [72, 90], note: 'Prediabetes: 100–125' },
            fasting_insulin: { label: 'Fasting Insulin', unit: 'µIU/mL', range: [2, 10], optimal: [2, 7], note: 'Optimal <7 for PCOS' },
            homa_ir: { label: 'HOMA-IR', unit: 'index', range: [0, 1.9], optimal: [0, 1.5], note: '>2.5 suggests insulin resistance' },
            hba1c: { label: '%', range: [4.0, 5.6], optimal: [4.0, 5.3], note: 'Prediabetes: 5.7–6.4%' },
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
        color: '#2D6A4F',
        accent: '#EAF5EE',
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
    green: { bg: '#EAF5EE', text: '#2D6A4F', border: 'rgba(45,106,79,0.15)', dot: '#2D6A4F', label: 'OPTIMAL', emoji: '🟢' },
    amber: { bg: '#FDF3E7', text: '#C97B2E', border: 'rgba(201,123,46,0.15)', dot: '#C97B2E', label: 'SUBOPTIMAL', emoji: '🟡' },
    red: { bg: '#FDECEA', text: '#9B2226', border: 'rgba(155,34,38,0.15)', dot: '#9B2226', label: 'OUT OF RANGE', emoji: '🔴' },
    missing: { bg: '#F7F1E8', text: '#6B7280', border: 'rgba(15,76,92,0.08)', dot: '#6B7280', label: 'NOT TESTED', emoji: '⚪' },
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

    return { riskLevel, reasons };
}

const FertilityRiskBanner = ({ labData }) => {
    const { riskLevel, reasons } = computeFertilityRisk(labData);
    const [expanded, setExpanded] = useState(false);

    const cfg = {
        LOW: { bg: '#EAF5EE', border: '#2D6A4F', accent: '#2D6A4F', icon: '🟢' },
        MODERATE: { bg: '#FDF3E7', border: '#C97B2E', accent: '#C97B2E', icon: '🟡' },
        ELEVATED: { bg: '#FDECEA', border: '#9B2226', accent: '#9B2226', icon: '🔴' },
    }[riskLevel];

    return (
        <div style={{
            backgroundColor: cfg.bg, borderLeft: `4px solid ${cfg.accent}`, borderRadius: '12px',
            padding: '16px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(15,76,92,0.08)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '20px' }}>{cfg.icon}</span>
                    <div>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: cfg.accent, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>
                            Ovulatory Risk Assessment
                        </p>
                        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 600, color: '#1F2937', margin: 0 }}>
                            {riskLevel} Risk Profile
                        </p>
                    </div>
                </div>
                {reasons.length > 0 && (
                    <button
                        onClick={() => setExpanded(e => !e)}
                        style={{
                            background: 'none', border: '1px solid rgba(15,76,92,0.15)',
                            borderRadius: '6px', padding: '5px 12px', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 500, color: '#6B7280',
                            display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit'
                        }}
                    >
                        {reasons.length} Signal{reasons.length !== 1 ? 's' : ''}
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                )}
            </div>

            {expanded && reasons.length > 0 && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12, borderTop: '1px solid rgba(15,76,92,0.08)' }}>
                    {reasons.map((r, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            backgroundColor: '#FFFFFF', borderRadius: '6px',
                            padding: '10px 14px', border: '1px solid rgba(15,76,92,0.06)'
                        }}>
                            <span style={{ color: cfg.accent, display: 'flex', flexShrink: 0 }}>
                                <AlertTriangle size={14} />
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937' }}>{r}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CategoryScoreSummary = ({ labData }) => {
    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#0F4C5C', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={15} color="#F7F1E8" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#F7F1E8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Category Health Summary
                </span>
            </div>
            <div style={{ padding: '8px 0' }}>
                {Object.entries(MARKER_REGISTRY).map(([ck, cat]) => {
                    const score = getCategoryScore(cat, labData);
                    const cfg = TRAFFIC_CFG[score];
                    const tested = Object.entries(cat.markers).filter(([k]) =>
                        labData[k] !== undefined && labData[k] !== null && labData[k] !== ''
                    ).length;
                    const total = Object.keys(cat.markers).length;

                    return (
                        <div key={ck} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #EDE7DB' }} className="ai">
                            <span style={{
                                width: 28, height: 28, borderRadius: '6px', backgroundColor: cat.accent,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '13px', color: cat.color, fontWeight: 600, flexShrink: 0
                            }}>{cat.icon}</span>
                            <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>{cat.label}</span>
                            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginRight: 12 }}>{tested} / {total} Tested</span>
                            <span style={{
                                backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
                                fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '4px', minWidth: 110, textAlign: 'center'
                            }}>{cfg.label}</span>
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

const MarkerRow = ({ markerKey, def, value, patientLabRanges }) => {
    const trafficStatus = getTrafficLight(value, def);
    const hasValue = trafficStatus !== 'missing';
    const patientRange = patientLabRanges?.[markerKey];
    const labRangeDiffers = patientRange && (patientRange[0] !== def.range[0] || patientRange[1] !== def.range[1]);
    const cfg = TRAFFIC_CFG[trafficStatus];

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', marginBottom: '8px', backgroundColor: '#FFFFFF', border: '1px solid #EDE7DB' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: cfg.dot }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block' }}>{def.label}</span>
                {trafficStatus === 'amber' && def.optimal && (
                    <span style={{ fontSize: '11px', color: '#C97B2E', fontStyle: 'italic' }}>Optimal Target: {def.optimal[0]}–{def.optimal[1]} {def.unit}</span>
                )}
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px', fontWeight: 600, color: '#0F4C5C', minWidth: 100, textAlign: 'right' }}>
                {hasValue ? `${value} ${def.unit}` : '—'}
            </span>
            <span style={{ fontSize: '12px', color: '#6B7280', minWidth: 110, textAlign: 'right' }}>Ref: {def.range[0]}–{def.range[1]} {def.unit}</span>
            <span style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', minWidth: 100, textAlign: 'center' }}>{cfg.label}</span>
            {labRangeDiffers && <span title="Lab Range Threshold Variance Flag" style={{ color: '#C97B2E', marginLeft: 4 }}><AlertTriangle size={14} /></span>}
        </div>
    );
};

const MissingMarkersAlert = ({ goal, presentKeys }) => {
    const required = GOAL_MARKERS[goal] || [];
    const missing = required.filter(k => !presentKeys.includes(k));
    if (missing.length === 0) return null;
    return (
        <div style={{ backgroundColor: '#FDF3E7', borderLeft: '4px solid #C97B2E', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={15} color="#C97B2E" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#C97B2E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Missing Markers For Program Goal ({goal})</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {missing.map(k => {
                    const found = findMarkerMeta(k);
                    if (!found) return null;
                    return (
                        <span key={k} className="pill" style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', backgroundColor: '#FFFFFF', color: '#1F2937' }}>
                            <strong>{found.def.label}</strong> <span style={{ color: '#6B7280' }}>({found.cat.label})</span>
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
    const scoreCfg = TRAFFIC_CFG[getCategoryScore(cat, labData)];

    return (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EDE7DB', marginBottom: '12px', overflow: 'hidden' }}>
            <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ width: 30, height: 30, borderRadius: '6px', backgroundColor: cat.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: cat.color, fontWeight: 600 }}>{cat.icon}</span>
                <span style={{ flex: 1, textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#1F2937', textTransform: 'uppercase' }}>{cat.label}</span>
                <span style={{ fontSize: '12px', color: '#6B7280', marginRight: 10 }}>{testedCount} / {entries.length} Tested</span>
                <span style={{ backgroundColor: scoreCfg.bg, color: scoreCfg.text, border: `1px solid ${scoreCfg.border}`, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', marginRight: 10 }}>{scoreCfg.label}</span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {open && (
                <div style={{ padding: '16px 20px', backgroundColor: '#F7F1E8' }}>
                    {entries.map(([k, def]) => <MarkerRow key={k} markerKey={k} def={def} value={labData[k]} patientLabRanges={patientLabRanges} />)}
                </div>
            )}
        </div>
    );
};

const LabAnalysis = ({ labData = {}, patientGoal = 'general', patientLabRanges = {} }) => {
    const [activeGoal, setActiveGoal] = useState(patientGoal);
    const [searchQuery, setSearchQuery] = useState('');
    const presentKeys = Object.keys(labData).filter(k => labData[k] !== undefined && labData[k] !== '');

    const filteredCategories = Object.entries(MARKER_REGISTRY).filter(([, cat]) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return cat.label.toLowerCase().includes(q) || Object.values(cat.markers).some(d => d.label.toLowerCase().includes(q));
    });

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '20px' }}>
                <FlaskConical size={18} color="#0F4C5C" />
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600 }}>Biomarker Integration Engine</h2>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {Object.keys(GOAL_MARKERS).map(g => (
                    <button key={g} onClick={() => setActiveGoal(g)} className={`do ${activeGoal === g ? 'on' : ''}`}>{g} Panel</button>
                ))}
            </div>

            <MissingMarkersAlert goal={activeGoal} presentKeys={presentKeys} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #EDE7DB', padding: '10px 14px', marginBottom: 16 }}>
                <Search size={14} color="#6B7280" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter active health biomarkers..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%', fontFamily: 'inherit' }} />
            </div>

            <CategoryScoreSummary labData={labData} />

            {filteredCategories.map(([ck, cat]) => <CategorySection key={ck} cat={cat} labData={labData} patientLabRanges={patientLabRanges} />)}
        </div>
    );
};

// ─── INTAKE SUMMARY COMPONENT ─────────────────────────────────────────────
const IntakeSummary = ({ intake }) => {
    if (!intake || Object.keys(intake).length === 0) return null;

    return (
        <section className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                <ClipboardList size={18} color="#0F4C5C" />
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600 }}>Intake Diagnostics</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {intake.diagnoses?.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>Diagnostic History</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {intake.diagnoses.map((d, i) => <span key={i} className="pill on">{d}</span>)}
                        </div>
                    </div>
                )}
                {intake.symptoms?.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>Reported Symptoms</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {intake.symptoms.map((s, i) => <span key={i} className="pill" style={{ backgroundColor: '#FDF3E7', color: '#C97B2E' }}>{s}</span>)}
                        </div>
                    </div>
                )}
                {intake.goals && (
                    <div>
                        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px' }}>Primary Milestones</h3>
                        <p style={{ fontSize: '13px', padding: '12px', backgroundColor: '#F7F1E8', borderRadius: '8px' }}>{intake.goals}</p>
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
    const cleanMessage = latestReview.message_text ? latestReview.message_text.split('=== AI SUMMARY REFERENCE ===')[0].trim() : '';

    return (
        <section style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
                <CheckCircle2 size={18} color="#0F4C5C" />
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600 }}>Clinical Assessment Update</h2>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#E8F4F7', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ backgroundColor: '#0F4C5C', color: '#F7F1E8', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                            {latestReview.reviewed_by?.charAt(0) || 'S'}
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>{latestReview.reviewed_by || 'Care Specialist'}</p>
                            <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>{date}</p>
                        </div>
                    </div>
                    {latestReview.next_step && <span className="at d">{latestReview.next_step}</span>}
                </div>
                <div style={{ padding: '20px', backgroundColor: '#FFFFFF' }}>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{cleanMessage}</p>
                </div>
                {latestReview.protocol_attachment_url && (
                    <div style={{ backgroundColor: '#F7F1E8', padding: '12px 20px', borderTop: '1px solid #EDE7DB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }} className="flex items-center gap-2"><FileText size={16} /> Updated Strategic Protocol Attached</span>
                        <a href={latestReview.protocol_attachment_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none' }}>View Document</a>
                    </div>
                )}
            </div>
        </section>
    );
};

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
const Dashboard = ({ patientId: propPatientId }) => {
    const { patientId: urlPatientId } = useParams();
    const activePatientId = propPatientId || urlPatientId;

    const navigate = useNavigate();
    const [data, setData] = useState({ labs: [], symptoms: [], specialistReviews: [] });
    const [demographics, setDemographics] = useState({ name: '—', age: '—', gender: '—', goal: 'general' });
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [sending, setSending] = useState(false);
    const [currentScreen, setCurrentScreen] = useState('dashboard');
    const [activeProtocolTab, setActiveProtocolTab] = useState('nut');
    const [intakeData, setIntakeData] = useState(null);
    const [checkedItems, setCheckedItems] = useState([]);
    const [streak, setStreak] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Helper to handle checklist toggles
    const toggleChecked = (item) => {
        setCheckedItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    // State mechanics for internal subjective monitoring checks
    const [checkinForm, setCheckinForm] = useState({
        energy: 8, mood: 9, sleep: 9, stress: 1,
        symptoms: [], // Array
        bm: '',       // String
        bristol: '',  // String
        diet: '',     // String
        supplements: [], // Array
        notes: ''
    });
    // Add these state variables
    const [messages, setMessages] = useState([
        { sender: 'patient', text: 'I think the iron is constipating me. Should I stop taking it?', time: 'Rashmi · Sat 25 Apr, 2:14pm' },
        { sender: 'team', text: 'Don\'t stop — this is expected in the first 1–2 weeks on 50mg. Iron draws water into the colon...', time: 'Allvi Care Team · Sat 25 Apr, 4:02pm' }
    ]);
    const [newMessage, setNewMessage] = useState('');

    const getChartData = () => {
        if (!data.symptoms || data.symptoms.length === 0) return [];

        // Map your database symptoms to Recharts-friendly objects
        return data.symptoms.map((s, index) => ({
            name: `W${index + 1}`, // Generates 'W1', 'W2', etc.
            energy: s.energy ? parseFloat(s.energy) : null,
            mood: s.mood ? parseFloat(s.mood) : null,
            sleep: s.sleep ? parseFloat(s.sleep) : null
        }));
    };

    // Add this handler

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        setMessages([...messages, {
            sender: 'patient',
            text: newMessage,
            time: `${demographics.name || 'Rashmi'} · Just now`
        }]);
        setNewMessage('');
    };

    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000'
        : import.meta.env.VITE_SERVER_URL || '';

    useEffect(() => {
        if (activePatientId) {
            fetchDashboardData();
        }
    }, [activePatientId]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${baseURL}/api/patient/dashboard/${activePatientId}`);
            if (res.data.success) {
                setData({
                    labs: res.data.labs,
                    symptoms: res.data.symptoms,
                    specialistReviews: res.data.specialistReviews
                });
                if (res.data.profile) {
                    setDemographics(res.data.profile);
                }
                setCheckinForm(prev => ({
                    ...prev,
                    energy: res.data.symptoms?.[res.data.symptoms.length - 1]?.energy ?? prev.energy,
                    mood: res.data.symptoms?.[res.data.symptoms.length - 1]?.mood ?? prev.mood,
                    sleep: res.data.symptoms?.[res.data.symptoms.length - 1]?.sleep ?? prev.sleep,
                    stress: res.data.symptoms?.[res.data.symptoms.length - 1]?.stress ?? prev.stress,
                }));
                setIntakeData(res.data.intake);
                setMessages(res.data.messages || []);
                setStreak(res.data.streak || 0);
            }
        } catch (err) {
            console.error("Dashboard fetch operational safeguard hit:", err);
        } finally {
            setLoading(false);
        }
    };


    const handleLogout = () => {
        localStorage.removeItem('token'); // or whatever your auth key is
        navigate('/login');
    };
    const handleAppointmentSubmit = async () => {
        if (!notes.trim()) return;
        setSending(true);
        try {
            await axios.post(`${baseURL}/api/patient/request-appointment`, { patientId: activePatientId, notes });
            alert("Strategic message dispatched to support@allvihealth.com!");
            setIsModalOpen(false);
            setNotes('');
        } catch {
            alert("Strategic communication relay pipeline failed.");
        } finally {
            setSending(false);
        }
    };

    const handleCheckinSubmit = async () => {
        try {
            await axios.post(`${baseURL}/api/patient/import-symptoms`, {
                patientId: activePatientId,
                symptoms: [{
                    date: new Date().toISOString().split('T')[0],
                    energy: checkinForm.energy,
                    sleep: checkinForm.sleep,
                    mood: checkinForm.mood,
                    stress: checkinForm.stress
                }]
            });
            alert("Daily Metric Log Captured Successfully!");
            await fetchDashboardData();
            setCurrentScreen('dashboard');
        } catch (err) {
            alert("Failed to save operational biometric logs.");
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
        const merged = { meta: {} };
        if (data.labs && data.labs.length > 0) {
            [...data.labs].reverse().forEach(report => {
                Object.entries(report).forEach(([k, v]) => {
                    if (!['id', 'test_date', 'report_type', 'created_at', 'patient_id', 'meta'].includes(k) && !(k in merged)) {
                        merged[k] = v;
                        if (report.meta && report.meta[k]) {
                            merged.meta[k] = report.meta[k];
                        }
                    }
                });
            });
        }
        return merged;
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const response = await axios.post(`${baseURL}/api/patient/import-symptoms`, {
                        patientId: activePatientId,
                        symptoms: results.data
                    });
                    if (response.data.success) {
                        alert("Biometric CSV records processed successfully!");
                        await fetchDashboardData();
                    }
                } catch (error) {
                    alert("Failure executing symptom import parse script.");
                }
            }
        });
    };

    const toggleItem = (field, item) => {
        setCheckinForm(prev => {
            const list = prev[field] || [];
            const newList = list.includes(item)
                ? list.filter(i => i !== item)
                : [...list, item];
            return { ...prev, [field]: newList };
        });
    };

    const setOption = (field, value) => {
        setCheckinForm(prev => ({ ...prev, [field]: value }));
    };
    const ChartCard = ({ title, dataKey, color, data: sourceData }) => {
        const latestEntry = [...sourceData].reverse().find(entry => entry[dataKey] !== undefined);
        const meta = latestEntry?.meta?.[dataKey] || {};
        const currentValue = latestEntry?.[dataKey] !== undefined ? latestEntry[dataKey] : '—';

        return (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                        <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#1F2937' }}>{meta.label || title.replace(/_/g, ' ')}</h3>
                    </div>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600, color: '#0F4C5C' }}>{currentValue}<span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '2px', fontFamily: 'sans-serif', fontWeight: 400 }}>{meta.unit || ''}</span></span>
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280', padding: '3px 8px', backgroundColor: '#EDE7DB', borderRadius: '4px', alignSelf: 'flex-start', marginBottom: '12px' }}>Ref Range: {meta.ref_range || 'N/A'}</div>
                <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sourceData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DB" vertical={false} />
                            <XAxis dataKey="test_date" tick={{ fontSize: 9, fill: '#6B7280' }} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#6B7280' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', color: '#fff', fontSize: '11px', borderRadius: '6px' }} />
                            <Line connectNulls type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const mergedLabData = getMergedLabData();

    // Compute dynamic telemetry fields for the target main metrics blocks (Dashboard & Weekly Report panels)
    const latestSymptomRow = data.symptoms && data.symptoms.length > 0
        ? data.symptoms[data.symptoms.length - 1]
        : null;

    const historicalSymptomRow = data.symptoms && data.symptoms.length > 1
        ? data.symptoms[data.symptoms.length - 2]
        : null;

    const evaluateTrend = (currentVal, pastRow, metricField) => {
        if (currentVal === undefined || currentVal === null) return "No data logged";
        if (!pastRow || pastRow[metricField] === undefined) return "→ stable snapshot";
        const delta = currentVal - pastRow[metricField];
        if (delta > 0) return `↑ up from ${pastRow[metricField]}`;
        if (delta < 0) return `↓ down from ${pastRow[metricField]}`;
        return "→ stable vs last entry";
    };

    const dynamicEnergy = latestSymptomRow?.energy !== undefined ? latestSymptomRow.energy : 7.8;
    const dynamicMood = latestSymptomRow?.mood !== undefined ? latestSymptomRow.mood : 8.4;
    const dynamicSleep = latestSymptomRow?.sleep !== undefined ? latestSymptomRow.sleep : 9.2;
    const dynamicStress = latestSymptomRow?.stress !== undefined ? latestSymptomRow.stress : 1.2;

    if (loading) {
        return (
            <div style={{ backgroundColor: '#F7F1E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F4C5C', fontWeight: 600 }}>
                    <Loader2 className="animate-spin" size={24} /> Loading care registry record telemetry...
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#F7F1E8', minHeight: '100vh' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
    .nav { background: #0F4C5C; padding: 0 32px; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
    .nav-logo { font-family: 'Playfair Display', serif; font-size: 22px; color: #F7F1E8; }
    .nav-logo span { font-size: 10px; font-family: 'DM Sans', sans-serif; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(247,241,232,0.6); display: block; margin-top: -2px; }
    .nav-right { display: flex; align-items: center; gap: 20px; }
    .nav-streak { background: rgba(247,241,232,0.12); border-radius: 20px; padding: 6px 14px; font-size: 13px; color: #F7F1E8; font-weight: 500; }
    .nav-streak strong { color: #F5C842; }
    .nav-avatar { width: 36px; height: 36px; border-radius: 50%; background: #EDE7DB; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #0F4C5C; }
    
    .layout { display: flex; min-height: calc(100vh - 64px); position: relative; }
    .sidebar { width: 220px; min-width: 220px; background: #FFFFFF; border-right: 1px solid rgba(15,76,92,0.08); padding: 24px 0; position: sticky; top: 64px; height: calc(100vh - 64px); overflow-y: auto; flex-shrink: 0; text-align: left; transition: transform 0.3s ease; z-index: 90; }
    .si-section { padding: 16px 20px 6px; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(107,114,128,0.7); }
    .si { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 14px; font-weight: 500; color: #6B7280; cursor: pointer; border-left: 3px solid transparent; transition: all 0.15s; }
    .si:hover { background: #E8F4F7; color: #0F4C5C; }
    .si.on { background: #E8F4F7; color: #0F4C5C; border-left-color: #0F4C5C; font-weight: 600; }
    .si-icon { width: 20px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
    
    .main { flex: 1; padding: 32px; max-width: 100%; text-align: left; box-sizing: border-box; }
    .card { background: #FFFFFF; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(15,76,92,0.08); border: 1px solid rgba(15,76,92,0.06); margin-bottom: 24px; }
    .ph { margin-bottom: 28px; }
    .ph-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 600; color: #1F2937; }
    .ph-sub { font-size: 14px; color: #6B7280; margin-top: 4px; }
    .g4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .kpi { background: #FFFFFF; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(15,76,92,0.08); border: 1px solid rgba(15,76,92,0.06); position: relative; overflow: hidden; }
    .kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #0F4C5C; }
    .kpi.am::before { background: #C97B2E; }
    .kpi.gr::before { background: #2D6A4F; }
    .kpi-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6B7280; margin-bottom: 8px; }
    .kpi-val { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 400; color: #0F4C5C; line-height: 1; }
    .kpi-val.am { color: #C97B2E; }
    .kpi-val.gr { color: #2D6A4F; }
    .kpi-sub { font-size: 12px; color: #6B7280; margin-top: 6px; }
    
    .cb { background: #0F4C5C; border-radius: 12px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; cursor: pointer; gap: 16px; }
    .cb h3 { font-size: 16px; font-weight: 600; color: #F7F1E8; }
    .cb p { font-size: 13px; color: rgba(247,241,232,0.7); margin-top: 2px; }
    .cb-btn { background: #F7F1E8; color: #0F4C5C; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    
    .ic { border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid; }
    .ic.gr { background: #EAF5EE; border-left-color: #2D6A4F; }
    .ic.am { background: #FDF3E7; border-left-color: #C97B2E; }
    .ic-tag { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
    .ic-tag.gr { color: #2D6A4F; }
    .ic-tag.am { color: #C97B2E; }
    .ic-title { font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 4px; }
    .ic-body { font-size: 13px; color: #6B7280; line-height: 1.5; }
    
    .pill { padding: 7px 14px; border: 1.5px solid rgba(15,76,92,0.15); border-radius: 20px; font-size: 13px; color: #1F2937; cursor: pointer; transition: all 0.15s; background: #FFFFFF; display: inline-block; }
    .pill.on { background: #0F4C5C; border-color: #0F4C5C; color: #F7F1E8; }
    .pill.none { border-style: dashed; color: #6B7280; }
    .do { padding: 8px 16px; border: 1.5px solid rgba(15,76,92,0.15); border-radius: 8px; font-size: 13px; cursor: pointer; background: #FFFFFF; color: #1F2937; transition: all 0.15s; }
    .do.on { background: #0F4C5C; border-color: #0F4C5C; color: #F7F1E8; }
    .btn-primary { background: #0F4C5C; color: #F7F1E8; border: none; border-radius: 8px; padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-ghost { background: none; color: #0F4C5C; border: 1px solid #0F4C5C; border-radius: 8px; padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .sub-btn { width: 100%; background: #0F4C5C; color: #F7F1E8; border: none; border-radius: 8px; padding: 14px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .ta { width: 100%; min-height: 80px; padding: 12px 16px; border: 1px solid rgba(15,76,92,0.15); border-radius: 8px; font-family: inherit; font-size: 14px; color: #1F2937; background: #F7F1E8; resize: vertical; outline: none; line-height: 1.5; }
    
    .sl-row { margin-bottom: 24px; }
    .sl-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .sl-name { font-size: 14px; font-weight: 500; color: #1F2937; }
    .sl-val { font-size: 16px; font-weight: 700; color: #0F4C5C; font-family: 'Playfair Display', serif; }
    .sl-range-labels { display: flex; justify-content: space-between; font-size: 10px; color: #6B7280; margin-top: 4px; }
    input[type=range] { width: 100%; height: 6px; border-radius: 3px; background: #EDE7DB; appearance: none; outline: none; cursor: pointer; }
    input[type=range]::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; background: #0F4C5C; border-radius: 50%; cursor: pointer; border: 2px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
    
    .pt-tabs { display: flex; gap: 0; border-bottom: 2px solid #EDE7DB; margin-bottom: 20px; overflow-x: auto; }
    .pt-tab { padding: 10px 18px; font-size: 13px; font-weight: 500; color: #6B7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; white-space: nowrap; transition: all 0.15s; }
    .pt-tab.on { color: #0F4C5C; border-bottom-color: #0F4C5C; font-weight: 600; }
    .pt-content { display: none; }
    .pt-content.on { display: block; }
    .pr { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid #EDE7DB; }
    .pr-icon { font-size: 18px; flex-shrink: 0; width: 28px; text-align: center; }
    .pr-title { font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 3px; }
    .pr-detail { font-size: 13px; color: #6B7280; line-height: 1.5; }
    .stab { width: 100%; border-collapse: collapse; }
    .stab th { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6B7280; padding: 8px 10px; text-align: left; border-bottom: 2px solid #EDE7DB; }
    .stab td { padding: 12px 10px; font-size: 13px; border-bottom: 1px solid #F7F1E8; vertical-align: top; }
    .cl-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #EDE7DB; }
    .cb-box { width: 18px; height: 18px; border: 2px solid #6B7280; border-radius: 4px; flex-shrink: 0; margin-top: 1px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; font-size: 11px; }
    .cb-box.done { background: #2D6A4F; border-color: #2D6A4F; color: white; }
    
    .mt { display: flex; flex-direction: column; gap: 12px; }
    .msg { max-width: 72%; }
    .msg.p { align-self: flex-end; }
    .msg.a { align-self: flex-start; }
    .mb { padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; }
    .p .mb { background: #0F4C5C; color: #F7F1E8; border-bottom-right-radius: 4px; }
    .a .mb { background: #FFFFFF; color: #1F2937; border: 1px solid rgba(15,76,92,0.1); border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(15,76,92,0.08); }
    .mm { font-size: 11px; color: #6B7280; margin-top: 4px; padding: 0 4px; }
    .p .mm { text-align: right; }
    .mir { display: flex; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #EDE7DB; }
    .mi { flex: 1; padding: 11px 16px; border: 1px solid rgba(15,76,92,0.15); border-radius: 8px; font-family: inherit; font-size: 14px; background: #F7F1E8; color: #1F2937; outline: none; }
    .ms { background: #0F4C5C; color: #F7F1E8; border: none; border-radius: 8px; padding: 11px 18px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; }

    .mobile-menu-toggle { display: none; background: none; border: none; color: #F7F1E8; cursor: pointer; padding: 4px; align-items: center; justify-content: center; }
    .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); z-index: 85; backdrop-filter: blur(2px); }

    @media (max-width: 768px) {
        .mobile-menu-toggle { display: flex; }
        .sidebar { position: fixed; left: 0; top: 64px; height: calc(100vh - 64px); transform: translateX(-100%); box-shadow: 4px 0 12px rgba(0,0,0,0.1); }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay.open { display: block; }
        .g2 { grid-template-columns: 1fr; gap: 16px; }
        .main { padding: 16px; }
        .cb { flex-direction: column; align-items: flex-start; }
        .cb-btn { width: 100%; text-align: center; }
        .nav { padding: 0 16px; }
        .nav-streak { font-size: 11px; padding: 4px 10px; }
    }
    `
            }} />

            {/* TOP BAR BRAND ENGINE NAVIGATION */}
            <nav className="nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <PanelLeftClose size={24} className="door-icon transition-close" /> : <PanelLeftOpen size={24} className="door-icon transition-open" />}
                    </button>
                    <div className="nav-logo">
                        Allvi <span>Reimagined Patient Care</span>
                    </div>
                </div>

                <div className="nav-right">
                    {/* Streak is now dynamic */}
                    <div className="nav-streak">🔥 <strong>{streak}</strong> day streak</div>

                    {/* Avatar with click-to-open menu */}
                    <div className="nav-avatar"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ cursor: 'pointer', position: 'relative' }}>
                        {demographics.name?.charAt(0) || 'U'}

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div style={{
                                position: 'absolute', top: '50px', right: '0',
                                background: '#FFFFFF', borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                color: '#1F2937', minWidth: '140px',
                                padding: '8px 0', zIndex: 1000
                            }}>
                                <div className="si" style={{ padding: '8px 16px', borderLeft: 'none' }}>Profile</div>
                                <div className="si" onClick={handleLogout} style={{ padding: '8px 16px', color: '#9B2226', borderLeft: 'none' }}>
                                    <LogOut size={16} style={{ marginRight: '8px' }} /> Logout
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="layout">
                {/* Mobile Drawer Backdrop overlay */}
                <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />

                {/* SIDEBAR NAVIGATION PANEL */}
                <aside className={`sidebar no-print ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="si-section">Overview</div>
                    <div className={`si ${currentScreen === 'dashboard' ? 'on' : ''}`} onClick={() => { setCurrentScreen('dashboard'); setIsSidebarOpen(false); }}>
                        <span className="si-icon"><LayoutDashboard size={16} /></span> Dashboard
                    </div>
                    <div className={`si ${currentScreen === 'checkin' ? 'on' : ''}`} onClick={() => { setCurrentScreen('checkin'); setIsSidebarOpen(false); }}>
                        <span className="si-icon"><CheckSquare size={16} /></span> Daily Check-In
                    </div>

                    <div className="si-section">Reports</div>
                    <div className={`si ${currentScreen === 'reports' ? 'on' : ''}`} onClick={() => { setCurrentScreen('reports'); setIsSidebarOpen(false); }}>
                        <span className="si-icon"><ClipboardList size={16} /></span> Weekly Reports
                    </div>
                    <div className={`si ${currentScreen === 'advocacy' ? 'on' : ''}`} onClick={() => { setCurrentScreen('advocacy'); setIsSidebarOpen(false); }}>
                        <span className="si-icon"><FileText size={16} /></span> Advocacy Doc
                    </div>

                    <div className="si-section">Health</div>
                    <div className={`si ${currentScreen === 'labs' ? 'on' : ''}`} onClick={() => { setCurrentScreen('labs'); setIsSidebarOpen(false); }}>
                        <span className="si-icon"><FlaskConical size={16} /></span> Lab Results
                    </div>
                    <div className={`si ${currentScreen === 'protocol' ? 'on' : ''}`} onClick={() => { setCurrentScreen('protocol'); setIsSidebarOpen(false); }}>
                        <span className="si-icon"><BookOpen size={16} /></span> My Protocol
                    </div>

                    <div className="si-section">Support</div>
                    <div className={`si ${currentScreen === 'messages' ? 'on' : ''}`} onClick={() => { setCurrentScreen('messages'); setIsSidebarOpen(false); }}>
                        <span className="si-icon"><MessageSquare size={16} /></span> Messages
                    </div>
                    <div className="si" onClick={() => { setIsModalOpen(true); setIsSidebarOpen(false); }}>
                        <span className="si-icon"><PhoneCall size={16} /></span> Book a Call
                    </div>
                    
                    <div className="si-section" style={{ marginTop: 'auto' }}>Account</div>
                    <div className="si" onClick={handleLogout}>
                        <span className="si-icon"><LogOut size={16} /></span> Logout
                    </div>
                </aside>

                {/* PRIMARY SUB-SCREEN ROUTING SYSTEM CONTROLLER */}
                <main className="main">

                    {/* ═══════════════════════ SCREEN 1: CORE DASHBOARD HUB ═══════════════════════ */}
                    {currentScreen === 'dashboard' && (
                        <>
                            <div className="ph">
                                <h1 className="ph-title">Hello, {demographics.name || 'Patient'}</h1>
                                <p className="ph-sub">Baseline Protocol Registry ID: <strong>{activePatientId}</strong> • Monitor Core Focus: <span style={{ color: '#0F4C5C', fontWeight: 600, textTransform: 'uppercase' }}>{demographics.goal || 'General Health'}</span></p>
                            </div>

                            <div className="cb" onClick={() => setCurrentScreen('checkin')}>
                                <div>
                                    <h3>Today's check-in is ready</h3>
                                    <p>Takes under 3 minutes · Personalised from yesterday's entry</p>
                                </div>
                                <button className="cb-btn">Check In Now →</button>
                            </div>

                            {/* DYNAMIC METRIC KPI CONTAINER CONNECTED TO BACKEND TELEMETRY SENSORS */}
                            <div className="g4">
                                <div className="kpi">
                                    <div className="kpi-label">Energy</div>
                                    <div className="kpi-val">{dynamicEnergy}</div>
                                    <div className="kpi-sub">{evaluateTrend(dynamicEnergy, historicalSymptomRow, 'energy')}</div>
                                </div>
                                <div className="kpi gr">
                                    <div className="kpi-label">Mood</div>
                                    <div className="kpi-val gr">{dynamicMood}</div>
                                    <div className="kpi-sub">{evaluateTrend(dynamicMood, historicalSymptomRow, 'mood')}</div>
                                </div>
                                <div className="kpi gr">
                                    <div className="kpi-label">Sleep</div>
                                    <div className="kpi-val gr">{dynamicSleep}</div>
                                    <div className="kpi-sub">{evaluateTrend(dynamicSleep, historicalSymptomRow, 'sleep')}</div>
                                </div>
                                <div className="kpi am">
                                    <div className="kpi-label">Stress</div>
                                    <div className="kpi-val am">{dynamicStress}</div>
                                    <div className="kpi-sub" style={{ color: dynamicStress <= 2 ? '#2D6A4F' : '#9B2226' }}>
                                        {dynamicStress <= 1.5 && latestSymptomRow ? "↓ programme low" : evaluateTrend(dynamicStress, historicalSymptomRow, 'stress')}
                                    </div>
                                </div>
                            </div>

                            <div className="g2">
                                {/* DYNAMIC TREND CHART */}
                                <div className="card" style={{ minWidth: 0 }}>
                                    <div className="card-title">11-Week Trend</div>

                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0F4C5C' }}></div>Energy</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2D6A4F' }}></div>Mood</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C97B2E' }}></div>Sleep</div>
                                    </div>

                                    <div style={{ width: '100%', height: 160 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            {/* We map the database data directly here without any static fallback */}
                                            <LineChart data={data.symptoms.map((s, i) => ({
                                                name: `W${i + 1}`,
                                                energy: parseFloat(s.energy),
                                                mood: parseFloat(s.mood),
                                                sleep: parseFloat(s.sleep)
                                            }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DB" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} />
                                                <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#6B7280' }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', color: '#fff', fontSize: '11px', borderRadius: '6px' }} />

                                                <Line connectNulls type="monotone" dataKey="energy" stroke="#0F4C5C" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                                                <Line connectNulls type="monotone" dataKey="mood" stroke="#2D6A4F" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                                                <Line connectNulls type="monotone" dataKey="sleep" stroke="#C97B2E" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-title">Patterns & Insights</div>
                                    <div className="ic gr"><div className="ic-tag gr">✓ Positive</div><div className="ic-title">Stress at programme low</div><div className="ic-body">1.2 — lowest in 11 weeks. Even with GI changes, your nervous system is stable.</div></div>
                                    <div className="ic am"><div className="ic-tag am">⚠ Watch</div><div className="ic-title">Evening exercise timing</div><div className="ic-body">Sat evening pickleball → Sun energy 7. Daytime sessions perform better for you.</div></div>
                                    <div className="ic am"><div className="ic-tag am">⚠ Monitor</div><div className="ic-title">GI — iron protocol Week 1</div><div className="ic-body">Expected adjustment. Increase hydration on iron days. Should resolve by Week 2.</div></div>
                                </div>
                            </div>

                            <PatientReviewView reviews={data.specialistReviews} />
                            <IntakeSummary intake={intakeData} />

                            {/* PANEL LONGITUDINAL MONITORING GRAPH PLOTS TIMELINE */}
                            <section style={{ marginBottom: '24px' }}>
                                <div style={{ borderBottom: '1px solid #EDE7DB', paddingBottom: '6px', marginBottom: '16px' }}>
                                    <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em' }}>Longitudinal Panel Tracking Timeline</h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                    {getDynamicBiomarkers().map(markerKey => (
                                        <ChartCard key={markerKey} title={markerKey} dataKey={markerKey} color="#0F4C5C" data={data.labs} />
                                    ))}
                                </div>
                            </section>

                            <section className="card">
                                <LabAnalysis labData={getMergedLabData()} patientGoal={demographics.goal || 'general'} patientLabRanges={data.labRanges} />
                            </section>

                            <section className="card">
                                <AIInsights patientId={activePatientId} labData={getMergedLabData()} patientGoal={demographics.goal || 'general'} demographics={demographics} intake={intakeData} />
                            </section>

                            <div style={{ textAlign: 'center', marginTop: '32px' }}>
                                <button
                                    disabled={isGeneratingSummary}
                                    onClick={async () => {
                                        setIsGeneratingSummary(true);
                                        try {
                                            const response = await axios.get(`${baseURL}/api/patient/insights/${activePatientId}`);
                                            navigate(`/clinical-summary/${activePatientId}`, {
                                                state: {
                                                    profile: demographics,
                                                    intake: intakeData,
                                                    labData: getMergedLabData(),
                                                    aiInsights: response.data.success ? response.data.insights : "AI Engine payload execution unfulfilled."
                                                }
                                            });
                                        } catch (err) {
                                            alert("Strategic diagnostic meta vectors calculation sequence broken.");
                                        } finally {
                                            setIsGeneratingSummary(false);
                                        }
                                    }}
                                    className="sub-btn"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, maxWidth: '340px' }}
                                >
                                    {isGeneratingSummary ? <Loader2 className="animate-spin" size={16} /> : <FilePlus size={16} />}
                                    {isGeneratingSummary ? "Compiling Meta Vectors..." : "Generate Clinical Summary"}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ═══════════════════════ SCREEN 2: DAILY CHECK-IN FORM ═══════════════════════ */}
                    {currentScreen === 'checkin' && (
                        <div className="screen on" style={{ display: 'block' }}>
                            <div className="ph">
                                <div className="ph-title">Daily Check-In</div>
                                <div className="ph-sub">Sunday, 11 May 2026 · Yesterday you mentioned constipation. How are you feeling today?</div>
                            </div>

                            {/* 1. PROTOCOL REMINDER (Added before form) */}
                            <div className="card" style={{
                                marginBottom: '24px',
                                background: '#FDF3E7',
                                border: '1px solid #C97B2E',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <div style={{ fontSize: '20px' }}>💡</div>
                                <div style={{ fontSize: '13px', color: '#9B2226', fontWeight: 600 }}>
                                    Protocol Reminder: Remember to take your iron supplement on an empty stomach with Vitamin C today.
                                </div>
                            </div>

                            <div className="card">
                                {/* 2. SLIDER METRICS */}
                                {[
                                    { label: 'Energy', field: 'energy', icon: '⚡', low: 'Low', high: 'High' },
                                    { label: 'Mood', field: 'mood', icon: '♥', low: 'Low', high: 'High' },
                                    { label: 'Sleep quality', field: 'sleep', icon: '🌙', low: 'Poor', high: 'Excellent' },
                                    { label: 'Stress', field: 'stress', icon: '🍃', low: 'None', high: 'High' }
                                ].map(s => (
                                    <div className="sl-row" key={s.field}>
                                        <div className="sl-label">
                                            <span className="sl-name">{s.icon} {s.label}</span>
                                            <span className="sl-val">{checkinForm[s.field]}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="10" value={checkinForm[s.field]}
                                            onChange={(e) => setCheckinForm({ ...checkinForm, [s.field]: e.target.value })}
                                        />
                                        <div className="sl-range-labels">
                                            <span>{s.low}</span><span>{s.high}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* 3. SYMPTOMS (MULTI-SELECT PILLS) */}
                                <div className="cs-title">Symptoms today</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                                    {['Fatigue', 'Constipation', 'Brain fog', 'Feeling cold', 'Joint pain', 'Hair loss', 'Anxiety', 'Low mood', 'Palpitations'].map(sym => (
                                        <div
                                            key={sym}
                                            className={`pill ${checkinForm.symptoms?.includes(sym) ? 'on' : ''}`}
                                            onClick={() => toggleItem('symptoms', sym)}
                                        >{sym}</div>
                                    ))}
                                </div>

                                {/* 4. BOWEL MOVEMENT (RADIO) */}
                                <div className="cs-title">Bowel movement today?</div>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                                    {['Yes', 'No'].map(val => (
                                        <div key={val} className={`do ${checkinForm.bm === val ? 'on' : ''}`}
                                            onClick={() => setOption('bm', val)}>{val}</div>
                                    ))}
                                </div>

                                {/* 5. BRISTOL STOOL SCALE (RADIO) */}
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Bristol Stool Scale</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                                    {['Type 1', 'Type 2', 'Type 3', 'Type 4', 'Type 5', 'Type 6', 'Type 7'].map(type => (
                                        <div key={type} className={`do ${checkinForm.bristol === type ? 'on' : ''}`}
                                            onClick={() => setOption('bristol', type)}>{type}</div>
                                    ))}
                                </div>

                                {/* 6. DIET COMPLIANCE (RADIO) */}
                                <div className="cs-title">Diet compliance today</div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
                                    {['Yes, fully', 'Mostly (small slip)', 'No (intentional)', 'No (accidental)'].map(opt => (
                                        <div key={opt} className={`do ${checkinForm.diet === opt ? 'on' : ''}`}
                                            onClick={() => setOption('diet', opt)}>{opt}</div>
                                    ))}
                                </div>

                                {/* 7. SUPPLEMENTS (GRID) */}
                                <div className="cs-title">Supplements taken today</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '24px' }}>
                                    {['Selenium 200mcg', 'Magnesium (eve)', 'B12 + K2', 'Omega-3', 'Iron 50mg (alt day)', 'Zinc 15mg'].map(supp => (
                                        <div
                                            key={supp}
                                            className={`pill ${checkinForm.supplements?.includes(supp) ? 'on' : ''}`}
                                            style={{ borderRadius: '8px', textAlign: 'center', padding: '10px', cursor: 'pointer' }}
                                            onClick={() => toggleItem('supplements', supp)}
                                        >
                                            {supp}
                                        </div>
                                    ))}
                                </div>

                                {/* 8. NOTES & SUBMIT */}
                                <div className="cs-title">Anything else to note?</div>
                                <textarea
                                    className="ta"
                                    value={checkinForm.notes}
                                    onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })}
                                    placeholder="How did you feel today? Any specific reactions?"
                                ></textarea>

                                <button className="sub-btn" onClick={handleCheckinSubmit}>Submit Check-In ✓</button>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════ SCREEN 3: WEEKLY REPORT SCREEN (DYNAMIC & THEME ACCURATE) ═══════════════════════ */}
                    {currentScreen === 'reports' && (
                        <div style={{ animation: 'fadeIn 0.15s ease-in-out' }}>
                            {/* PAGE HEADER */}
                            <div className="ph">
                                <h1 className="ph-title">Week 11 Report</h1>
                                <p className="ph-sub">
                                    {data.labs?.[0]?.test_date
                                        ? `Data Records Window • Profile Baseline Updated ${new Date(data.labs[0].test_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                        : "April 22–26, 2026 · Day 59–63 on Levothyroxine 25mcg"
                                    }
                                </p>
                            </div>

                            {/* HERO MOCKUP TRACKING HIGHLIGHT PANEL */}
                            <div className="rh" style={{ background: '#0F4C5C', color: '#F7F1E8', padding: '28px', borderRadius: '12px', marginBottom: '24px' }}>
                                <h2 className="rw" style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 600, color: '#F7F1E8', marginBottom: '4px' }}>Week 11</h2>
                                <p className="rm" style={{ fontSize: '13px', color: 'rgba(247,241,232,0.7)', marginBottom: '16px' }}>April 22–26, 2026 · 75 days tracked · 100% compliance · New iron protocol started</p>

                                <div className="rk" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                                    <div className="rkc" style={{ background: 'rgba(247,241,232,0.1)', borderRadius: '10px', padding: '14px', textAlign: 'center', border: 'none', boxShadow: 'none' }}>
                                        <div className="rkv" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#F7F1E8' }}>{dynamicEnergy}</div>
                                        <div className="rkl" style={{ fontSize: '11px', color: 'rgba(247,241,232,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>Energy</div>
                                        <div className="rkd" style={{ fontSize: '11px', marginTop: '4px', color: '#7BDCB5' }}>{evaluateTrend(dynamicEnergy, historicalSymptomRow, 'energy')}</div>
                                    </div>

                                    <div className="rkc" style={{ background: 'rgba(247,241,232,0.1)', borderRadius: '10px', padding: '14px', textAlign: 'center', border: 'none', boxShadow: 'none' }}>
                                        <div className="rkv" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#F7F1E8' }}>{dynamicMood}</div>
                                        <div className="rkl" style={{ fontSize: '11px', color: 'rgba(247,241,232,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>Mood</div>
                                        <div className="rkd" style={{ fontSize: '11px', marginTop: '4px', color: '#7BDCB5' }}>{evaluateTrend(dynamicMood, historicalSymptomRow, 'mood')}</div>
                                    </div>

                                    <div className="rkc" style={{ background: 'rgba(247,241,232,0.1)', borderRadius: '10px', padding: '14px', textAlign: 'center', border: 'none', boxShadow: 'none' }}>
                                        <div className="rkv" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#F7F1E8' }}>{dynamicSleep}</div>
                                        <div className="rkl" style={{ fontSize: '11px', color: 'rgba(247,241,232,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>Sleep</div>
                                        <div className="rkd" style={{ fontSize: '11px', marginTop: '4px', color: '#7BDCB5' }}>{evaluateTrend(dynamicSleep, historicalSymptomRow, 'sleep')}</div>
                                    </div>

                                    <div className="rkc" style={{ background: 'rgba(247,241,232,0.1)', borderRadius: '10px', padding: '14px', textAlign: 'center', border: 'none', boxShadow: 'none' }}>
                                        <div className="rkv" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#F7F1E8' }}>{dynamicStress}</div>
                                        <div className="rkl" style={{ fontSize: '11px', color: 'rgba(247,241,232,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>Stress</div>
                                        <div className="rkd" style={{ fontSize: '11px', marginTop: '4px', color: '#7BDCB5' }}>
                                            {dynamicStress <= 1.5 && latestSymptomRow ? "↓ prog. low" : evaluateTrend(dynamicStress, historicalSymptomRow, 'stress')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CLINICAL MONITORING DETAILS TRACE */}
                            <div className="card" style={{ marginBottom: '20px', background: '#FFFFFF', padding: '24px', borderRadius: '12px' }}>
                                <div className="card-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Clinical Monitoring</div>

                                <div className="dr" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                                    <div className="ds gr" style={{ background: '#EAF5EE', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🟢</div>
                                    <div>
                                        <div className="dn" style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                                            Medication Response — Levothyroxine 25mcg
                                            <span className="dbadge gr" style={{ background: '#EAF5EE', color: '#2D6A4F', display: 'inline-block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>Green</span>
                                        </div>
                                        <div className="dd" style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
                                            TSH {mergedLabData?.tsh !== undefined ? mergedLabData.tsh : '2.13'} in healthy range. Sweating fully resolved. Zero palpitations across 63 days. Continue 25mcg — no action needed.
                                        </div>
                                    </div>
                                </div>

                                <div className="dr" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                                    <div className="ds am" style={{ background: '#FDF3E7', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🟡</div>
                                    <div>
                                        <div className="dn" style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                                            Iron & Ferritin
                                            <span className="dbadge am" style={{ background: '#FDF3E7', color: '#C97B2E', display: 'inline-block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>Amber — Adjusting</span>
                                        </div>
                                        <div className="dd" style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
                                            New protocol: 50mg ferrous bisglycinate every other day. Current storage levels evaluate at {mergedLabData?.ferritin !== undefined ? `${mergedLabData.ferritin} ng/mL` : '19 ng/mL'}. GI side effects expected weeks 1–2. Recheck ferritin 6–8 weeks from protocol start.
                                        </div>
                                    </div>
                                </div>

                                <div className="dr" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                                    <div className="ds am" style={{ background: '#FDF3E7', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🟡</div>
                                    <div>
                                        <div className="dn" style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                                            Gut Function
                                            <span className="dbadge am" style={{ background: '#FDF3E7', color: '#C97B2E', display: 'inline-block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>Amber — Monitor</span>
                                        </div>
                                        <div className="dd" style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
                                            3/5 BMs this week — Types 3, 4, 2. Iron protocol the likely driver. Increase hydration on iron days.
                                        </div>
                                    </div>
                                </div>

                                <div className="dr" style={{ display: 'flex', gap: '16px' }}>
                                    <div className="ds gr" style={{ background: '#EAF5EE', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🟢</div>
                                    <div>
                                        <div className="dn" style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                                            Mood & Mental Health
                                            <span className="dbadge gr" style={{ background: '#EAF5EE', color: '#2D6A4F', display: 'inline-block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>Green</span>
                                        </div>
                                        <div className="dd" style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
                                            Mood avg {dynamicMood}. Wed dip (6/10) — one day, no pattern. Stress {dynamicStress} — programme low. Continue therapy fortnightly.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COMPLIANCE INSIGHTS BLOCKS */}
                            <div className="card" style={{ marginBottom: '20px' }}>
                                <div className="card-title">Week 11 Patterns</div>

                                <div className="ic gr" style={{ background: '#EAF5EE', borderLeft: '4px solid #2D6A4F', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                                    <div className="ic-tag gr" style={{ fontSize: '10px', fontWeight: 700, color: '#2D6A4F', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>✓ Milestone</div>
                                    <div className="ic-title" style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>Stress {dynamicStress} — lowest in 11 weeks</div>
                                    <div className="ic-body" style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>Even with a new medication protocol and GI changes, your stress stayed at near-zero all week.</div>
                                </div>

                                <div className="ic am" style={{ background: '#FDF3E7', borderLeft: '4px solid #C97B2E', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                                    <div className="ic-tag am" style={{ fontSize: '10px', fontWeight: 700, color: '#C97B2E', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>⚠ Watch</div>
                                    <div className="ic-title" style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>Post-workout rule — nuance emerging</div>
                                    <div className="ic-body" style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>Thu pickleball (afternoon) → Fri energy 8. Sat pickleball (evening) → Sun energy 7. Evening sessions may cost more.</div>
                                </div>

                                <div className="ic gr" style={{ background: '#EAF5EE', borderLeft: '4px solid #2D6A4F', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                                    <div className="ic-tag gr" style={{ fontSize: '10px', fontWeight: 700, color: '#2D6A4F', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>✓ Positive</div>
                                    <div className="ic-title" style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>100% diet compliance — first zero-slip week</div>
                                    <div className="ic-body" style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>Zero slips, zero deviations. After 75 days, this protocol has become habitual.</div>
                                </div>
                            </div>

                            {/* ACTION OBJECTIVES TIMELINE */}
                            <div className="card" style={{ marginBottom: '16px' }}>
                                <div className="card-title">What's Next</div>

                                <div className="ai" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 0', borderBottom: '1px solid #EDE7DB' }}>
                                    <div><div className="at w" style={{ background: '#FDF3E7', color: '#C97B2E', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap', marginTop: '2px' }}>Watch</div></div>
                                    <div className="at-text" style={{ fontSize: '13px', color: '#1F2937', lineHeight: 1.5 }}>GI symptoms from iron — should ease by Week 2. Flag to endo if constipation persists or worsens after 2 weeks.</div>
                                </div>

                                <div className="ai" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 0', borderBottom: '1px solid #EDE7DB' }}>
                                    <div><div className="at o" style={{ background: '#E8F4F7', color: '#0F4C5C', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap', marginTop: '2px' }}>Ongoing</div></div>
                                    <div className="at-text" style={{ fontSize: '13px', color: '#1F2937', lineHeight: 1.5 }}><strong>Iron protocol:</strong> 50mg ferrous bisglycinate every other day, empty stomach + Vitamin C. Avoid coffee/tea/calcium within 1hr.</div>
                                </div>

                                <div className="ai" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 0', borderBottom: 'none' }}>
                                    <div><div className="at d" style={{ background: '#EAF5EE', color: '#2D6A4F', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap', marginTop: '2px' }}>May</div></div>
                                    <div className="at-text" style={{ fontSize: '13px', color: '#1F2937', lineHeight: 1.5 }}><strong>Ferritin recheck + TPO antibodies</strong> — 3-month mark. First picture of whether the new protocol is working.</div>
                                </div>
                            </div>

                            <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: '1.6', padding: '12px', background: '#EDE7DB', borderRadius: '8px' }}>
                                This report is for informational support only and does not constitute medical advice, a diagnosis, or a prescription. Allvi accepts no clinical liability for decisions made based on this report.
                            </div>
                        </div>
                    )}
                    {/* ═══════════════════════ SCREEN 4: ADVOCACY DOC SCREEN ═══════════════════════ */}
                    {currentScreen === 'advocacy' && (
                        <div style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
                            {/* PAGE HEADER LAYER */}
                            <div className="ph" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <div className="ph-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 600, color: '#1F2937' }}>
                                        Appointment Advocacy Document
                                    </div>
                                    <div className="ph-sub" style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                                        Prepared for Endocrinologist Consultation · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '4px 12px', background: '#EAF5EE', borderRadius: '20px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#2D6A4F', letterSpacing: '0.1em' }}>✓ CLINICIAN APPROVED</span>
                                    </div>
                                </div>
                                <button className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0F4C5C', color: '#F7F1E8', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} onClick={() => window.print()}>
                                    <Printer size={14} /> Download PDF
                                </button>
                            </div>

                            {/* CONTAINER CARD CONTAINER BACKGROUND */}
                            <div className="card" style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(15,76,92,0.08)', border: '1px solid rgba(15,76,92,0.06)', marginTop: '24px' }}>

                                {/* 1. PATIENT CONTEXT FRAME PANEL */}
                                <div style={{ marginBottom: '28px' }}>
                                    <div className="avs-title" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F4C5C', borderBottom: '1px solid #E8F4F7', paddingBottom: '6px', marginBottom: '12px' }}>
                                        Patient Context
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="avt" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ padding: '10px 4px', fontSize: '13px', borderBottom: '1px solid #EDE7DB', verticalAlign: 'top', fontWeight: 600, color: '#6B7280', width: '38%' }}>Identity Profile</td>
                                                    <td style={{ padding: '10px 4px', fontSize: '13px', borderBottom: '1px solid #EDE7DB', verticalAlign: 'top', color: '#1F2937' }}>
                                                        {demographics.name || 'Rashmi'} ({demographics.age ? `Age: ${demographics.age}` : '—'} · {demographics.gender || '—'})
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '10px 4px', fontSize: '13px', borderBottom: '1px solid #EDE7DB', verticalAlign: 'top', fontWeight: 600, color: '#6B7280' }}>Diagnosis Profile</td>
                                                    <td style={{ padding: '10px 4px', fontSize: '13px', borderBottom: '1px solid #EDE7DB', verticalAlign: 'top', color: '#1F2937' }}>
                                                        {intakeData?.diagnoses?.length > 0 ? intakeData.diagnoses.join(', ') : "Hashimoto's Thyroiditis — January 2026"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '10px 4px', fontSize: '13px', borderBottom: '1px solid #EDE7DB', verticalAlign: 'top', fontWeight: 600, color: '#6B7280' }}>Medication Track</td>
                                                    <td style={{ padding: '10px 4px', fontSize: '13px', borderBottom: '1px solid #EDE7DB', verticalAlign: 'top', color: '#1F2937' }}>
                                                        Levothyroxine 25mcg daily (taken 6am). Day 77 on profile timeline records.
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '10px 4px', fontSize: '13px', borderBottom: 'none', verticalAlign: 'top', fontWeight: 600, color: '#6B7280' }}>Program Focus Goal</td>
                                                    <td style={{ padding: '10px 4px', fontSize: '13px', borderBottom: 'none', verticalAlign: 'top', textTransform: 'uppercase', fontWeight: 600, color: '#0F4C5C' }}>
                                                        {demographics.goal || 'thyroid'} focus
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* 2. RESTORED & POLISHED LABORATORY TRAJECTORY SECTION PANEL */}
                                <div style={{ marginBottom: '28px' }}>
                                    <div className="avs-title" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F4C5C', borderBottom: '1px solid #E8F4F7', paddingBottom: '6px', marginBottom: '12px' }}>
                                        Laboratory Trajectory
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="lt" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7280', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #EDE7DB' }}>Test Vector</th>
                                                    {data.labs?.length > 0 ? (
                                                        [...data.labs]
                                                            .sort((a, b) => new Date(a.test_date) - new Date(b.test_date))
                                                            .slice(-3)
                                                            .map((report, idx) => (
                                                                <th key={report.id || idx} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7280', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #EDE7DB' }}>
                                                                    {report.test_date ? new Date(report.test_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Record ${idx + 1}`}
                                                                </th>
                                                            ))
                                                    ) : (
                                                        <>
                                                            <th style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7280', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #EDE7DB' }}>Jan 2026</th>
                                                            <th style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7280', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #EDE7DB' }}>Mar 11</th>
                                                            <th style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7280', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #EDE7DB' }}>Apr 14</th>
                                                        </>
                                                    )}
                                                    <th style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7280', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #EDE7DB' }}>Reference</th>
                                                    <th style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7280', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #EDE7DB' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {['tsh', 'free_t4', 'free_t3', 'ferritin'].map(key => {
                                                    let markerMeta = null;
                                                    for (const [, cat] of Object.entries(MARKER_REGISTRY)) {
                                                        if (cat.markers[key]) {
                                                            markerMeta = cat.markers[key];
                                                            break;
                                                        }
                                                    }
                                                    if (!markerMeta) return null;

                                                    const latestValue = mergedLabData[key];
                                                    const trafficStatus = getTrafficLight(latestValue, markerMeta);
                                                    const trafficCfg = TRAFFIC_CFG[trafficStatus] || TRAFFIC_CFG.missing;

                                                    // Hardcoded structural defaults used as safe fallbacks
                                                    const staticFallbacks = {
                                                        tsh: ['4.48', '—', '2.13'],
                                                        free_t4: ['1.01', '1.0', '1.1'],
                                                        free_t3: ['—', '2.5', '2.6'],
                                                        ferritin: ['24', '—', '19']
                                                    };

                                                    return (
                                                        <tr key={key}>
                                                            <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #F7F1E8', color: '#1F2937', fontWeight: 600 }}>{markerMeta.label}</td>
                                                            {data.labs?.length > 0 ? (
                                                                [...data.labs]
                                                                    .sort((a, b) => new Date(a.test_date) - new Date(b.test_date))
                                                                    .slice(-3)
                                                                    .map((report, idx) => (
                                                                        <td key={report.id || idx} style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #F7F1E8', color: '#1F2937' }}>
                                                                            {report[key] !== undefined && report[key] !== null && report[key] !== '' ? `${report[key]} ${key !== 'tsh' ? markerMeta.unit : ''}`.trim() : '—'}
                                                                        </td>
                                                                    ))
                                                            ) : (
                                                                staticFallbacks[key]?.map((fbVal, i) => (
                                                                    <td key={i} style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #F7F1E8', color: '#1F2937' }}>{fbVal}</td>
                                                                )) || (
                                                                    <>
                                                                        <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #F7F1E8', color: '#1F2937' }}>{"—"}</td>
                                                                        <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #F7F1E8', color: '#1F2937' }}>{"—"}</td>
                                                                        <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #F7F1E8', color: '#1F2937' }}>{"—"}</td>
                                                                    </>
                                                                )
                                                            )}
                                                            <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #F7F1E8', color: '#6B7280' }}>
                                                                {key === 'ferritin' ? 'Optimal 70–90*' : `${markerMeta.range[0]}–${markerMeta.range[1]} ${markerMeta.unit}`}
                                                            </td>
                                                            <td style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid #F7F1E8' }}>
                                                                <span className="lb" style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, backgroundColor: trafficCfg.bg, color: trafficCfg.text }}>
                                                                    {trafficStatus === 'green' ? '✓ In Range' : trafficStatus === 'amber' ? '⚠ Low-normal' : trafficStatus === 'red' ? '⚠ Out of Range' : '⚪ Not Tested'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px', fontStyle: 'italic' }}>* Functional optimal range for Hashimoto's/levothyroxine patients: 70–90 ng/mL</div>
                                </div>

                                {/* 3. PROVIDER CONSULTATION INQUIRIES LIST */}
                                <div>
                                    <div className="avs-title" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F4C5C', borderBottom: '1px solid #E8F4F7', paddingBottom: '6px', marginBottom: '12px' }}>
                                        Questions for This Consultation
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div className="qn" style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #EDE7DB' }}>
                                            <div className="qn-num" style={{ width: '24px', height: '24px', background: '#0F4C5C', color: '#F7F1E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>1</div>
                                            <div className="qn-text" style={{ fontSize: '13px', color: '#1F2937', lineHeight: '1.5' }}>
                                                <strong>Iron supplementation:</strong> Is the current dosing protocol tracking as intended? Ferritin levels sit suboptimal at <span style={{ fontWeight: 700, color: '#C97B2E' }}>{mergedLabData?.ferritin !== undefined ? `${mergedLabData.ferritin} ng/mL` : '19 ng/mL'}</span>, demonstrating incorrect trajectory down from baseline records.
                                            </div>
                                        </div>

                                        <div className="qn" style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #EDE7DB' }}>
                                            <div className="qn-num" style={{ width: '24px', height: '24px', background: '#0F4C5C', color: '#F7F1E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>2</div>
                                            <div className="qn-text" style={{ fontSize: '13px', color: '#1F2937', lineHeight: '1.5' }}>
                                                <strong>Should ferritin be rechecked sooner than May?</strong> Ferritin metrics are moving inverse to programmatic ingestion pathways.
                                            </div>
                                        </div>

                                        <div className="qn" style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #EDE7DB' }}>
                                            <div className="qn-num" style={{ width: '24px', height: '24px', background: '#0F4C5C', color: '#F7F1E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>3</div>
                                            <div className="qn-text" style={{ fontSize: '13px', color: '#1F2937', lineHeight: '1.5' }}>
                                                <strong>Levothyroxine dose optimization boundaries:</strong> Does the current synchronized profile calculation value of <span style={{ fontWeight: 700, color: '#2D6A4F' }}>TSH ({mergedLabData?.tsh !== undefined ? `${mergedLabData.tsh} mIU/L` : '2.13 mIU/L'})</span> justify keeping the current 25mcg self-titrated pathway?
                                            </div>
                                        </div>

                                        <div className="qn" style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: 'none' }}>
                                            <div className="qn-num" style={{ width: '24px', height: '24px', background: '#0F4C5C', color: '#F7F1E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>4</div>
                                            <div className="qn-text" style={{ fontSize: '13px', color: '#1F2937', lineHeight: '1.5' }}>
                                                <strong>Subjective parameter correlations:</strong> Cross-evaluating clinical records threshold patterns. Current active live telemetry snapshot tracks an average continuous daily stress margin value index score of <strong>{dynamicStress} / 10</strong>.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}


                    {/* ═══════════════════════ SCREEN 5: MY PROTOCOL SCREEN ═══════════════════════ */}
                    {currentScreen === 'protocol' && (
                        <>
                            <div className="ph" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <div className="ph-title">My Protocol</div>
                                    <div className="ph-sub">Personalised Lifestyle Support · Hashimoto's · Delivered Week 2 · Updated May 2026</div>
                                </div>
                                <button className="btn-primary">⬇ Download PDF</button>
                            </div>

                            {/* SUMMARY CARD */}
                            <div className="card" style={{ background: '#0F4C5C', border: 'none', color: '#F7F1E8', marginBottom: '22px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div><div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(247,241,232,0.6)', marginBottom: '6px' }}>Diagnosis</div><div style={{ fontSize: '14px', fontWeight: 600 }}>Hashimoto's Thyroiditis</div><div style={{ fontSize: '12px', color: 'rgba(247,241,232,0.7)', marginTop: '2px' }}>Diagnosed Jan 2026</div></div>
                                    <div><div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(247,241,232,0.6)', marginBottom: '6px' }}>Top Symptoms at Start</div><div style={{ fontSize: '13px', color: '#F7F1E8' }}>Constipation · Mood · Cold intolerance</div></div>
                                    <div><div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(247,241,232,0.6)', marginBottom: '6px' }}>Primary Goals</div><div style={{ fontSize: '13px', color: '#F7F1E8' }}>Improve GI · Slow autoimmune attack</div></div>
                                </div>
                            </div>

                            <div className="card">
                                {/* TABS */}
                                <div className="pt-tabs">
                                    {['nut', 'sup', 'exc', 'slp', 'str', 'chk'].map(tab => (
                                        <div key={tab} className={`pt-tab ${activeProtocolTab === tab ? 'on' : ''}`} onClick={() => setActiveProtocolTab(tab)}>
                                            {tab === 'nut' ? '🥗 Nutrition' : tab === 'sup' ? '💊 Supplements' : tab === 'exc' ? '🏃 Exercise' : tab === 'slp' ? '🌙 Sleep' : tab === 'str' ? '🍃 Stress' : '✅ Action Plan'}
                                        </div>
                                    ))}
                                </div>

                                {/* CONTENT AREAS */}
                                {activeProtocolTab === 'nut' && (
                                    <div className="pt-content on">
                                        <p style={{ fontSize: '13px', color: '#6B7280', padding: '4px 0 16px' }}>93% compliance over 75 days — this is now a habit, not a restriction.</p>
                                        <div className="pr"><div className="pr-icon">🚫</div><div><div className="pr-title">Always avoid: Gluten, dairy, soy, refined sugar</div><div className="pr-detail">Gluten triggers molecular mimicry with thyroid tissue. Your dramatic improvement confirms these were key triggers.</div></div></div>
                                        <div className="pr"><div className="pr-icon">🐟</div><div><div className="pr-title">Protein at every meal — 20–30g target</div><div className="pr-detail">Wild-caught fish, pasture-raised poultry. Protein supports thyroid hormone production.</div></div></div>
                                    </div>
                                )}

                                {activeProtocolTab === 'sup' && (
                                    <div className="pt-content on">
                                        <p style={{ fontSize: '13px', color: '#6B7280', padding: '4px 0 16px' }}>Clinician-reviewed. Do not change doses without checking with your Allvi team.</p>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="stab" style={{ minWidth: '500px' }}>
                                                <thead><tr><th>Supplement</th><th>Dose</th><th>Why</th></tr></thead>
                                                <tbody>
                                                    <tr><td style={{ fontWeight: 600 }}>Selenium</td><td>200mcg</td><td>T4→T3 conversion; reduces TPO antibodies</td></tr>
                                                    <tr style={{ background: '#F7F1E8' }}><td style={{ fontWeight: 600 }}>Magnesium glycinate</td><td>300–400mg</td><td>Sleep, mood, gut motility</td></tr>
                                                    <tr><td style={{ fontWeight: 600 }}>Iron 50mg ⚠</td><td>50mg ferrous bisglycinate</td><td>Ferritin at 19 → target 70–90. Alt day maximises absorption.</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div style={{ marginTop: '12px', padding: '12px', background: '#FDF3E7', borderRadius: '8px', fontSize: '12px', color: '#C97B2E' }}>⚠ Iron: avoid coffee, tea, or calcium within 1 hour. GI side effects expected weeks 1–2 — increase hydration on iron days.</div>
                                    </div>
                                )}

                                {activeProtocolTab === 'chk' && (
                                    <div className="pt-content on">
                                        <p style={{ fontSize: '13px', color: '#6B7280', padding: '4px 0 16px' }}>Tap any item to mark it done.</p>
                                        <div style={{ marginBottom: '16px' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#2D6A4F', color: 'white', borderRadius: '4px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, marginBottom: '10px' }}>✓ ALREADY DOING</div>
                                            <div className="cl-item"><div className={`cb-box ${checkedItems.includes('diet') ? 'done' : ''}`} onClick={() => toggleChecked('diet')}>{checkedItems.includes('diet') ? '✓' : ''}</div><div className="cl-text">Gluten-free, dairy-free diet</div></div>
                                        </div>
                                        <div>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#C97B2E', color: 'white', borderRadius: '4px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, marginBottom: '10px' }}>WATCH — Discuss with Endo</div>
                                            <div className="cl-item"><div className={`cb-box ${checkedItems.includes('ferritin') ? 'done' : ''}`} onClick={() => toggleChecked('ferritin')}>{checkedItems.includes('ferritin') ? '✓' : ''}</div><div className="cl-text">May: Ferritin recheck + TPO antibodies</div></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ═══════════════════════ SCREEN 6: MESSAGES SCREEN ═══════════════════════ */}
                    {currentScreen === 'messages' && (
                        <>
                            <div className="ph">
                                <div className="ph-title">Messages</div>
                                <div className="ph-sub">Your Allvi care team · Responds within 24 hours · Clinical queries reviewed by clinician</div>
                            </div>

                            <div className="card">
                                <div className="mt">
                                    {messages.map((msg, index) => (
                                        <div key={index} className={`msg ${msg.sender === 'patient' ? 'p' : 'a'}`} style={{ width: '100%' }}>
                                            <div className="mb">{msg.text}</div>
                                            <div className="mm">{msg.time}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mir">
                                    <input
                                        className="mi"
                                        type="text"
                                        placeholder="Ask anything — protocol questions, symptoms, what a result means…"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button className="ms" onClick={handleSendMessage}>Send</button>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* CLINICAL INQUIRY ACTION TERMINAL OVERLAY */}
            {isModalOpen && (
                <div className="no-print" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(31,41,55,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '460px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ backgroundColor: '#0F4C5C', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFFFF' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={18} /><h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 600, margin: 0 }}>Clinical Support Pipeline</h3></div>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', marginBottom: '8px' }}>Operational Inquiry Parameters</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detail current tracking status updates or programmatic clinical inquiries..." className="ta" style={{ width: '100%', minHeight: '120px', marginBottom: '16px' }} />
                            <button onClick={handleAppointmentSubmit} disabled={sending || !notes.trim()} className="sub-btn" style={{ opacity: (sending || !notes.trim()) ? 0.6 : 1 }}>
                                {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Submit Message Parameters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;