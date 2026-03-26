import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Sparkles, BookOpen, FileText, Layers,
  MessageSquare, GraduationCap,
  Brain, Zap, Table2, Save, Copy, Check, RotateCcw, ChevronDown,
  Lightbulb, Download, Plus, X, ClipboardList, StickyNote,
  HelpCircle, Shield
} from 'lucide-react';
import { generateMedicalContent } from './services/ai';
import { extractPaperTextFromImage } from './services/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';

// ─── Output Mode Config ────────────────────────────────────────────────────
const OUTPUT_MODES = [
  { id: 'summarize', label: 'Summarize', icon: <ClipboardList size={16} />, desc: 'TL;DR + bullet summary + detailed breakdown', color: 'blue' },
  { id: 'study-notes', label: 'Study Notes', icon: <StickyNote size={16} />, desc: 'Structured study notes with key takeaways', color: 'indigo' },
  { id: 'flashcards', label: 'Flashcards', icon: <Layers size={16} />, desc: 'Question-answer pairs for quick revision', color: 'violet' },
  { id: 'qa', label: 'Q & A', icon: <MessageSquare size={16} />, desc: 'Answer questions strictly from your content', color: 'purple' },
  { id: 'explain-simply', label: 'Explain Simply', icon: <Lightbulb size={16} />, desc: 'Beginner-friendly step-by-step explanation', color: 'emerald' },
  { id: 'compare', label: 'Compare & Contrast', icon: <Table2 size={16} />, desc: 'Tables and structured comparisons', color: 'teal' },
  { id: 'cheat-sheet', label: 'Cheat Sheet', icon: <Zap size={16} />, desc: 'Ultra-concise, high-yield key points', color: 'amber' },
  { id: 'exam-notes', label: 'Exam Notes', icon: <GraduationCap size={16} />, desc: 'Exam-focused, structured with headings', color: 'orange' },
];

const DEPTHS = [
  { id: 'summary', label: 'Summary', desc: 'Quick overview', color: 'from-green-500 to-emerald-500' },
  { id: 'detailed', label: 'Detailed', desc: 'Comprehensive breakdown', color: 'from-blue-500 to-indigo-500' },
  { id: 'deep-dive', label: 'Deep Dive', desc: 'In-depth analysis + connections', color: 'from-purple-500 to-violet-500' },
];

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

const SELECTED_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-600/30 text-blue-300 border-blue-400/50 ring-2 ring-blue-500/30',
  indigo: 'bg-indigo-600/30 text-indigo-300 border-indigo-400/50 ring-2 ring-indigo-500/30',
  violet: 'bg-violet-600/30 text-violet-300 border-violet-400/50 ring-2 ring-violet-500/30',
  purple: 'bg-purple-600/30 text-purple-300 border-purple-400/50 ring-2 ring-purple-500/30',
  emerald: 'bg-emerald-600/30 text-emerald-300 border-emerald-400/50 ring-2 ring-emerald-500/30',
  teal: 'bg-teal-600/30 text-teal-300 border-teal-400/50 ring-2 ring-teal-500/30',
  amber: 'bg-amber-600/30 text-amber-300 border-amber-400/50 ring-2 ring-amber-500/30',
  orange: 'bg-orange-600/30 text-orange-300 border-orange-400/50 ring-2 ring-orange-500/30',
};

// ─── System Instruction Builder ──────────────────────────────────────────────
const buildSystemInstruction = (mode: string, depth: string) => {
  const modeMap: Record<string, string> = {
    'summarize': 'Provide: TL;DR (2–3 lines), Bullet summary (key points), and a Detailed breakdown. Be concise but comprehensive.',
    'study-notes': 'Convert the content into well-structured Study Notes with Key Takeaways, Important Definitions, Key Mechanisms, and a Quick Recap at the end.',
    'flashcards': 'Generate question-answer style Flashcards from the content. Each flashcard should have a clear Question and a concise Answer. Generate at least 10-15 flashcards covering all key concepts.',
    'qa': 'Answer the user\'s specific question strictly based on the provided content. If the answer is not in the sources, say "I couldn\'t find this in your documents." Cite sections when possible.',
    'explain-simply': 'Explain the content in the simplest possible language. Use analogies, step-by-step breakdowns, and beginner-friendly terms. Build from basics to deeper understanding.',
    'compare': 'Create structured comparisons using tables and side-by-side analysis. Highlight similarities, differences, and key distinguishing features. Use markdown tables.',
    'cheat-sheet': 'Create an ultra-concise Cheat Sheet with only the highest-yield points. Use bullet points, minimal text, abbreviations. Perfect for quick reference and last-minute revision.',
    'exam-notes': 'Format content as Exam-ready Notes with structured headings, point-wise answers, and highlighted must-remember facts. Format suitable for university exam answers.',
  };

  const depthMap: Record<string, string> = {
    'summary': 'Keep it SHORT and HIGH-LEVEL — provide a quick overview with essential points only. Minimal detail.',
    'detailed': 'Provide a COMPREHENSIVE breakdown — thorough coverage with sufficient detail, sub-sections, and supporting information.',
    'deep-dive': 'Provide an IN-DEPTH ANALYSIS — exhaustive coverage including connections between concepts, cross-references within the document, implications, and deeper insights.',
  };

  return `You are Medimentr AI, an intelligent knowledge assistant designed to help users understand, analyze, and interact with their uploaded content (documents, notes, PDFs, transcripts, and medical learning materials).

Your primary goal is to provide accurate, grounded, and structured responses based ONLY on the provided sources, while being helpful, clear, and educational.

────────────────────────────────
CORE BEHAVIOR
────────────────────────────────

1. SOURCE-GROUNDED ANSWERS
- Always prioritize information from the provided documents.
- Do NOT hallucinate or invent facts.
- If the answer is not in the sources, clearly say:
"I couldn't find this in your documents."
- When possible, cite the relevant section or summarize where the answer comes from.

2. CONTEXT AWARENESS
- Use conversation history + uploaded documents.
- Maintain continuity across follow-up questions.
- Resolve references like "this", "that concept", "previous topic".

3. STRUCTURED RESPONSES
- Break answers into clear sections with headings.
- Keep responses concise but informative.
- Use markdown formatting for readability.

4. EDUCATIONAL MODE
- Explain concepts step-by-step when needed.
- Use simple language first, then deeper detail.
- Highlight definitions, mechanisms, and clinical relevance when applicable.

5. MULTI-DOCUMENT SYNTHESIS
- Combine insights across multiple documents.
- Highlight agreements, contradictions, or gaps.

6. CITATIONS STYLE
- Reference sources clearly:
- (Source: FileName, Section/Paragraph)

7. MEDICAL SAFETY
- Do NOT provide unsafe medical advice.
- Add disclaimer when necessary:
"This is for educational purposes and not medical advice."

────────────────────────────────
OUTPUT MODE: ${modeMap[mode] || modeMap['summarize']}

DEPTH LEVEL: ${depthMap[depth] || depthMap['detailed']}
────────────────────────────────

TONE: Clear, calm, intelligent. Avoid unnecessary verbosity. Use bullet points and formatting for readability.

Use markdown formatting: headings, bold, bullets, tables where appropriate.

FAILSAFE: If no content is provided, say "Please upload documents or paste your notes to begin."

You are not just answering — you are helping the user THINK, LEARN, and UNDERSTAND their material deeply.`;
};

// ─── Component ───────────────────────────────────────────────────────────────
interface BrainStackProps {
  fetchSaved?: () => Promise<void>;
  onLoadSavedContent?: (content: string) => void;
}

const BrainStack: React.FC<BrainStackProps> = ({ fetchSaved }) => {
  const [instruction, setInstruction] = useState('');
  const [docsText, setDocsText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; preview: string }>>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedMode, setSelectedMode] = useState('summarize');
  const [selectedDepth, setSelectedDepth] = useState('detailed');
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutputState] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAllModes, setShowAllModes] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // Stable setOutput that doesn't trigger parent re-renders
  const setOutput = useCallback((val: string) => {
    setOutputState(val);
  }, []);

  // ─── File Upload + OCR ────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsExtracting(true);

    let extractedText = docsText ? docsText + '\n\n' : '';
    const newFiles: Array<{ name: string; preview: string }> = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        newFiles.push({ name: file.name, preview: base64 });

        try {
          const text = await extractPaperTextFromImage(base64);
          if (text) {
            extractedText += `--- Source: ${file.name} ---\n${text}\n\n`;
          }
        } catch (err) {
          console.error("Failed to extract text from", file.name);
        }
      }
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setDocsText(extractedText);
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // ─── Save to Database ─────────────────────────────────────────────────────
  const saveToDatabase = async (title: string, content: string) => {
    try {
      const savePayload = {
        id: `brainstack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        content,
        featureId: 'brainstack',
        date: new Date().toISOString()
      };
      const saveRes = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayload)
      });
      if (saveRes.ok) {
        console.log('✅ BrainStack content saved to library');
        if (fetchSaved) await fetchSaved();
        return true;
      } else {
        const errData = await saveRes.json().catch(() => ({}));
        console.error('Save failed:', errData);
        return false;
      }
    } catch (saveErr) {
      console.error('Save failed:', saveErr);
      return false;
    }
  };

  // ─── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!docsText.trim() && !instruction.trim()) {
      alert('Please upload documents or paste your notes, and provide an instruction.');
      return;
    }

    setIsLoading(true);
    setOutput('');

    try {
      const modeName = OUTPUT_MODES.find(m => m.id === selectedMode)?.label || 'Summarize';
      const depthName = DEPTHS.find(d => d.id === selectedDepth)?.label || 'Detailed';

      const prompt = `User Instruction: ${instruction || `${modeName} the provided content at ${depthName} depth`}\n\nOutput Mode: ${modeName}\nDepth Level: ${depthName}\n\n────────────────────────────────\nPROVIDED CONTENT / DOCUMENTS:\n────────────────────────────────\n${docsText || '(No content provided)'}\n`;

      const systemInstruction = buildSystemInstruction(selectedMode, selectedDepth);

      const result = await generateMedicalContent(prompt, systemInstruction);
      const finalResult = result || 'No response generated. Please try again.';
      setOutput(finalResult);

      // Auto-save to Saved Library
      if (result) {
        const saveTitle = `BrainStack: ${(instruction.trim() || modeName).slice(0, 80)}`;
        await saveToDatabase(saveTitle, result);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setOutput('Failed to generate content. Please check your connection and try again.');
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

  const handleDownloadPDF = () => {
    if (!output || !outputRef.current) return;
    const el = outputRef.current.cloneNode(true) as HTMLElement;
    el.style.cssText = 'padding:30px;font-family:Inter,sans-serif;color:#1e293b;line-height:1.7;max-width:800px;';
    el.querySelectorAll('*').forEach((node) => {
      const n = node as HTMLElement;
      n.style.color = '#1e293b';
    });
    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `${(instruction || 'BrainStack').slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}_Output.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(el).save();
  };

  const handleReset = () => {
    setInstruction('');
    setDocsText('');
    setUploadedFiles([]);
    setOutput('');
    setSelectedMode('summarize');
    setSelectedDepth('detailed');
  };

  // Expose loadContent for parent to call via ref or direct invocation
  // This method is used when a saved library item is clicked
  const loadSavedContent = useCallback((content: string) => {
    setOutput(content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setOutput]);

  // Attach to window so App.tsx can call it
  React.useEffect(() => {
    (window as any).__brainStackLoadContent = loadSavedContent;
    return () => {
      delete (window as any).__brainStackLoadContent;
    };
  }, [loadSavedContent]);

  const visibleModes = showAllModes ? OUTPUT_MODES : OUTPUT_MODES.slice(0, 8);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Brain size={20} className="text-white" />
          </div>
          BrainStack
        </h1>
        <p className="text-slate-400 mt-2 text-sm">Upload your own content — get AI-powered summaries, notes, flashcards & more, grounded only in your sources</p>
      </div>

      {/* Input Panel */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 space-y-5">

        {/* File Upload */}
        <div className="space-y-3">
          <label className="text-white font-semibold text-sm flex items-center gap-2">
            <Upload size={16} className="text-violet-400" /> Upload Source Material
          </label>
          <p className="text-slate-500 text-xs">Upload PDFs, images, or text files. The AI will extract and work only with this content.</p>
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-violet-500/50 transition-all bg-slate-800/50 group">
            <div className="flex flex-col items-center justify-center py-4">
              <Plus className="w-7 h-7 text-slate-500 mb-1.5 group-hover:text-violet-400 group-hover:scale-110 transition-all" />
              <p className="text-sm text-slate-400 font-semibold group-hover:text-slate-300">
                {isExtracting ? "Extracting text..." : "Take Photo / Upload Files"}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">PDFs, Images, Documents</p>
            </div>
            <input
              type="file"
              className="hidden"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileUpload}
            />
          </label>

          {/* Uploaded File Previews */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 group">
                  {file.preview.startsWith('data:image') ? (
                    <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-xs text-slate-300 break-words text-center px-2">
                      <FileText className="w-5 h-5 mb-1 text-violet-400" />
                      <span className="truncate w-full">{file.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Extracted Text / Notes */}
        <div className="space-y-2">
          <label className="text-white font-semibold text-sm flex items-center gap-2">
            <FileText size={16} className="text-emerald-400" /> Extracted Text & Notes
          </label>
          <textarea
            value={docsText}
            onChange={(e) => setDocsText(e.target.value)}
            rows={4}
            className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all text-sm resize-none font-mono"
            placeholder="Extracted text will appear here automatically. You can also paste your own notes, links, or text..."
          />
        </div>

        {/* Your Question / Instruction */}
        <div className="space-y-2">
          <label className="text-white font-semibold text-sm flex items-center gap-2">
            <HelpCircle size={16} className="text-blue-400" /> Your Question / Instruction
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={2}
            className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm resize-none"
            placeholder="E.g., Summarize these notes, create 10 flashcards, explain this concept simply, what is the key difference between..."
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
                    ? 'border-violet-500/50 bg-violet-500/10 ring-2 ring-violet-500/20'
                    : 'border-white/10 bg-slate-800/40 hover:border-white/20'
                }`}
              >
                <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${d.color} mb-2`} />
                <p className="text-white text-sm font-semibold">{d.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{d.desc}</p>
                {selectedDepth === d.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Output Mode Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-white font-semibold text-sm">Output Mode</label>
            {OUTPUT_MODES.length > 8 && (
              <button
                onClick={() => setShowAllModes(!showAllModes)}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
              >
                {showAllModes ? 'Show Less' : `Show All (${OUTPUT_MODES.length})`}
                <ChevronDown size={12} className={`transition-transform ${showAllModes ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {visibleModes.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all text-xs font-medium ${
                  selectedMode === m.id
                    ? SELECTED_COLOR_MAP[m.color]
                    : `${COLOR_MAP[m.color]} hover:opacity-80`
                }`}
              >
                {m.icon}
                <div>
                  <p className="leading-tight">{m.label}</p>
                </div>
              </button>
            ))}
          </div>
          {selectedMode && (
            <p className="text-slate-400 text-xs italic">
              ✨ {OUTPUT_MODES.find(m => m.id === selectedMode)?.desc}
            </p>
          )}
        </div>

        {/* Source Grounded Notice */}
        <div className="flex items-start gap-2 bg-violet-500/5 border border-violet-500/15 rounded-xl px-4 py-3">
          <Shield size={14} className="text-violet-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            <span className="text-violet-300 font-semibold">Source-grounded only.</span> All responses are generated strictly from your uploaded content. No external knowledge is used.
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || (!docsText.trim() && !instruction.trim())}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Content...
            </>
          ) : (
            <>
              <Sparkles size={20} /> Generate Content
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
              <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                <Brain size={16} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">BrainStack Output</p>
                <p className="text-slate-400 text-xs">
                  {OUTPUT_MODES.find(m => m.id === selectedMode)?.label} • {DEPTHS.find(d => d.id === selectedDepth)?.label} • {uploadedFiles.length} source{uploadedFiles.length !== 1 ? 's' : ''}
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
            prose-h2:text-lg prose-h2:text-violet-400 prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-base prose-h3:text-blue-400 prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-slate-300 prose-p:leading-relaxed
            prose-li:text-slate-300
            prose-strong:text-white
            prose-code:text-violet-300 prose-code:bg-violet-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-table:border-collapse
            prose-th:bg-slate-800 prose-th:text-white prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:border prose-th:border-white/10
            prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-white/10 prose-td:text-slate-300
            prose-blockquote:border-violet-500/40 prose-blockquote:bg-violet-500/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrainStack;
