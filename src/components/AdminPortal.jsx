import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, ExternalLink, Activity, Search, ShieldCheck, Trash2, Loader2 } from 'lucide-react';

const AdminPortal = () => {
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState(null); // Tracks which ID is being deleted
    const navigate = useNavigate();

    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000' 
        : 'https://allvibackend.onrender.com';

    const fetchPatients = async () => {
        try {
            const res = await axios.get(`${baseURL}/api/patient/admin/patients`);
            if (res.data.success) setPatients(res.data.patients);
        } catch (err) {
            console.error("Admin Fetch Error:", err);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    // --- DELETE FUNCTION ---
    const handleDelete = async (patientId) => {
        const confirmDelete = window.confirm(`CRITICAL: Are you sure you want to delete all records for ${patientId}? This cannot be undone.`);
        
        if (confirmDelete) {
            setIsDeleting(patientId);
            try {
                const res = await axios.delete(`${baseURL}/api/patient/admin/patients/${patientId}`);
                if (res.data.success) {
                    // Filter out the deleted patient from local state
                    setPatients(patients.filter(p => p.id !== patientId));
                }
            } catch (err) {
                console.error("Delete Error:", err);
                alert("Failed to delete patient records.");
            } finally {
                setIsDeleting(null);
            }
        }
    };

    const filteredPatients = patients.filter(p => 
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F7F1E8] p-4 md:p-12">
            <div className="max-w-6xl mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-[#1F2937] flex items-center gap-3 tracking-tighter">
                            <ShieldCheck className="text-[#0F4C5C]" size={32} /> Clinical Oversight
                        </h1>
                        <p className="text-[#1F2937]/60 font-medium mt-1">Care Coordinator Panel — Database Management</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1F2937]/40" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by Patient ID..." 
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#0F4C5C] outline-none text-[#1F2937]"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Patient Table */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#0F4C5C] text-[#F7F1E8]">
                                <tr>
                                    <th className="p-5 font-bold uppercase text-xs tracking-widest">Patient ID</th>
                                    <th className="p-5 font-bold uppercase text-xs tracking-widest">Demographics</th>
                                    <th className="p-5 font-bold uppercase text-xs tracking-widest">Latest Activity</th>
                                    <th className="p-5 font-bold uppercase text-xs tracking-widest text-right px-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-[#F7F1E8]/50 transition-colors">
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#0F4C5C]/10 flex items-center justify-center text-[#0F4C5C]">
                                                        <Activity size={16} />
                                                    </div>
                                                    <span className="font-mono font-bold text-[#0F4C5C]">{patient.id}</span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-[#1F2937]/70 font-bold text-xs uppercase">
                                                {patient.age}Y • {patient.gender}
                                            </td>
                                            <td className="p-5">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    patient.lastActivity === 'No reports yet' 
                                                    ? 'bg-slate-100 text-slate-500' 
                                                    : 'bg-[#0F4C5C]/10 text-[#0F4C5C]'
                                                }`}>
                                                    {patient.lastActivity}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right flex justify-end items-center gap-3 px-10">
                                                <button 
                                                    onClick={() => handleDelete(patient.id)}
                                                    disabled={isDeleting === patient.id}
                                                    className="p-2.5 text-slate-300 hover:text-red-600 transition-all rounded-xl hover:bg-red-50"
                                                    title="Delete Patient"
                                                >
                                                    {isDeleting === patient.id ? (
                                                        <Loader2 className="animate-spin" size={18} />
                                                    ) : (
                                                        <Trash2 size={18} />
                                                    )}
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/dashboard/${patient.id}`)}
                                                    className="inline-flex items-center gap-2 text-xs bg-[#1F2937] text-[#F7F1E8] hover:bg-[#0F4C5C] px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
                                                >
                                                    View <ExternalLink size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-12 text-center text-[#1F2937]/40 font-medium">
                                            No patient records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-[#1F2937]/40 text-sm font-medium">
                    <Users size={16} /> Total Managed Database: {filteredPatients.length} Patients
                </div>
            </div>
        </div>
    );
};

export default AdminPortal;