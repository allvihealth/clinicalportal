import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, AlertCircle, AlertTriangle, User, Activity } from 'lucide-react';

const AIInsights = ({ patientId, intake }) => {
    const [insightsData, setInsightsData] = useState({ optimal: [], monitor: [], critical: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!patientId) return;

        const fetchInsights = async () => {
            try {
                setLoading(true);
                const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                    ? 'http://127.0.0.1:5000' 
                    : 'https://allvibackend.onrender.com';
                
                const res = await axios.get(`${baseURL}/api/patient/insights/${patientId}`);

                if (res.data.success && res.data.insights) {
                    const parsed = parseInsightsText(res.data.insights);
                    setInsightsData(parsed);
                }
            } catch (error) {
                console.error("Error fetching AI insights:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, [patientId]);

    const parseInsightsText = (text) => {
        const parsed = { optimal: [], monitor: [], critical: [] };
        let currentSection = null;

        const lines = text.split('\n');

        lines.forEach(line => {
            const cleanLine = line.trim();
            if (!cleanLine) return;

            if (cleanLine.toUpperCase().includes('POSITIVE TRENDS')) {
                currentSection = 'optimal'; return;
            }
            if (cleanLine.toUpperCase().includes('AREAS OF CONCERN')) {
                currentSection = 'monitor'; return;
            }
            if (cleanLine.toUpperCase().includes('NEEDS ATTENTION')) {
                currentSection = 'critical'; return;
            }

            if (currentSection && (cleanLine.startsWith('-') || cleanLine.startsWith('*') || cleanLine.match(/^\d+\./))) {
                const point = cleanLine.replace(/^[-*\d.\s]+/, '').replace(/\*\*/g, '').trim();
                if (point) parsed[currentSection].push(point);
            } else if (currentSection && cleanLine.length > 15 && !cleanLine.includes('**')) {
                parsed[currentSection].push(cleanLine.replace(/\*\*/g, ''));
            }
        });

        if (parsed.optimal.length === 0) parsed.optimal.push("No significant positive trends detected in current data.");
        if (parsed.monitor.length === 0) parsed.monitor.push("No borderline markers currently flagged for monitoring.");
        if (parsed.critical.length === 0) parsed.critical.push("No immediate critical actions required based on available data.");

        return parsed;
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex items-center justify-between px-2">
                    <div className="h-3 w-32 bg-slate-200 rounded-full"></div>
                    <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 h-48 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                                <div className="h-4 w-24 bg-slate-100 rounded-md"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-2 w-full bg-slate-50 rounded"></div>
                                <div className="h-2 w-5/6 bg-slate-50 rounded"></div>
                                <div className="h-2 w-4/6 bg-slate-50 rounded"></div>
                            </div>
                            <div className="mt-auto flex items-center justify-center">
                                <Activity className="text-slate-200 animate-spin" size={16} />
                                <span className="ml-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">AI Analyzing...</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const categories = [
        {
            title: "Optimal / Stable", color: "bg-emerald-50 text-emerald-900 border-emerald-200",
            icon: <ShieldCheck className="text-emerald-600" size={24} />, points: insightsData.optimal
        },
        {
            title: "Monitor / Borderline", color: "bg-amber-50 text-amber-900 border-amber-200",
            icon: <AlertTriangle className="text-amber-600" size={24} />, points: insightsData.monitor
        },
        {
            title: "Requires Attention", color: "bg-rose-50 text-rose-900 border-rose-200",
            icon: <AlertCircle className="text-rose-600" size={24} />, points: insightsData.critical
        }
    ];

    return (
        <div className="space-y-6 ai-insights-container">
            <div className="flex flex-col md:flex-row md:items-center justify-between px-2 no-print gap-4">
                <h2 className="text-xs font-black text-[#1F2937]/40 uppercase tracking-[0.25em]">Allvi AI Health Insights</h2>
                {intake?.goals && (
                    <div className="bg-[#0F4C5C]/5 text-[#0F4C5C] px-3 py-1.5 rounded-md text-[10px] font-bold border border-[#0F4C5C]/10 flex-1 md:max-w-md truncate">
                        Target: {intake.goals}
                    </div>
                )}
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#0F4C5C] bg-[#0F4C5C]/10 px-3 py-1.5 rounded-full flex-shrink-0">
                    <User size={12} /> ID: {patientId}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((cat, index) => (
                    <div key={index} className={`${cat.color} p-5 rounded-2xl border print:border-[0.5pt] print:shadow-none print:bg-white shadow-sm flex flex-col h-full`} style={{ breakInside: 'avoid' }}>
                        <div className="flex items-center gap-3 mb-4">
                            {cat.icon}
                            <h3 className="font-black text-sm uppercase tracking-tight">{cat.title}</h3>
                        </div>
                        <ul className="space-y-3 flex-grow">
                            {cat.points.map((point, pIndex) => (
                                <li key={pIndex} className="text-xs font-medium leading-relaxed flex gap-2">
                                    <span className="opacity-40 mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIInsights;