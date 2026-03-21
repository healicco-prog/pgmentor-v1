import React, { useState, useEffect, useRef } from 'react';
import { Activity, Clock, FileText, Stethoscope, Search, CheckSquare, Brain, MessageSquare, Save, Loader2, AlertCircle, ChevronRight, ChevronLeft, Flag, Lock } from 'lucide-react';
import { generateMedicalContent } from './services/ai';

type ExamState = 'dashboard' | 'active' | 'report';
type ExamStep = 'intro' | 'history' | 'examination' | 'investigation' | 'diagnosis' | 'management' | 'viva';

type SessionData = {
  sessionId?: string;
  specialty: string;
  subspecialty?: string;
  examType: string;
  courseContext?: string;
  caseData?: any;
  startTime?: Date;
  historyLog: { role: 'user' | 'patient', text: string }[];
  examinationLog: { action: string, finding: string }[];
  investigationLog: { test: string, result: string }[];
  diagnosisText: string;
  managementText: string;
  vivaQAs: { question: string, answer: string, score?: number, feedback?: string }[];
  finalReport?: any;
};

export default function ClinicalExaminationSystem({ curriculum, lockedCourseName }: { curriculum?: any[]; lockedCourseName?: string }) {
  const [examState, setExamState] = useState<ExamState>('dashboard');
  const [currentStep, setCurrentStep] = useState<ExamStep>('intro');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard selections
  const [examType, setExamType] = useState('OSCE Station');
  const defaultSpecialty = lockedCourseName || (curriculum && curriculum.length > 0 ? curriculum[0].name : 'General Medicine');
  const [specialty, setSpecialty] = useState(defaultSpecialty);
  // Active session data
  const [sessionData, setSessionData] = useState<SessionData>({
    specialty: '',
    examType: '',
    historyLog: [],
    examinationLog: [],
    investigationLog: [],
    diagnosisText: '',
    managementText: '',
    vivaQAs: []
  });

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutes Default
  const [timerActive, setTimerActive] = useState(false);

  // Sync specialty with locked course name when it arrives
  useEffect(() => {
    if (lockedCourseName) {
      setSpecialty(lockedCourseName);
    }
  }, [lockedCourseName]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setTimerActive(false);
      // Auto-submit or show warning
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartExam = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // 1. Generate Case via AI
      const prompt = `
        Generate a comprehensive clinical case scenario for a postgraduate medical exam.
        Specialty: ${specialty}
        Exam Type: ${examType}
        
        Return a JSON object strictly matching this format:
        {
          "patientProfile": {
            "name": "String", "age": "String", "gender": "String", "chiefComplaint": "String", "briefBackground": "String"
          },
          "clinicalTruth": {
            "detailedHistory": "Secret ground truth for the patient to answer history questions from",
            "physicalFindings": "Secret ground truth for examination findings (e.g., CVS, RS, PA, CNS)",
            "investigationResults": "Secret ground truth for lab/imaging results",
            "correctDiagnosis": "The actual diagnosis",
            "recommendedManagement": "The evidence-based management plan"
          },
          "instructions": "Specific instructions for the candidate (e.g., 'You have 10 minutes to take a focused history and perform a relevant examination.')",
          "timeLimitMinutes": 10
        }
      `;
      
      const content = await generateMedicalContent(prompt, specialty);
      
      let caseData;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        caseData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse AI case generation:", content);
        throw new Error("Failed to generate a valid case scenario.");
      }

      const newSession = {
        specialty,
        examType,
        caseData,
        startTime: new Date(),
        historyLog: [],
        examinationLog: [],
        investigationLog: [],
        diagnosisText: '',
        managementText: '',
        vivaQAs: []
      };

      setSessionData(newSession);
      setTimeRemaining(caseData.timeLimitMinutes * 60);
      setExamState('active');
      setCurrentStep('intro');
      
      // Start Backend Session
      try {
        await fetch('/api/clinical-exam/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `sess_${Date.now()}`,
            specialty,
            examType,
            caseData: caseData.patientProfile
          })
        });
      } catch (e) {
        console.warn('Backend unavailable, running locally', e);
      }
      
    } catch (err: any) {
      setError(err.message || "An error occurred starting the exam.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Step Components ---

  const renderDashboard = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-blue-500/10 rounded-xl rounded-tr-sm rounded-bl-sm">
          <Activity className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Clinical Examination System</h1>
          <p className="text-slate-400">AI-powered simulated clinical cases, OSCEs, and performance evaluation.</p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
          <CheckSquare className="w-5 h-5 text-blue-400 mr-2" />
          Start New Examination
        </h2>
        
        {lockedCourseName && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3 mb-4">
            <span className="text-lg">🔒</span>
            <div className="flex-1"><span className="text-sm font-semibold text-blue-300">Locked to: </span><span className="text-sm font-bold text-white">{lockedCourseName}</span></div>
            <span className="text-xs text-slate-400">Change in Dashboard</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Specialty {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}</label>
            <div className="relative">
              <select 
                value={specialty} 
                onChange={(e) => { if (!lockedCourseName) setSpecialty(e.target.value); }}
                disabled={!!lockedCourseName}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {curriculum && curriculum.length > 0 ? (
                  curriculum.map((course: any, idx: number) => (
                    <option key={idx} value={course.name}>{course.name}</option>
                  ))
                ) : (
                  <>
                    <option value="General Medicine">General Medicine</option>
                    <option value="General Surgery">General Surgery</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                  </>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                {lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Examination Type</label>
            <select 
              value={examType} 
              onChange={(e) => setExamType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="OSCE Station">OSCE Station</option>
              <option value="Short Case">Short Case Examination</option>
              <option value="Long Case">Long Case Examination</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start text-red-400">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleStartExam}
          disabled={isGenerating}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all flex items-center justify-center disabled:opacity-50"
        >
          {isGenerating ? (
            <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Generating Case Scenario...</>
          ) : (
            <><Activity className="w-5 h-5 mr-3" /> Mount Exam Station</>
          )}
        </button>
      </div>

      <PastPerformanceReports />
    </div>
  );

  const renderActiveExam = () => {
    return (
      <div className="max-w-6xl mx-auto h-[85vh] flex flex-col">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between bg-slate-800 p-4 rounded-t-xl border border-slate-700">
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium border border-blue-500/30">
              {sessionData.examType}
            </span>
            <span className="text-slate-300 font-medium">{sessionData.specialty}</span>
          </div>
          <div className={`flex items-center px-4 py-2 rounded-lg font-mono text-lg font-bold border ${timeRemaining < 120 ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' : 'bg-slate-900 text-emerald-400 border-slate-700'}`}>
            <Clock className="w-5 h-5 mr-2 opacity-75" />
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden border-x border-b border-slate-700 rounded-b-xl bg-slate-900">
          
          {/* Sidebar Navigation */}
          <div className="w-64 bg-slate-800/50 border-r border-slate-700 flex flex-col p-4 space-y-2 overflow-y-auto">
             <StepNav 
               id="intro" label="Instructions" icon={<Flag size={18} />} 
               current={currentStep} onSelect={setCurrentStep} 
             />
             <StepNav 
               id="history" label="History Station" icon={<MessageSquare size={18} />} 
               current={currentStep} onSelect={setCurrentStep} 
             />
             <StepNav 
               id="examination" label="Clinical Exam" icon={<Stethoscope size={18} />} 
               current={currentStep} onSelect={setCurrentStep} 
             />
             <StepNav 
               id="investigation" label="Investigations" icon={<Activity size={18} />} 
               current={currentStep} onSelect={setCurrentStep} 
             />
             <StepNav 
               id="diagnosis" label="Diagnosis" icon={<Brain size={18} />} 
               current={currentStep} onSelect={setCurrentStep} 
             />
             <StepNav 
               id="management" label="Management Plan" icon={<FileText size={18} />} 
               current={currentStep} onSelect={setCurrentStep} 
             />
             <StepNav 
               id="viva" label="Viva Voce" icon={<MessageSquare size={18} />} 
               current={currentStep} onSelect={setCurrentStep} 
             />
             
             <div className="mt-auto pt-8">
               <button 
                onClick={() => handleFinishExam()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
               >
                 <CheckSquare className="w-5 h-5 mr-2" /> Finish Exam
               </button>
             </div>
          </div>
          
          {/* Panel Content */}
          <div className="flex-1 bg-slate-900 relative">
             <div className="absolute inset-0 overflow-y-auto p-8">
               {currentStep === 'intro' && <IntroPanel sessionData={sessionData} onStart={() => {setTimerActive(true); setCurrentStep('history');}} />}
               {currentStep === 'history' && <HistoryPanel sessionData={sessionData} setSessionData={setSessionData} />}
               {currentStep === 'examination' && <ExaminationPanel sessionData={sessionData} setSessionData={setSessionData} />}
               {currentStep === 'investigation' && <InvestigationPanel sessionData={sessionData} setSessionData={setSessionData} />}
               {currentStep === 'diagnosis' && <DiagnosisPanel sessionData={sessionData} setSessionData={setSessionData} onNext={() => setCurrentStep('management')} />}
               {currentStep === 'management' && <ManagementPanel sessionData={sessionData} setSessionData={setSessionData} onNext={() => setCurrentStep('viva')} />}
               {currentStep === 'viva' && <VivaPanel sessionData={sessionData} setSessionData={setSessionData} />}
             </div>
          </div>

        </div>
      </div>
    );
  };

  const handleFinishExam = async () => {
    // Generate Evaluation
    setIsGenerating(true);
    setTimerActive(false);
    try {
      const prompt = `
        You are an expert medical examiner evaluating a candidate's performance in a clinical exam.
        Evaluate the following student's full performance against the clinical ground truth.
        
        Ground Truth Case Data:
        ${JSON.stringify(sessionData.caseData.clinicalTruth)}
        
        Student's Performance:
        - History Log: ${JSON.stringify(sessionData.historyLog)}
        - Examination Log: ${JSON.stringify(sessionData.examinationLog)}
        - Investigations Ordered: ${JSON.stringify(sessionData.investigationLog)}
        - Diagnosis Submitted: ${sessionData.diagnosisText}
        - Management Plan Submitted: ${sessionData.managementText}
        - Viva Responses: ${JSON.stringify(sessionData.vivaQAs)}
        
        Generate a detailed evaluation strictly in this JSON format:
        {
          "scores": {
            "history": number (out of 15),
            "examination": number (out of 15),
            "reasoning": number (out of 20),
            "investigations": number (out of 15),
            "management": number (out of 20),
            "viva": number (out of 15)
          },
          "totalScore": number (out of 100),
          "feedback": {
            "history": "String",
            "examination": "String",
            "reasoning": "String",
            "investigations": "String",
            "management": "String"
          },
          "recommendations": ["Topic 1", "Topic 2", "Topic 3"]
        }
      `;
      
      const content = await generateMedicalContent(prompt, specialty);
      
      let reportData;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        reportData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      } catch (e) {
        throw new Error("Failed to parse evaluation.");
      }

      setSessionData(prev => ({ ...prev, finalReport: reportData }));
      setExamState('report');
      
      // Save Report to Supabase
      try {
        const saveId = `clin_${Date.now()}`;
        const savePayload = {
          id: saveId,
          user_id: 'default',
          specialty: sessionData.specialty,
          exam_type: sessionData.examType,
          case_data: sessionData.caseData,
          history_log: sessionData.historyLog,
          examination_log: sessionData.examinationLog,
          investigation_log: sessionData.investigationLog,
          diagnosis_text: sessionData.diagnosisText,
          management_text: sessionData.managementText,
          viva_qas: sessionData.vivaQAs,
          final_report: reportData,
          total_score: reportData.totalScore,
          content: `Clinical Exam: ${sessionData.specialty} - ${sessionData.examType} | Score: ${reportData.totalScore}/100`,
          date: new Date().toISOString()
        };

        const saveRes = await fetch('/api/clinical-examination-system', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savePayload)
        });
        
        if (saveRes.ok) {
          console.log('✅ Clinical exam saved to Supabase successfully');
        } else {
          console.error('❌ Failed to save clinical exam to Supabase');
        }
      } catch (saveErr) {
        console.error('Error saving clinical exam:', saveErr);
      }
      
    } catch (e) {
      console.error(e);
      alert("Evaluation generation failed.");
      setExamState('dashboard');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderReport = () => {
    if (!sessionData.finalReport) return null;
    const { scores, totalScore, feedback, recommendations } = sessionData.finalReport;
    
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Examination Report</h1>
            <p className="text-slate-400">Detailed breakdown of your clinical performance.</p>
          </div>
          <div className="text-center p-4 bg-slate-800 border border-slate-700 rounded-xl">
            <div className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-1">Total Score</div>
            <div className={`text-4xl font-black ${totalScore >= 75 ? 'text-emerald-400' : totalScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {totalScore} <span className="text-lg text-slate-500">/ 100</span>
            </div>
          </div>
        </div>
        
        {/* Breakdown */}
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
           <h2 className="text-xl font-bold text-white mb-6">Score Breakdown</h2>
           <div className="space-y-4">
             <ScoreRow label="History Taking" score={scores.history} total={15} feedback={feedback.history} />
             <ScoreRow label="Clinical Examination" score={scores.examination} total={15} feedback={feedback.examination} />
             <ScoreRow label="Clinical Reasoning" score={scores.reasoning} total={20} feedback={feedback.reasoning} />
             <ScoreRow label="Investigative Approach" score={scores.investigations} total={15} feedback={feedback.investigations} />
             <ScoreRow label="Management Plan" score={scores.management} total={20} feedback={feedback.management} />
             <ScoreRow label="Viva Voce" score={scores.viva} total={15} feedback={"Evaluated strictly on conceptual accuracy."} />
           </div>
        </div>
        
        {/* Recommendations */}
        <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/20">
           <h2 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
             <Brain className="w-5 h-5 mr-2" /> Learning Recommendations
           </h2>
           <ul className="list-disc pl-5 space-y-2 text-slate-300">
             {recommendations.map((rec: string, i: number) => (
               <li key={i}>{rec}</li>
             ))}
           </ul>
        </div>
        
        <button
          onClick={() => setExamState('dashboard')}
          className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] p-4 md:p-8 overflow-y-auto">
      {examState === 'dashboard' && renderDashboard()}
      {examState === 'active' && renderActiveExam()}
      {examState === 'report' && renderReport()}
    </div>
  );
}

// --- Past Performance Reports Component ---

const PastPerformanceReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/clinical-examination-system');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (e) {
      console.error('Error fetching reports:', e);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exam report?')) return;
    try {
      await fetch(`/api/clinical-examination-system/${id}`, { method: 'DELETE' });
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('Error deleting report:', e);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
        <FileText className="w-5 h-5 text-emerald-400 mr-2" />
        Past Performance Reports
      </h2>
      {isLoadingReports ? (
        <div className="text-center p-8 text-slate-400">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-xl">
          <p className="text-slate-400">Your examination history will appear here once you complete a session.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const score = report.total_score || report.final_report?.totalScore || 0;
            const scoreColor = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
            return (
              <div key={report.id} className="p-5 bg-slate-900 border border-slate-700 rounded-xl hover:border-blue-500/30 transition-colors group relative">
                <button 
                  onClick={() => handleDelete(report.id)}
                  className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  ✕
                </button>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{report.exam_type || 'OSCE'}</span>
                  <span className={`text-2xl font-black ${scoreColor}`}>{score}<span className="text-sm text-slate-500">/100</span></span>
                </div>
                <h3 className="text-white font-medium mb-1">{report.specialty || 'General Medicine'}</h3>
                <p className="text-slate-500 text-xs">{new Date(report.created_at).toLocaleDateString()} · {new Date(report.created_at).toLocaleTimeString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Helper Components ---

const StepNav = ({ id, label, icon, current, onSelect }: any) => (
  <button
    onClick={() => onSelect(id)}
    className={`flex items-center space-x-3 w-full p-3 rounded-lg text-left transition-all ${current === id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'}`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const ScoreRow = ({ label, score, total, feedback }: any) => (
  <div className="border-b border-slate-700/50 pb-4 last:border-0">
    <div className="flex justify-between items-center mb-2">
      <span className="text-white font-medium">{label}</span>
      <span className="text-slate-300 font-mono">{score} / {total}</span>
    </div>
    {/* Simple progress bar */}
    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden mb-2">
      <div 
        className="h-full bg-blue-500 transition-all" 
        style={{ width: `${(score / total) * 100}%` }}
      />
    </div>
    <p className="text-sm text-slate-400 leading-relaxed">{feedback}</p>
  </div>
);

// --- Step Content Panels (Placeholders for now, to be expanded) ---

const IntroPanel = ({ sessionData, onStart }: any) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white mb-2">Station Instructions</h2>
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
      <p className="text-lg text-slate-300 italic mb-6">"{sessionData.caseData?.instructions}"</p>
      
      <div className="space-y-4 text-slate-400">
        <h3 className="text-white font-medium">Patient Details:</h3>
        <p><strong>Name:</strong> {sessionData.caseData?.patientProfile?.name}</p>
        <p><strong>Age/Gender:</strong> {sessionData.caseData?.patientProfile?.age} {sessionData.caseData?.patientProfile?.gender}</p>
        <p><strong>Chief Complaint:</strong> {sessionData.caseData?.patientProfile?.chiefComplaint}</p>
      </div>
    </div>
    
    <button onClick={onStart} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors">
      Start Examination & Timer
    </button>
  </div>
);


// In a full implementation, these panels would be rich interactive components.
// For this scaffolding, we provide basic text interaction.

const HistoryPanel = ({ sessionData, setSessionData }: any) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionData.historyLog]);

  const handleAsk = async () => {
    if(!input.trim()) return;
    setIsLoading(true);
    const newLog = [...sessionData.historyLog, { role: 'user', text: input }];
    setSessionData({ ...sessionData, historyLog: newLog });
    const userQ = input;
    setInput('');

    try {
      const prompt = `
        You are simulating the patient for a clinical exam.
        Patient Profile: ${JSON.stringify(sessionData.caseData.patientProfile)}
        Secret Ground Truth History: ${sessionData.caseData.clinicalTruth.detailedHistory}
        
        The doctor asks: "${userQ}"
        
        Respond naturally as the patient. Do not reveal information they did not ask for. Only base it on the ground truth.
      `;
      const response = await generateMedicalContent(prompt, "Simulated Patient");
      
      setSessionData((prev: any) => ({
        ...prev,
        historyLog: [...prev.historyLog, { role: 'patient', text: response }]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <h2 className="text-xl font-bold text-white mb-2">History Taking</h2>
      
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-4 overflow-y-auto space-y-4 min-h-[400px]">
        {sessionData.historyLog.length === 0 && (
          <div className="text-center text-slate-500 mt-10">Start by asking the patient a question.</div>
        )}
        {sessionData.historyLog.map((log: any, idx: number) => (
          <div key={idx} className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${log.role === 'user' ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30' : 'bg-slate-700/50 text-slate-200 border border-slate-600'}`}>
              <span className="text-xs font-bold uppercase opacity-50 block mb-1">{log.role === 'user' ? 'You' : 'Patient'}</span>
              {log.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-slate-700/50 text-slate-400 border border-slate-600 p-3 rounded-lg flex items-center">
               <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Patient is thinking...
             </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex space-x-2">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Type your question here..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleAsk} disabled={isLoading} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
          Ask
        </button>
      </div>
    </div>
  );
};

// Extremely simplified versions of the other panels for the scaffolding

const ExaminationPanel = ({ sessionData, setSessionData }: any) => {
  const [action, setAction] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExamine = async () => {
    if(!action.trim()) return;
    setIsLoading(true);
    
    try {
      const prompt = `
        You are the examiner simulator. The candidate performs: "${action}"
        Secret Ground Truth Findings: ${sessionData.caseData.clinicalTruth.physicalFindings}
        
        Respond with the simulated clinical finding for this specific action. Be brief and objective.
      `;
      const response = await generateMedicalContent(prompt, "Examiner");
      
      setSessionData((prev: any) => ({
        ...prev,
        examinationLog: [...prev.examinationLog, { action, finding: response }]
      }));
      setAction('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-2">Clinical Examination</h2>
      <div className="flex space-x-2">
        <input 
          type="text" value={action} onChange={(e) => setAction(e.target.value)}
          placeholder="e.g. Auscultate chest, Palpate abdomen"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
        />
        <button onClick={handleExamine} disabled={isLoading} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">Examine</button>
      </div>
      
      <div className="space-y-2">
        {sessionData.examinationLog.map((log: any, idx: number) => (
          <div key={idx} className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <div className="text-slate-400 font-medium mb-1 flex items-center">
              <ChevronRight className="w-4 h-4 mr-1"/> Action: {log.action}
            </div>
            <div className="text-white bg-slate-900/50 p-2 rounded"><strong>Finding:</strong> {log.finding}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InvestigationPanel = ({ sessionData, setSessionData }: any) => {
  const [test, setTest] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOrder = async () => {
    if(!test.trim()) return;
    setIsLoading(true);
    
    try {
      const prompt = `
        You are the lab/radiology simulator. The candidate orders: "${test}"
        Secret Ground Truth: ${sessionData.caseData.clinicalTruth.investigationResults}
        
        Respond with the simulated result for this test.
      `;
      const response = await generateMedicalContent(prompt, "Lab");
      
      setSessionData((prev: any) => ({
        ...prev,
        investigationLog: [...prev.investigationLog, { test, result: response }]
      }));
      setTest('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-2">Order Investigations</h2>
      <div className="flex space-x-2">
        <input 
          type="text" value={test} onChange={(e) => setTest(e.target.value)}
          placeholder="e.g. ECG, Complete Blood Count, Chest X-Ray"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
        />
        <button onClick={handleOrder} disabled={isLoading} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">Order Test</button>
      </div>
      <div className="space-y-2">
        {sessionData.investigationLog.map((log: any, idx: number) => (
          <div key={idx} className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <div className="text-slate-400 font-medium mb-1">Test: {log.test}</div>
            <div className="text-white bg-slate-900/50 p-2 rounded"><strong>Result:</strong> {log.result}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DiagnosisPanel = ({ sessionData, setSessionData, onNext }: any) => (
  <div className="space-y-6 flex flex-col h-full">
    <h2 className="text-xl font-bold text-white mb-2">Diagnosis Formulation</h2>
    <div className="flex-1">
      <label className="block text-sm font-medium text-slate-300 mb-2">Write your differential diagnoses and most likely diagnosis:</label>
      <textarea 
        value={sessionData.diagnosisText}
        onChange={(e) => setSessionData({...sessionData, diagnosisText: e.target.value})}
        className="w-full h-64 bg-slate-800 border border-slate-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-blue-500"
        placeholder="1. Differential Diagnosis 1...\n2. Differential Diagnosis 2...\n\nMost Likely Diagnosis: ..."
      />
    </div>
    <div className="flex justify-end pt-4">
      <button onClick={onNext} className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">Next: Management</button>
    </div>
  </div>
);

const ManagementPanel = ({ sessionData, setSessionData, onNext }: any) => (
  <div className="space-y-6 flex flex-col h-full">
    <h2 className="text-xl font-bold text-white mb-2">Management Plan</h2>
    <div className="flex-1">
      <label className="block text-sm font-medium text-slate-300 mb-2">Detail your comprehensive management plan (immediate, long-term, counseling):</label>
      <textarea 
        value={sessionData.managementText}
        onChange={(e) => setSessionData({...sessionData, managementText: e.target.value})}
        className="w-full h-64 bg-slate-800 border border-slate-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-blue-500"
        placeholder="Immediate Management:\n- ...\n\nLong-term Management:\n- ...\n\nPatient Counseling:\n- ..."
      />
    </div>
    <div className="flex justify-end pt-4">
      <button onClick={onNext} className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">Next: Viva Voce</button>
    </div>
  </div>
);

const VivaPanel = ({ sessionData, setSessionData }: any) => {
  const [vivaQuestion, setVivaQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Generate an initial viva question if empty
    if(sessionData.vivaQAs.length === 0 && !isLoading) {
      generateQuestion();
    }
  }, []);

  const generateQuestion = async () => {
    setIsLoading(true);
    try {
      const prompt = `
        You are the examiner. The candidate has submitted a diagnosis: "${sessionData.diagnosisText}"
        Ground Truth Diagnosis: ${sessionData.caseData.clinicalTruth.correctDiagnosis}
        
        Generate ONE critical thinking viva question to ask the candidate about this case (pathophysiology, guidelines, or complication management).
      `;
      const response = await generateMedicalContent(prompt, "Examiner");
      setVivaQuestion(response);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if(!answer.trim()) return;
    setSessionData((prev: any) => ({
      ...prev,
      vivaQAs: [...prev.vivaQAs, { question: vivaQuestion, answer }]
    }));
    setVivaQuestion(''); 
    generateQuestion(); // Get next question
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-2">Viva Voce</h2>
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div className="mb-4">
          <h3 className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2">Examiner Asks:</h3>
          {isLoading ? (
            <div className="flex items-center text-slate-400"><Loader2 className="animate-spin mr-2"/> Formulating question...</div>
          ) : (
            <p className="text-lg text-white font-medium">{vivaQuestion}</p>
          )}
        </div>
        
        {!isLoading && vivaQuestion && (
          <div className="mt-6">
            <textarea 
              id="vivaAnswerInput"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white mb-2"
              placeholder="Your answer..."
              rows={3}
            />
            <button 
              onClick={() => {
                const input = document.getElementById('vivaAnswerInput') as HTMLTextAreaElement;
                handleAnswer(input.value);
                input.value = '';
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500"
            >
              Submit Answer
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Previous Q&A Log</h3>
        {sessionData.vivaQAs.map((qa: any, idx: number) => (
          <div key={idx} className="bg-slate-800/50 p-4 border border-slate-700/50 rounded-lg">
            <p className="text-blue-400 font-medium mb-1">Q: {qa.question}</p>
            <p className="text-slate-300">A: {qa.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
