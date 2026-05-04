import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Clock, FileText, ChevronRight, User, Activity, TrendingUp, AlertCircle, CheckCircle2,Calendar } from 'lucide-react';

const PatientProfile = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [demographics, setDemographics] = useState({ age: '—', gender: '—' });
    const [latestVitals, setLatestVitals] = useState(null);
    const [loading, setLoading] = useState(true);

    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000' 
        : 'https://allvibackend.onrender.com';

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${baseURL}/api/patient/dashboard/${patientId}`);
                if (res.data.success) {
                    // 1. Group rows by test_date for the history list
                    const grouped = res.data.labs.reduce((acc, current) => {
                        const date = current.test_date;
                        if (!acc[date]) acc[date] = { date, count: 0, biomarkers: [] };
                        acc[date].count += 1;
                        acc[date].biomarkers.push(current);
                        return acc;
                    }, {});

                    const sortedReports = Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
                    setReports(sortedReports);
                    setDemographics({ age: res.data.age, gender: res.data.gender });

                    // 2. Extract latest vitals for the Analytics Summary
                    if (sortedReports.length > 0) {
                        setLatestVitals(sortedReports[0].biomarkers);
                    }
                }
            } catch (err) {
                console.error("History fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [patientId]);

    return (
        <div className="min-h-screen bg-[#F7F1E8] p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                
                {/* 1. Enhanced Profile Header */}
                <div className="bg-[#0F4C5C] rounded-[2.5rem] p-8 text-white shadow-2xl mb-10 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                        <TrendingUp size={200} />
                    </div>
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20">
                            <User size={44} />
                        </div>
                        <div>
                            <p className="text-3xl text-white/60 font-white tracking-tight uppercase">{patientId}</p>
                            

                            <p className="text-white/60 text-xs font-black uppercase tracking-[0.2em] mt-1">
                                Clinical Profile • {demographics.age}Y • {demographics.gender}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/phase1upload')}
                        className="bg-white text-[#0F4C5C] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl relative z-10"
                    >
                        + Add New Report
                    </button>
                </div>

                {/* 2. NEW: Health Analytics Summary Section */}
                {!loading && latestVitals && (
                    <div className="mb-12">
                        <h2 className="text-[11px] font-black text-[#1F2937]/40 uppercase tracking-widest mb-4 ml-2">Current Health Status (Latest)</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {latestVitals.slice(0, 4).map((vital, i) => (
                                <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                                    <p className="text-[9px] font-black text-[#1F2937]/40 uppercase mb-1">{vital.test_name}</p>
                                    <div className="flex items-end gap-1">
                                        <span className="text-xl font-black text-[#1F2937]">{vital.test_value}</span>
                                        <span className="text-[9px] font-bold text-[#0F4C5C] mb-1">{vital.unit}</span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-1">
                                        <CheckCircle2 size={12} className="text-green-500" />
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Within Range</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Report History List */}
                <h2 className="text-[11px] font-black text-[#1F2937]/40 uppercase tracking-widest mb-4 ml-2">Comprehensive History</h2>
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center py-20 opacity-20">
                            <Activity className="animate-spin mb-4" size={40} />
                            <p className="font-black uppercase text-xs tracking-widest">Syncing Records...</p>
                        </div>
                    ) : reports.length > 0 ? (
                        reports.map((report, idx) => (
                            <div 
                                key={idx}
                                onClick={() => navigate(`/dashboard/${patientId}`)}
                                className="group bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-[#0F4C5C] hover:shadow-xl transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="bg-[#F7F1E8] p-4 rounded-2xl text-[#0F4C5C] group-hover:bg-[#0F4C5C] group-hover:text-white transition-all shadow-inner">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-[#1F2937] text-lg">
                                            {new Date(report.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-[10px] font-bold text-[#1F2937]/40 uppercase flex items-center gap-1">
                                                <Activity size={10} /> {report.count} Markers
                                            </p>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                            <p className="text-[10px] font-black text-[#0F4C5C] uppercase">Verified Report</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="hidden md:flex flex-col items-end mr-4">
                                        <span className="text-[9px] font-black text-slate-300 uppercase">Analysis Ready</span>
                                        <div className="flex gap-1 mt-1">
                                            <div className="w-4 h-1 bg-[#0F4C5C] rounded-full"></div>
                                            <div className="w-2 h-1 bg-slate-100 rounded-full"></div>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-[#0F4C5C] group-hover:translate-x-1 transition-all" size={24} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white/50 border-2 border-dashed border-slate-300 rounded-[3rem] py-24 text-center">
                            <Clock className="mx-auto text-slate-200 mb-4" size={64} />
                            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No history detected.</p>
                            <p className="text-slate-300 text-[10px] mt-2">Upload a report to initialize your health vault.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientProfile;