import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList, Plus, Edit3, Trash2, Save, Download, Search,
  ChevronRight, ChevronDown, ChevronUp, CheckCircle, AlertCircle,
  BarChart3, FileText, Users, Activity, Eye, X, Filter,
  ArrowLeft, Calendar, GraduationCap, Stethoscope, Target,
  TrendingUp, Award, Sparkles, BookOpen
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
interface ThesisStudy {
  id: string;
  user_id: string;
  course: string;
  specialty: string;
  thesis_title: string;
  guide_name: string;
  co_guide_name?: string;
  institution_name: string;
  year_of_admission: string;
  study_type: string;
  sample_size: number;
  study_duration?: string;
  inclusion_criteria?: string;
  exclusion_criteria?: string;
  primary_outcome?: string;
  secondary_outcome?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface ThesisCase {
  id: string;
  study_id: string;
  user_id: string;
  subject_id: string;
  age?: number;
  gender?: string;
  date_of_recruitment?: string;
  diagnosis?: string;
  clinical_findings?: string;
  duration_of_illness?: string;
  relevant_history?: string;
  examination_findings?: string;
  laboratory_values?: string;
  imaging_findings?: string;
  scores_grading?: string;
  measurements?: string;
  drug_therapy?: string;
  procedure_details?: string;
  intervention_details?: string;
  outcome_status?: string;
  improvement?: string;
  complications?: string;
  follow_up_findings?: string;
  remarks?: string;
  observations?: string;
  is_complete?: boolean;
  is_draft?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const COURSES = ['MD', 'MS', 'MDS', 'DM', 'MCh', 'DNB', 'MSc Medical'];

const SPECIALTIES = [
  'Anatomy', 'Physiology', 'Biochemistry', 'Pharmacology', 'Pathology',
  'Microbiology', 'Forensic Medicine & Toxicology', 'PSM / Community Medicine',
  'General Medicine', 'General Surgery', 'Obstetrics & Gynecology', 'Pediatrics',
  'ENT', 'Ophthalmology', 'Orthopaedics', 'Dermatology (DVL)', 'Psychiatry',
  'Anaesthesiology', 'Radio Diagnosis', 'Radiotherapy', 'Pulmonary Medicine',
  'Cardiology', 'Neurology', 'Nephrology', 'Gastroenterology',
  'Endocrinology', 'Rheumatology', 'Neonatology', 'CTVS', 'Neurosurgery',
  'Urology', 'Plastic Surgery', 'Oncology', 'Emergency Medicine', 'Other'
];

const STUDY_TYPES = [
  'Observational', 'Interventional', 'Cross-sectional', 'Cohort',
  'Case control', 'Randomized trial', 'Diagnostic study', 'Case series',
  'Case report', 'Qualitative', 'Mixed methods', 'Other'
];

const GENDERS = ['Male', 'Female', 'Other'];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════════════════════════
const getUserId = () => localStorage.getItem('PGMentor_user_id') || '';

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const InputField = ({ label, value, onChange, type = 'text', placeholder, required, className = '' }: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-[#1e3a6e] text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(type === 'number' ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-[#dfe6f0] rounded-xl px-4 py-2.5 text-[#1e3a6e] text-sm focus:outline-none focus:border-[#1e3a6e] focus:ring-1 focus:ring-[#1e3a6e]/20 transition-all shadow-sm placeholder:text-[#9aadca]"
    />
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder, rows = 3 }: any) => (
  <div className="space-y-1.5">
    <label className="text-[#1e3a6e] text-xs font-semibold uppercase tracking-wider">{label}</label>
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white border border-[#dfe6f0] rounded-xl px-4 py-2.5 text-[#1e3a6e] text-sm focus:outline-none focus:border-[#1e3a6e] focus:ring-1 focus:ring-[#1e3a6e]/20 transition-all shadow-sm resize-none placeholder:text-[#9aadca]"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, required, placeholder }: any) => (
  <div className="space-y-1.5">
    <label className="text-[#1e3a6e] text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-white border border-[#dfe6f0] rounded-xl px-4 py-2.5 text-[#1e3a6e] text-sm focus:outline-none focus:border-[#1e3a6e] focus:ring-1 focus:ring-[#1e3a6e]/20 transition-all shadow-sm"
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const ThesisDataCollection = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  // ─── View states ──────────────────────────────────────────────────────
  const [view, setView] = useState<'dashboard' | 'setup' | 'entry' | 'table' | 'case-form'>('dashboard');

  // ─── Data states ──────────────────────────────────────────────────────
  const [studies, setStudies] = useState<ThesisStudy[]>([]);
  const [cases, setCases] = useState<ThesisCase[]>([]);
  const [activeStudy, setActiveStudy] = useState<ThesisStudy | null>(null);
  const [editingCase, setEditingCase] = useState<ThesisCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success'|'error'|'warning', message: string} | null>(null);

  // ─── Search/Filter ────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('subject_id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterComplete, setFilterComplete] = useState<string>('all');

  // ─── Study Form state ─────────────────────────────────────────────────
  const [studyForm, setStudyForm] = useState<Partial<ThesisStudy>>({
    course: '', specialty: '', thesis_title: '', guide_name: '', co_guide_name: '',
    institution_name: '', year_of_admission: '', study_type: '', sample_size: 30,
    study_duration: '', inclusion_criteria: '', exclusion_criteria: '',
    primary_outcome: '', secondary_outcome: ''
  });

  // ─── Case Form state ──────────────────────────────────────────────────
  const emptyCaseForm: Partial<ThesisCase> = {
    subject_id: '', age: undefined, gender: '', date_of_recruitment: '',
    diagnosis: '', clinical_findings: '', duration_of_illness: '', relevant_history: '',
    examination_findings: '', laboratory_values: '', imaging_findings: '',
    scores_grading: '', measurements: '', drug_therapy: '', procedure_details: '',
    intervention_details: '', outcome_status: '', improvement: '', complications: '',
    follow_up_findings: '', remarks: '', observations: '', is_complete: false, is_draft: true
  };
  const [caseForm, setCaseForm] = useState<Partial<ThesisCase>>(emptyCaseForm);

  // ─── Notification util ────────────────────────────────────────────────
  const showNotification = (type: 'success'|'error'|'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════
  const fetchStudies = async () => {
    try {
      const res = await fetch(`/api/thesis/studies?user_id=${getUserId()}`);
      if (res.ok) {
        const data = await res.json();
        setStudies(data);
        if (data.length > 0 && !activeStudy) {
          setActiveStudy(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch studies:', err);
    }
  };

  const fetchCases = async (studyId: string) => {
    try {
      const res = await fetch(`/api/thesis/cases?study_id=${studyId}&user_id=${getUserId()}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchStudies();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeStudy) {
      fetchCases(activeStudy.id);
    }
  }, [activeStudy]);

  // ═══════════════════════════════════════════════════════════════════════
  // STUDY CRUD
  // ═══════════════════════════════════════════════════════════════════════
  const handleSaveStudy = async () => {
    if (!studyForm.thesis_title || !studyForm.course || !studyForm.specialty || !studyForm.guide_name || !studyForm.institution_name || !studyForm.year_of_admission || !studyForm.study_type) {
      showNotification('error', 'Please fill all required fields marked with *');
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!studyForm.id;
      const res = await fetch(`/api/thesis/studies${isEdit ? `/${studyForm.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...studyForm, user_id: getUserId() })
      });
      if (res.ok) {
        const saved = await res.json();
        showNotification('success', isEdit ? 'Study updated successfully!' : 'Study created successfully!');
        await fetchStudies();
        setActiveStudy(saved);
        setView('dashboard');
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      showNotification('error', 'Failed to save study. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study and ALL its cases? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/thesis/studies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Study deleted successfully.');
        setStudies(prev => prev.filter(s => s.id !== id));
        if (activeStudy?.id === id) {
          setActiveStudy(studies.length > 1 ? studies.find(s => s.id !== id) || null : null);
          setCases([]);
        }
      }
    } catch (err) {
      showNotification('error', 'Failed to delete study.');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // CASE CRUD
  // ═══════════════════════════════════════════════════════════════════════
  const handleSaveCase = async (markComplete: boolean = false) => {
    if (!activeStudy) return;
    if (!caseForm.subject_id) {
      showNotification('error', 'Subject ID / Case Number is required.');
      return;
    }
    // Duplicate check
    const isDuplicate = cases.some(c => c.subject_id === caseForm.subject_id && c.id !== caseForm.id);
    if (isDuplicate) {
      showNotification('warning', `Subject ID "${caseForm.subject_id}" already exists! Please use a unique ID.`);
      return;
    }

    setSaving(true);
    const payload = {
      ...caseForm,
      study_id: activeStudy.id,
      user_id: getUserId(),
      is_complete: markComplete,
      is_draft: !markComplete
    };
    try {
      const isEdit = !!caseForm.id;
      const res = await fetch(`/api/thesis/cases${isEdit ? `/${caseForm.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showNotification('success', markComplete ? 'Case marked as complete!' : isEdit ? 'Case updated!' : 'Case saved as draft!');
        await fetchCases(activeStudy.id);
        setCaseForm(emptyCaseForm);
        setEditingCase(null);
        setView('entry');
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      showNotification('error', 'Failed to save case.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!confirm('Delete this case entry?')) return;
    try {
      const res = await fetch(`/api/thesis/cases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Case deleted.');
        if (activeStudy) await fetchCases(activeStudy.id);
      }
    } catch (err) {
      showNotification('error', 'Failed to delete case.');
    }
  };

  const openEditCase = (c: ThesisCase) => {
    setEditingCase(c);
    setCaseForm(c);
    setView('case-form');
  };

  const openNewCase = () => {
    setEditingCase(null);
    const nextNum = cases.length + 1;
    setCaseForm({ ...emptyCaseForm, subject_id: `S${String(nextNum).padStart(3, '0')}`, date_of_recruitment: new Date().toISOString().split('T')[0] });
    setView('case-form');
  };

  // ═══════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════
  const exportCSV = () => {
    if (!cases.length) return;
    const headers = ['Subject ID', 'Age', 'Gender', 'Date of Recruitment', 'Diagnosis', 'Clinical Findings', 'Duration of Illness', 'Relevant History', 'Examination Findings', 'Laboratory Values', 'Imaging Findings', 'Scores/Grading', 'Measurements', 'Drug Therapy', 'Procedure', 'Intervention Details', 'Outcome Status', 'Improvement', 'Complications', 'Follow-up Findings', 'Remarks', 'Observations', 'Complete', 'Date Entered'];
    const rows = cases.map(c => [
      c.subject_id, c.age ?? '', c.gender ?? '', c.date_of_recruitment ?? '',
      c.diagnosis ?? '', c.clinical_findings ?? '', c.duration_of_illness ?? '',
      c.relevant_history ?? '', c.examination_findings ?? '', c.laboratory_values ?? '',
      c.imaging_findings ?? '', c.scores_grading ?? '', c.measurements ?? '',
      c.drug_therapy ?? '', c.procedure_details ?? '', c.intervention_details ?? '',
      c.outcome_status ?? '', c.improvement ?? '', c.complications ?? '',
      c.follow_up_findings ?? '', c.remarks ?? '', c.observations ?? '',
      c.is_complete ? 'Yes' : 'No', c.created_at ? new Date(c.created_at).toLocaleDateString() : ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeStudy?.thesis_title?.replace(/\s+/g, '_') || 'thesis'}_data.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Data exported as CSV!');
  };

  // ═══════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════
  const completedCases = cases.filter(c => c.is_complete).length;
  const draftCases = cases.filter(c => c.is_draft && !c.is_complete).length;
  const progress = activeStudy ? Math.round((completedCases / activeStudy.sample_size) * 100) : 0;

  const filteredCases = useMemo(() => {
    let result = [...cases];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.subject_id?.toLowerCase().includes(term) ||
        c.diagnosis?.toLowerCase().includes(term) ||
        c.outcome_status?.toLowerCase().includes(term)
      );
    }
    if (filterGender !== 'all') result = result.filter(c => c.gender === filterGender);
    if (filterComplete === 'complete') result = result.filter(c => c.is_complete);
    if (filterComplete === 'draft') result = result.filter(c => !c.is_complete);
    result.sort((a, b) => {
      const aVal = (a as any)[sortField] ?? '';
      const bVal = (b as any)[sortField] ?? '';
      if (sortDir === 'asc') return String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
    });
    return result;
  }, [cases, searchTerm, sortField, sortDir, filterGender, filterComplete]);

  // ═══════════════════════════════════════════════════════════════════════
  // PROGRESS BAR
  // ═══════════════════════════════════════════════════════════════════════
  const ProgressBar = ({ current, total }: { current: number; total: number }) => {
    const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-[#1e3a6e]">{current} / {total} cases completed</span>
          <span className={`text-xs font-bold ${pct >= 100 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-[#6b7e99]'}`}>{pct}%</span>
        </div>
        <div className="w-full h-3 bg-[#eef2f8] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${pct >= 100 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : pct >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-[#1e3a6e] to-[#3b82f6]'}`}
          />
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICATION
  // ═══════════════════════════════════════════════════════════════════════
  const NotificationBanner = () => {
    if (!notification) return null;
    const colors = {
      success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      error: 'bg-red-50 border-red-200 text-red-700',
      warning: 'bg-amber-50 border-amber-200 text-amber-700'
    };
    const icons = {
      success: <CheckCircle size={16} />,
      error: <AlertCircle size={16} />,
      warning: <AlertCircle size={16} />
    };
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`fixed top-4 right-4 z-[100] ${colors[notification.type]} border rounded-xl px-5 py-3 shadow-lg flex items-center gap-2 text-sm font-semibold max-w-md`}
      >
        {icons[notification.type]}
        {notification.message}
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#1e3a6e]/20 border-t-[#1e3a6e] rounded-full animate-spin" />
        <p className="text-[#6b7e99] font-medium">Loading Thesis Data...</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NO STUDY → PROMPT TO CREATE
  // ═══════════════════════════════════════════════════════════════════════
  if (studies.length === 0 && view === 'dashboard') {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AnimatePresence><NotificationBanner /></AnimatePresence>
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#d4b85c] via-[#c9a84c] to-[#b8942e] rounded-2xl flex items-center justify-center shadow-lg shadow-[#c9a84c]/30">
            <ClipboardList size={36} className="text-[#1e3a6e]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1e3a6e] mb-3">Thesis Data Collection Tool</h1>
          <p className="text-[#6b7e99] text-lg mb-8 max-w-lg mx-auto">
            Create your thesis study profile and start entering structured research data for your postgraduate thesis.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setStudyForm({
                course: '', specialty: '', thesis_title: '', guide_name: '', co_guide_name: '',
                institution_name: '', year_of_admission: '', study_type: '', sample_size: 30,
                study_duration: '', inclusion_criteria: '', exclusion_criteria: '',
                primary_outcome: '', secondary_outcome: ''
              });
              setView('setup');
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1e3a6e] to-[#2a4d8a] !text-white text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#1e3a6e]/30 hover:shadow-xl transition-all"
          >
            <Plus size={22} /> Create Your Study
          </motion.button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STUDY SETUP FORM
  // ═══════════════════════════════════════════════════════════════════════
  if (view === 'setup') {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AnimatePresence><NotificationBanner /></AnimatePresence>
        <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-[#6b7e99] hover:text-[#1e3a6e] text-sm font-semibold mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Thesis Dashboard
        </button>
        <div className="bg-white border border-[#dfe6f0] rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-gradient-to-br from-[#d4b85c] to-[#b8942e] rounded-xl flex items-center justify-center shadow-md">
              <GraduationCap size={22} className="text-[#1e3a6e]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1e3a6e]">{studyForm.id ? 'Edit Study Profile' : 'Create Study Profile'}</h2>
              <p className="text-[#6b7e99] text-sm">Fill in your thesis study details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SelectField label="Course" value={studyForm.course} onChange={(v: string) => setStudyForm(p => ({...p, course: v}))} options={COURSES} required placeholder="Select Course" />
            <SelectField label="Specialty" value={studyForm.specialty} onChange={(v: string) => setStudyForm(p => ({...p, specialty: v}))} options={SPECIALTIES} required placeholder="Select Specialty" />
            <InputField label="Thesis Title" value={studyForm.thesis_title} onChange={(v: string) => setStudyForm(p => ({...p, thesis_title: v}))} required placeholder="Enter thesis title" className="md:col-span-2" />
            <InputField label="Guide Name" value={studyForm.guide_name} onChange={(v: string) => setStudyForm(p => ({...p, guide_name: v}))} required placeholder="Dr. ..." />
            <InputField label="Co-guide Name" value={studyForm.co_guide_name} onChange={(v: string) => setStudyForm(p => ({...p, co_guide_name: v}))} placeholder="Optional" />
            <InputField label="Institution Name" value={studyForm.institution_name} onChange={(v: string) => setStudyForm(p => ({...p, institution_name: v}))} required placeholder="Enter institution" className="md:col-span-2" />
            <InputField label="Year of Admission" value={studyForm.year_of_admission} onChange={(v: string) => setStudyForm(p => ({...p, year_of_admission: v}))} required placeholder="e.g., 2024" />
            <SelectField label="Study Type" value={studyForm.study_type} onChange={(v: string) => setStudyForm(p => ({...p, study_type: v}))} options={STUDY_TYPES} required placeholder="Select Study Type" />
            <InputField label="Sample Size" value={studyForm.sample_size} onChange={(v: number) => setStudyForm(p => ({...p, sample_size: v}))} type="number" required placeholder="e.g., 50" />
            <InputField label="Study Duration" value={studyForm.study_duration} onChange={(v: string) => setStudyForm(p => ({...p, study_duration: v}))} placeholder="e.g., 18 months" />
            <TextAreaField label="Inclusion Criteria" value={studyForm.inclusion_criteria} onChange={(v: string) => setStudyForm(p => ({...p, inclusion_criteria: v}))} placeholder="Enter inclusion criteria..." />
            <TextAreaField label="Exclusion Criteria" value={studyForm.exclusion_criteria} onChange={(v: string) => setStudyForm(p => ({...p, exclusion_criteria: v}))} placeholder="Enter exclusion criteria..." />
            <TextAreaField label="Primary Outcome" value={studyForm.primary_outcome} onChange={(v: string) => setStudyForm(p => ({...p, primary_outcome: v}))} placeholder="Primary outcome measure..." />
            <TextAreaField label="Secondary Outcome" value={studyForm.secondary_outcome} onChange={(v: string) => setStudyForm(p => ({...p, secondary_outcome: v}))} placeholder="Secondary outcome measure..." />
          </div>

          <div className="flex gap-3 mt-8 justify-end">
            <button onClick={() => setView('dashboard')} className="px-6 py-3 border border-[#dfe6f0] text-[#6b7e99] rounded-xl font-semibold hover:bg-[#f5f7fa] transition-colors text-sm">Cancel</button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveStudy}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-[#1e3a6e] to-[#2a4d8a] !text-white text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#1e3a6e]/20 hover:shadow-xl transition-all disabled:opacity-50 text-sm"
            >
              <Save size={18} /> {saving ? 'Saving...' : studyForm.id ? 'Update Study' : 'Create Study'}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CASE ENTRY FORM
  // ═══════════════════════════════════════════════════════════════════════
  if (view === 'case-form') {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AnimatePresence><NotificationBanner /></AnimatePresence>
        <button onClick={() => { setView('entry'); setEditingCase(null); setCaseForm(emptyCaseForm); }} className="flex items-center gap-1.5 text-[#6b7e99] hover:text-[#1e3a6e] text-sm font-semibold mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Cases
        </button>

        <div className="bg-white border border-[#dfe6f0] rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
              <Users size={22} className="!text-white text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1e3a6e]">{editingCase ? `Edit Case: ${editingCase.subject_id}` : 'New Case Entry'}</h2>
              <p className="text-[#6b7e99] text-sm">{activeStudy?.thesis_title}</p>
            </div>
          </div>

          {/* Section: Basic Details */}
          <div className="mb-8">
            <h3 className="text-[#1e3a6e] font-bold text-sm mb-4 flex items-center gap-2 pb-2 border-b border-[#eef2f8]">
              <Users size={16} className="text-[#c9a84c]" /> Basic Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InputField label="Subject ID" value={caseForm.subject_id} onChange={(v: string) => setCaseForm(p => ({...p, subject_id: v}))} required placeholder="e.g., S001" />
              <InputField label="Age" value={caseForm.age} onChange={(v: number) => setCaseForm(p => ({...p, age: v}))} type="number" placeholder="Years" />
              <SelectField label="Gender" value={caseForm.gender} onChange={(v: string) => setCaseForm(p => ({...p, gender: v}))} options={GENDERS} placeholder="Select" />
              <InputField label="Date of Recruitment" value={caseForm.date_of_recruitment} onChange={(v: string) => setCaseForm(p => ({...p, date_of_recruitment: v}))} type="date" />
            </div>
          </div>

          {/* Section: Clinical Data */}
          <div className="mb-8">
            <h3 className="text-[#1e3a6e] font-bold text-sm mb-4 flex items-center gap-2 pb-2 border-b border-[#eef2f8]">
              <Stethoscope size={16} className="text-[#c9a84c]" /> Clinical Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Diagnosis" value={caseForm.diagnosis} onChange={(v: string) => setCaseForm(p => ({...p, diagnosis: v}))} placeholder="Primary diagnosis" />
              <InputField label="Duration of Illness" value={caseForm.duration_of_illness} onChange={(v: string) => setCaseForm(p => ({...p, duration_of_illness: v}))} placeholder="e.g., 6 months" />
              <TextAreaField label="Clinical Findings" value={caseForm.clinical_findings} onChange={(v: string) => setCaseForm(p => ({...p, clinical_findings: v}))} placeholder="Document clinical findings..." />
              <TextAreaField label="Relevant History" value={caseForm.relevant_history} onChange={(v: string) => setCaseForm(p => ({...p, relevant_history: v}))} placeholder="Past history, family history..." />
              <TextAreaField label="Examination Findings" value={caseForm.examination_findings} onChange={(v: string) => setCaseForm(p => ({...p, examination_findings: v}))} placeholder="Physical examination findings..." />
            </div>
          </div>

          {/* Section: Investigations */}
          <div className="mb-8">
            <h3 className="text-[#1e3a6e] font-bold text-sm mb-4 flex items-center gap-2 pb-2 border-b border-[#eef2f8]">
              <Activity size={16} className="text-[#c9a84c]" /> Investigation Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextAreaField label="Laboratory Values" value={caseForm.laboratory_values} onChange={(v: string) => setCaseForm(p => ({...p, laboratory_values: v}))} placeholder="Lab results, blood values..." />
              <TextAreaField label="Imaging Findings" value={caseForm.imaging_findings} onChange={(v: string) => setCaseForm(p => ({...p, imaging_findings: v}))} placeholder="X-ray, CT, MRI findings..." />
              <InputField label="Scores / Grading" value={caseForm.scores_grading} onChange={(v: string) => setCaseForm(p => ({...p, scores_grading: v}))} placeholder="e.g., GCS 15, APACHE II: 12" />
              <InputField label="Measurements" value={caseForm.measurements} onChange={(v: string) => setCaseForm(p => ({...p, measurements: v}))} placeholder="e.g., BP: 120/80, BMI: 24.5" />
            </div>
          </div>

          {/* Section: Treatment */}
          <div className="mb-8">
            <h3 className="text-[#1e3a6e] font-bold text-sm mb-4 flex items-center gap-2 pb-2 border-b border-[#eef2f8]">
              <Target size={16} className="text-[#c9a84c]" /> Treatment Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextAreaField label="Drug Therapy" value={caseForm.drug_therapy} onChange={(v: string) => setCaseForm(p => ({...p, drug_therapy: v}))} placeholder="Medications prescribed..." />
              <InputField label="Procedure" value={caseForm.procedure_details} onChange={(v: string) => setCaseForm(p => ({...p, procedure_details: v}))} placeholder="Surgical/diagnostic procedure" />
              <TextAreaField label="Intervention Details" value={caseForm.intervention_details} onChange={(v: string) => setCaseForm(p => ({...p, intervention_details: v}))} placeholder="Details of intervention..." />
            </div>
          </div>

          {/* Section: Outcome */}
          <div className="mb-8">
            <h3 className="text-[#1e3a6e] font-bold text-sm mb-4 flex items-center gap-2 pb-2 border-b border-[#eef2f8]">
              <TrendingUp size={16} className="text-[#c9a84c]" /> Outcome Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Outcome Status" value={caseForm.outcome_status} onChange={(v: string) => setCaseForm(p => ({...p, outcome_status: v}))} placeholder="e.g., Improved, Cured, Unchanged" />
              <InputField label="Improvement" value={caseForm.improvement} onChange={(v: string) => setCaseForm(p => ({...p, improvement: v}))} placeholder="Degree of improvement" />
              <TextAreaField label="Complications" value={caseForm.complications} onChange={(v: string) => setCaseForm(p => ({...p, complications: v}))} placeholder="Any complications observed..." />
              <TextAreaField label="Follow-up Findings" value={caseForm.follow_up_findings} onChange={(v: string) => setCaseForm(p => ({...p, follow_up_findings: v}))} placeholder="Follow-up observations..." />
            </div>
          </div>

          {/* Section: Additional Notes */}
          <div className="mb-8">
            <h3 className="text-[#1e3a6e] font-bold text-sm mb-4 flex items-center gap-2 pb-2 border-b border-[#eef2f8]">
              <BookOpen size={16} className="text-[#c9a84c]" /> Additional Notes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextAreaField label="Remarks" value={caseForm.remarks} onChange={(v: string) => setCaseForm(p => ({...p, remarks: v}))} placeholder="Any additional remarks..." />
              <TextAreaField label="Observations" value={caseForm.observations} onChange={(v: string) => setCaseForm(p => ({...p, observations: v}))} placeholder="Special observations..." />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-[#eef2f8]">
            <button onClick={() => { setView('entry'); setCaseForm(emptyCaseForm); setEditingCase(null); }} className="px-5 py-3 border border-[#dfe6f0] text-[#6b7e99] rounded-xl font-semibold hover:bg-[#f5f7fa] transition-colors text-sm">
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSaveCase(false)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#1e3a6e] !text-white text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50 text-sm"
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSaveCase(true)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 !text-white text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50 text-sm"
            >
              <CheckCircle size={16} /> {saving ? 'Saving...' : 'Mark Complete'}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TABLE VIEW
  // ═══════════════════════════════════════════════════════════════════════
  if (view === 'table') {
    return (
      <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AnimatePresence><NotificationBanner /></AnimatePresence>
        <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-[#6b7e99] hover:text-[#1e3a6e] text-sm font-semibold mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Thesis Dashboard
        </button>

        <div className="bg-white border border-[#dfe6f0] rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-[#eef2f8] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1e3a6e]">Data Table View</h2>
              <p className="text-[#6b7e99] text-xs">{cases.length} entries • {activeStudy?.thesis_title}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aadca]" />
                <input
                  type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 border border-[#dfe6f0] rounded-lg text-xs bg-white focus:outline-none focus:border-[#1e3a6e] w-48"
                />
              </div>
              <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="border border-[#dfe6f0] rounded-lg px-3 py-2 text-xs bg-white">
                <option value="all">All Genders</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={filterComplete} onChange={e => setFilterComplete(e.target.value)} className="border border-[#dfe6f0] rounded-lg px-3 py-2 text-xs bg-white">
                <option value="all">All Status</option>
                <option value="complete">Complete</option>
                <option value="draft">Draft</option>
              </select>
              <motion.button whileHover={{ scale: 1.05 }} onClick={exportCSV} className="flex items-center gap-1.5 bg-[#1e3a6e] !text-white text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm">
                <Download size={14} /> Export CSV
              </motion.button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f5f7fa] border-b border-[#dfe6f0]">
                <tr>
                  {['Subject ID', 'Age', 'Gender', 'Diagnosis', 'Outcome', 'Status', 'Date Entered', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[#6b7e99] text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCases.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-[#9aadca]">No cases match your filters.</td></tr>
                ) : filteredCases.map(c => (
                  <tr key={c.id} className="border-b border-[#eef2f8] hover:bg-[#f5f7fa]/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#1e3a6e]">{c.subject_id}</td>
                    <td className="px-4 py-3 text-[#6b7e99]">{c.age ?? '—'}</td>
                    <td className="px-4 py-3 text-[#6b7e99]">{c.gender ?? '—'}</td>
                    <td className="px-4 py-3 text-[#3e5680] max-w-[200px] truncate">{c.diagnosis || '—'}</td>
                    <td className="px-4 py-3 text-[#3e5680]">{c.outcome_status || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.is_complete ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                        {c.is_complete ? '✓ Complete' : '◌ Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#9aadca] text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditCase(c)} className="p-1.5 text-[#6b7e99] hover:text-[#1e3a6e] hover:bg-[#eef2f8] rounded-lg transition-colors" title="Edit">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDeleteCase(c.id)} className="p-1.5 text-[#6b7e99] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CASE ENTRY LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════
  if (view === 'entry') {
    return (
      <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AnimatePresence><NotificationBanner /></AnimatePresence>
        <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 text-[#6b7e99] hover:text-[#1e3a6e] text-sm font-semibold mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Thesis Dashboard
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#1e3a6e]">Subject / Case Entries</h2>
            <p className="text-[#6b7e99] text-sm">{activeStudy?.thesis_title}</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.02 }} onClick={openNewCase}
              className="flex items-center gap-2 bg-gradient-to-r from-[#1e3a6e] to-[#2a4d8a] !text-white text-white px-5 py-2.5 rounded-xl font-bold shadow-md text-sm">
              <Plus size={16} /> Add New Case
            </motion.button>
          </div>
        </div>

        {/* Progress */}
        {activeStudy && (
          <div className="bg-white border border-[#dfe6f0] rounded-2xl p-5 mb-6 shadow-sm">
            <ProgressBar current={completedCases} total={activeStudy.sample_size} />
          </div>
        )}

        {/* Case Cards */}
        {cases.length === 0 ? (
          <div className="bg-white border border-[#dfe6f0] rounded-2xl p-12 text-center shadow-sm">
            <Users size={40} className="mx-auto text-[#dfe6f0] mb-4" />
            <p className="text-[#6b7e99] font-medium mb-4">No cases entered yet. Start adding your first subject!</p>
            <motion.button whileHover={{ scale: 1.02 }} onClick={openNewCase}
              className="inline-flex items-center gap-2 bg-[#1e3a6e] !text-white text-white px-6 py-3 rounded-xl font-bold shadow-md text-sm">
              <Plus size={16} /> Add First Case
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map(c => (
              <motion.div key={c.id} whileHover={{ y: -2 }}
                className="bg-white border border-[#dfe6f0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => openEditCase(c)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${c.is_complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.subject_id?.slice(0, 3) || '?'}
                    </div>
                    <div>
                      <p className="text-[#1e3a6e] font-bold text-sm">{c.subject_id}</p>
                      <p className="text-[10px] text-[#9aadca]">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${c.is_complete ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                    {c.is_complete ? '✓ Done' : 'Draft'}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-[#6b7e99]">
                  <p><span className="font-semibold text-[#3e5680]">Age:</span> {c.age ?? '—'} | <span className="font-semibold text-[#3e5680]">Gender:</span> {c.gender || '—'}</p>
                  <p className="truncate"><span className="font-semibold text-[#3e5680]">Dx:</span> {c.diagnosis || '—'}</p>
                  <p className="truncate"><span className="font-semibold text-[#3e5680]">Outcome:</span> {c.outcome_status || '—'}</p>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-[#eef2f8] opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); openEditCase(c); }} className="p-1.5 text-[#6b7e99] hover:text-[#1e3a6e] hover:bg-[#eef2f8] rounded-lg transition-colors"><Edit3 size={13} /></button>
                  <button onClick={e => { e.stopPropagation(); handleDeleteCase(c.id); }} className="p-1.5 text-[#6b7e99] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD VIEW (DEFAULT)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <AnimatePresence><NotificationBanner /></AnimatePresence>

      <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-1.5 text-[#6b7e99] hover:text-[#1e3a6e] text-sm font-semibold mb-2 transition-colors">
        <ArrowLeft size={16} /> Back to Professional Management
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#d4b85c] to-[#b8942e] rounded-xl flex items-center justify-center shadow-lg shadow-[#c9a84c]/20">
            <ClipboardList size={22} className="text-[#1e3a6e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a6e]">Thesis Data Collection</h1>
            <p className="text-[#6b7e99] text-sm">Track and manage your thesis research data</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => { setStudyForm(activeStudy || {}); setView('setup'); }}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#dfe6f0] text-[#1e3a6e] rounded-xl font-semibold text-sm hover:bg-[#f5f7fa] transition-colors">
            <Edit3 size={15} /> Edit Study
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => setView('entry')}
            className="flex items-center gap-2 bg-gradient-to-r from-[#1e3a6e] to-[#2a4d8a] !text-white text-white px-5 py-2.5 rounded-xl font-bold shadow-md text-sm">
            <Plus size={16} /> Enter Cases
          </motion.button>
        </div>
      </div>

      {/* Study Info Card */}
      {activeStudy && (
        <div className="bg-white border border-[#dfe6f0] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 space-y-2">
              <h2 className="text-lg font-bold text-[#1e3a6e] leading-tight">{activeStudy.thesis_title}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-[#1e3a6e]/10 text-[#1e3a6e] rounded-lg text-[11px] font-bold">{activeStudy.course}</span>
                <span className="px-2.5 py-1 bg-[#c9a84c]/10 text-[#c9a84c] rounded-lg text-[11px] font-bold">{activeStudy.specialty}</span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200">{activeStudy.study_type}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-xs text-[#6b7e99]">
                <div><span className="font-semibold text-[#3e5680] block">Guide</span>{activeStudy.guide_name}</div>
                {activeStudy.co_guide_name && <div><span className="font-semibold text-[#3e5680] block">Co-guide</span>{activeStudy.co_guide_name}</div>}
                <div><span className="font-semibold text-[#3e5680] block">Institution</span>{activeStudy.institution_name}</div>
                <div><span className="font-semibold text-[#3e5680] block">Year</span>{activeStudy.year_of_admission}</div>
              </div>
            </div>
            <div className="w-full md:w-64 shrink-0">
              <ProgressBar current={completedCases} total={activeStudy.sample_size} />
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Sample Size', value: activeStudy?.sample_size || 0, icon: <Target size={18} />, iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
          { label: 'Cases Entered', value: cases.length, icon: <Users size={18} />, iconBg: 'bg-gradient-to-br from-violet-500 to-purple-500' },
          { label: 'Completed', value: completedCases, icon: <CheckCircle size={18} />, iconBg: 'bg-gradient-to-br from-emerald-500 to-green-500' },
          { label: 'Drafts', value: draftCases, icon: <Edit3 size={18} />, iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500' }
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-white border border-[#dfe6f0] rounded-2xl p-5 hover:shadow-md transition-all shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center !text-white text-white mb-3 shadow-sm`}>{stat.icon}</div>
            <div className="text-2xl font-bold text-[#1e3a6e]">{stat.value}</div>
            <p className="text-[#6b7e99] text-xs mt-1 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button whileHover={{ y: -2 }} onClick={() => setView('entry')}
          className="bg-white border border-[#dfe6f0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a6e] to-[#2a4d8a] rounded-xl flex items-center justify-center !text-white text-white shadow-sm">
              <Plus size={18} />
            </div>
            <h3 className="text-[#1e3a6e] font-bold text-sm group-hover:text-[#2f80ed] transition-colors">Enter Case Data</h3>
          </div>
          <p className="text-[#9aadca] text-xs">Add new subject / patient entry</p>
        </motion.button>
        <motion.button whileHover={{ y: -2 }} onClick={() => setView('table')}
          className="bg-white border border-[#dfe6f0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center !text-white text-white shadow-sm">
              <BarChart3 size={18} />
            </div>
            <h3 className="text-[#1e3a6e] font-bold text-sm group-hover:text-violet-600 transition-colors">View Data Table</h3>
          </div>
          <p className="text-[#9aadca] text-xs">Search, filter & browse all cases</p>
        </motion.button>
        <motion.button whileHover={{ y: -2 }} onClick={exportCSV}
          className="bg-white border border-[#dfe6f0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center !text-white text-white shadow-sm">
              <Download size={18} />
            </div>
            <h3 className="text-[#1e3a6e] font-bold text-sm group-hover:text-emerald-600 transition-colors">Export Dataset</h3>
          </div>
          <p className="text-[#9aadca] text-xs">Download CSV for SPSS, R, Excel</p>
        </motion.button>
      </div>

      {/* Recent Cases */}
      {cases.length > 0 && (
        <div className="bg-white border border-[#dfe6f0] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#1e3a6e] font-bold text-sm flex items-center gap-2">
              <Calendar size={16} className="text-[#c9a84c]" /> Recent Entries
            </h3>
            <button onClick={() => setView('table')} className="text-[#6b7e99] text-xs font-semibold hover:text-[#1e3a6e] flex items-center gap-1 transition-colors">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {cases.slice(0, 5).map(c => (
              <div key={c.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#f5f7fa] transition-colors cursor-pointer"
                onClick={() => openEditCase(c)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${c.is_complete ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-[#1e3a6e] text-sm font-semibold">{c.subject_id}</span>
                  <span className="text-[#9aadca] text-xs">{c.diagnosis || 'No diagnosis'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#9aadca] text-xs">{c.age ? `${c.age}y` : ''} {c.gender?.charAt(0) || ''}</span>
                  <span className="text-[#9aadca] text-[10px]">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThesisDataCollection;
