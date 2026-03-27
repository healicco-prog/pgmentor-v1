import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Globe, MapPin, Building, Bookmark, BookmarkPlus, ExternalLink, BookOpen, Trash2, Edit3, X, Loader2, Save, ChevronRight } from 'lucide-react';
import { generateMedicalContent } from './services/ai';

type Guideline = {
  id: string; // generated ID for tracking
  conditionName: string;
  title: string;
  organization: string;
  publicationYear: number | string;
  sourceUrl: string;
  category: 'International' | 'National' | 'Local';
  summary?: string;
  keyRecommendations?: string;
  notes?: string;
};

export default function GuidelinesGenerator() {
  const [activeMainTab, setActiveMainTab] = useState<'search' | 'library'>('search');
  
  // Search State
  const [searchCondition, setSearchCondition] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Guideline[]>([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'International' | 'National' | 'Local'>('International');
  
  // Viewer State
  const [selectedGuideline, setSelectedGuideline] = useState<Guideline | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Library State
  const [libraryGuidelines, setLibraryGuidelines] = useState<any[]>([]);
  const [isFetchingLibrary, setIsFetchingLibrary] = useState(false);
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');

  // Fetch library
  const fetchLibrary = async () => {
    setIsFetchingLibrary(true);
    try {
      const res = await fetch('/api/guidelines/saved');
      if (res.ok) {
        const data = await res.json();
        setLibraryGuidelines(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingLibrary(false);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'library') {
      fetchLibrary();
    }
  }, [activeMainTab]);

  const handleSearch = async () => {
    if (!searchCondition.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedGuideline(null);

    const prompt = `Provide the latest clinical guidelines for: ${searchCondition}`;
    const systemInstruction = `You are an expert Clinical knowledge assistant. Return a JSON array of clinical guidelines for the requested condition. 
Include guidelines from International (WHO, AHA, ESC, etc.), National (ICMR, MoHFW India, etc.), and Local/State sources.
Return strictly the JSON array with elements matching:
{
  "id": "unique-string",
  "conditionName": "${searchCondition}",
  "title": "Guideline Title",
  "organization": "Issuing Organization",
  "publicationYear": "Year (e.g. 2024)",
  "sourceUrl": "URL to source if available, else empty",
  "category": "International" | "National" | "Local",
  "summary": "Short 1-2 sentence description"
}`;

    try {
      const resp = await generateMedicalContent(prompt, systemInstruction, "application/json");
      // Strip potential markdown code blocks
      const cleanResp = resp.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(cleanResp);
      setSearchResults(Array.isArray(data) ? data : data.guidelines || []);
    } catch (e) {
      console.error(e);
      alert("Error generating search results. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const generateDetailedSummary = async (g: Guideline) => {
    if (g.keyRecommendations) return; // already got it
    setIsSummarizing(true);
    const prompt = `Generate a detailed executive summary and key recommendations for the clinical guideline "${g.title}" by "${g.organization}". Condition: ${g.conditionName}.`;
    const systemInstruction = `Return JSON with fields:
{
  "summary": "Detailed executive summary (paragraph format)",
  "keyRecommendations": "Bullet points of key recommendations, diagnostic criteria, and treatment algorithms as a single string with newlines."
}`;
    try {
      const resp = await generateMedicalContent(prompt, systemInstruction, "application/json");
      const cleanResp = resp.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const details = JSON.parse(cleanResp);
      // Ensure keyRecommendations is always a string
      let recs = details.keyRecommendations || '';
      if (Array.isArray(recs)) recs = recs.join('\n');
      else if (typeof recs === 'object') recs = JSON.stringify(recs, null, 2);
      else recs = String(recs);
      let summary = details.summary || '';
      if (typeof summary !== 'string') summary = String(summary);
      const updated = { ...g, summary, keyRecommendations: recs };
      setSelectedGuideline(updated);
      
      // Update in results array too
      if (activeMainTab === 'search') {
        setSearchResults(prev => prev.map(item => item.id === g.id ? updated : item));
      }
    } catch (e) {
      console.error("Summary error:", e);
      // Still show the guideline even if summary fails
      setSelectedGuideline({ ...g, summary: g.summary || 'Failed to generate summary. Please try again.', keyRecommendations: '' });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveToLibrary = async (g: Guideline) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/guidelines/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: g.id || Date.now().toString(),
          userId: 'default',
          conditionName: g.conditionName,
          title: g.title,
          organization: g.organization,
          publicationYear: Number(g.publicationYear) || 2024,
          sourceUrl: g.sourceUrl || '',
          category: g.category,
          summary: g.summary || '',
          notes: g.notes || ''
        })
      });
      if (res.ok) {
        alert("Saved to personal library!");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this guideline from your library?")) return;
    try {
      await fetch(`/api/guidelines/saved/${id}`, { method: 'DELETE' });
      setLibraryGuidelines(prev => prev.filter(g => g.id !== id));
      if (selectedGuideline?.id === id) setSelectedGuideline(null);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredResults = searchResults.filter(g => g.category === activeCategoryTab);
  const filteredLibrary = libraryGuidelines.filter(g => 
    g.title.toLowerCase().includes(librarySearchTerm.toLowerCase()) || 
    g.conditionName.toLowerCase().includes(librarySearchTerm.toLowerCase()) ||
    g.organization.toLowerCase().includes(librarySearchTerm.toLowerCase())
  );

  // Helper to render markdown-style text with proper formatting
  const renderFormattedText = (text: string) => {
    const lines = String(text).split('\n');
    const elements: React.ReactNode[] = [];
    
    const formatInlineText = (str: string) => {
      // Parse **bold** and *italic* markers
      const parts: React.ReactNode[] = [];
      const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
      let lastIndex = 0;
      let match;
      let key = 0;
      
      while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIndex) {
          parts.push(str.slice(lastIndex, match.index));
        }
        if (match[2]) {
          // **bold**
          parts.push(<strong key={key++} className="text-white font-semibold">{match[2]}</strong>);
        } else if (match[3]) {
          // *italic*
          parts.push(<em key={key++} className="text-blue-300">{match[3]}</em>);
        }
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < str.length) {
        parts.push(str.slice(lastIndex));
      }
      return parts.length > 0 ? parts : [str];
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Section headings (lines ending with : or starting with ## or all caps short lines)
      if (trimmed.match(/^#{1,3}\s+(.+)/) || (trimmed.endsWith(':') && trimmed.length < 120 && !trimmed.startsWith('-') && !trimmed.startsWith('*') && !trimmed.match(/^\d+\./))) {
        const headingText = trimmed.replace(/^#{1,3}\s+/, '').replace(/:$/, '');
        elements.push(
          <div key={i} className="mt-5 mb-3 first:mt-0">
            <h5 className="text-blue-400 font-bold text-[13px] uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              {formatInlineText(headingText)}
            </h5>
          </div>
        );
        return;
      }

      // Numbered list items (1. 2. etc.)
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        elements.push(
          <div key={i} className="flex gap-3 mb-3 pl-1">
            <span className="w-6 h-6 bg-blue-500/15 text-blue-400 text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">{numberedMatch[1]}</span>
            <p className="text-slate-300 text-[14px] leading-relaxed flex-1">{formatInlineText(numberedMatch[2])}</p>
          </div>
        );
        return;
      }

      // Bullet points (-, *, •)
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || (trimmed.startsWith('*') && !trimmed.startsWith('**'))) {
        const bulletText = trimmed.replace(/^[-•*]\s*/, '');
        elements.push(
          <div key={i} className="flex gap-3 mb-2.5 pl-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
            <p className="text-slate-300 text-[14px] leading-relaxed flex-1">{formatInlineText(bulletText)}</p>
          </div>
        );
        return;
      }

      // Regular paragraph
      elements.push(
        <p key={i} className="text-slate-300 text-[14px] leading-relaxed mb-2">{formatInlineText(trimmed)}</p>
      );
    });
    
    return elements;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans">
      
      {/* Header & Main Tabs */}
      <div className="shrink-0 p-6 md:px-10 border-b border-white/10 bg-slate-900/50 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <ShieldAlert size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">Guidelines Generator</h2>
          </div>
          <p className="text-slate-400 text-sm">Access and track the latest clinical evidence and protocols.</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveMainTab('search')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeMainTab === 'search' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            Guidelines Search
          </button>
          <button 
            onClick={() => setActiveMainTab('library')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeMainTab === 'library' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
          >
            My Library
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex relative">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          
          {activeMainTab === 'search' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
                <label className="block text-slate-300 font-medium mb-3 text-lg">Clinical Condition</label>
                <div className="relative flex items-center">
                  <Search size={20} className="absolute left-4 text-blue-500" />
                  <input 
                    type="text" 
                    value={searchCondition}
                    onChange={(e) => setSearchCondition(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g., Acute Myocardial Infarction, Type 2 Diabetes..." 
                    className="w-full bg-slate-800 border-2 border-slate-700 focus:border-blue-500 rounded-xl py-4 pl-12 pr-32 text-white shadow-inner transition-colors text-lg"
                  />
                  <button 
                    onClick={handleSearch}
                    disabled={isSearching || !searchCondition.trim()}
                    className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-lg font-bold transition-all disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center gap-2"
                  >
                    {isSearching ? <Loader2 size={18} className="animate-spin" /> : "Search"}
                  </button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-6">
                  {/* Category Tabs */}
                  <div className="flex gap-2 p-1 bg-slate-900/50 border border-white/5 rounded-xl self-start w-fit">
                    {(['International', 'National', 'Local'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategoryTab(cat)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeCategoryTab === cat ? 'bg-slate-800 text-white shadow-sm border border-white/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                      >
                        {cat === 'International' ? <Globe size={16} className={activeCategoryTab === cat ? 'text-blue-400' : ''}/> : 
                         cat === 'National' ? <MapPin size={16} className={activeCategoryTab === cat ? 'text-emerald-400' : ''}/> : 
                         <Building size={16} className={activeCategoryTab === cat ? 'text-amber-400' : ''}/>}
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {filteredResults.length === 0 ? (
                      <div className="text-center py-12 bg-slate-900/50 border border-white/5 border-dashed rounded-2xl">
                        <p className="text-slate-500">No guidelines found for this category.</p>
                      </div>
                    ) : (
                      filteredResults.map((g, idx) => (
                        <div 
                          key={idx} 
                          className="group bg-slate-900 border border-white/5 hover:border-blue-500/30 rounded-2xl p-6 transition-all cursor-pointer flex justify-between items-start"
                          onClick={() => {
                            setSelectedGuideline(g);
                            if (!g.keyRecommendations) {
                              generateDetailedSummary(g);
                            }
                          }}
                        >
                          <div className="space-y-2 pr-4">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded uppercase tracking-wide border border-blue-500/20">{g.category}</span>
                              <span className="text-slate-400 text-sm flex items-center gap-1"><BookOpen size={14}/> {g.publicationYear}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{g.title}</h3>
                            <p className="text-blue-300 font-medium text-sm flex items-center gap-1.5">
                              <Building size={14}/> {g.organization}
                            </p>
                            <p className="text-slate-400 text-sm line-clamp-2 mt-2 leading-relaxed">{g.summary}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-blue-600 flex items-center justify-center shrink-0 transition-colors text-slate-400 group-hover:text-white">
                            <ChevronRight size={20} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMainTab === 'library' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Personal Guidelines Library</h3>
                  <p className="text-slate-400 text-sm">Organize and review your saved clinical protocols.</p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    value={librarySearchTerm}
                    onChange={(e) => setLibrarySearchTerm(e.target.value)}
                    placeholder="Search your library..." 
                    className="w-full bg-slate-800 border border-white/10 focus:border-emerald-500 rounded-xl py-2 pl-10 pr-4 text-white transition-colors text-sm"
                  />
                </div>
              </div>

              {isFetchingLibrary ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32}/></div>
              ) : filteredLibrary.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 border border-white/5 border-dashed rounded-3xl">
                  <Bookmark className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg">Your library is empty.</p>
                  <p className="text-slate-500 text-sm mt-2">Search for guidelines and save them to build your personal knowledge base.</p>
                  <button onClick={() => setActiveMainTab('search')} className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium">Go to Search</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLibrary.map((g) => (
                    <div key={g.id} className="bg-slate-900 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-6 flex flex-col group transition-all relative">
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-2 py-1 bg-slate-800 text-slate-300 text-[10px] font-bold rounded uppercase tracking-wide border border-white/5">{g.category}</span>
                        <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">{g.publicationYear}</span>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2 leading-snug">{g.title}</h4>
                      <p className="text-blue-400 text-xs font-semibold mb-4 flex items-center gap-1"><Building size={12}/> {g.organization}</p>
                      <div className="text-slate-400 text-sm bg-slate-800/50 p-3 rounded-lg flex-1 mb-4 italic border border-white/5">
                        <div className="font-semibold text-slate-300 text-xs uppercase mb-1 flex items-center gap-1"><Edit3 size={12}/> Notes</div>
                        {g.notes ? g.notes : "No notes attached."}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <button 
                          onClick={() => setSelectedGuideline(g)}
                          className="text-white bg-slate-800 hover:bg-emerald-600 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                          <BookOpen size={14}/> View Guide
                        </button>
                        <button 
                          onClick={() => handleDelete(g.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Guideline Viewer Sidebar/Modal overlay on desktop */}
        {selectedGuideline && (
          <>
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={() => setSelectedGuideline(null)} />
          <div className="fixed inset-y-0 right-0 w-full md:w-[600px] z-[70] bg-slate-900 border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col transform transition-transform animate-in slide-in-from-right-full">
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-slate-950/50">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase border border-blue-500/30">{selectedGuideline.category}</span>
                  <span className="text-slate-400 text-xs">{selectedGuideline.publicationYear}</span>
                </div>
                <h3 className="text-xl font-bold text-white leading-tight">{selectedGuideline.title}</h3>
                <p className="text-slate-400 text-sm mt-1">{selectedGuideline.organization}</p>
              </div>
              <button 
                onClick={() => setSelectedGuideline(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900">
              
              {activeMainTab === 'library' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <label className="text-emerald-400 text-xs font-bold uppercase mb-2 block">My Personal Notes</label>
                  <textarea 
                    defaultValue={selectedGuideline.notes || ''}
                    onBlur={(e) => {
                      const newNotes = e.target.value;
                      handleSaveToLibrary({...selectedGuideline, notes: newNotes});
                      setSelectedGuideline({...selectedGuideline, notes: newNotes});
                      setLibraryGuidelines(prev => prev.map(g => g.id === selectedGuideline.id ? {...g, notes: newNotes} : g));
                    }}
                    className="w-full bg-slate-950/50 border border-emerald-500/20 focus:border-emerald-500 rounded-lg p-3 text-sm text-emerald-100 placeholder:text-emerald-900/50 min-h-[100px]"
                    placeholder="Add your clinical pearls or personal notes here... (Saves automatically on blur)"
                  />
                </div>
              )}

              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                  <p className="text-sm font-medium animate-pulse">AI is generating detailed summary & algorithms...</p>
                </div>
              ) : (
                <>
                  {/* Executive Summary */}
                  <div className="bg-slate-950/50 rounded-2xl border border-white/5 p-5">
                    <h4 className="text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 bg-blue-500 rounded-full" />
                      Executive Summary
                    </h4>
                    <div className="text-slate-300 text-[14px] leading-[1.8]">
                      {renderFormattedText(selectedGuideline.summary || "Summary not available.")}
                    </div>
                  </div>
                  
                  {/* Key Recommendations */}
                  {selectedGuideline.keyRecommendations && typeof selectedGuideline.keyRecommendations === 'string' && selectedGuideline.keyRecommendations.trim() !== '' && (
                    <div className="bg-slate-950/50 rounded-2xl border border-white/5 p-5">
                      <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                        Key Recommendations & Diagnostic Criteria
                      </h4>
                      <div className="space-y-1">
                        {renderFormattedText(String(selectedGuideline.keyRecommendations))}
                      </div>
                    </div>
                  )}

                  {selectedGuideline.sourceUrl && (
                    <a href={selectedGuideline.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 transition-colors">
                      <ExternalLink size={16} /> View Original Full Guideline
                    </a>
                  )}
                </>
              )}
            </div>

            {activeMainTab === 'search' && (
              <div className="p-6 border-t border-white/10 bg-slate-950">
                <button 
                  onClick={() => handleSaveToLibrary(selectedGuideline)}
                  disabled={isSaving}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {isSaving ? "Saving..." : "Save to Personal Library"}
                </button>
              </div>
            )}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
