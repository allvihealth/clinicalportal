import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const IntakeForm = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const resetProcessingState = () => {
    setIsProcessing(false);
    processingRef.current = false;
  };

  useEffect(() => {
    const handleTallyEvent = async (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data && data.event === 'Tally.FormSubmitted') {
          // ==========================================
          // 1. ADVANCED PRE-CHECK (Wait for the PDF)
          // ==========================================
          const payload = data.payload || {};
          let fileFound = false;

          // Check specifically for your known ID or hunt for any FILE_UPLOAD type
          for (const key in payload) {
            const field = payload[key];
            if (field?.type === 'FILE_UPLOAD' || key === 'question_jBDMVE') {
               const val = field?.value || field;
               if (val && (typeof val === 'string' || (Array.isArray(val) && val.length > 0))) {
                 fileFound = true;
                 break;
               }
            }
          }

          if (!fileFound) {
            console.log("⏳ PDF link not ready in this event. Waiting for next message...");
            return; 
          }

          if (processingRef.current) return;
          processingRef.current = true;
          setIsProcessing(true);

          const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://127.0.0.1:5000'
            : 'https://allvibackend.onrender.com';
            
          const n8nWebhookURL = 'https://allvi.app.n8n.cloud/webhook/b3cbf8a4-0e20-4399-8f3a-3ea24c0ecbfc/webhook';

          // Small delay (2s) to ensure S3/Tally processing is complete before Backend tries to download
          await new Promise(resolve => setTimeout(resolve, 2000));

          try {
            // Trigger n8n parallel
            axios.post(n8nWebhookURL, payload).catch(e => console.error("n8n failed", e));

            // Await the Main Backend
            const response = await axios.post(`${baseURL}/api/patient/webhook/tally`, payload, {
              headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.success) {
              navigate('/review', { state: response.data });
            }
          } catch (error) {
            console.error("Submission Error:", error);
            alert(error.response?.data?.message || "Extraction failed. Ensure a PDF was uploaded.");
            resetProcessingState();
          }
        }
      } catch (e) { /* Ignore non-Tally messages */ }
    };

    window.addEventListener('message', handleTallyEvent);
    return () => window.removeEventListener('message', handleTallyEvent);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[#f7f1e8] py-8 px-4">
      <div className="mb-6 text-center">
        <img src="https://storage.tally.so/1f4d5e7c-2b0b-481c-a6b0-241d82e60995/allvi-logo-400x400-btter-text-copy-2.png" alt="Logo" className="w-20 h-20 mx-auto rounded-full mb-4 shadow-sm" />
        <h1 className="text-3xl font-extrabold text-gray-900">Patient Intake Assessment</h1>
      </div>
      <div className="w-full max-w-4xl border rounded-xl shadow-sm bg-white overflow-hidden">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#0F4C5C] rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-[#0F4C5C]">Analyzing your intake...</h2>
            <p className="text-gray-500 mt-3">Allvi AI is standardizing your lab results.</p>
          </div>
        ) : (
          <iframe 
            src="https://tally.so/embed/zxYlVZ?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1&formEventsForwarding=1" 
            width="100%" height="750" frameBorder="0" title="Intake Form" 
          />
        )}
      </div>
    </div>
  );
};

export default IntakeForm;