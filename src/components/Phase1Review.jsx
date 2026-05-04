import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ClipboardCheck, Save, AlertCircle, ArrowLeft, Loader2, UserCircle } from 'lucide-react';

const Phase1Review = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { parsedData, allviId, age, gender } = location.state || {};

  const [formData, setFormData] = useState({});
  const [testDate, setTestDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (parsedData) {
      setTestDate(parsedData.test_date || new Date().toISOString().split('T')[0]);

      // FIX: Store the ENTIRE biomarker object so we keep units and ranges
      setFormData(parsedData.biomarkers || {});
    } else {
      navigate('/phase1upload');
    }
  }, [parsedData, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // FIX: Only update the 'value' property inside the nested object
    setFormData(prev => ({ 
      ...prev, 
      [name]: {
        ...prev[name],
        value: value 
      }
    }));
  };

  const handleConfirmSave = async () => {
    if (!allviId) return alert("Patient ID missing.");
    
    setSaving(true);
    try {
      const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000'
        : 'https://allvibackend.onrender.com';

      // Important: Sending the full nested objects (including units/ranges) to the backend
      const response = await axios.post(`${baseURL}/api/patient/confirm-results`, {
        patientId: allviId,
        test_date: testDate,
        biomarkers: formData 
      });

      if (response.data.success) {
        navigate(`/dashboard/${allviId}`);
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert(`Error: ${error.response?.data?.error || "Failed to save records."}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1E8] py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/60">

        {/* Header Section */}
        <div className="bg-[#0F4C5C] p-8 text-[#F7F1E8]">
          <button
            onClick={() => navigate('/phase1upload')}
            className="flex items-center gap-2 text-[#F7F1E8]/70 hover:text-white transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft size={16} /> Change File
          </button>

          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardCheck /> Review Results
              </h2>
              <div className="flex items-center gap-2 mt-2 bg-white/10 w-fit px-3 py-1 rounded-lg">
                <UserCircle size={14} className="text-[#F7F1E8]/70" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {age || '??'} Years • {gender || 'N/A'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-[#F7F1E8]/50 uppercase font-black tracking-widest">Identity</span>
              <span className="text-xl font-mono font-bold text-white">{allviId || 'PENDING'}</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-start gap-3 p-4 bg-[#F7F1E8] text-[#1F2937]/70 rounded-xl mb-8 border border-slate-200 text-sm">
            <AlertCircle size={20} className="text-[#0F4C5C] shrink-0" />
            <p>Please confirm values match your report. You can edit any field below.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-[#1F2937]/40 uppercase tracking-widest">Test Date</label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0F4C5C] outline-none transition-all font-bold text-[#1F2937]"
              />
            </div>

            {/* Dynamic Marker Fields */}
            {Object.entries(formData).map(([key, info]) => (
              <div key={key} className="space-y-1">
                <label className="block text-[10px] font-black text-[#1F2937]/40 uppercase tracking-widest">
                  {info.label || key.replace(/_/g, ' ')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name={key}
                    value={info.value || ''}
                    onChange={handleChange}
                    className="w-full p-3 pr-16 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0F4C5C] outline-none transition-all font-bold text-[#1F2937]"
                  />
                  {/* Visual Unit Badge */}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                    {info.unit}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 italic">Ref: {info.ref_range}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleConfirmSave}
            disabled={saving || !allviId}
            className="w-full mt-10 bg-[#1F2937] text-[#F7F1E8] py-4 rounded-2xl font-bold flex justify-center items-center gap-2 hover:bg-[#0F4C5C] shadow-lg shadow-[#1F2937]/10 transition-all disabled:opacity-40"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {saving ? " Saving Results..." : " Confirm & View Analysis"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Phase1Review;