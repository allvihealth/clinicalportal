import React, { useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Printer, Send, AlertCircle, CheckCircle2, User, Loader2, ArrowLeft } from 'lucide-react';

const ClinicalSummary = () => {
    // 1. Pull the patientId from the URL
    const { patientId } = useParams();
    
    // 2. Pull all the data that was sent from the Dashboard via navigation state
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, intake, labData, aiInsights } = location.state || {};

    const [specialistNotes, setSpecialistNotes] = useState('');
    const [isSending, setIsSending] = useState(false);

    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000'
        : 'https://allvibackend.onrender.com';

    const handlePrint = () => {
        window.print();
    };

    const handleSendToPatient = async () => {
        if (!specialistNotes.trim()) {
            alert("Please add clinical notes before sending.");
            return;
        }

        setIsSending(true);
        try {
            await axios.post(`${baseURL}/api/patient/admin/send-protocol`, {
                patientId,
                notes: specialistNotes,
                summary: aiInsights 
            });
            alert("Clinical summary and protocol successfully sent to the patient!");
            setSpecialistNotes('');
            navigate(`/dashboard/${patientId}`); // Go back to dashboard after sending
        } catch (err) {
            console.error("Error sending protocol:", err);
            alert("Failed to send the protocol. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    // Helper to format the lab table safely
    const renderLabTable = () => {
        if (!labData || Object.keys(labData).length === 0) {
            return <p className="text-sm italic text-gray-500">No lab findings available.</p>;
        }

        return (
            <table className="w-full text-left text-sm border-collapse mt-2">
                <thead>
                    <tr className="border-b-2 border-gray-300">
                        <th className="py-2 font-bold text-gray-800">Marker</th>
                        <th className="py-2 font-bold text-gray-800">Value</th>
                        <th className="py-2 font-bold text-gray-800">Reference / Optimal</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(labData).map(([key, value]) => {
                        if (['id', 'test_date', 'report_type', 'created_at', 'patient_id', 'meta'].includes(key)) return null;
                        const meta = labData.meta?.[key] || {};
                        return (
                            <tr key={key} className="border-b border-gray-100">
                                <td className="py-2 font-semibold text-[#0F4C5C] uppercase text-xs tracking-wider">
                                    {meta.label || key.replace(/_/g, ' ')}
                                </td>
                                <td className="py-2 font-bold text-gray-900">
                                    {value} <span className="text-xs text-gray-500 font-normal">{meta.unit}</span>
                                </td>
                                <td className="py-2 text-gray-600 text-xs">
                                    {meta.ref_range || 'N/A'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    // Section Divider Component
    const SectionDivider = ({ title }) => (
        <div className="mt-8 mb-4">
            <h3 className="text-[11px] font-black text-[#0F4C5C] uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="text-gray-300 tracking-[-0.1em]">───</span> 
                {title} 
                <span className="flex-1 border-b border-gray-300 ml-2"></span>
            </h3>
        </div>
    );

    // Safety check in case someone navigates here directly without coming from the dashboard
    if (!profile && !labData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F1E8]">
                <p className="text-gray-600 mb-4">No patient data found.</p>
                <button onClick={() => navigate(-1)} className="text-[#0F4C5C] font-bold underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F1E8] p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden print:shadow-none print:border-none">
                
                {/* Header Actions (Hidden in Print) */}
                <div className="bg-[#0F4C5C] px-6 py-4 flex justify-between items-center no-print">
                    <div className="flex items-center gap-4 text-[#F7F1E8]">
                        <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-1 rounded transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <FileText size={20} />
                            <h2 className="font-black tracking-widest text-sm uppercase">Specialist Review Station</h2>
                        </div>
                    </div>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-[#F7F1E8] text-[#0F4C5C] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
                    >
                        <Printer size={16} /> Export to PDF
                    </button>
                </div>

                {/* Printable Document Area */}
                <div className="p-8 md:p-10 font-sans text-gray-800" id="printable-summary">
                    
                    {/* Document Header */}
                    <div className="text-center mb-8 pb-6 border-b-2 border-gray-800">
                        <h1 className="text-2xl font-black text-gray-900 tracking-widest uppercase mb-4">Allvi Clinical Summary</h1>
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            <span className="flex items-center gap-1"><User size={14}/> Patient: <span className="text-gray-900">{profile?.name || patientId}</span></span>
                            <span>Age: <span className="text-gray-900">{profile?.age || 'N/A'}</span></span>
                            <span>Date: <span className="text-gray-900">{new Date().toLocaleDateString()}</span></span>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm mb-8">
                        <p className="mb-2"><span className="font-bold text-gray-500 uppercase tracking-wider text-xs">Primary Concern:</span> <span className="font-medium">{intake?.goals || 'Not specified'}</span></p>
                        <p><span className="font-bold text-gray-500 uppercase tracking-wider text-xs">Specific Request:</span> <span className="font-medium">{intake?.stated_concern || 'Not specified'}</span></p>
                    </div>

                    {/* LAB FINDINGS */}
                    <SectionDivider title="Lab Findings" />
                    <div className="px-2">
                        {renderLabTable()}
                    </div>

                    {/* AI-FLAGGED SIGNALS */}
                    <SectionDivider title="AI-Flagged Signals" />
                    <div className="space-y-4 px-2">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <h4 className="text-xs font-black text-red-800 tracking-widest uppercase flex items-center gap-1 mb-2">
                                <AlertCircle size={14} /> High Priority
                            </h4>
                            <ul className="text-sm text-red-900 space-y-1 list-disc list-inside ml-4">
                                <li>Review generated AI insights for high-priority metabolic/hormonal flags.</li>
                            </ul>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                            <h4 className="text-xs font-black text-amber-800 tracking-widest uppercase mb-2">
                                Moderate Priority
                            </h4>
                            <ul className="text-sm text-amber-900 space-y-1 list-disc list-inside ml-4">
                                <li>Review generated AI insights for suboptimal ranges.</li>
                            </ul>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-black text-slate-600 tracking-widest uppercase mb-2">
                                Missing Markers For Full Assessment
                            </h4>
                            <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside ml-4">
                                <li>Check gaps based on patient goals (e.g., AMH, fasting glucose).</li>
                            </ul>
                        </div>
                    </div>

                    {/* PATIENT-REPORTED SYMPTOMS */}
                    <SectionDivider title="Patient-Reported Symptoms" />
                    <div className="px-2">
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                            {intake?.symptoms && intake.symptoms.length > 0 
                                ? intake.symptoms.join(', ') 
                                : 'No symptoms explicitly reported in recent intake.'}
                        </p>
                    </div>

                    {/* RAW AI INSIGHTS BLOCK (Fallback) */}
                    <SectionDivider title="Raw AI Analysis Draft" />
                    <div className="bg-[#f0f9ff] p-5 rounded-xl border border-[#bae6fd]">
                        <p className="whitespace-pre-wrap text-sm text-[#0369a1] font-mono leading-relaxed">
                            {aiInsights || "AI Analysis pending or unavailable."}
                        </p>
                    </div>

                    {/* DISCLAIMER */}
                    <div className="mt-12 pt-6 border-t border-gray-200">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center leading-relaxed">
                            Disclaimer: This summary is generated by Allvi's AI analysis layer to support clinical review. <br/>
                            All findings require clinical interpretation. This is not a diagnosis.
                        </p>
                    </div>
                </div>

                {/* ── SPECIALIST ACTION AREA (No Print) ── */}
                <div className="bg-[#f8fafc] border-t border-gray-200 p-8 no-print">
                    <div className="max-w-3xl mx-auto">
                        <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-widest flex items-center gap-2 mb-4">
                            <CheckCircle2 size={18} className="text-[#0F4C5C]"/> Specialist Protocol & Notes
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mb-4">
                            Draft your clinical recommendations, lifestyle protocol, or request for further testing here. This will be sent directly to the patient's dashboard.
                        </p>
                        
                        <textarea 
                            value={specialistNotes}
                            onChange={(e) => setSpecialistNotes(e.target.value)}
                            placeholder="e.g., I've reviewed your results. We are seeing a pattern of insulin resistance..."
                            className="w-full h-48 p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent outline-none resize-y text-sm mb-4 shadow-inner"
                        />
                        
                        <div className="flex justify-end">
                            <button 
                                onClick={handleSendToPatient}
                                disabled={isSending}
                                className="bg-[#0F4C5C] text-[#F7F1E8] px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#0a3540] transition-colors shadow-lg disabled:opacity-50"
                            >
                                {isSending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16} />}
                                {isSending ? 'Sending Protocol...' : 'Send to Patient'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ClinicalSummary;