import React, { useState, useRef } from 'react';
import { 
  FileText, Plus, Trash2, Download, Sparkles, ChevronRight, 
  User, Briefcase, GraduationCap, Award, BookOpen, Globe,
  Mail, Phone, MapPin, Linkedin, Save, Eye, Edit3, RotateCcw,
  Stethoscope, FlaskConical, Heart
} from 'lucide-react';
import { generateMedicalContent } from './services/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';

// ─── Types ───────────────────────────────────────────────────────────────────
interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
  details: string;
}

interface Experience {
  id: string;
  role: string;
  organization: string;
  duration: string;
  description: string;
}

interface Publication {
  id: string;
  citation: string;
}

interface Certification {
  id: string;
  name: string;
  body: string;
  year: string;
}

interface ResumeData {
  personal: PersonalInfo;
  education: Education[];
  experience: Experience[];
  skills: string[];
  publications: Publication[];
  certifications: Certification[];
  awards: string[];
  memberships: string[];
  conferences: string[];
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const TEMPLATES = [
  { id: 'classic', name: 'Classic Academic', color: 'from-blue-600 to-indigo-600' },
  { id: 'modern', name: 'Modern Medical', color: 'from-emerald-600 to-teal-600' },
  { id: 'minimal', name: 'Minimal Clean', color: 'from-slate-600 to-zinc-600' },
];

// ─── Component ───────────────────────────────────────────────────────────────
const ProfessionalResumeBuilder = ({ onSave }: { onSave?: (data: any) => Promise<void> }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newAward, setNewAward] = useState('');
  const [newMembership, setNewMembership] = useState('');
  const [newConference, setNewConference] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const [resumeData, setResumeData] = useState<ResumeData>({
    personal: { fullName: '', title: '', email: '', phone: '', location: '', linkedin: '', summary: '' },
    education: [{ id: uid(), degree: '', institution: '', year: '', details: '' }],
    experience: [{ id: uid(), role: '', organization: '', duration: '', description: '' }],
    skills: [],
    publications: [{ id: uid(), citation: '' }],
    certifications: [{ id: uid(), name: '', body: '', year: '' }],
    awards: [],
    memberships: [],
    conferences: [],
  });

  const steps = [
    { label: 'Personal Info', icon: <User size={16} /> },
    { label: 'Education', icon: <GraduationCap size={16} /> },
    { label: 'Experience', icon: <Briefcase size={16} /> },
    { label: 'Skills & Extras', icon: <Award size={16} /> },
    { label: 'Publications', icon: <BookOpen size={16} /> },
    { label: 'Template & Preview', icon: <Eye size={16} /> },
  ];

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const updatePersonal = (field: keyof PersonalInfo, value: string) => {
    setResumeData(prev => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
  };

  const addItem = (key: keyof ResumeData, template: Record<string, string>) => {
    setResumeData(prev => ({ ...prev, [key]: [...(prev[key] as any[]), { ...template, id: uid() }] }));
  };

  const removeItem = (key: keyof ResumeData, id: string) => {
    setResumeData(prev => ({ ...prev, [key]: (prev[key] as any[]).filter((item: any) => item.id !== id) }));
  };

  const updateItem = (key: keyof ResumeData, id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      [key]: (prev[key] as any[]).map((item: any) => item.id === id ? { ...item, [field]: value } : item),
    }));
  };

  // ─── AI Generation ──────────────────────────────────────────────────────────
  const aiGenerateSummary = async () => {
    if (!resumeData.personal.fullName || !resumeData.personal.title) {
      setAiSuggestion('Please fill in your name and professional title first.');
      return;
    }
    setIsGenerating(true);
    setAiSuggestion('');
    try {
      const prompt = `Generate a concise, impactful professional summary (3-4 sentences) for a medical professional's resume/CV.
      Name: ${resumeData.personal.fullName}
      Title: ${resumeData.personal.title}
      Education: ${resumeData.education.map(e => `${e.degree} from ${e.institution}`).join(', ')}
      Experience: ${resumeData.experience.map(e => `${e.role} at ${e.organization}`).join(', ')}
      Skills: ${resumeData.skills.join(', ')}
      
      The summary should highlight clinical expertise, research contributions, and teaching experience if applicable. Use a professional, confident tone. Do not include the name.`;
      
      const result = await generateMedicalContent(prompt, 
        'You are a professional medical CV writer specializing in academic medicine and healthcare careers. Write concise, impactful professional summaries.');
      setAiSuggestion(result || '');
    } catch {
      setAiSuggestion('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const aiEnhanceDescription = async (key: 'experience' | 'education', id: string) => {
    const items = resumeData[key] as any[];
    const item = items.find((i: any) => i.id === id);
    if (!item) return;

    const currentText = key === 'experience' ? item.description : item.details;
    if (!currentText?.trim()) {
      setAiSuggestion('Please write a brief description first, then AI will enhance it.');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Enhance this ${key === 'experience' ? 'work experience' : 'education'} description for a medical professional's CV. Make it more impactful with action verbs and quantifiable achievements where possible. Keep it concise (3-5 bullet points):
      
      Role/Degree: ${key === 'experience' ? item.role : item.degree}
      Organization: ${key === 'experience' ? item.organization : item.institution}
      Current description: ${currentText}
      
      Return ONLY the enhanced description text, formatted as bullet points starting with "• ".`;
      
      const result = await generateMedicalContent(prompt,
        'You are a professional medical CV writer. Enhance descriptions to be impactful and professionally written.');
      
      if (result) {
        updateItem(key, id, key === 'experience' ? 'description' : 'details', result);
      }
    } catch {
      setAiSuggestion('Enhancement failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (onSave) {
      await onSave({
        resume_data: resumeData,
        template: selectedTemplate,
        content: JSON.stringify(resumeData),
      });
    }
  };

  // ─── Download as PDF ─────────────────────────────────────────────────────────
  const handleDownload = () => {
    const htmlContent = generateResumeHTML();
    const container = document.createElement('div');
    container.innerHTML = htmlContent.replace(/<html>|<\/html>|<head>.*<\/head>|<body>|<\/body>|<!DOCTYPE html>/gs, '');
    container.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;font-family:Inter,sans-serif;color:#1e293b;line-height:1.6;padding:40px;';
    // Apply inline styles from the HTML template
    const style = document.createElement('style');
    style.textContent = generateResumeHTML().match(/<style>(.*?)<\/style>/s)?.[1] || '';
    container.prepend(style);
    document.body.appendChild(container);

    const filename = `${resumeData.personal.fullName.replace(/\s+/g, '_') || 'Resume'}_CV.pdf`;
    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(container).save().then(() => {
      document.body.removeChild(container);
    });
  };

  const generateResumeHTML = () => {
    const d = resumeData;
    const templateColors = selectedTemplate === 'classic' ? '#3b82f6' 
      : selectedTemplate === 'modern' ? '#10b981' : '#64748b';
    
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${d.personal.fullName} - CV</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; }
  .header { border-bottom: 3px solid ${templateColors}; padding-bottom: 20px; margin-bottom: 24px; }
  .name { font-size: 28px; font-weight: 700; color: ${templateColors}; }
  .title { font-size: 16px; color: #64748b; font-weight: 500; margin-top: 4px; }
  .contact { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; font-size: 13px; color: #475569; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 16px; font-weight: 700; color: ${templateColors}; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
  .item { margin-bottom: 14px; }
  .item-header { display: flex; justify-content: space-between; align-items: baseline; }
  .item-role { font-weight: 600; font-size: 15px; }
  .item-org { color: #475569; font-size: 14px; }
  .item-date { color: #94a3b8; font-size: 13px; white-space: nowrap; }
  .item-desc { font-size: 13px; color: #334155; margin-top: 4px; white-space: pre-line; }
  .summary { font-size: 14px; color: #334155; font-style: italic; }
  .skills { display: flex; flex-wrap: wrap; gap: 8px; }
  .skill-tag { background: ${templateColors}15; color: ${templateColors}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .pub { font-size: 13px; color: #334155; margin-bottom: 6px; }
  ul { padding-left: 18px; }
  li { font-size: 13px; color: #334155; margin-bottom: 3px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="name">${d.personal.fullName}</div>
    <div class="title">${d.personal.title}</div>
    <div class="contact">
      ${d.personal.email ? `<span>✉ ${d.personal.email}</span>` : ''}
      ${d.personal.phone ? `<span>☎ ${d.personal.phone}</span>` : ''}
      ${d.personal.location ? `<span>📍 ${d.personal.location}</span>` : ''}
      ${d.personal.linkedin ? `<span>LinkedIn: ${d.personal.linkedin}</span>` : ''}
    </div>
  </div>

  ${d.personal.summary ? `<div class="section"><div class="section-title">Professional Summary</div><p class="summary">${d.personal.summary}</p></div>` : ''}

  ${d.education.length > 0 && d.education.some(e => e.degree) ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${d.education.filter(e => e.degree).map(e => `
    <div class="item">
      <div class="item-header">
        <div><span class="item-role">${e.degree}</span><div class="item-org">${e.institution}</div></div>
        <span class="item-date">${e.year}</span>
      </div>
      ${e.details ? `<div class="item-desc">${e.details}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}

  ${d.experience.length > 0 && d.experience.some(e => e.role) ? `
  <div class="section">
    <div class="section-title">Professional Experience</div>
    ${d.experience.filter(e => e.role).map(e => `
    <div class="item">
      <div class="item-header">
        <div><span class="item-role">${e.role}</span><div class="item-org">${e.organization}</div></div>
        <span class="item-date">${e.duration}</span>
      </div>
      ${e.description ? `<div class="item-desc">${e.description}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}

  ${d.skills.length > 0 ? `
  <div class="section">
    <div class="section-title">Skills & Competencies</div>
    <div class="skills">${d.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
  </div>` : ''}

  ${d.certifications.length > 0 && d.certifications.some(c => c.name) ? `
  <div class="section">
    <div class="section-title">Certifications & Licenses</div>
    ${d.certifications.filter(c => c.name).map(c => `
    <div class="item">
      <div class="item-header"><span class="item-role">${c.name}</span><span class="item-date">${c.year}</span></div>
      <div class="item-org">${c.body}</div>
    </div>`).join('')}
  </div>` : ''}

  ${d.publications.length > 0 && d.publications.some(p => p.citation) ? `
  <div class="section">
    <div class="section-title">Publications</div>
    ${d.publications.filter(p => p.citation).map((p, i) => `<p class="pub">${i + 1}. ${p.citation}</p>`).join('')}
  </div>` : ''}

  ${d.awards.length > 0 ? `
  <div class="section">
    <div class="section-title">Awards & Honors</div>
    <ul>${d.awards.map(a => `<li>${a}</li>`).join('')}</ul>
  </div>` : ''}

  ${d.memberships.length > 0 ? `
  <div class="section">
    <div class="section-title">Professional Memberships</div>
    <ul>${d.memberships.map(m => `<li>${m}</li>`).join('')}</ul>
  </div>` : ''}

  ${d.conferences.length > 0 ? `
  <div class="section">
    <div class="section-title">Conferences & Presentations</div>
    <ul>${d.conferences.map(c => `<li>${c}</li>`).join('')}</ul>
  </div>` : ''}
</body></html>`;
  };

  // ─── Render Inputs ─────────────────────────────────────────────────────────
  const InputField = ({ label, value, onChange, placeholder, type = 'text', icon }: any) => (
    <div className="space-y-1.5">
      <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
      />
    </div>
  );

  const TextAreaField = ({ label, value, onChange, placeholder, rows = 3 }: any) => (
    <div className="space-y-1.5">
      <label className="text-slate-300 text-sm font-medium">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm resize-none"
      />
    </div>
  );

  // ─── Step Content ──────────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (activeStep) {
      // ── Personal Info ────────────────────────────────────────────────
      case 0:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Full Name" value={resumeData.personal.fullName} onChange={(v: string) => updatePersonal('fullName', v)} placeholder="Dr. John Doe" icon={<User size={14} className="text-blue-700" />} />
              <InputField label="Professional Title" value={resumeData.personal.title} onChange={(v: string) => updatePersonal('title', v)} placeholder="Associate Professor of Medicine" icon={<Briefcase size={14} className="text-blue-700" />} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Email" value={resumeData.personal.email} onChange={(v: string) => updatePersonal('email', v)} placeholder="doctor@hospital.com" type="email" icon={<Mail size={14} className="text-blue-700" />} />
              <InputField label="Phone" value={resumeData.personal.phone} onChange={(v: string) => updatePersonal('phone', v)} placeholder="+91 98765 43210" icon={<Phone size={14} className="text-blue-700" />} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Location" value={resumeData.personal.location} onChange={(v: string) => updatePersonal('location', v)} placeholder="City, State, Country" icon={<MapPin size={14} className="text-blue-700" />} />
              <InputField label="LinkedIn URL" value={resumeData.personal.linkedin} onChange={(v: string) => updatePersonal('linkedin', v)} placeholder="linkedin.com/in/username" icon={<Linkedin size={14} className="text-blue-700" />} />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-medium">Professional Summary</label>
                <button
                  onClick={aiGenerateSummary}
                  disabled={isGenerating}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all shadow-md ${isGenerating ? 'bg-orange-100 text-blue-900 shadow-orange-100/20 disabled:opacity-100 cursor-wait' : 'bg-[#FFD700] hover:bg-[#F2C800] disabled:opacity-50 text-blue-900 shadow-[#FFD700]/20'}`}
                >
                  {isGenerating ? <div className="w-3 h-3 rounded-full border-2 border-blue-900/40 border-t-blue-900 animate-spin" /> : <Sparkles size={12} />} {isGenerating ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              <textarea
                value={resumeData.personal.summary}
                onChange={(e) => updatePersonal('summary', e.target.value)}
                placeholder="A brief professional summary highlighting your expertise, research focus, and clinical strengths..."
                rows={4}
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm resize-none"
              />
            </div>
            
            {aiSuggestion && (
              <div className="bg-violet-900/20 border border-violet-500/30 rounded-xl p-4 space-y-3">
                <p className="text-violet-800 text-sm flex items-center gap-2"><Sparkles size={14} /> AI Suggestion</p>
                <p className="text-slate-300 text-sm leading-relaxed">{aiSuggestion}</p>
                <button
                  onClick={() => { updatePersonal('summary', aiSuggestion); setAiSuggestion(''); }}
                  className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-all"
                >
                  Use This Summary
                </button>
              </div>
            )}
          </div>
        );

      // ── Education ────────────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {resumeData.education.map((edu, idx) => (
              <div key={edu.id} className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 space-y-4 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 text-xs font-bold uppercase tracking-wider">Education #{idx + 1}</span>
                  {resumeData.education.length > 1 && (
                    <button onClick={() => removeItem('education', edu.id)} className="text-red-700 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Degree / Qualification" value={edu.degree} onChange={(v: string) => updateItem('education', edu.id, 'degree', v)} placeholder="MD Medicine / MS Surgery" />
                  <InputField label="Institution" value={edu.institution} onChange={(v: string) => updateItem('education', edu.id, 'institution', v)} placeholder="AIIMS, New Delhi" />
                </div>
                <InputField label="Year" value={edu.year} onChange={(v: string) => updateItem('education', edu.id, 'year', v)} placeholder="2020 - 2023" />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 text-sm font-medium">Details / Thesis / Achievements</label>
                    <button onClick={() => aiEnhanceDescription('education', edu.id)} disabled={isGenerating}
                      className="flex items-center gap-1 text-xs text-violet-700 hover:text-violet-800 transition-colors disabled:opacity-50">
                      <Sparkles size={11} /> Enhance
                    </button>
                  </div>
                  <textarea
                    value={edu.details}
                    onChange={(e) => updateItem('education', edu.id, 'details', e.target.value)}
                    placeholder="Thesis title, distinctions, key achievements..."
                    rows={2}
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-sm resize-none"
                  />
                </div>
              </div>
            ))}
            <button onClick={() => addItem('education', { degree: '', institution: '', year: '', details: '' })}
              className="w-full border-2 border-dashed border-white/10 hover:border-blue-500/40 rounded-xl py-3 text-slate-400 hover:text-blue-700 text-sm font-medium flex items-center justify-center gap-2 transition-all">
              <Plus size={16} /> Add Education
            </button>
          </div>
        );

      // ── Experience ───────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {resumeData.experience.map((exp, idx) => (
              <div key={exp.id} className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 space-y-4 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Experience #{idx + 1}</span>
                  {resumeData.experience.length > 1 && (
                    <button onClick={() => removeItem('experience', exp.id)} className="text-red-700 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Role / Designation" value={exp.role} onChange={(v: string) => updateItem('experience', exp.id, 'role', v)} placeholder="Senior Resident" />
                  <InputField label="Organization / Hospital" value={exp.organization} onChange={(v: string) => updateItem('experience', exp.id, 'organization', v)} placeholder="Government Medical College" />
                </div>
                <InputField label="Duration" value={exp.duration} onChange={(v: string) => updateItem('experience', exp.id, 'duration', v)} placeholder="Jan 2023 - Present" />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 text-sm font-medium">Key Responsibilities & Achievements</label>
                    <button onClick={() => aiEnhanceDescription('experience', exp.id)} disabled={isGenerating}
                      className="flex items-center gap-1 text-xs text-violet-700 hover:text-violet-800 transition-colors disabled:opacity-50">
                      <Sparkles size={11} /> Enhance
                    </button>
                  </div>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateItem('experience', exp.id, 'description', e.target.value)}
                    placeholder="Key responsibilities, patient volume, procedures, research activities..."
                    rows={3}
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-sm resize-none"
                  />
                </div>
              </div>
            ))}
            <button onClick={() => addItem('experience', { role: '', organization: '', duration: '', description: '' })}
              className="w-full border-2 border-dashed border-white/10 hover:border-emerald-500/40 rounded-xl py-3 text-slate-400 hover:text-emerald-700 text-sm font-medium flex items-center justify-center gap-2 transition-all">
              <Plus size={16} /> Add Experience
            </button>
          </div>
        );

      // ── Skills & Extras ──────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2"><Stethoscope size={18} className="text-blue-700" /> Skills & Competencies</h3>
              <div className="flex gap-2">
                <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newSkill.trim()) { setResumeData(p => ({ ...p, skills: [...p.skills, newSkill.trim()] })); setNewSkill(''); } }}
                  placeholder="e.g., Echocardiography, Laparoscopy, SPSS..."
                  className="flex-1 bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
                <button onClick={() => { if (newSkill.trim()) { setResumeData(p => ({ ...p, skills: [...p.skills, newSkill.trim()] })); setNewSkill(''); } }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl text-sm font-medium transition-all"><Plus size={18} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill, i) => (
                  <span key={i} className="bg-blue-500/15 text-blue-800 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-blue-500/20">
                    {skill}
                    <button onClick={() => setResumeData(p => ({ ...p, skills: p.skills.filter((_, idx) => idx !== i) }))} className="text-blue-700 hover:text-red-700 transition-colors">
                      <Trash2 size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2"><Award size={18} className="text-amber-700" /> Certifications & Licenses</h3>
              {resumeData.certifications.map((cert, idx) => (
                <div key={cert.id} className="bg-slate-800/40 border border-white/5 rounded-xl p-4 space-y-3 relative group">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <InputField label="Certification Name" value={cert.name} onChange={(v: string) => updateItem('certifications', cert.id, 'name', v)} placeholder="ACLS, BLS, FACS" />
                    <InputField label="Issuing Body" value={cert.body} onChange={(v: string) => updateItem('certifications', cert.id, 'body', v)} placeholder="AHA, NBME" />
                    <InputField label="Year" value={cert.year} onChange={(v: string) => updateItem('certifications', cert.id, 'year', v)} placeholder="2024" />
                  </div>
                  {resumeData.certifications.length > 1 && (
                    <button onClick={() => removeItem('certifications', cert.id)} className="absolute top-3 right-3 text-red-700 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addItem('certifications', { name: '', body: '', year: '' })}
                className="w-full border border-dashed border-white/10 hover:border-amber-500/40 rounded-xl py-2.5 text-slate-400 hover:text-amber-700 text-sm font-medium flex items-center justify-center gap-2 transition-all">
                <Plus size={14} /> Add Certification
              </button>
            </div>

            {/* Awards */}
            <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2"><Heart size={18} className="text-rose-700" /> Awards & Honors</h3>
              <div className="flex gap-2">
                <input value={newAward} onChange={(e) => setNewAward(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newAward.trim()) { setResumeData(p => ({ ...p, awards: [...p.awards, newAward.trim()] })); setNewAward(''); } }}
                  placeholder="e.g., Best Paper Presentation, Gold Medal..."
                  className="flex-1 bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
                <button onClick={() => { if (newAward.trim()) { setResumeData(p => ({ ...p, awards: [...p.awards, newAward.trim()] })); setNewAward(''); } }}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 rounded-xl text-sm font-medium transition-all"><Plus size={18} /></button>
              </div>
              <ul className="space-y-1">
                {resumeData.awards.map((a, i) => (
                  <li key={i} className="flex items-center justify-between bg-slate-800/30 px-4 py-2 rounded-lg text-sm text-slate-300 group">
                    <span>• {a}</span>
                    <button onClick={() => setResumeData(p => ({ ...p, awards: p.awards.filter((_, idx) => idx !== i) }))} className="text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Memberships */}
            <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2"><Globe size={18} className="text-cyan-700" /> Professional Memberships</h3>
              <div className="flex gap-2">
                <input value={newMembership} onChange={(e) => setNewMembership(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newMembership.trim()) { setResumeData(p => ({ ...p, memberships: [...p.memberships, newMembership.trim()] })); setNewMembership(''); } }}
                  placeholder="e.g., IMA, ASI, API Life Member..."
                  className="flex-1 bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
                <button onClick={() => { if (newMembership.trim()) { setResumeData(p => ({ ...p, memberships: [...p.memberships, newMembership.trim()] })); setNewMembership(''); } }}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 rounded-xl text-sm font-medium transition-all"><Plus size={18} /></button>
              </div>
              <ul className="space-y-1">
                {resumeData.memberships.map((m, i) => (
                  <li key={i} className="flex items-center justify-between bg-slate-800/30 px-4 py-2 rounded-lg text-sm text-slate-300 group">
                    <span>• {m}</span>
                    <button onClick={() => setResumeData(p => ({ ...p, memberships: p.memberships.filter((_, idx) => idx !== i) }))} className="text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      // ── Publications ─────────────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Publications */}
            <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2"><BookOpen size={18} className="text-indigo-700" /> Publications</h3>
              {resumeData.publications.map((pub, idx) => (
                <div key={pub.id} className="bg-slate-800/40 border border-white/5 rounded-xl p-4 relative group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-indigo-700 text-xs font-bold">#{idx + 1}</span>
                    {resumeData.publications.length > 1 && (
                      <button onClick={() => removeItem('publications', pub.id)} className="text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={pub.citation}
                    onChange={(e) => updateItem('publications', pub.id, 'citation', e.target.value)}
                    placeholder="Author(s). Title. Journal Name. Year;Volume(Issue):Pages. DOI"
                    rows={2}
                    className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-sm resize-none"
                  />
                </div>
              ))}
              <button onClick={() => addItem('publications', { citation: '' })}
                className="w-full border border-dashed border-white/10 hover:border-indigo-500/40 rounded-xl py-2.5 text-slate-400 hover:text-indigo-700 text-sm font-medium flex items-center justify-center gap-2 transition-all">
                <Plus size={14} /> Add Publication
              </button>
            </div>

            {/* Conferences */}
            <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2"><FlaskConical size={18} className="text-orange-700" /> Conferences & Presentations</h3>
              <div className="flex gap-2">
                <input value={newConference} onChange={(e) => setNewConference(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newConference.trim()) { setResumeData(p => ({ ...p, conferences: [...p.conferences, newConference.trim()] })); setNewConference(''); } }}
                  placeholder="e.g., Oral Presentation at APICON 2025, New Delhi..."
                  className="flex-1 bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
                <button onClick={() => { if (newConference.trim()) { setResumeData(p => ({ ...p, conferences: [...p.conferences, newConference.trim()] })); setNewConference(''); } }}
                  className="bg-orange-600 hover:bg-orange-500 text-white px-4 rounded-xl text-sm font-medium transition-all"><Plus size={18} /></button>
              </div>
              <ul className="space-y-1">
                {resumeData.conferences.map((c, i) => (
                  <li key={i} className="flex items-center justify-between bg-slate-800/30 px-4 py-2 rounded-lg text-sm text-slate-300 group">
                    <span>• {c}</span>
                    <button onClick={() => setResumeData(p => ({ ...p, conferences: p.conferences.filter((_, idx) => idx !== i) }))} className="text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      // ── Template & Preview ───────────────────────────────────────────
      case 5:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Template Selection */}
            <div className="space-y-4">
              <h3 className="text-white font-bold">Choose Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`relative p-5 rounded-2xl border-2 transition-all ${
                      selectedTemplate === t.id 
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10' 
                        : 'border-white/10 bg-slate-800/40 hover:border-white/20'
                    }`}
                  >
                    <div className={`h-2 w-full rounded-full bg-gradient-to-r ${t.color} mb-4`} />
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-3/4 bg-white/10 rounded" />
                      <div className="h-1 w-1/2 bg-white/5 rounded" />
                      <div className="h-1 w-full bg-white/5 rounded mt-3" />
                      <div className="h-1 w-5/6 bg-white/5 rounded" />
                    </div>
                    <p className="text-sm font-medium text-slate-300 mt-4">{t.name}</p>
                    {selectedTemplate === t.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button onClick={handleDownload}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-600/20">
                <Download size={16} /> Download CV (PDF)
              </button>
              {onSave && (
                <button onClick={handleSave}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-lg shadow-emerald-600/20">
                  <Save size={16} /> Save to Library
                </button>
              )}
              <button onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all">
                <Eye size={16} /> Full Preview
              </button>
            </div>

            {/* Inline Preview */}
            <div className="bg-white rounded-2xl p-8 shadow-2xl overflow-auto max-h-[600px]" ref={previewRef}>
              <div dangerouslySetInnerHTML={{ __html: generateResumeHTML().replace(/<html>|<\/html>|<head>.*<\/head>|<body>|<\/body>|<!DOCTYPE html>/gs, '') }} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText size={20} className="text-white" />
            </div>
            Professional Resume Builder
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Build an impressive academic CV tailored for medical professionals</p>
        </div>
        {isGenerating && (
          <div className="flex items-center gap-2 bg-violet-500/10 text-violet-700 text-xs px-4 py-2 rounded-full border border-violet-500/20">
            <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
            AI is processing...
          </div>
        )}
      </div>

      {/* Step Indicator */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
        <div className="flex items-center overflow-x-auto gap-1 pb-1">
          {steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeStep === idx
                  ? 'bg-blue-600/15 text-blue-700 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                activeStep === idx ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {idx + 1}
              </span>
              <span className="hidden md:inline">{step.label}</span>
              {step.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 md:p-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
          className="flex items-center gap-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium px-4 py-2 rounded-xl hover:bg-slate-800"
        >
          <RotateCcw size={16} /> Previous
        </button>
        {activeStep < steps.length - 1 && (
          <button
            onClick={() => setActiveStep(activeStep + 1)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
          >
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Full Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-slate-100 border-b px-6 py-3 flex items-center justify-between">
              <span className="font-semibold text-slate-700 text-sm">Resume Preview</span>
              <div className="flex gap-2">
                <button onClick={handleDownload} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 flex items-center gap-1">
                  <Download size={12} /> Download PDF
                </button>
                <button onClick={() => setShowPreview(false)} className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-300">Close</button>
              </div>
            </div>
            <div className="p-8" dangerouslySetInnerHTML={{ __html: generateResumeHTML().replace(/<html>|<\/html>|<head>.*<\/head>|<body>|<\/body>|<!DOCTYPE html>/gs, '') }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalResumeBuilder;
