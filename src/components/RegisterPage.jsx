import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9;
  
  // Loading state to disable the button while saving to backend
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Centralized state for the form data
  const [formData, setFormData] = useState({
    // Section 1
    conditions: [], conditionOther: '', diagnosedWhen: '', diagnosedBy: [],
    // Section 2
    symptomsEnergy: [], symptomsDigestion: [], symptomsMental: [], symptomsSleep: [], symptomsOther: [], symptomsOtherText: '', worstSymptoms: '',
    // Section 3
    takingMedication: '', medicationDetails: '', medicationDuration: '', supplements: '',
    // Section 4
    lastLabs: '', labFile: null, additionalLabs: [],
    // Section 5
    providerSatisfaction: '', upcomingAppt: '', apptDate: '',
    // Section 6
    dietaryChanges: [], dietOther: '', stressLevel: '', sleepQuality: '', exercise: '', exerciseType: '',
    // Section 7
    topGoals: '', topHelp: '', topHelpOther: '', anythingElse: '',
    // Section 8
    commPlatform: [], commPlatformOther: '', commTime: '',
    // Section 9
    fullName: '', email: '', phone: '', dob: '', gender: '', genderOther: '', location: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (category, value) => {
    setFormData((prev) => {
      const currentList = prev[category];
      if (currentList.includes(value)) {
        return { ...prev, [category]: currentList.filter((item) => item !== value) };
      } else {
        return { ...prev, [category]: [...currentList, value] };
      }
    });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  // --- UPGRADED SUBMIT FUNCTION FOR REVIEW ROUTING ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000' 
        : 'https://allvibackend.onrender.com';

    try {
      // 1. Create FormData to handle the file upload alongside text
      const payload = new FormData();

      // 2. Append standard text fields
      payload.append('fullName', formData.fullName);
      payload.append('email', formData.email);
      payload.append('dob', formData.dob);
      payload.append('gender', formData.gender);
      payload.append('location', formData.location);
      payload.append('topGoals', formData.topGoals);
      payload.append('topHelp', formData.topHelp);
      payload.append('anythingElse', formData.anythingElse);
      payload.append('conditionOther', formData.conditionOther);
      payload.append('symptomsOtherText', formData.symptomsOtherText);

      // 3. Stringify array fields so the backend can parse them safely
      payload.append('conditions', JSON.stringify(formData.conditions));
      payload.append('symptomsEnergy', JSON.stringify(formData.symptomsEnergy));
      payload.append('symptomsDigestion', JSON.stringify(formData.symptomsDigestion));
      payload.append('symptomsMental', JSON.stringify(formData.symptomsMental));
      payload.append('symptomsSleep', JSON.stringify(formData.symptomsSleep));
      payload.append('symptomsOther', JSON.stringify(formData.symptomsOther));

      // 4. Append the uploaded file if it exists
      if (formData.labFile) {
        payload.append('labReport', formData.labFile);
      }

      // 5. Send using Axios to handle multipart form data
      const response = await axios.post(`${baseURL}/api/patient/submit-intake`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        
        // ── NEW ROUTING LOGIC TO REVIEW SCREEN ──
        // If a file was uploaded AND the AI parsed it successfully, go to Review Page
        if (formData.labFile && response.data.parsedData) {
            
            // Calculate age to pass to the Review UI
            let calcAge = '';
            if (formData.dob) {
                const diff = Date.now() - new Date(formData.dob).getTime();
                calcAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
            }

            // Navigate to Review Page and pass the data exactly how Phase1Review expects it
            navigate('/review', { 
                state: {
                    parsedData: response.data.parsedData,
                    allviId: response.data.allvi_id,
                    age: calcAge,
                    gender: formData.gender
                }
            });
        } else {
            // If no file was uploaded, or AI extraction failed, skip review and go to Dashboard
            navigate(`/dashboard/${response.data.allvi_id}`);
        }

      } else {
        alert(`Error submitting form: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert(`Submission failed: ${error.message || "Could not reach server"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- REUSABLE UI COMPONENTS ---
  const SectionHeader = ({ title }) => (
    <h2 className="text-2xl font-bold text-[#0F4C5C] mb-6 pb-2 border-b-2 border-gray-100">{title}</h2>
  );

  const Label = ({ text, required, subtext }) => (
    <div className="mb-3">
      <label className="block text-lg font-semibold text-gray-800">
        {text} {required && <span className="text-gray-400 text-sm ml-1">*</span>}
      </label>
      {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
    </div>
  );

  const CheckboxGroup = ({ category, options, otherOption, otherStateName }) => (
    <div className="flex flex-col gap-3 mb-4">
      {options.map((opt) => (
        <div key={opt} className="flex flex-col">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#0F4C5C] focus:ring-[#0F4C5C]"
              checked={formData[category].includes(opt)}
              onChange={() => handleCheckbox(category, opt)}
            />
            <span className="text-gray-700 font-medium">{opt}</span>
          </label>
          {/* Conditional Input for "Other" */}
          {otherOption === opt && formData[category].includes(opt) && (
            <div className="ml-8 mt-2 transition-all duration-300 ease-in-out">
              <textarea
                name={otherStateName}
                value={formData[otherStateName]}
                onChange={handleChange}
                rows="2"
                className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C] bg-white shadow-sm"
                placeholder="Please specify here..."
                required
              ></textarea>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const RadioGroup = ({ name, options, otherOption, otherStateName, otherType = "textarea" }) => (
    <div className="flex flex-col gap-3 mb-4">
      {options.map((opt) => (
        <div key={opt} className="flex flex-col">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt}
              checked={formData[name] === opt}
              onChange={handleChange}
              className="w-5 h-5 mt-0.5 text-[#0F4C5C] focus:ring-[#0F4C5C]"
            />
            <span className="text-gray-700 font-medium">{opt}</span>
          </label>
          {/* Conditional Input for "Other" */}
          {otherOption === opt && formData[name] === opt && (
            <div className="ml-8 mt-2 transition-all duration-300 ease-in-out">
              {otherType === "date" ? (
                <input type="date" name={otherStateName} value={formData[otherStateName]} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C] shadow-sm max-w-md" required />
              ) : (
                <textarea
                  name={otherStateName}
                  value={formData[otherStateName]}
                  onChange={handleChange}
                  rows="2"
                  className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C] bg-white shadow-sm"
                  placeholder="Please specify here..."
                  required
                ></textarea>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f1e8] py-8 px-4 sm:px-6 lg:px-8 font-sans text-[#37352F]">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-10">
        
        {/* Header & Progress Bar */}
        <div className="text-center mb-8">
          <img src="https://storage.tally.so/1f4d5e7c-2b0b-481c-a6b0-241d82e60995/allvi-logo-400x400-btter-text-copy-2.png" alt="Allvi Logo" className="w-20 h-20 mx-auto rounded-full object-cover mb-4" />
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-6">Allvi — Intake Form</h1>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
            <div 
              className="bg-[#0F4C5C] h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 text-right font-medium">Step {currentStep} of {totalSteps}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* STEP 1: Condition */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <SectionHeader title="Section 1: Your Thyroid Condition" />
              <div className="mb-6">
                <Label text="What thyroid condition(s) have you been diagnosed with?" required />
                <CheckboxGroup 
                  category="conditions" 
                  options={["Hashimoto's thyroiditis", "Graves' disease", "Hypothyroidism (not autoimmune)", "Hyperthyroidism (not autoimmune)", "Thyroid nodules", "Not officially diagnosed yet, but suspect thyroid issues", "Other (please specify)"]} 
                  otherOption="Other (please specify)" 
                  otherStateName="conditionOther" 
                />
              </div>
              <div className="mb-6">
                <Label text="When were you diagnosed?" required />
                <select name="diagnosedWhen" value={formData.diagnosedWhen} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0F4C5C] outline-none bg-white" required>
                  <option value="">Select an option...</option>
                  <option value="Within the last month">Within the last month</option>
                  <option value="1-6 months ago">1-6 months ago</option>
                  <option value="6-12 months ago">6-12 months ago</option>
                  <option value="1-3 years ago">1-3 years ago</option>
                  <option value="More than 3 years ago">More than 3 years ago</option>
                </select>
              </div>
              <div className="mb-6">
                <Label text="Who diagnosed you?" required />
                <CheckboxGroup category="diagnosedBy" options={["Primary care physician (PCP)", "Endocrinologist", "Functional medicine doctor", "Other specialist", "Self-suspected (not formally diagnosed)"]} />
              </div>
            </div>
          )}

          {/* STEP 2: Symptoms */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <SectionHeader title="Section 2: Current Symptoms" />
              <Label text="What symptoms are you currently experiencing?" required />
              
              <h3 className="font-semibold text-gray-700 mt-4 mb-2">Energy & Body:</h3>
              <CheckboxGroup category="symptomsEnergy" options={["Fatigue / low energy", "Always feeling cold", "Always feeling hot / heat intolerance", "Weight gain", "Weight loss / difficulty gaining weight", "Hair loss or thinning", "Dry skin", "Brittle nails", "Muscle aches or weakness", "Joint pain"]} />

              <h3 className="font-semibold text-gray-700 mt-4 mb-2">Digestion:</h3>
              <CheckboxGroup category="symptomsDigestion" options={["Constipation", "Diarrhea", "Bloating"]} />

              <h3 className="font-semibold text-gray-700 mt-4 mb-2">Mental & Cognitive:</h3>
              <CheckboxGroup category="symptomsMental" options={["Brain fog / difficulty concentrating", "Memory issues", "Anxiety", "Depression", "Mood swings", "Irritability"]} />

              <h3 className="font-semibold text-gray-700 mt-4 mb-2">Sleep:</h3>
              <CheckboxGroup category="symptomsSleep" options={["Difficulty falling asleep", "Difficulty staying asleep", "Waking up tired even after enough sleep"]} />

              <h3 className="font-semibold text-gray-700 mt-4 mb-2">Other:</h3>
              <CheckboxGroup 
                category="symptomsOther" 
                options={["Heart palpitations", "Menstrual irregularities", "Low libido", "Other (please specify)"]} 
                otherOption="Other (please specify)"
                otherStateName="symptomsOtherText"
              />

              <div className="mt-8">
                <Label text="Which 2-3 symptoms bother you the most right now?" required />
                <textarea name="worstSymptoms" value={formData.worstSymptoms} onChange={handleChange} rows="3" className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C] shadow-sm" required></textarea>
              </div>
            </div>
          )}

          {/* STEP 3: Treatment */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <SectionHeader title="Section 3: Current Treatment" />
              
              <div className="mb-6">
                <Label text="Are you currently taking thyroid medication?" required />
                <RadioGroup name="takingMedication" options={["Yes", "No", "I was prescribed medication but haven't started yet"]} />
              </div>
              
              {/* Conditional Medication Details block */}
              {formData.takingMedication === "Yes" && (
                <div className="mb-6 animate-fade-in">
                  <Label text="If yes, what medication and dosage?" />
                  <textarea name="medicationDetails" value={formData.medicationDetails} onChange={handleChange} rows="2" className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C] shadow-sm"></textarea>
                </div>
              )}
              
              {/* Always visible Dropdown */}
              <div className="mb-8">
                <Label text="How long have you been on this medication?" required />
                <select name="medicationDuration" value={formData.medicationDuration} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md outline-none bg-white focus:ring-2 focus:ring-[#0F4C5C]" required>
                  <option value="">Select...</option>
                  <option value="Less than 1 month">Less than 1 month</option>
                  <option value="1-3 months">1-3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6-12 months">6-12 months</option>
                  <option value="More than 1 year">More than 1 year</option>
                  <option value="N/A - not on medication">N/A - not on medication</option>
                </select>
              </div>

              <div className="mb-6 border-t border-gray-100 pt-6">
                <Label 
                  text="Are you taking any supplements?" 
                  subtext="List any supplements you currently take, e.g., Vitamin D, Selenium, B12, Iron, etc." 
                  required 
                />
                <textarea name="supplements" value={formData.supplements} onChange={handleChange} rows="3" className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C] shadow-sm" required></textarea>
              </div>
            </div>
          )}

          {/* STEP 4: Labs */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <SectionHeader title="Section 4: Your Labs" />
              <div className="mb-6">
                <Label text="When did you last have thyroid labs done?" required />
                <select name="lastLabs" value={formData.lastLabs} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md outline-none bg-white focus:ring-2 focus:ring-[#0F4C5C]" required>
                  <option value="">Select...</option>
                  <option value="Within the last month">Within the last month</option>
                  <option value="1-3 months ago">1-3 months ago</option>
                  <option value="3-6 months ago">3-6 months ago</option>
                  <option value="More than 6 months ago">More than 6 months ago</option>
                  <option value="Never / don't remember">Never / don't remember</option>
                </select>
              </div>
              <div className="mb-6">
                <Label 
                  text="Please upload your most recent lab results (file upload)" 
                  subtext="If you have trouble uploading, email them to support@alliamd.com" 
                />
                <input type="file" onChange={(e) => setFormData({...formData, labFile: e.target.files[0]})} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#0F4C5C] hover:file:bg-blue-100 cursor-pointer" />
              </div>
              <div className="mb-6">
                <Label text="Have you had any of these additional labs tested?" required />
                <CheckboxGroup category="additionalLabs" options={["Vitamin B12", "Vitamin D", "Ferritin", "Iron / Iron panel", "None of these", "Not sure"]} />
              </div>
            </div>
          )}

          {/* STEP 5: Doctor */}
          {currentStep === 5 && (
            <div className="animate-fade-in">
              <SectionHeader title="Section 5: Your Doctor" />
              <div className="mb-8">
                <Label text="How satisfied are you with your current thyroid care provider?" required />
                <RadioGroup name="providerSatisfaction" options={["1 - Very unsatisfied (feel dismissed, not listened to)", "2 - Unsatisfied", "3 - Neutral", "4 - Satisfied", "5 - Very satisfied"]} />
              </div>
              
              <div className="mb-8">
                <Label text="Do you have any upcoming doctor appointments related to your thyroid?" required />
                <RadioGroup 
                  name="upcomingAppt" 
                  options={["Yes (please share approximate date)", "No", "Not yet scheduled but planning to"]} 
                />
              </div>

              {/* Always visible standalone field */}
              {formData.upcomingAppt === "Yes (please share approximate date)" && (
                <div className="mb-6 animate-fade-in">
                  <Label text="Please share approximate date" />
                  <input 
                    type="date" 
                    name="apptDate" 
                    value={formData.apptDate} 
                    onChange={handleChange} 
                    className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C] shadow-sm max-w-md" 
                    required 
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Lifestyle */}
          {currentStep === 6 && (
            <div className="animate-fade-in">
               <SectionHeader title="Section 6: Lifestyle" />
               <div className="mb-6">
                <Label text="Have you made any dietary changes because of your thyroid condition?" required />
                <CheckboxGroup 
                  category="dietaryChanges" 
                  options={["Gluten-free", "Dairy-free", "Soy-free", "Sugar-free / reduced sugar", "AIP (Autoimmune Protocol)", "Paleo", "No dietary changes yet", "Other (please specify)"]} 
                  otherOption="Other (please specify)"
                  otherStateName="dietOther"
                />
              </div>
              <div className="mb-6">
                <Label text="How would you describe your current stress level? (scale 1-5)" required />
                <RadioGroup name="stressLevel" options={["1 - Very low stress", "2 - Low stress", "3 - Moderate stress", "4 - High stress", "5 - Very high stress"]} />
              </div>
              <div className="mb-6">
                <Label text="How would you rate your sleep quality? (scale 1-5)" required />
                <RadioGroup name="sleepQuality" options={["1 - Very poor", "2 - Poor", "3 - Okay", "4 - Good", "5 - Excellent"]} />
              </div>
              <div className="mb-8">
                <Label text="Do you currently exercise?" required />
                <RadioGroup 
                  name="exercise" 
                  options={["Yes, regularly (3+ times per week)", "Yes, occasionally (1-2 times per week)", "Rarely", "No"]} 
                />
              </div>
              
              {/* Always visible standalone field */}
              {(formData.exercise === "Yes, regularly (3+ times per week)" || formData.exercise === "Yes, occasionally (1-2 times per week)") && (
                <div className="mb-6 animate-fade-in">
                  <Label text="If yes, what type of exercise?" />
                  <textarea 
                    name="exerciseType" 
                    value={formData.exerciseType} 
                    onChange={handleChange} 
                    rows="3" 
                    className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C] shadow-sm"
                  ></textarea>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Goals */}
          {currentStep === 7 && (
            <div className="animate-fade-in">
              <SectionHeader title="Section 7: Goals & Expectations" />
              <div className="mb-6">
                <Label text="What are your top 2-3 goals for the next 3 months?" required />
                <textarea name="topGoals" value={formData.topGoals} onChange={handleChange} rows="3" className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C] shadow-sm" required></textarea>
              </div>
              <div className="mb-6">
                <Label text="What's the #1 thing you want help with right now?" required />
                <RadioGroup 
                  name="topHelp" 
                  options={["Understanding my labs and diagnosis", "Finding a better doctor", "Managing symptoms through lifestyle", "Figuring out the right diet for me", "Tracking my symptoms and seeing patterns", "Having someone to talk to who understands", "Other (please specify)"]} 
                  otherOption="Other (please specify)"
                  otherStateName="topHelpOther"
                />
              </div>
              <div className="mb-6">
                <Label text="Is there anything else you'd like us to know?" />
                <textarea name="anythingElse" value={formData.anythingElse} onChange={handleChange} rows="3" className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C] shadow-sm"></textarea>
              </div>
            </div>
          )}

          {/* STEP 8: Communication */}
          {currentStep === 8 && (
            <div className="animate-fade-in">
              <SectionHeader title="Section 8: Communication Preferences" />
              <div className="mb-6">
                <Label text="Which platform would you prefer for text based check-ins?" required />
                <CheckboxGroup 
                  category="commPlatform" 
                  options={["SMS", "Whatsapp", "Signal", "Other (please specify)"]} 
                  otherOption="Other (please specify)"
                  otherStateName="commPlatformOther"
                />
              </div>
              <div className="mb-6">
                <Label text="What time of day do you prefer check-in messages?" required />
                <RadioGroup name="commTime" options={["Morning (7-9am)", "Midday (11am-1pm)", "Evening (5-7pm)", "No preference"]} />
              </div>
            </div>
          )}

          {/* STEP 9: Basics */}
          {currentStep === 9 && (
            <div className="animate-fade-in">
              <SectionHeader title="Section 9: Basics" />
              <p className="text-gray-600 mb-6">We have some of this from your onboarding call, but want to make sure we have it documented.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label text="Full name" required />
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C]" required />
                </div>
                <div>
                  <Label text="Email address" required />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C]" required />
                </div>
                <div>
                  <Label text="Phone number (for check-ins)" required />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C]" required />
                </div>
                <div>
                  <Label text="Date of birth" required />
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C]" required />
                </div>
              </div>

              <div className="mt-8 mb-6">
                <Label text="Gender" required />
                <RadioGroup 
                  name="gender" 
                  options={["Female", "Male", "Non-binary", "Prefer not to say", "Prefer to self-describe (please specify)"]} 
                  otherOption="Prefer to self-describe (please specify)"
                  otherStateName="genderOther"
                />
              </div>

              <div className="mb-8">
                <Label 
                  text="Location (City, State/Country)" 
                  subtext="Helps with provider recommendations"
                  required 
                />
                <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#0F4C5C]" required />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8">
            <button 
              type="button" 
              onClick={prevStep}
              className={`px-6 py-3 font-semibold rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-100 transition duration-200 ${currentStep === 1 ? 'invisible' : 'visible'}`}
            >
              Back
            </button>

            {currentStep < totalSteps ? (
              <button 
                type="button" 
                onClick={nextStep}
                className="px-8 py-3 bg-[#0F4C5C] text-white font-semibold rounded-lg shadow hover:bg-[#0c3d49] transition duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`px-8 py-3 font-semibold rounded-lg shadow transition duration-200 flex items-center justify-center gap-2 w-full sm:w-auto ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0F4C5C] text-white hover:bg-[#0c3d49]'}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Intake Form'}
                {!isSubmitting && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default RegisterPage;