import React, { useState, useRef } from 'react';
import {
  Pill, Sparkles, Copy, Check, Save, RotateCcw, Download,
  ChevronDown, BookOpen, Stethoscope, Syringe, AlertTriangle,
  Activity, ShieldAlert, Baby, HeartPulse, Zap, FlaskConical,
  ListChecks, GitBranch, MessageSquare, GraduationCap, Brain,
  Table2, Users, Lightbulb, Scale
} from 'lucide-react';
import { generateMedicalContent } from './services/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';

// ─── Modes ───────────────────────────────────────────────────────────────────
const MODES = [
  { id: 'comparison', label: 'Comparison', icon: <Scale size={16} />, desc: 'Table format, highlight key differences', color: 'blue' },
  { id: 'dosage', label: 'Dosage', icon: <Syringe size={16} />, desc: 'Clear dosing with renal/hepatic adjustments', color: 'indigo' },
  { id: 'exam', label: 'Exam Mode', icon: <ListChecks size={16} />, desc: 'Crisp, high-yield points for exams', color: 'violet' },
  { id: 'clinical', label: 'Clinical', icon: <Stethoscope size={16} />, desc: 'Practical, ward-oriented advice', color: 'emerald' },
  { id: 'protocol', label: 'Protocol', icon: <GitBranch size={16} />, desc: 'Stepwise treatment algorithm', color: 'teal' },
  { id: 'emergency', label: 'Emergency', icon: <Zap size={16} />, desc: 'Immediate management focus', color: 'red' },
  { id: 'pediatric', label: 'Pediatric', icon: <Baby size={16} />, desc: 'Weight-based dosing for children', color: 'pink' },
  { id: 'icu', label: 'ICU Mode', icon: <Activity size={16} />, desc: 'Critical care considerations', color: 'orange' },
];

const STYLES = [
  { id: 'first-year-pg', label: '1st-Year PG', icon: <GraduationCap size={14} />, color: 'blue' },
  { id: 'exam-answer', label: 'Exam Answer', icon: <ListChecks size={14} />, color: 'indigo' },
  { id: 'flowchart', label: 'Flowchart', icon: <GitBranch size={14} />, color: 'violet' },
  { id: 'comparison-table', label: 'Comparison Table', icon: <Table2 size={14} />, color: 'purple' },
  { id: 'rapid-revision', label: 'Rapid Revision', icon: <Zap size={14} />, color: 'orange' },
  { id: 'viva', label: 'Viva Style', icon: <MessageSquare size={14} />, color: 'emerald' },
  { id: 'clinical-reasoning', label: 'Clinical Reasoning', icon: <Brain size={14} />, color: 'teal' },
  { id: 'mistakes', label: 'Mistakes to Avoid', icon: <AlertTriangle size={14} />, color: 'red' },
  { id: 'mnemonics', label: 'Mnemonics', icon: <Lightbulb size={14} />, color: 'amber' },
  { id: 'step-by-step', label: 'Step-by-Step', icon: <Users size={14} />, color: 'cyan' },
];

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30',
  violet: 'bg-violet-500/15 text-violet-700 border-violet-500/30',
  purple: 'bg-purple-500/15 text-purple-700 border-purple-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  teal: 'bg-teal-500/15 text-teal-700 border-teal-500/30',
  red: 'bg-red-500/15 text-red-700 border-red-500/30',
  pink: 'bg-pink-500/15 text-pink-700 border-pink-500/30',
  orange: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
  amber: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-700 border-cyan-500/30',
};

const SELECTED_MAP: Record<string, string> = {
  blue: 'bg-blue-600/30 text-blue-800 border-blue-400/50 ring-2 ring-blue-500/30',
  indigo: 'bg-indigo-600/30 text-indigo-800 border-indigo-400/50 ring-2 ring-indigo-500/30',
  violet: 'bg-violet-600/30 text-violet-800 border-violet-400/50 ring-2 ring-violet-500/30',
  purple: 'bg-purple-600/30 text-purple-800 border-purple-400/50 ring-2 ring-purple-500/30',
  emerald: 'bg-emerald-600/30 text-emerald-800 border-emerald-400/50 ring-2 ring-emerald-500/30',
  teal: 'bg-teal-600/30 text-teal-800 border-teal-400/50 ring-2 ring-teal-500/30',
  red: 'bg-red-600/30 text-red-800 border-red-400/50 ring-2 ring-red-500/30',
  pink: 'bg-pink-600/30 text-pink-800 border-pink-400/50 ring-2 ring-pink-500/30',
  orange: 'bg-orange-600/30 text-orange-800 border-orange-400/50 ring-2 ring-orange-500/30',
  amber: 'bg-amber-600/30 text-amber-800 border-amber-400/50 ring-2 ring-amber-500/30',
  cyan: 'bg-cyan-600/30 text-cyan-800 border-cyan-400/50 ring-2 ring-cyan-500/30',
};

// ─── System Instruction Builder ──────────────────────────────────────────────
const buildSystemInstruction = (mode: string, style: string) => {
  const modeMap: Record<string, string> = {
    comparison: 'COMPARISON MODE: Present drug information in a clear comparison table format. Highlight key differences in mechanism, spectrum, dosing, side effects, and cost-effectiveness. Use markdown tables.',
    dosage: 'DOSAGE MODE: Focus on clear, precise dosing information. Include standard adult dose, route, frequency, renal dose adjustment, hepatic dose adjustment, and any special considerations.',
    exam: 'EXAM MODE: Present in crisp, high-yield point format optimized for NEET-PG, INI-CET, and university exams. Highlight must-know facts, frequently asked points, and common exam traps.',
    clinical: 'CLINICAL MODE: Provide practical, ward-oriented advice. Focus on real-world clinical application, monitoring parameters, when to escalate, and practical tips from bedside experience.',
    protocol: 'PROTOCOL MODE: Present as a stepwise treatment algorithm. Show clear escalation/de-escalation pathways, first-line vs second-line options, and decision points.',
    emergency: 'EMERGENCY MODE: Focus on immediate management. Present critical first steps, emergency dosing, rapid stabilization, and time-sensitive actions. Be direct and action-oriented.',
    pediatric: 'PEDIATRIC MODE: Focus on weight-based dosing (mg/kg), age-appropriate formulations, pediatric-specific side effects, and safety considerations for neonates/infants/children.',
    icu: 'ICU MODE: Focus on critical care considerations. Include infusion rates, hemodynamic monitoring, organ support interactions, ventilator considerations, and ICU-specific protocols.',
  };

  const styleMap: Record<string, string> = {
    'first-year-pg': 'Explain like teaching a 1st-year PG. Use simple language, build from basics, use analogies.',
    'exam-answer': 'Format as an exam answer. Crisp, point-wise, with structured headings/subheadings.',
    'flowchart': 'Use flowchart style with arrows (→) and decision-making steps.',
    'comparison-table': 'Use comparison tables with clear columns for side-by-side analysis.',
    'rapid-revision': 'Ultra concise. Only high-yield points. Perfect for last-minute revision.',
    'viva': 'Question–answer style with short, direct responses like a viva voce exam.',
    'clinical-reasoning': 'Clinical reasoning approach with stepwise thought process from presentation to management.',
    'mistakes': 'Highlight common mistakes, exam traps, frequently confused drugs, and prescribing errors.',
    'mnemonics': 'Include mnemonics, memory aids, and easy recall tricks for drug information.',
    'step-by-step': 'Step-by-step management approach from diagnosis to treatment to follow-up.',
  };

  return `You are an expert clinical pharmacologist and treating physician assistant for postgraduate medical students (MD/MS/DNB).

YOUR TASK: Provide accurate drug information, compare medications, explain treatment protocols, and guide rational drug use.

${modeMap[mode] || modeMap['clinical']}

STYLE: ${styleMap[style] || styleMap['exam-answer']}

OUTPUT STRUCTURE (adapt based on mode):
1️⃣ Drug Overview / Treatment Context
2️⃣ Mechanism of Action
3️⃣ Indications
4️⃣ Dosage (adult ± pediatric if relevant)
5️⃣ Side Effects
6️⃣ Contraindications
7️⃣ Drug Interactions
8️⃣ Clinical Pearls (high-yield)
9️⃣ Summary

RULES:
• Maintain clinical accuracy aligned with standard pharmacology references (Goodman & Gilman, KD Tripathi, Harrison)
• Use markdown formatting (headings, bold, bullets, tables)
• Highlight high-yield exam points
• Add clinical correlations
• Include dose adjustments for renal/hepatic impairment when relevant

⚠️ SAFETY (MANDATORY):
• Always include: "⚠️ Use under supervision of a qualified clinician"
• Never provide unsafe or absolute prescribing instructions
• Mention variability based on patient condition
• Highlight when specialist input is needed
• If critical info is missing, state assumptions clearly

PRIORITY: SAFETY > CLARITY > EXAM RELEVANCE > CLINICAL PRACTICALITY`;
};

// ─── Component ───────────────────────────────────────────────────────────────
const DrugTreatmentAssistant = ({ onSave }: { onSave?: (data: any) => Promise<void> }) => {
  const [query, setQuery] = useState('');
  const [drugName, setDrugName] = useState('');
  const [condition, setCondition] = useState('');
  const [patientContext, setPatientContext] = useState('');
  const [selectedMode, setSelectedMode] = useState('clinical');
  const [selectedStyle, setSelectedStyle] = useState('exam-answer');
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showStyles, setShowStyles] = useState(false);
  const [history, setHistory] = useState<Array<{ query: string; mode: string; style: string; output: string }>>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  // ─── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    const fullQuery = query.trim() || `${drugName.trim()} ${condition.trim()}`.trim();
    if (!fullQuery) {
      alert('Please enter a drug name, condition, or query.');
      return;
    }

    setIsLoading(true);
    setOutput('');

    try {
      const modeName = MODES.find(m => m.id === selectedMode)?.label || 'Clinical';
      const styleName = STYLES.find(s => s.id === selectedStyle)?.label || 'Exam Answer';

      let prompt = `Query: ${fullQuery}\n`;
      if (drugName.trim()) prompt += `Drug: ${drugName.trim()}\n`;
      if (condition.trim()) prompt += `Condition: ${condition.trim()}\n`;
      if (patientContext.trim()) prompt += `Patient Context: ${patientContext.trim()}\n`;
      prompt += `Mode: ${modeName}\nStyle: ${styleName}\n\nPlease provide comprehensive drug and treatment information based on the query, mode, and style specified.`;

      const systemInstruction = buildSystemInstruction(selectedMode, selectedStyle);
      const result = await generateMedicalContent(prompt, systemInstruction);
      setOutput(result || 'No response generated. Please try again.');

      setHistory(prev => [{
        query: fullQuery,
        mode: selectedMode,
        style: selectedStyle,
        output: result || ''
      }, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Error generating:', error);
      setOutput('Failed to generate. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (onSave && output) {
      const fullQuery = query.trim() || `${drugName.trim()} ${condition.trim()}`.trim();
      await onSave({
        query: fullQuery,
        drug_name: drugName,
        condition,
        patient_context: patientContext,
        mode: selectedMode,
        style: selectedStyle,
        response: output,
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!output || !outputRef.current) return;
    const el = outputRef.current.cloneNode(true) as HTMLElement;
    el.style.cssText = 'padding:30px;font-family:Inter,sans-serif;color:#1e293b;line-height:1.7;max-width:800px;';
    el.querySelectorAll('*').forEach((node) => {
      (node as HTMLElement).style.color = '#1e293b';
    });
    const fullQuery = query.trim() || `${drugName.trim()} ${condition.trim()}`.trim();
    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `${fullQuery.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_') || 'Drug'}_Info.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(el).save();
  };

  const handleReset = () => {
    setQuery('');
    setDrugName('');
    setCondition('');
    setPatientContext('');
    setOutput('');
    setSelectedMode('clinical');
    setSelectedStyle('exam-answer');
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <Pill size={20} className="text-white" />
          </div>
          Drug & Treatment Assistant
        </h1>
        <p className="text-slate-400 mt-2 text-sm">AI-powered clinical pharmacology companion for PG medical students</p>
      </div>

      {/* Input Section */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 space-y-5">
        {/* Query / Free text */}
        <div className="space-y-2">
          <label className="text-white font-semibold text-sm flex items-center gap-2">
            <FlaskConical size={16} className="text-emerald-700" /> Your Query
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Meropenem vs Piperacillin-Tazobactam in nosocomial pneumonia, Dose of Vancomycin in renal failure, Treatment of DKA..."
            rows={3}
            className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all text-sm resize-none"
          />
        </div>

        {/* Drug + Condition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
              <Pill size={14} className="text-emerald-700" /> Drug Name / Class <span className="text-slate-500 text-xs">(optional)</span>
            </label>
            <input
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
              placeholder="e.g., Meropenem, ACE Inhibitors, Insulin"
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
              <Stethoscope size={14} className="text-emerald-700" /> Condition <span className="text-slate-500 text-xs">(optional)</span>
            </label>
            <input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g., Sepsis, DKA, MRSA infection"
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Patient Context */}
        <div className="space-y-1.5">
          <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <HeartPulse size={14} className="text-emerald-700" /> Patient Context <span className="text-slate-500 text-xs">(optional — age, weight, renal/liver status, pregnancy)</span>
          </label>
          <input
            value={patientContext}
            onChange={(e) => setPatientContext(e.target.value)}
            placeholder="e.g., 65-year-old male, CKD stage 3, eGFR 35, weight 70kg"
            className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        {/* Mode Selection */}
        <div className="space-y-3">
          <label className="text-white font-semibold text-sm">Mode</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-xs font-medium ${
                  selectedMode === m.id ? SELECTED_MAP[m.color] : `${COLOR_MAP[m.color]} hover:opacity-80`
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            ))}
          </div>
          <p className="text-slate-400 text-xs italic">
            🎯 {MODES.find(m => m.id === selectedMode)?.desc}
          </p>
        </div>

        {/* Style Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-white font-semibold text-sm">Explanation Style</label>
            <button
              onClick={() => setShowStyles(!showStyles)}
              className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              {showStyles ? 'Hide Styles' : 'Show Styles'}
              <ChevronDown size={12} className={`transition-transform ${showStyles ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {showStyles && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border transition-all text-xs font-medium ${
                    selectedStyle === s.id ? SELECTED_MAP[s.color] : `${COLOR_MAP[s.color]} hover:opacity-80`
                  }`}
                >
                  {s.icon}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          )}
          {!showStyles && (
            <p className="text-slate-500 text-xs">
              Style: <span className="text-slate-300">{STYLES.find(s => s.id === selectedStyle)?.label}</span>
            </p>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || (!query.trim() && !drugName.trim() && !condition.trim())}
          className={`w-full font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${isLoading ? 'bg-orange-100 text-blue-900 shadow-orange-100/20' : 'bg-[#FFD700] hover:bg-[#F2C800] disabled:opacity-40 disabled:cursor-not-allowed text-blue-900 shadow-[#FFD700]/20'}`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-blue-900/40 border-t-blue-900 rounded-full animate-spin" />
              Analyzing Drug Information...
            </>
          ) : (
            <>
              <Sparkles size={20} /> Get Drug & Treatment Info
            </>
          )}
        </button>
      </div>

      {/* Output */}
      {output && (
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
          {/* Output Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/5 bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Pill size={16} className="text-emerald-700" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Drug & Treatment Analysis</p>
                <p className="text-slate-400 text-xs">
                  {MODES.find(m => m.id === selectedMode)?.label} • {STYLES.find(s => s.id === selectedStyle)?.label}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg transition-colors">
                {copied ? <Check size={12} className="text-green-700" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={handleDownloadPDF}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg transition-colors">
                <Download size={12} /> PDF
              </button>
              {onSave && (
                <button onClick={handleSave}
                  className="text-slate-400 hover:text-emerald-700 text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg transition-colors">
                  <Save size={12} /> Save
                </button>
              )}
              <button onClick={handleReset}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg transition-colors">
                <RotateCcw size={12} /> New
              </button>
            </div>
          </div>

          {/* Safety Banner */}
          <div className="mx-6 mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
            <ShieldAlert size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-xs leading-relaxed">
              <strong>Educational Tool Only</strong> — This is an AI-generated educational resource, not a replacement for clinical judgment. All drug information should be verified and used under supervision of a qualified clinician.
            </p>
          </div>

          {/* Output Body */}
          <div ref={outputRef} className="px-6 py-6 prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-h1:text-xl prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-2 prose-h1:mb-4
            prose-h2:text-lg prose-h2:text-emerald-700 prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-base prose-h3:text-blue-700 prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-slate-300 prose-p:leading-relaxed
            prose-li:text-slate-300
            prose-strong:text-white
            prose-code:text-emerald-800 prose-code:bg-emerald-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-table:border-collapse
            prose-th:bg-slate-800 prose-th:text-white prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:border prose-th:border-white/10
            prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-white/10 prose-td:text-slate-300
            prose-blockquote:border-emerald-500/40 prose-blockquote:bg-emerald-500/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && !output && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <BookOpen size={16} className="text-slate-400" /> Recent Queries
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {history.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(item.query);
                  setSelectedMode(item.mode);
                  setSelectedStyle(item.style);
                  setOutput(item.output);
                }}
                className="bg-slate-800/40 border border-white/5 rounded-xl p-4 text-left hover:border-emerald-500/30 transition-all group"
              >
                <p className="text-white text-sm font-medium truncate group-hover:text-emerald-700 transition-colors">{item.query}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-md">{MODES.find(m => m.id === item.mode)?.label}</span>
                  <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-md">{STYLES.find(s => s.id === item.style)?.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DrugTreatmentAssistant;
