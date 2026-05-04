import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Edit2, Save, X, MapPin, Mail, 
  Calendar, Hash, Loader2, LogOut, CheckCircle2 
} from 'lucide-react';
import axios from 'axios';

const ProfileDashboard = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    
    // States
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [updateLoading, setUpdateLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // 1. Fetch Dashboard & Profile Data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Ensure this matches your backend route exactly
                const res = await axios.get(`https://allvibackend.onrender.com/api/patients/dashboard/${patientId}`);
                if (res.data.success) {
                    setProfile(res.data.profile);
                    setEditForm(res.data.profile);
                }
            } catch (err) {
                console.error("Error fetching patient data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [patientId]);

    // 2. Handle Profile Updates
    const handleUpdate = async () => {
        setUpdateLoading(true);
        try {
            const res = await axios.put(`http://localhost:5000/api/patients/profile/update/${patientId}`, editForm);
            if (res.data.success) {
                setProfile(editForm);
                setIsEditing(false);
                setSuccessMsg('Profile updated successfully!');
                setTimeout(() => setSuccessMsg(''), 3000);
            }
        } catch (err) {
            alert("Update failed. Check your connection.");
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('allvi_id');
        navigate('/portal');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F1E8]">
            <Loader2 className="animate-spin text-[#0F4C5C]" size={40} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F7F1E8] p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                
                {/* Header with Navigation */}
                <div className="flex justify-between items-center mb-8">
                    <button 
                        onClick={() => navigate('/')}
                        className="text-[#0F4C5C] font-bold flex items-center gap-2 hover:opacity-70 transition-all"
                    >
                        Allvi Health Dashboard
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-bold text-sm transition-all"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>

                {/* Profile Section Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-200 mb-8 relative overflow-hidden">
                    {successMsg && (
                        <div className="absolute top-0 left-0 right-0 bg-emerald-500 text-white text-center py-2 text-xs font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 size={14} /> {successMsg}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-[#0F4C5C] rounded-[2rem] flex items-center justify-center text-white shadow-xl rotate-3">
                                <User size={48} className="-rotate-3" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    {isEditing ? (
                                        <input 
                                            className="text-3xl font-black text-[#1F2937] border-b-4 border-[#0F4C5C]/20 outline-none focus:border-[#0F4C5C] transition-all bg-transparent"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                            autoFocus
                                        />
                                    ) : (
                                        <h1 className="text-4xl font-black text-[#1F2937] tracking-tighter">
                                            {profile?.name}
                                        </h1>
                                    )}
                                    <div className="bg-[#0F4C5C]/10 text-[#0F4C5C] px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-[#0F4C5C]/20">
                                        ID: {patientId}
                                    </div>
                                </div>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Member since {new Date(profile?.created_at).getFullYear() || '2026'}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            {isEditing ? (
                                <>
                                    <button 
                                        onClick={handleUpdate}
                                        disabled={updateLoading}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#0F4C5C] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0d3b47] transition-all shadow-lg"
                                    >
                                        {updateLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Save Profile
                                    </button>
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-500 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        <X size={16} /> Cancel
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 border-2 border-[#1F2937] text-[#1F2937] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1F2937] hover:text-white transition-all shadow-sm"
                                >
                                    <Edit2 size={16} /> Edit Details
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Data Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 pt-10 border-t border-slate-100">
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black flex items-center gap-2">
                                <Mail size={12} className="text-[#0F4C5C]" /> Email Contact
                            </label>
                            {isEditing ? (
                                <input 
                                    className="w-full text-sm font-bold text-[#1F2937] border-b-2 border-slate-200 outline-none p-1 focus:border-[#0F4C5C]"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                />
                            ) : (
                                <p className="text-sm font-bold text-[#1F2937] truncate">{profile?.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black flex items-center gap-2">
                                <MapPin size={12} className="text-[#0F4C5C]" /> Current City
                            </label>
                            {isEditing ? (
                                <input 
                                    className="w-full text-sm font-bold text-[#1F2937] border-b-2 border-slate-200 outline-none p-1 focus:border-[#0F4C5C]"
                                    value={editForm.city}
                                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                                />
                            ) : (
                                <p className="text-sm font-bold text-[#1F2937]">{profile?.city || 'Not provided'}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black flex items-center gap-2">
                                <Calendar size={12} className="text-[#0F4C5C]" /> Patient Age
                            </label>
                            {isEditing ? (
                                <input 
                                    type="number"
                                    className="w-full text-sm font-bold text-[#1F2937] border-b-2 border-slate-200 outline-none p-1 focus:border-[#0F4C5C]"
                                    value={editForm.age}
                                    onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                                />
                            ) : (
                                <p className="text-sm font-bold text-[#1F2937]">{profile?.age ? `${profile.age} yrs` : '—'}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black flex items-center gap-2">
                                <Hash size={12} className="text-[#0F4C5C]" /> Assigned Gender
                            </label>
                            {isEditing ? (
                                <select 
                                    className="w-full text-sm font-bold text-[#1F2937] border-b-2 border-slate-200 outline-none p-1 focus:border-[#0F4C5C] bg-white"
                                    value={editForm.gender}
                                    onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                                >
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                    <option value="Other">Other</option>
                                </select>
                            ) : (
                                <p className="text-sm font-bold text-[#1F2937]">{profile?.gender || '—'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area (For Charts) */}
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Placeholder for your Lab Analysis / Recharts components */}
                    <div className="md:col-span-3 bg-white rounded-[2.5rem] p-10 border border-slate-100 flex items-center justify-center min-h-[300px]">
                        <p className="text-slate-400 font-medium italic">Your Lab Result Trends will be visualized here...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileDashboard;