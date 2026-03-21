import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Users,
  Database,
  FileText,
  BookOpen,
  PieChart,
  Settings,
  Plus,
  Search,
  Download,
  MoreVertical,
  Activity,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

// --- TS Interfaces ---
interface Project {
  id: string;
  title: string;
  objectives: string;
  methodology: string;
  location: string;
  supervisorName: string;
}

interface Participant {
  id: string;
  identifier: string; // P001, P002
  age: string;
  gender: string;
  educationLevel: string;
  occupation: string;
  groupClassification: string;
  consentObtained: boolean;
  consentType: string;
  ethicsNumber: string;
}

interface DataCollection {
  id: string;
  participantId: string;
  date: string;
  method: string;
  duration: string;
  location: string;
  notes: string;
}

interface AnalyticalNote {
  id: string;
  participantId: string;
  date: string;
  content: string;
  type: string;
}

interface FieldLog {
  id: string;
  date: string;
  description: string;
  participantsInvolved: string;
  observations: string;
  issues: string;
}

// --- Main Component ---
export default function ThesisNotesManager() {
  const [activeTab, setActiveTab] = useState('home');
  
  // States (now synced with DB)
  const [projects, setProjects] = useState<Project[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [collections, setCollections] = useState<DataCollection[]>([]);
  const [notes, setNotes] = useState<AnalyticalNote[]>([]);
  const [logs, setLogs] = useState<FieldLog[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Fetch from DB on mount
  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const res = await fetch('/api/state/thesis-manager/default');
        if (res.ok) {
          const data = await res.json();
          if (data.projects) setProjects(data.projects);
          if (data.participants) setParticipants(data.participants);
          if (data.collections) setCollections(data.collections);
          if (data.notes) setNotes(data.notes);
          if (data.logs) setLogs(data.logs);
        }
      } catch (e) {
        console.error("Failed to fetch thesis manager data", e);
      } finally {
        setIsDataLoaded(true);
      }
    };
    fetchManagerData();
  }, []);

  // Save to DB on change (debounced)
  useEffect(() => {
    if (!isDataLoaded) return;
    const saveManagerData = async () => {
      try {
        await fetch('/api/state/thesis-manager', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 'default',
            projects,
            participants,
            collections,
            notes,
            logs
          })
        });
      } catch (e) {
        console.error("Failed to save thesis manager data", e);
      }
    };
    const timeoutId = setTimeout(() => {
      saveManagerData();
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [isDataLoaded, projects, participants, collections, notes, logs]);

  // Navigation cards for home screen
  const navCards = [
    { id: 'projects', label: 'Projects', icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20 hover:border-blue-500/50' },
    { id: 'participants', label: 'Participants', icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20 hover:border-violet-500/50' },
    { id: 'collection', label: 'Data Collection', icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20 hover:border-emerald-500/50' },
    { id: 'notes', label: 'Research Notes', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20 hover:border-amber-500/50' },
    { id: 'fieldlog', label: 'Field Log', icon: BookOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20 hover:border-cyan-500/50' },
    { id: 'reports', label: 'Reports', icon: Download, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20 hover:border-rose-500/50' },
  ];

  // Current tab label for header
  const currentTabLabel = navCards.find(c => c.id === activeTab)?.label || '';

  return (
    <div className="bg-[#0b1120] rounded-2xl border border-white/5 overflow-hidden flex flex-col text-slate-200">

      {/* Header */}
      <div className="p-6 pb-0 flex items-center gap-4">
        {activeTab !== 'home' && (
          <button
            onClick={() => setActiveTab('home')}
            className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all shrink-0"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
        )}
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <ClipboardList className="text-blue-500" size={22} />
            Thesis Manager
            {activeTab !== 'home' && (
              <span className="text-slate-500 font-normal text-base ml-1">/ {currentTabLabel}</span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Research & Data Tracking</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {activeTab === 'home' && (
          <div className="flex flex-col items-center p-6 pt-8 overflow-y-auto">

            {/* Pulse Icon */}
            <div className="mb-6">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 34 H18 L24 16 L32 52 L40 24 L46 34 H56" stroke="url(#pulse-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="pulse-grad" x1="8" y1="34" x2="56" y2="34" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#818cf8" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Welcome */}
            <h3 className="text-xl font-semibold text-white mb-3">Welcome to your Research Hub</h3>
            <p className="text-slate-400 text-sm text-center max-w-lg leading-relaxed mb-6">
              Start by establishing your Project context, then recruit Participants using anonymized IDs to maintain ethical constraints. Log their responses and build your qualitative notes.
            </p>

            {/* Navigation Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
              {navCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => setActiveTab(card.id)}
                  className={`group flex items-center gap-3 bg-slate-900/60 border ${card.border} rounded-2xl px-5 py-4 text-left transition-all hover:bg-slate-800/60 hover:shadow-lg hover:shadow-black/20 hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <card.icon size={18} className={card.color} />
                  </div>
                  <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{card.label}</span>
                </button>
              ))}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl mt-8">
              {[
                { label: 'Participants', value: participants.length, icon: Users, color: 'text-blue-400' },
                { label: 'Data Sessions', value: collections.length, icon: Database, color: 'text-purple-400' },
                { label: 'Notes', value: notes.length, icon: FileText, color: 'text-emerald-400' },
                { label: 'Field Logs', value: logs.length, icon: Activity, color: 'text-amber-400' },
              ].map((s, i) => (
                <div key={i} className="bg-slate-900/40 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
                  <s.icon size={16} className={s.color} />
                  <div>
                    <p className="text-lg font-bold text-white leading-none">{s.value}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <ProjectsTab projects={projects} setProjects={setProjects} />
        )}

        {activeTab === 'participants' && (
          <ParticipantsTab participants={participants} setParticipants={setParticipants} />
        )}

        {activeTab === 'collection' && (
          <DataCollectionTab participants={participants} collections={collections} setCollections={setCollections} />
        )}

        {activeTab === 'notes' && (
          <NotesTab participants={participants} notes={notes} setNotes={setNotes} />
        )}

        {activeTab === 'fieldlog' && (
          <FieldLogTab logs={logs} setLogs={setLogs} />
        )}

        {activeTab === 'reports' && (
          <ReportsTab participants={participants} collections={collections} notes={notes} />
        )}

      </div>
    </div>
  );
}

function ProjectsTab({ projects, setProjects }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ title: '', objectives: '', methodology: '', location: '', supervisorName: '' });

  const handleSave = () => {
    if (!form.title) return alert("Title required");
    const newProject = { ...form, id: Date.now().toString() };
    setProjects([...projects, newProject]);
    setIsAdding(false);
    setForm({ title: '', objectives: '', methodology: '', location: '', supervisorName: '' });
  };

  return (
    <div className="p-8 h-full overflow-y-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Research Projects</h2>
        <button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus size={16} /> New Project
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 mb-8 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Create New Project</h3>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Study Title</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Methodology</label>
              <input value={form.methodology} onChange={e => setForm({...form, methodology: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Supervisor Name</label>
              <input value={form.supervisorName} onChange={e => setForm({...form, supervisorName: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Objective / Hypotheses</label>
            <textarea value={form.objectives} onChange={e => setForm({...form, objectives: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 h-24" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 px-6 py-2 rounded-xl text-white font-medium hover:bg-blue-500">Save Project</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {projects.length === 0 && !isAdding && (
          <div className="text-center py-12 text-slate-500 border border-dashed border-white/10 rounded-2xl">No projects created yet.</div>
        )}
        {projects.map((p: any) => (
          <div key={p.id} className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white">{p.title}</h3>
            <p className="text-sm text-blue-400 mt-1 mb-4">{p.methodology} | Supervisor: {p.supervisorName}</p>
            <p className="text-slate-300">{p.objectives}</p>
            <div className="flex justify-end mt-4">
              <button onClick={() => setProjects(projects.filter((x:any) => x.id !== p.id))} className="text-red-400 text-sm hover:underline">Delete Project</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParticipantsTab({ participants, setParticipants }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ identifier: '', age: '', gender: '', educationLevel: '', occupation: '', groupClassification: '', consentObtained: false, consentType: 'Written', ethicsNumber: '' });

  const handleSave = () => {
    if (!form.identifier) return alert("Participant ID required");
    setParticipants([...participants, { ...form, id: Date.now().toString() }]);
    setIsAdding(false);
    setForm({ identifier: '', age: '', gender: '', educationLevel: '', occupation: '', groupClassification: '', consentObtained: false, consentType: 'Written', ethicsNumber: '' });
  };

  return (
    <div className="p-8 h-full overflow-y-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Participants Directory</h2>
        <button onClick={() => {
          setForm({...form, identifier: `P${String(participants.length + 1).padStart(3, '0')}`});
          setIsAdding(true);
        }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus size={16} /> Add Participant
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 mb-8 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Register Participant (Anonymized)</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Participant ID</label>
              <input value={form.identifier} onChange={e => setForm({...form, identifier: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 font-mono tracking-wider text-blue-400" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Age</label>
              <input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Group</label>
              <select value={form.groupClassification} onChange={e => setForm({...form, groupClassification: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500">
                <option value="">Select...</option>
                <option value="Control">Control</option>
                <option value="Experimental">Experimental</option>
                <option value="Observation">Observation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Occupation</label>
              <input value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Education Level</label>
              <input value={form.educationLevel} onChange={e => setForm({...form, educationLevel: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-6">
            <h4 className="text-sm font-bold text-white mb-3 text-emerald-400">Ethics & Consent</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-white/5 cursor-pointer hover:border-blue-500/50">
                <input type="checkbox" checked={form.consentObtained} onChange={e => setForm({...form, consentObtained: e.target.checked})} className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500" />
                <span className="text-sm text-slate-300">Consent Obtained</span>
              </label>
              <div>
                <select value={form.consentType} onChange={e => setForm({...form, consentType: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 text-sm">
                  <option value="Written">Written Consent</option>
                  <option value="Verbal">Verbal Consent</option>
                  <option value="Digital">Digital Signature</option>
                </select>
              </div>
              <div>
                <input placeholder="IRB/Ethics Number" value={form.ethicsNumber} onChange={e => setForm({...form, ethicsNumber: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 px-6 py-2 rounded-xl text-white font-medium hover:bg-blue-500">Save Participant</button>
          </div>
        </div>
      )}

      {/* Participants Table */}
      <div className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-900/80 border-b border-white/10">
              <th className="p-4 font-medium text-slate-400 text-sm">ID</th>
              <th className="p-4 font-medium text-slate-400 text-sm">Demographics</th>
              <th className="p-4 font-medium text-slate-400 text-sm">Group</th>
              <th className="p-4 font-medium text-slate-400 text-sm">Consent Profile</th>
              <th className="p-4 font-medium text-slate-400 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No participants recorded yet.</td></tr>
            )}
            {participants.map((p: any) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-mono font-bold text-blue-400">{p.identifier}</td>
                <td className="p-4 text-sm text-slate-300">
                  {p.age ? `${p.age}y, ` : ''}{p.gender || 'N/A'}<br/>
                  <span className="text-xs text-slate-500">{p.occupation || 'N/A'}</span>
                </td>
                <td className="p-4 text-sm"><span className="px-2 py-1 bg-slate-700 rounded-md text-slate-300">{p.groupClassification || 'Unassigned'}</span></td>
                <td className="p-4">
                  {p.consentObtained ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                      <CheckCircle size={12} /> {p.consentType} 
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-400/10 px-2 py-1 rounded-md">
                      <AlertCircle size={12} /> Pending
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => setParticipants(participants.filter((x:any) => x.id !== p.id))} className="text-slate-500 hover:text-red-400 transition-colors p-2">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DataCollectionTab({ participants, collections, setCollections }: any) {
  const [form, setForm] = useState({ participantId: '', date: '', method: 'Interview', duration: '', location: '', notes: '' });

  const handleSave = () => {
    if (!form.participantId || !form.notes) return alert("Participant and Notes are strictly required");
    setCollections([{ ...form, id: Date.now().toString() }, ...collections]);
    setForm({ participantId: '', date: '', method: 'Interview', duration: '', location: '', notes: '' });
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-y-auto lg:overflow-hidden">
      {/* List/Sidebar */}
      <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/5 bg-slate-900/30 overflow-y-auto flex flex-col max-h-[400px] lg:max-h-none shrink-0">
        <div className="p-4 border-b border-white/5 bg-slate-900/80 sticky top-0">
          <h3 className="text-lg font-bold text-white mb-2">Collection Sessions</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input placeholder="Search sessions..." className="w-full bg-slate-800 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          {collections.map((c: any) => {
            const p = participants.find((x:any) => x.id === c.participantId);
            return (
              <div key={c.id} className="bg-slate-800/80 border border-white/10 p-4 rounded-xl hover:border-blue-500/50 cursor-pointer transition-all">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono font-bold text-sm text-blue-400">{p?.identifier || 'Unknown'}</span>
                  <span className="text-xs text-slate-500">{c.date || 'No date'}</span>
                </div>
                <div className="text-xs text-slate-400 mb-2">{c.method} • {c.duration} mins</div>
                <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">{c.notes}</p>
              </div>
            );
          })}
          {collections.length === 0 && <div className="text-center text-sm text-slate-500 pt-8">No collections recorded</div>}
        </div>
      </div>

      {/* Entry Form */}
      <div className="flex-1 p-8 overflow-y-auto bg-slate-800/20">
        <h2 className="text-2xl font-bold text-white mb-6">Log New Session</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Participant ID *</label>
            <select value={form.participantId} onChange={e => setForm({...form, participantId: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500">
              <option value="">Select Participant...</option>
              {participants.map((p: any) => <option key={p.id} value={p.id}>{p.identifier}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Method</label>
            <select value={form.method} onChange={e => setForm({...form, method: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500">
              <option>Interview</option><option>Survey</option><option>Observation</option><option>Experiment</option><option>Focus Group</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Duration (mins)</label>
            <input type="number" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
            <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center justify-between">
            <span>Participant Responses & Observations *</span>
            <span className="text-xs text-slate-500 font-normal">Use detailed qualitative notes</span>
          </label>
          <textarea 
            value={form.notes} 
            onChange={e => setForm({...form, notes: e.target.value})} 
            className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-slate-200 outline-none focus:border-blue-500 min-h-[300px] leading-relaxed resize-y"
            placeholder="Document transcriptions, general observations, key quotes, etc."
          />
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20">
            <CheckCircle size={18} /> Save Record
          </button>
        </div>
      </div>
    </div>
  );
}

function NotesTab({ participants, notes, setNotes }: any) {
  const [form, setForm] = useState({ participantId: '', type: 'Analytical Insight', content: '' });

  const handleSave = () => {
    if (!form.content) return;
    setNotes([{ ...form, id: Date.now().toString(), date: new Date().toISOString().split('T')[0] }, ...notes]);
    setForm({ participantId: '', type: 'Analytical Insight', content: '' });
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-y-auto lg:overflow-hidden">
      <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/5 bg-slate-900/30 overflow-y-auto p-6 flex flex-col gap-4 shrink-0">
        <h3 className="text-lg font-bold text-white mb-2">Add Interpretive Note</h3>
        
        <div>
           <select value={form.participantId} onChange={e => setForm({...form, participantId: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 text-sm">
              <option value="">General Research Note (No specific participant)</option>
              {participants.map((p: any) => <option key={p.id} value={p.id}>Link to Participant: {p.identifier}</option>)}
           </select>
        </div>
        
        <div>
           <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 text-sm">
              <option>Analytical Insight</option>
              <option>Emerging Pattern</option>
              <option>Coding Theme</option>
              <option>Researcher Reflection</option>
           </select>
        </div>

        <textarea 
          value={form.content} 
          onChange={e => setForm({...form, content: e.target.value})} 
          className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-emerald-500 min-h-[250px] resize-y"
          placeholder="Write your analytical interpretations, thematic codes, or personal reflections here..."
        />
        
        <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg w-full">Save Note</button>
      </div>
      
      <div className="flex-1 p-8 overflow-y-auto bg-slate-800/20">
        <h2 className="text-2xl font-bold text-white mb-6">Research Notes Index</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((n: any) => {
             const p = participants.find((x:any) => x.id === n.participantId);
             return (
               <div key={n.id} className="bg-slate-800/80 border border-white/10 p-5 rounded-2xl relative group">
                 <button onClick={() => setNotes(notes.filter((x:any) => x.id !== n.id))} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                 <div className="flex items-center gap-2 mb-3">
                   <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">{n.type}</span>
                   {p && <span className="font-mono text-sm text-blue-400 font-bold">{p.identifier}</span>}
                 </div>
                 <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{n.content}</p>
                 <div className="text-xs text-slate-500 mt-4 text-right">{n.date}</div>
               </div>
             );
          })}
          {notes.length === 0 && <div className="text-slate-500 col-span-2 text-center py-20">No analytical notes created yet. Use the left panel to add your first insight.</div>}
        </div>
      </div>
    </div>
  );
}

function FieldLogTab({ logs, setLogs }: any) {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', participantsInvolved: '', observations: '', issues: '' });
  
  const handleSave = () => {
    if (!form.description) return alert("Log description is required.");
    setLogs([{ ...form, id: Date.now().toString() }, ...logs]);
    setForm({ date: new Date().toISOString().split('T')[0], description: '', participantsInvolved: '', observations: '', issues: '' });
  };

  return (
    <div className="p-8 h-full overflow-y-auto w-full flex flex-col md:flex-row gap-8">
      
      <div className="w-full md:w-1/3 space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Post Field Log Entry</h2>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Date</label>
          <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Activity Description *</label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 h-24" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Participants Involved</label>
          <input placeholder="e.g., P001, P004" value={form.participantsInvolved} onChange={e => setForm({...form, participantsInvolved: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 font-mono text-sm" />
        </div>
        <div>
          <label className="block text-sm text-amber-400/80 mb-1">Issues Encountered / Resolutions</label>
          <textarea value={form.issues} onChange={e => setForm({...form, issues: e.target.value})} className="w-full bg-amber-900/10 border border-amber-500/20 rounded-xl px-4 py-2 text-white outline-none focus:border-amber-500 h-20" />
        </div>
        <button onClick={handleSave} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl mt-2 transition-colors">Submit Log Entry</button>
      </div>

      <div className="w-full md:w-2/3 md:border-l md:border-transparent lg:border-white/10 md:pl-8 max-md:border-t max-md:pt-8 max-md:border-white/10">
        <h2 className="text-xl font-bold text-white mb-6">Activity Diary Timeline</h2>
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
          {logs.length === 0 && <div className="text-center text-slate-500 pt-10">Your research timeline is empty.</div>}
          {logs.map((log: any) => (
            <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-slate-800 text-blue-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <Activity size={16} />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/80 border border-white/10 p-5 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                   <div className="font-bold text-white text-sm">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                   <button onClick={() => setLogs(logs.filter((x:any) => x.id !== log.id))} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
                </div>
                {log.participantsInvolved && <div className="text-xs text-blue-400 font-mono mb-2">Ref: {log.participantsInvolved}</div>}
                <p className="text-sm text-slate-300 mb-3">{log.description}</p>
                {log.issues && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block mb-1">Issue/Flag</span>
                    <p className="text-xs text-amber-100/70">{log.issues}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsTab({ participants, collections, notes }: any) {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Exports & Reporting</h2>
      <p className="text-slate-400 mb-8 max-w-2xl">
        Export your structured academic data for integration into your thesis writing software, statistical analysis tools (SPSS/R), or as pure text manuscripts.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 flex flex-col">
          <Database className="text-blue-500 w-10 h-10 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Participant Matrix (CSV)</h3>
          <p className="text-sm text-slate-400 mb-6 flex-1">Export an anonymized spreadsheet of all participants, their demographics, group classifications, and consent profiles.</p>
          <button className="w-full py-3 bg-blue-600/20 text-blue-400 font-medium rounded-xl hover:bg-blue-600/30 transition-colors border border-blue-500/30 flex justify-center items-center gap-2">
            <Download size={16} /> Download CSV
          </button>
        </div>

        <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 flex flex-col">
          <FileText className="text-purple-500 w-10 h-10 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Qualitative Transcripts</h3>
          <p className="text-sm text-slate-400 mb-6 flex-1">Generate a structured document containing all raw participant responses and observations across all data collection sessions.</p>
          <button className="w-full py-3 bg-purple-600/20 text-purple-400 font-medium rounded-xl hover:bg-purple-600/30 transition-colors border border-purple-500/30 flex justify-center items-center gap-2">
            <Download size={16} /> Export to Word/PDF
          </button>
        </div>

        <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 flex flex-col">
          <BookOpen className="text-emerald-500 w-10 h-10 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Analytical Codebook</h3>
          <p className="text-sm text-slate-400 mb-6 flex-1">Compile all thematic, analytical, and reflexive notes extracted by the researcher, automatically sorted by themes or participant linkage.</p>
          <button className="w-full py-3 bg-emerald-600/20 text-emerald-400 font-medium rounded-xl hover:bg-emerald-600/30 transition-colors border border-emerald-500/30 flex justify-center items-center gap-2">
            <Download size={16} /> Export Notes
          </button>
        </div>
      </div>
    </div>
  );
}
