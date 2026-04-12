import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, LayoutDashboard, BookOpen, Stethoscope, Presentation, Book,
  ClipboardList, GraduationCap, FileText, Brain, FolderOpen, Award,
  ArrowLeft, Plus, Upload, Trash2, Edit3, Save, X, CheckCircle,
  ChevronRight, Sparkles, Camera, Eye, Download, RotateCw, Image,
  Calendar, Building, TrendingUp, Activity, BarChart3, Star,
  AlertCircle, Check, Loader2, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { generateMedicalContent } from './services/ai';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
type Module = 'dashboard' | 'profile' | 'logbook' | 'cases' | 'seminars' |
  'journals' | 'thesis' | 'teaching' | 'assessments' | 'reflections' | 'documents' | 'cv';

interface Profile {
  user_id: string; full_name?: string; registration_number?: string;
  email?: string; mobile?: string; course?: string; specialty?: string;
  year_of_study?: number; institution_name?: string; department?: string;
  date_of_joining?: string; expected_completion?: string;
  guide_name?: string; co_guide_name?: string; profile_photo_url?: string;
}

interface ImageRecord { id: string; image_url: string; caption?: string; }

interface LogbookEntry {
  id: string; date: string; posting?: string; procedure_name: string;
  role?: string; times_performed?: number; remarks?: string;
  learning_points?: string; ai_notes?: string;
  portfolio_logbook_images?: ImageRecord[];
}
interface CaseEntry {
  id: string; date: string; title: string; diagnosis?: string;
  department?: string; case_type?: string; summary?: string;
  learning_points?: string; ai_notes?: string;
  portfolio_case_images?: ImageRecord[];
}
interface SeminarEntry {
  id: string; title: string; date: string; topic?: string;
  department?: string; key_learning_points?: string; references_text?: string;
  ai_notes?: string; portfolio_seminar_images?: ImageRecord[];
}
interface JournalEntry {
  id: string; article_title: string; journal_name?: string; date_presented: string;
  study_design?: string; key_findings?: string; critical_appraisal?: string;
  learning_points?: string; ai_notes?: string;
  portfolio_journal_images?: ImageRecord[];
}
interface TeachingEntry {
  id: string; date: string; topic: string; audience?: string;
  teaching_method?: string; learning_points?: string; ai_notes?: string;
  portfolio_teaching_images?: ImageRecord[];
}
interface AssessmentEntry {
  id: string; exam_type: string; date: string; topic?: string;
  score?: string; remarks?: string; learning_gaps?: string; ai_notes?: string;
  portfolio_assessment_images?: ImageRecord[];
}
interface ReflectionEntry {
  id: string; title: string; date: string; context?: string;
  what_happened?: string; learning_gained?: string; future_plan?: string;
  ai_notes?: string; portfolio_reflection_images?: ImageRecord[];
}
interface DocumentEntry {
  id: string; title: string; category?: string; date?: string;
  description?: string; ai_notes?: string;
  portfolio_document_images?: ImageRecord[];
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
const getUserId = () => localStorage.getItem('PGMentor_user_id') || 'default';
const API = (path: string) => `/api/portfolio/${path}`;

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(API(path), { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Request failed: ${r.status}`);
  return r.json();
}

function today() { return new Date().toISOString().split('T')[0]; }

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE UPLOADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const ImageUploader = ({
  images, onAdd, onRemove, module, userId, maxImages = 5
}: {
  images: ImageRecord[];
  onAdd: (img: ImageRecord) => void;
  onRemove: (id: string) => void;
  module: string;
  userId: string;
  maxImages?: number;
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Max 10MB.'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG and WebP images allowed.'); return;
    }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await apiFetch('upload-image', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, module, filename: file.name, base64, content_type: file.type }),
      });
      onAdd({ id: crypto.randomUUID(), image_url: res.url, caption: '' });
    } catch (e: any) {
      alert('Upload failed: ' + e.message);
    } finally { setUploading(false); }
  }, [module, userId, onAdd]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-3">
      <label className="text-[#1e3a6e] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
        <Image size={13} /> Evidence Images ({images.length}/{maxImages})
      </label>

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {images.map(img => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square border border-[#dfe6f0] bg-gray-50">
              <img
                src={img.image_url}
                alt={img.caption || 'Evidence'}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setPreviewUrl(img.image_url)}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => setPreviewUrl(img.image_url)}
                  className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                >
                  <Eye size={14} className="text-[#1e3a6e]" />
                </button>
                <button
                  onClick={() => onRemove(img.id)}
                  className="w-8 h-8 bg-red-500/90 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={14} className="text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#c8d8f0] rounded-xl p-4 text-center cursor-pointer hover:border-[#1e3a6e] hover:bg-[#f0f5ff] transition-all"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-[#1e3a6e]">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm font-medium">Uploading...</span>
            </div>
          ) : (
            <>
              <Camera size={24} className="text-[#9aadca] mx-auto mb-1.5" />
              <p className="text-[#6b7e99] text-sm font-medium">Tap to upload or drag & drop</p>
              <p className="text-[#9aadca] text-xs mt-0.5">JPG · PNG · WebP · max 10MB</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Lightbox Preview */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative max-w-3xl max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute -top-10 right-0 text-white/80 hover:text-white"
              >
                <X size={24} />
              </button>
              <img src={previewUrl} alt="Preview" className="max-h-[85vh] rounded-xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// FORM FIELD COMPONENTS (defined outside main component to prevent focus loss)
// ═══════════════════════════════════════════════════════════════════════════
const PField = ({ label, value, onChange, type = 'text', placeholder, required, className = '' }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-[#1e3a6e] text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-[#dfe6f0] rounded-xl px-4 py-2.5 text-[#1e3a6e] text-sm focus:outline-none focus:border-[#3b6fd4] focus:ring-2 focus:ring-[#3b6fd4]/15 transition-all placeholder:text-[#b0c0d8]"
    />
  </div>
);
const PSelect = ({ label, value, onChange, options, required, placeholder }: any) => (
  <div className="space-y-1.5">
    <label className="text-[#1e3a6e] text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-white border border-[#dfe6f0] rounded-xl px-4 py-2.5 text-[#1e3a6e] text-sm focus:outline-none focus:border-[#3b6fd4] focus:ring-2 focus:ring-[#3b6fd4]/15 transition-all"
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);
const PTextArea = ({ label, value, onChange, placeholder, rows = 3 }: any) => (
  <div className="space-y-1.5">
    <label className="text-[#1e3a6e] text-xs font-semibold uppercase tracking-wider">{label}</label>
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white border border-[#dfe6f0] rounded-xl px-4 py-2.5 text-[#1e3a6e] text-sm focus:outline-none focus:border-[#3b6fd4] focus:ring-2 focus:ring-[#3b6fd4]/15 transition-all resize-none placeholder:text-[#b0c0d8]"
    />
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// AI NOTES BUTTON
// ═══════════════════════════════════════════════════════════════════════════
const AINotesBtn = ({ module, data, onGenerated }: {
  module: string; data: any; onGenerated: (notes: string) => void;
}) => {
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portfolio/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, data }),
      });
      const json = await res.json();
      if (json.notes) onGenerated(json.notes);
    } catch (e: any) {
      alert('AI notes generation failed: ' + e.message);
    } finally { setLoading(false); }
  };

  return (
    <button
      type="button"
      onClick={generate}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 !text-white text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-70 shadow-sm"
    >
      {loading ? <Loader2 size={14} className="animate-spin text-white" /> : <Sparkles size={14} className="text-white" />}
      {loading ? 'Generating...' : 'Generate Notes'}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// RECORD CARD
// ═══════════════════════════════════════════════════════════════════════════
const RecordCard = ({ title, subtitle, date, imageCount = 0, hasNotes = false, onEdit, onDelete, color = '#1e3a6e' }: {
  title: string; subtitle?: string; date?: string; imageCount?: number;
  hasNotes?: boolean; onEdit: () => void; onDelete: () => void; color?: string;
}) => (
  <motion.div
    whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(30,58,110,0.12)' }}
    className="bg-white border border-[#e8eef8] rounded-2xl p-4 shadow-sm transition-all flex flex-col gap-3"
  >
    {/* Top accent bar */}
    <div className="w-full h-1 rounded-full" style={{ backgroundColor: color }} />
    <div className="flex-1 min-w-0">
      <h4 className="text-[#1e3a6e] font-bold text-sm leading-snug line-clamp-2">{title}</h4>
      {subtitle && <p className="text-[#6b7e99] text-xs mt-1 truncate">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      {date && (
        <span className="text-[#9aadca] text-[10px] flex items-center gap-0.5 bg-[#f4f7fc] px-2 py-0.5 rounded-lg">
          <Calendar size={9} />{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )}
      {imageCount > 0 && (
        <span className="text-[#9aadca] text-[10px] flex items-center gap-0.5 bg-[#f4f7fc] px-2 py-0.5 rounded-lg">
          <Image size={9} />{imageCount}
        </span>
      )}
      {hasNotes && (
        <span className="text-violet-400 text-[10px] flex items-center gap-0.5 bg-violet-50 px-2 py-0.5 rounded-lg">
          <Sparkles size={9} />AI
        </span>
      )}
    </div>
    <div className="flex items-center gap-2 pt-1 border-t border-[#f0f4fb]">
      <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#f0f5ff] hover:bg-[#dde9ff] text-[#1e3a6e] text-xs font-semibold transition-colors">
        <Edit3 size={12} /> Edit
      </button>
      <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold transition-colors">
        <Trash2 size={12} /> Delete
      </button>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MODULES CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#1e3a6e' },
  { id: 'profile', label: 'Profile', icon: User, color: '#2563eb' },
  { id: 'logbook', label: 'Clinical Logbook', icon: Stethoscope, color: '#0891b2' },
  { id: 'cases', label: 'Case Presentations', icon: ClipboardList, color: '#7c3aed' },
  { id: 'seminars', label: 'Seminars', icon: Presentation, color: '#059669' },
  { id: 'journals', label: 'Journal Club', icon: BookOpen, color: '#d97706' },
  { id: 'thesis', label: 'Thesis Tracker', icon: Activity, color: '#dc2626' },
  { id: 'teaching', label: 'Teaching Activities', icon: GraduationCap, color: '#7c3aed' },
  { id: 'assessments', label: 'Assessments', icon: Award, color: '#0891b2' },
  { id: 'reflections', label: 'Reflections', icon: Brain, color: '#059669' },
  { id: 'documents', label: 'Documents', icon: FolderOpen, color: '#d97706' },
  { id: 'cv', label: 'CV Generator', icon: FileText, color: '#1e3a6e' },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// MODULE LIST VIEW (reusable list + form pattern)
// ═══════════════════════════════════════════════════════════════════════════
function ModuleListView<T extends { id: string; ai_notes?: string; [key: string]: any }>({
  title, icon: Icon, color, items, loading, onAdd, onEdit, onDelete,
  getTitle, getSubtitle, getDate, getImages, renderForm, formTitle, emptyMsg
}: {
  title: string; icon: any; color: string;
  items: T[]; loading: boolean;
  onAdd: () => void; onEdit: (item: T) => void; onDelete: (id: string) => void;
  getTitle: (item: T) => string; getSubtitle?: (item: T) => string;
  getDate: (item: T) => string; getImages: (item: T) => ImageRecord[];
  renderForm?: () => React.ReactNode; formTitle?: string; emptyMsg: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `${color}20` }}>
            <Icon size={18} style={{ color }} />
          </div>
          <div>
            <h2 className="text-[#1e3a6e] font-bold text-lg">{title}</h2>
            <p className="text-[#9aadca] text-xs">{items.length} record{items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 !text-white text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
        >
          <Plus size={16} className="text-white" /> Add New
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#9aadca]" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#eef2fb] rounded-2xl p-12 text-center shadow-sm">
          <Icon size={40} className="mx-auto mb-3 opacity-20" style={{ color }} />
          <p className="text-[#9aadca] font-medium">{emptyMsg}</p>
          <button onClick={onAdd} className="mt-4 text-sm font-semibold" style={{ color }}>
            + Add your first entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map(item => (
            <RecordCard
              key={item.id}
              title={getTitle(item)}
              subtitle={getSubtitle?.(item)}
              date={getDate(item)}
              imageCount={getImages(item).length}
              hasNotes={!!item.ai_notes}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
              color={color}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const EPortfolioMS = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const userId = getUserId();

  // Navigation
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data states
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logbook, setLogbook] = useState<LogbookEntry[]>([]);
  const [cases, setCases] = useState<CaseEntry[]>([]);
  const [seminars, setSeminars] = useState<SeminarEntry[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [teaching, setTeaching] = useState<TeachingEntry[]>([]);
  const [assessments, setAssessments] = useState<AssessmentEntry[]>([]);
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);

  // Thesis data for summary
  const [thesisStudies, setThesisStudies] = useState<any[]>([]);
  const [thesisCases, setThesisCases] = useState<any[]>([]);

  // Loading
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Modal state
  const [modal, setModal] = useState<{ type: string; editing: any | null } | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [formImages, setFormImages] = useState<ImageRecord[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  // ─── NOTIFICATION ──────────────────────────────────────────────────────
  const notify = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  // ─── DATA FETCHING ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, lb, cs, sm, jn, tc, as_, rf, dc, ts, tcs] = await Promise.all([
        apiFetch(`profile?user_id=${userId}`).catch(() => null),
        apiFetch(`logbook?user_id=${userId}`).catch(() => []),
        apiFetch(`cases?user_id=${userId}`).catch(() => []),
        apiFetch(`seminars?user_id=${userId}`).catch(() => []),
        apiFetch(`journals?user_id=${userId}`).catch(() => []),
        apiFetch(`teaching?user_id=${userId}`).catch(() => []),
        apiFetch(`assessments?user_id=${userId}`).catch(() => []),
        apiFetch(`reflections?user_id=${userId}`).catch(() => []),
        apiFetch(`documents?user_id=${userId}`).catch(() => []),
        fetch(`/api/thesis/studies?user_id=${userId}`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`/api/thesis/cases?user_id=${userId}`).then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      setProfile(p);
      setLogbook(lb); setCases(cs); setSeminars(sm); setJournals(jn);
      setTeaching(tc); setAssessments(as_); setReflections(rf); setDocuments(dc);
      setThesisStudies(ts); setThesisCases(tcs);
    } catch (e: any) { notify('error', e.message); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── MODAL HELPERS ──────────────────────────────────────────────────────
  const openModal = (type: string, editing: any = null) => {
    setFormData(editing ? { ...editing } : { date: today(), user_id: userId });
    setFormImages(editing?.[`portfolio_${type === 'logbook' ? 'logbook' : type}_images`] || []);
    setDeletedImageIds([]);
    setModal({ type, editing });
  };
  const closeModal = () => { setModal(null); setFormData({}); setFormImages([]); };
  const setF = (key: string) => (val: any) => setFormData((p: any) => ({ ...p, [key]: val }));

  // ─── IMAGE HELPERS ──────────────────────────────────────────────────────
  const addImage = (img: ImageRecord) => setFormImages(prev => [...prev, img]);
  const removeImage = (id: string) => {
    // If existing image (UUID), mark for deletion
    const existing = formImages.find(i => i.id === id);
    if (existing && modal?.editing) setDeletedImageIds(prev => [...prev, id]);
    setFormImages(prev => prev.filter(i => i.id !== id));
  };

  // ─── SAVE ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!modal) return;
    const { type, editing } = modal;
    setSaving(true);
    try {
      const newImageUrls = formImages
        .filter(i => !editing?.[`portfolio_${type}_images`]?.some((ei: ImageRecord) => ei.id === i.id))
        .map(i => i.image_url);

      const payload = {
        ...formData,
        user_id: userId,
        images: newImageUrls,
        deleteImages: deletedImageIds,
      };

      if (editing) {
        await apiFetch(`${type}/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch(type, { method: 'POST', body: JSON.stringify(payload) });
      }
      notify('success', `${editing ? 'Updated' : 'Saved'} successfully!`);
      closeModal();
      fetchAll();
    } catch (e: any) {
      notify('error', e.message);
    } finally { setSaving(false); }
  };

  // ─── DELETE ─────────────────────────────────────────────────────────────
  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await apiFetch(`${type}/${id}`, { method: 'DELETE' });
      notify('success', 'Record deleted.');
      fetchAll();
    } catch (e: any) { notify('error', e.message); }
  };

  // ─── PROFILE SAVE ───────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true);
    try {
      const saved = await apiFetch('profile', {
        method: 'POST',
        body: JSON.stringify({ ...formData, user_id: userId }),
      });
      setProfile(saved);
      notify('success', 'Profile saved!');
      setModal(null);
    } catch (e: any) { notify('error', e.message); }
    finally { setSaving(false); }
  };

  // ─── CV GENERATOR ───────────────────────────────────────────────────────
  const generateCV = () => {
    const cvContent = `
<!DOCTYPE html>
<html>
<head><title>Academic CV - ${profile?.full_name || 'Student'}</title>
<style>
  body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; }
  h1 { font-size: 26px; color: #1e3a6e; border-bottom: 3px solid #1e3a6e; padding-bottom: 8px; }
  h2 { font-size: 16px; color: #1e3a6e; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 24px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; }
  .entry { margin-bottom: 10px; font-size: 13px; }
  .entry-title { font-weight: bold; }
  .entry-meta { color: #666; font-size: 12px; }
  @media print { body { padding: 20px; } }
</style></head>
<body>
<h1>${profile?.full_name || 'Student Name'}</h1>
<div class="info-grid">
  <div><b>Reg. No:</b> ${profile?.registration_number || '-'}</div>
  <div><b>Course:</b> ${profile?.course || '-'}</div>
  <div><b>Specialty:</b> ${profile?.specialty || '-'}</div>
  <div><b>Year of Study:</b> ${profile?.year_of_study || '-'}</div>
  <div><b>Institution:</b> ${profile?.institution_name || '-'}</div>
  <div><b>Department:</b> ${profile?.department || '-'}</div>
  <div><b>Guide:</b> ${profile?.guide_name || '-'}</div>
  <div><b>Email:</b> ${profile?.email || '-'}</div>
</div>

<h2>Clinical Procedures (${logbook.length})</h2>
${logbook.slice(0, 20).map(l => `<div class="entry"><span class="entry-title">${l.procedure_name}</span> — ${l.role || ''}<span class="entry-meta"> | ${l.date} | ${l.posting || ''}</span></div>`).join('')}

<h2>Case Presentations (${cases.length})</h2>
${cases.slice(0, 15).map(c => `<div class="entry"><span class="entry-title">${c.title}</span> (${c.case_type || ''})<span class="entry-meta"> | ${c.diagnosis || ''} | ${c.date}</span></div>`).join('')}

<h2>Seminars (${seminars.length})</h2>
${seminars.slice(0, 10).map(s => `<div class="entry"><span class="entry-title">${s.title}</span><span class="entry-meta"> | ${s.department || ''} | ${s.date}</span></div>`).join('')}

<h2>Journal Clubs (${journals.length})</h2>
${journals.slice(0, 10).map(j => `<div class="entry"><span class="entry-title">${j.article_title}</span><span class="entry-meta"> | ${j.journal_name || ''} | ${j.date_presented}</span></div>`).join('')}

<h2>Teaching Activities (${teaching.length})</h2>
${teaching.slice(0, 10).map(t => `<div class="entry"><span class="entry-title">${t.topic}</span><span class="entry-meta"> | ${t.audience || ''} | ${t.date}</span></div>`).join('')}

<h2>Assessments (${assessments.length})</h2>
${assessments.slice(0, 10).map(a => `<div class="entry"><span class="entry-title">${a.exam_type}</span> — Score: ${a.score || '-'}<span class="entry-meta"> | ${a.topic || ''} | ${a.date}</span></div>`).join('')}

<h2>Documents & Achievements (${documents.length})</h2>
${documents.map(d => `<div class="entry"><span class="entry-title">${d.title}</span> (${d.category || ''})<span class="entry-meta"> | ${d.date || ''}</span></div>`).join('')}

<p style="margin-top:40px;font-size:11px;color:#999;">Generated by PGMentor e-Portfolio MS on ${new Date().toLocaleDateString()}</p>
</body></html>`;

    const blob = new Blob([cvContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CV_${profile?.full_name?.replace(/\s+/g, '_') || 'student'}_${today()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    notify('success', 'CV downloaded! Open in browser and print as PDF.');
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER FORMS
  // ═══════════════════════════════════════════════════════════════════════
  const renderModalContent = () => {
    if (!modal) return null;
    const { type } = modal;
    const imgModule = type;

    const imageUploader = (
      <ImageUploader
        images={formImages}
        onAdd={addImage}
        onRemove={removeImage}
        module={imgModule}
        userId={userId}
      />
    );

    const aiNotesSection = (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[#1e3a6e] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={12} className="text-violet-500" /> AI Generated Notes
          </label>
          <AINotesBtn module={type} data={formData} onGenerated={notes => setF('ai_notes')(notes)} />
        </div>
        {formData.ai_notes ? (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-sm text-violet-900 leading-relaxed whitespace-pre-wrap">
            {formData.ai_notes}
          </div>
        ) : (
          <div className="bg-gray-50 border border-[#eef2fb] rounded-xl p-3 text-[#b0c0d8] text-sm italic">
            Click "Generate Notes" to create AI-assisted academic notes for this entry.
          </div>
        )}
      </div>
    );

    switch (type) {
      case 'logbook':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PField label="Date" value={formData.date} onChange={setF('date')} type="date" required />
              <PField label="Posting / Rotation" value={formData.posting} onChange={setF('posting')} placeholder="e.g., General Surgery" />
            </div>
            <PField label="Procedure Name" value={formData.procedure_name} onChange={setF('procedure_name')} placeholder="e.g., Central venous access" required />
            <div className="grid grid-cols-2 gap-4">
              <PSelect label="Role" value={formData.role} onChange={setF('role')} options={['Observed', 'Assisted', 'Performed']} placeholder="Select role" required />
              <PField label="No. of Times" value={formData.times_performed} onChange={setF('times_performed')} type="number" placeholder="1" />
            </div>
            <PTextArea label="Remarks / Clinical Notes" value={formData.remarks} onChange={setF('remarks')} placeholder="Key observations, patient details..." />
            <PTextArea label="Learning Points" value={formData.learning_points} onChange={setF('learning_points')} placeholder="What did you learn?" />
            {imageUploader}
            {aiNotesSection}
          </div>
        );

      case 'cases':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PField label="Date" value={formData.date} onChange={setF('date')} type="date" required />
              <PField label="Department" value={formData.department} onChange={setF('department')} placeholder="e.g., Medicine" />
            </div>
            <PField label="Case Title" value={formData.title} onChange={setF('title')} placeholder="e.g., A case of acute liver failure" required />
            <PField label="Diagnosis" value={formData.diagnosis} onChange={setF('diagnosis')} placeholder="Final diagnosis" />
            <PSelect label="Case Type" value={formData.case_type} onChange={setF('case_type')}
              options={['Long Case', 'Short Case', 'Bedside', 'Ward Round', 'CPC']} />
            <PTextArea label="Case Summary" value={formData.summary} onChange={setF('summary')} placeholder="Brief case summary..." rows={4} />
            <PTextArea label="Learning Points" value={formData.learning_points} onChange={setF('learning_points')} placeholder="Key takeaways..." />
            {imageUploader}
            {aiNotesSection}
          </div>
        );

      case 'seminars':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PField label="Date" value={formData.date} onChange={setF('date')} type="date" required />
              <PField label="Department" value={formData.department} onChange={setF('department')} placeholder="e.g., Pharmacology" />
            </div>
            <PField label="Seminar Title" value={formData.title} onChange={setF('title')} placeholder="e.g., Updates in antimicrobial therapy" required />
            <PField label="Topic" value={formData.topic} onChange={setF('topic')} placeholder="Specific topic covered" />
            <PTextArea label="Key Learning Points" value={formData.key_learning_points} onChange={setF('key_learning_points')} placeholder="Main takeaways..." rows={4} />
            <PTextArea label="References" value={formData.references_text} onChange={setF('references_text')} placeholder="Key references cited..." />
            {imageUploader}
            {aiNotesSection}
          </div>
        );

      case 'journals':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PField label="Date Presented" value={formData.date_presented} onChange={setF('date_presented')} type="date" required />
              <PField label="Journal Name" value={formData.journal_name} onChange={setF('journal_name')} placeholder="e.g., NEJM" />
            </div>
            <PField label="Article Title" value={formData.article_title} onChange={setF('article_title')} placeholder="Full article title" required />
            <PField label="Study Design" value={formData.study_design} onChange={setF('study_design')} placeholder="e.g., RCT, Meta-analysis, Cohort" />
            <PTextArea label="Key Findings" value={formData.key_findings} onChange={setF('key_findings')} placeholder="Primary and secondary outcomes..." rows={3} />
            <PTextArea label="Critical Appraisal Notes" value={formData.critical_appraisal} onChange={setF('critical_appraisal')} placeholder="PICO, biases, limitations..." rows={3} />
            <PTextArea label="Learning Points" value={formData.learning_points} onChange={setF('learning_points')} placeholder="Clinical applicability..." />
            {imageUploader}
            {aiNotesSection}
          </div>
        );

      case 'teaching':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PField label="Date" value={formData.date} onChange={setF('date')} type="date" required />
              <PField label="Audience" value={formData.audience} onChange={setF('audience')} placeholder="e.g., MBBS Interns, UGs" />
            </div>
            <PField label="Topic Taught" value={formData.topic} onChange={setF('topic')} placeholder="e.g., ECG interpretation basics" required />
            <PField label="Teaching Method" value={formData.teaching_method} onChange={setF('teaching_method')} placeholder="e.g., Bedside, Seminar, Demonstration" />
            <PTextArea label="Learning Points" value={formData.learning_points} onChange={setF('learning_points')} placeholder="Reflections on the teaching session..." rows={3} />
            {imageUploader}
            {aiNotesSection}
          </div>
        );

      case 'assessments':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PField label="Date" value={formData.date} onChange={setF('date')} type="date" required />
              <PField label="Score / Grade" value={formData.score} onChange={setF('score')} placeholder="e.g., 72/100, B+" />
            </div>
            <PSelect label="Exam Type" value={formData.exam_type} onChange={setF('exam_type')}
              options={['Theory Exam', 'Practical', 'OSCE', 'Mini-CEX', 'DOPS', 'Long Case', 'Short Case', 'Viva', 'Internal Assessment']}
              required />
            <PField label="Topic / Subject" value={formData.topic} onChange={setF('topic')} placeholder="e.g., Pharmacology Theory - Unit 3" />
            <PTextArea label="Remarks" value={formData.remarks} onChange={setF('remarks')} placeholder="Examiner's feedback, overall performance..." />
            <PTextArea label="Learning Gaps Identified" value={formData.learning_gaps} onChange={setF('learning_gaps')} placeholder="Areas to improve..." />
            {imageUploader}
            {aiNotesSection}
          </div>
        );

      case 'reflections':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PField label="Date" value={formData.date} onChange={setF('date')} type="date" required />
              <PField label="Title" value={formData.title} onChange={setF('title')} placeholder="e.g., Learning from a difficult case" required />
            </div>
            <PTextArea label="Context" value={formData.context} onChange={setF('context')} placeholder="What was the situation?" rows={2} />
            <PTextArea label="What Happened" value={formData.what_happened} onChange={setF('what_happened')} placeholder="Describe the experience in detail..." rows={3} />
            <PTextArea label="Learning Gained" value={formData.learning_gained} onChange={setF('learning_gained')} placeholder="What did you learn from this?" rows={3} />
            <PTextArea label="Future Improvement Plan" value={formData.future_plan} onChange={setF('future_plan')} placeholder="How will you apply this learning?" rows={2} />
            {imageUploader}
            {aiNotesSection}
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PField label="Date" value={formData.date} onChange={setF('date')} type="date" />
              <PSelect label="Category" value={formData.category} onChange={setF('category')}
                options={['Certificate', 'Award', 'Conference', 'CME', 'Training', 'Publication', 'Recommendation', 'Other']}
              />
            </div>
            <PField label="Title" value={formData.title} onChange={setF('title')} placeholder="e.g., Workshop on Basic Life Support" required />
            <PTextArea label="Description" value={formData.description} onChange={setF('description')} placeholder="Brief description of this document/achievement..." rows={3} />
            {imageUploader}
            {aiNotesSection}
          </div>
        );

      default:
        return null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════
  const totalDocs = logbook.length + cases.length + seminars.length + journals.length +
    teaching.length + assessments.length + reflections.length + documents.length;

  const completeness = Math.min(100, Math.round(
    ((profile ? 25 : 0) +
      (logbook.length >= 5 ? 15 : logbook.length * 3) +
      (cases.length >= 3 ? 10 : cases.length * 3.3) +
      (seminars.length >= 3 ? 10 : seminars.length * 3.3) +
      (journals.length >= 2 ? 10 : journals.length * 5) +
      (reflections.length >= 2 ? 10 : reflections.length * 5) +
      (documents.length >= 2 ? 10 : documents.length * 5) +
      (teaching.length >= 1 ? 5 : 0) +
      (assessments.length >= 1 ? 5 : 0))
  ));

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-[#1e3a6e] to-[#2a4d8a] rounded-2xl p-6 text-white shadow-lg shadow-[#1e3a6e]/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Welcome back</p>
            <h1 className="text-2xl font-bold">{profile?.full_name || 'Your Portfolio'}</h1>
            <p className="text-blue-200 text-sm mt-1">{profile?.course || ''} {profile?.specialty ? `— ${profile.specialty}` : ''} {profile?.institution_name ? `| ${profile.institution_name}` : ''}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold">{completeness}%</div>
            <div className="text-blue-200 text-xs">Portfolio complete</div>
            <div className="w-24 bg-white/20 rounded-full h-1.5 mt-2">
              <div className="bg-[#c9a84c] h-1.5 rounded-full transition-all" style={{ width: `${completeness}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Clinical Procedures', value: logbook.length, icon: Stethoscope, color: '#0891b2', action: () => setActiveModule('logbook') },
          { label: 'Case Presentations', value: cases.length, icon: ClipboardList, color: '#7c3aed', action: () => setActiveModule('cases') },
          { label: 'Seminars', value: seminars.length, icon: Presentation, color: '#059669', action: () => setActiveModule('seminars') },
          { label: 'Journal Clubs', value: journals.length, icon: BookOpen, color: '#d97706', action: () => setActiveModule('journals') },
          { label: 'Teaching Activities', value: teaching.length, icon: GraduationCap, color: '#7c3aed', action: () => setActiveModule('teaching') },
          { label: 'Assessments', value: assessments.length, icon: Award, color: '#0891b2', action: () => setActiveModule('assessments') },
          { label: 'Reflections', value: reflections.length, icon: Brain, color: '#059669', action: () => setActiveModule('reflections') },
          { label: 'Documents', value: documents.length, icon: FolderOpen, color: '#d97706', action: () => setActiveModule('documents') },
        ].map(stat => (
          <motion.button
            key={stat.label}
            whileHover={{ y: -2 }}
            onClick={stat.action}
            className="bg-white border border-[#eef2fb] rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-sm"
              style={{ background: `${stat.color}18` }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div className="text-2xl font-bold text-[#1e3a6e]">{stat.value}</div>
            <p className="text-[#9aadca] text-xs font-medium leading-tight">{stat.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Log Procedure', icon: Plus, color: '#0891b2', action: () => { setActiveModule('logbook'); openModal('logbook'); } },
          { label: 'Add Case', icon: ClipboardList, color: '#7c3aed', action: () => { setActiveModule('cases'); openModal('cases'); } },
          { label: 'Add Document', icon: Upload, color: '#d97706', action: () => { setActiveModule('documents'); openModal('documents'); } },
          { label: 'Generate CV', icon: FileText, color: '#1e3a6e', action: generateCV },
        ].map(qa => (
          <motion.button
            key={qa.label}
            whileHover={{ y: -2 }}
            onClick={qa.action}
            className="bg-white border border-[#eef2fb] rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-white shadow-sm"
              style={{ background: qa.color }}>
              <qa.icon size={18} />
            </div>
            <p className="text-[#1e3a6e] text-xs font-semibold">{qa.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Profile Missing Prompt */}
      {!profile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3"
        >
          <AlertCircle size={20} className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-amber-900 font-semibold text-sm">Set up your profile</p>
            <p className="text-amber-700 text-xs mt-0.5">Complete your student profile to unlock full CV generation</p>
          </div>
          <button
            onClick={() => setActiveModule('profile')}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors shrink-0"
          >
            Setup
          </button>
        </motion.div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // PROFILE MODULE
  // ═══════════════════════════════════════════════════════════════════════
  const renderProfile = () => {
    const p = profile || {};
    const pf = (k: string) => (v: any) => setFormData((prev: any) => ({ ...prev, [k]: v }));
    if (Object.keys(formData).length === 0) setFormData({ ...p, user_id: userId });

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-[#1e3a6e] font-bold text-lg">Student Profile</h2>
              <p className="text-[#9aadca] text-xs">Your academic identity</p>
            </div>
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1e3a6e] to-[#2a4d8a] !text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm disabled:opacity-70"
          >
            {saving ? <Loader2 size={15} className="animate-spin text-white" /> : <Save size={15} className="text-white" />}
            <span className="text-white">{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>

        <div className="bg-white border border-[#eef2fb] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PField label="Full Name" value={formData.full_name} onChange={pf('full_name')} placeholder="Dr. ..." required />
            <PField label="Registration Number" value={formData.registration_number} onChange={pf('registration_number')} placeholder="e.g., MD-2023-001" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PField label="Email" value={formData.email} onChange={pf('email')} type="email" placeholder="your@email.com" />
            <PField label="Mobile" value={formData.mobile} onChange={pf('mobile')} placeholder="+91 9XXXXXXXXX" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PSelect label="Course" value={formData.course} onChange={pf('course')}
              options={['MD', 'MS', 'MDS', 'DM', 'MCh', 'DNB', 'MSc Medical', 'Nursing', 'BDS PG']} required />
            <PField label="Specialty" value={formData.specialty} onChange={pf('specialty')} placeholder="e.g., Pharmacology" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PField label="Year of Study" value={formData.year_of_study} onChange={pf('year_of_study')} type="number" placeholder="1, 2, or 3" />
            <PField label="Department" value={formData.department} onChange={pf('department')} placeholder="e.g., Medicine" />
          </div>
          <PField label="Institution Name" value={formData.institution_name} onChange={pf('institution_name')} placeholder="Name of your medical college" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PField label="Date of Joining" value={formData.date_of_joining} onChange={pf('date_of_joining')} type="date" />
            <PField label="Expected Completion" value={formData.expected_completion} onChange={pf('expected_completion')} type="date" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PField label="Guide Name" value={formData.guide_name} onChange={pf('guide_name')} placeholder="Dr. ..." />
            <PField label="Co-Guide Name" value={formData.co_guide_name} onChange={pf('co_guide_name')} placeholder="Dr. ... (Optional)" />
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // CV GENERATOR VIEW
  // ═══════════════════════════════════════════════════════════════════════
  const renderCV = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1e3a6e]/10 flex items-center justify-center">
          <FileText size={20} className="text-[#1e3a6e]" />
        </div>
        <div>
          <h2 className="text-[#1e3a6e] font-bold text-lg">Academic CV Generator</h2>
          <p className="text-[#9aadca] text-xs">Auto-generates from your portfolio data</p>
        </div>
      </div>

      <div className="bg-white border border-[#eef2fb] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Procedures', count: logbook.length },
            { label: 'Cases', count: cases.length },
            { label: 'Seminars', count: seminars.length },
            { label: 'Journal Clubs', count: journals.length },
            { label: 'Teaching', count: teaching.length },
            { label: 'Assessments', count: assessments.length },
            { label: 'Reflections', count: reflections.length },
            { label: 'Documents', count: documents.length },
          ].map(item => (
            <div key={item.label} className="bg-[#f7f9fe] rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-[#1e3a6e]">{item.count}</div>
              <div className="text-[#9aadca] text-xs">{item.label}</div>
            </div>
          ))}
        </div>

        {!profile && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex items-center gap-2">
            <AlertCircle size={15} /> Set up your profile first for complete CV generation.
          </div>
        )}

        <button
          onClick={generateCV}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#1e3a6e] to-[#2a4d8a] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md text-sm"
        >
          <Download size={18} /> Generate & Download CV (HTML → Print as PDF)
        </button>
        <p className="text-[#9aadca] text-xs text-center">
          Opens as HTML file. In your browser, press Ctrl+P and select "Save as PDF" to get the final PDF.
        </p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // THESIS TRACKER VIEW
  // ═══════════════════════════════════════════════════════════════════════
  const renderThesis = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Activity size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-[#1e3a6e] font-bold text-lg">Thesis Tracker Summary</h2>
              <p className="text-[#9aadca] text-xs">Overview of your Thesis Data CT</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('feature-thesis-data-ct')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 !text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm"
          >
            <ExternalLink size={15} className="text-white" />
            <span className="text-white">Open Thesis Data CT</span>
          </button>
        </div>

        {thesisStudies.length === 0 ? (
          <div className="bg-white border border-[#eef2fb] rounded-2xl p-12 text-center shadow-sm">
            <Activity size={40} className="mx-auto mb-3 opacity-20 text-red-500" />
            <p className="text-[#9aadca] font-medium">No thesis study created yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {thesisStudies.map(study => {
              const studyCases = thesisCases.filter(c => c.study_id === study.id);
              const comp = studyCases.filter(c => c.is_complete).length;
              const progress = study.sample_size > 0 ? Math.min(100, Math.round((comp / study.sample_size) * 100)) : 0;
              return (
                <div key={study.id} className="bg-white border border-[#eef2fb] rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col gap-4">
                  <div>
                    <h3 className="text-[#1e3a6e] font-bold text-base leading-snug line-clamp-2">{study.thesis_title || 'Untitled Study'}</h3>
                    <p className="text-[#6b7e99] text-xs mt-1 truncate">{study.course} in {study.specialty}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                     <div className="bg-gray-50 rounded-xl p-3 text-center border border-[#eef2fb]">
                       <div className="text-[#9aadca] text-[10px] font-bold uppercase mb-1">Target Sample</div>
                       <div className="text-[#1e3a6e] font-bold text-xl">{study.sample_size || 0}</div>
                     </div>
                     <div className="bg-blue-50 rounded-xl p-3 text-center border border-[#eef2fb]">
                       <div className="text-blue-500 text-[10px] font-bold uppercase mb-1">Total Cases</div>
                       <div className="text-blue-700 font-bold text-xl">{studyCases.length}</div>
                     </div>
                     <div className="bg-green-50 rounded-xl p-3 text-center border border-[#eef2fb]">
                       <div className="text-green-600 text-[10px] font-bold uppercase mb-1">Complete</div>
                       <div className="text-green-700 font-bold text-xl">{comp}</div>
                     </div>
                  </div>

                  <div>
                     <div className="flex justify-between text-xs mb-1.5">
                       <span className="text-[#6b7e99] font-semibold">Data Collection Progress</span>
                       <span className="text-[#1e3a6e] font-bold">{progress}%</span>
                     </div>
                     <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // ACTIVE MODULE RENDERER
  // ═══════════════════════════════════════════════════════════════════════
  const renderModule = () => {
    if (activeModule === 'dashboard') return renderDashboard();
    if (activeModule === 'profile') return renderProfile();
    if (activeModule === 'cv') return renderCV();
    if (activeModule === 'thesis') return renderThesis();

    const moduleConfigs: Record<string, { items: any[]; type: string; icon: any; label: string; color: string; getTitle: (i: any) => string; getSubtitle?: (i: any) => string; getDate: (i: any) => string; getImages: (i: any) => ImageRecord[]; emptyMsg: string; }> = {
      logbook: {
        items: logbook, type: 'logbook', icon: Stethoscope, label: 'Clinical Logbook', color: '#0891b2',
        getTitle: i => i.procedure_name,
        getSubtitle: i => `${i.role || ''} ${i.posting ? '· ' + i.posting : ''}`,
        getDate: i => i.date,
        getImages: i => i.portfolio_logbook_images || [],
        emptyMsg: 'No procedures logged yet. Start by adding your first clinical procedure.',
      },
      cases: {
        items: cases, type: 'cases', icon: ClipboardList, label: 'Case Presentations', color: '#7c3aed',
        getTitle: i => i.title,
        getSubtitle: i => `${i.diagnosis || ''} ${i.case_type ? '· ' + i.case_type : ''}`,
        getDate: i => i.date,
        getImages: i => i.portfolio_case_images || [],
        emptyMsg: 'No cases logged yet. Add your first case presentation.',
      },
      seminars: {
        items: seminars, type: 'seminars', icon: Presentation, label: 'Seminars', color: '#059669',
        getTitle: i => i.title,
        getSubtitle: i => i.department || '',
        getDate: i => i.date,
        getImages: i => i.portfolio_seminar_images || [],
        emptyMsg: 'No seminars logged yet. Add your first seminar.',
      },
      journals: {
        items: journals, type: 'journals', icon: BookOpen, label: 'Journal Club', color: '#d97706',
        getTitle: i => i.article_title,
        getSubtitle: i => `${i.journal_name || ''} ${i.study_design ? '· ' + i.study_design : ''}`,
        getDate: i => i.date_presented,
        getImages: i => i.portfolio_journal_images || [],
        emptyMsg: 'No journal clubs logged yet. Add a paper you presented.',
      },
      teaching: {
        items: teaching, type: 'teaching', icon: GraduationCap, label: 'Teaching Activities', color: '#7c3aed',
        getTitle: i => i.topic,
        getSubtitle: i => `${i.audience || ''} ${i.teaching_method ? '· ' + i.teaching_method : ''}`,
        getDate: i => i.date,
        getImages: i => i.portfolio_teaching_images || [],
        emptyMsg: 'No teaching activities logged yet.',
      },
      assessments: {
        items: assessments, type: 'assessments', icon: Award, label: 'Assessments', color: '#0891b2',
        getTitle: i => i.exam_type,
        getSubtitle: i => `${i.topic || ''} ${i.score ? '· Score: ' + i.score : ''}`,
        getDate: i => i.date,
        getImages: i => i.portfolio_assessment_images || [],
        emptyMsg: 'No assessments recorded yet.',
      },
      reflections: {
        items: reflections, type: 'reflections', icon: Brain, label: 'Reflections', color: '#059669',
        getTitle: i => i.title,
        getSubtitle: i => i.context || '',
        getDate: i => i.date,
        getImages: i => i.portfolio_reflection_images || [],
        emptyMsg: 'No reflections written yet. Start your reflective practice.',
      },
      documents: {
        items: documents, type: 'documents', icon: FolderOpen, label: 'Documents & Achievements', color: '#d97706',
        getTitle: i => i.title,
        getSubtitle: i => i.category || '',
        getDate: i => i.date || '',
        getImages: i => i.portfolio_document_images || [],
        emptyMsg: 'No documents uploaded yet. Add certificates, awards, and publications.',
      },
    };

    const config = moduleConfigs[activeModule];
    if (!config) return null;

    return (
      <ModuleListView
        title={config.label}
        icon={config.icon}
        color={config.color}
        items={config.items}
        loading={loading}
        onAdd={() => openModal(config.type)}
        onEdit={item => openModal(config.type, item)}
        onDelete={id => handleDelete(config.type, id)}
        getTitle={config.getTitle}
        getSubtitle={config.getSubtitle}
        getDate={config.getDate}
        getImages={config.getImages}
        emptyMsg={config.emptyMsg}
      />
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // MODAL TITLE MAP
  // ═══════════════════════════════════════════════════════════════════════
  const modalTitles: Record<string, string> = {
    logbook: 'Clinical Procedure',
    cases: 'Case Presentation',
    seminars: 'Seminar',
    journals: 'Journal Club Entry',
    teaching: 'Teaching Activity',
    assessments: 'Assessment Record',
    reflections: 'Reflection',
    documents: 'Document / Achievement',
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#f4f7fc] flex flex-col">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${
              notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* SIDEBAR */}
        <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-300 py-6 flex flex-col shrink-0`}>
          {/* Back button */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-[#6b7e99] hover:text-[#1e3a6e] text-sm font-semibold px-4 mb-5 transition-colors"
          >
            <ArrowLeft size={16} />
            {sidebarOpen && <span>Professional Mgmt</span>}
          </button>

          {/* Portfolio Brand */}
          {sidebarOpen && (
            <div className="px-4 mb-5">
              <div className="bg-gradient-to-br from-[#1e3a6e] to-[#2a4d8a] rounded-xl px-4 py-3">
                <p className="text-white text-xs font-medium opacity-70">e-Portfolio MS</p>
                <p className="text-white font-bold text-sm truncate">{profile?.full_name || 'My Portfolio'}</p>
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav className="flex-1 space-y-0.5 px-2">
            {MODULES.map(m => {
              const active = activeModule === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => { setActiveModule(m.id as Module); if (m.id === 'profile') setFormData({ ...(profile || {}), user_id: userId }); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#1e3a6e] text-white shadow-sm'
                      : 'text-[#6b7e99] hover:bg-white hover:text-[#1e3a6e] hover:shadow-sm'
                  }`}
                >
                  <m.icon size={16} className="shrink-0" />
                  {sidebarOpen && <span className="truncate">{m.label}</span>}
                  {sidebarOpen && active && <ChevronRight size={14} className="ml-auto shrink-0" />}
                </button>
              );
            })}
          </nav>

          {/* Toggle sidebar */}
          <button
            onClick={() => setSidebarOpen(p => !p)}
            className="mx-4 mt-4 flex items-center justify-center py-2 rounded-xl bg-white border border-[#eef2fb] text-[#9aadca] hover:text-[#1e3a6e] transition-colors text-xs gap-1.5"
          >
            {sidebarOpen ? <><ChevronDown size={14} className="rotate-90" /> Collapse</> : <ChevronDown size={14} className="-rotate-90" />}
          </button>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 px-4 py-6 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ENTRY MODAL */}
      <AnimatePresence>
        {modal && modal.type !== 'profile' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#eef2fb] shrink-0">
                <h3 className="text-[#1e3a6e] font-bold text-base">
                  {modal.editing ? 'Edit' : 'Add'} {modalTitles[modal.type] || modal.type}
                </h3>
                <button onClick={closeModal} className="w-8 h-8 rounded-full bg-[#f0f4fb] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {renderModalContent()}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-[#eef2fb] flex items-center justify-end gap-3 shrink-0">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-[#dfe6f0] text-[#6b7e99] text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a6e] to-[#2a4d8a] !text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-sm disabled:opacity-70"
                >
                  {saving ? <Loader2 size={15} className="animate-spin text-white" /> : <Save size={15} className="text-white" />}
                  <span className="text-white">{saving ? 'Saving...' : modal.editing ? 'Update Record' : 'Save Record'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EPortfolioMS;
