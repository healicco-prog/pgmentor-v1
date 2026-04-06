import React, { useState, useRef } from 'react';
import {
  HelpCircle, Sparkles, Send, BookOpen, Stethoscope, 
  ListChecks, GitBranch, MessageSquare, GraduationCap,
  Brain, Zap, Table2, AlertTriangle, Users, HeartPulse,
  Binary, Save, Copy, Check, RotateCcw, ChevronDown,
  Lightbulb, Download
} from 'lucide-react';
import { generateMedicalContent } from './services/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';

// ─── Style & Depth Config ────────────────────────────────────────────────────
const STYLES = [
  { id: 'first-year-pg', label: '1st-Year PG', icon: <GraduationCap size={16} />, desc: 'Simple language, build from basics, analogies', color: 'blue' },
  { id: 'exam-format', label: 'Exam Format', icon: <ListChecks size={16} />, desc: 'Crisp, point-wise, structured headings', color: 'indigo' },
  { id: 'flowchart', label: 'Flowchart', icon: <GitBranch size={16} />, desc: 'Stepwise arrows, decision-making style', color: 'violet' },
  { id: 'viva-format', label: 'Viva Format', icon: <MessageSquare size={16} />, desc: 'Question–answer, short direct responses', color: 'purple' },
  { id: 'senior-teaching', label: 'Senior Teaching Junior', icon: <Users size={16} />, desc: 'Clinical tone, practical ward insights', color: 'emerald' },
  { id: 'clinical-case', label: 'Clinical Case', icon: <HeartPulse size={16} />, desc: 'Patient scenario → concept → diagnosis', color: 'rose' },
  { id: 'mnemonics', label: 'Mnemonics', icon: <Lightbulb size={16} />, desc: 'Memory aids, easy recall tricks', color: 'amber' },
  { id: 'rapid-revision', label: 'Rapid Revision', icon: <Zap size={16} />, desc: 'Ultra concise, high-yield points only', color: 'orange' },
  { id: 'text-diagrams', label: 'Text Diagrams', icon: <Table2 size={16} />, desc: 'ASCII-style visual representation', color: 'cyan' },
  { id: 'comparison-table', label: 'Comparison Table', icon: <Table2 size={16} />, desc: 'Side-by-side differentiation', color: 'teal' },
  { id: 'mistakes-to-avoid', label: 'Mistakes to Avoid', icon: <AlertTriangle size={16} />, desc: 'Common errors, exam traps', color: 'red' },
  { id: 'teach-others', label: 'Teach Someone Else', icon: <Users size={16} />, desc: 'Simplified, teaching-oriented', color: 'sky' },
  { id: 'clinical-approach', label: 'Clinical Approach', icon: <Stethoscope size={16} />, desc: 'Stepwise patient management', color: 'green' },
  { id: 'patho-to-treatment', label: 'Patho → Clinical → Rx', icon: <Brain size={16} />, desc: 'Logical chain explanation', color: 'fuchsia' },
  { id: 'algorithmic', label: 'Algorithmic Approach', icon: <Binary size={16} />, desc: 'If–then decision logic', color: 'lime' },
];

const DEPTHS = [
  { id: 'basic', label: 'Basic', desc: 'Simple overview', color: 'from-green-500 to-emerald-500' },
  { id: 'standard', label: 'Standard', desc: 'Exam-level explanation', color: 'from-blue-500 to-indigo-500' },
  { id: 'advanced', label: 'Advanced', desc: 'Deep mechanism + clinical integration', color: 'from-purple-500 to-violet-500' },
];

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  sky: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  green: 'bg-green-500/15 text-green-400 border-green-500/30',
  fuchsia: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
  lime: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
};

const SELECTED_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-600/30 text-blue-300 border-blue-400/50 ring-2 ring-blue-500/30',
  indigo: 'bg-indigo-600/30 text-indigo-300 border-indigo-400/50 ring-2 ring-indigo-500/30',
  violet: 'bg-violet-600/30 text-violet-300 border-violet-400/50 ring-2 ring-violet-500/30',
  purple: 'bg-purple-600/30 text-purple-300 border-purple-400/50 ring-2 ring-purple-500/30',
  emerald: 'bg-emerald-600/30 text-emerald-300 border-emerald-400/50 ring-2 ring-emerald-500/30',
  rose: 'bg-rose-600/30 text-rose-300 border-rose-400/50 ring-2 ring-rose-500/30',
  amber: 'bg-amber-600/30 text-amber-300 border-amber-400/50 ring-2 ring-amber-500/30',
  orange: 'bg-orange-600/30 text-orange-300 border-orange-400/50 ring-2 ring-orange-500/30',
  cyan: 'bg-cyan-600/30 text-cyan-300 border-cyan-400/50 ring-2 ring-cyan-500/30',
  teal: 'bg-teal-600/30 text-teal-300 border-teal-400/50 ring-2 ring-teal-500/30',
  red: 'bg-red-600/30 text-red-300 border-red-400/50 ring-2 ring-red-500/30',
  sky: 'bg-sky-600/30 text-sky-300 border-sky-400/50 ring-2 ring-sky-500/30',
  green: 'bg-green-600/30 text-green-300 border-green-400/50 ring-2 ring-green-500/30',
  fuchsia: 'bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-400/50 ring-2 ring-fuchsia-500/30',
  lime: 'bg-lime-600/30 text-lime-300 border-lime-400/50 ring-2 ring-lime-500/30',
};

// ─── System Instruction Builder ──────────────────────────────────────────────
const buildSystemInstruction = (style: string, depth: string) => {
  const styleMap: Record<string, string> = {
    'first-year-pg': 'Explain like I\'m a 1st-year PG student. Use very simple language, build from absolute basics, use analogies and relatable examples. Avoid jargon.',
    'exam-format': 'Explain in exam answer format. Be crisp and point-wise. Use structured headings and subheadings. Format suitable for writing long/short answers in university exams.',
    'flowchart': 'Explain in flowchart style. Use stepwise arrows (→) and decision-making style. Show the logical flow of the concept step by step.',
    'viva-format': 'Explain in viva voce format. Use question–answer style with short, direct responses. Simulate what an examiner would ask and expect.',
    'senior-teaching': 'Explain like a senior resident teaching a junior. Use clinical tone with practical ward insights. Focus on "what actually matters in clinical practice."',
    'clinical-case': 'Explain using a clinical case. Start with a realistic patient scenario, then explain the concept through the case, and end with diagnosis & reasoning.',
    'mnemonics': 'Explain with mnemonics and memory aids. Create easy recall tricks, acronyms, and association-based memory techniques for key points.',
    'rapid-revision': 'Explain for rapid revision. Be ultra concise. Only include high-yield points. Use bullet points and minimal text. Perfect for last-minute revision.',
    'text-diagrams': 'Explain with text-based diagrams. Use ASCII-style or structured visual representations, tables, and formatted text to illustrate concepts visually.',
    'comparison-table': 'Explain using comparison tables. Create side-by-side differentiation tables with clear columns for parameters, similarities, and differences.',
    'mistakes-to-avoid': 'Explain by highlighting common mistakes to avoid. Focus on common errors, exam traps, frequently confused concepts, and misconceptions.',
    'teach-others': 'Explain as if I\'m going to teach this to someone else. Simplified, well-structured, and teaching-oriented. Include what to emphasize and what to skip.',
    'clinical-approach': 'Explain with a clinical approach. Provide stepwise patient management from presentation → investigation → diagnosis → treatment.',
    'patho-to-treatment': 'Explain in a logical chain: Pathophysiology → Clinical Features → Investigations → Treatment. Show how each step connects to the next.',
    'algorithmic': 'Explain with an algorithmic approach. Use if–then logic, decision trees, and stepwise clinical algorithms.',
  };

  const depthMap: Record<string, string> = {
    'basic': 'Keep the depth BASIC — provide a simple overview with key points only. No deep mechanisms.',
    'standard': 'Keep the depth STANDARD — provide an exam-level explanation with sufficient detail for PG medical exams (NEET-PG, INI-CET, university).',
    'advanced': 'Keep the depth ADVANCED — provide deep mechanistic explanation with molecular/cellular details, clinical integration, and recent advances.',
  };

  return `You are an expert medical educator, clinician, and exam strategist for postgraduate medical students (MD/MS/DNB).

YOUR TASK: Simplify complex medical concepts clearly, accurately, and in a structured manner.

EXPLANATION STYLE: ${styleMap[style] || styleMap['exam-format']}

DEPTH LEVEL: ${depthMap[depth] || depthMap['standard']}

OUTPUT STRUCTURE (adapt based on style):
1. Definition — Clear and concise
2. Core Concept — The fundamental mechanism
3. Step-by-step Explanation — Detailed breakdown
4. Clinical Correlation — Real-world application
5. High-Yield Exam Points — Must-remember facts
6. Summary — Quick recap

RULES:
• Maintain clinical accuracy aligned with standard textbooks (Harrison, Guyton, Robbins, etc.)
• Align with exam expectations (NEET-PG, INI-CET, university exams)
• Use structured formatting with headings, bullets, numbered lists, and tables where appropriate
• Highlight high-yield exam points clearly
• Add clinical correlation when relevant
• Avoid unnecessary jargon unless the topic demands it
• Do NOT provide unsafe clinical advice
• Keep content educational and evidence-based
• Use markdown formatting for headings, bold, bullets, tables

PRIORITY: CLARITY > COMPLEXITY | STRUCTURE > VERBOSITY | EXAM UTILITY > THEORY OVERLOAD`;
};

// ─── Component ───────────────────────────────────────────────────────────────
const DoubtSolver = ({ onSave }: { onSave?: (data: any) => Promise<void> }) => {
  const [topic, setTopic] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('exam-format');
  const [selectedDepth, setSelectedDepth] = useState('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAllStyles, setShowAllStyles] = useState(false);
  const [history, setHistory] = useState<Array<{ topic: string; style: string; depth: string; output: string }>>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  // ─── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('Please enter your doubt or topic.');
      return;
    }

    setIsLoading(true);
    setOutput('');

    try {
      const styleName = STYLES.find(s => s.id === selectedStyle)?.label || 'Exam Format';
      const depthName = DEPTHS.find(d => d.id === selectedDepth)?.label || 'Standard';

      const prompt = `Topic / Doubt: ${topic}\nExplanation Style: ${styleName}\nDepth Level: ${depthName}\n\nPlease explain this medical concept thoroughly using the specified style and depth level.`;
      const systemInstruction = buildSystemInstruction(selectedStyle, selectedDepth);

      const result = await generateMedicalContent(prompt, systemInstruction);
      setOutput(result || 'No response generated. Please try again.');
      
      // Add to history
      setHistory(prev => [{ topic: topic.trim(), style: selectedStyle, depth: selectedDepth, output: result || '' }, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Error generating explanation:', error);
      setOutput('Failed to generate explanation. Please check your connection and try again.');
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
      await onSave({
        topic,
        style: selectedStyle,
        depth: selectedDepth,
        explanation: output,
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!output || !outputRef.current) return;
    const el = outputRef.current.cloneNode(true) as HTMLElement;
    el.style.cssText = 'padding:30px;font-family:Inter,sans-serif;color:#1e293b;line-height:1.7;max-width:800px;';
    // Fix dark-mode text to dark for PDF
    el.querySelectorAll('*').forEach((node) => {
      const n = node as HTMLElement;
      n.style.color = '#1e293b';
    });
    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `${topic.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_') || 'Doubt'}_Explanation.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(el).save();
  };

  const handleReset = () => {
    setTopic('');
    setOutput('');
    setSelectedStyle('exam-format');
    setSelectedDepth('standard');
  };

  const visibleStyles = showAllStyles ? STYLES : STYLES.slice(0, 8);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <HelpCircle size={20} className="text-white" />
          </div>
          Doubt Solving & Concept Simplification
        </h1>
        <p className="text-slate-400 mt-2 text-sm">AI-powered medical concept explainer with 15 teaching styles for PG students</p>
      </div>

      {/* Topic Input */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-white font-semibold text-sm flex items-center gap-2">
            <HelpCircle size={16} className="text-amber-400" /> Your Doubt / Topic
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Metabolic acidosis interpretation, ECG in Hyperkalemia, Difference between DKA and HHS, Mechanism of action of ACE inhibitors..."
            rows={3}
            className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm resize-none"
          />
        </div>

        {/* Depth Selection */}
        <div className="space-y-3">
          <label className="text-white font-semibold text-sm">Depth Level</label>
          <div className="grid grid-cols-3 gap-3">
            {DEPTHS.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDepth(d.id)}
                className={`relative p-3 rounded-xl border transition-all text-left ${
                  selectedDepth === d.id
                    ? 'border-amber-500/50 bg-amber-500/10 ring-2 ring-amber-500/20'
                    : 'border-white/10 bg-slate-800/40 hover:border-white/20'
                }`}
              >
                <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${d.color} mb-2`} />
                <p className="text-white text-sm font-semibold">{d.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{d.desc}</p>
                {selectedDepth === d.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Style Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-white font-semibold text-sm">Explanation Style</label>
            <button
              onClick={() => setShowAllStyles(!showAllStyles)}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              {showAllStyles ? 'Show Less' : `Show All (${STYLES.length})`}
              <ChevronDown size={12} className={`transition-transform ${showAllStyles ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {visibleStyles.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStyle(s.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all text-xs font-medium ${
                  selectedStyle === s.id
                    ? SELECTED_COLOR_MAP[s.color]
                    : `${COLOR_MAP[s.color]} hover:opacity-80`
                }`}
              >
                {s.icon}
                <div>
                  <p className="leading-tight">{s.label}</p>
                </div>
              </button>
            ))}
          </div>
          {selectedStyle && (
            <p className="text-slate-400 text-xs italic">
              ✨ {STYLES.find(s => s.id === selectedStyle)?.desc}
            </p>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || !topic.trim()}
          className={`w-full font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${isLoading ? 'bg-orange-100 text-blue-900 shadow-orange-100/20' : 'bg-[#FFD700] hover:bg-[#F2C800] disabled:opacity-40 disabled:cursor-not-allowed text-blue-900 shadow-[#FFD700]/20'}`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-blue-900/40 border-t-blue-900 rounded-full animate-spin" />
              Generating Explanation...
            </>
          ) : (
            <>
              <Sparkles size={20} /> Solve My Doubt
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
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-amber-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">AI Explanation</p>
                <p className="text-slate-400 text-xs">
                  {STYLES.find(s => s.id === selectedStyle)?.label} • {DEPTHS.find(d => d.id === selectedDepth)?.label}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg transition-colors">
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={handleDownloadPDF}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg transition-colors">
                <Download size={12} /> PDF
              </button>
              {onSave && (
                <button onClick={handleSave}
                  className="text-slate-400 hover:text-emerald-400 text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg transition-colors">
                  <Save size={12} /> Save
                </button>
              )}
              <button onClick={handleReset}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg transition-colors">
                <RotateCcw size={12} /> New
              </button>
            </div>
          </div>

          {/* Output Body */}
          <div ref={outputRef} className="px-6 py-6 prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-h1:text-xl prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-2 prose-h1:mb-4
            prose-h2:text-lg prose-h2:text-amber-400 prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-base prose-h3:text-blue-400 prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-slate-300 prose-p:leading-relaxed
            prose-li:text-slate-300
            prose-strong:text-white
            prose-code:text-amber-300 prose-code:bg-amber-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-table:border-collapse
            prose-th:bg-slate-800 prose-th:text-white prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:border prose-th:border-white/10
            prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-white/10 prose-td:text-slate-300
            prose-blockquote:border-amber-500/40 prose-blockquote:bg-amber-500/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1
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
                  setTopic(item.topic);
                  setSelectedStyle(item.style);
                  setSelectedDepth(item.depth);
                  setOutput(item.output);
                }}
                className="bg-slate-800/40 border border-white/5 rounded-xl p-4 text-left hover:border-amber-500/30 transition-all group"
              >
                <p className="text-white text-sm font-medium truncate group-hover:text-amber-400 transition-colors">{item.topic}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-md">{STYLES.find(s => s.id === item.style)?.label}</span>
                  <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-md">{DEPTHS.find(d => d.id === item.depth)?.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoubtSolver;
