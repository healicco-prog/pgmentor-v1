import React, { useState, useRef, useEffect } from 'react';
import {
  Stethoscope, Send, Loader2, Save, RotateCcw, Upload, X, Plus,
  Activity, Heart, Thermometer, FileText, AlertTriangle, CheckCircle,
  ChevronRight, Clipboard, Brain
} from 'lucide-react';
import { generateMedicalContent } from './services/ai';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  type?: 'complaint' | 'request-info' | 'user-info' | 'analysis' | 'diagnosis' | 'followup';
}

interface ClinicalDecisionSupportProps {
  onSave: (data: { patient_data: string; recommendations: string }) => Promise<void>;
}

export default function ClinicalDecisionSupport({ onSave }: ClinicalDecisionSupportProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [step, setStep] = useState<'idle' | 'complaints-sent' | 'info-requested' | 'analyzing' | 'diagnosis-ready'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Build full conversation context for AI
  const buildConversationContext = () => {
    return messages.map(m => `${m.role === 'user' ? 'CLINICIAN' : 'CDS-AI'}: ${m.content}`).join('\n\n');
  };

  const addMessage = (role: 'user' | 'ai' | 'system', content: string, type?: Message['type']): Message => {
    const msg: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      role,
      content,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  // Step 1: User sends chief complaints
  const handleSendComplaints = async () => {
    if (!userInput.trim() && uploadedImages.length === 0) return;

    const complaintsText = userInput.trim();
    addMessage('user', complaintsText, 'complaint');
    setUserInput('');
    setIsThinking(true);
    setStep('complaints-sent');

    const systemInstruction = `You are an AI-based Clinical Decision Support System (CDS). A clinician has provided the following chief complaints/symptoms. Your task is to ask for SPECIFIC additional information needed for clinical decision-making.

IMPORTANT INSTRUCTIONS:
- Analyze the symptoms and determine what additional data is needed
- Ask for specific information organized by category (Vitals, History, Lab Results, Imaging, Current Medications, etc.)
- Be specific about what values/tests you need (e.g., "Blood pressure", "Heart rate", "Troponin levels", "ECG findings")
- Format your response clearly with numbered categories
- Keep it concise and clinically relevant
- Do NOT provide a diagnosis yet
- End with: "Please provide the above information for a comprehensive clinical analysis."

Format your response as:

## Additional Information Required

### 1. Vital Signs
- [specific vitals needed]

### 2. Relevant History
- [specific history needed]

### 3. Laboratory Investigations
- [specific labs needed]

### 4. Imaging / Diagnostics
- [specific imaging needed]

### 5. Current Medications & Allergies
- [specific medication info needed]`;

    try {
      const prompt = `Patient presents with: ${complaintsText}`;
      const resp = await generateMedicalContent(prompt, systemInstruction);
      addMessage('ai', resp, 'request-info');
      setStep('info-requested');
    } catch (e) {
      console.error('CDS Error:', e);
      addMessage('system', 'Error generating response. Please try again.', 'followup');
      setStep('idle');
    } finally {
      setIsThinking(false);
    }
  };

  // Step 2+: User provides requested information
  const handleSendInfo = async () => {
    if (!userInput.trim() && uploadedImages.length === 0) return;

    const infoText = userInput.trim();
    addMessage('user', infoText, 'user-info');
    setUserInput('');
    setIsThinking(true);
    setStep('analyzing');

    const conversationContext = buildConversationContext();

    const systemInstruction = `You are an AI-based Clinical Decision Support System (CDS). You have been in a conversation with a clinician. Below is the full conversation so far.

Based on ALL the information provided, you must now do ONE of the following:

OPTION A — If you have ENOUGH information for a clinical assessment:
Provide a comprehensive clinical decision analysis with these sections:

## Clinical Decision Analysis

### 1. Summary of Patient Data
Summarize all key findings from the conversation.

### 2. Probable Diagnosis
State the most likely diagnosis with reasoning.

### 3. Differential Diagnoses
List 3-5 differential diagnoses ranked by likelihood, each with:
- Diagnosis name
- Supporting evidence from patient data
- Likelihood estimate (High/Medium/Low)

### 4. Recommended Investigations
List any additional tests to confirm the diagnosis.

### 5. Suggested Management Plan
- Immediate actions
- Medications (with dosages if applicable)
- Monitoring parameters
- Referrals needed

### 6. Red Flags & Alerts
List any critical alerts, drug interactions, or urgent concerns.

> **Disclaimer:** This CDS system assists but does not replace clinical judgment. All decisions should be verified by the treating physician and documented in the EMR.

OPTION B — If CRITICAL information is still MISSING:
Ask specific follow-up questions about what's missing. Be brief and focused.
Start with: "## Additional Information Needed" and list the specific items.

CONVERSATION SO FAR:
${conversationContext}

NEW INFORMATION FROM CLINICIAN:
${infoText}`;

    try {
      const resp = await generateMedicalContent(
        `Continue clinical decision support analysis. New information: ${infoText}`,
        systemInstruction
      );

      // Determine if this is a diagnosis or a follow-up request
      const isDiagnosis = resp.includes('Probable Diagnosis') || resp.includes('Differential Diagnos') || resp.includes('Management Plan');
      
      if (isDiagnosis) {
        addMessage('ai', resp, 'diagnosis');
        setStep('diagnosis-ready');
      } else {
        addMessage('ai', resp, 'followup');
        setStep('info-requested');
      }
    } catch (e) {
      console.error('CDS Error:', e);
      addMessage('system', 'Error generating response. Please try again.', 'followup');
      setStep('info-requested');
    } finally {
      setIsThinking(false);
    }
  };

  const handleSend = () => {
    if (step === 'idle') {
      handleSendComplaints();
    } else {
      handleSendInfo();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUploadedImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveSession = async () => {
    setIsSaving(true);
    try {
      const allUserMessages = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n---\n\n');
      const allAiMessages = messages.filter(m => m.role === 'ai').map(m => m.content).join('\n\n---\n\n');
      await onSave({
        patient_data: allUserMessages,
        recommendations: allAiMessages
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Error saving CDS session:', e);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setStep('idle');
    setUserInput('');
    setUploadedImages([]);
    setSaved(false);
  };

  // Render formatted AI text with markdown-like parsing
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    const formatInline = (str: string) => {
      const parts: React.ReactNode[] = [];
      const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
      let last = 0;
      let match;
      let key = 0;
      while ((match = regex.exec(str)) !== null) {
        if (match.index > last) parts.push(str.slice(last, match.index));
        if (match[2]) parts.push(<strong key={key++} className="text-white font-semibold">{match[2]}</strong>);
        else if (match[3]) parts.push(<em key={key++} className="text-blue-800">{match[3]}</em>);
        last = match.index + match[0].length;
      }
      if (last < str.length) parts.push(str.slice(last));
      return parts.length > 0 ? parts : [str];
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        elements.push(<div key={i} className="h-2" />);
        return;
      }

      // H2 heading
      if (trimmed.startsWith('## ')) {
        elements.push(
          <div key={i} className="mt-5 mb-3 first:mt-0">
            <h4 className="text-blue-700 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              {formatInline(trimmed.replace(/^##\s+/, ''))}
            </h4>
          </div>
        );
        return;
      }

      // H3 heading
      if (trimmed.startsWith('### ')) {
        elements.push(
          <div key={i} className="mt-4 mb-2">
            <h5 className="text-emerald-700 font-bold text-[13px] flex items-center gap-2">
              <ChevronRight size={14} className="text-emerald-500" />
              {formatInline(trimmed.replace(/^###\s+/, ''))}
            </h5>
          </div>
        );
        return;
      }

      // Section heading (line ending with :)
      if (trimmed.endsWith(':') && trimmed.length < 100 && !trimmed.startsWith('-') && !trimmed.startsWith('*') && !trimmed.match(/^\d+\./)) {
        elements.push(
          <div key={i} className="mt-4 mb-2">
            <h5 className="text-amber-700 font-semibold text-[13px]">
              {formatInline(trimmed.slice(0, -1))}
            </h5>
          </div>
        );
        return;
      }

      // Numbered list
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={i} className="flex gap-3 mb-2.5 pl-1">
            <span className="w-6 h-6 bg-blue-500/15 text-blue-700 text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">{numMatch[1]}</span>
            <p className="text-slate-300 text-[13.5px] leading-relaxed flex-1">{formatInline(numMatch[2])}</p>
          </div>
        );
        return;
      }

      // Bullet points
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || (trimmed.startsWith('*') && !trimmed.startsWith('**'))) {
        const bulletText = trimmed.replace(/^[-•*]\s*/, '');
        elements.push(
          <div key={i} className="flex gap-3 mb-2 pl-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
            <p className="text-slate-300 text-[13.5px] leading-relaxed flex-1">{formatInline(bulletText)}</p>
          </div>
        );
        return;
      }

      // Blockquote / disclaimer
      if (trimmed.startsWith('>')) {
        elements.push(
          <div key={i} className="border-l-2 border-amber-500/50 pl-4 py-2 my-3 bg-amber-500/5 rounded-r-lg">
            <p className="text-amber-800/80 text-[12px] leading-relaxed italic">{formatInline(trimmed.replace(/^>\s*\**/, '').replace(/\**$/, ''))}</p>
          </div>
        );
        return;
      }

      // Regular paragraph
      elements.push(
        <p key={i} className="text-slate-300 text-[13.5px] leading-relaxed mb-1.5">{formatInline(trimmed)}</p>
      );
    });

    return elements;
  };

  const getStepLabel = () => {
    switch (step) {
      case 'idle': return 'Describe the patient\'s chief complaints';
      case 'complaints-sent': return 'Analyzing complaints...';
      case 'info-requested': return 'Provide the requested information';
      case 'analyzing': return 'Analyzing clinical data...';
      case 'diagnosis-ready': return 'Clinical analysis complete';
      default: return '';
    }
  };

  const getPlaceholder = () => {
    if (step === 'idle') return 'E.g., 65-year-old male with acute chest pain radiating to left arm, sweating, nausea for 2 hours...';
    return 'Type your response with the requested clinical information...';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-white/10 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Stethoscope className="text-emerald-500" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Clinical Decision Support</h2>
              <p className="text-slate-400 text-xs mt-0.5">AI-Powered Evidence-Based Clinical Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step === 'diagnosis-ready' && (
              <button
                onClick={handleSaveSession}
                disabled={isSaving || saved}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                  saved 
                    ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                }`}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
                {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save to Database'}
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <RotateCcw size={14} /> New Session
              </button>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mt-4">
          {['Chief Complaints', 'Data Collection', 'Analysis', 'Diagnosis'].map((label, i) => {
            const stepMap = ['idle', 'info-requested', 'analyzing', 'diagnosis-ready'];
            const currentIdx = stepMap.indexOf(step);
            const isActive = i <= currentIdx || (step === 'complaints-sent' && i === 0);
            const isCurrent = (i === currentIdx) || (step === 'complaints-sent' && i === 0) || (step === 'info-requested' && i === 1);
            return (
              <React.Fragment key={label}>
                {i > 0 && <div className={`flex-1 h-0.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-700'} transition-colors`} />}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all ${
                  isCurrent ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30' :
                  isActive ? 'text-emerald-500' : 'text-slate-500'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>{i + 1}</div>
                  <span className="hidden md:inline">{label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4 custom-scrollbar">
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6">
              <Brain className="text-emerald-500" size={36} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Clinical Decision Support System</h3>
            <p className="text-slate-400 text-sm max-w-lg leading-relaxed mb-8">
              Describe the patient's chief complaints and symptoms. The system will guide you through a structured clinical assessment and provide evidence-based diagnostic recommendations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl w-full">
              {[
                { icon: <Activity size={18} />, label: 'Symptom Analysis', desc: 'AI analyzes presenting complaints' },
                { icon: <Clipboard size={18} />, label: 'Structured Assessment', desc: 'Guided clinical data collection' },
                { icon: <Heart size={18} />, label: 'Diagnostic Output', desc: 'Differential diagnoses & plan' }
              ].map((item, i) => (
                <div key={i} className="bg-slate-900/50 border border-white/5 rounded-xl p-4 text-left">
                  <div className="text-emerald-500 mb-2">{item.icon}</div>
                  <div className="text-white text-sm font-semibold mb-1">{item.label}</div>
                  <div className="text-slate-500 text-xs">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
          >
            <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? '' : ''}`}>
              {/* Role label */}
              <div className={`flex items-center gap-2 mb-1.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Stethoscope size={12} className="text-emerald-700" />
                  </div>
                )}
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  msg.role === 'user' ? 'text-blue-700' : msg.role === 'ai' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {msg.role === 'user' ? 'Clinician' : msg.role === 'ai' ? 'CDS Analysis' : 'System'}
                </span>
                <span className="text-slate-600 text-[10px]">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Message bubble */}
              <div className={`rounded-2xl p-5 ${
                msg.role === 'user' 
                  ? 'bg-blue-600/15 border border-blue-500/20 text-blue-100' 
                  : msg.role === 'system'
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
                  : msg.type === 'diagnosis'
                  ? 'bg-gradient-to-br from-slate-900 to-slate-800 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                  : 'bg-slate-900 border border-white/5'
              }`}>
                {msg.type === 'diagnosis' && (
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-emerald-500/20">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle size={16} className="text-emerald-700" />
                    </div>
                    <div>
                      <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Clinical Decision Analysis</div>
                      <div className="text-slate-500 text-[10px]">Evidence-based assessment complete</div>
                    </div>
                  </div>
                )}
                {msg.type === 'request-info' && (
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-500/20">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <FileText size={16} className="text-blue-700" />
                    </div>
                    <div>
                      <div className="text-blue-700 text-xs font-bold uppercase tracking-wider">Information Request</div>
                      <div className="text-slate-500 text-[10px]">Please provide the following clinical data</div>
                    </div>
                  </div>
                )}
                {msg.role === 'user' ? (
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="space-y-0.5">
                    {renderFormattedText(msg.content)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 max-w-[60%]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Loader2 size={20} className="animate-spin text-emerald-500" />
                  <div className="absolute inset-0 w-5 h-5 bg-emerald-500/20 rounded-full animate-ping" />
                </div>
                <div>
                  <p className="text-emerald-700 text-sm font-semibold">Analyzing clinical data...</p>
                  <p className="text-slate-500 text-xs mt-0.5">Comparing with evidence-based guidelines</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      {step !== 'diagnosis-ready' && (
        <div className="shrink-0 border-t border-white/10 bg-slate-900/80 backdrop-blur-sm p-4 md:px-8">
          {/* Status label */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${
              step === 'idle' ? 'bg-blue-500' : 
              step === 'info-requested' ? 'bg-amber-500 animate-pulse' : 
              'bg-emerald-500 animate-pulse'
            }`} />
            <span className="text-slate-400 text-xs font-medium">{getStepLabel()}</span>
          </div>

          <div className="flex gap-3 items-end">
            {/* Upload button */}
            <label className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center justify-center cursor-pointer transition-colors shrink-0">
              <Upload size={18} className="text-slate-400" />
              <input type="file" className="hidden" multiple accept="image/*,.pdf" onChange={handleImageUpload} />
            </label>

            {/* Text Input */}
            <div className="flex-1 relative">
              {uploadedImages.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center"
                      >
                        <X size={8} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                disabled={isThinking}
                rows={2}
                className="w-full bg-slate-800 border border-white/10 focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={isThinking || (!userInput.trim() && uploadedImages.length === 0)}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white flex items-center justify-center transition-all shrink-0 shadow-lg shadow-emerald-500/20 disabled:shadow-none"
            >
              {isThinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* Post-diagnosis actions bar */}
      {step === 'diagnosis-ready' && (
        <div className="shrink-0 border-t border-white/10 bg-slate-900/80 backdrop-blur-sm p-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <CheckCircle size={18} className="text-emerald-500" />
              <span className="text-emerald-700 text-sm font-semibold">Clinical analysis complete.</span>
              <span className="text-slate-500 text-xs">You can add more information or save the session.</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('info-requested')}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-white/10 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add More Info
              </button>
              <button
                onClick={handleSaveSession}
                disabled={isSaving || saved}
                className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                  saved 
                    ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                }`}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
                {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save to Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
