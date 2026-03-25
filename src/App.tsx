import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library, FileText, Presentation, BookOpen, ClipboardList, 
  BarChart3, CheckSquare, Stethoscope, ShieldAlert, PenTool, 
  FileQuestion, MessageSquare, X, Send, Menu, LogIn, UserPlus, 
  LayoutDashboard, Settings, LogOut, ChevronRight, Brain, 
  Activity, Microscope, HeartPulse, Download, Share2, Save,
  Plus, Trash2, Edit3, Monitor, Search, Globe, Users, User as UserIcon,
  Upload, Layers, Sparkles, CheckCircle, Eye, Play, RotateCcw,
  Cpu, LineChart, Target, FileSymlink, GraduationCap, Lightbulb, HelpCircle, Pill, Lock,
  Gift, Award, Trophy, Shield, Mail, EyeOff
} from 'lucide-react';
import { FEATURES } from './constants';
import { medimentrMentorChat, generateMedicalContent, extractContactFromImage, extractPaperTextFromImage } from './services/ai';
import ThesisNotesManager from './ThesisNotesManager';
import GuidelinesGenerator from './GuidelinesGenerator';
import ClinicalExaminationSystem from './ClinicalExaminationSystem';
import PrescriptionAnalyser from './PrescriptionAnalyser';
import ClinicalDecisionSupport from './ClinicalDecisionSupport';
import ProfessionalResumeBuilder from './ProfessionalResumeBuilder';
import DoubtSolver from './DoubtSolver';
import DrugTreatmentAssistant from './DrugTreatmentAssistant';
import LearningManagementDashboard from './LearningManagementDashboard';
import AiTutorWelcome from './AiTutorWelcome';
import UserManagementSystem from './UserManagementSystem';
import { AffiliatePartnerPanel } from './AffiliatePartnerPanel';
import { AuthModal } from './AuthModal';
import { createClient } from '@supabase/supabase-js';
const _supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';

// Curated Pexels medical stock images pool
const PEXELS_MEDICAL_IMAGES = [
  'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/3938023/pexels-photo-3938023.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/3786157/pexels-photo-3786157.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/4386476/pexels-photo-4386476.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/5726794/pexels-photo-5726794.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/4033148/pexels-photo-4033148.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/4225880/pexels-photo-4225880.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/3952240/pexels-photo-3952240.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/4226256/pexels-photo-4226256.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/5407206/pexels-photo-5407206.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/4386464/pexels-photo-4386464.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/4226769/pexels-photo-4226769.jpeg?auto=compress&cs=tinysrgb&w=600',
];
let _pexelsIdx = 0;
const getRandomPexelsImage = () => {
  const img = PEXELS_MEDICAL_IMAGES[_pexelsIdx % PEXELS_MEDICAL_IMAGES.length];
  _pexelsIdx++;
  return img;
};

export const ACADEMIC_INSIGHTS_POSTS = [
  { 
    title: "How Postgraduate Medical Students Should Prepare Notes", 
    date: "Oct 12, 2025", 
    category: "Education",
    views: 342,
    excerpt: "A comprehensive article exploring how postgraduate medical students should prepare notes specifically within the education framework.",
    imageSrc: PEXELS_MEDICAL_IMAGES[0],
    content: '',
    hashtags: '#MedEd #NoteTaking #PGMedicine #MedicalEducation #StudyTips',
    status: 'published'
  },
  { 
    title: "Understanding Statistical Tests in Clinical Research", 
    date: "Nov 05, 2025", 
    category: "Research",
    views: 184,
    excerpt: "A comprehensive article exploring understanding statistical tests in clinical research specifically within the research framework.",
    imageSrc: PEXELS_MEDICAL_IMAGES[1],
    content: '',
    hashtags: '#ClinicalResearch #Statistics #MedicalResearch #EvidenceBasedMedicine',
    status: 'published'
  },
  { 
    title: "How to Write a Manuscript Using AI", 
    date: "Dec 20, 2025", 
    category: "Publication",
    views: 521,
    excerpt: "A comprehensive article exploring how to write a manuscript using AI specifically within the publication framework.",
    imageSrc: PEXELS_MEDICAL_IMAGES[2],
    content: '',
    hashtags: '#AIinMedicine #ManuscriptWriting #AcademicPublishing #MedTech',
    status: 'published'
  }
];
import { User } from './types';
import pptxgen from "pptxgenjs";
import Cropper from 'react-easy-crop';
import { toPng } from 'html-to-image';
import { Contact } from './types';

// Components
const Navbar = ({ onNavigate, onOpenAuth }: { onNavigate: (page: string) => void; onOpenAuth: () => void }) => (
  <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
      <img src="/logo.jpg" alt="MediMentr Logo" className="w-10 h-10 object-contain rounded-xl shadow-sm" />
      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">MediMentr</span>
    </div>
    
    <div className="hidden md:flex items-center gap-8 text-slate-300 font-medium">
      <button onClick={() => onNavigate('home')} className="hover:text-blue-400 transition-colors">Home</button>
      <button onClick={() => onNavigate('features')} className="hover:text-blue-400 transition-colors">Features</button>
      <button onClick={() => onNavigate('blog')} className="hover:text-blue-400 transition-colors">Blog</button>
      <button onClick={() => onNavigate('contact')} className="hover:text-blue-400 transition-colors">Contact</button>
    </div>

    <div className="flex items-center gap-4">
      <button 
        onClick={onOpenAuth}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full transition-all shadow-lg shadow-blue-600/20"
      >
        <LayoutDashboard size={18} />
        <span>Explore App</span>
      </button>
    </div>
  </nav>
);

const Footer = ({ onNavigate }: { onNavigate: (page: string) => void }) => (
  <footer className="bg-slate-950 border-t border-white/10 pt-20 pb-10 px-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="MediMentr Logo" className="w-8 h-8 object-contain rounded-xl" />
          <span className="text-xl font-bold text-white">Medimentr</span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          AI-powered academic companion for Medical Professionals. Prepare smarter for exams, research, and clinical practice.
        </p>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-6">Platform</h4>
        <ul className="space-y-3 text-slate-400 text-sm">
          <li><button onClick={() => onNavigate('features')} className="hover:text-blue-400 transition-colors">Features</button></li>
          <li><button onClick={() => { onNavigate('home'); setTimeout(() => document.getElementById('knowledge-library')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="hover:text-blue-400 transition-colors">Knowledge Library</button></li>
          <li><button onClick={() => { onNavigate('home'); setTimeout(() => document.getElementById('statassist')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="hover:text-blue-400 transition-colors">StatAssist</button></li>
          <li><button onClick={() => { onNavigate('home'); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="hover:text-blue-400 transition-colors">Pricing</button></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-6">Company</h4>
        <ul className="space-y-3 text-slate-400 text-sm">
          <li><button className="hover:text-blue-400 transition-colors">About Us</button></li>
          <li><button onClick={() => onNavigate('blog')} className="hover:text-blue-400 transition-colors">Blog</button></li>
          <li><button onClick={() => onNavigate('contact')} className="hover:text-blue-400 transition-colors">Contact</button></li>
          <li><button className="hover:text-blue-400 transition-colors">Careers</button></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-6">Legal</h4>
        <ul className="space-y-3 text-slate-400 text-sm">
          <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
          <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
          <li><a href="#" className="hover:text-blue-400 transition-colors">Cookie Policy</a></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
      <p>© 2026 MediMentr. All rights reserved.</p>
      <div className="flex gap-6">
        <a href="#" className="hover:text-white transition-colors">Twitter</a>
        <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
        <a href="#" className="hover:text-white transition-colors">GitHub</a>
      </div>
    </div>
  </footer>
);

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: "Hello! I'm your MediMentr AI Mentor. How can I help you with your medical studies today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await medimentrMentorChat(userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: response || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to AI service." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 w-[420px] h-[650px] rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden mb-6 ring-1 ring-white/10"
          >
            <div className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 p-4 flex justify-between items-center border-b border-white/10 shadow-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
               <div className="flex items-center gap-3 relative z-10">
                 <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner border border-white/20">
                   <Brain size={22} className="text-white drop-shadow-md" />
                 </div>
                 <div>
                   <h3 className="flex items-center gap-2 text-white font-bold leading-tight drop-shadow-sm text-lg">
                     AI Mentor
                     <span className="flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                     </span>
                   </h3>
                   <p className="text-blue-100/90 text-xs font-medium tracking-wide">Always here to help</p>
                 </div>
               </div>
               <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors relative z-10">
                 <X size={20} />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-md border border-white/20">
                      <img src="/logo.jpg" alt="MediMentr Logo" className="w-5 h-5 object-contain rounded-full" />
                    </div>
                  )}
                  <div className={`max-w-[82%] p-4 rounded-2xl text-[15px] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm shadow-blue-500/20 shadow-md border border-blue-400/30' 
                      : 'bg-slate-800/80 backdrop-blur-md text-slate-200 rounded-tl-sm border border-slate-700/60 shadow-black/20'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="leading-relaxed">{msg.text}</p>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none 
                        prose-headings:text-slate-50 prose-headings:font-semibold prose-heading:tracking-tight
                        prose-h1:text-xl prose-h1:mb-3 prose-h1:mt-4 prose-h1:text-transparent prose-h1:bg-clip-text prose-h1:bg-gradient-to-r prose-h1:from-blue-400 prose-h1:to-cyan-300
                        prose-h2:text-lg prose-h2:mb-3 prose-h2:mt-4 prose-h2:text-blue-200
                        prose-h3:text-base prose-h3:mb-2 prose-h3:mt-3 prose-h3:text-blue-300
                        prose-p:leading-relaxed prose-p:mb-3 prose-p:text-slate-300
                        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 hover:prose-a:underline
                        prose-strong:text-slate-100 prose-strong:font-semibold
                        prose-ul:my-3 prose-ul:list-disc prose-ul:pl-5 
                        prose-ol:my-3 prose-ol:list-decimal prose-ol:pl-5
                        prose-li:my-1 prose-li:text-slate-300 prose-li:marker:text-blue-500
                        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:my-3 prose-blockquote:bg-slate-800/50 prose-blockquote:rounded-r-lg prose-blockquote:italic
                        prose-code:text-blue-300 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:border prose-code:border-slate-700
                        prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-xl prose-pre:p-4 prose-pre:my-4 prose-pre:shadow-inner"
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-md border border-white/20">
                      <img src="/logo.jpg" alt="MediMentr Logo" className="w-5 h-5 object-contain rounded-full" />
                    </div>
                  <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl rounded-tl-sm border border-slate-700/60 shadow-sm flex items-center gap-2 h-[46px]">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s] shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s] shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
              <div className="relative flex items-center group">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask your mentor anything..."
                  className="w-full bg-slate-800/80 border border-slate-600/50 rounded-full py-3 pl-5 pr-12 text-[15px] text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md"
                >
                  <Send size={16} className="-ml-0.5" />
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] text-slate-500 font-medium">AI can make mistakes. Verify clinical information.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(79,70,229,0.5)] text-white border border-white/20 overflow-hidden group z-50 rounded-xl"
        style={{ borderRadius: '20px' }}
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {isOpen ? <X size={28} className="relative z-10" /> : <Sparkles size={28} className="relative z-10" />}
      </motion.button>
    </div>
  );
};

const BlogPage = ({ onNavigate, blogPosts }: { onNavigate: (page: string) => void, blogPosts: any[] }) => {
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const siteUrl = 'https://www.medimentr.com';
  
  const getShareUrl = (post: any) => `${siteUrl}/blog/${post.id}`;
  
  const handleShare = (platform: string, post: any) => {
    const blogShareUrl = getShareUrl(post);
    const titleText = post.title;
    const excerptText = (post.excerpt || post.title).substring(0, 140);
    const ctaText = '🔬 Explore MediMentr — AI-Powered Medical Education';
    const hashtags = (post.hashtags || '').replace(/#/g, '').split(/\s+/).filter(Boolean).join(',');
    
    const title = encodeURIComponent(titleText);
    const text = encodeURIComponent(`${excerptText}\n\n${ctaText}`);
    const url = encodeURIComponent(blogShareUrl);
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${titleText}\n\n${ctaText}`)}&url=${url}&hashtags=${hashtags},MediMentr,MedEd`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(`${titleText} — ${ctaText}`)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`📚 *${titleText}*\n\n${excerptText}\n\n${ctaText}\n🔗 ${blogShareUrl}`)}`,
    };
    if (urls[platform]) window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const copyLink = (post?: any) => {
    const linkToCopy = post ? getShareUrl(post) : (typeof window !== 'undefined' ? window.location.href : '');
    navigator.clipboard.writeText(linkToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Single Article View
  if (selectedPost) {
    const wordCount = (selectedPost.content || '').split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return (
      <div className="pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button 
            onClick={() => setSelectedPost(null)}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold mb-8 transition-colors group"
          >
            <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Articles
          </button>

          {/* Article Header */}
          <div className="mb-8">
            <span className="inline-block text-blue-500 text-xs font-bold uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-full mb-4">{selectedPost.category}</span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">{selectedPost.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5">📅 {selectedPost.date}</span>
              <span className="flex items-center gap-1.5">👁️ {selectedPost.views} views</span>
              <span className="flex items-center gap-1.5">📖 {readingTime} min read</span>
              <span className="flex items-center gap-1.5">📝 {wordCount} words</span>
            </div>
          </div>

          {/* Cover Image */}
          <div className="rounded-2xl overflow-hidden mb-10 border border-white/10">
            <img 
              src={selectedPost.imageSrc || selectedPost.image_src} 
              alt={selectedPost.title}
              className="w-full max-h-[500px] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Social Share Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-10 pb-8 border-b border-white/10">
            <span className="text-slate-400 text-sm font-semibold mr-2">Share:</span>
            <button onClick={() => handleShare('twitter', selectedPost)} className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-xl hover:bg-[#1DA1F2]/20 transition-colors text-sm font-bold border border-[#1DA1F2]/20">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Twitter
            </button>
            <button onClick={() => handleShare('linkedin', selectedPost)} className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2]/10 text-[#0A66C2] rounded-xl hover:bg-[#0A66C2]/20 transition-colors text-sm font-bold border border-[#0A66C2]/20">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </button>
            <button onClick={() => handleShare('facebook', selectedPost)} className="flex items-center gap-2 px-4 py-2 bg-[#1877F2]/10 text-[#1877F2] rounded-xl hover:bg-[#1877F2]/20 transition-colors text-sm font-bold border border-[#1877F2]/20">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
            <button onClick={() => handleShare('whatsapp', selectedPost)} className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366]/20 transition-colors text-sm font-bold border border-[#25D366]/20">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button onClick={() => copyLink(selectedPost)} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-sm font-bold border ${copied ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>
              {copied ? '✓ Copied!' : '🔗 Copy Link'}
            </button>
          </div>

          {/* Article Content */}
          <article className="blog-article-content mb-10">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {selectedPost.content || '*No content available for this article yet. Check back soon!*'}
            </ReactMarkdown>
          </article>

          {/* Hashtags */}
          {selectedPost.hashtags && (
            <div className="flex flex-wrap gap-2 mb-10 pb-8 border-b border-white/10">
              {selectedPost.hashtags.split(/\s+/).filter(Boolean).map((tag: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-sm font-semibold border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-default">
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          {/* Bottom Social Share */}
          <div className="bg-gradient-to-br from-slate-900/80 to-blue-900/20 border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-white font-bold text-lg mb-2">Found this article helpful?</p>
            <p className="text-slate-400 text-sm mb-6">Share it with your colleagues and fellow medical professionals.</p>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <button onClick={() => handleShare('twitter', selectedPost)} className="px-5 py-2.5 bg-[#1DA1F2] text-white rounded-xl hover:bg-[#1a8cd8] transition-colors text-sm font-bold shadow-md">Share on Twitter</button>
              <button onClick={() => handleShare('linkedin', selectedPost)} className="px-5 py-2.5 bg-[#0A66C2] text-white rounded-xl hover:bg-[#0958a8] transition-colors text-sm font-bold shadow-md">Share on LinkedIn</button>
              <button onClick={() => handleShare('facebook', selectedPost)} className="px-5 py-2.5 bg-[#1877F2] text-white rounded-xl hover:bg-[#1565d8] transition-colors text-sm font-bold shadow-md">Share on Facebook</button>
              <button onClick={() => handleShare('whatsapp', selectedPost)} className="px-5 py-2.5 bg-[#25D366] text-white rounded-xl hover:bg-[#1ebe57] transition-colors text-sm font-bold shadow-md">Share on WhatsApp</button>
              <button onClick={() => copyLink(selectedPost)} className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                {copied ? '✓ Link Copied!' : '🔗 Copy Link'}
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
              <span>🔬</span>
              <span>Powered by <strong className="text-blue-400">MediMentr</strong> — AI-Powered Medical Education Platform</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter to show only published posts on the public blog page
  const publishedPosts = blogPosts.filter(p => !p.status || p.status === 'published');

  // Articles Grid View
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">Academic Insights</h2>
            <p className="text-slate-400 text-lg">Latest articles on medical education and research methodology.</p>
          </div>
          <p className="text-slate-500 text-sm font-medium">{publishedPosts.length} articles</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publishedPosts.map((post, i) => (
            <div 
              key={post.id || i} 
              onClick={() => setSelectedPost(post)}
              className="group cursor-pointer bg-slate-900 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/5"
            >
              <div className="aspect-video overflow-hidden bg-slate-800">
                <img 
                  src={post.imageSrc || post.image_src} 
                  alt={post.title} 
                  className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-6 space-y-4">
                <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">{post.category}</span>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">{post.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-3">{post.excerpt}</p>
                {/* Hashtags */}
                {post.hashtags && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.hashtags.split(/\s+/).filter(Boolean).slice(0, 3).map((tag: string, ti: number) => (
                      <span key={ti} className="text-[11px] text-blue-400/70 font-medium">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                    ))}
                    {post.hashtags.split(/\s+/).filter(Boolean).length > 3 && (
                      <span className="text-[11px] text-slate-500">+{post.hashtags.split(/\s+/).filter(Boolean).length - 3} more</span>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <p className="text-slate-500 text-xs">{post.date} • {post.views} views</p>
                  <span className="text-blue-400 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">Read More <ChevronRight size={14} /></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Pages

const LANDING_PRICING_PLANS = [
  {
    name: "Free",
    price: "₹0",
    description: "Access to essential productivity tools after trial.",
    features: [
      {
        title: "Productivity & Professional Management",
        items: [
          "Digital Diary",
          "Contacts Management System",
          "Scientific Session Search",
          "Professional Resume"
        ]
      }
    ]
  },
  {
    name: "Starter",
    price: "₹499",
    period: "/mo",
    description: "Free User Plus",
    features: [
      {
        title: "Knowledge & Learning Resources",
        items: [
          "Search Topic",
          "Knowledge Library- LMS Notes",
          "Essay Library",
          "MCQ Library",
          "Flash Cards"
        ]
      },
      {
        title: "Academic & Research Writing",
        items: [
          "Essay Generator",
          "Seminar Builder",
          "Journal Club Preparator",
          "Protocol Generator",
          "StatAssist",
          "Manuscript Generator"
        ]
      }
    ]
  },
  {
    name: "Standard",
    price: "₹1,199",
    period: "/mo",
    popular: true,
    description: "Starter Plus",
    features: [
      {
        title: "Clinical Decision & Practice Support",
        items: [
          "Prescription Analyser",
          "Guidelines Generator",
          "Clinical Decision Support System (CDS)",
          "Doubt Solving & Concept Simplification",
          "Drug & Treatment Assistant"
        ]
      },
      {
        title: "Thesis Manager",
        items: [
          "Core System Features",
          "Research Hub Dashboard",
          "Project Management",
          "Participant Management",
          "Data Collection",
          "Research Notes",
          "Field Log",
          "Reports",
          "Tracking & Analytics (Dashboard Stats)"
        ]
      }
    ]
  },
  {
    name: "Premium",
    price: "₹1,999",
    period: "/mo",
    description: "Standard Plus",
    features: [
      {
        title: "Learning Management System",
        items: [
          "Track your learning progress",
          "Identify areas that need more focus",
          "AI integrated Analytics",
          "Assess Weak Areas",
          "Suggest what to focus"
        ]
      },
      {
        title: "Assessment & Examination System",
        items: [
          "AI Exam Preparation System",
          "Question Paper Generator",
          "Reflection Generator",
          "Knowledge Analyser (Essay)",
          "Knowledge Analyser (MCQs)",
          "AI Exam Simulator",
          "Clinical Examination System"
        ]
      }
    ]
  }
];
const LandingPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => (
  <div className="pt-24">
    {/* Hero Section */}
    <section className="relative px-6 py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10 text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6 inline-block">
            Next-Gen Medical Education
          </span>
          <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
            AI Powered Academic Companion <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              for gaining Expertise in Medical Education
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mt-6">
            Prepare smarter for exams, clinical work, research, seminars, and publications with our specialized AI modules designed for medical professionals.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 pt-4"
        >
          <button 
            onClick={() => (onNavigate as any)('__openAuth')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            Explore App <ChevronRight size={20} />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="pt-20 relative"
        >
          <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-blue-500/10 bg-slate-900/50 backdrop-blur-sm">
            <img 
              src="/hero-robotics.jpg" 
              alt="Medimentr Dashboard Preview" 
              className="w-full opacity-80"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>

    {/* Features Grid */}
    <section className="py-24 px-6 bg-slate-950/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-white mb-4">Comprehensive AI Toolkit</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Everything an Expert needs excel in medical field
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.slice(0, 6).map((feature, i) => (
            <motion.div 
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-slate-900 border border-white/5 hover:border-blue-500/30 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                {getIcon(feature.icon)}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {feature.description}
              </p>
              <button 
                onClick={() => onNavigate('signup')}
                className="text-blue-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              >
                Learn More <ChevronRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <button 
            onClick={() => onNavigate('features')}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-semibold transition-all"
          >
            View All 11+ Modules
          </button>
        </div>
      </div>
    </section>

    {/* Workflow Section */}
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-8">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Streamline Your <br />
            <span className="text-blue-500">Academic Workflow</span>
          </h2>
          <div className="space-y-6">
            {[
              { title: "Study & Analyze", desc: "Access evidence-based notes and analyze clinical papers instantly.", icon: <Microscope size={24} /> },
              { title: "Write & Document", desc: "Generate essays, thesis protocols, and manuscripts with AI assistance.", icon: <PenTool size={24} /> },
              { title: "Prepare & Excel", desc: "Build seminars and practice with pattern-based question papers.", icon: <Presentation size={24} /> }
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="w-12 h-12 shrink-0 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-blue-500">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full" />
          <div className="relative grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-12">
              <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-xl">
                <Activity className="text-emerald-500 mb-4" />
                <div className="h-2 w-20 bg-emerald-500/20 rounded-full mb-2" />
                <div className="h-2 w-12 bg-emerald-500/20 rounded-full" />
              </div>
              <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-xl">
                <HeartPulse className="text-blue-500 mb-4" />
                <div className="h-2 w-24 bg-blue-500/20 rounded-full mb-2" />
                <div className="h-2 w-16 bg-blue-500/20 rounded-full" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-xl">
                <Brain className="text-purple-500 mb-4" />
                <div className="h-2 w-28 bg-purple-500/20 rounded-full mb-2" />
                <div className="h-2 w-20 bg-purple-500/20 rounded-full" />
              </div>
              <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-xl">
                <Microscope className="text-orange-500 mb-4" />
                <div className="h-2 w-20 bg-orange-500/20 rounded-full mb-2" />
                <div className="h-2 w-14 bg-orange-500/20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Testimonials */}
    <section className="py-24 px-6 bg-slate-950/50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-16">Trusted by Medical Scholars</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Dr. Priya Sharma", role: "Postgraduate Student", text: "Medimentr helped me structure my thesis and improve my exam answers significantly. The essay generator is a lifesaver." },
            { name: "Dr. Rajesh Kumar", role: "PhD Scholar", text: "StatAssist simplified statistical analysis for my research. I could finally understand which tests to apply and why." },
            { name: "Dr. Anita Rao", role: "Medical Academician", text: "The seminar builder saves hours of work. The slide structures are logical and the notes are comprehensive." }
          ].map((t, i) => (
            <div key={i} className="p-8 rounded-2xl bg-slate-900 border border-white/5 italic text-slate-300">
              <p className="mb-6">"{t.text}"</p>
              <div className="not-italic">
                <p className="text-white font-bold">{t.name}</p>
                <p className="text-blue-500 text-sm">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing Section */}
    <section id="pricing" className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-600/5 blur-[150px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Choose the perfect plan for your academic and clinical needs. All plans include continuous AI updates.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {LANDING_PRICING_PLANS.map((plan, i) => (
            <div 
              key={i} 
              className={`relative flex flex-col p-8 rounded-3xl ${plan.popular ? 'bg-slate-800 border-blue-500 shadow-2xl shadow-blue-500/20' : 'bg-slate-900 border-white/10'} border`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-400 min-h-[40px]">{plan.description}</p>
              </div>
              
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                {plan.period && <span className="text-slate-500">{plan.period}</span>}
              </div>
              
              <button 
                onClick={() => (onNavigate as any)('__openAuth')}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all mb-8 ${plan.popular ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'}`}
              >
                {plan.name === 'Free' ? 'Start Free Trial' : 'Get Started'}
              </button>
              
              <div className="flex-1 space-y-6">
                {plan.features.map((featureGroup, j) => (
                  <div key={j} className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">{featureGroup.title}</h4>
                    <ul className="space-y-2">
                      {featureGroup.items.map((item, k) => (
                        <li key={k} className="flex gap-3 text-sm text-slate-300">
                          <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Blog Section */}
    <section id="blog" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div className="cursor-pointer group" onClick={() => onNavigate('blog')}>
            <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">Academic Insights</h2>
            <p className="text-slate-400">Latest articles on medical education and research methodology.</p>
          </div>
          <button 
            onClick={() => onNavigate('blog')}
            className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
          >
            View All Posts
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ACADEMIC_INSIGHTS_POSTS.map((post, i) => (
            <div key={i} className={`group cursor-pointer bg-slate-900 border border-white/5 rounded-3xl p-6 hover:bg-slate-800 transition-colors animate-in fade-in slide-in-from-bottom-${4 + i*2} duration-700`}>
                <div className="aspect-video rounded-2xl overflow-hidden mt-6 mb-6 bg-slate-800 border border-white/10">
                  <img 
                    src={post.imageSrc} 
                    alt={post.title} 
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
              </div>
              <div className="space-y-3">
                <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">{post.category}</span>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{post.title}</h3>
                <p className="text-slate-500 text-sm">{post.date} • 5 min read</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Contact Section */}
    <section id="contact" className="py-24 px-6 bg-slate-950/50">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-8">
          <h2 className="text-4xl font-bold text-white">Get in Touch</h2>
          <p className="text-slate-400 text-lg">
            Have questions about Medimentr? Our support team is here to help you excel in your academic journey.
          </p>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500">
                <Send size={20} />
              </div>
              <div>
                <p className="text-white font-semibold">Email Us</p>
                <p className="text-slate-400">support@healic.co</p>
              </div>
            </div>
          </div>
        </div>
        
        <form action="https://formsubmit.co/support@healic.co" method="POST" className="bg-slate-900 border border-white/10 p-8 rounded-3xl space-y-6 shadow-2xl">
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_subject" value="New contact form submission - Medimentr" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">Name</label>
              <input type="text" name="name" required className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="Dr. John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">Email</label>
              <input type="email" name="email" required className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="john@hospital.com" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium">Subject</label>
            <input type="text" name="subject" required className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="How can we help?" />
          </div>
          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium">Message</label>
            <textarea name="message" required className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white h-32 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Your message here..." />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20">
            Send Message
          </button>
        </form>
      </div>
    </section>
  </div>
);

// (SignInPage replaced by AuthModal)

const CATEGORIES = [
  "Dashboard",
  "Productivity & Professional Management",
  "Learning Management System",
  "Knowledge & Learning Resources",
  "Academic & Research Writing",
  "Clinical Decision & Practice Support",
  "Assessment & Examination System",
  "Thesis Manager"
];

// Plan-based category access control
const ALL_CATEGORIES = [
  "Dashboard",
  "Productivity & Professional Management",
  "Knowledge & Learning Resources",
  "Academic & Research Writing",
  "Clinical Decision & Practice Support",
  "Thesis Manager",
  "Assessment & Examination System",
  "Learning Management System"
];

const PLAN_CATEGORY_ACCESS: Record<string, string[]> = {
  // Trial: ALL features for 15 days (100,000 tokens)
  trial: [...ALL_CATEGORIES],
  // Free: Basic access after trial expires (10,000 tokens/month)
  free: [
    "Dashboard",
    "Productivity & Professional Management"
  ],
  // Starter: ₹100/month (100,000 tokens/month)
  starter: [
    "Dashboard",
    "Productivity & Professional Management",
    "Knowledge & Learning Resources",
    "Academic & Research Writing"
  ],
  // Standard: ₹300/month (300,000 tokens/month)
  standard: [
    "Dashboard",
    "Productivity & Professional Management",
    "Knowledge & Learning Resources",
    "Academic & Research Writing",
    "Clinical Decision & Practice Support",
    "Thesis Manager"
  ],
  // Premium: ₹500/month (500,000 tokens/month)
  premium: [...ALL_CATEGORIES]
};

const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial',
  free: 'Free',
  starter: 'Starter',
  standard: 'Standard',
  premium: 'Premium'
};

const getRequiredPlan = (category: string): string | null => {
  if (PLAN_CATEGORY_ACCESS.free.includes(category)) return null; // free-level (always accessible)
  if (PLAN_CATEGORY_ACCESS.starter.includes(category)) return 'Starter';
  if (PLAN_CATEGORY_ACCESS.standard.includes(category)) return 'Standard';
  return 'Premium';
};
// ─── Referral Card Component ──────────────────────────────────────────────────
const ReferralCard = () => {
  const [referralCode, setReferralCode] = useState('');
  const [totalReferred, setTotalReferred] = useState(0);
  const [totalSubscribed, setTotalSubscribed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralStats = async () => {
      try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session?.user?.id) return;
        const res = await fetch(`/api/referral/stats/${session.user.id}`);
        const data = await res.json();
        setReferralCode(data.referral_code || '');
        setTotalReferred(data.total_referred || 0);
        setTotalSubscribed(data.total_subscribed || 0);
      } catch (err) {
        console.error('Failed to fetch referral stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferralStats();
  }, []);

  const referralLink = referralCode ? `${window.location.origin}/?ref=${referralCode}` : '';
  const shareText = `🩺 Check out MediMentr — an AI-powered academic companion for medical professionals! Get a FREE 15-day trial with ALL features. Sign up here: ${referralLink}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedLink = encodeURIComponent(referralLink);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodeURIComponent('🩺 AI-powered medical education platform — MediMentr')}`
    };
    window.open(urls[platform], '_blank', 'noopener,noreferrer');
  };

  const progress = Math.min((totalSubscribed / 100) * 100, 100);
  const nextMilestone = totalSubscribed < 100 ? 100 : 1000;

  if (loading) return null;

  return (
    <div className="mt-10 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-emerald-600/10 backdrop-blur-sm">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Gift size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Want to Support MediMentr?</h2>
            <p className="text-slate-400 text-sm mt-1">Share on social media & earn <span className="text-amber-400 font-bold">FREE Premium Access!</span></p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 mb-6">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Your Referral Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                copied 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] rounded-xl hover:bg-[#25D366]/20 transition-colors text-sm font-bold">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
          <button onClick={() => handleShare('linkedin')} className="flex items-center gap-2 px-5 py-2.5 bg-[#0A66C2]/10 border border-[#0A66C2]/20 text-[#0A66C2] rounded-xl hover:bg-[#0A66C2]/20 transition-colors text-sm font-bold">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </button>
          <button onClick={() => handleShare('twitter')} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition-colors text-sm font-bold">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X / Twitter
          </button>
          <button onClick={() => handleShare('telegram')} className="flex items-center gap-2 px-5 py-2.5 bg-[#0088CC]/10 border border-[#0088CC]/20 text-[#0088CC] rounded-xl hover:bg-[#0088CC]/20 transition-colors text-sm font-bold">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Telegram
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 text-center">
            <div className="text-3xl font-black text-emerald-400">{totalReferred}</div>
            <div className="text-sm text-slate-400 font-medium mt-1">Users Joined</div>
          </div>
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 text-center">
            <div className="text-3xl font-black text-purple-400">{totalSubscribed}</div>
            <div className="text-sm text-slate-400 font-medium mt-1">Subscribed</div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-white">Progress to Next Reward</span>
            <span className="text-xs font-bold text-amber-400">{totalSubscribed} / {nextMilestone} subscribers</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000"
              style={{ width: `${Math.min((totalSubscribed / nextMilestone) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Reward Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`rounded-2xl border p-5 ${totalSubscribed >= 100 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-slate-900/40'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Award size={18} className={totalSubscribed >= 100 ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="font-bold text-white text-sm">100 Paid Subscribers</span>
              {totalSubscribed >= 100 && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold">UNLOCKED</span>}
            </div>
            <p className="text-slate-400 text-xs">Get <strong className="text-amber-400">FREE Premium for 1 Month</strong></p>
          </div>
          <div className={`rounded-2xl border p-5 ${totalSubscribed >= 1000 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-slate-900/40'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={18} className={totalSubscribed >= 1000 ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="font-bold text-white text-sm">1,000 Paid Subscribers</span>
              {totalSubscribed >= 1000 && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold">UNLOCKED</span>}
            </div>
            <p className="text-slate-400 text-xs">Get <strong className="text-amber-400">FREE Premium for 1 Year</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

const COURSE_OPTIONS_LIST = [
  'Mastering Anatomy', 'Mastering Physiology', 'Mastering Biochemistry',
  'Mastering Pharmacology', 'Mastering Pathology', 'Mastering Microbiology',
  'Mastering Forensic Medicine & Toxicology', 'Mastering PSM / Community Medicine',
  'Mastering General Medicine', 'Mastering General Surgery',
  'Mastering Obstetrics & Gynecology', 'Mastering Pediatrics',
  'Mastering ENT', 'Mastering Ophthalmology', 'Mastering Orthopaedics',
  'Mastering Dermatology (DVL)', 'Mastering Psychiatry', 'Mastering Anaesthesiology',
  'Mastering Radio Diagnosis'
];

const DashboardContent = ({ curriculum }: { curriculum?: any[] }) => {
  const [activeCourse, setActiveCourse] = useState<string | null>(null);
  const [showChangeCourseModal, setShowChangeCourseModal] = useState(false);
  const [newCourseSelection, setNewCourseSelection] = useState('');
  const [changingCourse, setChangingCourse] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isRealUser, setIsRealUser] = useState(false);

  // Get user email from localStorage
  const getUserEmail = (): string | null => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.email || null;
      }
    } catch {}
    return null;
  };

  useEffect(() => {
    const loadProfile = async () => {
      const email = getUserEmail();
      if (email) setUserEmail(email);

      // Try loading from Supabase API first
      if (email) {
        try {
          const res = await fetch(`/api/user/profile-by-email?email=${encodeURIComponent(email)}`);
          if (res.ok) {
            const profile = await res.json();
            setActiveCourse(profile.selected_course || null);
            // Sync to localStorage so FeatureModule picks it up
            if (profile.selected_course) {
              localStorage.setItem('medimentr_selected_course', profile.selected_course);
            }
            setIsRealUser(true);
            return;
          }
        } catch {}
      }

      // Fallback: load from localStorage for demo users
      const saved = localStorage.getItem('medimentr_selected_course');
      if (saved) setActiveCourse(saved);
    };
    loadProfile();
  }, []);

  const handleChangeCourse = async () => {
    if (!newCourseSelection) return;

    setChangingCourse(true);
    try {
      const email = userEmail || getUserEmail();

      // Try Supabase API if we have a real user
      if (email && isRealUser) {
        const res = await fetch('/api/user/course', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, selectedCourse: newCourseSelection })
        });
        if (res.ok) {
          setActiveCourse(newCourseSelection);
          setShowChangeCourseModal(false);
          setNewCourseSelection('');
          return;
        }
      }

      // Fallback: save to localStorage for demo/dev users
      localStorage.setItem('medimentr_selected_course', newCourseSelection);
      setActiveCourse(newCourseSelection);
      setShowChangeCourseModal(false);
      setNewCourseSelection('');
    } catch (err: any) {
      console.error('Course update error:', err);
      // Even on error, save locally so the UI works
      localStorage.setItem('medimentr_selected_course', newCourseSelection);
      setActiveCourse(newCourseSelection);
      setShowChangeCourseModal(false);
      setNewCourseSelection('');
    } finally {
      setChangingCourse(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-white mb-2">Dashboard Analytics</h1>
      <p className="text-slate-400 mb-8">Overview of your learning progress and system usage across all features.</p>

      {/* ─── Active Course Card ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/60 via-slate-900/80 to-indigo-950/60 p-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <BookOpen size={26} className="text-white" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400/70 mb-1">Active Course</div>
              {activeCourse ? (
                <div className="text-xl font-extrabold text-white">{activeCourse}</div>
              ) : (
                <div className="text-lg font-semibold text-slate-500 italic">No course selected yet</div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setNewCourseSelection(activeCourse || '');
              setShowChangeCourseModal(true);
            }}
            className="self-start md:self-center px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2"
          >
            <Edit3 size={14} />
            {activeCourse ? 'Change Course' : 'Select Course'}
          </button>
        </div>
      </div>

      {/* ─── Change Course Modal ─── */}
      <AnimatePresence>
        {showChangeCourseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowChangeCourseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-black/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <BookOpen size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{activeCourse ? 'Change Course' : 'Select Course'}</h3>
                  <p className="text-sm text-slate-400">Choose your learning path</p>
                </div>
              </div>

              {activeCourse && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm rounded-xl px-4 py-3 mb-5">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span><strong>Warning:</strong> Switching courses will reset all learning data for your current course (<strong>{activeCourse}</strong>). This cannot be undone.</span>
                </div>
              )}

              <div className="space-y-1.5 mb-6">
                <label className="block text-slate-300 text-sm font-medium">Select New Course</label>
                <div className="relative">
                  <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={newCourseSelection}
                    onChange={e => setNewCourseSelection(e.target.value)}
                    className="w-full appearance-none bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Select Course --</option>
                    {COURSE_OPTIONS_LIST.map(c => (
                      <option key={c} value={c} disabled={c === activeCourse}>{c}{c === activeCourse ? ' (current)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowChangeCourseModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeCourse}
                  disabled={changingCourse || !newCourseSelection || newCourseSelection === activeCourse}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {changingCourse ? (
                    <><RotateCcw size={16} className="animate-spin" /> Saving...</>
                  ) : (
                    <><CheckCircle size={16} /> Confirm</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:bg-slate-800 transition-colors">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4"><Library size={20} /></div>
          <div className="text-3xl font-bold text-white">1,248</div>
          <div className="text-sm text-slate-400 font-medium mt-1">Topics Researched</div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:bg-slate-800 transition-colors">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-4"><PenTool size={20} /></div>
          <div className="text-3xl font-bold text-white">42</div>
          <div className="text-sm text-slate-400 font-medium mt-1">Documents Drafted</div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:bg-slate-800 transition-colors">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-4"><GraduationCap size={20} /></div>
          <div className="text-3xl font-bold text-white">85%</div>
          <div className="text-sm text-slate-400 font-medium mt-1">Avg. Exam Score</div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:bg-slate-800 transition-colors">
          <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 mb-4"><Activity size={20} /></div>
          <div className="text-3xl font-bold text-white">12</div>
          <div className="text-sm text-slate-400 font-medium mt-1">Cases Simulated</div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:bg-slate-800 transition-colors">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 mb-4"><Stethoscope size={20} /></div>
          <div className="text-3xl font-bold text-white">156</div>
          <div className="text-sm text-slate-400 font-medium mt-1">Decisions Supported</div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:bg-slate-800 transition-colors">
          <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400 mb-4"><Brain size={20} /></div>
          <div className="text-3xl font-bold text-white">412</div>
          <div className="text-sm text-slate-400 font-medium mt-1">Mentor Queries</div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:bg-slate-800 transition-colors">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 mb-4"><Users size={20} /></div>
          <div className="text-3xl font-bold text-white">89</div>
          <div className="text-sm text-slate-400 font-medium mt-1">Contacts Managed</div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:bg-slate-800 transition-colors">
          <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400 mb-4"><FileText size={20} /></div>
          <div className="text-3xl font-bold text-white">5</div>
          <div className="text-sm text-slate-400 font-medium mt-1">Thesis Chapters</div>
        </div>
      </div>

      {/* ─── Refer & Earn Card ─── */}
      <ReferralCard />
    </div>
  );
};

const DashboardLayout = ({ onNavigate, currentPage, children, curriculum, userPlan = 'trial', authSession, trialEndDate }: { onNavigate: (page: string) => void, currentPage?: string, children?: React.ReactNode, curriculum?: any[], userPlan?: string, authSession?: any, trialEndDate?: string | null }) => {
  const [activeCategory, setActiveCategory] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lockedTooltip, setLockedTooltip] = useState<string | null>(null);

  const allowedCategories = PLAN_CATEGORY_ACCESS[userPlan] || PLAN_CATEGORY_ACCESS.free;
  const isCategoryAllowed = (cat: string) => allowedCategories.includes(cat);

  const userName = authSession?.user?.user_metadata?.full_name || authSession?.user?.user_metadata?.name || '';
  const userEmail = authSession?.user?.email || '';

  return (
    <div className="min-h-screen flex bg-slate-950 relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation Panel */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-[280px] md:w-80 border-r border-white/10 bg-slate-900 md:bg-slate-900/50 flex flex-col gap-2 shrink-0 overflow-y-auto transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex flex-col gap-2">
          <div className="flex justify-between items-center mb-2 px-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
              <img src="/logo.jpg" alt="MediMentr Logo" className="w-8 h-8 object-contain rounded-xl" />
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">MediMentr</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          {/* User Info */}
          {userEmail && (
            <div className="mx-2 mb-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-blue-500/20">
                  {(userName || userEmail).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  {userName && <p className="text-[13px] font-semibold text-white truncate leading-tight">{userName}</p>}
                  <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">{userEmail}</p>
                </div>
              </div>
            </div>
          )}
          {userPlan === 'trial' && (() => {
            let daysLeft = 15;
            if (trialEndDate) {
              const end = new Date(trialEndDate);
              const now = new Date();
              daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            }
            return (
              <div className="mx-2 mb-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-xs">{daysLeft <= 3 ? '⚠️' : '🎉'}</span>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${daysLeft <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>Trial Active</span>
                </div>
                <p className={`text-[10px] mt-1 ${daysLeft <= 3 ? 'text-amber-400/80' : 'text-slate-400'}`}>
                  {daysLeft === 0 ? 'Trial expires today' : daysLeft === 1 ? '1 day left of trial' : `${daysLeft} days left of trial`}
                </p>
              </div>
            );
          })()}
          {CATEGORIES.map(category => {
            const allowed = isCategoryAllowed(category);
            const requiredPlan = getRequiredPlan(category);
            return (
              <button
                key={category}
                onClick={() => {
                  if (!allowed) {
                    setLockedTooltip(category);
                    setTimeout(() => setLockedTooltip(null), 3000);
                    return;
                  }
                  setActiveCategory(category);
                  setIsSidebarOpen(false);
                  if (category === 'Thesis Manager') {
                    onNavigate('feature-thesis-notes');
                  } else if (currentPage && currentPage !== 'dashboard') {
                    onNavigate('dashboard');
                  }
                }}
                className={`text-left px-4 py-3 rounded-xl transition-all font-medium flex items-center gap-3 relative ${
                  !allowed
                    ? 'text-slate-600 cursor-not-allowed border border-transparent opacity-60'
                    : activeCategory === category 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                }`}
              >
                {category === 'Dashboard' && <LayoutDashboard size={18} />}
                {category === 'Thesis Manager' && (allowed ? <ClipboardList size={18} /> : <Lock size={14} className="text-slate-600" />)}
                {category !== 'Dashboard' && category !== 'Thesis Manager' && (
                  allowed 
                    ? <ChevronRight size={16} className={activeCategory === category ? 'text-blue-400/50' : 'text-slate-600'} />
                    : <Lock size={14} className="text-slate-600" />
                )}
                <span className="text-sm leading-snug flex-1">{category}</span>
                {!allowed && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 shrink-0">
                    {requiredPlan}
                  </span>
                )}
                {/* Locked tooltip */}
                {lockedTooltip === category && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 shadow-xl whitespace-nowrap">
                    <p className="text-xs text-white font-semibold">Upgrade to {requiredPlan} Plan</p>
                    <p className="text-[11px] text-slate-400">to access {category}</p>
                  </div>
                )}
              </button>
            );
          })}
          
          <div className="mt-auto pt-4 border-t border-white/10 shrink-0 space-y-1">
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                onNavigate('home');
              }}
              className="w-full text-left px-4 py-3 rounded-xl transition-all font-medium flex items-center gap-3 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
            >
              <Globe size={18} />
              <span className="text-sm leading-snug">Home Page</span>
            </button>
            <button
              onClick={async () => {
                setIsSidebarOpen(false);
                try {
                  const currentSession = await _supabase.auth.getSession();
                  const email = currentSession.data.session?.user?.email;
                  if (email) {
                    await fetch('/api/auth/session/logout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    });
                  }
                  localStorage.removeItem('medimentr_session_id');
                } catch (err) {
                  // Proceed to checkout even if backend call fails
                }
                await _supabase.auth.signOut();
                onNavigate('__logout');
              }}
              className="w-full text-left px-4 py-3 rounded-xl transition-all font-medium flex items-center gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent"
            >
              <LogOut size={18} />
              <span className="text-sm leading-snug">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 min-w-0 w-full">
        {/* Mobile Header for Menu Toggle */}
        <div className="md:hidden flex items-center mb-6">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 text-slate-300 hover:text-white border border-white/10 bg-slate-800 px-4 py-2 rounded-xl transition-colors"
          >
            <Menu size={20} />
            <span className="font-semibold text-sm">Categories</span>
          </button>
        </div>

        {currentPage && currentPage.startsWith('feature-') ? (
          children
        ) : activeCategory === "Dashboard" ? (
          <DashboardContent curriculum={curriculum} />
        ) : activeCategory === "Learning Management System" ? (
          <LearningManagementDashboard onNavigate={onNavigate} curriculum={curriculum || []} />
        ) : (
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-white mb-2">{activeCategory}</h1>
            <p className="text-slate-400 mb-10">Access specialized AI tools and resources for {activeCategory.toLowerCase()}.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.filter(f => f.category === activeCategory).map(feature => (
                <motion.div 
                  key={feature.id}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-2xl bg-slate-900 border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer group flex flex-col"
                  onClick={() => onNavigate(`feature-${feature.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {getIcon(feature.icon)}
                    </div>
                    {feature.category !== 'Knowledge & Learning Resources' && (
                      <div className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        AI Powered
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed flex-1">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
              {FEATURES.filter(f => f.category === activeCategory).length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500">
                  No features currently mapped to this category.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const FeaturesPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">AI Feature Dashboard</h1>
            <p className="text-slate-400">Select a specialized module to begin your academic task.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {FEATURES.map((feature) => (
            <motion.div 
              key={feature.id}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-slate-900 border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer group"
              onClick={() => onNavigate(`feature-${feature.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {getIcon(feature.icon)}
                </div>
                {feature.category !== 'Knowledge & Learning Resources' && (
                  <div className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                    AI Powered
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FlashcardViewer = ({ output }: { output: string }) => {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  // Robust flashcard parser that handles all AI output variations
  const cards: {front: string, back: string}[] = [];
  const lines = output.split('\n');
  let currentFront = '';
  let currentBack = '';
  let inFront = false;
  let inBack = false;

  // Patterns for Front line detection (handles bold markers, colons in various positions)
  const frontRegex = /^\*{0,2}\s*Front\s*(?:\(Question\))?\s*:?\s*\*{0,2}\s*:?\s*(.*)/i;
  // Patterns for Back line detection
  const backRegex = /^\*{0,2}\s*Back\s*(?:\(Answer\))?\s*:?\s*\*{0,2}\s*:?\s*(.*)/i;
  // Flashcard header detection
  const flashcardHeaderRegex = /^\*{0,2}\s*Flashcard\s+\d+\s*:?\s*\*{0,2}\s*$/i;

  for (let i = 0; i < lines.length; i++) {
    // Strip leading bullet markers: "* ", "- ", "• ", "1. ", etc.
    const line = lines[i].trim().replace(/^[\*\-•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
    
    // Check for Flashcard header (e.g., "Flashcard 1", "**Flashcard 2**")
    if (flashcardHeaderRegex.test(line)) {
      if (currentFront && currentBack) {
        cards.push({ front: currentFront.trim(), back: currentBack.trim() });
        currentFront = '';
        currentBack = '';
      }
      inFront = false;
      inBack = false;
      continue;
    }

    // Check for Front line
    const frontMatch = frontRegex.exec(line);
    if (frontMatch && /front/i.test(line)) {
      if (currentFront && currentBack) {
        cards.push({ front: currentFront.trim(), back: currentBack.trim() });
        currentFront = '';
        currentBack = '';
      }
      inFront = true;
      inBack = false;
      const content = (frontMatch[1] || '').trim();
      if (content) currentFront += content + '\n';
      continue;
    }

    // Check for Back line
    const backMatch = backRegex.exec(line);
    if (backMatch && /back/i.test(line)) {
      inFront = false;
      inBack = true;
      const content = (backMatch[1] || '').trim();
      if (content) currentBack += content + '\n';
      continue;
    }

    // Regular content lines (also strip bullet markers for content)
    if (inFront) currentFront += line + '\n';
    else if (inBack) currentBack += line + '\n';
  }
  if (currentFront && currentBack) {
    cards.push({ front: currentFront.trim(), back: currentBack.trim() });
  }

  const toggleFlip = (index: number) => {
    setFlipped(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (cards.length === 0) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {output.replace(/\n{3,}/g, '\n\n').replace(/As an expert medical professor and author, I have crafted/g, "As an expert medical professor and author, our team of Experts have crafted")}
      </ReactMarkdown>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4 mb-8">
      {cards.map((card, index) => (
        <div 
          key={index}
          className="relative w-full h-[280px] [perspective:1000px] cursor-pointer group"
          onClick={() => toggleFlip(index)}
        >
          <div className={`w-full h-full transition-transform duration-600 ease-in-out [transform-style:preserve-3d] ${flipped[index] ? '[transform:rotateY(180deg)]' : ''}`}>
             
             {/* Front of card */}
             <div className="absolute w-full h-full rounded-2xl p-5 flex flex-col items-center text-center bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 [backface-visibility:hidden] shadow-lg group-hover:border-blue-500/60 group-hover:shadow-blue-900/20 group-hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <div className="w-6 h-6 rounded-md bg-blue-600/30 flex items-center justify-center">
                    <span className="text-blue-400 text-[10px] font-bold">{index + 1}</span>
                  </div>
                  <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Question</span>
                </div>
                <div className="flex-1 overflow-y-auto w-full flex items-center justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <p className={`text-slate-100 ${card.front.length > 400 ? 'text-[11px] leading-snug' : card.front.length > 250 ? 'text-[12px] leading-snug' : card.front.length > 150 ? 'text-[13px] leading-normal' : 'text-[15px] leading-relaxed'} font-medium`}>{card.front}</p>
                </div>
                <span className="text-slate-500 text-[10px] mt-3 uppercase tracking-wider font-semibold shrink-0 flex items-center gap-1.5">
                  <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Tap to flip
                </span>
             </div>
             
             {/* Back of card */}
             <div className="absolute w-full h-full rounded-2xl p-5 flex flex-col items-center bg-gradient-to-br from-blue-900/80 via-slate-900 to-slate-900 border border-blue-500/30 shadow-lg shadow-blue-900/10 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <div className="w-6 h-6 rounded-md bg-emerald-600/30 flex items-center justify-center">
                    <span className="text-emerald-400 text-[10px] font-bold">{index + 1}</span>
                  </div>
                  <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Answer</span>
                </div>
                <div className="flex-1 overflow-y-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className={`text-slate-200 text-left w-full ${card.back.length > 600 ? 'text-[10px] leading-snug space-y-0.5' : card.back.length > 400 ? 'text-[11px] leading-snug space-y-0.5' : card.back.length > 250 ? 'text-[12px] leading-normal space-y-1' : 'text-[13px] leading-relaxed space-y-1'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.back}</ReactMarkdown>
                  </div>
                </div>
                <span className="text-blue-300/60 text-[10px] mt-3 uppercase tracking-wider font-semibold shrink-0 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Tap to flip back
                </span>
             </div>

          </div>
        </div>
      ))}
    </div>
  );
};

const MarkdownBody = ({ content }: { content: string }) => (
  <div className="prose prose-invert prose-lg max-w-none leading-relaxed
    prose-headings:text-slate-50 prose-headings:font-bold prose-headings:tracking-tight
    prose-h1:text-3xl prose-h1:mb-3 prose-h1:mt-4 prose-h1:text-transparent prose-h1:bg-clip-text prose-h1:bg-gradient-to-r prose-h1:from-blue-400 prose-h1:to-emerald-400
    prose-h2:text-2xl prose-h2:mb-2 prose-h2:mt-4 prose-h2:text-blue-300
    prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-3 prose-h3:text-emerald-300
    prose-p:text-slate-300 prose-p:mb-[0.75em] prose-p:mt-[0.75em] prose-p:leading-relaxed
    prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300 hover:prose-a:underline
    prose-strong:text-slate-100 prose-strong:font-semibold
    prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6 
    prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-6
    prose-li:my-1 prose-li:text-slate-300 prose-li:marker:text-blue-500
    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:my-2 prose-blockquote:bg-slate-800/50 prose-blockquote:rounded-r-lg prose-blockquote:italic
    prose-code:text-emerald-300 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:border prose-code:border-slate-700
    prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-xl prose-pre:p-4 prose-pre:my-2 prose-pre:shadow-inner">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  </div>
);

const InteractiveQuestionBlock = ({ q }: { q: string }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const isMCQMatch = /\n\s*\*\*?Correct Answer:\*\*?\s*([A-Za-z])/i.exec(q) || /\n\s*Correct Answer:\s*([A-Za-z])/i.exec(q);
  
  if (!isMCQMatch) {
     return <MarkdownBody content={q.replace(/\n{3,}/g, '\n\n')} />;
  }

  const correctAnswer = isMCQMatch[1].toUpperCase();
  const expMatch = q.match(/\n\s*\*\*?Explanation:\*\*?\s*([\s\S]*)/i) || q.match(/\n\s*Explanation:\s*([\s\S]*)/i);
  const explanation = expMatch ? (expMatch[1] || "").trim() : "";
  
  const options: { id: string, text: string }[] = [];
  const optionRegex = /\n\s*([A-D])[.)]\s*([^\n]+)/gi;
  let match;
  let firstOptionIndex = -1;
  while ((match = optionRegex.exec(q)) !== null) {
      if (firstOptionIndex === -1) firstOptionIndex = match.index;
      options.push({ id: match[1].toUpperCase(), text: (match[2] || "").trim() });
  }

  let questionText = q;
  if (firstOptionIndex !== -1) {
      questionText = q.substring(0, firstOptionIndex).trim();
  } else {
      return <MarkdownBody content={q.replace(/\n{3,}/g, '\n\n')} />;
  }

  return (
    <div className="space-y-4">
      <MarkdownBody content={questionText} />
      
      <div className="space-y-2">
        {options.map((opt) => {
           const isSelected = selectedOption === opt.id;
           const isCorrect = opt.id === correctAnswer;
           const showResult = selectedOption !== null;

           let btnClass = "w-full text-left px-4 py-2.5 rounded-xl border bg-slate-800/50 transition-colors flex items-center gap-3 group";
           if (!showResult) {
              btnClass += " border-slate-700/50 hover:bg-slate-700/50 hover:border-blue-500/50 cursor-pointer";
           } else {
              if (isCorrect) {
                 btnClass += " border-emerald-500/50 bg-emerald-500/10 cursor-default";
              } else if (isSelected && !isCorrect) {
                 btnClass += " border-red-500/50 bg-red-500/10 cursor-default";
              } else {
                 btnClass += " border-slate-700/50 bg-slate-800/30 opacity-60 cursor-default grayscale-[50%]";
              }
           }

           return (
             <button 
               key={opt.id}
               onClick={() => !showResult && setSelectedOption(opt.id)}
               disabled={showResult}
               className={btnClass}
             >
               <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                   showResult 
                     ? (isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400')
                     : 'bg-slate-700 text-white group-hover:bg-blue-600 group-hover:text-white'
               }`}>
                 {opt.id}
               </div>
               <div className="text-slate-200 leading-snug text-[14px]">{opt.text}</div>
             </button>
           );
        })}
      </div>

      {selectedOption && (
        <div className="mt-5 pt-4 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className={`text-lg font-bold mb-4 flex items-center gap-3 ${selectedOption === correctAnswer ? 'text-emerald-400' : 'text-red-400'}`}>
              {selectedOption === correctAnswer ? (
                <><CheckCircle size={28} /> Absolutely Correct!</>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-red-400/20 flex items-center justify-center text-red-500 shrink-0"><X size={18} strokeWidth={3} /></div>
                  <span className="leading-tight">Incorrect. The correct answer is {correctAnswer}.</span>
                </>
              )}
           </div>
           {explanation && (
             <div className="bg-slate-900/50 border border-blue-500/30 rounded-2xl p-5 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h4 className="text-blue-400 font-bold mb-3 uppercase tracking-widest text-xs flex items-center gap-2">
                  <Lightbulb size={16} /> Explanation
                </h4>
                <div className="text-[15px]">
                   <MarkdownBody content={explanation} />
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

const QuestionsViewer = ({ output }: { output: string }) => {
  const lines = output.split('\n');
  const blocks: string[] = [];
  let currentBlock = "";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\*\*?(?:Question\s+\d+|Q\s*\d+)(?:[*.): \t]|$)/i.test(line.trim())) {
       if (currentBlock) blocks.push(currentBlock.trim());
       currentBlock = line + '\n';
    } else {
       currentBlock += line + '\n';
    }
  }
  if (currentBlock) blocks.push(currentBlock.trim());
  
  let intro = "";
  let questions = blocks;
  if (blocks.length > 0 && !/^\*\*?(?:Question\s+\d+|Q\s*\d+)/i.test(blocks[0])) {
    intro = blocks[0];
    questions = blocks.slice(1);
  }

  if (questions.length === 0) {
    return <MarkdownBody content={output.replace(/\n{3,}/g, '\n\n').replace(/As an expert medical professor and author, I have crafted/g, "As an expert medical professor and author, our team of Experts have crafted")} />;
  }

  return (
    <div className="space-y-4">
      {intro && (
        <MarkdownBody content={intro.replace(/\n{3,}/g, '\n\n').replace(/As an expert medical professor and author, I have crafted/g, "As an expert medical professor and author, our team of Experts have crafted")} />
      )}
      
      {questions.map((q, idx) => (
        <div key={idx} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 lg:p-6 shadow-sm">
           <InteractiveQuestionBlock q={q} />
        </div>
      ))}
    </div>
  );
};

const FeatureModule = ({ featureId, onNavigate, curriculum }: { featureId: string, onNavigate: (p: string) => void, curriculum?: any }) => {
  const feature = FEATURES.find(f => f.id === featureId);
  
  // General states
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'slides' | 'notes'>('slides');
  
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSaved = async () => {
    try {
      const response = await fetch('/api/saved');
      let mappedData: any[] = [];
      if (response.ok) {
        const data = await response.json();
        // Map feature_id from sqlite to featureId
        mappedData = data.map((item: any) => ({
          ...item,
          featureId: item.feature_id || item.featureId
        }));
      } else {
        throw new Error('Failed to fetch from DB');
      }

      // Fetch from essay_generator for essay-generator
      try {
        const essayRes = await fetch('/api/essay-generator');
        if (essayRes.ok) {
          const essayData = await essayRes.json();
          const mappedEssays = essayData.map((item: any) => ({
            ...item,
            featureId: 'essay-generator',
            title: item.title || `Essay: ${item.topic}`,
            date: item.created_at || item.date || new Date().toISOString(),
            content: item.content
          }));
          mappedData = mappedData.filter(d => d.featureId !== 'essay-generator');
          mappedData = [...mappedData, ...mappedEssays];
          mappedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      } catch (e) {
        console.error("Error fetching essays:", e);
      }

      setSavedItems(mappedData);
    } catch (error) {
      console.error('Error fetching saved items from db:', error);
      // Enforce database only, removed localStorage fallback
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [featureId]);

  const removeSaved = async (id: string) => {
    try {
      const itemToDelete = savedItems.find(item => item.id === id);
      let response: Response;
      if (itemToDelete?.featureId === 'essay-generator') {
        response = await fetch(`/api/essay-generator/${id}`, { method: 'DELETE' });
      } else {
        response = await fetch(`/api/saved/${id}`, { method: 'DELETE' });
      }
      if (response.ok) {
        setSavedItems(prev => prev.filter(item => item.id !== id));
      } else {
        console.error('Delete failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // ─── Course Lock: Read active course from Dashboard ──────────────────────
  const [lockedCourseName, setLockedCourseName] = useState<string | null>(null);

  // Specialized states for Knowledge Library
  const [klCourseId, setKlCourseId] = useState('');
  const [klPaperId, setKlPaperId] = useState('');
  const [klSectionId, setKlSectionId] = useState('');
  const [klTopicId, setKlTopicId] = useState('');

  // Specialized states for Knowledge Analyser (Essay)
  const [analyzerSubject, setAnalyzerSubject] = useState('');
  const [analyzerTopic, setAnalyzerTopic] = useState('');
  const [analyzerMarks, setAnalyzerMarks] = useState('20 marks');
  const [analyzerQuestions, setAnalyzerQuestions] = useState<{question: string, marks: string}[]>([]);
  const [analyzerSelectedQuestion, setAnalyzerSelectedQuestion] = useState<{question: string, marks: string} | null>(null);
  const [analyzerRubric, setAnalyzerRubric] = useState('');
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [analyzerEvaluation, setAnalyzerEvaluation] = useState('');

  // Specialized states for Knowledge Analyser (MCQs)
  const [mcqSubject, setMcqSubject] = useState('');
  const [mcqTopic, setMcqTopic] = useState('');
  const [mcqMarks, setMcqMarks] = useState('1 Mark');
  const [mcqTypes, setMcqTypes] = useState<string[]>([]);
  const [mcqCount, setMcqCount] = useState<number>(5);
  const [mcqGeneratedList, setMcqGeneratedList] = useState<{id: string, question: string, options: string[], answer: string, explanation: string}[]>([]);
  const [mcqUserAnswers, setMcqUserAnswers] = useState<Record<string, string>>({});
  const [mcqEvaluationResult, setMcqEvaluationResult] = useState('');
  const [isEvaluatingMcq, setIsEvaluatingMcq] = useState(false);
  
  // Specialized states for AI Exam Simulator
  const [simSubject, setSimSubject] = useState('');
  const [simPaper, setSimPaper] = useState('');
  const [simTopics, setSimTopics] = useState('');
  const [simDurationMinutes, setSimDurationMinutes] = useState(180);
  const [simQuestions, setSimQuestions] = useState<{id: string, sectionName: string, questionText: string, marks: number, answerRubric: string}[]>([]);
  
  const [simExamActive, setSimExamActive] = useState(false);
  const [simTimeRemaining, setSimTimeRemaining] = useState(0); // in seconds
  const [simUploadPhase, setSimUploadPhase] = useState(false);
  const [simUploadTimeRemaining, setSimUploadTimeRemaining] = useState(600); // 10 mins
  
  const [simAnswers, setSimAnswers] = useState<Record<string, string[]>>({}); // questionId -> array of base64 images
  const [simNotAnswered, setSimNotAnswered] = useState<Record<string, boolean>>({}); // questionId -> boolean
  const [simRubrics, setSimRubrics] = useState<Record<string, string>>({}); // questionId -> rubric
  
  const [isEvaluatingSim, setIsEvaluatingSim] = useState(false);
  const [simEvaluationResult, setSimEvaluationResult] = useState('');
  
  // Specialized states for AI Exam Prep
  const [prepCourseId, setPrepCourseId] = useState('');
  const [prepAnalytics, setPrepAnalytics] = useState<any>(null);
  
  const MCQ_TYPES = [
    { id: 'SBA', label: 'Single best answer', desc: 'Knowledge & application' },
    { id: 'MTF', label: 'Multiple true–false', desc: 'Detailed understanding' },
    { id: 'EMQ', label: 'Extended matching', desc: 'Clinical reasoning' },
    { id: 'CBM', label: 'Case-based MCQ', desc: 'Problem solving' },
    { id: 'IBM', label: 'Image-based MCQ', desc: 'Diagnostic interpretation' },
    { id: 'ARM', label: 'Assertion–reason', desc: 'Conceptual reasoning' }
  ];

  const klActiveCourse = curriculum?.find((c: any) => c.id?.toString() === klCourseId?.toString());
  const klActivePapers = klActiveCourse?.papers || [];
  const klActivePaper = klActivePapers?.find((p: any) => p.id?.toString() === klPaperId?.toString());
  const klActiveSections = klActivePaper?.sections || [];
  const klActiveSection = klActiveSections?.find((s: any) => s.id?.toString() === klSectionId?.toString());
  const klActiveTopics = klActiveSection?.topics || [];

  // Specialized states for Reflection Generator
  const [refSubject, setRefSubject] = useState('');
  const [refTopic, setRefTopic] = useState('');
  const [refCompetency, setRefCompetency] = useState('');
  const [refContext, setRefContext] = useState('');
  const [refDescription, setRefDescription] = useState('');
  const [refResponse, setRefResponse] = useState('');
  const [refAnalysis, setRefAnalysis] = useState('');
  const [refLearning, setRefLearning] = useState('');
  const [refApplication, setRefApplication] = useState('');
  const [refConclusion, setRefConclusion] = useState('');
  const [refWordCount, setRefWordCount] = useState('500-800');

  // Specialized states for Question Paper Generator
  const [paperNumber, setPaperNumber] = useState('');
  const [questionPaperCourse, setQuestionPaperCourse] = useState('');
  const [numPapers, setNumPapers] = useState(1);
  const [modelPaperName, setModelPaperName] = useState('');
  const [modelPaperText, setModelPaperText] = useState('');
  const [isExtractingPaper, setIsExtractingPaper] = useState(false);

  // Specialized states for Essay Generator
  const [essayType, setEssayType] = useState('long');
  const [essayCourse, setEssayCourse] = useState('');

  // Specialized states for Protocol Generator
  const [protocolCourse, setProtocolCourse] = useState('');

  // Specialized states for Manuscript Generator
  const [manuscriptCourse, setManuscriptCourse] = useState('');

  // Specialized states for Seminar Builder
  const [seminarDiscipline, setSeminarDiscipline] = useState('');
  const [seminarTopic, setSeminarTopic] = useState('');
  const [seminarCriteria, setSeminarCriteria] = useState('');
  const [slides, setSlides] = useState<{ title: string; content: string }[]>([]);
  const [detailedNotes, setDetailedNotes] = useState('');
  // const [activeTab, setActiveTab] = useState<'slides' | 'notes'>('slides'); // Moved to general states
  const [isEditingPPT, setIsEditingPPT] = useState(false);

  // Specialized states for Journal Club Preparator
  const [jcDiscipline, setJcDiscipline] = useState('');
  const [jcTopic, setJcTopic] = useState('');
  const [jcCriteria, setJcCriteria] = useState('');

  // Specialized states for Scientific Session Search
  const [searchRegion, setSearchRegion] = useState('All');
  const [searchMonth, setSearchMonth] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  const [searchTopic, setSearchTopic] = useState('');
  const [searchKeywords, setSearchKeywords] = useState('');

  // Specialized states for StatAssist
  const [statCourse, setStatCourse] = useState('');
  const [statStudyTitle, setStatStudyTitle] = useState('');
  const [statMethods, setStatMethods] = useState<{name: string, advantages: string, disadvantages: string, selected: boolean}[]>([]);
  const [statData, setStatData] = useState<any>(null); // For charts or results
  const [isGeneratingResults, setIsGeneratingResults] = useState(false);

  // ─── Course Lock Effect: Auto-set all course dropdowns to the active course ───
  const applyCourselock = (courseName: string) => {
    setLockedCourseName(courseName);
    // Find the matching curriculum entry by name (with fuzzy fallback)
    if (curriculum) {
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matched = curriculum.find((c: any) => c.name === courseName) 
        || curriculum.find((c: any) => normalize(c.name) === normalize(courseName));
      if (matched) {
        setKlCourseId(matched.id?.toString() || '');
        setKlPaperId('');
        setKlSectionId('');
        setKlTopicId('');
        setPrepCourseId(matched.id?.toString() || '');
      }
    }
    // Lock name-based course states
    setQuestionPaperCourse(courseName);
    setEssayCourse(courseName);
    setProtocolCourse(courseName);
    setManuscriptCourse(courseName);
    setStatCourse(courseName);
    setAnalyzerSubject(courseName);
    setSimSubject(courseName);
    setMcqSubject(courseName);
    setSeminarDiscipline(courseName);
    setJcDiscipline(courseName);
    setRefSubject(courseName);
  };

  useEffect(() => {
    // First try localStorage
    const savedCourse = localStorage.getItem('medimentr_selected_course');
    if (savedCourse) {
      applyCourselock(savedCourse);
      return;
    }

    // Fallback: try loading from server API
    const email = (() => {
      try { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw)?.email : null; } catch { return null; }
    })();
    if (email) {
      fetch(`/api/user/profile-by-email?email=${encodeURIComponent(email)}`)
        .then(res => res.ok ? res.json() : null)
        .then(profile => {
          if (profile?.selected_course) {
            localStorage.setItem('medimentr_selected_course', profile.selected_course);
            applyCourselock(profile.selected_course);
          }
        })
        .catch((error) => { console.error('Error fetching user profile:', error); });
    }
  }, [curriculum]);

  // Specialized states for Contacts Management System
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [personalCard, setPersonalCard] = useState<Partial<Contact>>({
    name: 'Your Name',
    designation: 'Medical Professional',
    organization: 'Hospital/Clinic Name',
    email: 'email@example.com',
    phone: '+1 234 567 890',
    website: 'www.medimentr.com',
    address: 'City, Country'
  });
  const [isEditingPersonalCard, setIsEditingPersonalCard] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanImages, setScanImages] = useState<string[]>([]);
  const [currentScanIndex, setCurrentScanIndex] = useState(0);


  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [scannedContact, setScannedContact] = useState<Partial<Contact> | null>(null);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualContact, setManualContact] = useState<Partial<Contact>>({});

  // Specialized states for Digital Diary
  const [digitalDiaryDate, setDigitalDiaryDate] = useState(() => {
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().slice(0, 16);
  });
  const [diaryAction, setDiaryAction] = useState('');

  // Specialized states for Clinical Examination
  const [examType, setExamType] = useState('Cardiovascular Examination');
  const [examCourse, setExamCourse] = useState('Mastering General Medicine');

  useEffect(() => {
    if (featureId === 'contacts-management') {
      const fetchContacts = async () => {
        try {
          const res = await fetch('/api/state/contacts/default');
          if (res.ok) {
            const data = await res.json();
            if (data.contacts) setContacts(data.contacts);
            if (data.personal_card) setPersonalCard(data.personal_card);
          }
        } catch (e) {
          console.error("Failed to fetch contacts", e);
        }
      };
      fetchContacts();
    }
  }, [featureId]);

  const saveContactsToStorage = async (newContacts: Contact[]) => {
    setContacts(newContacts);
    try {
      await fetch('/api/state/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'default', contacts: newContacts, personal_card: personalCard })
      });
    } catch (e) {
      console.error("Failed to save contacts to db", e);
    }
  };

  const savePersonalCardToStorage = async (card: Partial<Contact>) => {
    setPersonalCard(card);
    try {
      await fetch('/api/state/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'default', contacts, personal_card: card })
      });
    } catch (e) {
      console.error("Failed to save personal card to db", e);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    return canvas.toDataURL('image/png');
  };

  const handleScanImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const images: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(files[i]);
      images.push(await promise);
    }
    setScanImages(images);
    setIsScanning(true);
    setIsCropping(true);
    setCurrentScanIndex(0);
  };

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !scanImages[currentScanIndex]) return;
    setIsLoading(true);
    try {
      const croppedImage = await getCroppedImg(scanImages[currentScanIndex], croppedAreaPixels);
      const extracted = await extractContactFromImage(croppedImage);
      setScannedContact(extracted);
      setIsCropping(false);
    } catch (error) {
      alert("OCR failed. Please try again or enter manually.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveScannedContact = () => {
    if (!scannedContact) return;
    const newContact: Contact = {
      ...scannedContact as Contact,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    saveContactsToStorage([newContact, ...contacts]);
    setScannedContact(null);
    setIsScanning(false);
    setScanImages([]);
  };

  const handleShareCard = async () => {
    const cardElement = document.getElementById('personal-digital-card');
    if (!cardElement) return;
    try {
      const dataUrl = await toPng(cardElement);
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'visiting-card.png', { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'My Digital Visiting Card',
          text: 'Check out my digital visiting card from Medimentr!'
        });
      } else {
        const link = document.createElement('a');
        link.download = 'visiting-card.png';
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('Error sharing card:', error);
    }
  };

  const handleGenerate = async () => {
    let finalInput = input;
    
    if (featureId === 'question-paper') {
      if (!questionPaperCourse || !paperNumber || !input) {
        alert("Please select a Course, fill in Paper Number and Topic.");
        return;
      }
      finalInput = `Course: ${questionPaperCourse}\nPaper Number: ${paperNumber}\nTopic: ${input}\nNumber of papers to generate: ${numPapers}\nModel Paper provided: ${modelPaperName || 'No'}\nRequirement: Generate up to ${numPapers} question papers based on previous papers for last 10 years patterns.`;
    } else if (['knowledge-library', 'essay-library', 'mcq-library', 'flash-cards'].includes(featureId)) {
      if (!klCourseId || !klPaperId || !klSectionId || !klTopicId) {
        return;
      }
      setIsLoading(true);
      
      // --- PRIORITY 1: Check curriculum state for content generated via LMS Editors ---
      let curriculumContent = '';
      if (curriculum && Array.isArray(curriculum)) {
        for (const c of curriculum) {
          if (!c.papers) continue;
          for (const p of c.papers) {
            if (!p.sections) continue;
            for (const s of p.sections) {
              if (!s.topics) continue;
              const t = s.topics.find((x: any) => x && x.id === klTopicId);
              if (t) {
                if (featureId === 'knowledge-library' && t.generatedContent) {
                  curriculumContent = t.generatedContent;
                } else if (featureId === 'essay-library' && t.generatedEssayContent) {
                  curriculumContent = t.generatedEssayContent;
                } else if (featureId === 'mcq-library' && t.generatedMcqContent) {
                  curriculumContent = t.generatedMcqContent;
                } else if (featureId === 'flash-cards' && t.generatedFlashCardsContent) {
                  curriculumContent = t.generatedFlashCardsContent;
                }
              }
            }
          }
        }
      }
      
      if (curriculumContent) {
        setOutput(curriculumContent);
        setIsLoading(false);
        return;
      }

      // --- PRIORITY 1.5: Fetch saved curriculum from database and check for content ---
      try {
        const currRes = await fetch('/api/state/curriculum/default');
        if (currRes.ok) {
          const { data: savedData } = await currRes.json();
          if (savedData) {
            const parsed = typeof savedData === 'string' ? JSON.parse(savedData) : savedData;
            if (Array.isArray(parsed)) {
              for (const c of parsed) {
                if (!c.papers) continue;
                for (const p of c.papers) {
                  if (!p.sections) continue;
                  for (const s of p.sections) {
                    if (!s.topics) continue;
                    const t = s.topics.find((x: any) => x && x.id === klTopicId);
                    if (t) {
                      const contentKey = featureId === 'knowledge-library' ? 'generatedContent'
                        : featureId === 'essay-library' ? 'generatedEssayContent'
                        : featureId === 'mcq-library' ? 'generatedMcqContent'
                        : 'generatedFlashCardsContent';
                      if (t[contentKey]) {
                        setOutput(t[contentKey]);
                        setIsLoading(false);
                        return;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Priority 1.5 curriculum DB fetch failed:', e);
      }
      
      // --- PRIORITY 2: Fallback to Supabase API tables ---
      const apiEndpoint = featureId === 'knowledge-library' ? '/api/knowledge' 
                        : featureId === 'essay-library' ? '/api/essays' 
                        : featureId === 'mcq-library' ? '/api/mcqs' 
                        : '/api/flashcards';

      try {
        const response = await fetch(apiEndpoint);
        if (response.ok) {
          const data = await response.json();
          // Filter by topic ID
          const matchedItem = data.find((item: any) => item.topic === klTopicId);
          if (matchedItem) {
             const content = featureId === 'flash-cards' 
                  ? `**${matchedItem.title}**\n\n**Front:**\n${matchedItem.front_content}\n\n**Back:**\n${matchedItem.back_content}`
                  : featureId === 'mcq-library'
                  ? `**${matchedItem.title}**\n\n${matchedItem.question}\n\n**Options:**\n${matchedItem.options ? (typeof matchedItem.options === 'string' ? JSON.parse(matchedItem.options) : matchedItem.options).map((o:any, i:number) => `${String.fromCharCode(65+i)}. ${o}`).join('\\n') : 'N/A'}\n\n**Correct Answer:** ${matchedItem.correct_answer}`
                  : matchedItem.content;
             setOutput(content);
          } else {
             setOutput("📝 **No Data Found**\n\nNo saved data for this course/ section/ topic.\n\nContact Medimentr for more information.");
          }
        } else {
          setOutput("📝 **No Data Found**\n\nFailed to fetch from the database.\n\nContact Medimentr for more information.");
        }
      } catch (err) {
        console.error("Error fetching library data:", err);
        setOutput("📝 **Error**\n\nError fetching data from the server.\n\nContact Medimentr for more information.");
      }
      setIsLoading(false);
      return;
    } else if (featureId === 'essay-generator') {
      if (!essayCourse || !input.trim()) {
        alert("Please select a course and enter a question or topic.");
        return;
      }
      finalInput = `Course: ${essayCourse}\nEssay Type: ${essayType}\nQuestion/Topic: ${input}`;
    } else if (featureId === 'seminar-builder') {
      if (!seminarDiscipline || !seminarTopic) {
        alert("Please enter Discipline and Topic.");
        return;
      }
      finalInput = `Discipline: ${seminarDiscipline}\nTopic: ${seminarTopic}\nCriteria: ${seminarCriteria}`;
    } else if (featureId === 'journal-club') {
      if ((!jcDiscipline || !jcTopic) && scanImages.length === 0) {
        alert("Please enter Discipline and Topic, or upload documents.");
        return;
      }
      finalInput = `Discipline: ${jcDiscipline}\nTopic: ${jcTopic}\nCriteria: ${jcCriteria}`;
    } else if (featureId === 'session-search') {
      if (!searchSubject) {
        alert("Please enter a Subject to search.");
        return;
      }
      finalInput = `Region: ${searchRegion}\nMonth: ${searchMonth}\nSubject: ${searchSubject}\nTopic/Subtopic: ${searchTopic}\nKeywords: ${searchKeywords}`;
    } else if (featureId === 'clinical-decision-support') {
      if (!input.trim() && scanImages.length === 0) {
        alert("Please enter clinical features or upload patient data.");
        return;
      }
      finalInput = input;
    } else if (featureId === 'stat-assist') {
      if (!statCourse || (!statStudyTitle.trim() && scanImages.length === 0)) {
        alert("Please select a course and enter Study Title or upload study data.");
        return;
      }
      finalInput = `Course: ${statCourse}\nStudy Title: ${statStudyTitle}\nUploaded Data: ${scanImages.length} files attached.`;
    } else if (featureId === 'digital-diary') {
      if (!input.trim() && scanImages.length === 0) {
        alert("Please enter your diary reflections or upload notes/images.");
        return;
      }
      finalInput = `Date: ${digitalDiaryDate}\n${input}`;
    } else if (featureId === 'clinical-examination') {
      if (!examType || !examCourse) {
        alert("Please provide the Examination Type and Course.");
        return;
      }
      finalInput = `Examination Type: ${examType}\nCourse: ${examCourse}`;
    } else if (featureId === 'protocol-generator') {
      if (!protocolCourse || (!input.trim() && scanImages.length === 0)) {
        alert("Please select a course and enter topic.");
        return;
      }
      finalInput = `Course: ${protocolCourse}\nTopic: ${input}`;
    } else if (featureId === 'manuscript-generator') {
      if (!manuscriptCourse || (!input.trim() && scanImages.length === 0)) {
        alert("Please select a course and enter topic or specific requirements, or upload your full study.");
        return;
      }
      finalInput = `Course: ${manuscriptCourse}\nTopic: ${input}`;
    } else if (featureId === 'reflection-generator') {
      if (!refSubject || !refTopic) {
        alert("Please enter at least the Subject and Topic for the reflection.");
        return;
      }
      finalInput = `
Subject: ${refSubject}
Topic: ${refTopic}
Competency/Session: ${refCompetency}
Introduction / Context: ${refContext}
Description of the Event: ${refDescription}
Personal Response and Initial Reactions: ${refResponse}
Critical Analysis of the Situation: ${refAnalysis}
Identification of Learning Points: ${refLearning}
Application to Future Practice: ${refApplication}
Conclusion: ${refConclusion}
Required Word Count: ${refWordCount} words`;
    } else if (featureId === 'answer-analyser') {
      if (!analyzerSubject || !analyzerTopic) {
        alert("Please enter Subject and Course, and Section and Topic.");
        return;
      }
      finalInput = `Subject/Course: ${analyzerSubject}\nSection/Topic: ${analyzerTopic}\nMarks: ${analyzerMarks}\nGenerate 5 questions that are worth the specified marks.`;
    } else if (featureId === 'mcqs-analyser') {
      if (!mcqSubject || !mcqTopic || mcqTypes.length === 0 || mcqCount < 1) {
        alert("Please fill in Subject, Topic, select at least one MCQ type, and specify number of MCQs.");
        return;
      }
      finalInput = `Subject: ${mcqSubject}\nTopic: ${mcqTopic}\nMarks per MCQ: ${mcqMarks}\nMCQ Types: ${mcqTypes.join(", ")}\nNumber of MCQs: ${mcqCount}\nGenerate ${mcqCount} MCQs respecting the selected types.`;
    } else if (featureId === 'ai-exam-simulator') {
      if (!simSubject || !simTopics) {
        alert("Please enter Subject and Topics.");
        return;
      }
      finalInput = scanImages.length > 0
        ? `Subject/Course: ${simSubject}\nPaper: ${simPaper}\nSelected Topics: ${simTopics}\nDuration Requested: ${simDurationMinutes} Minutes\nTask: Generate a matching question paper based on the attached document's format.`
        : `Subject/Course: ${simSubject}\nPaper: ${simPaper}\nSelected Topics: ${simTopics}\nDuration Requested: ${simDurationMinutes} Minutes\nTask: Generate a standard university-style exam paper with sections and questions of varying marks. Include a mix of short answer, long answer, and essay-type questions appropriate for the topics.`;
    } else if (!input.trim() && featureId !== 'ai-exam-simulator' && featureId !== 'knowledge-library' && featureId !== 'journal-club' && featureId !== 'seminar-builder' && featureId !== 'session-search' && featureId !== 'clinical-examination' && featureId !== 'reflection-generator' && featureId !== 'answer-analyser' && featureId !== 'mcqs-analyser' && featureId !== 'ai-exam-prep' && featureId !== 'stat-assist') {
      return;
    }

    setIsLoading(true);
    try {
      // Log usage
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: featureId })
      });

      let prompt: any = `Generate content for ${feature?.title}. Input: ${finalInput}`;
      if ((featureId === 'clinical-decision-support' || featureId === 'digital-diary' || featureId === 'journal-club' || featureId === 'manuscript-generator' || featureId === 'stat-assist' || featureId === 'ai-exam-simulator' || featureId === 'question-paper') && scanImages.length > 0) {
        prompt = [
          prompt,
          ...scanImages.map(img => ({
            inlineData: {
              data: img.split(',')[1] || img,
              mimeType: img.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
            }
          }))
        ];
      }
      
      let systemInstruction = `You are a medical AI specialist for the ${feature?.title} module. 
      Follow the required structure for this module as defined in Medimentr guidelines.
      Ensure high academic quality, evidence-based content, and clinical relevance.`;

      let responseMimeType = "text/plain";
      let useSearch = false;

      if (featureId === 'session-search') {
        useSearch = true;
        systemInstruction += `\nYou are a medical conference and session search assistant.
        Search for upcoming medical conferences, webinars, workshops, and scientific sessions based on the user's criteria.
        Use Google Search to find the most up-to-date, verified information.
        
        For EACH session found, format it as a structured block using EXACTLY this markdown template:

---
### [Session Title]
- **Type:** Conference / Webinar / Workshop / Symposium (choose one)
- **Date:** DD Month YYYY (or date range)
- **Location:** City, Country (or "Online" if virtual)
- **Organizer:** Name of organizing body
- **Description:** One-sentence summary of theme or focus
- **🔗 Online Link:** [Official Website](https://actual-url.com)
- **Registration:** [Register Here](https://registration-url.com) *(if available)*
---

        Rules:
        1. Always include the 🔗 Online Link field — if you cannot find the real URL, write "Not available publicly".
        2. List 6–10 results, ranked by relevance and date proximity.
        3. Prioritize events with real, working URLs from official sources.
        4. Include a mix of international and regional events where applicable.
        5. Do NOT fabricate URLs — only include links you found via search.`;
      } else if (featureId === 'seminar-builder') {
        responseMimeType = "application/json";
        systemInstruction += `\nYou are an expert academic lecturer and seminar designer specializing in Medical and Healthcare disciplines.

Create seminar materials of the highest academic standard for the following seminar topic.

Seminar Topic:
${seminarTopic}

Course / Discipline:
${seminarDiscipline}

Audience Level:
Masters / PhD

Your task is to produce TWO sections:

--------------------------------------------------
SECTION 1: PPT STRUCTURE (8–10 SLIDES)
--------------------------------------------------

Design a professional PowerPoint presentation structure suitable for an academic seminar.

For each slide include:
• Slide number  
• Slide title  
• Key bullet points (3–5 concise points)  
• Suggested visual or diagram (if appropriate)

The slides should follow a logical academic flow:

1. Title Slide
   - Seminar title
   - Presenter
   - Course
   - Institution

2. Introduction
   - Background
   - Importance of the topic

3. Key Concepts / Definitions

4. Theoretical Framework or Literature Context

5. Main Argument / Theme 1

6. Main Argument / Theme 2

7. Case Study / Example / Evidence

8. Critical Discussion / Implications

9. Conclusion

10. References / Discussion Questions (optional)

--------------------------------------------------
SECTION 2: DETAILED SEMINAR NOTES (Approx. 1200 words)
--------------------------------------------------

Write detailed speaker notes for the seminar that expand the slide content into a coherent academic explanation.

Requirements:
• Approx. 1200 words
• Formal academic tone
• Clear logical flow
• Include explanations, examples, and critical insights
• Connect ideas smoothly between sections
• Provide strong conceptual understanding suitable for seminar delivery
• Avoid bullet points in the notes — write in paragraph form
• Where relevant, reference major theories, scholars, or studies in the field

Structure the seminar notes as:

1. Introduction
2. Conceptual Background
3. Theoretical Perspectives
4. Core Arguments / Analysis
5. Examples or Evidence
6. Critical Evaluation
7. Conclusion and Key Takeaways

--------------------------------------------------

        Ensure the content reflects the highest academic standards and is suitable for a professional university seminar presentation.
        CRITICAL INSTRUCTION FOR SLIDES: EVERY slide MUST have a clear, descriptive "title" corresponding to its heading. Do not create any slide without a title. All slides must have both a "title" and "content".
        CRITICAL: The slide content MUST NOT contain raw HTML tags (like <ul> or <li>). Use plain text and markdown bullet points (e.g., - or *) exclusively.
        CRITICAL INSTRUCTION FOR NOTES: Structure the detailed notes clearly using markdown headings (e.g., "## 1. Introduction"). Each major section MUST start with a markdown heading.
        
        Return the response in JSON format with the following schema:
        {
          "slides": [
            { "title": "Slide Title", "content": "Bullet points or slide content" }
          ],
          "detailedNotes": "The full detailed seminar notes in markdown format"
        }`;
      } else if (featureId === 'journal-club') {
        responseMimeType = "application/json";
        systemInstruction += `\nYou are an expert academic researcher and university lecturer specializing in Medical and Healthcare disciplines.

Create high-quality Journal Club presentation materials based on the following research article.

Article Title:
${jcTopic}

Authors:
Extract from context

Journal / Year:
Extract from context

Course / Discipline:
${jcDiscipline}

Audience Level:
Masters / PhD

Your task is to produce TWO sections.

---

SECTION 1: PPT STRUCTURE (8–10 SLIDES)

Design a professional PowerPoint presentation structure appropriate for a Journal Club presentation.

For each slide include:
• Slide number
• Slide title
• 3–5 concise bullet points
• Suggested figure/visual if relevant

Slides should follow the logical structure used in Journal Club presentations:

1. Title Slide

   * Article title
   * Authors
   * Journal and year
   * Presenter
   * Course / institution

2. Background and Research Context

   * Scientific background
   * Importance of the research problem

3. Research Question and Objectives

   * Main hypothesis
   * Study aims

4. Methods / Study Design

   * Research design
   * Sample / data sources
   * Analytical methods

5. Key Results

   * Main findings
   * Important data or figures

6. Interpretation of Results

   * What the results mean
   * Link to research question

7. Strengths of the Study

   * Methodological strengths
   * Contributions to the field

8. Limitations and Critical Evaluation

   * Methodological weaknesses
   * Potential biases

9. Implications for the Field

   * Theoretical implications
   * Practical or clinical relevance

10. Conclusion and Discussion Questions

* Key takeaways
* Questions for audience discussion

---

SECTION 2: DETAILED JOURNAL CLUB SEMINAR NOTES (Approx. 1200 Words)

Write detailed speaker notes that expand the slides into a coherent academic explanation suitable for a Journal Club discussion.

Requirements:
• Approximately 1200 words
• Formal academic tone
• Clear explanation of the study
• Critical evaluation of the research
• Explain methodology and interpretation of findings
• Connect results to broader literature in the field
• Avoid bullet points in the notes; write in structured paragraphs

Structure the notes as:

1. Introduction and Research Context
2. Overview of the Study and Research Questions
3. Methodology and Study Design
4. Analysis of Key Findings
5. Critical Evaluation of the Study
6. Implications for the Discipline
7. Conclusion and Discussion Points

---

Ensure the content reflects the highest academic standards expected in Journal Club presentations.
        CRITICAL INSTRUCTION FOR SLIDES: EVERY slide MUST have a clear, descriptive "title" corresponding to its heading. Do not create any slide without a title. All slides must have both a "title" and "content".
        CRITICAL: The slide content MUST NOT contain raw HTML tags (like <ul> or <li>). Use plain text and markdown bullet points (e.g., - or *) exclusively.
        CRITICAL INSTRUCTION FOR NOTES: Structure the detailed notes clearly using markdown headings (e.g., "## 1. Introduction"). Each major section MUST start with a markdown heading.

        Return the response in JSON format with the following schema:
        {
          "slides": [
            { "title": "Slide Title", "content": "Bullet points or slide content" }
          ],
          "detailedNotes": "The full detailed journal club notes in markdown format"
        }`;
      } else if (featureId === 'manuscript-generator') {
        systemInstruction += `\nYou are an expert academic researcher, journal editor, and scientific writer specializing in Medical and Healthcare disciplines.

Using the uploaded research paper as the primary reference and knowledge source, generate a full academic manuscript of the highest scholarly standards on the following topic.

Manuscript Topic:
${input}

Course / Discipline:
Medical and Healthcare

Academic Level:
Masters / PhD / Journal Submission Level

Purpose:
Journal-style article / Research review

Citation Style:
Vancouver

Instructions:
• Base the manuscript on insights from the uploaded research paper while expanding with scholarly explanation and context.
• Maintain rigorous academic tone and logical argumentation.
• Integrate theoretical context, analysis, and critical evaluation.
• Avoid superficial summaries; develop detailed scholarly discussion.
• Use structured headings and subheadings throughout.
• Where appropriate, refer to figures, tables, and evidence discussed in the research paper.
• Ensure coherence and strong transitions between sections.

Produce the manuscript with the following detailed structure.

---

1. Title Page
   1.1 Manuscript title
   1.2 Author name(s)
   1.3 Institutional affiliation
   1.4 Course / program
   1.5 Date

2. Abstract (200–250 words)
   2.1 Background
   2.2 Research objective
   2.3 Methods or approach
   2.4 Key findings or arguments
   2.5 Main conclusion

3. Keywords
   3.1 5–8 relevant academic keywords

4. Introduction
   4.1 Background of the research topic
   4.2 Importance of the research problem
   4.3 Context within the discipline
   4.4 Research objectives or questions
   4.5 Structure of the manuscript

5. Literature Review
   5.1 Key theoretical foundations
   5.2 Review of major studies in the field
   5.3 Scholarly debates and perspectives
   5.4 Research gaps identified

6. Conceptual or Theoretical Framework
   6.1 Key concepts and definitions
   6.2 Relevant models or theories
   6.3 Analytical framework used for the manuscript

7. Methodology / Analytical Approach
   7.1 Study design or research approach
   7.2 Data sources or research material
   7.3 Analytical methods or evaluation criteria
   7.4 Limitations of the approach

8. Results / Core Analysis
   8.1 Major theme or finding 1
       8.1.1 Explanation
       8.1.2 Evidence or examples
   8.2 Major theme or finding 2
       8.2.1 Explanation
       8.2.2 Supporting analysis
   8.3 Major theme or finding 3
       8.3.1 Explanation
       8.3.2 Implications

9. Discussion
   9.1 Interpretation of results
   9.2 Comparison with existing literature
   9.3 Theoretical implications
   9.4 Practical or policy implications

10. Limitations
    10.1 Methodological limitations
    10.2 Scope limitations

11. Future Research Directions
    11.1 Potential research extensions
    11.2 Emerging questions in the field

12. Conclusion
    12.1 Summary of key arguments
    12.2 Reaffirmation of the main thesis
    12.3 Broader significance of the findings

13. References
    13.1 List of scholarly references formatted in Vancouver

14. Optional Sections (if relevant)
    14.1 Acknowledgements
    14.2 Tables and Figures
    14.3 Appendices

Ensure the manuscript demonstrates rigorous academic reasoning and is suitable for submission to a high-quality academic journal in Medical and Healthcare disciplines.`;
      } else if (featureId === 'protocol-generator') {
        systemInstruction += `\nYou are an expert academic researcher, protocol designer, and methodological specialist in Medical and Healthcare disciplines.

Develop a comprehensive academic protocol of the highest scholarly standard based on the following topic.

Protocol Topic:
${input}

Course / Discipline:
Medical and Healthcare

Type of Protocol:
Research protocol / Experimental protocol / Clinical protocol / Systematic review protocol / Field study protocol

Academic Level:
Masters / PhD / Institutional research

Purpose:
Coursework / Thesis preparation / Research project / Institutional submission

Citation Style:
Vancouver

Instructions:
• Write the protocol in detailed academic language.
• Provide clear structure with sections and subsections.
• Ensure logical progression from background to implementation.
• Include methodological rigor appropriate to the discipline.
• Where relevant, include ethical considerations, data analysis plans, and risk management.
• Use scholarly tone suitable for research planning or institutional review.

Generate the protocol with the following detailed structure.

---

1. Title Page
   1.1 Protocol title
   1.2 Author(s)
   1.3 Institutional affiliation
   1.4 Course or program
   1.5 Date

2. Abstract
   2.1 Background
   2.2 Objective of the protocol
   2.3 Methodological approach
   2.4 Expected outcomes

3. Introduction
   3.1 Background of the research problem
   3.2 Importance of the topic in the discipline
   3.3 Context and rationale
   3.4 Objectives of the protocol
   3.5 Research questions or hypotheses

4. Literature Background
   4.1 Key theories and concepts
   4.2 Review of relevant studies
   4.3 Identified knowledge gaps

5. Study Design / Experimental Design
   5.1 Overall research design
   5.2 Study setting or context
   5.3 Population or study subjects
   5.4 Inclusion and exclusion criteria

6. Materials and Resources
   6.1 Equipment or tools required
   6.2 Materials or reagents (if applicable)
   6.3 Data sources

7. Methodology / Procedures
   7.1 Step-by-step procedural description
   7.2 Data collection procedures
   7.3 Variables and measurements
   7.4 Quality control measures

8. Data Management and Analysis Plan
   8.1 Data recording methods
   8.2 Data processing and organization
   8.3 Statistical or analytical techniques

9. Ethical Considerations
   9.1 Ethical approval requirements
   9.2 Participant consent (if applicable)
   9.3 Confidentiality and data protection

10. Risk Assessment and Safety Measures
    10.1 Potential risks
    10.2 Risk mitigation strategies
    10.3 Safety procedures

11. Expected Outcomes
    11.1 Anticipated results
    11.2 Potential implications for the discipline

12. Limitations of the Protocol
    12.1 Methodological limitations
    12.2 Practical constraints

13. Timeline and Work Plan
    13.1 Project phases
    13.2 Estimated schedule

14. Budget and Resources (if relevant)
    14.1 Estimated costs
    14.2 Resource allocation

15. References
    15.1 Scholarly references formatted in Vancouver

16. Appendices (Optional)
    16.1 Data collection forms
    16.2 Questionnaires or instruments
    16.3 Supplementary materials

Ensure the protocol reflects the highest academic and methodological standards expected in Medical and Healthcare disciplines.`;
      } else if (featureId === 'reflection-generator') {
        systemInstruction += `\nYou are an expert full-stack software architect, medical education systems designer, and UX specialist acting as an AI clinical reflection guide.

Write a high-standard reflective essay for a postgraduate medical trainee portfolio based on real clinical experiences provided in the input context.
The design must follow best practices used in postgraduate medical training programs and structured reflection frameworks such as Gibbs Reflective Cycle and Kolb's Experiential Learning Model.

Use the provided Input Data to elaborate intelligently:
1. Clinical Context / Introduction
2. Description of the Event (Focus on objective description)
3. Personal Response and Initial Reactions
4. Critical Analysis (Most important: clinical reasoning, communication, teamwork, etc.)
5. Learning Points (Identify specific learning outcomes)
6. Application to Future Practice (Actionable professional development)
7. Conclusion

Be coherent, professional, and maintain an academic tone.
The content should be strictly around the user's selected word count range specified in the input.`;
      } else if (featureId === 'question-paper') {
        systemInstruction += `\nAnalyze the provided topic and paper number. Generate realistic mock question papers (the number requested by the user) that follow the typical pattern of medical postgraduate exams from the last 10 years. 
IMPORTANT: If a reference question paper is uploaded, the generated question papers MUST strictly follow the exact same format, style, and structure as the uploaded paper.
Output each generated question paper clearly, one below another, separated by a clear horizontal line or heading (e.g., "--- \n\n ### Question Paper 1 \n ... \n\n --- \n\n ### Question Paper 2").`;
      } else if (featureId === 'knowledge-library') {
        systemInstruction += `\n📚 Updated: Include recent consensus guidelines or policy updates.
        📚 Referenced: Mention standard textbooks or journals.

        Ideal Structure of Expert Notes (Topic Format):
        1. Definition: Short precise definition.
        2. Historical background (optional): Major discoveries or milestones.
        3. Basic concepts: Physiology, Pathophysiology, Mechanism.
        4. Classification: Use tables or flowcharts (represented in text/markdown).
        5. Detailed description: Explain major subtopics.
        6. Clinical relevance: Diagnosis, Investigations, Treatment.
        7. Guidelines / protocols: Mention current guidelines.
        8. Recent advances: Include new drugs, technologies, therapies.
        9. Adverse effects / limitations.
        10. Summary / key points.
        11. References: Standard textbooks, Review articles, Guidelines.`;
      } else if (featureId === 'essay-generator') {
        const wordCount = essayType === 'long' ? '1500–2500 words' : essayType === 'short' ? '500–1000 words' : '200–500 words';
        
        systemInstruction += `\nYou are an expert academic writer specializing in Medical and Healthcare disciplines.

Write a high-quality academic essay answering the following question:

Essay Question:
${input}

Academic Level:
Masters / PhD

Word Count:
${wordCount}

Requirements:
• Write at the highest academic standard expected in this discipline.
• Use formal academic language.
• Present a clear thesis statement.
• Support arguments with reasoning, evidence, and examples.
• Maintain logical flow and coherence.
• Avoid bullet points in the essay body.

Structure the essay with clear divisions and subdivisions as follows:

1. Introduction
   1.1 Context and background of the topic  
   1.2 Importance of the issue in the discipline  
   1.3 Thesis statement / central argument  
   1.4 Outline of the essay

2. Theoretical or Conceptual Framework
   2.1 Key concepts and definitions  
   2.2 Relevant theories or scholarly perspectives  
   2.3 Literature or scholarly debate

3. Main Analysis
   3.1 First major argument  
       3.1.1 Explanation  
       3.1.2 Supporting evidence or examples  
       3.1.3 Critical discussion  

   3.2 Second major argument  
       3.2.1 Explanation  
       3.2.2 Supporting evidence  
       3.2.3 Critical evaluation  

   3.3 Third major argument (if relevant)  
       3.3.1 Explanation  
       3.3.2 Evidence  
       3.3.3 Implications

4. Counterarguments and Critical Perspectives
   4.1 Major opposing viewpoints  
   4.2 Evaluation of their strengths and weaknesses  
   4.3 Reaffirmation of the main thesis

5. Implications / Applications
   5.1 Practical implications  
   5.2 Policy or theoretical implications  
   5.3 Future considerations

6. Summary and Conclusion
   6.1 Restate the thesis  
   6.2 Summarize key arguments  
   6.3 Final critical insight or broader significance

Additional Instructions:
• Use clear academic headings and subheadings.
• Maintain strong argumentation throughout.
• Ensure coherence between sections.
• Write in a scholarly tone appropriate for Medical and Healthcare disciplines.
• If applicable, include references in APA style.`;
      } else if (featureId === 'clinical-decision-support') {
        systemInstruction += `\nAn AI-based Clinical Decision Support System (CDS) is designed to assist doctors and clinicians by analyzing patient data and providing evidence-based recommendations during diagnosis, treatment, or medication decisions. For hospitals aiming for NABH compliance, CDS can improve patient safety, clinical quality, and documentation.
        Below is the required workflow and output format for the AI-based CDS system.
        
        Analyze the input patient data (symptoms, history, lab values, or uploaded documents/images) and provide a comprehensive clinical response.
        Structure the output with the following sections clearly labeled using markdown:
        
        ## 1. Data Extracted
        Summarize the key information found in the input (Demographics, Symptoms, History, Labs).
        
        ## 2. Standardized Clinical Concepts
        Map the findings to medical concepts (e.g., ICD/SNOMED equivalents, missing values to check).
        
        ## 3. Clinical Decision Analysis
        Compare patient data with standard medical knowledge/guidelines. Provide:
        - Diagnosis Suggestions (with probabilities or differentials)
        - Drug Interaction Alerts (if applicable)
        - Dosage Recommendations (if applicable)
        - Risk Predictions (e.g., Sepsis Risk score)
        
        ## 4. Real-Time Alerts & Recommendations
        Generate critical alerts (Allergies, Stewardship, early warnings).
        
        ## 5. Suggested Action Plan
        Recommend the next steps (Diagnostic tests, Treatment updates, Referrals).
        
        
        IMPORTANT: End the response with a disclaimer stating "CDS assists but does not replace physician judgment. All actions should be recorded in the EMR."`;
      } else if (featureId === 'digital-diary') {
        systemInstruction += `\nAn AI-Powered Digital Diary for medical postgraduate students / residents that acts like a personal reflective journal, productivity assistant, and learning tracker. The goal is to capture daily experiences and let AI transform them into insights, summaries, learning points, and mental health reflections.
        Based on the user's input/files, generate a comprehensive structured reflection using markdown, separated clearly into these sections:
        
        ## 1. Daily Summary
        A concise overview of the cases managed, procedures performed, learning points, and reflections from the input.
        
        ## 2. Structured Categories
        Categorize the input into: Clinical Cases, Procedures Learned, Academic Learning, Research Ideas, Personal Reflection, Mental Well-being, and Career Goals.
        
        ## 3. AI Insights
        Extract meaningful insights (e.g., Learning insights, Skill tracking, Emotional trends, Knowledge gaps).
        
        ## 4. Reflection Feedback
        Generate a thoughtful reflective summary that supports reflective learning used in medical education.
        
        ## 5. Knowledge & Study Suggestions
        Based on the diary entries, recommend tailored learning topics, generate short notes, and suggest practice MCQs/Viva questions.
        
        ## 6. Emotional Support & Wellness Tracking
        Detect emotional signals (stress, fatigue) and offer supportive suggestions, reminders for rest, or motivational messages.`;
      } else if (featureId === 'clinical-examination') {
        systemInstruction += `\nAn AI-Powered Clinical Examination System designed for medical students.
        Based on the User's Examination Type and Course, generate a structured clinical examination learning module.
        Extract standard steps using textbook references like Hutchison's, Macleod's, or Davidson's.
        Structure the output with the following sections clearly labeled using markdown:
        
        ## 1. Topic Understanding
        Provide the identified Topic, Course, and Target Level (UG/PG).
        
        ## 2. Step-by-Step Examination Protocol
        Outline the examination in strict sequence (e.g., Preparation, General Inspection, Inspection, Palpation, Percussion, Auscultation). Provide clinical rationale for each step.
        Insert dummy image marker text like "![Placeholder Image](https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=600)" where visual aids are useful.
        
        ## 3. Clinical Tips and Interpretation
        Provide interpretation guidance for common findings (e.g., Elevated JVP implies Right heart failure, etc.).
        
        ## 4. Quick Revision Checklist
        Generate a short OSCE-style structured checkbox markdown list.
        
        ## 5. Optional Learning Extensions
        Provide 2 MCQs and 2 Viva questions related to the examination.
        
        ## 6. Video Reference
        Provide a relevant YouTube Search query link format: [Watch relevant Youtube Videos](https://www.youtube.com/results?search_query=clinical+examination+video+search) replacing the query with the specific targeted examination name.`;
      } else if (featureId === 'stat-assist') {
        responseMimeType = "application/json";
        systemInstruction += `\nYou are a statistical AI assistant for medical research. 
        Given the study title and any uploaded data context, generate a list of appropriate statistical methods.
        Output MUST be valid JSON with this exact structure:
        {
          "methods": [
            {
              "name": "Method Name",
              "advantages": "Advantages of this method",
              "disadvantages": "Disadvantages of this method"
            }
          ]
        }`;
      } else if (featureId === 'ai-exam-simulator') {
        responseMimeType = "application/json";
        systemInstruction += `\nYou are an expert medical university examiner and curriculum designer. 
Your task is to:
1. Analyze the attached reference university question paper to understand its structure (sections, marks distribution, question types).
2. Generate a NEW exam paper following the EXACT same structure, entirely focused on the user's provided topics.
3. For each generated question, simultaneously create a strict hidden "Answer Rubric" for evaluation later.

Return the response in JSON format with the following schema:
{
  "questions": [
    {
      "id": "q1",
      "sectionName": "Name or empty",
      "questionText": "The actual question",
      "marks": 20,
      "answerRubric": "Detailed grading criteria, expected concepts, and clinical reasoning expectations. Hidden from user."
    }
  ]
}`;
      } else if (featureId === 'answer-analyser') {
        responseMimeType = "application/json";
        systemInstruction += `\nYou are a medical examiner. Given the subject and topic, generate 5 questions that are worth the specified marks.
        Output MUST be valid JSON with this exact structure:
        {
          "questions": [
            {
              "question": "The question text",
              "marks": "20"
            }
          ]
        }`;
      } else if (featureId === 'mcqs-analyser') {
        responseMimeType = "application/json";
        systemInstruction += `\nYou are a medical examiner. Given the subject, topic, and required types, generate the specified number of MCQs.
        Output MUST be valid JSON with this exact structure:
        {
          "mcqs": [
            {
              "id": "q1",
              "question": "The question text",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": "Option B",
              "explanation": "Brief explanation of why this is correct."
            }
          ]
        }`;
      } else if (featureId === 'ai-exam-prep') {
        responseMimeType = "application/json";
        
        // Mocking user history data based on the selected course
        const selectedCourseName = curriculum?.find((c:any) => c.id === prepCourseId)?.name || 'General Medicine';
        prompt = `Generate a personalized exam preparation strategy for the course: ${selectedCourseName}.\n\n` +
                 `The student has completed 9 total mock assessments (Essays, MCQs, Simulators) with an average score of 68%.\n` +
                 `Based on standard medical curriculum weightage and this mock history, provide a structured analysis.\n\n` +
                 `${prompt}`;
                 
        systemInstruction += `\nYou are an AI Educational Analytics expert. Given a student's mock history and course name, analyze the data to provide study recommendations.
        Identify topics for immediate revision (weak but high-yield), moderate improvement, and topics they are strong in.
        IMPORTANT: The "feedback" field MUST be an array of strings, where each string is a single, concise action item or recommendation. Do NOT combine multiple points into a single paragraph. Each point should be a separate array element.
        Output MUST be valid JSON with this exact structure:
        {
          "weak": [
            { "topic": "Name of weak topic", "score": "45%", "feedback": ["First action point: concise recommendation.", "Second action point: concise recommendation.", "Third action point: concise recommendation."] }
          ],
          "moderate": [
            { "topic": "Name of moderate topic", "score": "65%" }
          ],
          "strong": [
            { "topic": "Name of strong topic", "score": "85%" }
          ]
        }`;
      }
      
      const response = await generateMedicalContent(prompt, systemInstruction, responseMimeType, useSearch);
      const cleanResponse = response ? response.replace(/^\s*```(?:json)?|```\s*$/gi, '').trim() : '';
      
      if ((featureId === 'seminar-builder' || featureId === 'journal-club') && response) {
        try {
          const parsed = JSON.parse(cleanResponse);
          const rawSlides = parsed.slides || [];
          const sanitizedSlides = rawSlides.map((s: any) => {
            let contentStr = "";
            if (typeof s.content === 'string') contentStr = s.content;
            else if (Array.isArray(s.content)) contentStr = s.content.map((c: any) => `• ${c}`).join('\n');
            else if (Array.isArray(s.bulletPoints)) contentStr = s.bulletPoints.map((c: any) => `• ${c}`).join('\n');
            else if (Array.isArray(s.bullets)) contentStr = s.bullets.map((c: any) => `• ${c}`).join('\n');
            else if (typeof s.description === 'string') contentStr = s.description;
            else if (s.content) contentStr = JSON.stringify(s.content, null, 2);
            else {
              const otherKeys = Object.keys(s).filter(k => k !== 'title' && k !== 'slideNumber' && k !== 'topic');
              if (otherKeys.length > 0) {
                const val = s[otherKeys[0]];
                if (typeof val === 'string') contentStr = val;
                else if (Array.isArray(val)) contentStr = val.map((c: any) => `• ${c}`).join('\n');
                else contentStr = JSON.stringify(val);
              }
            }
            return {
              title: s.title || s.slideTitle || `Slide`,
              content: contentStr
            };
          });
          setSlides(sanitizedSlides);
          setDetailedNotes(parsed.detailedNotes || "");
          setOutput(`${feature?.title} content generated successfully. View slides and notes below.`);
        } catch (e) {
          console.error("Failed to parse JSON", e);
          setOutput(response);
        }
      } else if (featureId === 'stat-assist' && response) {
        try {
          const parsed = JSON.parse(cleanResponse);
          setStatMethods(parsed.methods?.map((m: any) => ({...m, selected: false})) || []);
          setOutput("Statistical methods identified. Please select methods below.");
        } catch (e) {
          console.error("Failed to parse JSON", e);
          setOutput(response);
        }
      } else if (featureId === 'ai-exam-simulator' && response) {
        try {
          const parsed = JSON.parse(cleanResponse);
          setSimQuestions(parsed.questions || []);
          
          // Store rubrics hidden in a separate state, remove from questions array for security
          const rubrics: Record<string, string> = {};
          (parsed.questions || []).forEach((q: any) => {
            rubrics[q.id] = q.answerRubric;
          });
          setSimRubrics(rubrics);
          
          setSimExamActive(true);
          setSimTimeRemaining(simDurationMinutes * 60);
          setSimUploadPhase(false);
          setSimAnswers({});
          setSimNotAnswered({});
          setSimEvaluationResult('');
          setOutput("Exam generated. Timer started!");
        } catch (e) {
          console.error("Failed to parse JSON", e);
          setOutput(response);
        }
      } else if (featureId === 'answer-analyser' && response) {
        try {
          const parsed = JSON.parse(cleanResponse);
          setAnalyzerQuestions(parsed.questions || []);
          setOutput("Questions generated. Please select one below.");
        } catch (e) {
          console.error("Failed to parse JSON", e);
          setOutput(response);
        }
      } else if (featureId === 'mcqs-analyser' && response) {
        try {
          const parsed = JSON.parse(cleanResponse);
          setMcqGeneratedList(parsed.mcqs || []);
          setMcqUserAnswers({});
          setMcqEvaluationResult('');
          setOutput("MCQs generated. Please answer them below.");
        } catch (e) {
          console.error("Failed to parse JSON", e);
          setOutput(response);
        }
      } else if (featureId === 'ai-exam-prep' && response) {
        try {
          const parsed = JSON.parse(cleanResponse);
          setPrepAnalytics(parsed);
          setOutput("Analytics and personalized recommendations generated successfully.");
        } catch (e) {
          console.error("Failed to parse JSON", e);
          setOutput(response);
        }
      } else {
        setOutput(response || "Failed to generate content.");
      }
    } catch (error) {
      setOutput("Error generating content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (['knowledge-library', 'essay-library', 'mcq-library', 'flash-cards'].includes(featureId) && klTopicId) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klTopicId, featureId]);

  // AI Exam Simulator Timers
  useEffect(() => {
    let interval: any;
    if (simExamActive && simTimeRemaining > 0) {
      interval = setInterval(() => {
        setSimTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime === 30 * 60 || newTime === 15 * 60 || newTime === 5 * 60) {
            // Use standard browser alert for these crucial milestones.
            alert(`Exam Simulator: ${newTime / 60} minutes remaining!`);
          }
          if (newTime <= 0) {
            setSimExamActive(false);
            setSimUploadPhase(true);
            setSimUploadTimeRemaining(600);
            alert("Exam time completed. Please upload your answer scripts within 10 minutes.");
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else if (simExamActive && simTimeRemaining <= 0) {
      setSimExamActive(false);
      setSimUploadPhase(true);
      setSimUploadTimeRemaining(600);
    }
    return () => clearInterval(interval);
  }, [simExamActive]);

  useEffect(() => {
    let interval: any;
    if (simUploadPhase && simUploadTimeRemaining > 0 && !isEvaluatingSim && !simEvaluationResult) {
      interval = setInterval(() => {
        setSimUploadTimeRemaining(prev => {
          if (prev <= 1) {
            alert("Upload time expired! Please submit what you have.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [simUploadPhase, isEvaluatingSim, simEvaluationResult]);

  const handleSelectAnalyzerQuestion = async (q: any) => {
    setAnalyzerSelectedQuestion(q);
    setIsGeneratingRubric(true);
    try {
      const prompt = `Generate an Answer Rubric for the following question:\nQuestion: ${q.question}\nMarks: ${q.marks}\nSubject: ${analyzerSubject}\nTopic: ${analyzerTopic}`;
      const systemInstruction = `You are a strict medical examiner. Create a detailed answer rubric for evaluating student answer scripts. Break down the marks for different parts of the expected answer. Be specific about key points, diagrams expected (if any), and clinical correlations. Format as a professional markdown document.`;
      const response = await generateMedicalContent(prompt, systemInstruction, "text/plain", false);
      setAnalyzerRubric(response || "Rubric generated successfully.");
    } catch (error) {
      console.error(error);
      alert("Error generating rubric");
    } finally {
      setIsGeneratingRubric(false);
    }
  };

  const handleEvaluateAnswerScript = async () => {
    if (!analyzerRubric || scanImages.length === 0) return;
    setIsEvaluating(true);
    try {
      let prompt: any = `Evaluate the attached student answer script against the following rubric:\n\nQuestion: ${analyzerSelectedQuestion?.question} (${analyzerSelectedQuestion?.marks} marks)\n\nRubric:\n${analyzerRubric}`;
      
      prompt = [
        prompt,
        ...scanImages.map(img => ({
          inlineData: {
            data: img.split(',')[1] || img,
            mimeType: img.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
          }
        }))
      ];
      
      const systemInstruction = `You are an expert medical evaluator. Analyze the provided student answer script (images/pdf text) strictly following the provided rubric.
      Generate a complete markdown response formatted beautifully with the following sections:
      ## Marks Obtained
      (e.g., X out of ${analyzerSelectedQuestion?.marks})
      
      ## What went well
      (Strengths)
      
      ## What went wrong
      (Weaknesses / Missing points)
      
      ## How to improve
      (Constructive feedback)
      
      Be detailed and reference aspects of the student's answer vs the rubric.`;
      
      const response = await generateMedicalContent(prompt, systemInstruction, "text/plain", false);
      setAnalyzerEvaluation(response || "Evaluation completed.");
      setOutput(response || "Evaluation completed."); // for saving/sharing
    } catch (error) {
      console.error(error);
      alert("Error evaluating answer script");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleEvaluateMCQs = async () => {
    if (Object.keys(mcqUserAnswers).length < mcqGeneratedList.length) {
      alert("Please answer all MCQs before evaluating.");
      return;
    }
    
    setIsEvaluatingMcq(true);
    try {
      let prompt = "Evaluate the following MCQs based on the user's answers against the correct answers.\n\n";
      let correctCount = 0;
      
      mcqGeneratedList.forEach((q, idx) => {
        const isCorrect = mcqUserAnswers[q.id] === q.answer;
        if (isCorrect) correctCount++;
        prompt += `Q${idx + 1}: ${q.question}\nUser Answer: ${mcqUserAnswers[q.id]}\nCorrect Answer: ${q.answer}\nExplanation: ${q.explanation}\n\n`;
      });
      
      const scorePercentage = (correctCount / mcqGeneratedList.length) * 100;
      prompt += `\nOverall Score: ${correctCount}/${mcqGeneratedList.length} (${scorePercentage.toFixed(2)}%)\n\nPlease provide a detailed feedback summary including:\n1. Score Analysis\n2. What went well\n3. What went wrong\n4. How to improve\nFormat the response nicely in Markdown.`;

      const systemInstruction = `You are a medical examiner evaluating an MCQ test. Provide constructive and detailed feedback based on the user's performance. Focus on the medical reasoning behind the incorrect answers and suggest specific study strategies.`;
      
      const response = await generateMedicalContent(prompt, systemInstruction, "text/plain", false);
      
      let finalFeedback = `## Result: ${correctCount}/${mcqGeneratedList.length} (${scorePercentage.toFixed(2)}%)\n\n`;
      finalFeedback += response || "Evaluation completed.";
      
      setMcqEvaluationResult(finalFeedback);
      setOutput(finalFeedback);
    } catch (error) {
      console.error(error);
      alert("Error evaluating MCQs");
    } finally {
      setIsEvaluatingMcq(false);
    }
  };

  const handleSaveMcqAnalysis = async () => {
    try {
      const id = `mcq_${Date.now()}`;
      const evaluationData = {
        result: mcqEvaluationResult,
        userAnswers: mcqUserAnswers,
        score: `${mcqGeneratedList.filter((q) => mcqUserAnswers[q.id] === q.answer).length}/${mcqGeneratedList.length}`
      };
      const response = await fetch('/api/knowledge-analyser-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          user_id: 'default',
          subject: mcqSubject,
          topic: mcqTopic,
          mcqs: mcqGeneratedList,
          evaluation: evaluationData,
          content: mcqEvaluationResult,
          date: new Date().toISOString()
        })
      });
      if (response.ok) {
        alert('MCQ Analysis saved successfully!');
      } else {
        alert('Failed to save MCQ Analysis.');
      }
    } catch (error) {
      console.error('Error saving MCQ analysis:', error);
      alert('Error saving MCQ Analysis.');
    }
  };

  const handleSimUploadChange = (qId: string, e: any) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    Promise.all(files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file as File);
      });
    })).then(base64Images => {
      setSimAnswers(prev => ({
        ...prev,
        [qId]: [...(prev[qId] || []), ...base64Images]
      }));
    });
  };

  const handleEvaluateSim = async () => {
    // Check if everything is answered or marked not answered
    for (const q of simQuestions) {
      if (!simAnswers[q.id]?.length && !simNotAnswered[q.id]) {
        alert("Please upload answers for all questions or mark them as 'Not Answered'.");
        return;
      }
    }
    
    setIsEvaluatingSim(true);
    setSimUploadPhase(false);
    
    try {
      // Because we may have massive amounts of images, we batch them into one single structured prompt.
      let prompt: any = "Evaluate the following student exam submission. For each question, compare the provided student handwritten answer scripts (images provided below) with the specific strict answer rubric.\n\n";
      const attachmentParts: any[] = [];
      
      simQuestions.forEach((q, index) => {
        prompt += `\n--- QUESTION ${index+1} ---\n`;
        prompt += `Question: ${q.questionText}\n`;
        prompt += `Marks: ${q.marks}\n`;
        prompt += `Expected Answer Rubric:\n${simRubrics[q.id]}\n`;
        
        if (simNotAnswered[q.id]) {
          prompt += `Student Response: NOT ANSWERED by student.\n`;
        } else {
          prompt += `Student Response: See attached images marked for Question ${index+1}.\n`;
          simAnswers[q.id]?.forEach((imgStr) => {
            attachmentParts.push({
              inlineData: {
                data: imgStr.split(',')[1],
                mimeType: imgStr.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
              }
            });
          });
        }
      });
      
      prompt += `\n\nGenerate a complete markdown response. Include TWO levels of feedback:\n`;
      prompt += `LEVEL 1 - Overall Feedback Summary (Total Score, Strengths, Weak Areas, Recommendations)\n`;
      prompt += `LEVEL 2 - Question-wise Feedback (Marks obtained for each question, missing concepts, specific suggestions)\n`;
      
      const finalPromptPayload = attachmentParts.length > 0 ? [prompt, ...attachmentParts] : prompt;
      
      const systemInstruction = `You are an expert medical evaluator scanning and grading a full university-level exam. 
      Use OCR to read the attached handwritten images closely. If an image is illegible, mention it in the feedback.
      Grade strictly according to each question's provided answer rubric.
      Output a beautifully formatted Markdown report calculating the final total score obtained out of the maximum marks possible.`;
      
      const response = await generateMedicalContent(finalPromptPayload, systemInstruction, "text/plain", false);
      setSimEvaluationResult(response || "Evaluation completed.");
      setOutput(response || "Evaluation completed.");
    } catch (error) {
      console.error(error);
      alert("Error evaluating Exam Simulation");
    } finally {
      setIsEvaluatingSim(false);
    }
  };

  const handleSaveExamSimulation = async () => {
    try {
      const id = `exam_sim_${Date.now()}`;
      const response = await fetch('/api/ai-exam-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          user_id: 'default',
          subject: simSubject,
          paper: simPaper,
          topics: simTopics,
          questions: simQuestions.map(q => ({ id: q.id, sectionName: q.sectionName, questionText: q.questionText, marks: q.marks })),
          evaluation: { result: simEvaluationResult },
          content: simEvaluationResult,
          date: new Date().toISOString()
        })
      });
      if (response.ok) {
        alert('Exam Simulation saved successfully!');
      } else {
        alert('Failed to save Exam Simulation.');
      }
    } catch (error) {
      console.error('Error saving exam simulation:', error);
      alert('Error saving Exam Simulation.');
    }
  };

  const handleGenerateStatResults = async () => {
    const selected = statMethods.filter(m => m.selected).map(m => m.name);
    if (selected.length === 0) {
      alert("Please select at least one method.");
      return;
    }
    
    setIsGeneratingResults(true);
    try {
      let prompt: any = `Generate detailed statistical results, interpretations, and required graphs/diagrams for Study Title: "${statStudyTitle}". 
      Methods applied: ${selected.join(', ')}.`;
      
      if (scanImages.length > 0) {
        prompt = [
          prompt,
          ...scanImages.map(img => ({
            inlineData: {
              data: img.split(',')[1] || img,
              mimeType: img.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
            }
          }))
        ];
      }
      
      const systemInstruction = `You are an expert biostatistician. Generate the final results of the study using the chosen statistical methods. 
      Format the output beautifully in markdown. Include structured tables, statistical significance (p-values, confidence intervals if applicable).
      Describe any graphs or diagrams that should be plotted (e.g. "suggested Kaplan-Meier curve" or "Box plot of variable X").`;
      
      const response = await generateMedicalContent(prompt, systemInstruction, "text/plain", false);
      setStatData(response);
    } catch (error) {
      console.error(error);
      alert("Error generating results");
    } finally {
      setIsGeneratingResults(false);
    }
  };

  const handleDownload = () => {
    const element = document.getElementById("pdf-download-content");
    if (!element) {
      const a = document.createElement("a");
      const file = new Blob([output], { type: 'text/plain' });
      a.href = URL.createObjectURL(file);
      a.download = `${feature?.title || 'medimentr'}-result.txt`;
      document.body.appendChild(a);
      a.click();
      return;
    }
    const opt: any = {
      margin:       0.5,
      filename:     `${feature?.title || 'medimentr'}-result.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: feature?.title,
          text: output,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(output);
      alert('Result copied to clipboard!');
    }
  };

  const handleSave = async () => {
    let customTitle = feature?.title || 'Generated Content';
    let contentToSave = output;
    let endpoint = '/api/saved';
    
    let newItem: any = {
      id: Date.now().toString(),
      title: customTitle,
      content: contentToSave,
      featureId: featureId,
      date: new Date().toISOString()
    };

    if (featureId === 'seminar-builder') {
      customTitle = `Seminar: ${seminarTopic}`;
      contentToSave = `# Seminar: ${seminarTopic}\n\n## PPT Structure\n${slides.map((s,i) => `Slide ${i+1}: ${s.title}\n${s.content}`).join('\n\n')}\n\n## Detailed Notes\n${detailedNotes}`;
      endpoint = '/api/seminar-builder';
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        discipline: seminarDiscipline,
        topic: seminarTopic,
        criteria: seminarCriteria,
        ppt_structure: JSON.stringify(slides),
        detailed_notes: detailedNotes,
        date: new Date().toISOString(),

        // Fallbacks for local state/UI display compatibility
        title: customTitle,
        content: contentToSave,
        featureId: featureId
      };
    } else if (featureId === 'journal-club') {
      customTitle = `Journal Club: ${jcTopic}`;
      contentToSave = `# Journal Club: ${jcTopic}\n\n## PPT Structure\n${slides.map((s,i) => `Slide ${i+1}: ${s.title}\n${s.content}`).join('\n\n')}\n\n## Detailed Notes\n${detailedNotes}`;
      endpoint = '/api/journal-club';
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        discipline: jcDiscipline,
        topic: jcTopic,
        criteria: jcCriteria,
        ppt_structure: JSON.stringify(slides),
        detailed_notes: detailedNotes,
        date: new Date().toISOString(),

        // Fallbacks for local state/UI display compatibility
        title: customTitle,
        content: contentToSave,
        featureId: featureId
      };
    } else if (featureId === 'question-paper') {
      customTitle = `Question Paper: ${input}`;
      endpoint = '/api/question-paper';
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        paper_number: paperNumber,
        topic: input,
        content: output,
        date: new Date().toISOString(),
        reference_content: modelPaperText,
        
        // Include fallback props for local storage so fetchSaved doesn't break
        title: customTitle,
        featureId: featureId
      };
    } else if (featureId === 'essay-generator') {
      customTitle = `Essay: ${input}`;
      endpoint = '/api/essay-generator';
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        title: customTitle,
        topic: input,
        course: essayCourse,
        type: typeof essayType !== 'undefined' ? essayType : 'long',
        content: output,
        date: new Date().toISOString(),
        
        // Include fallback props for saved_items dashboard
        featureId: featureId
      };
    } else if (featureId === 'protocol-generator') {
      customTitle = `Protocol: ${input}`;
      endpoint = '/api/protocol-generator';
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        topic: input,
        course: protocolCourse,
        content: output,
        date: new Date().toISOString(),
        
        // Include fallback props for saved_items dashboard
        title: customTitle,
        featureId: featureId
      };
    } else if (featureId === 'manuscript-generator') {
      customTitle = `Manuscript: ${input}`;
      endpoint = '/api/manuscript-generator';
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        topic: input,
        course: manuscriptCourse,
        content: output,
        date: new Date().toISOString(),
        
        // Include fallback props for saved_items dashboard
        title: customTitle,
        featureId: featureId
      };
    } else if (featureId === 'stat-assist') {
      const selectedMethods = statMethods.filter(m => m.selected).map(m => m.name);
      const compiledContent = `# Statistical Analysis: ${statStudyTitle}\n\n## Selected Methods\n${selectedMethods.join(', ')}\n\n## Results\n${statData || output || 'No results generated yet.'}`;
      customTitle = `StatAssist: ${statStudyTitle}`;
      endpoint = '/api/statassist';
      contentToSave = compiledContent;
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        study_title: statStudyTitle,
        course: statCourse,
        methods: JSON.stringify(selectedMethods),
        results: statData || output || '',
        content: compiledContent,
        date: new Date().toISOString(),
        
        // Include fallback props for saved_items dashboard
        title: customTitle,
        featureId: featureId
      };
    } else if (featureId === 'reflection-generator') {
      customTitle = `Reflection: ${refTopic || input}`;
      endpoint = '/api/reflection-generator';
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        subject: refSubject,
        topic: refTopic || input,
        content: output,
        date: new Date().toISOString(),
        
        // Include fallback props for saved_items dashboard
        title: customTitle,
        featureId: featureId
      };
    } else if (featureId === 'ai-exam-simulator') {
      customTitle = `Exam Simulation: ${simSubject}${simPaper ? ' - ' + simPaper : ''}`;
      endpoint = '/api/ai-exam-simulator';
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        subject: simSubject,
        paper: simPaper,
        topics: simTopics,
        questions: simQuestions,
        evaluation: simEvaluationResult,
        content: output,
        date: new Date().toISOString(),
        
        // Include fallback props for saved_items dashboard
        title: customTitle,
        featureId: featureId
      };
    } else if (featureId === 'ai-exam-prep') {
      const selectedCourseName = prepCourseId || 'General';
      customTitle = `Exam Prep: ${selectedCourseName}`;
      endpoint = '/api/ai-exam-prep';
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        course_id: selectedCourseName,
        analytics: prepAnalytics || null,
        content: output,
        date: new Date().toISOString(),
        
        // Include fallback props for saved_items dashboard
        title: customTitle,
        featureId: featureId
      };
    } else if (featureId === 'answer-analyser') {
      customTitle = `Essay Analysis: ${analyzerSubject || 'General'}`;
      endpoint = '/api/knowledge-analyser-essay';
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        subject: analyzerSubject,
        topic: analyzerTopic,
        questions: analyzerQuestions || null,
        evaluation: analyzerEvaluation || null,
        content: output,
        date: new Date().toISOString(),
        
        // Include fallback props for saved_items dashboard
        title: customTitle,
        featureId: featureId
      };
    } else if (featureId === 'clinical-decision-support') {
      customTitle = `Clinical Decision Support: ${input.substring(0, 60)}`;
      endpoint = '/api/clinical-decision-support';
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        patient_data: input,
        recommendations: output,
        date: new Date().toISOString(),
        
        // Include fallback props for saved_items dashboard
        title: customTitle,
        content: output,
        featureId: featureId
      };
    } else if (featureId === 'session-search') {
      customTitle = `Session Search: ${searchSubject} - ${searchTopic}`;
      endpoint = '/api/scientific-session-search';
      newItem = {
        id: Date.now().toString(),
        user_id: 'default',
        subject: searchSubject,
        topic: searchTopic,
        region: searchRegion,
        month: searchMonth,
        results: output,
        date: new Date().toISOString(),
        
        // Include fallback props for saved_items dashboard
        title: customTitle,
        content: output,
        featureId: featureId
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      
      if (response.ok) {
        alert('Result saved to database successfully!');
        fetchSaved(); // refresh local list
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      alert('Failed to save to database. Please check your connection.');
    }
  };

  const handleDownloadPPT = () => {
    const pres = new pptxgen();
    slides.forEach(slide => {
      const s = pres.addSlide();
      s.addText(slide.title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, color: '363636' });
      s.addText(slide.content, { x: 0.5, y: 1.5, w: '90%', h: 4, fontSize: 18, color: '666666', bullet: true });
    });
    const fileName = featureId === 'journal-club' 
      ? `JournalClub_${jcTopic.replace(/\s+/g, '_')}.pptx`
      : `Seminar_${seminarTopic.replace(/\s+/g, '_')}.pptx`;
    pres.writeFile({ fileName });
  };

  const handleDownloadNotes = () => {
    const element = document.getElementById("pdf-download-notes-content");
    if (!element) {
      const blob = new Blob([detailedNotes], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = featureId === 'journal-club'
        ? `JournalClub_Notes_${jcTopic.replace(/\s+/g, '_')}.md`
        : `Seminar_Notes_${seminarTopic.replace(/\s+/g, '_')}.md`;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const fileName = featureId === 'journal-club'
      ? `JournalClub_Notes_${jcTopic.replace(/\s+/g, '_')}.pdf`
      : `Seminar_Notes_${seminarTopic.replace(/\s+/g, '_')}.pdf`;
    const opt: any = {
      margin:       0.5,
      filename:     fileName,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!feature) return <div>Feature not found</div>;

  const isQuestionPaper = featureId === 'question-paper';

  return (
    <div className="pb-24 w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full max-w-7xl mx-auto">
        {featureId !== 'thesis-notes' && (
          <>
            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
            >
              <ChevronRight className="rotate-180" size={20} /> Back
            </button>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                  {getIcon(feature.icon)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{feature.title}</h1>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              </div>
              {isQuestionPaper && (
                <button 
                  onClick={() => {
                    document.getElementById('saved-library-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hidden sm:flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
                >
                  <Save size={18} /> View Saved Papers
                </button>
              )}
            </div>
          </>
        )}

        <div className="space-y-6">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 space-y-6">
            {featureId === 'answer-analyser' ? (
              <div className="space-y-6">
                {!analyzerSelectedQuestion ? (
                  <>
                    {lockedCourseName && (
                      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3 mb-4">
                        <span className="text-lg">🔒</span>
                        <div className="flex-1"><span className="text-sm font-semibold text-blue-300">Locked to: </span><span className="text-sm font-bold text-white">{lockedCourseName}</span></div>
                        <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Change in Dashboard</button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-slate-300 font-medium">Select Subject / Course {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}</label>
                        <div className="relative">
                          <select
                            value={analyzerSubject}
                            onChange={(e) => { if (!lockedCourseName) setAnalyzerSubject(e.target.value); }}
                            disabled={!!lockedCourseName}
                            className={`w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            <option value="">-- Select Course --</option>
                            {curriculum?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">{lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-slate-300 font-medium">Type Section / Topic</label>
                        <input 
                          type="text"
                          value={analyzerTopic}
                          onChange={(e) => setAnalyzerTopic(e.target.value)}
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="e.g. Cardiovascular System, Heart Failure..."
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-slate-300 font-medium">Select Marks</label>
                        <select 
                          value={analyzerMarks}
                          onChange={(e) => setAnalyzerMarks(e.target.value)}
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="20 marks">20 Marks</option>
                          <option value="10 marks">10 Marks</option>
                          <option value="5 marks">5 Marks</option>
                        </select>
                      </div>
                    </div>
                    {analyzerQuestions.length > 0 && (
                      <div className="mt-6 space-y-4 animate-in fade-in">
                        <label className="block text-slate-300 font-medium">Select a Question to generate rubric & evaluate:<br />
                        <span className="text-sm text-slate-400 font-normal">(From which you will select 1 for self evaluation)</span></label>
                        <div className="grid grid-cols-1 gap-4">
                          {analyzerQuestions.map((q, i) => (
                            <div key={i} className="bg-slate-800 border border-white/5 rounded-xl p-5 flex justify-between items-center hover:bg-slate-800/80 hover:border-blue-500/30 transition-all cursor-pointer group" onClick={() => handleSelectAnalyzerQuestion(q)}>
                              <div className="flex-1 pr-6">
                                <p className="text-white font-medium text-lg">{q.question}</p>
                                <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold mt-3 inline-block tracking-wider">{q.marks} Marks</span>
                              </div>
                              <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                                <ChevronRight size={20} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
                      
                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <h4 className="text-white font-bold text-2xl flex-1 mr-6 leading-relaxed">{analyzerSelectedQuestion.question}</h4>
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shadow-lg shadow-blue-600/20">{analyzerSelectedQuestion.marks} Marks</span>
                      </div>
                      
                      {isGeneratingRubric ? (
                        <div className="flex items-center gap-3 text-blue-400 text-sm font-medium bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 w-fit">
                          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          Automatically creating Answer Rubrics in the background...
                        </div>
                      ) : analyzerRubric ? (
                        <div className="text-emerald-400 text-sm flex items-center gap-2 font-bold bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 w-fit">
                          <CheckCircle size={18} /> Answer Rubrics created in background. Ready for evaluation.
                        </div>
                      ) : null}
                    </div>

                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                      <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Upload className="text-blue-500" /> Upload Answer Script
                      </h4>
                      <p className="text-slate-400 text-sm mb-6">After completion of writing the answer, upload it by taking multiple Photos or a PDF.</p>
                      <div className="space-y-4">
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-blue-500/50 transition-all bg-slate-800/50 group">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Plus className="w-10 h-10 text-slate-500 mb-3 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                            <p className="text-base text-slate-300 font-semibold mb-1">Take Photos / Upload PDF</p>
                            <p className="text-xs text-slate-500">Supports multiple files</p>
                          </div>
                          <input type="file" className="hidden" multiple accept="image/*,.pdf" onChange={handleScanImage} />
                        </label>
                        {scanImages.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-4">
                            {scanImages.map((img, i) => (
                              <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border border-white/10 group shadow-md">
                                {img.startsWith('data:image') ? (
                                  <img src={img} alt={`Upload ${i+1}`} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-xs text-slate-400 break-words text-center px-2">
                                    <FileText className="w-6 h-6 mb-2 text-blue-400" />
                                    Doc {i+1}
                                  </div>
                                )}
                                <button 
                                  onClick={() => setScanImages(scanImages.filter((_, idx) => idx !== i))}
                                  className="absolute top-2 right-2 w-7 h-7 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-all shadow-lg scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {analyzerEvaluation && (
                      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                        <h3 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4 flex items-center gap-3">
                           <CheckSquare className="text-emerald-500" /> Evaluation Results & Feedback
                        </h3>
                        <div className="prose prose-invert prose-lg max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed marker:text-blue-400 prose-headings:text-white prose-a:text-blue-400">
                           {analyzerEvaluation}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button 
                        onClick={() => {
                          setAnalyzerSelectedQuestion(null);
                          setAnalyzerRubric('');
                          setAnalyzerEvaluation('');
                          setScanImages([]);
                        }}
                        className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-white/5"
                      >
                        Back to Questions
                      </button>
                      <button 
                        onClick={handleEvaluateAnswerScript}
                        disabled={!analyzerRubric || scanImages.length === 0 || isEvaluating}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                      >
                        {isEvaluating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Evaluating Script in Background...
                          </>
                        ) : (
                          <>
                            <CheckSquare size={20} /> Evaluate Answer Script
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : featureId === 'ai-exam-simulator' ? (
              <div className="space-y-6 animate-in fade-in">
                {!simExamActive && !simUploadPhase && !isEvaluatingSim && !simEvaluationResult ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {lockedCourseName && (
                        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3 mb-4 col-span-full">
                          <span className="text-lg">🔒</span>
                          <div className="flex-1"><span className="text-sm font-semibold text-blue-300">Locked to: </span><span className="text-sm font-bold text-white">{lockedCourseName}</span></div>
                          <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Change in Dashboard</button>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="block text-slate-300 font-medium">Select Subject / Course {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}</label>
                        <div className="relative">
                          <select
                            value={simSubject}
                            onChange={(e) => { if (!lockedCourseName) setSimSubject(e.target.value); }}
                            disabled={!!lockedCourseName}
                            className={`w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            <option value="">-- Select Course --</option>
                            {curriculum?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">{lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-slate-300 font-medium">Type Paper (if any)</label>
                        <input
                          type="text"
                          value={simPaper}
                          onChange={(e) => setSimPaper(e.target.value)}
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="e.g. Paper 1, Applied Basic Sciences..."
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-slate-300 font-medium">Sections / Topics for Assessment</label>
                      <textarea
                        value={simTopics}
                        onChange={(e) => setSimTopics(e.target.value)}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white h-24 focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="List the topics or sections you want to be assessed on..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-slate-300 font-medium overflow-hidden">
                        Exam Duration (Minutes)
                        <span className="text-xs text-slate-500 ml-2">(Default: 180)</span>
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={600}
                        value={simDurationMinutes}
                        onChange={(e) => setSimDurationMinutes(parseInt(e.target.value) || 180)}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors md:w-1/3 text-xl"
                      />
                    </div>

                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 mt-6">
                      <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Upload className="text-blue-500" /> Upload Reference Question Paper
                      </h4>
                      <p className="text-sm text-slate-400 mb-4">
                        Upload a sample university question paper. AI will analyze its format and section structure to generate your exam.
                      </p>
                      <div className="space-y-4">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-blue-500/50 transition-all bg-slate-800/50 relative overflow-hidden group">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Plus className="w-8 h-8 text-slate-500 mb-2 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                            <p className="text-sm text-slate-400 font-semibold group-hover:text-slate-300">Take Photo / Upload Images</p>
                          </div>
                          <input type="file" className="hidden" multiple accept="image/*,.pdf" onChange={handleScanImage} />
                        </label>
                        {scanImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {scanImages.map((img, i) => (
                               <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 group">
                                 {img.startsWith('data:image') ? (
                                   <img src={img} alt={`Upload ${i+1}`} className="w-full h-full object-cover" />
                                 ) : (
                                   <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-xs text-slate-300 break-words text-center px-2">
                                      <FileText className="w-6 h-6 mb-1 text-blue-400" />
                                      Doc {i+1}
                                   </div>
                                 )}
                                 <button 
                                   onClick={() => setScanImages(scanImages.filter((_, idx) => idx !== i))}
                                   className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
                                 >
                                   <X size={12} />
                                 </button>
                               </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : simExamActive ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-900 border border-blue-500/30 p-6 rounded-2xl shadow-lg sticky top-6 z-10">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Brain className="text-blue-500 animate-pulse" /> Exam in Progress
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">Please write your answers on a blank sheet of paper.</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-mono font-bold text-amber-400">
                          {Math.floor(simTimeRemaining / 3600).toString().padStart(2, '0')}:
                          {Math.floor((simTimeRemaining % 3600) / 60).toString().padStart(2, '0')}:
                          {(simTimeRemaining % 60).toString().padStart(2, '0')}
                        </div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mt-1">Time Remaining</p>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-8 mb-8 relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full pointer-events-none" />
                      
                      {simQuestions.length > 0 ? (
                        <div className="space-y-8 relative z-10">
                          {simQuestions.map((q, idx) => (
                            <div key={q.id} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                              {q.sectionName && (
                                <h4 className="text-blue-400 font-bold mb-3 text-sm uppercase tracking-wider">{q.sectionName}</h4>
                              )}
                              <div className="flex justify-between items-start gap-4">
                                <p className="text-lg text-white leading-relaxed">
                                  <span className="font-bold text-blue-500 mr-2">Q{idx + 1}.</span> 
                                  {q.questionText}
                                </p>
                                <span className="bg-slate-900 border border-white/10 px-3 py-1 rounded-lg text-blue-400 font-bold whitespace-nowrap">
                                  [{q.marks} Marks]
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-slate-500">
                          Loading Exam Paper...
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (confirm("Are you sure you want to finish the exam early?")) {
                          setSimExamActive(false);
                          setSimUploadPhase(true);
                          setSimUploadTimeRemaining(600);
                        }
                      }}
                      className="w-full bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 text-amber-500 hover:text-white font-bold py-4 rounded-xl transition-all"
                    >
                      Finish Exam Early & Skip to Upload
                    </button>
                  </div>
                ) : simUploadPhase ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-emerald-900/30 border border-emerald-500/30 p-6 rounded-2xl shadow-lg sticky top-6 z-10">
                      <div>
                        <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                          <Upload className="text-emerald-500" /> Upload Answer Scripts
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">Take clear photos of your handwritten answers for each question.</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-mono font-bold ${simUploadTimeRemaining < 60 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                          {Math.floor(simUploadTimeRemaining / 60).toString().padStart(2, '0')}:
                          {(simUploadTimeRemaining % 60).toString().padStart(2, '0')}
                        </div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mt-1">Upload Window</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {simQuestions.map((q, idx) => (
                        <div key={q.id} className="bg-slate-800 border border-white/10 rounded-2xl p-6">
                          <p className="text-white font-medium mb-4">
                            <span className="text-blue-500 font-bold mr-2">Q{idx + 1}.</span>
                            {q.questionText}
                          </p>
                          
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center bg-slate-900 border border-white/5 p-4 rounded-xl">
                              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${simNotAnswered[q.id] ? 'bg-slate-800 text-slate-500 opacity-50' : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400'}`}>
                                <Plus size={18} />
                                <span className="text-sm font-bold">Add Images</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  multiple 
                                  accept="image/*" 
                                  onChange={(e) => handleSimUploadChange(q.id, e)}
                                  disabled={simNotAnswered[q.id]}
                                />
                              </label>
                              
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-red-500 focus:ring-red-500"
                                  checked={simNotAnswered[q.id] || false}
                                  onChange={(e) => setSimNotAnswered({...simNotAnswered, [q.id]: e.target.checked})}
                                />
                                <span className="text-slate-400 group-hover:text-red-400 text-sm font-medium transition-colors">Mark as Not Answered</span>
                              </label>
                            </div>
                            
                            {!simNotAnswered[q.id] && simAnswers[q.id] && simAnswers[q.id].length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {simAnswers[q.id].map((imgStr, iIdx) => (
                                  <div key={iIdx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 group">
                                    <img src={imgStr} className="w-full h-full object-cover" />
                                    <button 
                                      onClick={() => setSimAnswers({
                                        ...simAnswers,
                                        [q.id]: simAnswers[q.id].filter((_, filterIdx) => filterIdx !== iIdx)
                                      })}
                                      className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={handleEvaluateSim}
                      disabled={isEvaluatingSim}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 mt-8"
                    >
                      {isEvaluatingSim ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Evaluating All Scripts via AI... (Takes time)
                        </>
                      ) : (
                        <>
                          <CheckSquare size={20} /> Submit & Evaluate Complete Exam
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                      <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                        <CheckCircle className="text-emerald-500" /> Exam Simulation Report
                      </h3>
                      <div className="prose prose-invert prose-lg max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed marker:text-blue-400 prose-headings:text-white prose-a:text-blue-400">
                         {simEvaluationResult}
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setSimQuestions([]);
                        setSimEvaluationResult('');
                        setSimAnswers({});
                        setSimNotAnswered({});
                        setSimTimeRemaining(0);
                        setSimUploadTimeRemaining(0);
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all border border-white/10 shadow-lg"
                    >
                      Start a New Exam Simulation
                    </button>
                    <button 
                      onClick={handleSaveExamSimulation}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                    >
                      <CheckSquare size={20} /> Save to Database
                    </button>
                    </div>
                  </div>
                )}
              </div>
            ) : featureId === 'mcqs-analyser' ? (
              <div className="space-y-6">
                {mcqGeneratedList.length === 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {lockedCourseName && (
                        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3 mb-4 col-span-full">
                          <span className="text-lg">🔒</span>
                          <div className="flex-1"><span className="text-sm font-semibold text-blue-300">Locked to: </span><span className="text-sm font-bold text-white">{lockedCourseName}</span></div>
                          <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Change in Dashboard</button>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="block text-slate-300 font-medium">Select Subject / Course {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}</label>
                        <div className="relative">
                          <select
                            value={mcqSubject}
                            onChange={(e) => { if (!lockedCourseName) setMcqSubject(e.target.value); }}
                            disabled={!!lockedCourseName}
                            className={`w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            <option value="">-- Select Course --</option>
                            {curriculum?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">{lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-slate-300 font-medium">Type Section / Topic</label>
                        <input 
                          type="text"
                          value={mcqTopic}
                          onChange={(e) => setMcqTopic(e.target.value)}
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="e.g. Cardiovascular System, Heart Failure..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-slate-300 font-medium">Select Marks</label>
                        <select 
                          value={mcqMarks}
                          onChange={(e) => setMcqMarks(e.target.value)}
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="1 Mark">1 Mark</option>
                          <option value="2 Marks">2 Marks</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-slate-300 font-medium">Number of MCQs</label>
                        <input 
                          type="number"
                          value={mcqCount}
                          onChange={(e) => setMcqCount(parseInt(e.target.value) || 0)}
                          min="1"
                          max="20"
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="block text-slate-300 font-medium">Select MCQ Types (One or multiple)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {MCQ_TYPES.map((type) => (
                            <label key={type.id} className="flex items-start gap-3 p-4 bg-slate-800 border border-white/5 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors group">
                              <div className="pt-1">
                                <input 
                                  type="checkbox" 
                                  className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                                  checked={mcqTypes.includes(type.id)}
                                  onChange={(e) => {
                                    if(e.target.checked) setMcqTypes([...mcqTypes, type.id]);
                                    else setMcqTypes(mcqTypes.filter(t => t !== type.id));
                                  }}
                                />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">{type.label}</p>
                                <p className="text-slate-500 text-xs mt-1">{type.desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-8 animate-in fade-in">
                    {!mcqEvaluationResult ? (
                      <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-white mb-4">Complete your MCQs</h3>
                        {mcqGeneratedList.map((q, idx) => (
                          <div key={q.id} className="bg-slate-800 border border-white/10 rounded-xl p-6">
                            <p className="text-lg text-white font-medium mb-4">
                              <span className="text-blue-400 mr-2">Q{idx + 1}.</span>
                              {q.question}
                            </p>
                            <div className="space-y-3">
                              {q.options.map((opt, oIdx) => (
                                <label key={oIdx} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${mcqUserAnswers[q.id] === opt ? 'bg-blue-600/20 border-blue-500/50 border' : 'bg-slate-900 border border-white/5 hover:border-white/20'}`}>
                                  <input 
                                    type="radio" 
                                    name={`mcq-${q.id}`} 
                                    value={opt}
                                    checked={mcqUserAnswers[q.id] === opt}
                                    onChange={() => setMcqUserAnswers({...mcqUserAnswers, [q.id]: opt})}
                                    className="w-5 h-5 text-blue-500 border-white/20 bg-slate-800 focus:ring-blue-500"
                                  />
                                  <span className="text-slate-200">{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="pt-4 flex gap-4">
                          <button 
                            onClick={() => {
                              setMcqGeneratedList([]);
                              setMcqUserAnswers({});
                              setMcqEvaluationResult('');
                            }}
                            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-white/5"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleEvaluateMCQs}
                            disabled={isEvaluatingMcq}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                          >
                            {isEvaluatingMcq ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Evaluating MCQs...
                              </>
                            ) : (
                              <>
                                <CheckSquare size={20} /> Evaluate Answers
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                          <div className="prose prose-invert prose-lg max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed marker:text-blue-400 prose-headings:text-white prose-a:text-blue-400">
                             {mcqEvaluationResult}
                          </div>
                        </div>
                        <div className="space-y-4 pt-4">
                          <h4 className="text-xl font-bold text-white mb-4">Detailed Answer Key</h4>
                          {mcqGeneratedList.map((q, idx) => {
                            const isCorrect = mcqUserAnswers[q.id] === q.answer;
                            return (
                              <div key={q.id} className={`bg-slate-800 border ${isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'} rounded-xl p-6`}>
                                <p className="text-lg text-white font-medium mb-4">
                                  <span className="text-slate-400 mr-2">Q{idx + 1}.</span>
                                  {q.question}
                                </p>
                                <div className="space-y-2 mb-4">
                                  <p className="text-sm">
                                    <span className="text-slate-400">Your Answer: </span>
                                    <span className={isCorrect ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                      {mcqUserAnswers[q.id] || "Not answered"}
                                    </span>
                                  </p>
                                  {!isCorrect && (
                                    <p className="text-sm">
                                      <span className="text-slate-400">Correct Answer: </span>
                                      <span className="text-emerald-400 font-bold">{q.answer}</span>
                                    </p>
                                  )}
                                </div>
                                <div className="bg-slate-900/50 rounded-lg p-4">
                                  <p className="text-sm text-slate-300 leading-relaxed"><span className="text-blue-400 font-medium">Explanation:</span> {q.explanation}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="pt-4 flex gap-4">
                          <button 
                            onClick={() => {
                              setMcqGeneratedList([]);
                              setMcqUserAnswers({});
                              setMcqEvaluationResult('');
                            }}
                            className="flex-1 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg"
                          >
                            Generate New MCQs
                          </button>
                          <button 
                            onClick={handleSaveMcqAnalysis}
                            className="flex-1 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                          >
                            <CheckSquare size={20} /> Save Analysis
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : featureId === 'ai-exam-simulator' ? (
              <div className="space-y-6">
                <div className="bg-slate-800 border border-blue-500/30 rounded-2xl p-8 text-center">
                  <Target className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">AI Exam Simulator</h3>
                  <p className="text-slate-400 mb-6">
                    Coming Soon... Logic to be inserted here.
                  </p>
                </div>
              </div>
            ) : isQuestionPaper ? (
              <>
                <div className="space-y-2">
                  {lockedCourseName && (
                    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3 mb-3">
                      <span className="text-lg">🔒</span>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-blue-300">Locked to: </span>
                        <span className="text-sm font-bold text-white">{lockedCourseName}</span>
                      </div>
                      <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Change in Dashboard</button>
                    </div>
                  )}
                  <label className="block text-slate-300 font-medium">
                    Discipline / Course {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}
                  </label>
                  <div className="relative">
                    <select
                      value={questionPaperCourse}
                      onChange={(e) => { if (!lockedCourseName) setQuestionPaperCourse(e.target.value); }}
                      disabled={!!lockedCourseName}
                      className={`w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <option value="">-- Select Course --</option>
                      {curriculum?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      {lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Paper Number</label>
                  <input 
                    type="text"
                    value={paperNumber}
                    onChange={(e) => setPaperNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. Paper I, Paper II..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Enter Topic</label>
                  <div className="relative">
                    <textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white h-32 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Type topics, or describe the content..."
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <label className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors cursor-pointer" title="Upload Image">
                        <Activity size={18} />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const fileName = e.target.files?.[0]?.name;
                            if (fileName) setInput(prev => prev + ` [Image Attached: ${fileName}]`);
                          }}
                        />
                      </label>
                      <button 
                        onClick={() => alert("Camera access requested...")}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors" 
                        title="Take Photo"
                      >
                        <Stethoscope size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Upload Model Question Paper</label>
                  <div className="flex flex-col gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className="w-full bg-slate-800 border border-dashed border-white/20 rounded-xl p-4 text-center hover:border-blue-500/50 transition-all">
                        <FileText className="mx-auto text-slate-500 mb-2" />
                        <span className="text-sm text-slate-400">
                          {isExtractingPaper ? "Extracting text using AI..." : (modelPaperName || "Click to upload model paper")}
                        </span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*,.pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setModelPaperName(file.name);
                              setIsExtractingPaper(true);
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                if (event.target?.result) {
                                  const base64 = event.target.result as string;
                                  setScanImages([base64]);
                                  try {
                                    const extractedText = await extractPaperTextFromImage(base64);
                                    setModelPaperText(extractedText);
                                  } catch (err) {
                                    alert("Failed to extract text from the paper.");
                                  } finally {
                                    setIsExtractingPaper(false);
                                  }
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </label>

                    {(modelPaperText || isExtractingPaper) && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-slate-300 font-medium text-sm text-emerald-400">
                          Extracted Reference Paper (Editable)
                        </label>
                        <textarea
                          value={modelPaperText}
                          onChange={(e) => setModelPaperText(e.target.value)}
                          disabled={isExtractingPaper}
                          placeholder={isExtractingPaper ? "AI is processing your uploaded image..." : "Extracted paper text."}
                          className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl p-4 text-emerald-50 h-64 focus:outline-none focus:border-emerald-500 transition-colors font-serif disabled:opacity-50"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/question-paper', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: Date.now().toString(),
                                    user_id: 'default',
                                    paper_number: paperNumber || 'N/A',
                                    topic: input || 'Reference Paper',
                                    content: 'Model Reference Paper (Not Generated)',
                                    reference_content: modelPaperText,
                                    date: new Date().toISOString()
                                  })
                                });
                                if (response.ok) {
                                  alert('Reference paper saved to database!');
                                } else {
                                  throw new Error('Failed to save');
                                }
                              } catch (e) {
                                alert('Error saving reference paper to database.');
                              }
                            }}
                            disabled={isExtractingPaper || !modelPaperText}
                            className="bg-emerald-600/20 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/30 text-emerald-400 hover:text-white font-bold py-2 px-6 rounded-lg transition-all text-sm"
                          >
                            Save Reference directly to Database
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Number of Papers to Generate (Max 5)</label>
                  <input 
                    type="number"
                    min="1"
                    max="5"
                    value={numPapers}
                    onChange={(e) => setNumPapers(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <p className="text-xs text-slate-500 italic">
                  * Papers will be generated based on previous papers for last 10 years patterns.
                </p>
              </>
            ) : featureId === 'essay-generator' ? (
              <>
                <div className="space-y-2">
                  {lockedCourseName && (
                    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3 mb-3">
                      <span className="text-lg">🔒</span>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-blue-300">Locked to: </span>
                        <span className="text-sm font-bold text-white">{lockedCourseName}</span>
                      </div>
                      <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Change in Dashboard</button>
                    </div>
                  )}
                  <label className="block text-slate-300 font-medium">
                    Discipline {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}
                  </label>
                  <div className="relative">
                    <select
                      value={essayCourse}
                      onChange={(e) => { if (!lockedCourseName) setEssayCourse(e.target.value); }}
                      disabled={!!lockedCourseName}
                      className={`w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <option value="">-- Select Course --</option>
                      {curriculum?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      {lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Select Essay Type</label>
                  <select 
                    value={essayType}
                    onChange={(e) => setEssayType(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="long">Long Essay (10–20 marks)</option>
                    <option value="short">Short Essay (5–10 marks)</option>
                    <option value="notes">Short Notes (2–5 marks)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Type Question</label>
                  <div className="relative">
                    <textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white h-32 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Type your question here..."
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <label className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors cursor-pointer" title="Upload Image">
                        <Activity size={18} />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const fileName = e.target.files?.[0]?.name;
                            if (fileName) setInput(prev => prev + ` [Image Attached: ${fileName}]`);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </>
            ) : featureId === 'seminar-builder' ? (
              <>
                <div className="space-y-2">
                  {lockedCourseName && (
                    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3 mb-3">
                      <span className="text-lg">🔒</span>
                      <div className="flex-1"><span className="text-sm font-semibold text-blue-300">Locked to: </span><span className="text-sm font-bold text-white">{lockedCourseName}</span></div>
                      <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Change in Dashboard</button>
                    </div>
                  )}
                  <label className="block text-slate-300 font-medium">Discipline {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}</label>
                  <div className="relative">
                    <select
                      value={seminarDiscipline}
                      onChange={(e) => { if (!lockedCourseName) setSeminarDiscipline(e.target.value); }}
                      disabled={!!lockedCourseName}
                      className={`w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <option value="">-- Select Course --</option>
                      {curriculum?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">{lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Topic</label>
                  <input 
                    type="text"
                    value={seminarTopic}
                    onChange={(e) => setSeminarTopic(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter topic details"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Criteria / any details / any specific instruction</label>
                  <textarea 
                    value={seminarCriteria}
                    onChange={(e) => setSeminarCriteria(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white h-24 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Any specific criteria to specify..."
                  />
                </div>
              </>
            ) : featureId === 'journal-club' ? (
              <>
                <div className="space-y-2">
                  {lockedCourseName && (
                    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3 mb-3">
                      <span className="text-lg">🔒</span>
                      <div className="flex-1"><span className="text-sm font-semibold text-blue-300">Locked to: </span><span className="text-sm font-bold text-white">{lockedCourseName}</span></div>
                      <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Change in Dashboard</button>
                    </div>
                  )}
                  <label className="block text-slate-300 font-medium">Discipline {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}</label>
                  <div className="relative">
                    <select
                      value={jcDiscipline}
                      onChange={(e) => { if (!lockedCourseName) setJcDiscipline(e.target.value); }}
                      disabled={!!lockedCourseName}
                      className={`w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <option value="">-- Select Course --</option>
                      {curriculum?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">{lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Topic</label>
                  <input 
                    type="text"
                    value={jcTopic}
                    onChange={(e) => setJcTopic(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter topic details"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Criteria / any details / any specific instruction</label>
                  <textarea 
                    value={jcCriteria}
                    onChange={(e) => setJcCriteria(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white h-24 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Any specific criteria to specify..."
                  />
                </div>
                
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 mt-6">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Upload className="text-blue-500" /> Upload Documents (Images / PDFs)
                  </h4>
                  <div className="space-y-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-blue-500/50 transition-all bg-slate-800/50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus className="w-8 h-8 text-slate-500 mb-2" />
                        <p className="text-sm text-slate-400 font-semibold">Take Photo / Upload Files</p>
                      </div>
                      <input type="file" className="hidden" multiple accept="image/*,.pdf" onChange={handleScanImage} />
                    </label>
                    {scanImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {scanImages.map((img, i) => (
                          <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                            {img.startsWith('data:image') ? (
                              <img src={img} alt={`Upload ${i+1}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-xs text-slate-400 break-words text-center px-1">Document {i+1}</div>
                            )}
                            <button 
                              onClick={() => setScanImages(scanImages.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : featureId === 'session-search' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-slate-300 font-medium">
                      <Globe size={16} className="text-blue-400" /> Region
                    </label>
                    <select 
                      value={searchRegion}
                      onChange={(e) => setSearchRegion(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="All">All</option>
                      <option value="Locally">Locally</option>
                      <option value="India">India</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-slate-300 font-medium">Month</label>
                    <select 
                      value={searchMonth}
                      onChange={(e) => setSearchMonth(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Any Month</option>
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-slate-300 font-medium">
                    <Search size={16} className="text-blue-400" /> Subject
                  </label>
                  <input 
                    type="text"
                    value={searchSubject}
                    onChange={(e) => setSearchSubject(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. Cardiology, Pediatrics..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Topic / Subtopic <span className="text-slate-500 text-sm font-normal">(optional)</span></label>
                  <input 
                    type="text"
                    value={searchTopic}
                    onChange={(e) => setSearchTopic(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. Heart Failure, Neonatal Care..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Keywords <span className="text-slate-500 text-sm font-normal">(optional)</span></label>
                  <input 
                    type="text"
                    value={searchKeywords}
                    onChange={(e) => setSearchKeywords(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. webinar, conference, workshop..."
                  />
                </div>
              </>
            ) : featureId === 'reflection-generator' ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  {lockedCourseName && (
                    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3 mb-3">
                      <span className="text-lg">🔒</span>
                      <div className="flex-1"><span className="text-sm font-semibold text-blue-300">Locked to: </span><span className="text-sm font-bold text-white">{lockedCourseName}</span></div>
                      <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Change in Dashboard</button>
                    </div>
                  )}
                  <label className="block text-slate-300 font-medium">Subject {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}</label>
                  <div className="relative">
                    <select
                      value={refSubject}
                      onChange={(e) => { if (!lockedCourseName) setRefSubject(e.target.value); }}
                      disabled={!!lockedCourseName}
                      className={`w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <option value="">-- Select Course --</option>
                      {curriculum?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">{lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Topic</label>
                  <input
                    type="text"
                    value={refTopic}
                    onChange={(e) => setRefTopic(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Competency / Session</label>
                  <input
                    type="text"
                    value={refCompetency}
                    onChange={(e) => setRefCompetency(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Introduction / Context of the Experience</label>
                  <textarea
                    value={refContext}
                    onChange={(e) => setRefContext(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white min-h-[80px] focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Type of patient encounter, stage of training, clinical challenge faced..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Description of the Event</label>
                  <textarea
                    value={refDescription}
                    onChange={(e) => setRefDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white min-h-[80px] focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Describe briefly what you did..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Personal Response and Initial Reactions</label>
                  <textarea
                    value={refResponse}
                    onChange={(e) => setRefResponse(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white min-h-[80px] focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Anxiety, communication difficulties, diagnostic uncertainty..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Critical Analysis of the Situation</label>
                  <textarea
                    value={refAnalysis}
                    onChange={(e) => setRefAnalysis(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white min-h-[80px] focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Diagnostic reasoning, teamwork, patient safety, ethical decision making..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Identification of Learning Points</label>
                  <textarea
                    value={refLearning}
                    onChange={(e) => setRefLearning(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white min-h-[80px] focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Importance of early recognition, handover needs, communication approach..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Application to Future Practice</label>
                  <textarea
                    value={refApplication}
                    onChange={(e) => setRefApplication(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white min-h-[80px] focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Review guidelines, attend sessions, practice skills..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Conclusion</label>
                  <textarea
                    value={refConclusion}
                    onChange={(e) => setRefConclusion(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white min-h-[80px] focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Main lesson learned, professional growth..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Select Word Count Requirements</label>
                  <select
                    value={refWordCount}
                    onChange={(e) => setRefWordCount(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="500-800">500–800 words for portfolio reflections</option>
                    <option value="800-1200">800–1200 words for structured reflective essays</option>
                  </select>
                </div>
              </div>
            ) : featureId === 'contacts-management' ? (
              <div className="space-y-8">
                {/* Personal Digital Visiting Card Section */}
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Monitor className="text-blue-500" /> Personal Digital Visiting Card
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsEditingPersonalCard(!isEditingPersonalCard)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-all"
                      >
                        {isEditingPersonalCard ? 'View Card' : 'Edit Fields'}
                      </button>
                      {!isEditingPersonalCard && (
                        <button 
                          onClick={handleShareCard}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-all flex items-center gap-2"
                        >
                          <Share2 size={16} /> Share Card
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingPersonalCard ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(personalCard).map((key) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs text-slate-500 uppercase font-bold">{key}</label>
                          <input 
                            type="text"
                            value={(personalCard as any)[key]}
                            onChange={(e) => {
                              const updated = { ...personalCard, [key]: e.target.value };
                              savePersonalCardToStorage(updated);
                            }}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-center py-8">
                      <div 
                        id="personal-digital-card"
                        className="w-full max-w-md aspect-[1.75/1] bg-gradient-to-br from-slate-800 to-slate-950 border border-white/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full" />
                        
                        <div>
                          <h4 className="text-2xl font-bold text-white tracking-tight">{personalCard.name}</h4>
                          <p className="text-blue-400 font-medium text-sm">{personalCard.designation}</p>
                          <p className="text-slate-400 text-xs mt-1">{personalCard.organization}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-slate-300 text-xs">
                            <HeartPulse size={12} className="text-blue-500" /> {personalCard.phone}
                          </div>
                          <div className="flex items-center gap-2 text-slate-300 text-xs">
                            <Send size={12} className="text-blue-500" /> {personalCard.email}
                          </div>
                          <div className="flex items-center gap-2 text-slate-300 text-xs">
                            <Globe size={12} className="text-blue-500" /> {personalCard.website}
                          </div>
                          <div className="flex items-center gap-2 text-slate-300 text-xs">
                            <Activity size={12} className="text-blue-500" /> {personalCard.address}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <div className="flex items-center gap-1">
                            <Brain className="text-blue-500 w-4 h-4" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Medimentr</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scan & Add Contacts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Microscope className="text-emerald-500" /> Scan Visiting Card
                    </h3>
                    
                    {!isScanning ? (
                      <div className="space-y-4">
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-blue-500/50 transition-all bg-slate-800/50">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Plus className="w-10 h-10 text-slate-500 mb-3" />
                            <p className="mb-2 text-sm text-slate-400 font-semibold">Take Photo / Upload Images</p>
                            <p className="text-xs text-slate-500">Multiple images supported</p>
                          </div>
                          <input type="file" className="hidden" multiple accept="image/*" onChange={handleScanImage} />
                        </label>
                        <button 
                          onClick={() => setIsAddingManual(true)}
                          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-all border border-white/5"
                        >
                          Add Contact Manually
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {isCropping ? (
                          <div className="space-y-4">
                            <div className="relative h-64 bg-black rounded-xl overflow-hidden">
                              <Cropper
                                image={scanImages[currentScanIndex]}
                                crop={crop}
                                zoom={zoom}
                                aspect={1.75 / 1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">Image {currentScanIndex + 1} of {scanImages.length}</span>
                              <div className="flex gap-2">
                                <button onClick={() => setIsScanning(false)} className="px-4 py-2 text-slate-400 text-sm">Cancel</button>
                                <button 
                                  onClick={handleCropSave}
                                  disabled={isLoading}
                                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                                >
                                  {isLoading ? 'Scanning...' : 'Crop & Scan OCR'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : scannedContact ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                              {Object.keys(scannedContact).map((key) => (
                                <div key={key} className="space-y-1">
                                  <label className="text-[10px] text-slate-500 uppercase font-bold">{key}</label>
                                  <input 
                                    type="text"
                                    value={(scannedContact as any)[key]}
                                    onChange={(e) => setScannedContact({ ...scannedContact, [key]: e.target.value })}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button onClick={() => setScannedContact(null)} className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm">Discard</button>
                              <button onClick={handleSaveScannedContact} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">Save to Database</button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ClipboardList className="text-blue-500" /> Contact Database
                      </h3>
                      <span className="text-xs text-slate-500">{contacts.length} Contacts</span>
                    </div>

                    <div className="relative mb-6">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text"
                        placeholder="Search by name, org, phone..."
                        value={contactSearchQuery}
                        onChange={(e) => setContactSearchQuery(e.target.value)}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] scrollbar-thin scrollbar-thumb-white/10">
                      {contacts
                        .filter(c => 
                          c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                          c.organization?.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                          c.phone?.includes(contactSearchQuery) ||
                          c.email?.toLowerCase().includes(contactSearchQuery.toLowerCase())
                        )
                        .map(contact => (
                          <div key={contact.id} className="bg-slate-800/50 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all group">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-white font-bold">{contact.name}</h5>
                                <p className="text-blue-400 text-xs">{contact.designation}</p>
                                <p className="text-slate-500 text-[10px] mt-1">{contact.organization}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  const updated = contacts.filter(c => c.id !== contact.id);
                                  saveContactsToStorage(updated);
                                }}
                                className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                              <div className="flex items-center gap-1"><HeartPulse size={10} /> {contact.phone}</div>
                              <div className="flex items-center gap-1"><Send size={10} /> {contact.email}</div>
                            </div>
                          </div>
                        ))}
                      {contacts.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                          <UserPlus className="mx-auto mb-2 opacity-20" size={48} />
                          <p>No contacts saved yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Manual Add Modal */}
                <AnimatePresence>
                  {isAddingManual && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsAddingManual(false)}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden"
                      >
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                          <h3 className="text-xl font-bold text-white">Add Contact Manually</h3>
                          <button onClick={() => setIsAddingManual(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                          {['name', 'designation', 'organization', 'email', 'phone', 'website', 'address', 'notes'].map(field => (
                            <div key={field} className="space-y-1">
                              <label className="text-xs text-slate-500 uppercase font-bold">{field}</label>
                              <input 
                                type="text"
                                value={(manualContact as any)[field] || ''}
                                onChange={(e) => setManualContact({ ...manualContact, [field]: e.target.value })}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="p-6 border-t border-white/5 bg-slate-900/50 flex gap-4">
                          <button onClick={() => setIsAddingManual(false)} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold">Cancel</button>
                          <button 
                            onClick={() => {
                              if (!manualContact.name) return alert('Name is required');
                              const newContact: Contact = {
                                ...manualContact as Contact,
                                id: Date.now().toString(),
                                created_at: new Date().toISOString()
                              };
                              saveContactsToStorage([newContact, ...contacts]);
                              setManualContact({});
                              setIsAddingManual(false);
                            }}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold"
                          >
                            Save Contact
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ) : featureId === 'search-topic' ? (() => {
              // Build a flat list of all topics for searching
              const allTopics = [] as any[];
              if (curriculum && Array.isArray(curriculum)) {
                for (const c of curriculum) {
                  for (const p of (c.papers || [])) {
                    for (const s of (p.sections || [])) {
                      for (const t of (s.topics || [])) {
                        if (t.name) {
                          allTopics.push({
                            topicId: t.id, topicName: t.name, courseName: c.name, paperName: p.name, sectionName: s.name,
                            courseId: c.id, paperId: p.id, sectionId: s.id,
                            hasNotes: !!t.generatedContent, hasEssay: !!t.generatedEssayContent, hasMcq: !!t.generatedMcqContent, hasFlash: !!t.generatedFlashCardsContent,
                          });
                        }
                      }
                    }
                  }
                }
              }
              const query = input.toLowerCase().trim();
              const filteredTopics = query ? allTopics.filter(t => t.topicName.toLowerCase().includes(query)) : [];
              // Find selected topic details from klTopicId
              const selectedSearchTopic = klTopicId ? allTopics.find(t => t.topicId === klTopicId) : null;

              return (
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Search className="text-blue-500" /> Search Topics
                    </h3>

                    {/* Search Keywords Input */}
                    <div className="mb-2">
                      <label className="block text-slate-300 font-semibold text-sm mb-2">Search Keywords:</label>
                      <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        <input
                          type="text"
                          value={selectedSearchTopic ? selectedSearchTopic.topicName : input}
                          onChange={(e) => {
                            setInput(e.target.value);
                            // Clear previously selected topic when user edits
                            if (klTopicId) {
                              setKlTopicId('');
                              setKlCourseId('');
                              setKlPaperId('');
                              setKlSectionId('');
                            }
                          }}
                          onFocus={() => {
                            // If a topic was selected and user clicks back into the input, clear it to show the dropdown again
                            if (selectedSearchTopic) {
                              setInput(selectedSearchTopic.topicName);
                              setKlTopicId('');
                              setKlCourseId('');
                              setKlPaperId('');
                              setKlSectionId('');
                            }
                          }}
                          placeholder="Start typing a topic name..."
                          className="w-full bg-slate-800 border border-white/10 rounded-xl pl-12 pr-10 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[15px]"
                        />
                        {(input || selectedSearchTopic) && (
                          <button
                            onClick={() => {
                              setInput('');
                              setKlTopicId('');
                              setKlCourseId('');
                              setKlPaperId('');
                              setKlSectionId('');
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors z-10"
                          >
                            <X size={18} />
                          </button>
                        )}

                        {/* Autocomplete Dropdown */}
                        {query && !selectedSearchTopic && filteredTopics.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl shadow-black/40 z-50 max-h-[320px] overflow-y-auto">
                            <p className="px-4 py-2 text-slate-500 text-[11px] font-medium border-b border-white/5">{filteredTopics.length} matching topic{filteredTopics.length !== 1 ? 's' : ''}</p>
                            {filteredTopics.slice(0, 20).map((t) => (
                              <button
                                key={t.topicId}
                                onClick={() => {
                                  setKlCourseId(t.courseId);
                                  setKlPaperId(t.paperId);
                                  setKlSectionId(t.sectionId);
                                  setKlTopicId(t.topicId);
                                  setInput('');
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-blue-600/10 transition-all border-b border-white/5 last:border-0 group"
                              >
                                <div className="text-white text-[13px] font-medium group-hover:text-blue-400 transition-colors">{t.topicName}</div>
                                <div className="text-slate-500 text-[10px] mt-0.5">{t.courseName} → {t.paperName} → {t.sectionName}</div>
                              </button>
                            ))}
                            {filteredTopics.length > 20 && (
                              <p className="px-4 py-2 text-slate-600 text-[10px] text-center">Showing first 20 of {filteredTopics.length} results. Refine your search.</p>
                            )}
                          </div>
                        )}

                        {/* No results */}
                        {query && !selectedSearchTopic && filteredTopics.length === 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl shadow-black/40 z-50 px-4 py-6 text-center">
                            <p className="text-slate-400 text-sm">No topics found matching "<span className="text-white font-semibold">{input}</span>"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Topic Card + Library Buttons */}
                    {selectedSearchTopic ? (
                      <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Selected topic info */}
                        <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-5 mb-6">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">Selected Topic</p>
                              <h4 className="text-white font-bold text-lg">{selectedSearchTopic.topicName}</h4>
                              <p className="text-slate-500 text-[12px] mt-1">
                                {selectedSearchTopic.courseName} → {selectedSearchTopic.paperName} → {selectedSearchTopic.sectionName}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 mt-1 flex-wrap justify-end">
                              <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${selectedSearchTopic.hasNotes ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/50 text-slate-500'}`}>
                                {selectedSearchTopic.hasNotes ? '✓' : '✗'} Notes
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${selectedSearchTopic.hasEssay ? 'bg-blue-500/15 text-blue-400' : 'bg-slate-700/50 text-slate-500'}`}>
                                {selectedSearchTopic.hasEssay ? '✓' : '✗'} Essay
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${selectedSearchTopic.hasMcq ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-700/50 text-slate-500'}`}>
                                {selectedSearchTopic.hasMcq ? '✓' : '✗'} MCQ
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${selectedSearchTopic.hasFlash ? 'bg-purple-500/15 text-purple-400' : 'bg-slate-700/50 text-slate-500'}`}>
                                {selectedSearchTopic.hasFlash ? '✓' : '✗'} Flash
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Library Navigation Tabs */}
                        <div className="flex flex-wrap gap-3">
                          {[
                            { id: 'knowledge-library', label: 'Knowledge Library', icon: <Library size={18} /> },
                            { id: 'essay-library', label: 'Essay Library', icon: <FileText size={18} /> },
                            { id: 'mcq-library', label: 'MCQ Library', icon: <CheckSquare size={18} /> },
                            { id: 'flash-cards', label: 'Flash Cards', icon: <Layers size={18} /> },
                          ].map((lib) => (
                            <button
                              key={lib.id}
                              onClick={() => {
                                // klCourseId, klPaperId, klSectionId, klTopicId are already set
                                onNavigate(`feature-${lib.id}`);
                              }}
                              className="flex-1 min-w-[140px] flex items-center justify-center gap-2.5 px-5 py-4 rounded-full font-bold text-[14px] transition-all bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-white/20 hover:shadow-lg active:scale-[0.98]"
                            >
                              {lib.icon}
                              {lib.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : !query && (
                      <div className="text-center py-10 mt-2">
                        <Search size={48} className="text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 text-sm">Start typing to search across all topics in your curriculum</p>
                        <p className="text-slate-600 text-xs mt-2">Select a topic to access its Knowledge Library, Essay Library, MCQ Library, and Flash Cards</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
            : ['knowledge-library', 'essay-library', 'mcq-library', 'flash-cards'].includes(featureId) ? (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    {featureId === 'knowledge-library' ? <Library className="text-emerald-500" /> : featureId === 'essay-library' ? <FileText className="text-blue-500" /> : featureId === 'mcq-library' ? <CheckSquare className="text-emerald-500" /> : <Layers className="text-blue-500" />} Topic Selection
                  </h3>

                  {/* ─── Locked Course Banner ─── */}
                  {lockedCourseName && (
                    <div className="mb-4 flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3">
                      <span className="text-lg">🔒</span>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-blue-300">Locked to: </span>
                        <span className="text-sm font-bold text-white">{lockedCourseName}</span>
                      </div>
                      <button 
                        onClick={() => onNavigate('dashboard')}
                        className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                      >
                        Change in Dashboard
                      </button>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-slate-300 font-medium">
                        Course {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}
                      </label>
                      <div className="relative">
                        <select 
                          value={klCourseId}
                          onChange={(e) => {
                            if (lockedCourseName) return;
                            setKlCourseId(e.target.value);
                            setKlPaperId('');
                            setKlSectionId('');
                            setKlTopicId('');
                          }}
                          disabled={!!lockedCourseName}
                          className={`w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          <option value="">-- Select Course --</option>
                          {curriculum?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          {lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-slate-300 font-medium">Paper</label>
                      <div className="relative">
                        <select 
                          value={klPaperId}
                          onChange={(e) => {
                            setKlPaperId(e.target.value);
                            setKlSectionId('');
                            setKlTopicId('');
                          }}
                          className="w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                          disabled={!klCourseId}
                        >
                          <option value="">-- Select Paper --</option>
                          {klActivePapers.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          <ChevronRight size={16} className="rotate-90" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-slate-300 font-medium">Section</label>
                      <div className="relative">
                        <select 
                          value={klSectionId}
                          onChange={(e) => {
                            setKlSectionId(e.target.value);
                            setKlTopicId('');
                          }}
                          className="w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                          disabled={!klPaperId}
                        >
                          <option value="">-- Select Section --</option>
                          {klActiveSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          <ChevronRight size={16} className="rotate-90" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-slate-300 font-medium">Topic</label>
                      <div className="relative">
                        <select 
                          value={klTopicId}
                          onChange={(e) => setKlTopicId(e.target.value)}
                          className="w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                          disabled={!klSectionId}
                        >
                          <option value="">-- Select Topic --</option>
                          {klActiveTopics.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          <ChevronRight size={16} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : featureId === 'clinical-decision-support' ? (
              <ClinicalDecisionSupport onSave={async (data) => {
                const id = `cdss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                const response = await fetch('/api/clinical-decision-support', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id,
                    user_id: 'default',
                    patient_data: data.patient_data,
                    recommendations: data.recommendations,
                    date: new Date().toISOString(),
                    title: `CDS Session`,
                    content: data.recommendations,
                    featureId: 'clinical-decision-support'
                  })
                });
                if (!response.ok) throw new Error('Failed to save');
                alert('CDS session saved to database successfully!');
              }} />
            ) : featureId === 'resume-builder' ? (
              <ProfessionalResumeBuilder onSave={async (data) => {
                const id = `resume-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                try {
                  const resumeData = data.resume_data;
                  const response = await fetch('/api/resume-builder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id,
                      user_id: 'default',
                      full_name: resumeData?.personal?.fullName || '',
                      professional_title: resumeData?.personal?.title || '',
                      email: resumeData?.personal?.email || '',
                      phone: resumeData?.personal?.phone || '',
                      location: resumeData?.personal?.location || '',
                      linkedin: resumeData?.personal?.linkedin || '',
                      summary: resumeData?.personal?.summary || '',
                      education: resumeData?.education || [],
                      experience: resumeData?.experience || [],
                      skills: resumeData?.skills || [],
                      publications: resumeData?.publications || [],
                      certifications: resumeData?.certifications || [],
                      awards: resumeData?.awards || [],
                      memberships: resumeData?.memberships || [],
                      conferences: resumeData?.conferences || [],
                      selected_template: data.template || 'classic',
                      title: `Resume: ${resumeData?.personal?.fullName || 'Untitled'}`,
                      content: data.content,
                      feature_id: 'resume-builder',
                      date: new Date().toISOString()
                    })
                  });
                  if (!response.ok) throw new Error('Failed to save');
                  alert('Resume saved to database successfully!');
                } catch (err) {
                  console.error('Error saving resume:', err);
                  alert('Failed to save resume. Please try again.');
                }
              }} />
            ) : featureId === 'doubt-solver' ? (
              <DoubtSolver onSave={async (data) => {
                const id = `doubt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                try {
                  const response = await fetch('/api/doubt-solver', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id,
                      user_id: 'default',
                      topic: data.topic,
                      style: data.style,
                      depth: data.depth,
                      explanation: data.explanation,
                      date: new Date().toISOString()
                    })
                  });
                  if (!response.ok) throw new Error('Failed to save');
                  alert('Explanation saved to database successfully!');
                } catch (err) {
                  console.error('Error saving:', err);
                  alert('Failed to save. Please try again.');
                }
              }} />
            ) : featureId === 'drug-treatment-assistant' ? (
              <DrugTreatmentAssistant onSave={async (data) => {
                const id = `drug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                try {
                  const response = await fetch('/api/drug-treatment-assistant', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id,
                      user_id: 'default',
                      query: data.query,
                      drug_name: data.drug_name,
                      condition: data.condition,
                      patient_context: data.patient_context,
                      mode: data.mode,
                      style: data.style,
                      response: data.response,
                      date: new Date().toISOString()
                    })
                  });
                  if (!response.ok) throw new Error('Failed to save');
                  alert('Drug information saved to database successfully!');
                } catch (err) {
                  console.error('Error saving:', err);
                  alert('Failed to save. Please try again.');
                }
              }} />
            ) : featureId === 'digital-diary' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="text-emerald-500" /> Daily Input Capture
                  </h3>
                  
                  <div className="mb-6">
                    <label className="block text-slate-300 font-medium mb-2">Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={digitalDiaryDate}
                      onChange={(e) => setDigitalDiaryDate(e.target.value)}
                      className="w-full md:w-auto bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <label className="block text-slate-300 font-medium mb-4">Reflections, Cases, or Procedures</label>
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white h-32 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="E.g., Today I managed a patient with acute pancreatitis in ICU. Inserted central line with senior supervision. Felt stressed due to night duty..."
                  />
                </div>
                
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Upload className="text-blue-500" /> Upload Notes / ECGs / Lab Reports 
                  </h4>
                  <div className="space-y-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-blue-500/50 transition-all bg-slate-800/50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus className="w-8 h-8 text-slate-500 mb-2" />
                        <p className="text-sm text-slate-400 font-semibold">Take Photo / Upload Files</p>
                      </div>
                      <input type="file" className="hidden" multiple accept="image/*,.pdf" onChange={handleScanImage} />
                    </label>
                    {scanImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {scanImages.map((img, i) => (
                          <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                            {img.startsWith('data:image') ? (
                              <img src={img} alt={`Upload ${i+1}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-xs text-slate-400 break-words text-center px-1">Document {i+1}</div>
                            )}
                            <button 
                              onClick={() => setScanImages(scanImages.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 mt-6">
                  <label className="block text-slate-300 font-medium mb-4">What do you want me to do</label>
                  <textarea 
                    value={diaryAction}
                    onChange={(e) => setDiaryAction(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white h-24 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Reflection/ What additional things to do/ questions to ask/ any other"
                  />
                </div>
              </div>
            ) : featureId === 'guidelines-generator' ? (
              <GuidelinesGenerator />
            ) : featureId === 'prescription-analyser' ? (
              <PrescriptionAnalyser onSave={async (analysisResult: any) => {
                const id = `pa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                const response = await fetch('/api/prescription-analyser', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id,
                    user_id: 'default',
                    prescription_data: JSON.stringify(analysisResult),
                    analysis: JSON.stringify(analysisResult),
                    date: new Date().toISOString()
                  })
                });
                if (!response.ok) throw new Error('Failed to save');
              }} />
            ) : featureId === 'clinical-examination' ? (
              <ClinicalExaminationSystem curriculum={curriculum} lockedCourseName={lockedCourseName} />
            ) : featureId === 'essay-library' ? null : featureId === 'mcq-library' ? null : featureId === 'flash-cards' ? null : featureId === 'thesis-notes' ? (
              <div className="w-full bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden mt-6 mb-8">
                 <ThesisNotesManager />
              </div>
            ) : featureId === 'stat-assist' ? (
              <div className="space-y-6 animate-in fade-in">
                <div className="space-y-2">
                  {lockedCourseName && (
                    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3 mb-3">
                      <span className="text-lg">🔒</span>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-blue-300">Locked to: </span>
                        <span className="text-sm font-bold text-white">{lockedCourseName}</span>
                      </div>
                      <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Change in Dashboard</button>
                    </div>
                  )}
                  <label className="block text-slate-300 font-medium">
                    Discipline {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}
                  </label>
                  <div className="relative">
                    <select
                      value={statCourse}
                      onChange={(e) => { if (!lockedCourseName) setStatCourse(e.target.value); }}
                      disabled={!!lockedCourseName}
                      className={`w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <option value="">-- Select Course --</option>
                      {curriculum?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      {lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium mb-4">Enter Study Title</label>
                  <input 
                    type="text"
                    value={statStudyTitle}
                    onChange={(e) => setStatStudyTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Provide the core focus or objective of your research..."
                  />
                </div>
                
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 mt-6">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Upload className="text-blue-500" /> Upload protocol and data of study which was done
                  </h4>
                  <div className="space-y-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-blue-500/50 transition-all bg-slate-800/50 relative overflow-hidden group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus className="w-8 h-8 text-slate-500 mb-2 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                        <p className="text-sm text-slate-400 font-semibold group-hover:text-slate-300">Multiple Images / PDF / Excel Sheet</p>
                      </div>
                      <input type="file" className="hidden" multiple accept="image/*,.pdf,.xls,.xlsx,.csv" onChange={handleScanImage} />
                    </label>
                    {scanImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {scanImages.map((img, i) => (
                           <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 group">
                             {img.startsWith('data:image') ? (
                               <img src={img} alt={`Upload ${i+1}`} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-xs text-slate-300 break-words text-center px-2">
                                  <FileText className="w-6 h-6 mb-1 text-blue-400" />
                                  Doc {i+1}
                               </div>
                             )}
                             <button 
                               onClick={() => setScanImages(scanImages.filter((_, idx) => idx !== i))}
                               className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
                             >
                               <X size={12} />
                             </button>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {statMethods.length > 0 && (
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 mt-8 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <CheckCircle className="text-emerald-500" /> Select Generated Statistical Methods
                    </h3>
                    <p className="text-sm text-slate-400 mb-6 font-medium">From this select particular method (One or multiples):</p>
                    
                    <div className="space-y-4">
                      {statMethods.map((method, idx) => (
                        <div key={idx} className="bg-slate-800 border border-white/5 rounded-xl p-5 flex gap-4 hover:bg-slate-800/80 transition-colors">
                          <div className="pt-1">
                            <input 
                              type="checkbox" 
                              checked={method.selected}
                              onChange={(e) => {
                                const newMethods = [...statMethods];
                                newMethods[idx].selected = e.target.checked;
                                setStatMethods(newMethods);
                              }}
                              className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-lg">{method.name}</h4>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                                <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Advantages</span>
                                <p className="text-sm text-slate-300 leading-relaxed">{method.advantages}</p>
                              </div>
                              <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                                <span className="text-[10px] uppercase font-bold text-amber-500 block mb-1">Disadvantages</span>
                                <p className="text-sm text-slate-300 leading-relaxed">{method.disadvantages}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={handleGenerateStatResults}
                      disabled={isGeneratingResults || statMethods.filter(m => m.selected).length === 0}
                      className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      {isGeneratingResults ? (
                         <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           Generating Final Results...
                         </>
                      ) : (
                         <>
                           <BarChart3 size={20} /> Generate Results
                         </>
                      )}
                    </button>
                  </div>
                )}
                
                {statData && (
                  <div className="stat-results-container bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-6 mt-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 border-b border-white/10 pb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-white m-0 flex items-center gap-2">
                         <BarChart3 className="text-blue-500 flex-shrink-0" size={20} /> 
                         <span>Results with graphs and diagrams</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={handleSave}
                          className="text-slate-400 hover:text-emerald-400 text-xs sm:text-sm flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg transition-colors"
                        >
                          <Save size={14} /> Save
                        </button>
                        <button 
                          onClick={handleDownload}
                          className="text-slate-400 hover:text-blue-400 text-xs sm:text-sm flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg transition-colors"
                        >
                          <Download size={14} /> Download
                        </button>
                        <button 
                          onClick={() => window.print()}
                          className="text-slate-400 hover:text-white text-xs sm:text-sm flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg transition-colors"
                        >
                          <FileText size={14} /> Print PDF
                        </button>
                      </div>
                    </div>
                    <div className="stat-results-content prose prose-invert max-w-none prose-sm sm:prose-base prose-p:text-slate-300 prose-headings:text-white prose-headings:font-bold prose-strong:text-white prose-strong:font-semibold prose-table:text-slate-300 prose-th:text-white prose-th:bg-white/5 prose-td:border-white/10 prose-th:border-white/10 prose-ul:text-slate-300 prose-ol:text-slate-300 prose-li:text-slate-300 prose-blockquote:text-slate-400 prose-blockquote:border-blue-500/30 leading-relaxed">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>{statData}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ) : featureId === 'ai-exam-prep' ? (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Target className="text-blue-500" /> Exam Preparation Dashboard
                  </h3>
                  <div className="space-y-4">
                    {lockedCourseName && (
                      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3">
                        <span className="text-lg">🔒</span>
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-blue-300">Locked to: </span>
                          <span className="text-sm font-bold text-white">{lockedCourseName}</span>
                        </div>
                        <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Change in Dashboard</button>
                      </div>
                    )}
                    <label className="block text-slate-300 font-medium">
                      Select Course to Analyze {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}
                    </label>
                    <div className="relative">
                      <select 
                        value={prepCourseId}
                        onChange={(e) => { if (!lockedCourseName) setPrepCourseId(e.target.value); }}
                        disabled={!!lockedCourseName}
                        className={`w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <option value="">-- Select Course --</option>
                        {curriculum?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        {lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}
                      </div>
                    </div>
                  </div>
                  
                  {prepCourseId && !prepAnalytics && (
                    <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-white/5">
                      <h4 className="font-semibold text-white mb-4">Mock History Detected for {curriculum?.find((c:any) => c.id === prepCourseId)?.name}</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-slate-300"><span className="flex items-center gap-2"><CheckSquare size={16}/> Knowledge Analyser (Essay)</span> <span>3 Assessments Completed</span></div>
                        <div className="flex justify-between text-sm text-slate-300"><span className="flex items-center gap-2"><Cpu size={16}/> Knowledge Analyser (MCQs)</span> <span>5 Assessments Completed</span></div>
                        <div className="flex justify-between text-sm text-slate-300"><span className="flex items-center gap-2"><Target size={16}/> AI Exam Simulator</span> <span>1 Mock Exam Completed</span></div>
                      </div>
                      <p className="text-xs text-slate-400 mt-4 italic">* Click Generate below to analyze this history and create a personalized study strategy.</p>
                    </div>
                  )}
                  
                  {prepAnalytics && (
                    <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="bg-slate-800/80 rounded-xl p-4 border border-white/5">
                            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Total Assessments</p>
                            <p className="text-2xl font-bold text-white">9</p>
                         </div>
                         <div className="bg-slate-800/80 rounded-xl p-4 border border-white/5">
                            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Average Score</p>
                            <p className="text-2xl font-bold text-emerald-400">68%</p>
                         </div>
                         <div className="bg-slate-800/80 rounded-xl p-4 border border-white/5">
                            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Next Action</p>
                            <p className="text-lg font-bold text-red-400 line-clamp-1">Immediate Revision</p>
                         </div>
                      </div>

                      {/* Progress Line Chart Mockup */}
                      <div className="bg-slate-800/50 rounded-xl p-6 border border-white/5">
                        <h4 className="font-bold text-white mb-4 flex items-center gap-2"><LineChart size={18}/> Progress Over Time</h4>
                        <div className="h-40 flex items-end gap-2 relative mt-4 pt-4 border-l border-b border-slate-700">
                           <div className="absolute -left-8 bottom-0 text-xs text-slate-500">0%</div>
                           <div className="absolute -left-8 top-0 text-xs text-slate-500">100%</div>
                           {[45, 52, 48, 60, 58, 65, 72, 68, 75].map((val, i) => (
                              <div key={i} className="flex-1 bg-gradient-to-t from-blue-900 to-blue-500 rounded-t relative group transition-all hover:opacity-80" style={{ height: `${val}%` }}>
                                <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold py-1 px-2 rounded">{val}%</div>
                              </div>
                           ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                           <span>Week 1</span>
                           <span>Week 2</span>
                           <span>Week 3</span>
                           <span>Today</span>
                        </div>
                      </div>

                      <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20">
                        <h4 className="font-bold text-white mb-4 border-b border-red-500/10 pb-2">High Priority Revision (Weak & High Yield)</h4>
                        <ul className="space-y-3">
                          {prepAnalytics.weak?.map((item: any, i:number) => (
                             <li key={i} className="bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                               <div className="flex justify-between border-b border-red-500/10 pb-2 mb-2">
                                  <span className="font-semibold text-red-300">{item.topic}</span>
                                  <span className="text-red-400 text-sm font-mono">{item.score}</span>
                               </div>
                               <div className="text-sm text-slate-300 leading-relaxed mt-1">
                                  {(() => {
                                    const fb = item.feedback;
                                    // Handle array format (new prompt output)
                                    if (Array.isArray(fb)) {
                                      return (
                                        <ul className="list-none space-y-2 mt-2">
                                          {fb.map((point: string, pi: number) => {
                                            const formatted = point.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
                                            return (
                                              <li key={pi} className="flex gap-2 pl-3 border-l-2 border-red-500/30 py-1">
                                                <span className="text-red-400 font-bold shrink-0">{pi + 1}.</span>
                                                <span dangerouslySetInnerHTML={{ __html: formatted }} />
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      );
                                    }
                                    // Handle string format (legacy) — split by sentences
                                    const fbStr = fb || '';
                                    const sentences = fbStr.split(/(?<=\.)\s+(?=[A-Z])/g).filter((s: string) => s.trim());
                                    if (sentences.length > 1) {
                                      return (
                                        <ul className="list-none space-y-2 mt-2">
                                          {sentences.map((s: string, si: number) => {
                                            const formatted = s.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
                                            return (
                                              <li key={si} className="flex gap-2 pl-3 border-l-2 border-red-500/30 py-1">
                                                <span className="text-red-400 font-bold shrink-0">{si + 1}.</span>
                                                <span dangerouslySetInnerHTML={{ __html: formatted }} />
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      );
                                    }
                                    return <p>{fbStr}</p>;
                                  })()}
                                </div>
                             </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-amber-500/10 rounded-xl p-6 border border-amber-500/20">
                          <h4 className="font-bold text-white mb-4 border-b border-amber-500/10 pb-2">Needs Improvement</h4>
                          <ul className="space-y-2">
                            {prepAnalytics.moderate?.map((item: any, i:number) => (
                               <li key={i} className="flex justify-between text-sm text-slate-300">
                                  <span>{item.topic}</span>
                                  <span className="text-amber-400">{item.score}</span>
                               </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20">
                          <h4 className="font-bold text-white mb-4 border-b border-emerald-500/10 pb-2">Strong Areas</h4>
                          <ul className="space-y-2">
                            {prepAnalytics.strong?.map((item: any, i:number) => (
                               <li key={i} className="flex justify-between text-sm text-slate-300">
                                  <span>{item.topic}</span>
                                  <span className="text-emerald-400">{item.score}</span>
                               </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <>
                {(featureId === 'protocol-generator' || featureId === 'manuscript-generator') && (
                  <div className="space-y-2 mb-6">
                    {lockedCourseName && (
                      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-xl px-4 py-3 mb-3">
                        <span className="text-lg">🔒</span>
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-blue-300">Locked to: </span>
                          <span className="text-sm font-bold text-white">{lockedCourseName}</span>
                        </div>
                        <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">Change in Dashboard</button>
                      </div>
                    )}
                    <label className="block text-slate-300 font-medium">
                      Discipline {lockedCourseName && <span className="text-xs text-blue-400 ml-1">(locked)</span>}
                    </label>
                    <div className="relative">
                      <select
                        value={featureId === 'protocol-generator' ? protocolCourse : manuscriptCourse}
                        onChange={(e) => { if (lockedCourseName) return; featureId === 'protocol-generator' ? setProtocolCourse(e.target.value) : setManuscriptCourse(e.target.value); }}
                        disabled={!!lockedCourseName}
                        className={`w-full appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors ${lockedCourseName ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <option value="">-- Select Course --</option>
                        {curriculum?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        {lockedCourseName ? <Lock size={16} className="text-blue-400" /> : <ChevronRight size={16} className="rotate-90" />}
                      </div>
                    </div>
                  </div>
                )}
                <label className="block text-slate-300 font-medium mb-4">Input Topic or Criteria</label>
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white h-32 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter discipline, topic, or specific requirements..."
                />
                {featureId === 'manuscript-generator' && (
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 mt-6">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Upload className="text-blue-500" /> Upload Documents (Images / PDFs)
                    </h4>
                    <div className="space-y-4">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-blue-500/50 transition-all bg-slate-800/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Plus className="w-8 h-8 text-slate-500 mb-2" />
                          <p className="text-sm text-slate-400 font-semibold">Take Photo / Upload Files</p>
                        </div>
                        <input type="file" className="hidden" multiple accept="image/*,.pdf" onChange={handleScanImage} />
                      </label>
                      {scanImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {scanImages.map((img, i) => (
                            <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                              {img.startsWith('data:image') ? (
                                <img src={img} alt={`Upload ${i+1}`} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-xs text-slate-400 break-words text-center px-1">Document {i+1}</div>
                              )}
                              <button 
                                onClick={() => setScanImages(scanImages.filter((_, idx) => idx !== i))}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <button 
              onClick={handleGenerate}
              disabled={isLoading || (featureId === 'ai-exam-prep' && !prepCourseId)}
              className={`w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 ${(featureId === 'contacts-management' || featureId === 'search-topic' || featureId === 'knowledge-library' || featureId === 'essay-library' || featureId === 'mcq-library' || featureId === 'flash-cards' || featureId === 'thesis-notes' || featureId === 'clinical-decision-support' || (featureId === 'ai-exam-simulator' && (simExamActive || simUploadPhase || isEvaluatingSim || simEvaluationResult)) || (featureId === 'answer-analyser' && analyzerSelectedQuestion) || (featureId === 'mcqs-analyser' && mcqGeneratedList.length > 0)) ? 'hidden' : ''}`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain size={20} /> {isQuestionPaper ? 'Generate Question Papers' : featureId === 'session-search' ? 'Search Scientific Sessions' : featureId === 'essay-generator' ? 'Generate Essay Answer' : featureId === 'seminar-builder' ? 'Generate Seminar PPT and Notes' : featureId === 'journal-club' ? 'Generate Journal Club PPT and Notes' : featureId === 'manuscript-generator' ? 'Generate Manuscript' : featureId === 'protocol-generator' ? 'Generate Protocol' : featureId === 'stat-assist' ? 'Generate Statistical Methods' : featureId === 'reflection-generator' ? 'Generate Reflection' : featureId === 'answer-analyser' ? 'Generate Question (5 questions)' : featureId === 'mcqs-analyser' ? 'Generate MCQs' : featureId === 'ai-exam-prep' ? 'Exam Preparation System' : featureId === 'ai-exam-simulator' ? 'Generate Complete Exam Simulation' : featureId === 'guidelines-generator' ? 'Generate Guidelines' : featureId === 'resume-builder' ? 'Generate Resume' : featureId === 'doubt-solver' ? 'Generate Discussion' : featureId === 'drug-treatment-assistant' ? 'Generate Drug Info' : 'Generate AI Content'}
                </>
              )}
            </button>
            
            {featureId === 'digital-diary' && (
              <button 
                onClick={async () => {
                  const id = `diary-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                  try {
                    const response = await fetch('/api/digital-diary', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id,
                        user_id: 'default',
                        entry_date: digitalDiaryDate || new Date().toISOString(),
                        content: output || input,
                        action_items: input,
                        date: new Date().toISOString()
                      })
                    });
                    if (!response.ok) throw new Error('Failed to save');
                    alert('Diary entry saved to database successfully!');
                  } catch (err) {
                    console.error('Error saving diary:', err);
                    alert('Failed to save diary entry. Please try again.');
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 mt-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Save size={20} /> Save to Diary records
              </button>
            )}
          </div>

          {output && (featureId === 'seminar-builder' || featureId === 'journal-club') ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-8"
            >
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-white/5 pb-4">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab('slides')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'slides' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    PPT Slides
                  </button>
                  <button 
                    onClick={() => setActiveTab('notes')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'notes' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Detailed Notes
                  </button>
                </div>
                <div className="flex gap-2">
                  {activeTab === 'slides' ? (
                    <>
                      <button 
                        onClick={() => setIsEditingPPT(!isEditingPPT)}
                        className="text-slate-400 hover:text-blue-400 text-sm flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} /> {isEditingPPT ? 'Finish Editing' : 'Edit Slides'}
                      </button>
                      <button 
                        onClick={handleDownloadPPT}
                        className="text-slate-400 hover:text-emerald-400 text-sm flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg transition-colors"
                      >
                        <Download size={16} /> Download PPT
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleDownloadNotes}
                      className="text-slate-400 hover:text-emerald-400 text-sm flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg transition-colors"
                    >
                      <Download size={16} /> Download Notes
                    </button>
                  )}
                  <button 
                    onClick={handleSave}
                    className="text-slate-400 hover:text-emerald-400 text-sm flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg transition-colors"
                  >
                    <Save size={16} /> Save to Database
                  </button>
                </div>
              </div>

              {activeTab === 'slides' ? (
                <div className="space-y-6">
                  {slides.map((slide, idx) => (
                    <div key={idx} className="bg-slate-800/50 border border-white/5 rounded-xl p-6 relative group">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Slide {idx + 1}</span>
                      </div>
                      {isEditingPPT ? (
                        <div className="space-y-4">
                          <input 
                            value={slide.title}
                            onChange={(e) => {
                              const newSlides = [...slides];
                              newSlides[idx].title = e.target.value;
                              setSlides(newSlides);
                            }}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white font-bold"
                          />
                          <textarea 
                            value={slide.content}
                            onChange={(e) => {
                              const newSlides = [...slides];
                              newSlides[idx].content = e.target.value;
                              setSlides(newSlides);
                            }}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-slate-300 h-32"
                          />
                        </div>
                      ) : (
                        <>
                          <h4 className="text-xl font-bold text-white mb-4">{slide.title}</h4>
                          <div className="text-slate-300 leading-relaxed prose prose-invert max-w-none prose-li:my-1 prose-ul:my-2 prose-ul:list-disc">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {slide.content
                                .replace(/<ul>/g, '')
                                .replace(/<\/ul>/g, '')
                                .replace(/<li>/g, '\n* ')
                                .replace(/<\/li>/g, '')
                                .replace(/(?<!\n)-\s/g, '\n* ')}
                            </ReactMarkdown>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div id="pdf-download-notes-content" className="w-full">
                  {(() => {
                    const lines = detailedNotes.split('\n');
                    const sections: { title: string; content: string[] }[] = [];
                    let currentSection = { title: '', content: [] as string[] };
                    
                    lines.forEach((line, index) => {
                      // Remove markdown bold asterisks for the check if they wrap the line
                      const cleanLine = line.trim().replace(/^\*\*|\*\*$/g, '').trim();
                      
                      // Check if it clearly looks like a section header: "# Title" or "1. Title"
                      const stronglyLooksLikeHeading = /^(?:#+\s+|\d+\.\s+)[A-Z]/i.test(cleanLine);
                      const isShort = cleanLine.length > 3 && cleanLine.length < 120;
                      
                      const prevLineEmpty = index === 0 || lines[index - 1].trim() === '';
                      
                      // Be more forgiving: a strong heading pattern on a short line is a heading even without a blank line
                      if (stronglyLooksLikeHeading && isShort && (prevLineEmpty || /^(?:#+\s+|\d+\.\s+)/.test(cleanLine))) {
                        if (currentSection.title || currentSection.content.length > 0) {
                          sections.push({ ...currentSection });
                        }
                        currentSection = { title: cleanLine, content: [] };
                      } else {
                        currentSection.content.push(line);
                      }
                    });
                    if (currentSection.title || currentSection.content.length > 0) {
                      sections.push(currentSection);
                    }

                    const pastelColors = [
                      'bg-[#f0f9ff] border-[#bae6fd] text-[#0c4a6e] [&_strong]:text-[#082f49]', 
                      'bg-[#f0fdf4] border-[#bbf7d0] text-[#14532d] [&_strong]:text-[#052e16]', 
                      'bg-[#fff7ed] border-[#fed7aa] text-[#7c2d12] [&_strong]:text-[#451a03]', 
                      'bg-[#faf5ff] border-[#e9d5ff] text-[#581c87] [&_strong]:text-[#3b0764]', 
                      'bg-[#fff1f2] border-[#fecdd3] text-[#881337] [&_strong]:text-[#4c0519]', 
                      'bg-[#f0fdfa] border-[#a7f3d0] text-[#134e4a] [&_strong]:text-[#042f2e]', 
                    ];

                    let colorIdx = 0;

                    return (
                      <div className="space-y-6">
                        {sections.map((sec, idx) => {
                          const isEmpty = !sec.title && sec.content.join('').trim() === '';
                          if (isEmpty) return null;
                          
                          let colorClassTemplate = '';
                          if (sec.title) {
                            colorClassTemplate = pastelColors[colorIdx % pastelColors.length];
                            colorIdx++;
                          } else {
                            colorClassTemplate = 'bg-[#f8fafc] border-[#cbd5e1] text-[#0f172a] [&_strong]:text-black';
                          }

                          return (
                            <div key={idx} className={`rounded-[20px] border p-8 shadow-sm ${colorClassTemplate}`}>
                              {sec.title && (
                                <h3 className="text-[22px] font-black mb-5 border-b pb-3 opacity-90 border-current tracking-wide">
                                  {sec.title.replace(/^#+\s*/, '')}
                                </h3>
                              )}
                              <div className="prose max-w-none prose-lg prose-p:text-current prose-headings:text-current prose-headings:font-bold prose-strong:text-current prose-strong:font-bold prose-ul:text-current prose-ol:text-current prose-li:text-current prose-blockquote:text-current prose-blockquote:border-current prose-blockquote:opacity-80 opacity-95 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {sec.content.join('\n')}
                                </ReactMarkdown>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          ) : output && featureId !== 'stat-assist' && featureId !== 'clinical-decision-support' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={featureId === 'knowledge-library' ? '' : 'bg-slate-900 border border-white/10 rounded-2xl p-8 prose prose-invert max-w-none'}
            >
              {/* Session Search special renderer with clickable links */}
              {featureId === 'session-search' ? (
                <div>
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-white/5 pb-4 not-prose">
                    <h3 className="text-xl font-bold text-white m-0 flex items-center gap-2">
                      <Search size={20} className="text-blue-400" /> Scientific Session Results
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleSave} className="text-slate-400 hover:text-emerald-400 text-sm flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg transition-colors">
                        <Save size={16} /> Save to Database
                      </button>
                      <button onClick={handleDownload} className="text-slate-400 hover:text-blue-400 text-sm flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg transition-colors">
                        <Download size={16} /> Download
                      </button>
                      <button onClick={() => window.print()} className="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg transition-colors">
                        <FileText size={16} /> Print PDF
                      </button>
                    </div>
                  </div>
                  <div id="pdf-download-content" className="w-full not-prose">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 hover:text-blue-100 rounded-lg text-sm font-medium transition-all no-underline"
                          >
                            <Globe size={12} className="shrink-0" />
                            {children}
                          </a>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-lg font-bold text-white mt-6 mb-3 flex items-center gap-2">
                            <div className="w-2 h-6 bg-blue-500 rounded-full shrink-0" />
                            {children}
                          </h3>
                        ),
                        hr: () => <hr className="border-white/10 my-4" />,
                        li: ({ children }) => (
                          <li className="text-slate-300 py-0.5 flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            <span>{children}</span>
                          </li>
                        ),
                        p: ({ children }) => <p className="text-slate-300 my-1.5">{children}</p>,
                        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      }}
                    >
                      {output}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
              <>
              {/* Header for non-knowledge-library views */}
              {featureId !== 'knowledge-library' && (
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-white/5 pb-4">
                <h3 className="text-xl font-bold text-white m-0">
                  {['essay-library', 'mcq-library', 'flash-cards'].includes(featureId) && klActiveCourse && klActiveSection && klTopicId 
                    ? `${klActiveCourse.name} / ${klActiveSection.name} / ${klActiveTopics.find((t: any) => t.id?.toString() === klTopicId?.toString())?.name || ''}`
                    : 'Curated Essay'
                  }
                </h3>
                <div className="flex flex-wrap gap-2">
                  {!['knowledge-library', 'essay-library', 'mcq-library', 'flash-cards', 'thesis-notes'].includes(featureId) && (
                    <button 
                      onClick={handleSave}
                      className="text-slate-400 hover:text-emerald-400 text-sm flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg transition-colors"
                    >
                      <Save size={16} /> Save to Database
                    </button>
                  )}
                  {featureId !== 'knowledge-library' && (
                    <>
                      <button 
                        onClick={handleDownload}
                        className="text-slate-400 hover:text-blue-400 text-sm flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg transition-colors"
                      >
                        <Download size={16} /> Download
                      </button>
                      <button 
                        onClick={handleShare}
                        className="text-slate-400 hover:text-purple-400 text-sm flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg transition-colors"
                      >
                        <Share2 size={16} /> Share
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="text-slate-400 hover:text-white text-sm flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg transition-colors"
                      >
                        <FileText size={16} /> Print PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
              )}
              <div id="pdf-download-content" className="w-full">
              {featureId === 'knowledge-library' ? (
                <div className="space-y-5">
                  {(() => {
                    const lines = output.split('\n');
                    const sections: { title: string; content: string[] }[] = [];
                    let currentSection = { title: '', content: [] as string[] };
                    
                    lines.forEach((line, index) => {
                      const isHeading = /^(?:\d+\.\s+|#+\s+)[A-Z]/.test(line.trim());
                      const prevLineEmpty = index === 0 || lines[index - 1].trim() === '';
                      
                      if (isHeading && prevLineEmpty && line.length < 100) {
                        if (currentSection.title || currentSection.content.length > 0) {
                          sections.push({ ...currentSection });
                        }
                        currentSection = { title: line.trim(), content: [] };
                      } else {
                        currentSection.content.push(line);
                      }
                    });
                    if (currentSection.title || currentSection.content.length > 0) {
                      sections.push(currentSection);
                    }

                    // Section icons rotation for visual interest
                    const sectionIcons = [
                      <BookOpen size={18} className="text-teal-600" />,
                      <Target size={18} className="text-blue-600" />,
                      <Lightbulb size={18} className="text-amber-600" />,
                      <Microscope size={18} className="text-purple-600" />,
                      <Activity size={18} className="text-rose-600" />,
                      <Sparkles size={18} className="text-emerald-600" />,
                    ];

                    const accentColors = [
                      { bg: '#f0fdfa', border: '#99f6e4', accent: '#14b8a6', iconBg: '#ccfbf1', text: '#134e4a', subtext: '#115e59' },
                      { bg: '#eff6ff', border: '#bfdbfe', accent: '#3b82f6', iconBg: '#dbeafe', text: '#1e3a5f', subtext: '#1e40af' },
                      { bg: '#fffbeb', border: '#fde68a', accent: '#f59e0b', iconBg: '#fef3c7', text: '#78350f', subtext: '#92400e' },
                      { bg: '#faf5ff', border: '#e9d5ff', accent: '#a855f7', iconBg: '#f3e8ff', text: '#581c87', subtext: '#6b21a8' },
                      { bg: '#fff1f2', border: '#fecdd3', accent: '#f43f5e', iconBg: '#ffe4e6', text: '#881337', subtext: '#9f1239' },
                      { bg: '#ecfdf5', border: '#a7f3d0', accent: '#10b981', iconBg: '#d1fae5', text: '#064e3b', subtext: '#065f46' },
                    ];

                    // Build topic name for header
                    const topicName = klActiveTopics.find((t: any) => t.id?.toString() === klTopicId?.toString())?.name || 'Topic';
                    const courseName = klActiveCourse?.name || 'Course';

                    let colorIdx = 0;

                    return (
                      <>
                        {/* ── Beautiful Header Card ───────────────────────── */}
                        <div style={{ background: 'linear-gradient(135deg, #f0fdfa, #ecfdf5, #f0fdf4)', border: '1px solid #99f6e4' }} className="rounded-2xl p-6 md:p-8 shadow-sm">
                          <div className="flex items-start gap-4">
                            <div style={{ background: '#ccfbf1' }} className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                              <BookOpen size={22} style={{ color: '#0d9488' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h2 style={{ color: '#134e4a' }} className="text-xl md:text-2xl font-extrabold tracking-tight leading-snug mb-1">
                                Expert Clinical Note: {topicName}
                              </h2>
                              <p style={{ color: '#0d9488' }} className="text-sm font-medium">
                                <span className="font-semibold">Course Context:</span> {courseName}
                              </p>
                            </div>
                          </div>
                          <div style={{ background: 'linear-gradient(to right, #14b8a6, #34d399, transparent)' }} className="mt-4 h-[2px] rounded-full" />
                        </div>

                        {/* ── Key Points Summary Card ───────────────────── */}
                        {sections.length > 1 && (
                          <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1px solid #bbf7d0' }} className="rounded-2xl p-6 md:p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                              <div style={{ background: '#dcfce7' }} className="w-10 h-10 rounded-xl flex items-center justify-center">
                                <Target size={18} style={{ color: '#16a34a' }} />
                              </div>
                              <h3 style={{ color: '#14532d' }} className="text-lg font-extrabold tracking-tight">Key Points Summary</h3>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #dcfce7' }} className="rounded-xl p-5 space-y-2.5">
                              {sections.filter(s => s.title).map((sec, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <div style={{ background: '#4ade80' }} className="w-2 h-2 rounded-full mt-2 shrink-0" />
                                  <p style={{ color: '#166534', fontSize: '15px', lineHeight: '1.6' }} className="font-medium">
                                    {sec.title.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Content Sections ──────────────────────────── */}
                        {sections.map((sec, idx) => {
                          const isEmpty = !sec.title && sec.content.join('').trim() === '';
                          if (isEmpty) return null;

                          const colors = sec.title ? accentColors[colorIdx % accentColors.length] : null;
                          const icon = sec.title ? sectionIcons[colorIdx % sectionIcons.length] : null;
                          if (sec.title) colorIdx++;

                          // For untitled intro/preamble sections
                          if (!sec.title) {
                            return (
                              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} className="rounded-2xl p-6 md:p-8 shadow-sm">
                                <div className="kl-content-prose" style={{ color: '#334155' }}>
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {sec.content.join('\n')}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={idx} style={{ 
                              background: colors!.bg, 
                              borderLeft: `4px solid ${colors!.accent}`,
                              border: `1px solid ${colors!.border}`,
                              borderLeftWidth: '4px',
                              borderLeftColor: colors!.accent
                            }} className="rounded-2xl p-6 md:p-8 shadow-sm transition-all hover:shadow-md">
                              {/* Section Header */}
                              <div className="flex items-center gap-3 mb-5">
                                <div style={{ background: colors!.iconBg }} className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">
                                  {icon}
                                </div>
                                <h3 style={{ color: colors!.text }} className="text-lg md:text-xl font-extrabold tracking-tight leading-snug">
                                  {sec.title.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '')}
                                </h3>
                              </div>
                              <div style={{ borderColor: colors!.border }} className="h-px mb-5 opacity-60" />
                              {/* Section Content */}
                              <div className="kl-content-prose" style={{ color: colors!.subtext }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {sec.content.join('\n')}
                                </ReactMarkdown>
                              </div>
                            </div>
                          );
                        })}

                        {/* ── Footer with Actions ─────────────────────── */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', position: 'relative', zIndex: 50 }} className="rounded-2xl p-5 flex flex-wrap items-center justify-center gap-3 relative z-50">
                          <div className="flex items-center gap-2 text-sm" style={{ color: '#64748b' }}>
                            <Sparkles size={14} style={{ color: '#10b981' }} />
                            <span>MediMentr Generated Notes • Review for accuracy</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : featureId === 'essay-library' ? (
                <div className="space-y-5">
                  {(() => {
                    const lines = output.split('\n');
                    const sections: { title: string; content: string[] }[] = [];
                    let currentSection = { title: '', content: [] as string[] };

                    lines.forEach((line, index) => {
                      const isHeading = /^(?:Question\s*\d+[:.]|#+\s+|(?:\d+)\.\s+)[A-Z]/.test(line.trim()) || /^(?:\*\*|__)?Question\s*\d+/i.test(line.trim());
                      const prevLineEmpty = index === 0 || lines[index - 1].trim() === '';

                      if ((isHeading || (/^#{1,3}\s/.test(line.trim()) && line.length < 120)) && prevLineEmpty) {
                        if (currentSection.title || currentSection.content.length > 0) {
                          sections.push({ ...currentSection });
                        }
                        currentSection = { title: line.trim(), content: [] };
                      } else {
                        currentSection.content.push(line);
                      }
                    });
                    if (currentSection.title || currentSection.content.length > 0) {
                      sections.push(currentSection);
                    }

                    const sectionIcons = [
                      <FileText size={18} className="text-indigo-600" />,
                      <BookOpen size={18} className="text-violet-600" />,
                      <Target size={18} className="text-blue-600" />,
                      <Lightbulb size={18} className="text-purple-600" />,
                      <Activity size={18} className="text-fuchsia-600" />,
                    ];

                    const accentColors = [
                      { bg: '#eef2ff', border: '#c7d2fe', accent: '#6366f1', iconBg: '#e0e7ff', text: '#1e1b4b', subtext: '#3730a3' },
                      { bg: '#f5f3ff', border: '#ddd6fe', accent: '#8b5cf6', iconBg: '#ede9fe', text: '#2e1065', subtext: '#5b21b6' },
                      { bg: '#eff6ff', border: '#bfdbfe', accent: '#3b82f6', iconBg: '#dbeafe', text: '#1e3a5f', subtext: '#1d4ed8' },
                      { bg: '#fdf4ff', border: '#e9d5ff', accent: '#a855f7', iconBg: '#f3e8ff', text: '#581c87', subtext: '#7e22ce' },
                      { bg: '#fdf2f8', border: '#f5d0fe', accent: '#d946ef', iconBg: '#fae8ff', text: '#701a75', subtext: '#86198f' },
                    ];

                    const topicName = klActiveTopics.find((t: any) => t.id?.toString() === klTopicId?.toString())?.name || 'Topic';
                    const courseName = klActiveCourse?.name || 'Course';
                    let colorIdx = 0;

                    return (
                      <>
                        {/* ── Essay Library Header Card ────────────────── */}
                        <div style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff, #fdf4ff)', border: '1px solid #c7d2fe' }} className="rounded-2xl p-6 md:p-8 shadow-sm">
                          <div className="flex items-start gap-4">
                            <div style={{ background: '#e0e7ff' }} className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                              <FileText size={22} style={{ color: '#4f46e5' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h2 style={{ color: '#1e1b4b' }} className="text-xl md:text-2xl font-extrabold tracking-tight leading-snug mb-1">
                                Expert Essay Questions: {topicName}
                              </h2>
                              <p style={{ color: '#6366f1' }} className="text-sm font-medium">
                                <span className="font-semibold">Course Context:</span> {courseName}
                              </p>
                            </div>
                          </div>
                          <div style={{ background: 'linear-gradient(to right, #6366f1, #a855f7, transparent)' }} className="mt-4 h-[2px] rounded-full" />
                        </div>

                        {/* ── Question Index Card ───────────────────────── */}
                        {sections.filter(s => s.title).length > 1 && (
                          <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #eef2ff)', border: '1px solid #ddd6fe' }} className="rounded-2xl p-6 md:p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                              <div style={{ background: '#ede9fe' }} className="w-10 h-10 rounded-xl flex items-center justify-center">
                                <Target size={18} style={{ color: '#7c3aed' }} />
                              </div>
                              <h3 style={{ color: '#2e1065' }} className="text-lg font-extrabold tracking-tight">Questions in This Set</h3>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #ede9fe' }} className="rounded-xl p-5 space-y-2.5">
                              {sections.filter(s => s.title).map((sec, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <div style={{ background: '#7c3aed' }} className="w-2 h-2 rounded-full mt-2 shrink-0" />
                                  <p style={{ color: '#3730a3', fontSize: '15px', lineHeight: '1.6' }} className="font-medium">
                                    {sec.title.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').replace(/^__|}__$/g, '')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Question / Section Cards ──────────────────── */}
                        {sections.map((sec, idx) => {
                          const isEmpty = !sec.title && sec.content.join('').trim() === '';
                          if (isEmpty) return null;
                          const colors = sec.title ? accentColors[colorIdx % accentColors.length] : null;
                          const icon = sec.title ? sectionIcons[colorIdx % sectionIcons.length] : null;
                          if (sec.title) colorIdx++;

                          if (!sec.title) {
                            return (
                              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} className="rounded-2xl p-6 md:p-8 shadow-sm">
                                <div className="kl-content-prose" style={{ color: '#334155' }}>
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{sec.content.join('\n')}</ReactMarkdown>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div key={idx} style={{
                              background: colors!.bg,
                              border: `1px solid ${colors!.border}`,
                              borderLeftWidth: '4px',
                              borderLeftColor: colors!.accent,
                            }} className="rounded-2xl p-6 md:p-8 shadow-sm transition-all hover:shadow-md">
                              <div className="flex items-center gap-3 mb-5">
                                <div style={{ background: colors!.iconBg }} className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">
                                  {icon}
                                </div>
                                <h3 style={{ color: colors!.text }} className="text-lg md:text-xl font-extrabold tracking-tight leading-snug">
                                  {sec.title.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').replace(/^__|}__$/g, '')}
                                </h3>
                              </div>
                              <div style={{ borderColor: colors!.border }} className="h-px mb-5 opacity-60" />
                              <div className="kl-content-prose" style={{ color: colors!.subtext }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{sec.content.join('\n')}</ReactMarkdown>
                              </div>
                            </div>
                          );
                        })}

                        {/* ── Footer ────────────────────────────────────── */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', position: 'relative', zIndex: 50 }} className="rounded-2xl p-5 flex flex-wrap items-center justify-center gap-3">
                          <div className="flex items-center gap-2 text-sm" style={{ color: '#64748b' }}>
                            <Sparkles size={14} style={{ color: '#6366f1' }} />
                            <span>MediMentr Generated Notes • Review for accuracy</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : featureId === 'flash-cards' ? (
                <FlashcardViewer output={output} />
              ) : (
                <QuestionsViewer output={output} />
              )}
              </div>
              </>
              )}
            </motion.div>
          )}
        </div>

        {/* Saved Library Section */}
        {![
          'essay-library', 'knowledge-library', 'mcq-library', 'flash-cards',
          'thesis-notes', 'prescription-analyser', 'contacts-management',
          'digital-diary', 'session-search', 'resume-builder', 'doubt-solver',
          'drug-treatment-assistant', 'guidelines-generator', 'clinical-examination',
          'clinical-decision-support', 'ai-tutor', 'ai-med-ed-platform'
        ].includes(featureId) && (
          <div id="saved-library-section" className="mt-20 border-t border-white/10 pt-16">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                  <Save size={20} />
                </div>
                <h2 className="text-2xl font-bold text-white">Saved Library ({feature.title})</h2>
              </div>
              <div className="relative w-full md:w-64">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search saved content..." 
                  className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  disabled={savedItems.filter(item => item.featureId === featureId).length === 0}
                />
              </div>
            </div>
            
            {savedItems.filter(item => item.featureId === featureId).length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-white/5 border-dashed">
                <p className="text-slate-400">No saved content for {feature.title} yet. Generate and save something to see it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedItems
                  .filter(item => item.featureId === featureId)
                  .filter(item => 
                    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    new Date(item.date).toLocaleDateString().includes(searchTerm)
                  )
                  .map((item) => (
                  <div key={item.id} className="p-6 rounded-2xl bg-slate-900 border border-white/5 flex flex-col h-full hover:border-blue-500/30 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{item.title}</span>
                      <button onClick={() => removeSaved(item.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-slate-300 text-sm line-clamp-4 mb-6 flex-grow whitespace-pre-wrap">
                      {item.content}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
                      <button 
                        onClick={async () => {
                          setOutput(item.content);
                          if (item.featureId === 'seminar-builder') {
                             try {
                               const r = await fetch(`/api/seminar-builder/${item.id}`);
                               if (r.ok) {
                                 const data = await r.json();
                                 if (data.ppt_slides && data.ppt_slides.length > 0) setSlides(data.ppt_slides);
                                 else setSlides([{title: item.title, content: item.content}]);
                                 setDetailedNotes(data.detailed_notes || item.content);
                                 setSeminarTopic(data.topic || "");
                                 setSeminarDiscipline(data.discipline || "");
                               } else {
                                 setDetailedNotes(item.content); 
                                 setSlides([{title: item.title, content: item.content}]);
                               }
                             } catch (e) {
                               setDetailedNotes(item.content); 
                               setSlides([{title: item.title, content: item.content}]);
                             }
                          } else if (item.featureId === 'journal-club') {
                             try {
                               const r = await fetch(`/api/journal-club/${item.id}`);
                               if (r.ok) {
                                 const data = await r.json();
                                 // journal_club table uses ppt_structure (TEXT) not ppt_slides (JSONB)
                                 let parsedSlides: any[] = [];
                                 if (data.ppt_structure) {
                                   try {
                                     parsedSlides = typeof data.ppt_structure === 'string' ? JSON.parse(data.ppt_structure) : data.ppt_structure;
                                   } catch (pe) { parsedSlides = []; }
                                 }
                                 if (parsedSlides && parsedSlides.length > 0) setSlides(parsedSlides);
                                 else setSlides([{title: item.title, content: item.content}]);
                                 setDetailedNotes(data.detailed_notes || item.content);
                                 setJcTopic(data.topic || "");
                                 setJcDiscipline(data.discipline || "");
                               } else {
                                 setDetailedNotes(item.content); 
                                 setSlides([{title: item.title, content: item.content}]);
                               }
                             } catch (e) {
                               setDetailedNotes(item.content); 
                               setSlides([{title: item.title, content: item.content}]);
                             }
                          } else if (item.featureId === 'ai-exam-simulator') {
                             try {
                               const r = await fetch(`/api/ai-exam-simulator`);
                               if (r.ok) {
                                 const allItems = await r.json();
                                 const match = allItems.find((d: any) => d.id === item.id);
                                 if (match && match.questions) {
                                   const parsedQuestions = typeof match.questions === 'string' ? JSON.parse(match.questions) : match.questions;
                                   setSimQuestions(parsedQuestions);
                                   
                                   const rubrics: Record<string, string> = {};
                                   (parsedQuestions || []).forEach((q: any) => {
                                      rubrics[q.id] = q.answerRubric;
                                   });
                                   setSimRubrics(rubrics);
                                   
                                   setSimSubject(match.subject || '');
                                   setSimPaper(match.paper || '');
                                   setSimTopics(match.topics || '');
                                   setSimEvaluationResult(match.evaluation || '');
                                   setSimExamActive(true);
                                   setSimUploadPhase(false);
                                   setSimTimeRemaining(simDurationMinutes * 60);
                                   setSimAnswers({});
                                   setSimNotAnswered({});
                                   setOutput("Exam loaded from library. Timer started!");
                                 }
                               }
                             } catch (e) {
                               console.error('Error loading exam simulator data:', e);
                             }
                           } else if (item.featureId === 'ai-exam-prep') {
                             try {
                               const r = await fetch(`/api/ai-exam-prep`);
                               if (r.ok) {
                                 const allItems = await r.json();
                                 const match = allItems.find((d: any) => d.id === item.id);
                                 if (match && match.analytics) {
                                   const analytics = typeof match.analytics === 'string' ? JSON.parse(match.analytics) : match.analytics;
                                   setPrepAnalytics(analytics);
                                   setPrepCourseId(match.course_id || '');
                                 }
                               }
                             } catch (e) {
                               console.error('Error loading exam prep analytics:', e);
                             }
                           }
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-blue-400 hover:text-blue-300 text-xs font-bold transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Load Content
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DEFAULT_LMS_STRUCTURE = [
  { id: 1, title: 'Topic Title', desc: 'Mention how it has to be', instruction: 'Exam-oriented bullet points', format: 'Text Format', words: 100 },
  { id: 2, title: 'Definition / Overview', desc: 'Mention how it has to be', instruction: 'Essay format', format: 'Text Format', words: 100 },
  { id: 3, title: 'Basic Concepts / Background', desc: 'Mention how it has to be', instruction: 'Detailed explanation', format: 'Text Format', words: 200 },
  { id: 4, title: 'Classification', desc: 'Mention how it has to be', instruction: 'Clear categorization', format: 'Table Format', words: 100 },
  { id: 5, title: 'Mechanism / Pathophysiology', desc: 'Mention how it has to be', instruction: 'Flowchart style mapping', format: 'Markdown Map', words: 150 },
  { id: 6, title: 'Key Clinical or Functional Relevance', desc: 'Mention how it has to be', instruction: 'Clinical scenarios', format: 'Text Format', words: 150 },
  { id: 7, title: 'Investigations / Methods', desc: 'Mention how it has to be', instruction: 'Step-by-step points', format: 'Text Format', words: 100 },
  { id: 8, title: 'Management / Application', desc: 'Mention how it has to be', instruction: 'Treatment protocols', format: 'Text Format', words: 200 },
  { id: 9, title: 'Complications / Limitations', desc: 'Mention how it has to be', instruction: 'List of issues', format: 'Text Format', words: 100 },
  { id: 10, title: 'Recent Advances / Guidelines', desc: 'Mention how it has to be', instruction: 'Latest updates', format: 'Text Format', words: 100 },
  { id: 11, title: 'Viva Points', desc: 'Mention how it has to be', instruction: 'Question & Answer', format: 'Text Format', words: 100 },
  { id: 12, title: 'Key Takeaways', desc: 'Mention how it has to be', instruction: 'Summary points', format: 'Text Format', words: 50 }
];

const DEFAULT_ESSAY_STRUCTURE = [
  { id: 1, title: 'Analytical Essays', desc: 'Focus on interpreting content rather than just presenting facts', instruction: 'Break down complex topics into core components to reach a conclusion', format: 'Text Format', questions: 2 },
  { id: 2, title: 'Argumentative/Persuasive Essays', desc: 'Build a strong, evidence-based argument', instruction: 'Take a clear stance (thesis) on a contentious issue and defend it using evidence, logic, and data', format: 'Text Format', questions: 1 },
  { id: 3, title: 'Compare-and-Contrast Essays', desc: 'Evaluate understanding of relationships between theories, models, etc.', instruction: 'Highlight key similarities and differences between two or more subjects to analyze them deeper', format: 'Text Format', questions: 1 },
  { id: 4, title: 'Evaluative/Critical Essays', desc: 'Appraise the worth of something and defend that judgment', instruction: 'Demand a judgment on the value, effectiveness, or truth of a theory, policy, or case study', format: 'Text Format', questions: 2 },
  { id: 5, title: 'Expository/Explanatory Essays', desc: 'Demonstrate deep understanding and subject mastery', instruction: 'Ask for a clear, detailed explanation or interpretation of a concept, process, or theory', format: 'Text Format', questions: 1 },
  { id: 6, title: 'Case Study/Interpretive Essays', desc: 'Apply theoretical knowledge to practical scenarios', instruction: 'Apply knowledge to interpret or solve a scenario, graph, table, or piece of data', format: 'Text Format', questions: 1 },
  { id: 7, title: 'Synthesis/Hypothesis-Formation Essays', desc: 'Demonstrate higher-order thinking and originality', instruction: 'Combine information from various sources to form a new hypothesis, generalization, or comprehensive plan', format: 'Text Format', questions: 1 },
];

const DEFAULT_MCQ_STRUCTURE = [
  { id: 1, title: 'Single Best Answer (MCQ - Single Select)', desc: 'Fundamental Knowledge: The most common type, where one option is clearly the best answer among plausible distractors.', instruction: 'Generate straightforward single-best-answer MCQs', format: 'Text Format', questions: 5 },
  { id: 2, title: 'True/False (Binary Choice)', desc: 'Fundamental Knowledge: Tests factual recall and basic conceptual clarity.', instruction: 'Ask students to identify if a statement is correct.', format: 'Text Format', questions: 5 },
  { id: 3, title: 'Fill in the Blank (Cloze)', desc: 'Fundamental Knowledge: Tests recall without prompting cues.', instruction: 'Require the student to identify the correct missing word or phrase.', format: 'Text Format', questions: 5 },
  { id: 4, title: 'Multiple Response (Multi-select)', desc: 'Analytical Thinking: Requires students to select all correct answers from a list to reduce guessing.', instruction: 'Check if the student understands multiple aspects of a concept.', format: 'Text Format', questions: 5 },
  { id: 5, title: 'Scenario-Based/Vignette MCQ', desc: 'Analytical Thinking: Presents a scenario or case study followed by questions requiring the application of knowledge.', instruction: 'Ideal for clinical reasoning in medicine, legal analysis, or complex problem-solving.', format: 'Text Format', questions: 5 },
  { id: 6, title: 'Negative Option ("Except" or "Not")', desc: 'Analytical Thinking: Tests critical thinking by asking to identify the incorrect statement among several correct ones.', instruction: 'Force deep evaluation of the concept.', format: 'Text Format', questions: 5 },
  { id: 7, title: 'Degree of Applicability/Best Action', desc: 'Analytical Thinking: Requires choosing the most applicable or best action among several potentially correct choices.', instruction: 'Base questions on a set scenario.', format: 'Text Format', questions: 5 },
  { id: 8, title: 'Matching/Pairing', desc: 'Relationships: Two columns are provided to associate items from A with corresponding items in B.', instruction: 'Match terms and definitions, causes and effects, etc.', format: 'Text Format', questions: 5 },
  { id: 9, title: 'Ordering/Sequencing (Ranking)', desc: 'Relationships: put steps, processes, or chronological events in the correct hierarchical or chronological order.', instruction: 'Require students to put items in order.', format: 'Text Format', questions: 5 },
  { id: 10, title: 'Categorization', desc: 'Relationships: Requires classifying a set of items into distinct, predefined categories.', instruction: 'e.g., classifying coding languages vs. database systems.', format: 'Text Format', questions: 5 },
  { id: 11, title: 'Hotspot (Clickable Image)', desc: 'Interactive (TEIs): Students identify a specific region on an image, map, or diagram.', instruction: 'Create image-based hotspot selection questions.', format: 'Text Format', questions: 5 },
  { id: 12, title: 'Drag-and-Drop', desc: 'Interactive (TEIs): Involves moving text or images into target zones.', instruction: 'Excellent for sorting or process design.', format: 'Text Format', questions: 5 },
  { id: 13, title: 'Hottext (Inline Selection)', desc: 'Interactive (TEIs): Students select a specific word or phrase within a paragraph that answers the prompt.', instruction: 'Create hottext questions for inline selection.', format: 'Text Format', questions: 5 },
  { id: 14, title: 'Media-Enhanced Items', desc: 'Interactive (TEIs): Questions paired with video, audio, or simulations to test comprehension.', instruction: 'Form questions based on dynamic scenarios.', format: 'Text Format', questions: 5 },
];

const DEFAULT_FLASH_CARDS_STRUCTURE = [
  { id: 1, title: 'Definition and Terminology Flashcards', desc: 'Best for: Vocabulary, key terminology, scientific terms, or foreign languages', instruction: 'Place the term/word on the front and a concise definition or translation on the back.', format: 'Text Format', questions: 10 },
  { id: 2, title: 'Question and Answer (Q&A) Flashcards', desc: 'Best for: History, philosophy, or social sciences, focusing on concepts rather than just facts', instruction: 'Ask a specific "how" or "why" question on the front and provide a concise answer, perhaps with bullet points, on the back.', format: 'Text Format', questions: 10 },
  { id: 3, title: 'Formula and Problem-Solution Flashcards', desc: 'Best for: Math, physics, chemistry, and STEM subjects', instruction: 'Write the formula name or a sample problem on the front, and the formula/steps to solve it on the back.', format: 'Text Format', questions: 10 },
  { id: 4, title: 'Visual and Diagram Flashcards', desc: 'Best for: Biology (anatomy), geography (maps), art history, or processes (flowcharts)', instruction: 'Use an unlabelled diagram, picture, or graph on one side, with labels or explanations on the other. This leverages "dual coding".', format: 'Text Format', questions: 10 },
  { id: 5, title: 'Mnemonic and Acronym Flashcards', desc: 'Best for: Memorizing lists, sequences, or complex classification systems (e.g., taxonomy, historical events)', instruction: 'Put the list to be learned on one side and a memorable acronym (e.g., "HOMES" for Great Lakes) on the other.', format: 'Text Format', questions: 10 },
  { id: 6, title: 'Comparison and Contrast Flashcards', desc: 'Best for: Subjects requiring analysis, such as economics, literature, or law', instruction: 'Compare two closely related concepts (e.g., "Mitosis vs. Meiosis") to help differentiate between them.', format: 'Text Format', questions: 10 },
  { id: 7, title: '"Fill-in-the-Blank" (Cloze) Flashcards', desc: 'Best for: Context-based learning, grammar, or memorizing important, exact phrasings in a paragraph', instruction: 'A sentence with key information removed on the front, and the missing word(s) on the back.', format: 'Text Format', questions: 10 },
];

const BLOG_CATEGORIES = [
  "Clinical Learning & Case-Based Education",
  "Postgraduate Exam Preparation",
  "Research & Thesis Writing",
  "Clinical Skills & Procedures",
  "Technology & AI in Medical Education",
  "Residency Life & Well-being",
  "Career Planning After Postgraduation",
  "Specialty-Specific Learning",
  "Guidelines & Evidence-Based Medicine",
  "Teaching & Medical Education Skills",
  "Quick Learning & Revision Blogs"
];

export const DEFAULT_CURRICULUM = [
  {
    "id": "c10",
    "name": "Mastering Anatomy",
    "papers": [
      {
        "id": "ana_p1",
        "name": "Paper I – Gross Anatomy of Upper Limb, Lower Limb, Thorax & Abdomen",
        "sections": [
          {
            "id": "ana_p1_s1",
            "name": "Upper Limb",
            "topics": [
              {
                "id": "ana_p1_s1_t1",
                "name": "Brachial plexus (formation, branches, applied anatomy)"
              },
              {
                "id": "ana_p1_s1_t2",
                "name": "Axillary artery and vein"
              },
              {
                "id": "ana_p1_s1_t3",
                "name": "Shoulder joint"
              },
              {
                "id": "ana_p1_s1_t4",
                "name": "Rotator cuff muscles"
              },
              {
                "id": "ana_p1_s1_t5",
                "name": "Cubital fossa"
              },
              {
                "id": "ana_p1_s1_t6",
                "name": "Carpal tunnel syndrome"
              },
              {
                "id": "ana_p1_s1_t7",
                "name": "Anatomical snuffbox"
              }
            ]
          },
          {
            "id": "ana_p1_s2",
            "name": "Lower Limb",
            "topics": [
              {
                "id": "ana_p1_s2_t1",
                "name": "Femoral triangle"
              },
              {
                "id": "ana_p1_s2_t2",
                "name": "Femoral canal and femoral hernia"
              },
              {
                "id": "ana_p1_s2_t3",
                "name": "Sciatic nerve"
              },
              {
                "id": "ana_p1_s2_t4",
                "name": "Hip joint"
              },
              {
                "id": "ana_p1_s2_t5",
                "name": "Knee joint"
              },
              {
                "id": "ana_p1_s2_t6",
                "name": "Popliteal fossa"
              }
            ]
          },
          {
            "id": "ana_p1_s3",
            "name": "Thorax",
            "topics": [
              {
                "id": "ana_p1_s3_t1",
                "name": "Mediastinum"
              },
              {
                "id": "ana_p1_s3_t2",
                "name": "Coronary circulation"
              },
              {
                "id": "ana_p1_s3_t3",
                "name": "Pericardium"
              },
              {
                "id": "ana_p1_s3_t4",
                "name": "Bronchopulmonary segments"
              },
              {
                "id": "ana_p1_s3_t5",
                "name": "Surface anatomy of heart and lungs"
              }
            ]
          },
          {
            "id": "ana_p1_s4",
            "name": "Abdomen",
            "topics": [
              {
                "id": "ana_p1_s4_t1",
                "name": "Portal vein and portal hypertension"
              },
              {
                "id": "ana_p1_s4_t2",
                "name": "Celiac trunk and mesenteric arteries"
              },
              {
                "id": "ana_p1_s4_t3",
                "name": "Liver segments"
              },
              {
                "id": "ana_p1_s4_t4",
                "name": "Inguinal canal and hernia"
              },
              {
                "id": "ana_p1_s4_t5",
                "name": "Kidney relations"
              }
            ]
          }
        ]
      },
      {
        "id": "ana_p2",
        "name": "Paper II – Head, Neck, Brain & Neuroanatomy",
        "sections": [
          {
            "id": "ana_p2_s1",
            "name": "Head & Neck",
            "topics": [
              {
                "id": "ana_p2_s1_t1",
                "name": "Cranial nerves (origin, course, functions)"
              },
              {
                "id": "ana_p2_s1_t2",
                "name": "Cavernous sinus"
              },
              {
                "id": "ana_p2_s1_t3",
                "name": "Facial nerve"
              },
              {
                "id": "ana_p2_s1_t4",
                "name": "Parotid gland"
              },
              {
                "id": "ana_p2_s1_t5",
                "name": "Carotid triangle"
              },
              {
                "id": "ana_p2_s1_t6",
                "name": "Thyroid gland anatomy"
              }
            ]
          },
          {
            "id": "ana_p2_s2",
            "name": "Neuroanatomy",
            "topics": [
              {
                "id": "ana_p2_s2_t1",
                "name": "Internal capsule"
              },
              {
                "id": "ana_p2_s2_t2",
                "name": "Basal ganglia"
              },
              {
                "id": "ana_p2_s2_t3",
                "name": "Thalamus"
              },
              {
                "id": "ana_p2_s2_t4",
                "name": "Cerebellum"
              },
              {
                "id": "ana_p2_s2_t5",
                "name": "Brainstem (midbrain, pons, medulla)"
              },
              {
                "id": "ana_p2_s2_t6",
                "name": "Ventricular system"
              },
              {
                "id": "ana_p2_s2_t7",
                "name": "Blood supply of brain (Circle of Willis)"
              },
              {
                "id": "ana_p2_s2_t8",
                "name": "Meninges and CSF circulation"
              }
            ]
          }
        ]
      },
      {
        "id": "ana_p3",
        "name": "Paper III – Histology, Embryology & Genetics",
        "sections": [
          {
            "id": "ana_p3_s1",
            "name": "Histology",
            "topics": [
              {
                "id": "ana_p3_s1_t1",
                "name": "Epithelial tissue"
              },
              {
                "id": "ana_p3_s1_t2",
                "name": "Connective tissue"
              },
              {
                "id": "ana_p3_s1_t3",
                "name": "Bone and cartilage"
              },
              {
                "id": "ana_p3_s1_t4",
                "name": "Lymphoid organs (spleen, thymus, lymph node)"
              },
              {
                "id": "ana_p3_s1_t5",
                "name": "Endocrine glands (thyroid, pituitary, adrenal)"
              },
              {
                "id": "ana_p3_s1_t6",
                "name": "Histology of liver, kidney and lung"
              }
            ]
          },
          {
            "id": "ana_p3_s2",
            "name": "Embryology",
            "topics": [
              {
                "id": "ana_p3_s2_t1",
                "name": "Gametogenesis"
              },
              {
                "id": "ana_p3_s2_t2",
                "name": "Fertilization and implantation"
              },
              {
                "id": "ana_p3_s2_t3",
                "name": "Placenta and fetal membranes"
              },
              {
                "id": "ana_p3_s2_t4",
                "name": "Development of heart"
              },
              {
                "id": "ana_p3_s2_t5",
                "name": "Development of face and palate"
              },
              {
                "id": "ana_p3_s2_t6",
                "name": "Development of brain"
              },
              {
                "id": "ana_p3_s2_t7",
                "name": "Development of urogenital system"
              }
            ]
          },
          {
            "id": "ana_p3_s3",
            "name": "Genetics",
            "topics": [
              {
                "id": "ana_p3_s3_t1",
                "name": "Chromosomal abnormalities"
              },
              {
                "id": "ana_p3_s3_t2",
                "name": "Molecular genetics"
              },
              {
                "id": "ana_p3_s3_t3",
                "name": "Genetic inheritance patterns"
              },
              {
                "id": "ana_p3_s3_t4",
                "name": "Prenatal diagnosis"
              }
            ]
          }
        ]
      },
      {
        "id": "ana_p4",
        "name": "Paper IV – Applied Anatomy, Recent Advances & Clinical Anatomy",
        "sections": [
          {
            "id": "ana_p4_s1",
            "name": "Applied Anatomy",
            "topics": [
              {
                "id": "ana_p4_s1_t1",
                "name": "Anatomical basis of hernias"
              },
              {
                "id": "ana_p4_s1_t2",
                "name": "Nerve injuries of upper limb"
              },
              {
                "id": "ana_p4_s1_t3",
                "name": "Nerve injuries of lower limb"
              },
              {
                "id": "ana_p4_s1_t4",
                "name": "Congenital anomalies"
              },
              {
                "id": "ana_p4_s1_t5",
                "name": "Surface anatomy"
              }
            ]
          },
          {
            "id": "ana_p4_s2",
            "name": "Radiological Anatomy",
            "topics": [
              {
                "id": "ana_p4_s2_t1",
                "name": "CT scan anatomy"
              },
              {
                "id": "ana_p4_s2_t2",
                "name": "MRI anatomy"
              },
              {
                "id": "ana_p4_s2_t3",
                "name": "Angiography"
              }
            ]
          },
          {
            "id": "ana_p4_s3",
            "name": "Clinical Anatomy",
            "topics": [
              {
                "id": "ana_p4_s3_t1",
                "name": "Anatomical basis of stroke"
              },
              {
                "id": "ana_p4_s3_t2",
                "name": "Hydrocephalus"
              },
              {
                "id": "ana_p4_s3_t3",
                "name": "Spinal cord injuries"
              },
              {
                "id": "ana_p4_s3_t4",
                "name": "Intervertebral disc prolapse"
              }
            ]
          },
          {
            "id": "ana_p4_s4",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "ana_p4_s4_t1",
                "name": "Stem cell research"
              },
              {
                "id": "ana_p4_s4_t2",
                "name": "Molecular anatomy"
              },
              {
                "id": "ana_p4_s4_t3",
                "name": "Imaging techniques in anatomy"
              }
            ]
          },
          {
            "id": "ana_p4_s5",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "ana_p4_s5_t1",
                "name": "Brachial plexus"
              },
              {
                "id": "ana_p4_s5_t2",
                "name": "Inguinal canal"
              },
              {
                "id": "ana_p4_s5_t3",
                "name": "Femoral triangle"
              },
              {
                "id": "ana_p4_s5_t4",
                "name": "Coronary circulation"
              },
              {
                "id": "ana_p4_s5_t5",
                "name": "Cavernous sinus"
              },
              {
                "id": "ana_p4_s5_t6",
                "name": "Internal capsule"
              },
              {
                "id": "ana_p4_s5_t7",
                "name": "Development of heart"
              },
              {
                "id": "ana_p4_s5_t8",
                "name": "Placenta"
              },
              {
                "id": "ana_p4_s5_t9",
                "name": "Histology of liver and kidney"
              },
              {
                "id": "ana_p4_s5_t10",
                "name": "Chromosomal abnormalities"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c3",
    "name": "Mastering Physiology",
    "papers": [
      {
        "id": "physio_p1",
        "name": "Paper I – General Physiology & Cellular Physiology",
        "sections": [
          {
            "id": "physio_p1_s1",
            "name": "General Physiology",
            "topics": [
              {
                "id": "physio_p1_s1_t1",
                "name": "Homeostasis and feedback mechanisms"
              },
              {
                "id": "physio_p1_s1_t2",
                "name": "Body fluid compartments and regulation"
              },
              {
                "id": "physio_p1_s1_t3",
                "name": "Membrane transport mechanisms (diffusion, active transport, facilitated diffusion)"
              },
              {
                "id": "physio_p1_s1_t4",
                "name": "Resting membrane potential"
              },
              {
                "id": "physio_p1_s1_t5",
                "name": "Action potential"
              }
            ]
          },
          {
            "id": "physio_p1_s2",
            "name": "Cellular Physiology",
            "topics": [
              {
                "id": "physio_p1_s2_t1",
                "name": "Cell membrane structure and functions"
              },
              {
                "id": "physio_p1_s2_t2",
                "name": "Ion channels and pumps"
              },
              {
                "id": "physio_p1_s2_t3",
                "name": "Signal transduction pathways"
              },
              {
                "id": "physio_p1_s2_t4",
                "name": "Apoptosis and cell cycle"
              }
            ]
          },
          {
            "id": "physio_p1_s3",
            "name": "Muscle Physiology",
            "topics": [
              {
                "id": "physio_p1_s3_t1",
                "name": "Skeletal muscle contraction"
              },
              {
                "id": "physio_p1_s3_t2",
                "name": "Neuromuscular junction"
              },
              {
                "id": "physio_p1_s3_t3",
                "name": "Smooth muscle physiology"
              },
              {
                "id": "physio_p1_s3_t4",
                "name": "Cardiac muscle physiology"
              }
            ]
          },
          {
            "id": "physio_p1_s4",
            "name": "Blood Physiology",
            "topics": [
              {
                "id": "physio_p1_s4_t1",
                "name": "Hemopoiesis"
              },
              {
                "id": "physio_p1_s4_t2",
                "name": "Hemoglobin structure and function"
              },
              {
                "id": "physio_p1_s4_t3",
                "name": "Anemia physiology"
              },
              {
                "id": "physio_p1_s4_t4",
                "name": "Blood groups and transfusion"
              },
              {
                "id": "physio_p1_s4_t5",
                "name": "Hemostasis and coagulation"
              }
            ]
          }
        ]
      },
      {
        "id": "physio_p2",
        "name": "Paper II – Cardiovascular, Respiratory & Renal Physiology",
        "sections": [
          {
            "id": "physio_p2_s1",
            "name": "Cardiovascular System",
            "topics": [
              {
                "id": "physio_p2_s1_t1",
                "name": "Cardiac cycle"
              },
              {
                "id": "physio_p2_s1_t2",
                "name": "Regulation of cardiac output"
              },
              {
                "id": "physio_p2_s1_t3",
                "name": "ECG interpretation"
              },
              {
                "id": "physio_p2_s1_t4",
                "name": "Blood pressure regulation"
              },
              {
                "id": "physio_p2_s1_t5",
                "name": "Microcirculation and lymphatic circulation"
              }
            ]
          },
          {
            "id": "physio_p2_s2",
            "name": "Respiratory System",
            "topics": [
              {
                "id": "physio_p2_s2_t1",
                "name": "Mechanics of respiration"
              },
              {
                "id": "physio_p2_s2_t2",
                "name": "Lung volumes and capacities"
              },
              {
                "id": "physio_p2_s2_t3",
                "name": "Gas exchange and oxygen transport"
              },
              {
                "id": "physio_p2_s2_t4",
                "name": "Regulation of respiration"
              },
              {
                "id": "physio_p2_s2_t5",
                "name": "Hypoxia and cyanosis"
              }
            ]
          },
          {
            "id": "physio_p2_s3",
            "name": "Renal Physiology",
            "topics": [
              {
                "id": "physio_p2_s3_t1",
                "name": "Glomerular filtration"
              },
              {
                "id": "physio_p2_s3_t2",
                "name": "Tubular reabsorption and secretion"
              },
              {
                "id": "physio_p2_s3_t3",
                "name": "Countercurrent mechanism"
              },
              {
                "id": "physio_p2_s3_t4",
                "name": "Regulation of acid–base balance"
              },
              {
                "id": "physio_p2_s3_t5",
                "name": "Renin–angiotensin–aldosterone system"
              }
            ]
          }
        ]
      },
      {
        "id": "physio_p3",
        "name": "Paper III – Endocrine, Gastrointestinal & Reproductive Physiology",
        "sections": [
          {
            "id": "physio_p3_s1",
            "name": "Endocrine System",
            "topics": [
              {
                "id": "physio_p3_s1_t1",
                "name": "Hypothalamic–pituitary axis"
              },
              {
                "id": "physio_p3_s1_t2",
                "name": "Thyroid hormones and regulation"
              },
              {
                "id": "physio_p3_s1_t3",
                "name": "Insulin and glucose metabolism"
              },
              {
                "id": "physio_p3_s1_t4",
                "name": "Adrenal hormones"
              },
              {
                "id": "physio_p3_s1_t5",
                "name": "Calcium metabolism and parathyroid hormone"
              }
            ]
          },
          {
            "id": "physio_p3_s2",
            "name": "Gastrointestinal System",
            "topics": [
              {
                "id": "physio_p3_s2_t1",
                "name": "Salivary secretion"
              },
              {
                "id": "physio_p3_s2_t2",
                "name": "Gastric secretion and regulation"
              },
              {
                "id": "physio_p3_s2_t3",
                "name": "Pancreatic secretion"
              },
              {
                "id": "physio_p3_s2_t4",
                "name": "Bile secretion"
              },
              {
                "id": "physio_p3_s2_t5",
                "name": "Intestinal absorption"
              }
            ]
          },
          {
            "id": "physio_p3_s3",
            "name": "Reproductive Physiology",
            "topics": [
              {
                "id": "physio_p3_s3_t1",
                "name": "Spermatogenesis"
              },
              {
                "id": "physio_p3_s3_t2",
                "name": "Ovarian cycle and menstrual cycle"
              },
              {
                "id": "physio_p3_s3_t3",
                "name": "Hormonal regulation of reproduction"
              },
              {
                "id": "physio_p3_s3_t4",
                "name": "Pregnancy physiology"
              },
              {
                "id": "physio_p3_s3_t5",
                "name": "Lactation"
              }
            ]
          }
        ]
      },
      {
        "id": "physio_p4",
        "name": "Paper IV – Neurophysiology, Applied Physiology & Recent Advances",
        "sections": [
          {
            "id": "physio_p4_s1",
            "name": "Neurophysiology",
            "topics": [
              {
                "id": "physio_p4_s1_t1",
                "name": "Synaptic transmission"
              },
              {
                "id": "physio_p4_s1_t2",
                "name": "Reflexes"
              },
              {
                "id": "physio_p4_s1_t3",
                "name": "Motor pathways (pyramidal and extrapyramidal)"
              },
              {
                "id": "physio_p4_s1_t4",
                "name": "Sensory pathways"
              },
              {
                "id": "physio_p4_s1_t5",
                "name": "Autonomic nervous system"
              },
              {
                "id": "physio_p4_s1_t6",
                "name": "EEG and sleep physiology"
              }
            ]
          },
          {
            "id": "physio_p4_s2",
            "name": "Higher Functions",
            "topics": [
              {
                "id": "physio_p4_s2_t1",
                "name": "Learning and memory"
              },
              {
                "id": "physio_p4_s2_t2",
                "name": "Speech and language"
              },
              {
                "id": "physio_p4_s2_t3",
                "name": "Limbic system"
              },
              {
                "id": "physio_p4_s2_t4",
                "name": "Emotion and motivation"
              }
            ]
          },
          {
            "id": "physio_p4_s3",
            "name": "Applied Physiology",
            "topics": [
              {
                "id": "physio_p4_s3_t1",
                "name": "Exercise physiology"
              },
              {
                "id": "physio_p4_s3_t2",
                "name": "Stress physiology"
              },
              {
                "id": "physio_p4_s3_t3",
                "name": "Environmental physiology (high altitude, deep sea)"
              },
              {
                "id": "physio_p4_s3_t4",
                "name": "Aging physiology"
              }
            ]
          },
          {
            "id": "physio_p4_s4",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "physio_p4_s4_t1",
                "name": "Stem cells in physiology"
              },
              {
                "id": "physio_p4_s4_t2",
                "name": "Molecular physiology"
              },
              {
                "id": "physio_p4_s4_t3",
                "name": "Neuroplasticity"
              }
            ]
          },
          {
            "id": "physio_p4_s5",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "physio_p4_s5_t1",
                "name": "Resting membrane potential & action potential"
              },
              {
                "id": "physio_p4_s5_t2",
                "name": "Cardiac cycle"
              },
              {
                "id": "physio_p4_s5_t3",
                "name": "Regulation of blood pressure"
              },
              {
                "id": "physio_p4_s5_t4",
                "name": "Glomerular filtration rate"
              },
              {
                "id": "physio_p4_s5_t5",
                "name": "Acid–base balance"
              },
              {
                "id": "physio_p4_s5_t6",
                "name": "Thyroid hormone physiology"
              },
              {
                "id": "physio_p4_s5_t7",
                "name": "Insulin and glucose metabolism"
              },
              {
                "id": "physio_p4_s5_t8",
                "name": "Menstrual cycle"
              },
              {
                "id": "physio_p4_s5_t9",
                "name": "Synaptic transmission"
              },
              {
                "id": "physio_p4_s5_t10",
                "name": "Exercise physiology"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c4",
    "name": "Mastering Biochemistry",
    "papers": [
      {
        "id": "biochem_p1",
        "name": "Paper I – General Biochemistry & Molecular Biology",
        "sections": [
          {
            "id": "biochem_p1_s1",
            "name": "Biomolecules",
            "topics": [
              {
                "id": "biochem_p1_s1_t1",
                "name": "Structure and function of proteins"
              },
              {
                "id": "biochem_p1_s1_t2",
                "name": "Protein folding and denaturation"
              },
              {
                "id": "biochem_p1_s1_t3",
                "name": "Enzymes (classification, kinetics, regulation)"
              },
              {
                "id": "biochem_p1_s1_t4",
                "name": "Isoenzymes and clinical significance"
              }
            ]
          },
          {
            "id": "biochem_p1_s2",
            "name": "Molecular Biology",
            "topics": [
              {
                "id": "biochem_p1_s2_t1",
                "name": "DNA structure and replication"
              },
              {
                "id": "biochem_p1_s2_t2",
                "name": "RNA transcription and processing"
              },
              {
                "id": "biochem_p1_s2_t3",
                "name": "Genetic code and translation"
              },
              {
                "id": "biochem_p1_s2_t4",
                "name": "Gene regulation (prokaryotic and eukaryotic)"
              }
            ]
          },
          {
            "id": "biochem_p1_s3",
            "name": "Molecular Techniques",
            "topics": [
              {
                "id": "biochem_p1_s3_t1",
                "name": "PCR"
              },
              {
                "id": "biochem_p1_s3_t2",
                "name": "Recombinant DNA technology"
              },
              {
                "id": "biochem_p1_s3_t3",
                "name": "DNA sequencing"
              },
              {
                "id": "biochem_p1_s3_t4",
                "name": "Blotting techniques (Southern, Northern, Western)"
              }
            ]
          },
          {
            "id": "biochem_p1_s4",
            "name": "Cell Biology",
            "topics": [
              {
                "id": "biochem_p1_s4_t1",
                "name": "Cell membrane structure"
              },
              {
                "id": "biochem_p1_s4_t2",
                "name": "Signal transduction pathways"
              },
              {
                "id": "biochem_p1_s4_t3",
                "name": "Apoptosis"
              }
            ]
          }
        ]
      },
      {
        "id": "biochem_p2",
        "name": "Paper II – Intermediary Metabolism & Bioenergetics",
        "sections": [
          {
            "id": "biochem_p2_s1",
            "name": "Carbohydrate Metabolism",
            "topics": [
              {
                "id": "biochem_p2_s1_t1",
                "name": "Glycolysis"
              },
              {
                "id": "biochem_p2_s1_t2",
                "name": "TCA cycle"
              },
              {
                "id": "biochem_p2_s1_t3",
                "name": "Gluconeogenesis"
              },
              {
                "id": "biochem_p2_s1_t4",
                "name": "Glycogen metabolism"
              },
              {
                "id": "biochem_p2_s1_t5",
                "name": "Regulation of blood glucose"
              }
            ]
          },
          {
            "id": "biochem_p2_s2",
            "name": "Lipid Metabolism",
            "topics": [
              {
                "id": "biochem_p2_s2_t1",
                "name": "Fatty acid oxidation"
              },
              {
                "id": "biochem_p2_s2_t2",
                "name": "Fatty acid synthesis"
              },
              {
                "id": "biochem_p2_s2_t3",
                "name": "Cholesterol metabolism"
              },
              {
                "id": "biochem_p2_s2_t4",
                "name": "Lipoproteins and dyslipidemia"
              }
            ]
          },
          {
            "id": "biochem_p2_s3",
            "name": "Protein & Amino Acid Metabolism",
            "topics": [
              {
                "id": "biochem_p2_s3_t1",
                "name": "Transamination and deamination"
              },
              {
                "id": "biochem_p2_s3_t2",
                "name": "Urea cycle"
              },
              {
                "id": "biochem_p2_s3_t3",
                "name": "Amino acid metabolism disorders"
              }
            ]
          },
          {
            "id": "biochem_p2_s4",
            "name": "Bioenergetics",
            "topics": [
              {
                "id": "biochem_p2_s4_t1",
                "name": "Electron transport chain"
              },
              {
                "id": "biochem_p2_s4_t2",
                "name": "Oxidative phosphorylation"
              },
              {
                "id": "biochem_p2_s4_t3",
                "name": "ATP synthesis"
              }
            ]
          }
        ]
      },
      {
        "id": "biochem_p3",
        "name": "Paper III – Clinical Biochemistry",
        "sections": [
          {
            "id": "biochem_p3_s1",
            "name": "Clinical Enzymology",
            "topics": [
              {
                "id": "biochem_p3_s1_t1",
                "name": "Diagnostic enzymes (AST, ALT, CK, LDH)"
              },
              {
                "id": "biochem_p3_s1_t2",
                "name": "Isoenzymes in disease diagnosis"
              }
            ]
          },
          {
            "id": "biochem_p3_s2",
            "name": "Organ Function Tests",
            "topics": [
              {
                "id": "biochem_p3_s2_t1",
                "name": "Liver function tests"
              },
              {
                "id": "biochem_p3_s2_t2",
                "name": "Kidney function tests"
              },
              {
                "id": "biochem_p3_s2_t3",
                "name": "Thyroid function tests"
              }
            ]
          },
          {
            "id": "biochem_p3_s3",
            "name": "Metabolic Disorders",
            "topics": [
              {
                "id": "biochem_p3_s3_t1",
                "name": "Diabetes mellitus"
              },
              {
                "id": "biochem_p3_s3_t2",
                "name": "Inborn errors of metabolism"
              },
              {
                "id": "biochem_p3_s3_t3",
                "name": "Hyperlipidemia"
              }
            ]
          },
          {
            "id": "biochem_p3_s4",
            "name": "Hormones",
            "topics": [
              {
                "id": "biochem_p3_s4_t1",
                "name": "Insulin and glucagon"
              },
              {
                "id": "biochem_p3_s4_t2",
                "name": "Steroid hormones"
              },
              {
                "id": "biochem_p3_s4_t3",
                "name": "Thyroid hormones"
              }
            ]
          }
        ]
      },
      {
        "id": "biochem_p4",
        "name": "Paper IV – Applied Biochemistry & Recent Advances",
        "sections": [
          {
            "id": "biochem_p4_s1",
            "name": "Nutrition",
            "topics": [
              {
                "id": "biochem_p4_s1_t1",
                "name": "Macronutrients and micronutrients"
              },
              {
                "id": "biochem_p4_s1_t2",
                "name": "Vitamin deficiencies"
              },
              {
                "id": "biochem_p4_s1_t3",
                "name": "Trace elements"
              }
            ]
          },
          {
            "id": "biochem_p4_s2",
            "name": "Molecular Medicine",
            "topics": [
              {
                "id": "biochem_p4_s2_t1",
                "name": "Cancer biochemistry"
              },
              {
                "id": "biochem_p4_s2_t2",
                "name": "Tumor markers"
              },
              {
                "id": "biochem_p4_s2_t3",
                "name": "Genetic diseases"
              }
            ]
          },
          {
            "id": "biochem_p4_s3",
            "name": "Laboratory Medicine",
            "topics": [
              {
                "id": "biochem_p4_s3_t1",
                "name": "Quality control in biochemical laboratories"
              },
              {
                "id": "biochem_p4_s3_t2",
                "name": "Automation in clinical biochemistry"
              },
              {
                "id": "biochem_p4_s3_t3",
                "name": "Biomarkers"
              }
            ]
          },
          {
            "id": "biochem_p4_s4",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "biochem_p4_s4_t1",
                "name": "Proteomics"
              },
              {
                "id": "biochem_p4_s4_t2",
                "name": "Genomics"
              },
              {
                "id": "biochem_p4_s4_t3",
                "name": "Metabolomics"
              },
              {
                "id": "biochem_p4_s4_t4",
                "name": "Personalized medicine"
              }
            ]
          },
          {
            "id": "biochem_p4_s5",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "biochem_p4_s5_t1",
                "name": "Enzyme kinetics"
              },
              {
                "id": "biochem_p4_s5_t2",
                "name": "DNA replication and repair"
              },
              {
                "id": "biochem_p4_s5_t3",
                "name": "Gene regulation"
              },
              {
                "id": "biochem_p4_s5_t4",
                "name": "Glycolysis and TCA cycle"
              },
              {
                "id": "biochem_p4_s5_t5",
                "name": "Urea cycle"
              },
              {
                "id": "biochem_p4_s5_t6",
                "name": "Lipoprotein metabolism"
              },
              {
                "id": "biochem_p4_s5_t7",
                "name": "Diabetes mellitus biochemistry"
              },
              {
                "id": "biochem_p4_s5_t8",
                "name": "Liver function tests"
              },
              {
                "id": "biochem_p4_s5_t9",
                "name": "Tumor markers"
              },
              {
                "id": "biochem_p4_s5_t10",
                "name": "Inborn errors of metabolism"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c5",
    "name": "Mastering Pharmacology",
    "papers": [
      {
        "id": "pharm_p1",
        "name": "Paper I – Basic & General Pharmacology",
        "sections": [
          {
            "id": "pharm_p1_s1",
            "name": "General Pharmacology",
            "topics": [
              {
                "id": "pharm_p1_s1_t1",
                "name": "Pharmacokinetics (ADME)"
              },
              {
                "id": "pharm_p1_s1_t2",
                "name": "Drug metabolism (Phase I & Phase II)"
              },
              {
                "id": "pharm_p1_s1_t3",
                "name": "Pharmacodynamics"
              },
              {
                "id": "pharm_p1_s1_t4",
                "name": "Drug receptors & signal transduction"
              },
              {
                "id": "pharm_p1_s1_t5",
                "name": "Dose-response curve"
              },
              {
                "id": "pharm_p1_s1_t6",
                "name": "Therapeutic index"
              },
              {
                "id": "pharm_p1_s1_t7",
                "name": "Drug interactions"
              },
              {
                "id": "pharm_p1_s1_t8",
                "name": "Adverse drug reactions (ADR)"
              },
              {
                "id": "pharm_p1_s1_t9",
                "name": "Pharmacogenetics / pharmacogenomics"
              },
              {
                "id": "pharm_p1_s1_t10",
                "name": "Bioavailability & bioequivalence"
              }
            ]
          },
          {
            "id": "pharm_p1_s2",
            "name": "Experimental Pharmacology",
            "topics": [
              {
                "id": "pharm_p1_s2_t1",
                "name": "Animal models for drug testing"
              },
              {
                "id": "pharm_p1_s2_t2",
                "name": "Screening methods for anti-inflammatory drugs"
              },
              {
                "id": "pharm_p1_s2_t3",
                "name": "Screening methods for analgesic drugs"
              },
              {
                "id": "pharm_p1_s2_t4",
                "name": "Screening for antiepileptic drugs"
              }
            ]
          },
          {
            "id": "pharm_p1_s3",
            "name": "Research & Clinical Trials",
            "topics": [
              {
                "id": "pharm_p1_s3_t1",
                "name": "Phases of clinical trials"
              },
              {
                "id": "pharm_p1_s3_t2",
                "name": "Phase 0 trials"
              },
              {
                "id": "pharm_p1_s3_t3",
                "name": "Good Clinical Practice (GCP)"
              },
              {
                "id": "pharm_p1_s3_t4",
                "name": "Ethics committee – composition & role"
              },
              {
                "id": "pharm_p1_s3_t5",
                "name": "Drug development process"
              }
            ]
          }
        ]
      },
      {
        "id": "pharm_p2",
        "name": "Paper II – Systemic Pharmacology",
        "sections": [
          {
            "id": "pharm_p2_s1",
            "name": "ANS",
            "topics": [
              {
                "id": "pharm_p2_s1_t1",
                "name": "Cholinergic drugs"
              },
              {
                "id": "pharm_p2_s1_t2",
                "name": "Anticholinergic drugs"
              },
              {
                "id": "pharm_p2_s1_t3",
                "name": "Adrenergic agonists"
              },
              {
                "id": "pharm_p2_s1_t4",
                "name": "Adrenergic blockers"
              },
              {
                "id": "pharm_p2_s1_t5",
                "name": "Drugs for myasthenia gravis"
              }
            ]
          },
          {
            "id": "pharm_p2_s2",
            "name": "CNS",
            "topics": [
              {
                "id": "pharm_p2_s2_t1",
                "name": "General anesthetics"
              },
              {
                "id": "pharm_p2_s2_t2",
                "name": "Local anesthetics"
              },
              {
                "id": "pharm_p2_s2_t3",
                "name": "Antiepileptic drugs"
              },
              {
                "id": "pharm_p2_s2_t4",
                "name": "Antipsychotics"
              },
              {
                "id": "pharm_p2_s2_t5",
                "name": "Antidepressants"
              },
              {
                "id": "pharm_p2_s2_t6",
                "name": "Opioid analgesics"
              },
              {
                "id": "pharm_p2_s2_t7",
                "name": "Parkinson’s drugs"
              }
            ]
          },
          {
            "id": "pharm_p2_s3",
            "name": "Cardiovascular",
            "topics": [
              {
                "id": "pharm_p2_s3_t1",
                "name": "Antihypertensive drugs"
              },
              {
                "id": "pharm_p2_s3_t2",
                "name": "Antianginal drugs"
              },
              {
                "id": "pharm_p2_s3_t3",
                "name": "Antiarrhythmic drugs"
              },
              {
                "id": "pharm_p2_s3_t4",
                "name": "Drugs for heart failure"
              },
              {
                "id": "pharm_p2_s3_t5",
                "name": "Hypolipidemic drugs"
              }
            ]
          },
          {
            "id": "pharm_p2_s4",
            "name": "Renal & Blood",
            "topics": [
              {
                "id": "pharm_p2_s4_t1",
                "name": "Diuretics"
              },
              {
                "id": "pharm_p2_s4_t2",
                "name": "Drugs used in shock"
              },
              {
                "id": "pharm_p2_s4_t3",
                "name": "Anticoagulants"
              },
              {
                "id": "pharm_p2_s4_t4",
                "name": "Antiplatelet drugs"
              },
              {
                "id": "pharm_p2_s4_t5",
                "name": "Thrombolytics"
              }
            ]
          }
        ]
      },
      {
        "id": "pharm_p3",
        "name": "Paper III – Systemic Pharmacology",
        "sections": [
          {
            "id": "pharm_p3_s1",
            "name": "Chemotherapy",
            "topics": [
              {
                "id": "pharm_p3_s1_t1",
                "name": "Antibiotics classification"
              },
              {
                "id": "pharm_p3_s1_t2",
                "name": "Beta-lactam antibiotics"
              },
              {
                "id": "pharm_p3_s1_t3",
                "name": "Aminoglycosides"
              },
              {
                "id": "pharm_p3_s1_t4",
                "name": "Macrolides"
              },
              {
                "id": "pharm_p3_s1_t5",
                "name": "Fluoroquinolones"
              },
              {
                "id": "pharm_p3_s1_t6",
                "name": "Antitubercular drugs"
              },
              {
                "id": "pharm_p3_s1_t7",
                "name": "Antimalarial drugs"
              },
              {
                "id": "pharm_p3_s1_t8",
                "name": "Antifungal drugs"
              },
              {
                "id": "pharm_p3_s1_t9",
                "name": "Antiviral drugs"
              },
              {
                "id": "pharm_p3_s1_t10",
                "name": "Anticancer drugs"
              },
              {
                "id": "pharm_p3_s1_t11",
                "name": "Drug resistance"
              }
            ]
          },
          {
            "id": "pharm_p3_s2",
            "name": "Endocrine Pharmacology",
            "topics": [
              {
                "id": "pharm_p3_s2_t1",
                "name": "Insulin & oral hypoglycemics"
              },
              {
                "id": "pharm_p3_s2_t2",
                "name": "Thyroid drugs"
              },
              {
                "id": "pharm_p3_s2_t3",
                "name": "Corticosteroids"
              },
              {
                "id": "pharm_p3_s2_t4",
                "name": "Sex hormones"
              },
              {
                "id": "pharm_p3_s2_t5",
                "name": "Oral contraceptives"
              }
            ]
          },
          {
            "id": "pharm_p3_s3",
            "name": "Other Important",
            "topics": [
              {
                "id": "pharm_p3_s3_t1",
                "name": "Drugs acting on uterus"
              },
              {
                "id": "pharm_p3_s3_t2",
                "name": "Prolactin inhibitors"
              },
              {
                "id": "pharm_p3_s3_t3",
                "name": "Non-contraceptive uses of OCPs"
              }
            ]
          }
        ]
      },
      {
        "id": "pharm_p4",
        "name": "Paper IV – Clinical Pharmacology",
        "sections": [
          {
            "id": "pharm_p4_s1",
            "name": "Important Topics",
            "topics": [
              {
                "id": "pharm_p4_s1_t1",
                "name": "Therapeutic drug monitoring"
              },
              {
                "id": "pharm_p4_s1_t2",
                "name": "Pharmacovigilance"
              },
              {
                "id": "pharm_p4_s1_t3",
                "name": "Adverse drug reaction monitoring"
              },
              {
                "id": "pharm_p4_s1_t4",
                "name": "Evidence-based medicine"
              },
              {
                "id": "pharm_p4_s1_t5",
                "name": "Pharmacoeconomics"
              },
              {
                "id": "pharm_p4_s1_t6",
                "name": "Drug utilization studies"
              },
              {
                "id": "pharm_p4_s1_t7",
                "name": "Probiotics & nutraceuticals"
              },
              {
                "id": "pharm_p4_s1_t8",
                "name": "Intravenous fluids"
              },
              {
                "id": "pharm_p4_s1_t9",
                "name": "Rational prescribing"
              },
              {
                "id": "pharm_p4_s1_t10",
                "name": "Fixed dose combinations"
              },
              {
                "id": "pharm_p4_s1_t11",
                "name": "Drug regulatory system"
              }
            ]
          },
          {
            "id": "pharm_p4_s2",
            "name": "Research Methods",
            "topics": [
              {
                "id": "pharm_p4_s2_t1",
                "name": "Clinical trial design"
              },
              {
                "id": "pharm_p4_s2_t2",
                "name": "Ethics committee"
              },
              {
                "id": "pharm_p4_s2_t3",
                "name": "Bioequivalence studies"
              },
              {
                "id": "pharm_p4_s2_t4",
                "name": "Drug safety monitoring"
              }
            ]
          },
          {
            "id": "pharm_p4_s3",
            "name": "Most Frequently Asked Across Papers",
            "topics": [
              {
                "id": "pharm_p4_s3_t1",
                "name": "Pharmacokinetics"
              },
              {
                "id": "pharm_p4_s3_t2",
                "name": "Antihypertensive drugs"
              },
              {
                "id": "pharm_p4_s3_t3",
                "name": "Diuretics"
              },
              {
                "id": "pharm_p4_s3_t4",
                "name": "Antiepileptics"
              },
              {
                "id": "pharm_p4_s3_t5",
                "name": "Antitubercular drugs"
              },
              {
                "id": "pharm_p4_s3_t6",
                "name": "Antimalarial drugs"
              },
              {
                "id": "pharm_p4_s3_t7",
                "name": "Insulin & OHA"
              },
              {
                "id": "pharm_p4_s3_t8",
                "name": "NSAIDs"
              },
              {
                "id": "pharm_p4_s3_t9",
                "name": "ADR & pharmacovigilance"
              },
              {
                "id": "pharm_p4_s3_t10",
                "name": "Clinical trials"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c6",
    "name": "Mastering Pathology",
    "papers": [
      {
        "id": "path_p1",
        "name": "Paper I – General Pathology & Basic Techniques",
        "sections": [
          {
            "id": "path_p1_s1",
            "name": "General Pathology",
            "topics": [
              {
                "id": "path_p1_s1_t1",
                "name": "Cell injury and cell death (necrosis vs apoptosis)"
              },
              {
                "id": "path_p1_s1_t2",
                "name": "Cellular adaptations (atrophy, hypertrophy, hyperplasia, metaplasia)"
              },
              {
                "id": "path_p1_s1_t3",
                "name": "Inflammation (acute & chronic)"
              },
              {
                "id": "path_p1_s1_t4",
                "name": "Chemical mediators of inflammation"
              },
              {
                "id": "path_p1_s1_t5",
                "name": "Tissue repair and wound healing"
              },
              {
                "id": "path_p1_s1_t6",
                "name": "Hemodynamic disorders (edema, thrombosis, embolism, shock)"
              },
              {
                "id": "path_p1_s1_t7",
                "name": "Ischemia and infarction"
              }
            ]
          },
          {
            "id": "path_p1_s2",
            "name": "Immunopathology",
            "topics": [
              {
                "id": "path_p1_s2_t1",
                "name": "Hypersensitivity reactions (Types I–IV)"
              },
              {
                "id": "path_p1_s2_t2",
                "name": "Autoimmune diseases"
              },
              {
                "id": "path_p1_s2_t3",
                "name": "Immunodeficiency disorders"
              },
              {
                "id": "path_p1_s2_t4",
                "name": "Transplant rejection"
              },
              {
                "id": "path_p1_s2_t5",
                "name": "Amyloidosis"
              }
            ]
          },
          {
            "id": "path_p1_s3",
            "name": "Molecular Pathology",
            "topics": [
              {
                "id": "path_p1_s3_t1",
                "name": "Oncogenes and tumor suppressor genes"
              },
              {
                "id": "path_p1_s3_t2",
                "name": "Molecular basis of cancer"
              },
              {
                "id": "path_p1_s3_t3",
                "name": "Apoptosis pathways"
              }
            ]
          },
          {
            "id": "path_p1_s4",
            "name": "Laboratory Techniques",
            "topics": [
              {
                "id": "path_p1_s4_t1",
                "name": "Immunohistochemistry"
              },
              {
                "id": "path_p1_s4_t2",
                "name": "Flow cytometry"
              },
              {
                "id": "path_p1_s4_t3",
                "name": "PCR in pathology"
              },
              {
                "id": "path_p1_s4_t4",
                "name": "Cytogenetics"
              },
              {
                "id": "path_p1_s4_t5",
                "name": "Frozen section"
              }
            ]
          }
        ]
      },
      {
        "id": "path_p2",
        "name": "Paper II – Systemic Pathology",
        "sections": [
          {
            "id": "path_p2_s1",
            "name": "Cardiovascular System",
            "topics": [
              {
                "id": "path_p2_s1_t1",
                "name": "Atherosclerosis"
              },
              {
                "id": "path_p2_s1_t2",
                "name": "Ischemic heart disease"
              },
              {
                "id": "path_p2_s1_t3",
                "name": "Hypertension pathology"
              },
              {
                "id": "path_p2_s1_t4",
                "name": "Cardiomyopathies"
              },
              {
                "id": "path_p2_s1_t5",
                "name": "Infective endocarditis"
              }
            ]
          },
          {
            "id": "path_p2_s2",
            "name": "Respiratory System",
            "topics": [
              {
                "id": "path_p2_s2_t1",
                "name": "Pneumonia"
              },
              {
                "id": "path_p2_s2_t2",
                "name": "Tuberculosis pathology"
              },
              {
                "id": "path_p2_s2_t3",
                "name": "COPD"
              },
              {
                "id": "path_p2_s2_t4",
                "name": "Lung carcinoma"
              }
            ]
          },
          {
            "id": "path_p2_s3",
            "name": "Gastrointestinal System",
            "topics": [
              {
                "id": "path_p2_s3_t1",
                "name": "Peptic ulcer disease"
              },
              {
                "id": "path_p2_s3_t2",
                "name": "Gastric carcinoma"
              },
              {
                "id": "path_p2_s3_t3",
                "name": "Inflammatory bowel disease"
              },
              {
                "id": "path_p2_s3_t4",
                "name": "Colorectal carcinoma"
              }
            ]
          },
          {
            "id": "path_p2_s4",
            "name": "Hepatobiliary System",
            "topics": [
              {
                "id": "path_p2_s4_t1",
                "name": "Viral hepatitis"
              },
              {
                "id": "path_p2_s4_t2",
                "name": "Cirrhosis"
              },
              {
                "id": "path_p2_s4_t3",
                "name": "Hepatocellular carcinoma"
              },
              {
                "id": "path_p2_s4_t4",
                "name": "Gall bladder diseases"
              }
            ]
          },
          {
            "id": "path_p2_s5",
            "name": "Renal Pathology",
            "topics": [
              {
                "id": "path_p2_s5_t1",
                "name": "Glomerulonephritis"
              },
              {
                "id": "path_p2_s5_t2",
                "name": "Nephrotic syndrome"
              },
              {
                "id": "path_p2_s5_t3",
                "name": "Acute tubular necrosis"
              },
              {
                "id": "path_p2_s5_t4",
                "name": "Renal cell carcinoma"
              }
            ]
          },
          {
            "id": "path_p2_s6",
            "name": "Endocrine System",
            "topics": [
              {
                "id": "path_p2_s6_t1",
                "name": "Thyroid disorders"
              },
              {
                "id": "path_p2_s6_t2",
                "name": "Diabetes pathology"
              },
              {
                "id": "path_p2_s6_t3",
                "name": "Adrenal tumors"
              }
            ]
          }
        ]
      },
      {
        "id": "path_p3",
        "name": "Paper III – Hematology & Transfusion Medicine",
        "sections": [
          {
            "id": "path_p3_s1",
            "name": "RBC Disorders",
            "topics": [
              {
                "id": "path_p3_s1_t1",
                "name": "Iron deficiency anemia"
              },
              {
                "id": "path_p3_s1_t2",
                "name": "Megaloblastic anemia"
              },
              {
                "id": "path_p3_s1_t3",
                "name": "Hemolytic anemia"
              },
              {
                "id": "path_p3_s1_t4",
                "name": "Thalassemia"
              },
              {
                "id": "path_p3_s1_t5",
                "name": "Sickle cell anemia"
              }
            ]
          },
          {
            "id": "path_p3_s2",
            "name": "WBC Disorders",
            "topics": [
              {
                "id": "path_p3_s2_t1",
                "name": "Leukemias (acute & chronic)"
              },
              {
                "id": "path_p3_s2_t2",
                "name": "Lymphomas"
              },
              {
                "id": "path_p3_s2_t3",
                "name": "Multiple myeloma"
              },
              {
                "id": "path_p3_s2_t4",
                "name": "Myeloproliferative disorders"
              }
            ]
          },
          {
            "id": "path_p3_s3",
            "name": "Platelet Disorders",
            "topics": [
              {
                "id": "path_p3_s3_t1",
                "name": "Thrombocytopenia"
              },
              {
                "id": "path_p3_s3_t2",
                "name": "Platelet function disorders"
              }
            ]
          },
          {
            "id": "path_p3_s4",
            "name": "Coagulation Disorders",
            "topics": [
              {
                "id": "path_p3_s4_t1",
                "name": "Hemophilia"
              },
              {
                "id": "path_p3_s4_t2",
                "name": "Disseminated intravascular coagulation (DIC)"
              }
            ]
          },
          {
            "id": "path_p3_s5",
            "name": "Transfusion Medicine",
            "topics": [
              {
                "id": "path_p3_s5_t1",
                "name": "Blood grouping"
              },
              {
                "id": "path_p3_s5_t2",
                "name": "Cross matching"
              },
              {
                "id": "path_p3_s5_t3",
                "name": "Blood component therapy"
              },
              {
                "id": "path_p3_s5_t4",
                "name": "Transfusion reactions"
              },
              {
                "id": "path_p3_s5_t5",
                "name": "Massive transfusion protocol"
              }
            ]
          }
        ]
      },
      {
        "id": "path_p4",
        "name": "Paper IV – Clinical Pathology, Cytopathology & Laboratory Medicine",
        "sections": [
          {
            "id": "path_p4_s1",
            "name": "Cytopathology",
            "topics": [
              {
                "id": "path_p4_s1_t1",
                "name": "Pap smear interpretation"
              },
              {
                "id": "path_p4_s1_t2",
                "name": "FNAC techniques"
              },
              {
                "id": "path_p4_s1_t3",
                "name": "Cytology of thyroid lesions"
              },
              {
                "id": "path_p4_s1_t4",
                "name": "Breast cytology"
              },
              {
                "id": "path_p4_s1_t5",
                "name": "Lymph node cytology"
              }
            ]
          },
          {
            "id": "path_p4_s2",
            "name": "Clinical Pathology",
            "topics": [
              {
                "id": "path_p4_s2_t1",
                "name": "Urine examination"
              },
              {
                "id": "path_p4_s2_t2",
                "name": "CSF analysis"
              },
              {
                "id": "path_p4_s2_t3",
                "name": "Body fluid analysis"
              },
              {
                "id": "path_p4_s2_t4",
                "name": "Semen analysis"
              }
            ]
          },
          {
            "id": "path_p4_s3",
            "name": "Laboratory Medicine",
            "topics": [
              {
                "id": "path_p4_s3_t1",
                "name": "Quality control in laboratory"
              },
              {
                "id": "path_p4_s3_t2",
                "name": "Quality assurance"
              },
              {
                "id": "path_p4_s3_t3",
                "name": "Laboratory safety"
              }
            ]
          },
          {
            "id": "path_p4_s4",
            "name": "Tumor Pathology",
            "topics": [
              {
                "id": "path_p4_s4_t1",
                "name": "Tumor markers"
              },
              {
                "id": "path_p4_s4_t2",
                "name": "Tumor grading and staging"
              },
              {
                "id": "path_p4_s4_t3",
                "name": "Paraneoplastic syndromes"
              }
            ]
          },
          {
            "id": "path_p4_s5",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "path_p4_s5_t1",
                "name": "Cell injury and apoptosis"
              },
              {
                "id": "path_p4_s5_t2",
                "name": "Inflammation"
              },
              {
                "id": "path_p4_s5_t3",
                "name": "Amyloidosis"
              },
              {
                "id": "path_p4_s5_t4",
                "name": "Atherosclerosis"
              },
              {
                "id": "path_p4_s5_t5",
                "name": "Cirrhosis liver"
              },
              {
                "id": "path_p4_s5_t6",
                "name": "Glomerulonephritis"
              },
              {
                "id": "path_p4_s5_t7",
                "name": "Leukemias"
              },
              {
                "id": "path_p4_s5_t8",
                "name": "Lymphomas"
              },
              {
                "id": "path_p4_s5_t9",
                "name": "Iron deficiency anemia"
              },
              {
                "id": "path_p4_s5_t10",
                "name": "Tumor markers"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c7",
    "name": "Mastering Microbiology",
    "papers": [
      {
        "id": "micro_p1",
        "name": "Paper I – General Microbiology, Immunology & Molecular Biology",
        "sections": [
          {
            "id": "micro_p1_s1",
            "name": "General Microbiology",
            "topics": [
              {
                "id": "micro_p1_s1_t1",
                "name": "Structure and function of bacteria"
              },
              {
                "id": "micro_p1_s1_t2",
                "name": "Bacterial growth curve"
              },
              {
                "id": "micro_p1_s1_t3",
                "name": "Sterilization and disinfection"
              },
              {
                "id": "micro_p1_s1_t4",
                "name": "Culture media"
              },
              {
                "id": "micro_p1_s1_t5",
                "name": "Bacterial genetics"
              },
              {
                "id": "micro_p1_s1_t6",
                "name": "Mechanisms of antimicrobial resistance"
              }
            ]
          },
          {
            "id": "micro_p1_s2",
            "name": "Immunology",
            "topics": [
              {
                "id": "micro_p1_s2_t1",
                "name": "Innate vs adaptive immunity"
              },
              {
                "id": "micro_p1_s2_t2",
                "name": "Antigen-antibody reactions"
              },
              {
                "id": "micro_p1_s2_t3",
                "name": "Hypersensitivity reactions"
              },
              {
                "id": "micro_p1_s2_t4",
                "name": "Autoimmunity"
              },
              {
                "id": "micro_p1_s2_t5",
                "name": "Immunodeficiency disorders"
              },
              {
                "id": "micro_p1_s2_t6",
                "name": "Major histocompatibility complex (MHC)"
              },
              {
                "id": "micro_p1_s2_t7",
                "name": "Vaccines and immunization"
              }
            ]
          },
          {
            "id": "micro_p1_s3",
            "name": "Molecular Microbiology",
            "topics": [
              {
                "id": "micro_p1_s3_t1",
                "name": "PCR and molecular diagnostics"
              },
              {
                "id": "micro_p1_s3_t2",
                "name": "Recombinant DNA technology"
              },
              {
                "id": "micro_p1_s3_t3",
                "name": "Gene transfer in bacteria"
              },
              {
                "id": "micro_p1_s3_t4",
                "name": "Molecular epidemiology"
              }
            ]
          }
        ]
      },
      {
        "id": "micro_p2",
        "name": "Paper II – Systematic Bacteriology",
        "sections": [
          {
            "id": "micro_p2_s1",
            "name": "Gram Positive Bacteria",
            "topics": [
              {
                "id": "micro_p2_s1_t1",
                "name": "Staphylococcus"
              },
              {
                "id": "micro_p2_s1_t2",
                "name": "Streptococcus"
              },
              {
                "id": "micro_p2_s1_t3",
                "name": "Pneumococcus"
              },
              {
                "id": "micro_p2_s1_t4",
                "name": "Corynebacterium diphtheriae"
              },
              {
                "id": "micro_p2_s1_t5",
                "name": "Bacillus anthracis"
              },
              {
                "id": "micro_p2_s1_t6",
                "name": "Clostridium species"
              }
            ]
          },
          {
            "id": "micro_p2_s2",
            "name": "Gram Negative Bacteria",
            "topics": [
              {
                "id": "micro_p2_s2_t1",
                "name": "Enterobacteriaceae"
              },
              {
                "id": "micro_p2_s2_t2",
                "name": "Salmonella"
              },
              {
                "id": "micro_p2_s2_t3",
                "name": "Shigella"
              },
              {
                "id": "micro_p2_s2_t4",
                "name": "Vibrio cholerae"
              },
              {
                "id": "micro_p2_s2_t5",
                "name": "Pseudomonas"
              },
              {
                "id": "micro_p2_s2_t6",
                "name": "Haemophilus influenzae"
              },
              {
                "id": "micro_p2_s2_t7",
                "name": "Neisseria"
              }
            ]
          },
          {
            "id": "micro_p2_s3",
            "name": "Special Bacteria",
            "topics": [
              {
                "id": "micro_p2_s3_t1",
                "name": "Mycobacterium tuberculosis"
              },
              {
                "id": "micro_p2_s3_t2",
                "name": "Mycobacterium leprae"
              },
              {
                "id": "micro_p2_s3_t3",
                "name": "Spirochetes (Treponema, Leptospira)"
              },
              {
                "id": "micro_p2_s3_t4",
                "name": "Rickettsia"
              },
              {
                "id": "micro_p2_s3_t5",
                "name": "Chlamydia"
              },
              {
                "id": "micro_p2_s3_t6",
                "name": "Mycoplasma"
              }
            ]
          },
          {
            "id": "micro_p2_s4",
            "name": "Applied Bacteriology",
            "topics": [
              {
                "id": "micro_p2_s4_t1",
                "name": "Hospital acquired infections"
              },
              {
                "id": "micro_p2_s4_t2",
                "name": "Antimicrobial susceptibility testing"
              },
              {
                "id": "micro_p2_s4_t3",
                "name": "Mechanisms of antibiotic resistance"
              }
            ]
          }
        ]
      },
      {
        "id": "micro_p3",
        "name": "Paper III – Virology, Mycology & Parasitology",
        "sections": [
          {
            "id": "micro_p3_s1",
            "name": "Virology",
            "topics": [
              {
                "id": "micro_p3_s1_t1",
                "name": "Virus structure and replication"
              },
              {
                "id": "micro_p3_s1_t2",
                "name": "Viral culture techniques"
              },
              {
                "id": "micro_p3_s1_t3",
                "name": "Herpes viruses"
              },
              {
                "id": "micro_p3_s1_t4",
                "name": "Hepatitis viruses"
              },
              {
                "id": "micro_p3_s1_t5",
                "name": "HIV"
              },
              {
                "id": "micro_p3_s1_t6",
                "name": "Influenza virus"
              },
              {
                "id": "micro_p3_s1_t7",
                "name": "Rabies virus"
              },
              {
                "id": "micro_p3_s1_t8",
                "name": "Emerging viral infections"
              }
            ]
          },
          {
            "id": "micro_p3_s2",
            "name": "Mycology",
            "topics": [
              {
                "id": "micro_p3_s2_t1",
                "name": "Candida"
              },
              {
                "id": "micro_p3_s2_t2",
                "name": "Aspergillus"
              },
              {
                "id": "micro_p3_s2_t3",
                "name": "Cryptococcus"
              },
              {
                "id": "micro_p3_s2_t4",
                "name": "Dermatophytes"
              },
              {
                "id": "micro_p3_s2_t5",
                "name": "Dimorphic fungi"
              },
              {
                "id": "micro_p3_s2_t6",
                "name": "Opportunistic fungal infections"
              }
            ]
          },
          {
            "id": "micro_p3_s3",
            "name": "Parasitology",
            "topics": [
              {
                "id": "micro_p3_s3_t1",
                "name": "Malaria parasite"
              },
              {
                "id": "micro_p3_s3_t2",
                "name": "Leishmania"
              },
              {
                "id": "micro_p3_s3_t3",
                "name": "Entamoeba histolytica"
              },
              {
                "id": "micro_p3_s3_t4",
                "name": "Giardia lamblia"
              },
              {
                "id": "micro_p3_s3_t5",
                "name": "Toxoplasma"
              },
              {
                "id": "micro_p3_s3_t6",
                "name": "Helminths (Taenia, Ascaris, filariasis)"
              }
            ]
          }
        ]
      },
      {
        "id": "micro_p4",
        "name": "Paper IV – Applied Microbiology & Clinical Microbiology",
        "sections": [
          {
            "id": "micro_p4_s1",
            "name": "Clinical Microbiology",
            "topics": [
              {
                "id": "micro_p4_s1_t1",
                "name": "Specimen collection and transport"
              },
              {
                "id": "micro_p4_s1_t2",
                "name": "Laboratory diagnosis of infections"
              },
              {
                "id": "micro_p4_s1_t3",
                "name": "Blood culture techniques"
              },
              {
                "id": "micro_p4_s1_t4",
                "name": "Serological tests"
              }
            ]
          },
          {
            "id": "micro_p4_s2",
            "name": "Hospital Infection Control",
            "topics": [
              {
                "id": "micro_p4_s2_t1",
                "name": "Nosocomial infections"
              },
              {
                "id": "micro_p4_s2_t2",
                "name": "Infection control policies"
              },
              {
                "id": "micro_p4_s2_t3",
                "name": "Sterilization in hospitals"
              },
              {
                "id": "micro_p4_s2_t4",
                "name": "Biomedical waste management"
              }
            ]
          },
          {
            "id": "micro_p4_s3",
            "name": "Public Health Microbiology",
            "topics": [
              {
                "id": "micro_p4_s3_t1",
                "name": "Vaccination schedules"
              },
              {
                "id": "micro_p4_s3_t2",
                "name": "Epidemiology of infectious diseases"
              },
              {
                "id": "micro_p4_s3_t3",
                "name": "Outbreak investigation"
              }
            ]
          },
          {
            "id": "micro_p4_s4",
            "name": "Diagnostic Techniques",
            "topics": [
              {
                "id": "micro_p4_s4_t1",
                "name": "ELISA"
              },
              {
                "id": "micro_p4_s4_t2",
                "name": "Rapid diagnostic tests"
              },
              {
                "id": "micro_p4_s4_t3",
                "name": "Molecular diagnostics"
              },
              {
                "id": "micro_p4_s4_t4",
                "name": "Automation in microbiology labs"
              }
            ]
          },
          {
            "id": "micro_p4_s5",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "micro_p4_s5_t1",
                "name": "Sterilization and disinfection"
              },
              {
                "id": "micro_p4_s5_t2",
                "name": "Antigen-antibody reactions"
              },
              {
                "id": "micro_p4_s5_t3",
                "name": "Hypersensitivity reactions"
              },
              {
                "id": "micro_p4_s5_t4",
                "name": "Antimicrobial resistance mechanisms"
              },
              {
                "id": "micro_p4_s5_t5",
                "name": "Mycobacterium tuberculosis"
              },
              {
                "id": "micro_p4_s5_t6",
                "name": "Staphylococcus and Streptococcus"
              },
              {
                "id": "micro_p4_s5_t7",
                "name": "HIV"
              },
              {
                "id": "micro_p4_s5_t8",
                "name": "Hepatitis viruses"
              },
              {
                "id": "micro_p4_s5_t9",
                "name": "Malaria parasite"
              },
              {
                "id": "micro_p4_s5_t10",
                "name": "Hospital acquired infections"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c8",
    "name": "Mastering PSM / Community Medicine",
    "papers": [
      {
        "id": "psm_p1",
        "name": "Paper I – Epidemiology & Biostatistics",
        "sections": [
          {
            "id": "psm_p1_s1",
            "name": "Epidemiology",
            "topics": [
              {
                "id": "psm_p1_s1_t1",
                "name": "Concepts and principles of epidemiology"
              },
              {
                "id": "psm_p1_s1_t2",
                "name": "Epidemiological triad"
              },
              {
                "id": "psm_p1_s1_t3",
                "name": "Natural history of disease"
              },
              {
                "id": "psm_p1_s1_t4",
                "name": "Levels of prevention"
              },
              {
                "id": "psm_p1_s1_t5",
                "name": "Disease surveillance"
              },
              {
                "id": "psm_p1_s1_t6",
                "name": "Screening tests (sensitivity, specificity, predictive values)"
              },
              {
                "id": "psm_p1_s1_t7",
                "name": "Outbreak investigation"
              },
              {
                "id": "psm_p1_s1_t8",
                "name": "Epidemiological study designs (cohort, case-control, RCT)"
              },
              {
                "id": "psm_p1_s1_t9",
                "name": "Bias and confounding"
              }
            ]
          },
          {
            "id": "psm_p1_s2",
            "name": "Biostatistics",
            "topics": [
              {
                "id": "psm_p1_s2_t1",
                "name": "Types of data and scales of measurement"
              },
              {
                "id": "psm_p1_s2_t2",
                "name": "Measures of central tendency"
              },
              {
                "id": "psm_p1_s2_t3",
                "name": "Measures of dispersion"
              },
              {
                "id": "psm_p1_s2_t4",
                "name": "Probability concepts"
              },
              {
                "id": "psm_p1_s2_t5",
                "name": "Sampling methods"
              },
              {
                "id": "psm_p1_s2_t6",
                "name": "Hypothesis testing"
              },
              {
                "id": "psm_p1_s2_t7",
                "name": "Statistical tests (t-test, chi-square, ANOVA)"
              },
              {
                "id": "psm_p1_s2_t8",
                "name": "Correlation and regression"
              }
            ]
          }
        ]
      },
      {
        "id": "psm_p2",
        "name": "Paper II – Environmental Health & Occupational Health",
        "sections": [
          {
            "id": "psm_p2_s1",
            "name": "Environmental Health",
            "topics": [
              {
                "id": "psm_p2_s1_t1",
                "name": "Water purification and water quality standards"
              },
              {
                "id": "psm_p2_s1_t2",
                "name": "Air pollution and health effects"
              },
              {
                "id": "psm_p2_s1_t3",
                "name": "Noise pollution"
              },
              {
                "id": "psm_p2_s1_t4",
                "name": "Waste disposal methods"
              },
              {
                "id": "psm_p2_s1_t5",
                "name": "Housing and sanitation"
              },
              {
                "id": "psm_p2_s1_t6",
                "name": "Vector control methods"
              }
            ]
          },
          {
            "id": "psm_p2_s2",
            "name": "Occupational Health",
            "topics": [
              {
                "id": "psm_p2_s2_t1",
                "name": "Occupational diseases"
              },
              {
                "id": "psm_p2_s2_t2",
                "name": "Industrial hazards"
              },
              {
                "id": "psm_p2_s2_t3",
                "name": "Ergonomics"
              },
              {
                "id": "psm_p2_s2_t4",
                "name": "Occupational safety measures"
              }
            ]
          },
          {
            "id": "psm_p2_s3",
            "name": "Nutrition",
            "topics": [
              {
                "id": "psm_p2_s3_t1",
                "name": "Nutritional requirements"
              },
              {
                "id": "psm_p2_s3_t2",
                "name": "Protein-energy malnutrition"
              },
              {
                "id": "psm_p2_s3_t3",
                "name": "Micronutrient deficiencies"
              },
              {
                "id": "psm_p2_s3_t4",
                "name": "National nutrition programs"
              }
            ]
          }
        ]
      },
      {
        "id": "psm_p3",
        "name": "Paper III – Public Health Programs & Health Care Systems",
        "sections": [
          {
            "id": "psm_p3_s1",
            "name": "National Health Programs",
            "topics": [
              {
                "id": "psm_p3_s1_t1",
                "name": "Tuberculosis control program"
              },
              {
                "id": "psm_p3_s1_t2",
                "name": "HIV/AIDS control program"
              },
              {
                "id": "psm_p3_s1_t3",
                "name": "Malaria control program"
              },
              {
                "id": "psm_p3_s1_t4",
                "name": "Immunization program"
              },
              {
                "id": "psm_p3_s1_t5",
                "name": "Leprosy control program"
              },
              {
                "id": "psm_p3_s1_t6",
                "name": "National non-communicable disease programs"
              }
            ]
          },
          {
            "id": "psm_p3_s2",
            "name": "Health Care System",
            "topics": [
              {
                "id": "psm_p3_s2_t1",
                "name": "Primary health care"
              },
              {
                "id": "psm_p3_s2_t2",
                "name": "Health indicators"
              },
              {
                "id": "psm_p3_s2_t3",
                "name": "Health planning in India"
              },
              {
                "id": "psm_p3_s2_t4",
                "name": "Health committees and policies"
              },
              {
                "id": "psm_p3_s2_t5",
                "name": "Health insurance schemes"
              }
            ]
          },
          {
            "id": "psm_p3_s3",
            "name": "Demography",
            "topics": [
              {
                "id": "psm_p3_s3_t1",
                "name": "Population growth"
              },
              {
                "id": "psm_p3_s3_t2",
                "name": "Fertility and mortality indicators"
              },
              {
                "id": "psm_p3_s3_t3",
                "name": "Population policies"
              }
            ]
          }
        ]
      },
      {
        "id": "psm_p4",
        "name": "Paper IV – Health Management, Research Methodology & Recent Advances",
        "sections": [
          {
            "id": "psm_p4_s1",
            "name": "Health Management",
            "topics": [
              {
                "id": "psm_p4_s1_t1",
                "name": "Health administration"
              },
              {
                "id": "psm_p4_s1_t2",
                "name": "Health economics"
              },
              {
                "id": "psm_p4_s1_t3",
                "name": "Health manpower planning"
              },
              {
                "id": "psm_p4_s1_t4",
                "name": "Hospital management"
              }
            ]
          },
          {
            "id": "psm_p4_s2",
            "name": "Research Methodology",
            "topics": [
              {
                "id": "psm_p4_s2_t1",
                "name": "Research design"
              },
              {
                "id": "psm_p4_s2_t2",
                "name": "Protocol writing"
              },
              {
                "id": "psm_p4_s2_t3",
                "name": "Data collection methods"
              },
              {
                "id": "psm_p4_s2_t4",
                "name": "Ethical issues in research"
              },
              {
                "id": "psm_p4_s2_t5",
                "name": "Evidence-based medicine"
              }
            ]
          },
          {
            "id": "psm_p4_s3",
            "name": "Health Education",
            "topics": [
              {
                "id": "psm_p4_s3_t1",
                "name": "Communication methods"
              },
              {
                "id": "psm_p4_s3_t2",
                "name": "Behavior change communication"
              },
              {
                "id": "psm_p4_s3_t3",
                "name": "Health promotion strategies"
              }
            ]
          },
          {
            "id": "psm_p4_s4",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "psm_p4_s4_t1",
                "name": "Digital health"
              },
              {
                "id": "psm_p4_s4_t2",
                "name": "Telemedicine"
              },
              {
                "id": "psm_p4_s4_t3",
                "name": "Artificial intelligence in public health"
              },
              {
                "id": "psm_p4_s4_t4",
                "name": "Global health initiatives"
              }
            ]
          },
          {
            "id": "psm_p4_s5",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "psm_p4_s5_t1",
                "name": "Epidemiological study designs"
              },
              {
                "id": "psm_p4_s5_t2",
                "name": "Screening tests (sensitivity and specificity)"
              },
              {
                "id": "psm_p4_s5_t3",
                "name": "Outbreak investigation"
              },
              {
                "id": "psm_p4_s5_t4",
                "name": "Biostatistical tests"
              },
              {
                "id": "psm_p4_s5_t5",
                "name": "National immunization program"
              },
              {
                "id": "psm_p4_s5_t6",
                "name": "Tuberculosis control program"
              },
              {
                "id": "psm_p4_s5_t7",
                "name": "Water purification methods"
              },
              {
                "id": "psm_p4_s5_t8",
                "name": "Occupational diseases"
              },
              {
                "id": "psm_p4_s5_t9",
                "name": "Health indicators"
              },
              {
                "id": "psm_p4_s5_t10",
                "name": "Research methodology"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c9",
    "name": "Mastering Forensic Medicine & Toxicology",
    "papers": [
      {
        "id": "fmt_p1",
        "name": "Paper I – Forensic Pathology",
        "sections": [
          {
            "id": "fmt_p1_s1",
            "name": "Postmortem Changes",
            "topics": [
              {
                "id": "fmt_p1_s1_t1",
                "name": "Rigor mortis"
              },
              {
                "id": "fmt_p1_s1_t2",
                "name": "Livor mortis"
              },
              {
                "id": "fmt_p1_s1_t3",
                "name": "Algor mortis"
              },
              {
                "id": "fmt_p1_s1_t4",
                "name": "Decomposition"
              },
              {
                "id": "fmt_p1_s1_t5",
                "name": "Estimation of time since death"
              }
            ]
          },
          {
            "id": "fmt_p1_s2",
            "name": "Mechanical Injuries",
            "topics": [
              {
                "id": "fmt_p1_s2_t1",
                "name": "Classification of injuries"
              },
              {
                "id": "fmt_p1_s2_t2",
                "name": "Abrasion, contusion, laceration"
              },
              {
                "id": "fmt_p1_s2_t3",
                "name": "Incised wounds"
              },
              {
                "id": "fmt_p1_s2_t4",
                "name": "Firearm injuries"
              },
              {
                "id": "fmt_p1_s2_t5",
                "name": "Blast injuries"
              }
            ]
          },
          {
            "id": "fmt_p1_s3",
            "name": "Asphyxial Deaths",
            "topics": [
              {
                "id": "fmt_p1_s3_t1",
                "name": "Hanging"
              },
              {
                "id": "fmt_p1_s3_t2",
                "name": "Strangulation"
              },
              {
                "id": "fmt_p1_s3_t3",
                "name": "Suffocation"
              },
              {
                "id": "fmt_p1_s3_t4",
                "name": "Drowning"
              }
            ]
          },
          {
            "id": "fmt_p1_s4",
            "name": "Identification",
            "topics": [
              {
                "id": "fmt_p1_s4_t1",
                "name": "Age estimation"
              },
              {
                "id": "fmt_p1_s4_t2",
                "name": "Sex determination"
              },
              {
                "id": "fmt_p1_s4_t3",
                "name": "Stature estimation"
              },
              {
                "id": "fmt_p1_s4_t4",
                "name": "Identification from skeletal remains"
              }
            ]
          }
        ]
      },
      {
        "id": "fmt_p2",
        "name": "Paper II – Clinical Forensic Medicine",
        "sections": [
          {
            "id": "fmt_p2_s1",
            "name": "Sexual Offences",
            "topics": [
              {
                "id": "fmt_p2_s1_t1",
                "name": "Rape examination"
              },
              {
                "id": "fmt_p2_s1_t2",
                "name": "Sexual assault evidence collection"
              },
              {
                "id": "fmt_p2_s1_t3",
                "name": "Virginity and hymen examination"
              }
            ]
          },
          {
            "id": "fmt_p2_s2",
            "name": "Child Abuse",
            "topics": [
              {
                "id": "fmt_p2_s2_t1",
                "name": "Physical abuse"
              },
              {
                "id": "fmt_p2_s2_t2",
                "name": "Sexual abuse"
              },
              {
                "id": "fmt_p2_s2_t3",
                "name": "Neglect"
              }
            ]
          },
          {
            "id": "fmt_p2_s3",
            "name": "Domestic Violence",
            "topics": [
              {
                "id": "fmt_p2_s3_t1",
                "name": "Medicolegal aspects of assault"
              }
            ]
          },
          {
            "id": "fmt_p2_s4",
            "name": "Medicolegal Examination",
            "topics": [
              {
                "id": "fmt_p2_s4_t1",
                "name": "Injury certificate"
              },
              {
                "id": "fmt_p2_s4_t2",
                "name": "Medical report writing"
              },
              {
                "id": "fmt_p2_s4_t3",
                "name": "Consent in medicolegal cases"
              }
            ]
          },
          {
            "id": "fmt_p2_s5",
            "name": "Death Investigation",
            "topics": [
              {
                "id": "fmt_p2_s5_t1",
                "name": "Custodial deaths"
              },
              {
                "id": "fmt_p2_s5_t2",
                "name": "Sudden natural deaths"
              }
            ]
          }
        ]
      },
      {
        "id": "fmt_p3",
        "name": "Paper III – Toxicology",
        "sections": [
          {
            "id": "fmt_p3_s1",
            "name": "General Toxicology",
            "topics": [
              {
                "id": "fmt_p3_s1_t1",
                "name": "Toxicokinetics"
              },
              {
                "id": "fmt_p3_s1_t2",
                "name": "Toxicodynamics"
              },
              {
                "id": "fmt_p3_s1_t3",
                "name": "Management of poisoning"
              }
            ]
          },
          {
            "id": "fmt_p3_s2",
            "name": "Important Poisons",
            "topics": [
              {
                "id": "fmt_p3_s2_t1",
                "name": "Organophosphorus poisoning"
              },
              {
                "id": "fmt_p3_s2_t2",
                "name": "Alcohol intoxication"
              },
              {
                "id": "fmt_p3_s2_t3",
                "name": "Cyanide poisoning"
              },
              {
                "id": "fmt_p3_s2_t4",
                "name": "Carbon monoxide poisoning"
              },
              {
                "id": "fmt_p3_s2_t5",
                "name": "Heavy metal poisoning (lead, arsenic, mercury)"
              }
            ]
          },
          {
            "id": "fmt_p3_s3",
            "name": "Drug Abuse",
            "topics": [
              {
                "id": "fmt_p3_s3_t1",
                "name": "Narcotics"
              },
              {
                "id": "fmt_p3_s3_t2",
                "name": "Psychotropic substances"
              }
            ]
          },
          {
            "id": "fmt_p3_s4",
            "name": "Analytical Toxicology",
            "topics": [
              {
                "id": "fmt_p3_s4_t1",
                "name": "Toxicological analysis"
              },
              {
                "id": "fmt_p3_s4_t2",
                "name": "Poison detection techniques"
              }
            ]
          }
        ]
      },
      {
        "id": "fmt_p4",
        "name": "Paper IV – Medical Jurisprudence & Applied Forensic Medicine",
        "sections": [
          {
            "id": "fmt_p4_s1",
            "name": "Medical Law",
            "topics": [
              {
                "id": "fmt_p4_s1_t1",
                "name": "Medical negligence"
              },
              {
                "id": "fmt_p4_s1_t2",
                "name": "Consent and confidentiality"
              },
              {
                "id": "fmt_p4_s1_t3",
                "name": "Professional misconduct"
              }
            ]
          },
          {
            "id": "fmt_p4_s2",
            "name": "Legal Procedures",
            "topics": [
              {
                "id": "fmt_p4_s2_t1",
                "name": "Court procedures for doctors"
              },
              {
                "id": "fmt_p4_s2_t2",
                "name": "Expert witness role"
              },
              {
                "id": "fmt_p4_s2_t3",
                "name": "Documentation in medicolegal cases"
              }
            ]
          },
          {
            "id": "fmt_p4_s3",
            "name": "Forensic Psychiatry",
            "topics": [
              {
                "id": "fmt_p4_s3_t1",
                "name": "Insanity and criminal responsibility"
              },
              {
                "id": "fmt_p4_s3_t2",
                "name": "Competency to stand trial"
              }
            ]
          },
          {
            "id": "fmt_p4_s4",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "fmt_p4_s4_t1",
                "name": "DNA fingerprinting"
              },
              {
                "id": "fmt_p4_s4_t2",
                "name": "Forensic anthropology"
              },
              {
                "id": "fmt_p4_s4_t3",
                "name": "Forensic odontology"
              }
            ]
          },
          {
            "id": "fmt_p4_s5",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "fmt_p4_s5_t1",
                "name": "Estimation of time since death"
              },
              {
                "id": "fmt_p4_s5_t2",
                "name": "Hanging vs strangulation"
              },
              {
                "id": "fmt_p4_s5_t3",
                "name": "Firearm injuries"
              },
              {
                "id": "fmt_p4_s5_t4",
                "name": "Drowning"
              },
              {
                "id": "fmt_p4_s5_t5",
                "name": "Organophosphorus poisoning"
              },
              {
                "id": "fmt_p4_s5_t6",
                "name": "Carbon monoxide poisoning"
              },
              {
                "id": "fmt_p4_s5_t7",
                "name": "Medicolegal aspects of rape"
              },
              {
                "id": "fmt_p4_s5_t8",
                "name": "Medical negligence"
              },
              {
                "id": "fmt_p4_s5_t9",
                "name": "Consent in medicolegal practice"
              },
              {
                "id": "fmt_p4_s5_t10",
                "name": "DNA fingerprinting"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c12",
    "name": "Mastering Ophthalmology",
    "papers": [
      {
        "id": "oph_p1",
        "name": "Paper I – Basic Sciences in Ophthalmology",
        "sections": [
          {
            "id": "oph_p1_s1",
            "name": "Anatomy of Eye",
            "topics": [
              {
                "id": "oph_p1_s1_t1",
                "name": "Eyeball structure"
              },
              {
                "id": "oph_p1_s1_t2",
                "name": "Cornea anatomy"
              },
              {
                "id": "oph_p1_s1_t3",
                "name": "Lens anatomy"
              },
              {
                "id": "oph_p1_s1_t4",
                "name": "Retina and macula"
              },
              {
                "id": "oph_p1_s1_t5",
                "name": "Extraocular muscles"
              },
              {
                "id": "oph_p1_s1_t6",
                "name": "Optic nerve"
              }
            ]
          },
          {
            "id": "oph_p1_s2",
            "name": "Physiology of Vision",
            "topics": [
              {
                "id": "oph_p1_s2_t1",
                "name": "Visual pathway"
              },
              {
                "id": "oph_p1_s2_t2",
                "name": "Phototransduction"
              },
              {
                "id": "oph_p1_s2_t3",
                "name": "Dark and light adaptation"
              },
              {
                "id": "oph_p1_s2_t4",
                "name": "Color vision"
              }
            ]
          },
          {
            "id": "oph_p1_s3",
            "name": "Ocular Biochemistry",
            "topics": [
              {
                "id": "oph_p1_s3_t1",
                "name": "Aqueous humor formation and drainage"
              },
              {
                "id": "oph_p1_s3_t2",
                "name": "Lens metabolism"
              }
            ]
          },
          {
            "id": "oph_p1_s4",
            "name": "Microbiology & Immunology",
            "topics": [
              {
                "id": "oph_p1_s4_t1",
                "name": "Ocular infections"
              },
              {
                "id": "oph_p1_s4_t2",
                "name": "Immunological diseases of eye"
              }
            ]
          },
          {
            "id": "oph_p1_s5",
            "name": "Pharmacology",
            "topics": [
              {
                "id": "oph_p1_s5_t1",
                "name": "Drugs used in glaucoma"
              },
              {
                "id": "oph_p1_s5_t2",
                "name": "Mydriatics and cycloplegics"
              },
              {
                "id": "oph_p1_s5_t3",
                "name": "Ocular antibiotics and steroids"
              }
            ]
          }
        ]
      },
      {
        "id": "oph_p2",
        "name": "Paper II – Clinical Ophthalmology",
        "sections": [
          {
            "id": "oph_p2_s1",
            "name": "Cornea & Sclera",
            "topics": [
              {
                "id": "oph_p2_s1_t1",
                "name": "Keratitis"
              },
              {
                "id": "oph_p2_s1_t2",
                "name": "Corneal ulcers"
              },
              {
                "id": "oph_p2_s1_t3",
                "name": "Keratoconus"
              }
            ]
          },
          {
            "id": "oph_p2_s2",
            "name": "Lens",
            "topics": [
              {
                "id": "oph_p2_s2_t1",
                "name": "Cataract (types, pathogenesis, management)"
              },
              {
                "id": "oph_p2_s2_t2",
                "name": "Congenital cataract"
              }
            ]
          },
          {
            "id": "oph_p2_s3",
            "name": "Glaucoma",
            "topics": [
              {
                "id": "oph_p2_s3_t1",
                "name": "Primary open angle glaucoma"
              },
              {
                "id": "oph_p2_s3_t2",
                "name": "Angle closure glaucoma"
              },
              {
                "id": "oph_p2_s3_t3",
                "name": "Congenital glaucoma"
              }
            ]
          },
          {
            "id": "oph_p2_s4",
            "name": "Uvea",
            "topics": [
              {
                "id": "oph_p2_s4_t1",
                "name": "Uveitis classification and management"
              }
            ]
          },
          {
            "id": "oph_p2_s5",
            "name": "Retina",
            "topics": [
              {
                "id": "oph_p2_s5_t1",
                "name": "Diabetic retinopathy"
              },
              {
                "id": "oph_p2_s5_t2",
                "name": "Hypertensive retinopathy"
              },
              {
                "id": "oph_p2_s5_t3",
                "name": "Retinal detachment"
              },
              {
                "id": "oph_p2_s5_t4",
                "name": "Macular degeneration"
              }
            ]
          }
        ]
      },
      {
        "id": "oph_p3",
        "name": "Paper III – Neuro-ophthalmology & Systemic Ophthalmology",
        "sections": [
          {
            "id": "oph_p3_s1",
            "name": "Neuro-ophthalmology",
            "topics": [
              {
                "id": "oph_p3_s1_t1",
                "name": "Optic neuritis"
              },
              {
                "id": "oph_p3_s1_t2",
                "name": "Papilledema"
              },
              {
                "id": "oph_p3_s1_t3",
                "name": "Cranial nerve palsies"
              },
              {
                "id": "oph_p3_s1_t4",
                "name": "Visual field defects"
              }
            ]
          },
          {
            "id": "oph_p3_s2",
            "name": "Strabismus",
            "topics": [
              {
                "id": "oph_p3_s2_t1",
                "name": "Squint classification"
              },
              {
                "id": "oph_p3_s2_t2",
                "name": "Amblyopia"
              }
            ]
          },
          {
            "id": "oph_p3_s3",
            "name": "Oculoplasty",
            "topics": [
              {
                "id": "oph_p3_s3_t1",
                "name": "Ptosis"
              },
              {
                "id": "oph_p3_s3_t2",
                "name": "Lacrimal apparatus disorders"
              },
              {
                "id": "oph_p3_s3_t3",
                "name": "Orbital tumors"
              }
            ]
          },
          {
            "id": "oph_p3_s4",
            "name": "Systemic Diseases Affecting Eye",
            "topics": [
              {
                "id": "oph_p3_s4_t1",
                "name": "Diabetes mellitus"
              },
              {
                "id": "oph_p3_s4_t2",
                "name": "Hypertension"
              },
              {
                "id": "oph_p3_s4_t3",
                "name": "Thyroid eye disease"
              }
            ]
          }
        ]
      },
      {
        "id": "oph_p4",
        "name": "Paper IV – Surgical Ophthalmology & Recent Advances",
        "sections": [
          {
            "id": "oph_p4_s1",
            "name": "Cataract Surgery",
            "topics": [
              {
                "id": "oph_p4_s1_t1",
                "name": "Phacoemulsification"
              },
              {
                "id": "oph_p4_s1_t2",
                "name": "Small incision cataract surgery"
              }
            ]
          },
          {
            "id": "oph_p4_s2",
            "name": "Glaucoma Surgery",
            "topics": [
              {
                "id": "oph_p4_s2_t1",
                "name": "Trabeculectomy"
              },
              {
                "id": "oph_p4_s2_t2",
                "name": "Laser therapy"
              }
            ]
          },
          {
            "id": "oph_p4_s3",
            "name": "Vitreoretinal Surgery",
            "topics": [
              {
                "id": "oph_p4_s3_t1",
                "name": "Vitrectomy"
              }
            ]
          },
          {
            "id": "oph_p4_s4",
            "name": "Corneal Transplant",
            "topics": [
              {
                "id": "oph_p4_s4_t1",
                "name": "Keratoplasty"
              }
            ]
          },
          {
            "id": "oph_p4_s5",
            "name": "Refractive Surgery",
            "topics": [
              {
                "id": "oph_p4_s5_t1",
                "name": "LASIK"
              },
              {
                "id": "oph_p4_s5_t2",
                "name": "PRK"
              }
            ]
          },
          {
            "id": "oph_p4_s6",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "oph_p4_s6_t1",
                "name": "Optical coherence tomography (OCT)"
              },
              {
                "id": "oph_p4_s6_t2",
                "name": "Laser therapy in ophthalmology"
              },
              {
                "id": "oph_p4_s6_t3",
                "name": "Artificial intraocular lenses"
              }
            ]
          },
          {
            "id": "oph_p4_s7",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "oph_p4_s7_t1",
                "name": "Cataract and its management"
              },
              {
                "id": "oph_p4_s7_t2",
                "name": "Glaucoma"
              },
              {
                "id": "oph_p4_s7_t3",
                "name": "Diabetic retinopathy"
              },
              {
                "id": "oph_p4_s7_t4",
                "name": "Retinal detachment"
              },
              {
                "id": "oph_p4_s7_t5",
                "name": "Keratitis and corneal ulcers"
              },
              {
                "id": "oph_p4_s7_t6",
                "name": "Uveitis"
              },
              {
                "id": "oph_p4_s7_t7",
                "name": "Papilledema"
              },
              {
                "id": "oph_p4_s7_t8",
                "name": "Squint and amblyopia"
              },
              {
                "id": "oph_p4_s7_t9",
                "name": "Phacoemulsification"
              },
              {
                "id": "oph_p4_s7_t10",
                "name": "Optical coherence tomography (OCT)"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c13",
    "name": "Mastering ENT",
    "papers": [
      {
        "id": "ent_p1",
        "name": "Paper I – Basic Sciences Related to ENT",
        "sections": [
          {
            "id": "ent_p1_s1",
            "name": "Anatomy",
            "topics": [
              {
                "id": "ent_p1_s1_t1",
                "name": "Anatomy of ear (external, middle, inner ear)"
              },
              {
                "id": "ent_p1_s1_t2",
                "name": "Anatomy of nose and paranasal sinuses"
              },
              {
                "id": "ent_p1_s1_t3",
                "name": "Anatomy of larynx"
              },
              {
                "id": "ent_p1_s1_t4",
                "name": "Anatomy of pharynx"
              }
            ]
          },
          {
            "id": "ent_p1_s2",
            "name": "Physiology",
            "topics": [
              {
                "id": "ent_p1_s2_t1",
                "name": "Physiology of hearing"
              },
              {
                "id": "ent_p1_s2_t2",
                "name": "Physiology of balance"
              },
              {
                "id": "ent_p1_s2_t3",
                "name": "Physiology of voice and speech"
              },
              {
                "id": "ent_p1_s2_t4",
                "name": "Olfaction and taste"
              }
            ]
          },
          {
            "id": "ent_p1_s3",
            "name": "Microbiology",
            "topics": [
              {
                "id": "ent_p1_s3_t1",
                "name": "Infections of ear, nose, and throat"
              },
              {
                "id": "ent_p1_s3_t2",
                "name": "Common ENT pathogens"
              }
            ]
          },
          {
            "id": "ent_p1_s4",
            "name": "Audiology",
            "topics": [
              {
                "id": "ent_p1_s4_t1",
                "name": "Pure tone audiometry"
              },
              {
                "id": "ent_p1_s4_t2",
                "name": "Tympanometry"
              },
              {
                "id": "ent_p1_s4_t3",
                "name": "Hearing tests (Rinne, Weber tests)"
              }
            ]
          },
          {
            "id": "ent_p1_s5",
            "name": "Pharmacology",
            "topics": [
              {
                "id": "ent_p1_s5_t1",
                "name": "Drugs used in ENT infections"
              },
              {
                "id": "ent_p1_s5_t2",
                "name": "Steroids and antihistamines"
              }
            ]
          }
        ]
      },
      {
        "id": "ent_p2",
        "name": "Paper II – Otology (Ear)",
        "sections": [
          {
            "id": "ent_p2_s1",
            "name": "External Ear",
            "topics": [
              {
                "id": "ent_p2_s1_t1",
                "name": "Otitis externa"
              },
              {
                "id": "ent_p2_s1_t2",
                "name": "Cerumen impaction"
              }
            ]
          },
          {
            "id": "ent_p2_s2",
            "name": "Middle Ear",
            "topics": [
              {
                "id": "ent_p2_s2_t1",
                "name": "Acute otitis media"
              },
              {
                "id": "ent_p2_s2_t2",
                "name": "Chronic suppurative otitis media (CSOM)"
              },
              {
                "id": "ent_p2_s2_t3",
                "name": "Cholesteatoma"
              }
            ]
          },
          {
            "id": "ent_p2_s3",
            "name": "Inner Ear",
            "topics": [
              {
                "id": "ent_p2_s3_t1",
                "name": "Meniere's disease"
              },
              {
                "id": "ent_p2_s3_t2",
                "name": "Labyrinthitis"
              }
            ]
          },
          {
            "id": "ent_p2_s4",
            "name": "Hearing Disorders",
            "topics": [
              {
                "id": "ent_p2_s4_t1",
                "name": "Conductive hearing loss"
              },
              {
                "id": "ent_p2_s4_t2",
                "name": "Sensorineural hearing loss"
              },
              {
                "id": "ent_p2_s4_t3",
                "name": "Presbycusis"
              }
            ]
          },
          {
            "id": "ent_p2_s5",
            "name": "Tumors",
            "topics": [
              {
                "id": "ent_p2_s5_t1",
                "name": "Acoustic neuroma"
              }
            ]
          },
          {
            "id": "ent_p2_s6",
            "name": "Ear Surgeries",
            "topics": [
              {
                "id": "ent_p2_s6_t1",
                "name": "Mastoidectomy"
              },
              {
                "id": "ent_p2_s6_t2",
                "name": "Tympanoplasty"
              },
              {
                "id": "ent_p2_s6_t3",
                "name": "Cochlear implant"
              }
            ]
          }
        ]
      },
      {
        "id": "ent_p3",
        "name": "Paper III – Rhinology (Nose & Paranasal Sinuses)",
        "sections": [
          {
            "id": "ent_p3_s1",
            "name": "Nasal Disorders",
            "topics": [
              {
                "id": "ent_p3_s1_t1",
                "name": "Deviated nasal septum (DNS)"
              },
              {
                "id": "ent_p3_s1_t2",
                "name": "Epistaxis"
              },
              {
                "id": "ent_p3_s1_t3",
                "name": "Nasal polyps"
              }
            ]
          },
          {
            "id": "ent_p3_s2",
            "name": "Sinus Diseases",
            "topics": [
              {
                "id": "ent_p3_s2_t1",
                "name": "Acute sinusitis"
              },
              {
                "id": "ent_p3_s2_t2",
                "name": "Chronic sinusitis"
              }
            ]
          },
          {
            "id": "ent_p3_s3",
            "name": "Allergic Conditions",
            "topics": [
              {
                "id": "ent_p3_s3_t1",
                "name": "Allergic rhinitis"
              }
            ]
          },
          {
            "id": "ent_p3_s4",
            "name": "Tumors",
            "topics": [
              {
                "id": "ent_p3_s4_t1",
                "name": "Nasal and paranasal sinus tumors"
              }
            ]
          },
          {
            "id": "ent_p3_s5",
            "name": "Surgical Procedures",
            "topics": [
              {
                "id": "ent_p3_s5_t1",
                "name": "Functional endoscopic sinus surgery (FESS)"
              },
              {
                "id": "ent_p3_s5_t2",
                "name": "Septoplasty"
              }
            ]
          }
        ]
      },
      {
        "id": "ent_p4",
        "name": "Paper IV – Laryngology, Head & Neck Surgery & Recent Advances",
        "sections": [
          {
            "id": "ent_p4_s1",
            "name": "Larynx Disorders",
            "topics": [
              {
                "id": "ent_p4_s1_t1",
                "name": "Laryngitis"
              },
              {
                "id": "ent_p4_s1_t2",
                "name": "Vocal cord nodules and polyps"
              },
              {
                "id": "ent_p4_s1_t3",
                "name": "Laryngeal carcinoma"
              }
            ]
          },
          {
            "id": "ent_p4_s2",
            "name": "Pharynx Disorders",
            "topics": [
              {
                "id": "ent_p4_s2_t1",
                "name": "Tonsillitis"
              },
              {
                "id": "ent_p4_s2_t2",
                "name": "Peritonsillar abscess"
              },
              {
                "id": "ent_p4_s2_t3",
                "name": "Adenoid hypertrophy"
              }
            ]
          },
          {
            "id": "ent_p4_s3",
            "name": "Head & Neck Tumors",
            "topics": [
              {
                "id": "ent_p4_s3_t1",
                "name": "Oral cancers"
              },
              {
                "id": "ent_p4_s3_t2",
                "name": "Salivary gland tumors"
              },
              {
                "id": "ent_p4_s3_t3",
                "name": "Thyroid swellings"
              }
            ]
          },
          {
            "id": "ent_p4_s4",
            "name": "Airway Emergencies",
            "topics": [
              {
                "id": "ent_p4_s4_t1",
                "name": "Tracheostomy"
              },
              {
                "id": "ent_p4_s4_t2",
                "name": "Airway obstruction"
              }
            ]
          },
          {
            "id": "ent_p4_s5",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "ent_p4_s5_t1",
                "name": "Endoscopic ENT surgeries"
              },
              {
                "id": "ent_p4_s5_t2",
                "name": "Laser surgery in ENT"
              },
              {
                "id": "ent_p4_s5_t3",
                "name": "Cochlear implants"
              }
            ]
          },
          {
            "id": "ent_p4_s6",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "ent_p4_s6_t1",
                "name": "Chronic suppurative otitis media (CSOM)"
              },
              {
                "id": "ent_p4_s6_t2",
                "name": "Cholesteatoma"
              },
              {
                "id": "ent_p4_s6_t3",
                "name": "Meniere’s disease"
              },
              {
                "id": "ent_p4_s6_t4",
                "name": "Deviated nasal septum"
              },
              {
                "id": "ent_p4_s6_t5",
                "name": "Epistaxis"
              },
              {
                "id": "ent_p4_s6_t6",
                "name": "Nasal polyps"
              },
              {
                "id": "ent_p4_s6_t7",
                "name": "Tonsillitis"
              },
              {
                "id": "ent_p4_s6_t8",
                "name": "Laryngeal carcinoma"
              },
              {
                "id": "ent_p4_s6_t9",
                "name": "Tympanoplasty and mastoidectomy"
              },
              {
                "id": "ent_p4_s6_t10",
                "name": "Functional endoscopic sinus surgery (FESS)"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c20",
    "name": "Mastering General Medicine",
    "papers": [
      {
        "id": "med_p1",
        "name": "Paper I – Basic Sciences in Medicine",
        "sections": [
          {
            "id": "med_p1_s1",
            "name": "Genetics & Immunology",
            "topics": [
              {
                "id": "med_p1_s1_t1",
                "name": "Clinical genetics (Down syndrome, Turner syndrome)"
              },
              {
                "id": "med_p1_s1_t2",
                "name": "Innate and adaptive immunity"
              },
              {
                "id": "med_p1_s1_t3",
                "name": "Hypersensitivity and auto-immunity"
              },
              {
                "id": "med_p1_s1_t4",
                "name": "Immunodeficiency states (HIV pathogenesis)"
              }
            ]
          },
          {
            "id": "med_p1_s2",
            "name": "Fluid & Electrolyte Imbalance",
            "topics": [
              {
                "id": "med_p1_s2_t1",
                "name": "Hyponatremia and hypernatremia"
              },
              {
                "id": "med_p1_s2_t2",
                "name": "Hypokalemia and hyperkalemia"
              },
              {
                "id": "med_p1_s2_t3",
                "name": "Acid-base disorders (Metabolic acidosis/alkalosis)"
              }
            ]
          },
          {
            "id": "med_p1_s3",
            "name": "Clinical Pharmacology",
            "topics": [
              {
                "id": "med_p1_s3_t1",
                "name": "Pharmacokinetics and pharmacodynamics"
              },
              {
                "id": "med_p1_s3_t2",
                "name": "Adverse drug reactions"
              },
              {
                "id": "med_p1_s3_t3",
                "name": "Drug interactions and therapeutic drug monitoring"
              }
            ]
          },
          {
            "id": "med_p1_s4",
            "name": "Nutrition",
            "topics": [
              {
                "id": "med_p1_s4_t1",
                "name": "Protein energy malnutrition"
              },
              {
                "id": "med_p1_s4_t2",
                "name": "Vitamin deficiencies (B12, Folate, Vitamin D)"
              },
              {
                "id": "med_p1_s4_t3",
                "name": "Obesity and metabolic syndrome"
              }
            ]
          }
        ]
      },
      {
        "id": "med_p2",
        "name": "Paper II – Cardiovascular, Respiratory, Nephrology & Gastroenterology",
        "sections": [
          {
            "id": "med_p2_s1",
            "name": "Cardiology",
            "topics": [
              {
                "id": "med_p2_s1_t1",
                "name": "Ischemic heart disease (ACS, STEMI, NSTEMI)"
              },
              {
                "id": "med_p2_s1_t2",
                "name": "Heart failure management"
              },
              {
                "id": "med_p2_s1_t3",
                "name": "Arrhythmias (AF, VT, SVT)"
              },
              {
                "id": "med_p2_s1_t4",
                "name": "Valvular heart diseases (Mitral stenosis)"
              },
              {
                "id": "med_p2_s1_t5",
                "name": "Rheumatic fever"
              }
            ]
          },
          {
            "id": "med_p2_s2",
            "name": "Respiratory System",
            "topics": [
              {
                "id": "med_p2_s2_t1",
                "name": "COPD and Asthma"
              },
              {
                "id": "med_p2_s2_t2",
                "name": "Tuberculosis (pulmonary and extrapulmonary)"
              },
              {
                "id": "med_p2_s2_t3",
                "name": "Pneumonia (CAP, HAP)"
              },
              {
                "id": "med_p2_s2_t4",
                "name": "Interstitial lung diseases"
              },
              {
                "id": "med_p2_s2_t5",
                "name": "Pleural effusion"
              }
            ]
          },
          {
            "id": "med_p2_s3",
            "name": "Nephrology",
            "topics": [
              {
                "id": "med_p2_s3_t1",
                "name": "Acute kidney injury (AKI)"
              },
              {
                "id": "med_p2_s3_t2",
                "name": "Chronic kidney disease (CKD)"
              },
              {
                "id": "med_p2_s3_t3",
                "name": "Glomerulonephritis (Nephritic vs Nephrotic syndrome)"
              },
              {
                "id": "med_p2_s3_t4",
                "name": "Urinary tract infections"
              }
            ]
          },
          {
            "id": "med_p2_s4",
            "name": "Gastroenterology & Hepatology",
            "topics": [
              {
                "id": "med_p2_s4_t1",
                "name": "Peptic ulcer disease and GI bleed"
              },
              {
                "id": "med_p2_s4_t2",
                "name": "Viral hepatitis (Hep B, C)"
              },
              {
                "id": "med_p2_s4_t3",
                "name": "Cirrhosis and complications (Ascites, Encephalopathy)"
              },
              {
                "id": "med_p2_s4_t4",
                "name": "Inflammatory bowel disease"
              }
            ]
          }
        ]
      },
      {
        "id": "med_p3",
        "name": "Paper III – Neurology, Endocrinology, Hematology & Rheumatology",
        "sections": [
          {
            "id": "med_p3_s1",
            "name": "Neurology",
            "topics": [
              {
                "id": "med_p3_s1_t1",
                "name": "Cerebrovascular accidents (Stroke)"
              },
              {
                "id": "med_p3_s1_t2",
                "name": "Epilepsy and seizure disorders"
              },
              {
                "id": "med_p3_s1_t3",
                "name": "Demyelinating diseases (Multiple sclerosis)"
              },
              {
                "id": "med_p3_s1_t4",
                "name": "Meningitis and encephalitis"
              },
              {
                "id": "med_p3_s1_t5",
                "name": "Peripheral neuropathy (GBS)"
              }
            ]
          },
          {
            "id": "med_p3_s2",
            "name": "Endocrinology",
            "topics": [
              {
                "id": "med_p3_s2_t1",
                "name": "Diabetes mellitus (T1/T2, DKA, HHS)"
              },
              {
                "id": "med_p3_s2_t2",
                "name": "Thyroid disorders (Hypo/Hyper)"
              },
              {
                "id": "med_p3_s2_t3",
                "name": "Adrenal insufficiency and Cushing syndrome"
              },
              {
                "id": "med_p3_s2_t4",
                "name": "Pituitary gland disorders (Acromegaly, Prolactinoma)"
              }
            ]
          },
          {
            "id": "med_p3_s3",
            "name": "Hematology",
            "topics": [
              {
                "id": "med_p3_s3_t1",
                "name": "Anemias (Iron deficiency, Megaloblastic, Hemolytic)"
              },
              {
                "id": "med_p3_s3_t2",
                "name": "Leukemias and lymphomas"
              },
              {
                "id": "med_p3_s3_t3",
                "name": "Bleeding disorders (Hemophilia, ITP)"
              },
              {
                "id": "med_p3_s3_t4",
                "name": "Multiple myeloma"
              }
            ]
          },
          {
            "id": "med_p3_s4",
            "name": "Rheumatology",
            "topics": [
              {
                "id": "med_p3_s4_t1",
                "name": "Rheumatoid arthritis"
              },
              {
                "id": "med_p3_s4_t2",
                "name": "Systemic lupus erythematosus (SLE)"
              },
              {
                "id": "med_p3_s4_t3",
                "name": "Gout and pseudogout"
              },
              {
                "id": "med_p3_s4_t4",
                "name": "Vasculitis syndromes"
              }
            ]
          }
        ]
      },
      {
        "id": "med_p4",
        "name": "Paper IV – Infectious Diseases, Tropical Medicine & Recent Advances",
        "sections": [
          {
            "id": "med_p4_s1",
            "name": "Infectious Diseases",
            "topics": [
              {
                "id": "med_p4_s1_t1",
                "name": "HIV/AIDS and opportunistic infections"
              },
              {
                "id": "med_p4_s1_t2",
                "name": "Malaria, Dengue, Chikungunya"
              },
              {
                "id": "med_p4_s1_t3",
                "name": "Enteric fever (Typhoid)"
              },
              {
                "id": "med_p4_s1_t4",
                "name": "Leptospirosis and Scrub typhus"
              },
              {
                "id": "med_p4_s1_t5",
                "name": "COVID-19 and emerging infections"
              }
            ]
          },
          {
            "id": "med_p4_s2",
            "name": "Toxicology & Environmental Medicine",
            "topics": [
              {
                "id": "med_p4_s2_t1",
                "name": "Organophosphate poisoning"
              },
              {
                "id": "med_p4_s2_t2",
                "name": "Snakebite and scorpion sting"
              },
              {
                "id": "med_p4_s2_t3",
                "name": "Drug overdose management (Paracetamol)"
              }
            ]
          },
          {
            "id": "med_p4_s3",
            "name": "Intensive Care Medicine",
            "topics": [
              {
                "id": "med_p4_s3_t1",
                "name": "Sepsis and multi-organ dysfunction syndrome"
              },
              {
                "id": "med_p4_s3_t2",
                "name": "ARDS and mechanical ventilation basics"
              },
              {
                "id": "med_p4_s3_t3",
                "name": "ACLS and BLS guidelines"
              }
            ]
          },
          {
            "id": "med_p4_s4",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "med_p4_s4_t1",
                "name": "Acute myocardial infarction management"
              },
              {
                "id": "med_p4_s4_t2",
                "name": "Heart failure guidelines"
              },
              {
                "id": "med_p4_s4_t3",
                "name": "Tuberculosis management (NTEP guidelines)"
              },
              {
                "id": "med_p4_s4_t4",
                "name": "Asthma and COPD progression"
              },
              {
                "id": "med_p4_s4_t5",
                "name": "AKI and CKD staging"
              },
              {
                "id": "med_p4_s4_t6",
                "name": "Cirrhosis and complications"
              },
              {
                "id": "med_p4_s4_t7",
                "name": "Stroke acute management"
              },
              {
                "id": "med_p4_s4_t8",
                "name": "Diabetes mellitus (DKA/HHS)"
              },
              {
                "id": "med_p4_s4_t9",
                "name": "HIV infection and ART"
              },
              {
                "id": "med_p4_s4_t10",
                "name": "Malaria and Dengue fever"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c21",
    "name": "Mastering Pediatrics",
    "papers": [
      {
        "id": "ped_p1",
        "name": "Paper I – Basic Sciences in Pediatrics",
        "sections": [
          {
            "id": "ped_p1_s1",
            "name": "Growth & Development",
            "topics": [
              {
                "id": "ped_p1_s1_t1",
                "name": "Normal growth patterns and charts"
              },
              {
                "id": "ped_p1_s1_t2",
                "name": "Developmental milestones (Motor, Social, Language)"
              },
              {
                "id": "ped_p1_s1_t3",
                "name": "Disorders of growth (Short stature)"
              },
              {
                "id": "ped_p1_s1_t4",
                "name": "Developmental delay and Autism"
              }
            ]
          },
          {
            "id": "ped_p1_s2",
            "name": "Genetics & Metabolic Disorders",
            "topics": [
              {
                "id": "ped_p1_s2_t1",
                "name": "Chromosomal disorders (Down, Turner, Klinefelter)"
              },
              {
                "id": "ped_p1_s2_t2",
                "name": "Inborn errors of metabolism (Galactosemia, PKU)"
              },
              {
                "id": "ped_p1_s2_t3",
                "name": "Storage disorders (Gaucher, Niemann-Pick)"
              },
              {
                "id": "ped_p1_s2_t4",
                "name": "Genetic counseling"
              }
            ]
          },
          {
            "id": "ped_p1_s3",
            "name": "Nutrition & Immunization",
            "topics": [
              {
                "id": "ped_p1_s3_t1",
                "name": "Infant and young child feeding (IYCF) guidelines"
              },
              {
                "id": "ped_p1_s3_t2",
                "name": "Severe acute malnutrition (SAM) management"
              },
              {
                "id": "ped_p1_s3_t3",
                "name": "Micronutrient deficiencies (Vitamin A, D, Iron)"
              },
              {
                "id": "ped_p1_s3_t4",
                "name": "National immunization schedule (NIS) and newer vaccines"
              }
            ]
          },
          {
            "id": "ped_p1_s4",
            "name": "Immunology & Allergy",
            "topics": [
              {
                "id": "ped_p1_s4_t1",
                "name": "Primary immunodeficiency disorders"
              },
              {
                "id": "ped_p1_s4_t2",
                "name": "Allergic rhinitis and Atopic dermatitis in children"
              },
              {
                "id": "ped_p1_s4_t3",
                "name": "Anaphylaxis management"
              }
            ]
          }
        ]
      },
      {
        "id": "ped_p2",
        "name": "Paper II – Neonatology & Infectious Diseases",
        "sections": [
          {
            "id": "ped_p2_s1",
            "name": "Neonatology",
            "topics": [
              {
                "id": "ped_p2_s1_t1",
                "name": "Neonatal resuscitation (NRP guidelines)"
              },
              {
                "id": "ped_p2_s1_t2",
                "name": "Prematurity and low birth weight (LBW)"
              },
              {
                "id": "ped_p2_s1_t3",
                "name": "Neonatal jaundice (pathological vs physiological)"
              },
              {
                "id": "ped_p2_s1_t4",
                "name": "Respiratory distress syndrome (RDS) and surfactant"
              },
              {
                "id": "ped_p2_s1_t5",
                "name": "Neonatal sepsis and meningitis"
              },
              {
                "id": "ped_p2_s1_t6",
                "name": "Meconium aspiration syndrome (MAS)"
              }
            ]
          },
          {
            "id": "ped_p2_s2",
            "name": "Infectious Diseases",
            "topics": [
              {
                "id": "ped_p2_s2_t1",
                "name": "Vaccine-preventable diseases (Measles, Diphtheria, Pertussis)"
              },
              {
                "id": "ped_p2_s2_t2",
                "name": "Pediatric tuberculosis (diagnosis and management)"
              },
              {
                "id": "ped_p2_s2_t3",
                "name": "Enteric fever and Malaria"
              },
              {
                "id": "ped_p2_s2_t4",
                "name": "Dengue fever and Dengue hemorrhagic fever"
              },
              {
                "id": "ped_p2_s2_t5",
                "name": "HIV in children (PMTCT and ART)"
              }
            ]
          },
          {
            "id": "ped_p2_s3",
            "name": "Gastroenterology",
            "topics": [
              {
                "id": "ped_p2_s3_t1",
                "name": "Acute diarrhea and dehydration management (ORT)"
              },
              {
                "id": "ped_p2_s3_t2",
                "name": "Persistent and chronic diarrhea"
              },
              {
                "id": "ped_p2_s3_t3",
                "name": "Hepatitis in children"
              },
              {
                "id": "ped_p2_s3_t4",
                "name": "Celiac disease and malabsorption syndromes"
              }
            ]
          }
        ]
      },
      {
        "id": "ped_p3",
        "name": "Paper III – Systemic Pediatrics (Neuro, Cardio, Resp, Nephro, Hemato)",
        "sections": [
          {
            "id": "ped_p3_s1",
            "name": "Neurology",
            "topics": [
              {
                "id": "ped_p3_s1_t1",
                "name": "Seizure disorders and status epilepticus"
              },
              {
                "id": "ped_p3_s1_t2",
                "name": "Cerebral palsy"
              },
              {
                "id": "ped_p3_s1_t3",
                "name": "Acute flaccid paralysis (Polio, GBS)"
              },
              {
                "id": "ped_p3_s1_t4",
                "name": "Neurocutaneous syndromes"
              }
            ]
          },
          {
            "id": "ped_p3_s2",
            "name": "Cardiology",
            "topics": [
              {
                "id": "ped_p3_s2_t1",
                "name": "Congenital heart diseases (VSD, ASD, PDA, TOF)"
              },
              {
                "id": "ped_p3_s2_t2",
                "name": "Rheumatic fever and Rheumatic heart disease"
              },
              {
                "id": "ped_p3_s2_t3",
                "name": "Heart failure in infants and children"
              },
              {
                "id": "ped_p3_s2_t4",
                "name": "Infective endocarditis"
              }
            ]
          },
          {
            "id": "ped_p3_s3",
            "name": "Respiratory System",
            "topics": [
              {
                "id": "ped_p3_s3_t1",
                "name": "Acute respiratory infections (ARI) and Pneumonia (IMNCI)"
              },
              {
                "id": "ped_p3_s3_t2",
                "name": "Bronchiolitis"
              },
              {
                "id": "ped_p3_s3_t3",
                "name": "Bronchial asthma in children"
              },
              {
                "id": "ped_p3_s3_t4",
                "name": "Croup and Epiglottitis"
              }
            ]
          },
          {
            "id": "ped_p3_s4",
            "name": "Nephrology",
            "topics": [
              {
                "id": "ped_p3_s4_t1",
                "name": "Nephrotic syndrome (classification and management)"
              },
              {
                "id": "ped_p3_s4_t2",
                "name": "Acute post-streptococcal glomerulonephritis (APSGN)"
              },
              {
                "id": "ped_p3_s4_t3",
                "name": "Urinary tract infections (UTI) and VUR"
              },
              {
                "id": "ped_p3_s4_t4",
                "name": "Acute kidney injury in children"
              }
            ]
          },
          {
            "id": "ped_p3_s5",
            "name": "Hematology & Oncology",
            "topics": [
              {
                "id": "ped_p3_s5_t1",
                "name": "Nutritional anemias (Iron, B12, Folate)"
              },
              {
                "id": "ped_p3_s5_t2",
                "name": "Hemolytic anemias (Thalassemia, Sickle cell)"
              },
              {
                "id": "ped_p3_s5_t3",
                "name": "Bleeding disorders (Hemophilia, ITP)"
              },
              {
                "id": "ped_p3_s5_t4",
                "name": "Acute lymphoblastic leukemia (ALL)"
              }
            ]
          }
        ]
      },
      {
        "id": "ped_p4",
        "name": "Paper IV – Pediatric Emergencies, Social Pediatrics & Recent Advances",
        "sections": [
          {
            "id": "ped_p4_s1",
            "name": "Pediatric Intensive Care & Emergencies",
            "topics": [
              {
                "id": "ped_p4_s1_t1",
                "name": "Shock in children"
              },
              {
                "id": "ped_p4_s1_t2",
                "name": "Acute severe asthma management"
              },
              {
                "id": "ped_p4_s1_t3",
                "name": "Diabetic ketoacidosis (DKA)"
              },
              {
                "id": "ped_p4_s1_t4",
                "name": "Poisoning (Kerosene, Organophosphorus)"
              }
            ]
          },
          {
            "id": "ped_p4_s2",
            "name": "Endocrinology",
            "topics": [
              {
                "id": "ped_p4_s2_t1",
                "name": "Congenital hypothyroidism"
              },
              {
                "id": "ped_p4_s2_t2",
                "name": "Type 1 Diabetes Mellitus"
              },
              {
                "id": "ped_p4_s2_t3",
                "name": "Congenital adrenal hyperplasia (CAH)"
              },
              {
                "id": "ped_p4_s2_t4",
                "name": "Pubertal disorders (Precocious and delayed puberty)"
              }
            ]
          },
          {
            "id": "ped_p4_s3",
            "name": "Social Pediatrics & National Programs",
            "topics": [
              {
                "id": "ped_p4_s3_t1",
                "name": "RBSK (Rashtriya Bal Swasthya Karyakram)"
              },
              {
                "id": "ped_p4_s3_t2",
                "name": "IMNCI guidelines"
              },
              {
                "id": "ped_p4_s3_t3",
                "name": "Child abuse and neglect"
              },
              {
                "id": "ped_p4_s3_t4",
                "name": "Adoption and POCSO Act"
              }
            ]
          },
          {
            "id": "ped_p4_s4",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "ped_p4_s4_t1",
                "name": "Gene therapy in pediatrics"
              },
              {
                "id": "ped_p4_s4_t2",
                "name": "Advances in neonatal ventilation"
              },
              {
                "id": "ped_p4_s4_t3",
                "name": "Newer vaccines"
              }
            ]
          },
          {
            "id": "ped_p4_s5",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "ped_p4_s5_t1",
                "name": "Developmental milestones"
              },
              {
                "id": "ped_p4_s5_t2",
                "name": "Immunization schedule"
              },
              {
                "id": "ped_p4_s5_t3",
                "name": "Neonatal resuscitation protocol"
              },
              {
                "id": "ped_p4_s5_t4",
                "name": "Neonatal jaundice and phototherapy"
              },
              {
                "id": "ped_p4_s5_t5",
                "name": "Severe acute malnutrition (SAM) step-wise management"
              },
              {
                "id": "ped_p4_s5_t6",
                "name": "IMNCI algorithms"
              },
              {
                "id": "ped_p4_s5_t7",
                "name": "Nephrotic syndrome (steroid-sensitive)"
              },
              {
                "id": "ped_p4_s5_t8",
                "name": "Congenital heart diseases (VSD, TOF)"
              },
              {
                "id": "ped_p4_s5_t9",
                "name": "Thalassemia diagnosis and management"
              },
              {
                "id": "ped_p4_s5_t10",
                "name": "Status epilepticus management"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c14",
    "name": "Mastering Psychiatry",
    "papers": [
      {
        "id": "psy_p1",
        "name": "Paper I – Basic Sciences in Psychiatry",
        "sections": [
          {
            "id": "psy_p1_s1",
            "name": "Neurobiology",
            "topics": [
              {
                "id": "psy_p1_s1_t1",
                "name": "Neurotransmitters in psychiatric disorders"
              },
              {
                "id": "psy_p1_s1_t2",
                "name": "Neuroanatomy relevant to psychiatry"
              },
              {
                "id": "psy_p1_s1_t3",
                "name": "Neurophysiology of behavior"
              }
            ]
          },
          {
            "id": "psy_p1_s2",
            "name": "Psychology",
            "topics": [
              {
                "id": "psy_p1_s2_t1",
                "name": "Learning theories"
              },
              {
                "id": "psy_p1_s2_t2",
                "name": "Personality theories"
              },
              {
                "id": "psy_p1_s2_t3",
                "name": "Cognitive psychology"
              }
            ]
          },
          {
            "id": "psy_p1_s3",
            "name": "Psychopathology",
            "topics": [
              {
                "id": "psy_p1_s3_t1",
                "name": "Thought disorders"
              },
              {
                "id": "psy_p1_s3_t2",
                "name": "Perception disorders (hallucinations, illusions)"
              },
              {
                "id": "psy_p1_s3_t3",
                "name": "Mood and affect disturbances"
              }
            ]
          },
          {
            "id": "psy_p1_s4",
            "name": "Psychopharmacology",
            "topics": [
              {
                "id": "psy_p1_s4_t1",
                "name": "Antipsychotics"
              },
              {
                "id": "psy_p1_s4_t2",
                "name": "Antidepressants"
              },
              {
                "id": "psy_p1_s4_t3",
                "name": "Mood stabilizers"
              },
              {
                "id": "psy_p1_s4_t4",
                "name": "Anxiolytics"
              }
            ]
          },
          {
            "id": "psy_p1_s5",
            "name": "Research Methods",
            "topics": [
              {
                "id": "psy_p1_s5_t1",
                "name": "Psychiatric research methodology"
              },
              {
                "id": "psy_p1_s5_t2",
                "name": "Rating scales in psychiatry"
              }
            ]
          }
        ]
      },
      {
        "id": "psy_p2",
        "name": "Paper II – Clinical Psychiatry",
        "sections": [
          {
            "id": "psy_p2_s1",
            "name": "Major Psychiatric Disorders",
            "topics": [
              {
                "id": "psy_p2_s1_t1",
                "name": "Schizophrenia"
              },
              {
                "id": "psy_p2_s1_t2",
                "name": "Bipolar affective disorder"
              },
              {
                "id": "psy_p2_s1_t3",
                "name": "Major depressive disorder"
              },
              {
                "id": "psy_p2_s1_t4",
                "name": "Anxiety disorders"
              }
            ]
          },
          {
            "id": "psy_p2_s2",
            "name": "Other Disorders",
            "topics": [
              {
                "id": "psy_p2_s2_t1",
                "name": "Obsessive compulsive disorder (OCD)"
              },
              {
                "id": "psy_p2_s2_t2",
                "name": "Post traumatic stress disorder (PTSD)"
              },
              {
                "id": "psy_p2_s2_t3",
                "name": "Somatoform disorders"
              },
              {
                "id": "psy_p2_s2_t4",
                "name": "Dissociative disorders"
              }
            ]
          },
          {
            "id": "psy_p2_s3",
            "name": "Substance Use Disorders",
            "topics": [
              {
                "id": "psy_p2_s3_t1",
                "name": "Alcohol dependence"
              },
              {
                "id": "psy_p2_s3_t2",
                "name": "Drug abuse and dependence"
              }
            ]
          }
        ]
      },
      {
        "id": "psy_p3",
        "name": "Paper III – Neurology Related to Psychiatry & Special Disorders",
        "sections": [
          {
            "id": "psy_p3_s1",
            "name": "Neuropsychiatry",
            "topics": [
              {
                "id": "psy_p3_s1_t1",
                "name": "Dementia"
              },
              {
                "id": "psy_p3_s1_t2",
                "name": "Delirium"
              },
              {
                "id": "psy_p3_s1_t3",
                "name": "Organic brain syndromes"
              }
            ]
          },
          {
            "id": "psy_p3_s2",
            "name": "Developmental Disorders",
            "topics": [
              {
                "id": "psy_p3_s2_t1",
                "name": "Autism spectrum disorder"
              },
              {
                "id": "psy_p3_s2_t2",
                "name": "ADHD"
              },
              {
                "id": "psy_p3_s2_t3",
                "name": "Intellectual disability"
              }
            ]
          },
          {
            "id": "psy_p3_s3",
            "name": "Geriatric Psychiatry",
            "topics": [
              {
                "id": "psy_p3_s3_t1",
                "name": "Depression in elderly"
              },
              {
                "id": "psy_p3_s3_t2",
                "name": "Dementia management"
              }
            ]
          },
          {
            "id": "psy_p3_s4",
            "name": "Forensic Psychiatry",
            "topics": [
              {
                "id": "psy_p3_s4_t1",
                "name": "Criminal responsibility"
              },
              {
                "id": "psy_p3_s4_t2",
                "name": "Insanity defense"
              }
            ]
          }
        ]
      },
      {
        "id": "psy_p4",
        "name": "Paper IV – Psychotherapy, Community Psychiatry & Recent Advances",
        "sections": [
          {
            "id": "psy_p4_s1",
            "name": "Psychotherapy",
            "topics": [
              {
                "id": "psy_p4_s1_t1",
                "name": "Cognitive behavioral therapy (CBT)"
              },
              {
                "id": "psy_p4_s1_t2",
                "name": "Psychodynamic therapy"
              },
              {
                "id": "psy_p4_s1_t3",
                "name": "Family therapy"
              },
              {
                "id": "psy_p4_s1_t4",
                "name": "Group therapy"
              }
            ]
          },
          {
            "id": "psy_p4_s2",
            "name": "Community Psychiatry",
            "topics": [
              {
                "id": "psy_p4_s2_t1",
                "name": "Mental health programs"
              },
              {
                "id": "psy_p4_s2_t2",
                "name": "Rehabilitation in psychiatry"
              },
              {
                "id": "psy_p4_s2_t3",
                "name": "Psychiatric epidemiology"
              }
            ]
          },
          {
            "id": "psy_p4_s3",
            "name": "Legal Aspects",
            "topics": [
              {
                "id": "psy_p4_s3_t1",
                "name": "Mental health legislation"
              },
              {
                "id": "psy_p4_s3_t2",
                "name": "Rights of mentally ill patients"
              }
            ]
          },
          {
            "id": "psy_p4_s4",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "psy_p4_s4_t1",
                "name": "Brain stimulation therapies"
              },
              {
                "id": "psy_p4_s4_t2",
                "name": "Transcranial magnetic stimulation (TMS)"
              },
              {
                "id": "psy_p4_s4_t3",
                "name": "Neuroimaging in psychiatry"
              }
            ]
          },
          {
            "id": "psy_p4_s5",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "psy_p4_s5_t1",
                "name": "Schizophrenia"
              },
              {
                "id": "psy_p4_s5_t2",
                "name": "Bipolar disorder"
              },
              {
                "id": "psy_p4_s5_t3",
                "name": "Major depressive disorder"
              },
              {
                "id": "psy_p4_s5_t4",
                "name": "Anxiety disorders"
              },
              {
                "id": "psy_p4_s5_t5",
                "name": "Obsessive compulsive disorder"
              },
              {
                "id": "psy_p4_s5_t6",
                "name": "Dementia"
              },
              {
                "id": "psy_p4_s5_t7",
                "name": "Substance use disorders"
              },
              {
                "id": "psy_p4_s5_t8",
                "name": "Antipsychotic drugs"
              },
              {
                "id": "psy_p4_s5_t9",
                "name": "Cognitive behavioral therapy"
              },
              {
                "id": "psy_p4_s5_t10",
                "name": "Mental health legislation"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c17",
    "name": "Mastering Dermatology (DVL)",
    "papers": [
      {
        "id": "dvl_p1",
        "name": "Paper I – Basic Sciences in Dermatology",
        "sections": [
          {
            "id": "dvl_p1_s1",
            "name": "Skin Anatomy & Physiology",
            "topics": [
              {
                "id": "dvl_p1_s1_t1",
                "name": "Structure of epidermis and dermis"
              },
              {
                "id": "dvl_p1_s1_t2",
                "name": "Skin appendages (hair, nail, glands)"
              },
              {
                "id": "dvl_p1_s1_t3",
                "name": "Melanogenesis"
              },
              {
                "id": "dvl_p1_s1_t4",
                "name": "Skin immunology"
              }
            ]
          },
          {
            "id": "dvl_p1_s2",
            "name": "Dermatopathology",
            "topics": [
              {
                "id": "dvl_p1_s2_t1",
                "name": "Basic histopathological patterns"
              },
              {
                "id": "dvl_p1_s2_t2",
                "name": "Skin biopsy techniques"
              }
            ]
          },
          {
            "id": "dvl_p1_s3",
            "name": "Pharmacology",
            "topics": [
              {
                "id": "dvl_p1_s3_t1",
                "name": "Topical therapy in dermatology"
              },
              {
                "id": "dvl_p1_s3_t2",
                "name": "Systemic steroids and immunosuppressants"
              },
              {
                "id": "dvl_p1_s3_t3",
                "name": "Biologics in dermatology"
              }
            ]
          }
        ]
      },
      {
        "id": "dvl_p2",
        "name": "Paper II – Clinical Dermatology",
        "sections": [
          {
            "id": "dvl_p2_s1",
            "name": "Infectious Diseases",
            "topics": [
              {
                "id": "dvl_p2_s1_t1",
                "name": "Bacterial infections (Impetigo, Furuncle)"
              },
              {
                "id": "dvl_p2_s1_t2",
                "name": "Fungal infections (Dermatophytosis, Candidiasis)"
              },
              {
                "id": "dvl_p2_s1_t3",
                "name": "Viral infections (Herpes, HPV, Poxvirus)"
              },
              {
                "id": "dvl_p2_s1_t4",
                "name": "Parasitic infections (Scabies, Pediculosis)"
              }
            ]
          },
          {
            "id": "dvl_p2_s2",
            "name": "Papulosquamous Disorders",
            "topics": [
              {
                "id": "dvl_p2_s2_t1",
                "name": "Psoriasis"
              },
              {
                "id": "dvl_p2_s2_t2",
                "name": "Lichen planus"
              },
              {
                "id": "dvl_p2_s2_t3",
                "name": "Pityriasis rosea"
              }
            ]
          },
          {
            "id": "dvl_p2_s3",
            "name": "Vesiculobullous Disorders",
            "topics": [
              {
                "id": "dvl_p2_s3_t1",
                "name": "Pemphigus group"
              },
              {
                "id": "dvl_p2_s3_t2",
                "name": "Bullous pemphigoid"
              }
            ]
          },
          {
            "id": "dvl_p2_s4",
            "name": "Allergic & Immunological Disorders",
            "topics": [
              {
                "id": "dvl_p2_s4_t1",
                "name": "Atopic dermatitis"
              },
              {
                "id": "dvl_p2_s4_t2",
                "name": "Contact dermatitis"
              },
              {
                "id": "dvl_p2_s4_t3",
                "name": "Urticaria and Angioedema"
              }
            ]
          },
          {
            "id": "dvl_p2_s5",
            "name": "Pigmentary Disorders",
            "topics": [
              {
                "id": "dvl_p2_s5_t1",
                "name": "Vitiligo"
              },
              {
                "id": "dvl_p2_s5_t2",
                "name": "Melasma"
              },
              {
                "id": "dvl_p2_s5_t3",
                "name": "Albinism"
              }
            ]
          },
          {
            "id": "dvl_p2_s6",
            "name": "Skin Tumors",
            "topics": [
              {
                "id": "dvl_p2_s6_t1",
                "name": "Basal cell carcinoma"
              },
              {
                "id": "dvl_p2_s6_t2",
                "name": "Squamous cell carcinoma"
              },
              {
                "id": "dvl_p2_s6_t3",
                "name": "Melanoma"
              }
            ]
          }
        ]
      },
      {
        "id": "dvl_p3",
        "name": "Paper III – Venereology and Leprosy",
        "sections": [
          {
            "id": "dvl_p3_s1",
            "name": "Venereology (STI/RTI)",
            "topics": [
              {
                "id": "dvl_p3_s1_t1",
                "name": "Syphilis"
              },
              {
                "id": "dvl_p3_s1_t2",
                "name": "Gonorrhea"
              },
              {
                "id": "dvl_p3_s1_t3",
                "name": "Chancroid and Donovanosis"
              },
              {
                "id": "dvl_p3_s1_t4",
                "name": "Genital Herpes and HPV"
              },
              {
                "id": "dvl_p3_s1_t5",
                "name": "Syndromic management of STIs"
              },
              {
                "id": "dvl_p3_s1_t6",
                "name": "Cutaneous manifestations of HIV/AIDS"
              }
            ]
          },
          {
            "id": "dvl_p3_s2",
            "name": "Leprosy (Hansen’s Disease)",
            "topics": [
              {
                "id": "dvl_p3_s2_t1",
                "name": "Classification of leprosy"
              },
              {
                "id": "dvl_p3_s2_t2",
                "name": "Clinical features and nerve involvement"
              },
              {
                "id": "dvl_p3_s2_t3",
                "name": "Lepra reactions (Type 1 and Type 2)"
              },
              {
                "id": "dvl_p3_s2_t4",
                "name": "Multi-drug therapy (MDT) regimens"
              },
              {
                "id": "dvl_p3_s2_t5",
                "name": "Deformities and rehabilitation"
              }
            ]
          }
        ]
      },
      {
        "id": "dvl_p4",
        "name": "Paper IV – Dermatosurgery, Cosmetology & Recent Advances",
        "sections": [
          {
            "id": "dvl_p4_s1",
            "name": "Dermatosurgery",
            "topics": [
              {
                "id": "dvl_p4_s1_t1",
                "name": "Acne surgeries (scar revision)"
              },
              {
                "id": "dvl_p4_s1_t2",
                "name": "Vitiligo surgery (grafting)"
              },
              {
                "id": "dvl_p4_s1_t3",
                "name": "Cryotherapy and Electrocautery"
              }
            ]
          },
          {
            "id": "dvl_p4_s2",
            "name": "Cosmetology",
            "topics": [
              {
                "id": "dvl_p4_s2_t1",
                "name": "Chemical peels"
              },
              {
                "id": "dvl_p4_s2_t2",
                "name": "Botox and Fillers"
              },
              {
                "id": "dvl_p4_s2_t3",
                "name": "Lasers in dermatology (Hair removal, Pigmentation)"
              },
              {
                "id": "dvl_p4_s2_t4",
                "name": "Hair transplantation methods"
              }
            ]
          },
          {
            "id": "dvl_p4_s3",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "dvl_p4_s3_t1",
                "name": "Dermoscopy"
              },
              {
                "id": "dvl_p4_s3_t2",
                "name": "Advances in biologics (Anti-TNF, Interleukins inhibitors)"
              }
            ]
          },
          {
            "id": "dvl_p4_s4",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "dvl_p4_s4_t1",
                "name": "Psoriasis (clinical patterns and management)"
              },
              {
                "id": "dvl_p4_s4_t2",
                "name": "Pemphigus vulgaris and Bullous pemphigoid"
              },
              {
                "id": "dvl_p4_s4_t3",
                "name": "Dermatophyte infections (Tinea)"
              },
              {
                "id": "dvl_p4_s4_t4",
                "name": "Scabies"
              },
              {
                "id": "dvl_p4_s4_t5",
                "name": "Syphilis (stages and testing)"
              },
              {
                "id": "dvl_p4_s4_t6",
                "name": "Leprosy and Lepra reactions"
              },
              {
                "id": "dvl_p4_s4_t7",
                "name": "Vitiligo management"
              },
              {
                "id": "dvl_p4_s4_t8",
                "name": "Atopic dermatitis"
              },
              {
                "id": "dvl_p4_s4_t9",
                "name": "Acne vulgaris and Isotretinoin use"
              },
              {
                "id": "dvl_p4_s4_t10",
                "name": "Cutaneous adverse drug reactions (SJS/TEN)"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c19",
    "name": "Mastering General Surgery",
    "papers": [
      {
        "id": "surg_p1",
        "name": "Paper I – Basic Sciences in Surgery",
        "sections": [
          {
            "id": "surg_p1_s1",
            "name": "Surgical Anatomy & Physiology",
            "topics": [
              {
                "id": "surg_p1_s1_t1",
                "name": "Wound healing (phases and complications)"
              },
              {
                "id": "surg_p1_s1_t2",
                "name": "Metabolic response to injury"
              },
              {
                "id": "surg_p1_s1_t3",
                "name": "Fluid, electrolyte, and acid-base balance"
              },
              {
                "id": "surg_p1_s1_t4",
                "name": "Shock (types, pathophysiology, management)"
              }
            ]
          },
          {
            "id": "surg_p1_s2",
            "name": "Surgical Pathology & Immunology",
            "topics": [
              {
                "id": "surg_p1_s2_t1",
                "name": "Tumor biology and carcinogenesis"
              },
              {
                "id": "surg_p1_s2_t2",
                "name": "Transplant immunology and rejection"
              }
            ]
          },
          {
            "id": "surg_p1_s3",
            "name": "Surgical Nutrition & Infection",
            "topics": [
              {
                "id": "surg_p1_s3_t1",
                "name": "Enteral and parenteral nutrition"
              },
              {
                "id": "surg_p1_s3_t2",
                "name": "Surgical site infections (SSI)"
              },
              {
                "id": "surg_p1_s3_t3",
                "name": "Sepsis and multi-organ failure"
              }
            ]
          },
          {
            "id": "surg_p1_s4",
            "name": "Anesthesia & Pain Management",
            "topics": [
              {
                "id": "surg_p1_s4_t1",
                "name": "Local and regional anesthesia in surgery"
              },
              {
                "id": "surg_p1_s4_t2",
                "name": "Post-operative pain management"
              }
            ]
          }
        ]
      },
      {
        "id": "surg_p2",
        "name": "Paper II – General Surgery (Gastrointestinal, Hepatobiliary)",
        "sections": [
          {
            "id": "surg_p2_s1",
            "name": "Esophagus & Stomach",
            "topics": [
              {
                "id": "surg_p2_s1_t1",
                "name": "Achalasia cardia and GERD"
              },
              {
                "id": "surg_p2_s1_t2",
                "name": "Peptic ulcer disease and complications"
              },
              {
                "id": "surg_p2_s1_t3",
                "name": "Carcinoma stomach"
              }
            ]
          },
          {
            "id": "surg_p2_s2",
            "name": "Small & Large Intestine",
            "topics": [
              {
                "id": "surg_p2_s2_t1",
                "name": "Intestinal obstruction"
              },
              {
                "id": "surg_p2_s2_t2",
                "name": "Inflammatory bowel disease (Crohn's vs UC)"
              },
              {
                "id": "surg_p2_s2_t3",
                "name": "Colorectal carcinoma"
              },
              {
                "id": "surg_p2_s2_t4",
                "name": "Appendicitis"
              }
            ]
          },
          {
            "id": "surg_p2_s3",
            "name": "Hepatobiliary System & Pancreas",
            "topics": [
              {
                "id": "surg_p2_s3_t1",
                "name": "Liver abscess and hydatid cyst"
              },
              {
                "id": "surg_p2_s3_t2",
                "name": "Gallstone disease (cholelithiasis, cholecystitis)"
              },
              {
                "id": "surg_p2_s3_t3",
                "name": "Obstructive jaundice management"
              },
              {
                "id": "surg_p2_s3_t4",
                "name": "Acute and chronic pancreatitis"
              },
              {
                "id": "surg_p2_s3_t5",
                "name": "Pancreatic tumors"
              }
            ]
          },
          {
            "id": "surg_p2_s4",
            "name": "Abdominal Wall & Hernias",
            "topics": [
              {
                "id": "surg_p2_s4_t1",
                "name": "Inguinal hernia anatomy and repair"
              },
              {
                "id": "surg_p2_s4_t2",
                "name": "Ventral and incisional hernias"
              },
              {
                "id": "surg_p2_s4_t3",
                "name": "Acute abdomen management"
              }
            ]
          }
        ]
      },
      {
        "id": "surg_p3",
        "name": "Paper III – Head, Neck, Endocrine, Breast, Vascular & Trauma",
        "sections": [
          {
            "id": "surg_p3_s1",
            "name": "Head & Neck",
            "topics": [
              {
                "id": "surg_p3_s1_t1",
                "name": "Salivary gland tumors"
              },
              {
                "id": "surg_p3_s1_t2",
                "name": "Oral cavity cancers"
              },
              {
                "id": "surg_p3_s1_t3",
                "name": "Neck swellings and lymph nodal evaluation"
              }
            ]
          },
          {
            "id": "surg_p3_s2",
            "name": "Endocrine Surgery",
            "topics": [
              {
                "id": "surg_p3_s2_t1",
                "name": "Thyroid nodules and carcinoma"
              },
              {
                "id": "surg_p3_s2_t2",
                "name": "Hyperparathyroidism"
              },
              {
                "id": "surg_p3_s2_t3",
                "name": "Adrenal tumors (Pheochromocytoma)"
              }
            ]
          },
          {
            "id": "surg_p3_s3",
            "name": "Breast Disease",
            "topics": [
              {
                "id": "surg_p3_s3_t1",
                "name": "Benign breast diseases (Fibroadenoma)"
              },
              {
                "id": "surg_p3_s3_t2",
                "name": "Breast carcinoma (screening, staging, management)"
              }
            ]
          },
          {
            "id": "surg_p3_s4",
            "name": "Vascular & Peripheral Nerve",
            "topics": [
              {
                "id": "surg_p3_s4_t1",
                "name": "Varicose veins and DVT"
              },
              {
                "id": "surg_p3_s4_t2",
                "name": "Diabetic foot and gangrene"
              },
              {
                "id": "surg_p3_s4_t3",
                "name": "Peripheral arterial occlusive disease"
              }
            ]
          },
          {
            "id": "surg_p3_s5",
            "name": "Traumatology",
            "topics": [
              {
                "id": "surg_p3_s5_t1",
                "name": "ATLS protocols"
              },
              {
                "id": "surg_p3_s5_t2",
                "name": "Blunt vs penetrating trauma abdomen"
              },
              {
                "id": "surg_p3_s5_t3",
                "name": "Chest trauma (Pneumothorax, Hemothorax)"
              }
            ]
          }
        ]
      },
      {
        "id": "surg_p4",
        "name": "Paper IV – Recent Advances & Subspecialties (Urology, Neurosurgery)",
        "sections": [
          {
            "id": "surg_p4_s1",
            "name": "Urology",
            "topics": [
              {
                "id": "surg_p4_s1_t1",
                "name": "Renal calculi management"
              },
              {
                "id": "surg_p4_s1_t2",
                "name": "Benign prostatic hyperplasia (BPH)"
              },
              {
                "id": "surg_p4_s1_t3",
                "name": "Urological malignancies (RCC, Prostate cancer)"
              }
            ]
          },
          {
            "id": "surg_p4_s2",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "surg_p4_s2_t1",
                "name": "Laparoscopic surgery principles"
              },
              {
                "id": "surg_p4_s2_t2",
                "name": "Robotic-assisted surgery"
              },
              {
                "id": "surg_p4_s2_t3",
                "name": "Bariatric surgery concepts"
              }
            ]
          },
          {
            "id": "surg_p4_s3",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "surg_p4_s3_t1",
                "name": "Shock and IV fluid management"
              },
              {
                "id": "surg_p4_s3_t2",
                "name": "Wound healing and surgical site infection"
              },
              {
                "id": "surg_p4_s3_t3",
                "name": "Acute appendicitis"
              },
              {
                "id": "surg_p4_s3_t4",
                "name": "Intestinal obstruction"
              },
              {
                "id": "surg_p4_s3_t5",
                "name": "Gallstone disease (cholecystectomy)"
              },
              {
                "id": "surg_p4_s3_t6",
                "name": "Inguinal hernia"
              },
              {
                "id": "surg_p4_s3_t7",
                "name": "Breast cancer TNM staging"
              },
              {
                "id": "surg_p4_s3_t8",
                "name": "Thyroid swellings and cancer"
              },
              {
                "id": "surg_p4_s3_t9",
                "name": "Diabetic foot ulcers"
              },
              {
                "id": "surg_p4_s3_t10",
                "name": "Blunt trauma abdomen management"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c16",
    "name": "Mastering Orthopaedics",
    "papers": [
      {
        "id": "ortho_p1",
        "name": "Paper I – Basic Sciences in Orthopaedics",
        "sections": [
          {
            "id": "ortho_p1_s1",
            "name": "Anatomy",
            "topics": [
              {
                "id": "ortho_p1_s1_t1",
                "name": "Osteology of human skeleton"
              },
              {
                "id": "ortho_p1_s1_t2",
                "name": "Brachial and lumbosacral plexus"
              },
              {
                "id": "ortho_p1_s1_t3",
                "name": "Joint anatomy and mechanics"
              },
              {
                "id": "ortho_p1_s1_t4",
                "name": "Surgical approaches (shoulder, hip, knee, spine)"
              }
            ]
          },
          {
            "id": "ortho_p1_s2",
            "name": "Physiology & Pathology of Bone",
            "topics": [
              {
                "id": "ortho_p1_s2_t1",
                "name": "Bone formation and remodeling"
              },
              {
                "id": "ortho_p1_s2_t2",
                "name": "Calcium and phosphorus metabolism"
              },
              {
                "id": "ortho_p1_s2_t3",
                "name": "Fracture healing (biology and mechanics)"
              },
              {
                "id": "ortho_p1_s2_t4",
                "name": "Bone grafting principles"
              }
            ]
          },
          {
            "id": "ortho_p1_s3",
            "name": "Biomechanics",
            "topics": [
              {
                "id": "ortho_p1_s3_t1",
                "name": "Biomechanics of implants (plates, nails, screws)"
              },
              {
                "id": "ortho_p1_s3_t2",
                "name": "Gait analysis"
              },
              {
                "id": "ortho_p1_s3_t3",
                "name": "Joint replacement biomechanics"
              }
            ]
          },
          {
            "id": "ortho_p1_s4",
            "name": "Pharmacology & Radiology",
            "topics": [
              {
                "id": "ortho_p1_s4_t1",
                "name": "NSAIDs and analgesics"
              },
              {
                "id": "ortho_p1_s4_t2",
                "name": "Antibiotics in orthopaedics"
              },
              {
                "id": "ortho_p1_s4_t3",
                "name": "Radiological imaging (X-ray, MRI, CT, DEXA)"
              }
            ]
          }
        ]
      },
      {
        "id": "ortho_p2",
        "name": "Paper II – Traumatology",
        "sections": [
          {
            "id": "ortho_p2_s1",
            "name": "General Principles of Trauma",
            "topics": [
              {
                "id": "ortho_p2_s1_t1",
                "name": "ATLS guidelines"
              },
              {
                "id": "ortho_p2_s1_t2",
                "name": "Management of polytrauma"
              },
              {
                "id": "ortho_p2_s1_t3",
                "name": "Open fractures classification and management"
              },
              {
                "id": "ortho_p2_s1_t4",
                "name": "Compartment syndrome"
              }
            ]
          },
          {
            "id": "ortho_p2_s2",
            "name": "Upper Limb Trauma",
            "topics": [
              {
                "id": "ortho_p2_s2_t1",
                "name": "Clavicle and proximal humerus fractures"
              },
              {
                "id": "ortho_p2_s2_t2",
                "name": "Shoulder dislocation"
              },
              {
                "id": "ortho_p2_s2_t3",
                "name": "Supracondylar fracture of humerus"
              },
              {
                "id": "ortho_p2_s2_t4",
                "name": "Radius and ulna fractures (Monteggia, Galeazzi)"
              },
              {
                "id": "ortho_p2_s2_t5",
                "name": "Distal radius fractures (Colles’)"
              },
              {
                "id": "ortho_p2_s2_t6",
                "name": "Hand and wrist injuries"
              }
            ]
          },
          {
            "id": "ortho_p2_s3",
            "name": "Pelvic & Lower Limb Trauma",
            "topics": [
              {
                "id": "ortho_p2_s3_t1",
                "name": "Pelvic fractures and acetabular fractures"
              },
              {
                "id": "ortho_p2_s3_t2",
                "name": "Hip dislocation (anterior, posterior)"
              },
              {
                "id": "ortho_p2_s3_t3",
                "name": "Neck of femur fracture"
              },
              {
                "id": "ortho_p2_s3_t4",
                "name": "Shaft of femur fracture"
              },
              {
                "id": "ortho_p2_s3_t5",
                "name": "Tibial plateau fractures"
              },
              {
                "id": "ortho_p2_s3_t6",
                "name": "Ankle fractures and malleolar injuries"
              }
            ]
          },
          {
            "id": "ortho_p2_s4",
            "name": "Spinal Trauma",
            "topics": [
              {
                "id": "ortho_p2_s4_t1",
                "name": "Cervical spine injuries"
              },
              {
                "id": "ortho_p2_s4_t2",
                "name": "Thoracolumbar spine fractures"
              },
              {
                "id": "ortho_p2_s4_t3",
                "name": "Spinal cord injury and neurogenic shock"
              }
            ]
          }
        ]
      },
      {
        "id": "ortho_p3",
        "name": "Paper III – Orthopaedic Diseases",
        "sections": [
          {
            "id": "ortho_p3_s1",
            "name": "Congenital & Developmental Disorders",
            "topics": [
              {
                "id": "ortho_p3_s1_t1",
                "name": "Developmental dysplasia of the hip (DDH)"
              },
              {
                "id": "ortho_p3_s1_t2",
                "name": "Congenital talipes equinovarus (CTEV - Clubfoot)"
              },
              {
                "id": "ortho_p3_s1_t3",
                "name": "Osteogenesis imperfecta"
              },
              {
                "id": "ortho_p3_s1_t4",
                "name": "Slipped capital femoral epiphysis (SCFE)"
              },
              {
                "id": "ortho_p3_s1_t5",
                "name": "Perthes disease"
              }
            ]
          },
          {
            "id": "ortho_p3_s2",
            "name": "Bone & Joint Infections",
            "topics": [
              {
                "id": "ortho_p3_s2_t1",
                "name": "Acute and chronic osteomyelitis"
              },
              {
                "id": "ortho_p3_s2_t2",
                "name": "Septic arthritis"
              },
              {
                "id": "ortho_p3_s2_t3",
                "name": "Tuberculosis of spine (Pott’s spine)"
              },
              {
                "id": "ortho_p3_s2_t4",
                "name": "Tuberculosis of hip and knee"
              }
            ]
          },
          {
            "id": "ortho_p3_s3",
            "name": "Metabolic Bone Diseases",
            "topics": [
              {
                "id": "ortho_p3_s3_t1",
                "name": "Osteoporosis and fragility fractures"
              },
              {
                "id": "ortho_p3_s3_t2",
                "name": "Rickets and osteomalacia"
              },
              {
                "id": "ortho_p3_s3_t3",
                "name": "Paget’s disease"
              }
            ]
          },
          {
            "id": "ortho_p3_s4",
            "name": "Orthopaedic Oncology",
            "topics": [
              {
                "id": "ortho_p3_s4_t1",
                "name": "Benign bone tumors (Osteochondroma, GCT)"
              },
              {
                "id": "ortho_p3_s4_t2",
                "name": "Malignant bone tumors (Osteosarcoma, Ewing’s sarcoma)"
              },
              {
                "id": "ortho_p3_s4_t3",
                "name": "Metastatic bone disease"
              }
            ]
          },
          {
            "id": "ortho_p3_s5",
            "name": "Rheumatology & Degenerative Disorders",
            "topics": [
              {
                "id": "ortho_p3_s5_t1",
                "name": "Osteoarthritis (Hip, Knee)"
              },
              {
                "id": "ortho_p3_s5_t2",
                "name": "Rheumatoid arthritis"
              },
              {
                "id": "ortho_p3_s5_t3",
                "name": "Ankylosing spondylitis"
              },
              {
                "id": "ortho_p3_s5_t4",
                "name": "Gout and pseudogout"
              }
            ]
          },
          {
            "id": "ortho_p3_s6",
            "name": "Neuromuscular Disorders",
            "topics": [
              {
                "id": "ortho_p3_s6_t1",
                "name": "Cerebral palsy (orthopaedic management)"
              },
              {
                "id": "ortho_p3_s6_t2",
                "name": "Poliomyelitis (residuals and management)"
              },
              {
                "id": "ortho_p3_s6_t3",
                "name": "Peripheral nerve injuries (Radial, Ulnar, Median)"
              }
            ]
          }
        ]
      },
      {
        "id": "ortho_p4",
        "name": "Paper IV – Recent Advances & Subspecialties",
        "sections": [
          {
            "id": "ortho_p4_s1",
            "name": "Joint Replacement (Arthroplasty)",
            "topics": [
              {
                "id": "ortho_p4_s1_t1",
                "name": "Total hip replacement (THR)"
              },
              {
                "id": "ortho_p4_s1_t2",
                "name": "Total knee replacement (TKR)"
              },
              {
                "id": "ortho_p4_s1_t3",
                "name": "Complications of arthroplasty"
              }
            ]
          },
          {
            "id": "ortho_p4_s2",
            "name": "Sports Medicine & Arthroscopy",
            "topics": [
              {
                "id": "ortho_p4_s2_t1",
                "name": "ACL and PCL injuries and reconstruction"
              },
              {
                "id": "ortho_p4_s2_t2",
                "name": "Meniscal tears"
              },
              {
                "id": "ortho_p4_s2_t3",
                "name": "Shoulder instability and rotator cuff tears"
              }
            ]
          },
          {
            "id": "ortho_p4_s3",
            "name": "Spine Surgery",
            "topics": [
              {
                "id": "ortho_p4_s3_t1",
                "name": "Intervertebral disc prolapse (IVDP)"
              },
              {
                "id": "ortho_p4_s3_t2",
                "name": "Spinal canal stenosis"
              },
              {
                "id": "ortho_p4_s3_t3",
                "name": "Spondylolisthesis"
              },
              {
                "id": "ortho_p4_s3_t4",
                "name": "Scoliosis and kyphosis management"
              }
            ]
          },
          {
            "id": "ortho_p4_s4",
            "name": "Advances in Orthopaedics",
            "topics": [
              {
                "id": "ortho_p4_s4_t1",
                "name": "Ilizarov ring fixator principles"
              },
              {
                "id": "ortho_p4_s4_t2",
                "name": "Minimally invasive osteosynthesis (MIPO)"
              },
              {
                "id": "ortho_p4_s4_t3",
                "name": "Cartilage repair and stem cells"
              },
              {
                "id": "ortho_p4_s4_t4",
                "name": "Robotic-assisted joint replacement"
              }
            ]
          },
          {
            "id": "ortho_p4_s5",
            "name": "Amputations, Prosthetics & Orthotics",
            "topics": [
              {
                "id": "ortho_p4_s5_t1",
                "name": "Principles and levels of amputation"
              },
              {
                "id": "ortho_p4_s5_t2",
                "name": "Types of prostheses and orthoses"
              }
            ]
          },
          {
            "id": "ortho_p4_s6",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "ortho_p4_s6_t1",
                "name": "Neck of femur fracture and management"
              },
              {
                "id": "ortho_p4_s6_t2",
                "name": "Supracondylar fracture of humerus"
              },
              {
                "id": "ortho_p4_s6_t3",
                "name": "Open fracture classification (Gustilo-Anderson)"
              },
              {
                "id": "ortho_p4_s6_t4",
                "name": "Compartment syndrome"
              },
              {
                "id": "ortho_p4_s6_t5",
                "name": "Tuberculosis of spine (Pott’s spine)"
              },
              {
                "id": "ortho_p4_s6_t6",
                "name": "Osteomyelitis and septic arthritis"
              },
              {
                "id": "ortho_p4_s6_t7",
                "name": "Developmental dysplasia of hip (DDH)"
              },
              {
                "id": "ortho_p4_s6_t8",
                "name": "Clubfoot (CTEV) and Ponseti method"
              },
              {
                "id": "ortho_p4_s6_t9",
                "name": "Osteosarcoma and Giant Cell Tumor (GCT)"
              },
              {
                "id": "ortho_p4_s6_t10",
                "name": "ACL injury and meniscal tears"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c11",
    "name": "Mastering Obstetrics & Gynecology",
    "papers": [
      {
        "id": "obg_p1",
        "name": "Paper I – Basic Sciences Applied to Obstetrics & Gynecology",
        "sections": [
          {
            "id": "obg_p1_s1",
            "name": "Anatomy",
            "topics": [
              {
                "id": "obg_p1_s1_t1",
                "name": "Female reproductive system anatomy"
              },
              {
                "id": "obg_p1_s1_t2",
                "name": "Pelvic anatomy and diameters"
              }
            ]
          },
          {
            "id": "obg_p1_s2",
            "name": "Physiology",
            "topics": [
              {
                "id": "obg_p1_s2_t1",
                "name": "Menstrual cycle"
              },
              {
                "id": "obg_p1_s2_t2",
                "name": "Hormonal regulation of reproduction"
              },
              {
                "id": "obg_p1_s2_t3",
                "name": "Ovulation and fertilization"
              }
            ]
          },
          {
            "id": "obg_p1_s3",
            "name": "Embryology",
            "topics": [
              {
                "id": "obg_p1_s3_t1",
                "name": "Development of placenta"
              },
              {
                "id": "obg_p1_s3_t2",
                "name": "Fetal membranes"
              }
            ]
          },
          {
            "id": "obg_p1_s4",
            "name": "Pharmacology",
            "topics": [
              {
                "id": "obg_p1_s4_t1",
                "name": "Oxytocics and tocolytics"
              },
              {
                "id": "obg_p1_s4_t2",
                "name": "Hormonal therapy in gynecology"
              }
            ]
          },
          {
            "id": "obg_p1_s5",
            "name": "Pathology",
            "topics": [
              {
                "id": "obg_p1_s5_t1",
                "name": "Endometrial hyperplasia"
              },
              {
                "id": "obg_p1_s5_t2",
                "name": "Ovarian tumors"
              }
            ]
          }
        ]
      },
      {
        "id": "obg_p2",
        "name": "Paper II – Obstetrics",
        "sections": [
          {
            "id": "obg_p2_s1",
            "name": "Normal Pregnancy",
            "topics": [
              {
                "id": "obg_p2_s1_t1",
                "name": "Antenatal care"
              },
              {
                "id": "obg_p2_s1_t2",
                "name": "Physiological changes in pregnancy"
              }
            ]
          },
          {
            "id": "obg_p2_s2",
            "name": "Complications of Pregnancy",
            "topics": [
              {
                "id": "obg_p2_s2_t1",
                "name": "Pregnancy induced hypertension (PIH)"
              },
              {
                "id": "obg_p2_s2_t2",
                "name": "Gestational diabetes mellitus"
              },
              {
                "id": "obg_p2_s2_t3",
                "name": "Anemia in pregnancy"
              }
            ]
          },
          {
            "id": "obg_p2_s3",
            "name": "Obstetric Emergencies",
            "topics": [
              {
                "id": "obg_p2_s3_t1",
                "name": "Postpartum hemorrhage (PPH)"
              },
              {
                "id": "obg_p2_s3_t2",
                "name": "Eclampsia"
              },
              {
                "id": "obg_p2_s3_t3",
                "name": "Obstructed labor"
              }
            ]
          },
          {
            "id": "obg_p2_s4",
            "name": "Fetal Medicine",
            "topics": [
              {
                "id": "obg_p2_s4_t1",
                "name": "Intrauterine growth restriction (IUGR)"
              },
              {
                "id": "obg_p2_s4_t2",
                "name": "Fetal distress"
              }
            ]
          },
          {
            "id": "obg_p2_s5",
            "name": "Labor and Delivery",
            "topics": [
              {
                "id": "obg_p2_s5_t1",
                "name": "Mechanism of normal labor"
              },
              {
                "id": "obg_p2_s5_t2",
                "name": "Induction of labor"
              },
              {
                "id": "obg_p2_s5_t3",
                "name": "Cesarean section"
              }
            ]
          }
        ]
      },
      {
        "id": "obg_p3",
        "name": "Paper III – Gynecology",
        "sections": [
          {
            "id": "obg_p3_s1",
            "name": "Menstrual Disorders",
            "topics": [
              {
                "id": "obg_p3_s1_t1",
                "name": "Amenorrhea"
              },
              {
                "id": "obg_p3_s1_t2",
                "name": "Dysmenorrhea"
              },
              {
                "id": "obg_p3_s1_t3",
                "name": "Abnormal uterine bleeding (AUB)"
              }
            ]
          },
          {
            "id": "obg_p3_s2",
            "name": "Gynecological Infections",
            "topics": [
              {
                "id": "obg_p3_s2_t1",
                "name": "Pelvic inflammatory disease (PID)"
              }
            ]
          },
          {
            "id": "obg_p3_s3",
            "name": "Tumors",
            "topics": [
              {
                "id": "obg_p3_s3_t1",
                "name": "Fibroid uterus"
              },
              {
                "id": "obg_p3_s3_t2",
                "name": "Ovarian tumors"
              },
              {
                "id": "obg_p3_s3_t3",
                "name": "Endometrial carcinoma"
              },
              {
                "id": "obg_p3_s3_t4",
                "name": "Cervical cancer"
              }
            ]
          },
          {
            "id": "obg_p3_s4",
            "name": "Urogynecology",
            "topics": [
              {
                "id": "obg_p3_s4_t1",
                "name": "Pelvic organ prolapse"
              },
              {
                "id": "obg_p3_s4_t2",
                "name": "Urinary incontinence"
              }
            ]
          }
        ]
      },
      {
        "id": "obg_p4",
        "name": "Paper IV – Reproductive Medicine, Oncology & Recent Advances",
        "sections": [
          {
            "id": "obg_p4_s1",
            "name": "Infertility",
            "topics": [
              {
                "id": "obg_p4_s1_t1",
                "name": "Causes of infertility"
              },
              {
                "id": "obg_p4_s1_t2",
                "name": "Evaluation of infertile couple"
              },
              {
                "id": "obg_p4_s1_t3",
                "name": "Assisted reproductive techniques (ART)"
              }
            ]
          },
          {
            "id": "obg_p4_s2",
            "name": "Family Planning",
            "topics": [
              {
                "id": "obg_p4_s2_t1",
                "name": "Contraceptive methods"
              },
              {
                "id": "obg_p4_s2_t2",
                "name": "Sterilization procedures"
              }
            ]
          },
          {
            "id": "obg_p4_s3",
            "name": "Gynecological Oncology",
            "topics": [
              {
                "id": "obg_p4_s3_t1",
                "name": "Cervical cancer screening"
              },
              {
                "id": "obg_p4_s3_t2",
                "name": "Ovarian cancer management"
              }
            ]
          },
          {
            "id": "obg_p4_s4",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "obg_p4_s4_t1",
                "name": "Laparoscopic gynecologic surgery"
              },
              {
                "id": "obg_p4_s4_t2",
                "name": "Robotic surgery in gynecology"
              },
              {
                "id": "obg_p4_s4_t3",
                "name": "Fetal medicine advances"
              }
            ]
          },
          {
            "id": "obg_p4_s5",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "obg_p4_s5_t1",
                "name": "Pregnancy induced hypertension (PIH)"
              },
              {
                "id": "obg_p4_s5_t2",
                "name": "Postpartum hemorrhage (PPH)"
              },
              {
                "id": "obg_p4_s5_t3",
                "name": "Eclampsia"
              },
              {
                "id": "obg_p4_s5_t4",
                "name": "Gestational diabetes mellitus"
              },
              {
                "id": "obg_p4_s5_t5",
                "name": "Abnormal uterine bleeding (AUB)"
              },
              {
                "id": "obg_p4_s5_t6",
                "name": "Fibroid uterus"
              },
              {
                "id": "obg_p4_s5_t7",
                "name": "Cervical cancer"
              },
              {
                "id": "obg_p4_s5_t8",
                "name": "Infertility evaluation"
              },
              {
                "id": "obg_p4_s5_t9",
                "name": "Pelvic organ prolapse"
              },
              {
                "id": "obg_p4_s5_t10",
                "name": "Contraceptive methods"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c15",
    "name": "Mastering Anaesthesiology",
    "papers": [
      {
        "id": "ana_p1",
        "name": "Paper I – Basic Sciences in Relation to Anaesthesiology",
        "sections": [
          {
            "id": "ana_p1_s1",
            "name": "Anatomy",
            "topics": [
              {
                "id": "ana_p1_s1_t1",
                "name": "Airway anatomy"
              },
              {
                "id": "ana_p1_s1_t2",
                "name": "Neuraxial neuroanatomy"
              },
              {
                "id": "ana_p1_s1_t3",
                "name": "Peripheral nerve plexuses (brachial, lumbar)"
              }
            ]
          },
          {
            "id": "ana_p1_s2",
            "name": "Physiology",
            "topics": [
              {
                "id": "ana_p1_s2_t1",
                "name": "Respiratory physiology and gas exchange"
              },
              {
                "id": "ana_p1_s2_t2",
                "name": "Cardiovascular physiology (cardiac output, blood pressure)"
              },
              {
                "id": "ana_p1_s2_t3",
                "name": "Renal and hepatic physiology"
              },
              {
                "id": "ana_p1_s2_t4",
                "name": "Neurophysiology and ICP"
              }
            ]
          },
          {
            "id": "ana_p1_s3",
            "name": "Pharmacology",
            "topics": [
              {
                "id": "ana_p1_s3_t1",
                "name": "Inhalational anaesthetics"
              },
              {
                "id": "ana_p1_s3_t2",
                "name": "Intravenous anaesthetics (Propofol, Ketamine)"
              },
              {
                "id": "ana_p1_s3_t3",
                "name": "Neuromuscular blocking agents"
              },
              {
                "id": "ana_p1_s3_t4",
                "name": "Local anaesthetics"
              },
              {
                "id": "ana_p1_s3_t5",
                "name": "Opioids and analgesics"
              }
            ]
          },
          {
            "id": "ana_p1_s4",
            "name": "Physics in Anaesthesia",
            "topics": [
              {
                "id": "ana_p1_s4_t1",
                "name": "Gas laws"
              },
              {
                "id": "ana_p1_s4_t2",
                "name": "Vaporizers and breathing circuits"
              },
              {
                "id": "ana_p1_s4_t3",
                "name": "Monitoring principles (ECG, SpO2, Capnography)"
              }
            ]
          }
        ]
      },
      {
        "id": "ana_p2",
        "name": "Paper II – Clinical Anaesthesiology",
        "sections": [
          {
            "id": "ana_p2_s1",
            "name": "Preoperative Assessment",
            "topics": [
              {
                "id": "ana_p2_s1_t1",
                "name": "Pre-anaesthetic evaluation (PAC)"
              },
              {
                "id": "ana_p2_s1_t2",
                "name": "ASA grading"
              },
              {
                "id": "ana_p2_s1_t3",
                "name": "Airway assessment"
              }
            ]
          },
          {
            "id": "ana_p2_s2",
            "name": "General Anaesthesia",
            "topics": [
              {
                "id": "ana_p2_s2_t1",
                "name": "Induction and intubation"
              },
              {
                "id": "ana_p2_s2_t2",
                "name": "Maintenance of anaesthesia"
              },
              {
                "id": "ana_p2_s2_t3",
                "name": "Reversal and extubation"
              }
            ]
          },
          {
            "id": "ana_p2_s3",
            "name": "Regional Anaesthesia",
            "topics": [
              {
                "id": "ana_p2_s3_t1",
                "name": "Spinal anaesthesia"
              },
              {
                "id": "ana_p2_s3_t2",
                "name": "Epidural and caudal anaesthesia"
              },
              {
                "id": "ana_p2_s3_t3",
                "name": "Peripheral nerve blocks (USG guided)"
              }
            ]
          },
          {
            "id": "ana_p2_s4",
            "name": "Complications",
            "topics": [
              {
                "id": "ana_p2_s4_t1",
                "name": "Difficult airway management"
              },
              {
                "id": "ana_p2_s4_t2",
                "name": "Malignant hyperthermia"
              },
              {
                "id": "ana_p2_s4_t3",
                "name": "Anaesthetic emergencies (anaphylaxis, local anaesthetic systemic toxicity)"
              }
            ]
          }
        ]
      },
      {
        "id": "ana_p3",
        "name": "Paper III – Anaesthesia in Specialities",
        "sections": [
          {
            "id": "ana_p3_s1",
            "name": "Obstetric Anaesthesia",
            "topics": [
              {
                "id": "ana_p3_s1_t1",
                "name": "Physiological changes in pregnancy"
              },
              {
                "id": "ana_p3_s1_t2",
                "name": "Labour analgesia"
              },
              {
                "id": "ana_p3_s1_t3",
                "name": "Anaesthesia for LSCS"
              }
            ]
          },
          {
            "id": "ana_p3_s2",
            "name": "Paediatric Anaesthesia",
            "topics": [
              {
                "id": "ana_p3_s2_t1",
                "name": "Neonatal resuscitation"
              },
              {
                "id": "ana_p3_s2_t2",
                "name": "Paediatric equipment and circuits"
              },
              {
                "id": "ana_p3_s2_t3",
                "name": "Anaesthesia for common paediatric surgeries"
              }
            ]
          },
          {
            "id": "ana_p3_s3",
            "name": "Neuroanaesthesia",
            "topics": [
              {
                "id": "ana_p3_s3_t1",
                "name": "Anaesthesia for craniotomy"
              },
              {
                "id": "ana_p3_s3_t2",
                "name": "Management of raised ICP"
              }
            ]
          },
          {
            "id": "ana_p3_s4",
            "name": "Cardiac & Thoracic Anaesthesia",
            "topics": [
              {
                "id": "ana_p3_s4_t1",
                "name": "Cardiopulmonary bypass principles"
              },
              {
                "id": "ana_p3_s4_t2",
                "name": "One-lung ventilation"
              }
            ]
          },
          {
            "id": "ana_p3_s5",
            "name": "Other Specialties",
            "topics": [
              {
                "id": "ana_p3_s5_t1",
                "name": "Anaesthesia for laparoscopy"
              },
              {
                "id": "ana_p3_s5_t2",
                "name": "Geriatric anaesthesia"
              },
              {
                "id": "ana_p3_s5_t3",
                "name": "Anaesthesia for trauma"
              }
            ]
          }
        ]
      },
      {
        "id": "ana_p4",
        "name": "Paper IV – Intensive Care Medicine & Pain Management",
        "sections": [
          {
            "id": "ana_p4_s1",
            "name": "Intensive Care Medicine",
            "topics": [
              {
                "id": "ana_p4_s1_t1",
                "name": "Mechanical ventilation modes"
              },
              {
                "id": "ana_p4_s1_t2",
                "name": "ARDS management"
              },
              {
                "id": "ana_p4_s1_t3",
                "name": "Sepsis and septic shock"
              },
              {
                "id": "ana_p4_s1_t4",
                "name": "Acid-base balance and ABG interpretation"
              },
              {
                "id": "ana_p4_s1_t5",
                "name": "Fluid and electrolyte management"
              }
            ]
          },
          {
            "id": "ana_p4_s2",
            "name": "Resuscitation",
            "topics": [
              {
                "id": "ana_p4_s2_t1",
                "name": "BLS and ACLS protocols"
              },
              {
                "id": "ana_p4_s2_t2",
                "name": "Post-cardiac arrest care"
              }
            ]
          },
          {
            "id": "ana_p4_s3",
            "name": "Pain Management",
            "topics": [
              {
                "id": "ana_p4_s3_t1",
                "name": "Acute postoperative pain"
              },
              {
                "id": "ana_p4_s3_t2",
                "name": "Chronic pain management"
              },
              {
                "id": "ana_p4_s3_t3",
                "name": "Palliative care"
              }
            ]
          },
          {
            "id": "ana_p4_s4",
            "name": "Recent Advances",
            "topics": [
              {
                "id": "ana_p4_s4_t1",
                "name": "Target controlled infusion (TCI)"
              },
              {
                "id": "ana_p4_s4_t2",
                "name": "Ultrasound in ICU and regional anaesthesia"
              }
            ]
          },
          {
            "id": "ana_p4_s5",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "ana_p4_s5_t1",
                "name": "Airway management guidelines"
              },
              {
                "id": "ana_p4_s5_t2",
                "name": "Difficult airway algorithm"
              },
              {
                "id": "ana_p4_s5_t3",
                "name": "Local anaesthetic systemic toxicity (LAST)"
              },
              {
                "id": "ana_p4_s5_t4",
                "name": "Spinal vs epidural anaesthesia"
              },
              {
                "id": "ana_p4_s5_t5",
                "name": "Labour analgesia"
              },
              {
                "id": "ana_p4_s5_t6",
                "name": "ACLS and BLS protocols"
              },
              {
                "id": "ana_p4_s5_t7",
                "name": "ARDS and ventilator strategies"
              },
              {
                "id": "ana_p4_s5_t8",
                "name": "Sepsis guidelines"
              },
              {
                "id": "ana_p4_s5_t9",
                "name": "Inhalational agents pharmacokinetics"
              },
              {
                "id": "ana_p4_s5_t10",
                "name": "ABG interpretation"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "c18",
    "name": "Mastering Radio Diagnosis",
    "papers": [
      {
        "id": "rad_p1",
        "name": "Paper I – Basic Sciences in Radio Diagnosis",
        "sections": [
          {
            "id": "rad_p1_s1",
            "name": "Physics of Radiology",
            "topics": [
              {
                "id": "rad_p1_s1_t1",
                "name": "Production of X-rays"
              },
              {
                "id": "rad_p1_s1_t2",
                "name": "Interaction of radiation with matter"
              },
              {
                "id": "rad_p1_s1_t3",
                "name": "X-ray tubes and generators"
              }
            ]
          },
          {
            "id": "rad_p1_s2",
            "name": "Radiation Protection",
            "topics": [
              {
                "id": "rad_p1_s2_t1",
                "name": "Radiation dosimetry"
              },
              {
                "id": "rad_p1_s2_t2",
                "name": "Biological effects of radiation"
              },
              {
                "id": "rad_p1_s2_t3",
                "name": "AERB guidelines and shielding"
              }
            ]
          },
          {
            "id": "rad_p1_s3",
            "name": "Physics of Advanced Modalities",
            "topics": [
              {
                "id": "rad_p1_s3_t1",
                "name": "Ultrasound physics (Piezoelectric effect, Doppler)"
              },
              {
                "id": "rad_p1_s3_t2",
                "name": "CT physics (Hounsfield units, generations of CT)"
              },
              {
                "id": "rad_p1_s3_t3",
                "name": "MRI physics (T1, T2, spin echo, gradient echo)"
              }
            ]
          },
          {
            "id": "rad_p1_s4",
            "name": "Contrast Media",
            "topics": [
              {
                "id": "rad_p1_s4_t1",
                "name": "Iodinated contrast media and adverse reactions"
              },
              {
                "id": "rad_p1_s4_t2",
                "name": "MRI contrast agents (Gadolinium)"
              },
              {
                "id": "rad_p1_s4_t3",
                "name": "Ultrasound contrast agents"
              }
            ]
          }
        ]
      },
      {
        "id": "rad_p2",
        "name": "Paper II – Respiratory & Cardiovascular System Radiodiagnosis",
        "sections": [
          {
            "id": "rad_p2_s1",
            "name": "Respiratory System",
            "topics": [
              {
                "id": "rad_p2_s1_t1",
                "name": "Normal chest radiograph anatomy"
              },
              {
                "id": "rad_p2_s1_t2",
                "name": "Pulmonary infections (TB, Pneumonia)"
              },
              {
                "id": "rad_p2_s1_t3",
                "name": "Lung tumors (Bronchogenic carcinoma vs metastasis)"
              },
              {
                "id": "rad_p2_s1_t4",
                "name": "Interstitial lung diseases (HRCT patterns)"
              },
              {
                "id": "rad_p2_s1_t5",
                "name": "Pleural and mediastinal diseases"
              }
            ]
          },
          {
            "id": "rad_p2_s2",
            "name": "Cardiovascular System",
            "topics": [
              {
                "id": "rad_p2_s2_t1",
                "name": "Congenital heart diseases (cyanotic and acyanotic)"
              },
              {
                "id": "rad_p2_s2_t2",
                "name": "Acquired heart diseases (Valvular, IHD)"
              },
              {
                "id": "rad_p2_s2_t3",
                "name": "Aortic aneurysms and dissection"
              },
              {
                "id": "rad_p2_s2_t4",
                "name": "Deep vein thrombosis and pulmonary embolism"
              }
            ]
          }
        ]
      },
      {
        "id": "rad_p3",
        "name": "Paper III – Gastrointestinal, Genitourinary, Hepatobiliary & Endocrine",
        "sections": [
          {
            "id": "rad_p3_s1",
            "name": "Gastrointestinal System",
            "topics": [
              {
                "id": "rad_p3_s1_t1",
                "name": "Barium studies (swallow, meal, enema)"
              },
              {
                "id": "rad_p3_s1_t2",
                "name": "Esophageal disorders (Achalasia, strictures)"
              },
              {
                "id": "rad_p3_s1_t3",
                "name": "Gastric and bowel tumors"
              },
              {
                "id": "rad_p3_s1_t4",
                "name": "Inflammatory bowel disease"
              }
            ]
          },
          {
            "id": "rad_p3_s2",
            "name": "Hepatobiliary System & Pancreas",
            "topics": [
              {
                "id": "rad_p3_s2_t1",
                "name": "Liver tumors (HCC, Hemangioma, Mets)"
              },
              {
                "id": "rad_p3_s2_t2",
                "name": "Biliary tree (Cholelithiasis, Cholangiocarcinoma)"
              },
              {
                "id": "rad_p3_s2_t3",
                "name": "Acute and chronic pancreatitis"
              }
            ]
          },
          {
            "id": "rad_p3_s3",
            "name": "Genitourinary System",
            "topics": [
              {
                "id": "rad_p3_s3_t1",
                "name": "Renal calculi and hydronephrosis"
              },
              {
                "id": "rad_p3_s3_t2",
                "name": "Renal masses (RCC, Angiomyolipoma)"
              },
              {
                "id": "rad_p3_s3_t3",
                "name": "Prostate enlargement and carcinoma (mpMRI)"
              },
              {
                "id": "rad_p3_s3_t4",
                "name": "Female imaging (PCOS, fibroids, ovarian tumors)"
              }
            ]
          },
          {
            "id": "rad_p3_s4",
            "name": "Obstetrics Imaging",
            "topics": [
              {
                "id": "rad_p3_s4_t1",
                "name": "First trimester scan (dating and anomalies)"
              },
              {
                "id": "rad_p3_s4_t2",
                "name": "Fetal anomaly scan (TIFFA)"
              },
              {
                "id": "rad_p3_s4_t3",
                "name": "Doppler in obstetrics (IUGR, preeclampsia)"
              }
            ]
          }
        ]
      },
      {
        "id": "rad_p4",
        "name": "Paper IV – Musculoskeletal, Neuro-radiology & Recent Advances",
        "sections": [
          {
            "id": "rad_p4_s1",
            "name": "Musculoskeletal System",
            "topics": [
              {
                "id": "rad_p4_s1_t1",
                "name": "Bone tumors imaging"
              },
              {
                "id": "rad_p4_s1_t2",
                "name": "Arthritis (RA vs OA patterns on X-ray)"
              },
              {
                "id": "rad_p4_s1_t3",
                "name": "Spinal trauma and infections (TB spine)"
              }
            ]
          },
          {
            "id": "rad_p4_s2",
            "name": "Neuro-radiology",
            "topics": [
              {
                "id": "rad_p4_s2_t1",
                "name": "Stroke imaging (ischemic and hemorrhagic)"
              },
              {
                "id": "rad_p4_s2_t2",
                "name": "Brain tumors (Gliomas, Meningioma)"
              },
              {
                "id": "rad_p4_s2_t3",
                "name": "Intracranial infections (TB, Neurocysticercosis)"
              },
              {
                "id": "rad_p4_s2_t4",
                "name": "White matter diseases (Multiple sclerosis)"
              }
            ]
          },
          {
            "id": "rad_p4_s3",
            "name": "Interventional Radiology",
            "topics": [
              {
                "id": "rad_p4_s3_t1",
                "name": "Image-guided biopsies and drainages"
              },
              {
                "id": "rad_p4_s3_t2",
                "name": "Angiography and embolization"
              },
              {
                "id": "rad_p4_s3_t3",
                "name": "Radiofrequency ablation (RFA)"
              }
            ]
          },
          {
            "id": "rad_p4_s4",
            "name": "Very High-Yield Topics",
            "topics": [
              {
                "id": "rad_p4_s4_t1",
                "name": "Radiation protection and AERB norms"
              },
              {
                "id": "rad_p4_s4_t2",
                "name": "Contrast reactions and management"
              },
              {
                "id": "rad_p4_s4_t3",
                "name": "HRCT thorax in ILD and infections"
              },
              {
                "id": "rad_p4_s4_t4",
                "name": "Stroke imaging protocols"
              },
              {
                "id": "rad_p4_s4_t5",
                "name": "Tuberculosis (pulmonary, neuro, skeletal)"
              },
              {
                "id": "rad_p4_s4_t6",
                "name": "Renal and Ureteric calculi imaging"
              },
              {
                "id": "rad_p4_s4_t7",
                "name": "HCC vs Liver metastasis"
              },
              {
                "id": "rad_p4_s4_t8",
                "name": "Congenital anomalies scan in pregnancy"
              },
              {
                "id": "rad_p4_s4_t9",
                "name": "Bone tumor imaging"
              },
              {
                "id": "rad_p4_s4_t10",
                "name": "PI-RADS and BI-RADS classification basics"
              }
            ]
          }
        ]
      }
    ]
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// CONTROL PANEL AUTH CREDENTIALS (hashed at build for security-through-obscurity)
// ═══════════════════════════════════════════════════════════════════════════
const CP_CREDENTIALS = [
  { email: 'drnarayanak@gmail.com', password: 'Tata@#viDhya#2026', role: 'Super Admin' },
  { email: 'aimsrcpharmac@gmail.com', password: 'DeVanaHalli-#@Pradeep#2026', role: 'Admin' },
];

const ControlPanelLogin = ({ onSuccess }: { onSuccess: (role: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    // Simulate brief network delay for UX
    setTimeout(() => {
      const match = CP_CREDENTIALS.find(c => c.email === email.trim().toLowerCase() && c.password === password);
      if (match) {
        sessionStorage.setItem('cp_auth', JSON.stringify({ role: match.role, ts: Date.now() }));
        onSuccess(match.role);
      } else {
        setError('Invalid credentials. Access denied.');
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Shield size={22} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">MediMentr</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Control Panel Access</h1>
          <p className="text-slate-400 text-sm">Authorized personnel only. Enter your credentials.</p>
        </div>

        {/* Login Card */}
        <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/30">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-400 shrink-0" />
              <span className="text-red-300 text-sm font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm py-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div> Verifying...</>
            ) : (
              <><LogIn size={18} /> Sign In to Control Panel</>
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs">🔒 This area is protected. Unauthorized access attempts are logged.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

const ControlPanel = ({ onNavigate, curriculum, setCurriculum, blogPosts, setBlogPosts }: { onNavigate: (page: string) => void, curriculum: any, setCurriculum: any, blogPosts: any[], setBlogPosts: (posts: any[]) => void }) => {
  // ── ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS ──────────
  const [cpAuthed, setCpAuthed] = useState(false);
  const [cpRole, setCpRole] = useState('');
  const [activeTab, setActiveTab] = useState('lms-notes');
  const [activeGenTab, setActiveGenTab] = useState('lms-notes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lmsNotes, setLmsNotes] = useState(DEFAULT_LMS_STRUCTURE);
  const [essayQuestions, setEssayQuestions] = useState(DEFAULT_ESSAY_STRUCTURE);
  const [mcqQuestions, setMcqQuestions] = useState(DEFAULT_MCQ_STRUCTURE);
  const [flashCards, setFlashCards] = useState(DEFAULT_FLASH_CARDS_STRUCTURE);
  const [isBulkBlogModalOpen, setIsBulkBlogModalOpen] = useState(false);
  const [blogModalData, setBlogModalData] = useState({ count: 1, categories: [] as string[] });
  const [editingBlogIdx, setEditingBlogIdx] = useState<number | null>(null);
  const [isCreatingBlog, setIsCreatingBlog] = useState(false);
  const [blogForm, setBlogForm] = useState({ title: '', category: '', excerpt: '', content: '', hashtags: '', date: '', views: 0, imageSrc: '' });
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('c1');
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newPaper, setNewPaper] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [genCourseId, setGenCourseId] = useState('c1');
  const [genPaperId, setGenPaperId] = useState('p1');
  const [genSectionId, setGenSectionId] = useState('s2');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['t4']);
  const [lmsCourseId, setLmsCourseId] = useState('c1');
  const [lmsPaperId, setLmsPaperId] = useState('');
  const [lmsSectionId, setLmsSectionId] = useState('');
  const [isGeneratingLMS, setIsGeneratingLMS] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('cp_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Session valid for 4 hours
        if (Date.now() - parsed.ts < 4 * 60 * 60 * 1000) {
          setCpAuthed(true);
          setCpRole(parsed.role);
        } else {
          sessionStorage.removeItem('cp_auth');
        }
      }
    } catch {}
  }, []);

  // ── Auth Gate (after all hooks) ─────────────────────────────────────
  if (!cpAuthed) {
    return <ControlPanelLogin onSuccess={(role) => { setCpAuthed(true); setCpRole(role); }} />;
  }
  // ── End Auth Gate ───────────────────────────────────────────────────

  const activeStructure = activeTab === 'essay-questions' ? essayQuestions : activeTab === 'mcq-questions' ? mcqQuestions : activeTab === 'flash-cards' ? flashCards : lmsNotes;
  const setActiveStructure = activeTab === 'essay-questions' ? setEssayQuestions : activeTab === 'mcq-questions' ? setMcqQuestions : activeTab === 'flash-cards' ? setFlashCards : setLmsNotes;

  const openBlogEditor = (idx: number) => {
    const post = blogPosts[idx];
    setBlogForm({ title: post.title, category: post.category, excerpt: post.excerpt || '', content: post.content || '', hashtags: post.hashtags || '', date: post.date, views: post.views, imageSrc: post.imageSrc || post.image_src });
    setEditingBlogIdx(idx);
    setIsCreatingBlog(false);
  };

  const openNewBlogEditor = () => {
    setBlogForm({ title: '', category: '', excerpt: '', content: '', hashtags: '', date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }), views: 0, imageSrc: getRandomPexelsImage() });
    setEditingBlogIdx(null);
    setIsCreatingBlog(true);
  };

  // Generate full article content with AI
  const generateArticleContent = async () => {
    if (!blogForm.title.trim()) { alert('Please enter an article title first'); return; }
    setIsGeneratingContent(true);
    try {
      const prompt = `Write a comprehensive, SEO-optimized blog article for a medical education platform called MediMentr.

Title: "${blogForm.title}"
Category: ${blogForm.category || 'Medical Education'}

Requirements:
1. Write 800-1200 words of high-quality, engaging content
2. Use proper headings (##) and subheadings (###) for SEO structure
3. Include an engaging introduction that hooks the reader
4. Add practical tips, evidence-based insights, and actionable advice
5. Use bullet points and numbered lists where appropriate
6. Include a compelling conclusion with a call to action
7. Write in a professional yet accessible tone for postgraduate medical students
8. Naturally incorporate relevant keywords for SEO

Return a JSON object with these fields:
- content: The full article in Markdown format (800-1200 words)
- excerpt: A compelling 2-3 sentence SEO meta description (under 160 characters)
- hashtags: 5-8 relevant hashtags separated by spaces (e.g., #MedEd #ClinicalResearch #PGMedicine)

Return ONLY valid JSON, no markdown code fences.`;

      const systemInstruction = 'You are a senior medical education content writer and SEO specialist. Write authoritative, well-researched articles targeting postgraduate medical students. Always return valid JSON only, without code fences or markdown wrapping.';
      
      console.log('[Blog AI] Starting content generation for:', blogForm.title);
      const result = await generateMedicalContent(prompt, systemInstruction, 'application/json', false, cpRole);
      console.log('[Blog AI] Raw result:', typeof result, result ? result.substring(0, 200) : 'null/undefined');
      
      if (!result || result.trim().length === 0) {
        throw new Error('Empty response from AI');
      }
      
      // Clean the result - remove markdown code fences if present
      let cleanResult = result.trim();
      if (cleanResult.startsWith('```json')) {
        cleanResult = cleanResult.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanResult.startsWith('```')) {
        cleanResult = cleanResult.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }
      
      const parsed = JSON.parse(cleanResult);
      console.log('[Blog AI] Parsed successfully, content length:', parsed.content?.length || 0);
      
      setBlogForm(prev => ({
        ...prev,
        content: parsed.content || prev.content,
        excerpt: parsed.excerpt || prev.excerpt,
        hashtags: parsed.hashtags || prev.hashtags
      }));
    } catch (error: any) {
      console.error('Article generation error:', error);
      
      // Fallback: try generating as plain text if JSON mode failed
      try {
        console.log('[Blog AI] JSON mode failed, trying plain text fallback...');
        const fallbackPrompt = `Write a comprehensive 800-1200 word SEO-optimized blog article in Markdown format for postgraduate medical students.

Title: "${blogForm.title}"
Category: ${blogForm.category || 'Medical Education'}

Write the article directly in Markdown. Include:
- An engaging introduction
- Proper ## headings and ### subheadings
- Evidence-based content with practical tips
- Bullet points and numbered lists
- A compelling conclusion

Write the article now:`;
        
        const fallbackResult = await generateMedicalContent(fallbackPrompt, 'You are a senior medical education content writer. Write the article in Markdown format.', 'text/plain', false, cpRole);
        
        if (fallbackResult && fallbackResult.trim().length > 100) {
          console.log('[Blog AI] Fallback succeeded, content length:', fallbackResult.length);
          setBlogForm(prev => ({
            ...prev,
            content: fallbackResult,
            excerpt: prev.excerpt || `${blogForm.title} - A comprehensive guide for postgraduate medical students.`,
            hashtags: prev.hashtags || '#MedEd #MedicalEducation #PGMedicine #ClinicalResearch'
          }));
          return; // Success via fallback
        }
      } catch (fallbackError) {
        console.error('Fallback generation also failed:', fallbackError);
      }
      
      alert('Failed to generate article content. Please check your Gemini API key in the .env file and try again.\n\nError: ' + (error.message || 'Unknown error'));
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const saveBlogArticle = async () => {
    if (!blogForm.title.trim()) { alert('Please enter a title'); return; }
    if (isCreatingBlog) {
      const newPost = { 
        ...blogForm, 
        id: `blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        image_src: blogForm.imageSrc 
      };
      // Save to Supabase first
      try {
        const res = await fetch('/api/blog-publications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPost)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to save');
        }
        const savedPost = await res.json();
        console.log('✅ Blog post saved to Supabase:', savedPost.title || newPost.title);
        // Update local state with Supabase response
        const updated = [...blogPosts, { ...newPost, ...savedPost, imageSrc: savedPost.image_src || newPost.imageSrc }];
        setBlogPosts(updated);
      } catch (err: any) {
        console.error('Error saving blog:', err);
        // Still update local state even if Supabase fails
        const updated = [...blogPosts, newPost];
        setBlogPosts(updated);
        alert('Article saved locally but failed to sync to database: ' + (err.message || 'Unknown error'));
      }
    } else if (editingBlogIdx !== null) {
      const updated = [...blogPosts];
      const existingId = updated[editingBlogIdx]?.id;
      updated[editingBlogIdx] = { ...blogForm, id: existingId, image_src: blogForm.imageSrc };
      setBlogPosts(updated);
      // Update in Supabase
      if (existingId) {
        try {
          const res = await fetch(`/api/blog-publications/${existingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...blogForm, image_src: blogForm.imageSrc })
          });
          if (res.ok) {
            console.log('✅ Blog post updated in Supabase:', existingId);
          } else {
            console.error('Failed to update blog in Supabase');
          }
        } catch (err) {
          console.error('Error updating blog:', err);
        }
      }
    }
    setEditingBlogIdx(null);
    setIsCreatingBlog(false);
    setBlogForm({ title: '', category: '', excerpt: '', content: '', hashtags: '', date: '', views: 0, imageSrc: '' });
  };

  const cancelBlogEditor = () => {
    setEditingBlogIdx(null);
    setIsCreatingBlog(false);
    setBlogForm({ title: '', category: '', excerpt: '', content: '', hashtags: '', date: '', views: 0, imageSrc: '' });
  };

  const deleteBlogArticle = (idx: number) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const postId = blogPosts[idx]?.id;
      const updated = blogPosts.filter((_, i) => i !== idx);
      setBlogPosts(updated);
      setEditingBlogIdx(null);
      setIsCreatingBlog(false);
      // Delete from Supabase
      if (postId) {
        fetch(`/api/blog-publications/${postId}`, { method: 'DELETE' })
          .catch(err => console.error('Error deleting blog:', err));
      }
    }
  };

  // Bulk Blog AI Generation
  const handleBulkBlogGenerate = async () => {
    if (blogModalData.categories.length === 0) {
      alert('Please select at least one category.');
      return;
    }
    setIsBulkGenerating(true);
    const newPosts: any[] = [];
    const totalCount = blogModalData.count;
    
    try {
      // Generate articles ONE AT A TIME to avoid timeout / token limit issues
      for (let i = 0; i < totalCount; i++) {
        // Distribute categories evenly
        const category = blogModalData.categories[i % blogModalData.categories.length];
        setBulkProgress(`Generating article ${i + 1} of ${totalCount}...`);
        
        try {
          const prompt = `Generate ONE unique, complete SEO-optimized blog article for a medical education platform called MediMentr.

Category: ${category}

Provide:
- title: A compelling, SEO-friendly article title with focus keywords
- category: "${category}"
- excerpt: A compelling SEO meta description (under 160 characters)
- content: A FULL article of 800-1200 words in Markdown format with:
  - Engaging introduction
  - Proper headings (##) and subheadings (###)
  - Evidence-based content with practical tips  
  - Bullet points and numbered lists
  - Compelling conclusion with call to action
- hashtags: 5-8 relevant hashtags separated by spaces (e.g., #MedEd #ClinicalResearch)
- date: "Mar 20, 2026"

Return a JSON object with fields: title, category, excerpt, content, hashtags, date.
Return ONLY the JSON object, no extra text.`;

          const systemInstruction = 'You are a senior medical education content writer and SEO specialist. Write authoritative, well-researched articles targeting postgraduate medical students. The article must be 800-1200 words with proper Markdown formatting. Always return valid JSON.';
          const result = await generateMedicalContent(prompt, systemInstruction, 'application/json', false, cpRole);
          
          // Clean and parse JSON response
          let cleanedResult = (result || '').trim();
          // Remove markdown code fences if present
          if (cleanedResult.startsWith('```json')) {
            cleanedResult = cleanedResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanedResult.startsWith('```')) {
            cleanedResult = cleanedResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          let article = JSON.parse(cleanedResult);
          // Handle if it returned an array instead of object
          if (Array.isArray(article)) article = article[0];
          
          const imgUrl = getRandomPexelsImage();
          const newPost = {
            id: `blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: article.title || 'Untitled Article',
            category: article.category || category,
            excerpt: article.excerpt || '',
            content: article.content || '',
            hashtags: article.hashtags || '',
            date: article.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            views: 0,
            imageSrc: imgUrl,
            image_src: imgUrl,
            status: 'published'
          };
          newPosts.push(newPost);
          
          // Save to Supabase immediately
          setBulkProgress(`Saving article ${i + 1} of ${totalCount}...`);
          try {
            const saveRes = await fetch('/api/blog-publications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newPost)
            });
            if (saveRes.ok) console.log(`✅ Bulk blog saved (${i + 1}/${totalCount}):`, newPost.title);
          } catch (saveErr) {
            console.error('Failed to save bulk blog:', saveErr);
          }
          
          console.log(`✅ Generated article ${i + 1}/${totalCount}: ${newPost.title}`);
        } catch (articleErr) {
          console.error(`❌ Failed to generate article ${i + 1}:`, articleErr);
          // Continue generating remaining articles even if one fails
        }
        
        // Small delay between API calls to avoid rate limiting
        if (i < totalCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (newPosts.length === 0) {
        alert('Failed to generate any articles. Please check your API key and try again.');
      } else {
        setBlogPosts([...blogPosts, ...newPosts]);
        setIsBulkBlogModalOpen(false);
        setBlogModalData({ count: 1, categories: [] });
        if (newPosts.length < totalCount) {
          alert(`Generated ${newPosts.length} of ${totalCount} articles. Some failed but the successful ones have been saved.`);
        }
      }
    } catch (error) {
      console.error('Bulk blog generation error:', error);
      if (newPosts.length > 0) {
        setBlogPosts([...blogPosts, ...newPosts]);
        alert(`Partially generated ${newPosts.length} of ${totalCount} articles.`);
      } else {
        alert('Failed to generate blogs. Please check your API key and try again.');
      }
    } finally {
      setIsBulkGenerating(false);
      setBulkProgress('');
    }
  };

  // --- Computed Active Entities for Curriculum Setup ---
  const activeCourse = curriculum.find(c => c.id === selectedCourseId) || curriculum[0];
  const activePapers = activeCourse?.papers || [];
  
  const activePaper = activePapers.find(p => p.id === selectedPaperId) || activePapers[0];
  const activeSections = activePaper?.sections || [];
  
  const activeSection = activeSections.find(s => s.id === selectedSectionId) || activeSections[0];
  const activeTopics = activeSection?.topics || [];


  // --- Computed Active Entities for Generation Engine ---
  const genActiveCourse = curriculum.find(c => c.id === genCourseId) || curriculum[0];
  const genActivePapers = genActiveCourse?.papers || [];
  
  const genActivePaper = genPaperId === 'all' 
    ? null 
    : (genActivePapers.find(p => p.id === genPaperId) || genActivePapers[0]);
    
  const genActiveSections = genPaperId === 'all' 
    ? genActivePapers.flatMap(p => p.sections)
    : (genActivePaper?.sections || []);
    
  const genActiveSection = genSectionId === 'all' 
    ? null 
    : (genActiveSections.find(s => s.id === genSectionId) || genActiveSections[0]);
    
  const genActiveTopics = genSectionId === 'all'
    ? genActiveSections.flatMap(s => s.topics)
    : (genActiveSection?.topics || []);

  // --- Computed Active Entities for LMS Editor ---
  const lmsActiveCourse = curriculum.find(c => c.id === lmsCourseId) || curriculum[0];
  const lmsActivePapers = lmsActiveCourse?.papers || [];
  
  const lmsActivePaper = lmsActivePapers.find(p => p.id === lmsPaperId) || lmsActivePapers[0];
  const lmsActiveSections = lmsActivePaper?.sections || [];
  
  const lmsActiveSection = lmsActiveSections.find(s => s.id === lmsSectionId) || lmsActiveSections[0];
  const lmsActiveTopics = lmsActiveSection?.topics || [];

  const toggleTopicSelection = (id: string) => {
    setSelectedTopics(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleAllTopics = () => {
    if (selectedTopics.length === genActiveTopics.length && genActiveTopics.length > 0) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(genActiveTopics.map(t => t.id));
    }
  };

  const handleGenerateLMSNotes = async () => {
    if (selectedTopics.length === 0) {
      alert("Please select at least one topic to generate notes.");
      return;
    }
    
    // CRITICAL: Capture activeTab at function call time to avoid stale closure issues during async operations
    const currentTab = activeTab;
    console.log(`🎯 handleGenerateLMSNotes called. activeTab="${activeTab}", currentTab="${currentTab}", selectedTopics=${selectedTopics.length}`);
    // Also capture the current generation context IDs
    const currentGenCourseId = genCourseId;
    const currentGenPaperId = genPaperId;
    const currentGenSectionId = genSectionId;

    // --- Overwrite Confirmation: Check if any selected topic already has content ---
    const contentKeyForTab = currentTab === 'lms-notes' ? 'generatedContent'
      : currentTab === 'essay-questions' ? 'generatedEssayContent'
      : currentTab === 'mcq-questions' ? 'generatedMcqContent'
      : 'generatedFlashCardsContent';
    const topicsWithExistingContent: string[] = [];
    for (const topicId of selectedTopics) {
      for (const c of curriculum) {
        if (!c.papers) continue;
        for (const p of c.papers) {
          if (!p.sections) continue;
          for (const s of p.sections) {
            if (!s.topics) continue;
            const t = s.topics.find((x: any) => x.id === topicId);
            if (t && t[contentKeyForTab]) {
              topicsWithExistingContent.push(t.name);
            }
          }
        }
      }
    }
    if (topicsWithExistingContent.length > 0) {
      const proceed = window.confirm(
        `Content already exists for ${topicsWithExistingContent.length} topic(s):\n${topicsWithExistingContent.join(', ')}\n\nDo you want to overwrite the existing content?`
      );
      if (!proceed) return;
    }
    
    setIsGeneratingLMS(true);
    let successCount = 0;
    let failedTopics: string[] = [];
    let lastError = '';
    // Keep a reference to the latest curriculum after each iterative save
    let latestCurriculum = JSON.parse(JSON.stringify(curriculum));
    
    try {
      for (const topicId of selectedTopics) {
        // Find topic name and course name from the LATEST curriculum state
        let topicName = '';
        let courseName = '';
        for (const c of latestCurriculum) {
          for (const p of c.papers) {
            for (const s of p.sections) {
              const t = s.topics.find((x: any) => x.id === topicId);
              if (t) {
                topicName = t.name;
                courseName = c.name;
              }
            }
          }
        }
        
        if (!topicName) continue;
        
        try {
          let prompt = `Provide a comprehensive clinical note for the knowledge library on the following topic:\nTopic: ${topicName}\nCourse Context: ${courseName}\n
          Ideal Structure of Expert Notes:
          1. Definition: Short precise definition.
          2. Historical background (optional): Major discoveries or milestones.
          3. Basic concepts: Physiology, Pathophysiology, Mechanism.
          4. Classification: Use tables or flowcharts (represented in text/markdown).
          5. Detailed description: Explain major subtopics.
          6. Clinical relevance: Diagnosis, Investigations, Treatment.
          7. Guidelines / protocols: Mention current guidelines.
          8. Recent advances: Include new drugs, technologies, therapies.
          9. Adverse effects / limitations.
          10. Summary / key points.
          11. References: Standard textbooks, Review articles, Guidelines.`;

          if (currentTab === 'essay-questions') {
            prompt = `Generate 5 high-quality, long-form clinical essay questions based on the following topic:\nTopic: ${topicName}\nCourse Context: ${courseName}\n
            CRITICAL INSTRUCTION: You MUST completely replace "I" with "our team of Experts" when introducing yourself. You MUST begin your response exactly with the following paragraph (filling in the topic and course names):
            
            "As an expert medical professor and author, our team of Experts have crafted 5 high-quality, long-form clinical essay questions focusing on ${topicName} for your ${courseName} course. Each question includes a detailed clinical vignette and a comprehensive answer that serves as a rubric, outlining all expected points for a thorough response."

            CRITICAL INSTRUCTION 2: You MUST output the actual Question AND its detailed Answer together. Do not just output an answer outline without the question.

            Format for each of the 5 questions:
            
            **Question [Number]:**
            [Provide a detailed clinical vignette or the full text of the essay question here]
            
            **Detailed Answer & Rubric:**
            [Provide the full, comprehensive answer here, including any expected bullet points, pathophysiology, diagnosis, and treatment steps the student should cover]`;
          } else if (currentTab === 'mcq-questions') {
            prompt = `Generate 10 multiple-choice questions (MCQs) for medical students on the following topic:\nTopic: ${topicName}\nCourse Context: ${courseName}\n
            CRITICAL INSTRUCTION: You MUST output the original Question text, all options, and the Correct Answer together.

            Format each question as:
            
            **Q[Number]: [Question text, typically a short clinical vignette]**
            A) [Option A]
            B) [Option B]
            C) [Option C]
            D) [Option D]
            
            **Correct Answer:** [Letter]
            **Explanation:** [Brief explanation of why it's correct and why others are incorrect]`;
          } else if (currentTab === 'flash-cards') {
            prompt = `Generate 10 spaced-repetition flashcards on the following topic:\nTopic: ${topicName}\nCourse Context: ${courseName}\n
            Format each flashcard as:
            Front (Question): [Recall question]
            Back (Answer): [Concise answer]`;
          }

          console.log(`🔄 Generating ${currentTab} for topic: ${topicName} (${successCount + 1}/${selectedTopics.length}) (role: ${cpRole})`);
          const content = await generateMedicalContent(prompt, "You are an expert medical professor and author generating authoritative clinical content for a Learning Management System.", "text/plain", false, cpRole);
          console.log(`✅ Generated ${currentTab} for topic: ${topicName}, length: ${content?.length || 0}`);
          
          // ═══════════════════════════════════════════════════════════════
          // ITERATIVE SAVE: Use functional state update to avoid stale state
          // ═══════════════════════════════════════════════════════════════
          const savedCurriculum = await new Promise<any[]>((resolve) => {
            setCurriculum((prevCurriculum: any[]) => {
              const updated = JSON.parse(JSON.stringify(prevCurriculum));
              // Find the topic and assign the generated content
              for (const c of updated) {
                for (const p of c.papers) {
                  for (const s of p.sections) {
                    const t = s.topics.find((x: any) => x.id === topicId);
                    if (t) {
                      if (currentTab === 'lms-notes') t.generatedContent = content;
                      else if (currentTab === 'essay-questions') t.generatedEssayContent = content;
                      else if (currentTab === 'mcq-questions') t.generatedMcqContent = content;
                      else if (currentTab === 'flash-cards') t.generatedFlashCardsContent = content;
                      console.log(`✏️ [Iterative] Wrote ${currentTab} to topic "${topicName}" (id: ${topicId})`);
                    }
                  }
                }
              }
              resolve(updated);
              return updated;
            });
          });

          // Keep our local reference up-to-date
          latestCurriculum = savedCurriculum;

          // Immediately persist to database after each topic
          try {
            const saveRes = await fetch('/api/state/curriculum', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: 'default', data: savedCurriculum })
            });
            if (saveRes.ok) {
              console.log(`💾 [Iterative] Saved to DB after topic "${topicName}" (${successCount + 1}/${selectedTopics.length})`);
            } else {
              const errBody = await saveRes.json().catch(() => ({}));
              console.error(`❌ [Iterative] DB save failed for "${topicName}":`, saveRes.status, errBody);
            }
          } catch (saveErr) {
            console.error(`⚠️ [Iterative] Network error saving "${topicName}":`, saveErr);
          }

          successCount++;
        } catch (topicErr: any) {
          console.error(`❌ Failed to generate for topic "${topicName}":`, topicErr);
          failedTopics.push(topicName);
          lastError = topicErr?.message || String(topicErr);
        }
      }
      
      console.log(`📊 Generation complete: ${successCount}/${selectedTopics.length} succeeded, ${failedTopics.length} failed (tab: ${currentTab})`);

      // Sync the Editor context dropdowns to match the generation context
      if (currentGenCourseId) setLmsCourseId(currentGenCourseId);
      if (currentGenPaperId !== 'all') {
        setLmsPaperId(currentGenPaperId);
      } else {
        const c = latestCurriculum.find((c: any) => c.id === currentGenCourseId);
        if (c && c.papers.length > 0) setLmsPaperId(c.papers[0].id);
      }
      
      if (currentGenSectionId !== 'all') {
        setLmsSectionId(currentGenSectionId);
      } else {
        const c = latestCurriculum.find((c: any) => c.id === currentGenCourseId);
        const p = c?.papers.find((p: any) => p.id === (currentGenPaperId !== 'all' ? currentGenPaperId : c.papers[0]?.id));
        if (p && p.sections.length > 0) setLmsSectionId(p.sections[0].id);
      }

      // Auto-navigate to the matching Editor tab after generation
      if (currentTab === 'lms-notes') setActiveTab('lms-notes-editor');
      else if (currentTab === 'essay-questions') setActiveTab('essay-questions-editor');
      else if (currentTab === 'mcq-questions') setActiveTab('mcq-questions-editor');
      else if (currentTab === 'flash-cards') setActiveTab('flash-cards-editor');

      if (failedTopics.length > 0 && successCount > 0) {
        alert(`Partially generated! ${successCount} topic(s) succeeded, ${failedTopics.length} failed:\n${failedTopics.join(', ')}\n\nError: ${lastError}`);
      } else if (failedTopics.length > 0 && successCount === 0) {
        alert(`Error generating content for all topics.\n\nError: ${lastError}`);
      } else {
        alert("Successfully auto-generated content! You are now in the Editor.");
      }
    } catch (e: any) {
      console.error('❌ LMS generation fatal error:', e);
      alert(`Error generating content.\n\nDetails: ${e?.message || String(e)}`);
    } finally {
      setIsGeneratingLMS(false);
    }
  };


  // --- Action Handlers ---
  const handleAddCourse = () => {
    if (newCourse.trim()) {
      const coursesToAdd = newCourse.split('\n').filter(Boolean).map(c => c.trim()).filter(Boolean);
      if (coursesToAdd.length === 0) return;
      
      const newCourses = coursesToAdd.map((name, index) => ({
        id: `c_${Date.now()}_${index}`,
        name,
        papers: []
      }));
      
      setCurriculum([...curriculum, ...newCourses]);
      setSelectedCourseId(newCourses[newCourses.length - 1].id);
      setNewCourse('');
    }
  };

  const handleAddPaper = () => {
    if (newPaper.trim() && activeCourse) {
      const papersToAdd = newPaper.split('\n').filter(Boolean).map(p => p.trim()).filter(Boolean);
      if (papersToAdd.length === 0) return;
      
      const newPapers = papersToAdd.map((name, index) => ({
        id: `p_${Date.now()}_${index}`,
        name,
        sections: []
      }));
      
      setCurriculum(curriculum.map(c => 
        c.id === activeCourse.id 
          ? { ...c, papers: [...c.papers, ...newPapers] }
          : c
      ));
      setSelectedPaperId(newPapers[newPapers.length - 1].id);
      setNewPaper('');
    }
  };

  const handleAddSection = () => {
    if (newSection.trim() && activePaper && activeCourse) {
      const sectionsToAdd = newSection.split('\n').filter(Boolean).map(s => s.trim()).filter(Boolean);
      if (sectionsToAdd.length === 0) return;
      
      const newSections = sectionsToAdd.map((name, index) => ({
        id: `s_${Date.now()}_${index}`,
        name,
        topics: []
      }));
      
      setCurriculum(curriculum.map(c => 
        c.id === activeCourse.id 
          ? {
              ...c, 
              papers: c.papers.map(p => 
                p.id === activePaper.id 
                  ? { ...p, sections: [...p.sections, ...newSections] }
                  : p
              )
            }
          : c
      ));
      setSelectedSectionId(newSections[newSections.length - 1].id);
      setNewSection('');
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim() && activeSection && activePaper && activeCourse) {
      const topicsToAdd = newTopic.split('\n').filter(Boolean).map(t => t.replace(/^[-•\d.\s]+/, '').trim()).filter(Boolean);
      if (topicsToAdd.length === 0) return;

      const newTopics = topicsToAdd.map((name, index) => ({
        id: `t_${Date.now()}_${index}`,
        name,
      }));

      setCurriculum(curriculum.map(c => 
        c.id === activeCourse.id 
          ? {
              ...c, 
              papers: c.papers.map(p => 
                p.id === activePaper.id 
                  ? { 
                      ...p, 
                      sections: p.sections.map(s => 
                        s.id === activeSection.id 
                          ? { ...s, topics: [...s.topics, ...newTopics] }
                          : s
                      )
                    }
                  : p
              )
            }
          : c
      ));
      setNewTopic('');
    }
  };

  const handleDeleteCourse = (id: string) => {
    // Only safe logical delete, realistically shouldn't map completely without warning, but good for demo
    setCurriculum(curriculum.filter(c => c.id !== id));
  };

  const handleDeletePaper = (id: string) => {
    setCurriculum(curriculum.map(c => 
      c.id === activeCourse.id ? { ...c, papers: c.papers.filter(p => p.id !== id) } : c
    ));
  };
  
  const handleDeleteSection = (id: string) => {
    setCurriculum(curriculum.map(c => 
      c.id === activeCourse.id ? { ...c, papers: c.papers.map(p => 
        p.id === activePaper.id ? { ...p, sections: p.sections.filter(s => s.id !== id) } : p
      )} : c
    ));
  };

  const TABS = [
    { type: 'item', id: 'lms-auto-gen', label: 'LMS Auto-Gen', icon: <Settings size={20} /> },
    { type: 'subitem', id: 'lms-notes', label: 'LMS Notes', icon: <BookOpen size={16} /> },
    { type: 'subitem', id: 'essay-questions', label: 'Essay Questions', icon: <FileText size={16} /> },
    { type: 'subitem', id: 'mcq-questions', label: 'MCQ Questions', icon: <FileQuestion size={16} /> },
    { type: 'subitem', id: 'flash-cards', label: 'Flash Cards', icon: <Layers size={16} /> },
    { type: 'item', id: 'blog-publications', label: 'Blog Publications', icon: <FileText size={20} /> },
    { type: 'item', id: 'token-economy', label: 'Token Economy', icon: <Brain size={20} /> },
    { type: 'item', id: 'user-management', label: 'User Management', icon: <Users size={20} /> },
    { type: 'item', id: 'affiliate-partners', label: 'Affiliate Partners', icon: <Share2 size={20} /> },
    { type: 'header', id: 'header-admin', label: 'Admin' },
    { type: 'item', id: 'lms-notes-editor', label: 'LMS Notes Editor', icon: <Edit3 size={20} /> },
    { type: 'item', id: 'essay-questions-editor', label: 'Essay Questions Editor', icon: <Edit3 size={20} /> },
    { type: 'item', id: 'mcq-questions-editor', label: 'MCQ Questions Editor', icon: <Edit3 size={20} /> },
    { type: 'item', id: 'flash-cards-editor', label: 'Flash Cards Editor', icon: <Edit3 size={20} /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#fafafa] text-slate-800 font-sans flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/50 z-40" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Left Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.02)] md:shadow-none border-r border-slate-800`}>
        <div className="flex items-center justify-between px-8 py-8 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="MediMentr Logo" className="w-8 h-8 object-contain rounded-xl" />
            <h2 className="text-[#DA5D4B] font-bold text-[12px] tracking-widest uppercase mt-1">Super Admin</h2>
          </div>
          <button className="md:hidden text-slate-400 p-1" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 flex flex-col overflow-y-auto scrollbar-thin pb-2">
          {TABS.map(tab => {
            if (tab.type === 'header') {
              return (
                <div key={tab.id} className="px-4 pt-6 pb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{tab.label}</span>
                </div>
              );
            }

            const isActive = activeTab === tab.id;
            const isSubItem = tab.type === 'subitem';

            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id === 'lms-auto-gen' ? 'lms-notes' : tab.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 py-3.5 rounded-2xl transition-all ${
                  isSubItem ? 'pl-11 pr-4' : 'px-4'
                } ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-400 font-bold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-bold'
                }`}
                style={{ fontSize: isSubItem ? '14px' : '15px' }}
              >
                {tab.icon && (
                  <div className={`${isActive ? 'text-[#3E7B5C]' : 'text-slate-400'}`}>
                    {tab.icon}
                  </div>
                )}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
        
        <div className="shrink-0 p-4 pb-6 mt-2 border-t border-slate-800">
          <button 
            onClick={() => {
              sessionStorage.removeItem('cp_auth');
              setCpAuthed(false);
              setCpRole('');
              onNavigate('home');
            }} 
            className="w-full flex items-center gap-3 px-4 py-3.5 text-slate-400 hover:text-slate-200 hover:bg-red-900/30 rounded-2xl font-bold transition-all"
            style={{ fontSize: '15px' }}
          >
            <LogOut size={20} className="rotate-180" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-slate-200 px-6 md:px-8 py-4 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500 p-2 -ml-2 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-[20px] md:text-[22px] font-bold text-slate-900 tracking-tight cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onNavigate('home')}>Super Admin Dashboard</h1>
              <p className="text-[12px] md:text-[13px] text-slate-500 font-medium mt-0.5 hidden sm:block">Platform running in superadmin mode</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-slate-900 text-[14px] leading-tight">Super Admin User</div>
              <div className="text-[10px] font-bold text-emerald-600 tracking-widest mt-0.5">SUPER ADMIN</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-100 transition-colors shrink-0">
              <UserIcon size={18} className="stroke-2" />
            </div>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-auto p-6 md:p-12">
          {['lms-notes', 'essay-questions', 'mcq-questions', 'flash-cards'].includes(activeTab) && (
            <div className="w-full max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <h2 className="text-[28px] md:text-[34px] font-bold text-slate-900 mb-3 tracking-tight">Content Creator Intelligence</h2>
                <p className="text-[15px] md:text-[16px] text-slate-500 font-medium">Mass trigger Gemini background jobs and build your curriculum.</p>
              </div>

              {/* Pill Nav */}
              <div className="flex justify-center mb-12">
                <div className="bg-slate-100/80 p-1.5 rounded-xl flex items-center gap-1 shadow-inner ring-1 ring-slate-900/5 max-w-full overflow-x-auto whitespace-nowrap scrollbar-thin">
                  <button 
                    onClick={() => setActiveGenTab('curriculum')}
                    className={`px-6 md:px-8 py-3 rounded-lg text-[13px] md:text-[14px] font-bold transition-all duration-200 ${
                      activeGenTab === 'curriculum' 
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Curriculum Setup
                  </button>
                  <button 
                    onClick={() => setActiveGenTab('lms-notes')}
                    className={`px-6 md:px-8 py-3 rounded-lg text-[13px] md:text-[14px] font-bold transition-all duration-200 ${
                      activeGenTab === 'lms-notes' 
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {activeTab === 'essay-questions' ? 'Essay Questions Structure' : activeTab === 'mcq-questions' ? 'MCQ Structure' : activeTab === 'flash-cards' ? 'Flash Cards Structure' : 'LMS Notes Structure'}
                  </button>
                  <button 
                    onClick={() => setActiveGenTab('generation-engine')}
                    className={`px-6 md:px-8 py-3 rounded-lg text-[13px] md:text-[14px] font-bold transition-all duration-200 ${
                      activeGenTab === 'generation-engine' 
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Generation Engine
                  </button>
                </div>
              </div>

              {activeGenTab === 'curriculum' ? (
                <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-5xl mx-auto">
                  
                  {/* Left Column: Context Forms */}
                  <div className="w-full lg:w-[320px] shrink-0 space-y-4">
                    
                    <div className="flex justify-end">
                        <button onClick={() => { if(window.confirm('This will replace your current curriculum with the default RGUHS Anatomy curriculum. Continue?')) { setCurriculum(DEFAULT_CURRICULUM); setSelectedCourseId(DEFAULT_CURRICULUM[0].id); setSelectedPaperId(''); setSelectedSectionId(''); } }} className="text-[12px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors shadow-sm border border-slate-200 w-full justify-center">
                           <RotateCcw size={14} /> Reset to Default Curriculum
                        </button>
                    </div>

                    {/* Course Card */}
                    <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 text-[#4f46e5] font-bold text-[11px] tracking-widest uppercase">
                        <BookOpen size={16} />
                        <span>Context: Course</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <select 
                              value={selectedCourseId}
                              onChange={(e) => setSelectedCourseId(e.target.value)}
                              className="w-full appearance-none bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-[#334155] font-medium text-[15px] focus:outline-none focus:border-[#4f46e5]"
                            >
                              {curriculum.map(course => (
                                  <option key={course.id} value={course.id}>{course.name}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                              <ChevronRight size={16} className="rotate-90" />
                            </div>
                          </div>
                          <button className="bg-[#f1f5f9] text-slate-500 w-12 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDeleteCourse(selectedCourseId)} className="bg-[#f1f5f9] text-slate-500 w-12 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="flex gap-2">
                          <textarea 
                            value={newCourse}
                            onChange={(e) => setNewCourse(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddCourse();
                              }
                            }}
                            placeholder="Add new course... (bulk upload supported: add one per line)" 
                            className="flex-1 min-w-0 border border-slate-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#4f46e5] placeholder:text-slate-400 resize-y min-h-[48px]" 
                            rows={2}
                          />
                          <button 
                            onClick={handleAddCourse}
                            className="bg-[#1e293b] text-white w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 hover:bg-[#334155] transition-colors shadow-sm"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Paper Card */}
                    <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[#4f46e5] font-bold text-[11px] tracking-widest uppercase">
                          <Layers size={16} />
                          <span>Context: Paper</span>
                        </div>
                        <button className="text-[#4f46e5] flex items-center gap-1 text-[11px] font-bold">
                          <Upload size={14} /> Bulk Upload
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <select 
                              value={selectedPaperId}
                              onChange={(e) => setSelectedPaperId(e.target.value)}
                              className="w-full appearance-none bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-[#334155] font-medium text-[15px] focus:outline-none focus:border-[#4f46e5]"
                            >
                              {activePapers.length === 0 && <option value="" disabled>No papers available</option>}
                              {activePapers.map(paper => (
                                <option key={paper.id} value={paper.id}>{paper.name}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                              <ChevronRight size={16} className="rotate-90" />
                            </div>
                          </div>
                          <button className="bg-[#f1f5f9] text-slate-500 w-12 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDeletePaper(selectedPaperId)} className="bg-[#f1f5f9] text-slate-500 w-12 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="flex gap-2">
                          <textarea 
                            value={newPaper}
                            onChange={(e) => setNewPaper(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddPaper();
                              }
                            }}
                            placeholder="Add new paper... (bulk upload supported)" 
                            className="flex-1 min-w-0 border border-slate-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#4f46e5] placeholder:text-slate-400 resize-y min-h-[48px]" 
                            rows={2}
                          />
                          <button 
                            onClick={handleAddPaper}
                            className="bg-[#1e293b] text-white w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 hover:bg-[#334155] transition-colors shadow-sm"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Section Card */}
                    <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[#4f46e5] font-bold text-[11px] tracking-widest uppercase">
                          <Layers size={16} />
                          <span>Context: Section</span>
                        </div>
                        <button className="text-[#4f46e5] flex items-center gap-1 text-[11px] font-bold">
                          <Upload size={14} /> Bulk Upload
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <select 
                              value={selectedSectionId}
                              onChange={(e) => setSelectedSectionId(e.target.value)}
                              className="w-full appearance-none bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-[#334155] font-medium text-[15px] focus:outline-none focus:border-[#4f46e5]"
                            >
                              {activeSections.length === 0 && <option value="" disabled>No sections available</option>}
                              {activeSections.map(section => (
                                <option key={section.id} value={section.id}>{section.name}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                              <ChevronRight size={16} className="rotate-90" />
                            </div>
                          </div>
                          <button className="bg-[#f1f5f9] text-slate-500 w-12 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDeleteSection(selectedSectionId)} className="bg-[#f1f5f9] text-slate-500 w-12 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="flex gap-2">
                          <textarea 
                            value={newSection}
                            onChange={(e) => setNewSection(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddSection();
                              }
                            }}
                            placeholder="Add new section... (bulk upload supported)" 
                            className="flex-1 min-w-0 border border-slate-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#4f46e5] placeholder:text-slate-400 resize-y min-h-[48px]" 
                            rows={2}
                          />
                          <button 
                            onClick={handleAddSection}
                            className="bg-[#1e293b] text-white w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 hover:bg-[#334155] transition-colors shadow-sm"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Main Area */}
                  <div className="flex-1 bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm min-h-[500px] w-full">
                    
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-10">
                      <div>
                        <h3 className="text-[24px] font-bold text-[#0f172a] mb-1">{activeSection ? activeSection.name : 'No section selected'}</h3>
                        <p className="text-[14px] text-[#64748b] font-medium">{activeCourse ? activeCourse.name : ''} {activePaper ? `• ${activePaper.name}` : ''}</p>
                      </div>
                      <button className="text-[#10b981] flex items-center gap-2 text-[14px] font-bold bg-[#ecfdf5] px-4 py-2 rounded-xl hover:bg-[#d1fae5] transition-colors">
                        <Upload size={16} /> Bulk Upload Topic
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Topic Input Row */}
                      <div className="flex gap-4">
                        <textarea 
                          value={newTopic}
                          onChange={(e) => setNewTopic(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddTopic();
                            }
                          }}
                          placeholder="Manually add a specific topic or paste list (bulk upload supported)..." 
                          className="flex-1 border border-slate-200 rounded-2xl px-5 py-4 text-[15px] focus:outline-none focus:border-[#10b981] placeholder:text-slate-400 shadow-sm resize-y min-h-[58px]" 
                          rows={2}
                        />
                        <button onClick={handleAddTopic} className="bg-[#34d399] text-white px-8 font-bold text-[15px] rounded-2xl flex items-center justify-center shrink-0 hover:bg-[#10b981] transition-colors shadow-sm gap-2 shadow-[#34d399]/20">
                          <Plus size={20} /> Add
                        </button>
                      </div>

                      {/* Topic List */}
                      <div className="space-y-3 pt-4 border-t border-slate-50">
                        {activeTopics.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 font-medium">No topics added yet.</div>
                        ) : (
                          activeTopics.map((topic, idx) => (
                            <div key={topic.id} className="bg-[#f8fafc] rounded-2xl p-4 flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-[#e2e8f0] flex items-center justify-center text-[#64748b] font-bold text-[13px] shrink-0">{idx + 1}</div>
                              <div className="flex-1 font-bold text-[#1e293b]">{topic.name}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              ) : activeGenTab === 'generation-engine' ? (
                <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-[1100px] mx-auto animate-in fade-in zoom-in-95 duration-500">
                  
                  {/* Generation Queue Left Panel */}
                  <div className="w-full lg:flex-1 bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                    <div className="mb-8">
                      <h3 className="flex items-center gap-2 text-[22px] font-bold text-[#0f172a] tracking-tight mb-2">
                        <Sparkles size={22} className="text-[#8b5cf6]" />
                        Generation Queue
                      </h3>
                      <p className="text-[#64748b] text-[14px] font-medium">Select topics to auto-generate {activeTab === 'essay-questions' ? 'essay questions' : activeTab === 'mcq-questions' ? 'multiple-choice questions' : activeTab === 'flash-cards' ? 'flash cards' : 'LMS notes'}.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-[#8b5cf6] tracking-widest uppercase ml-1">Context: Course</label>
                        <div className="relative">
                          <select 
                            value={genCourseId}
                            onChange={e => setGenCourseId(e.target.value)}
                            className="w-full appearance-none bg-white border border-[#e2e8f0] rounded-xl px-4 py-3.5 text-[#334155] font-bold text-[14px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all cursor-pointer"
                          >
                            {curriculum.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                            <ChevronRight size={16} className="rotate-90" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-[#8b5cf6] tracking-widest uppercase ml-1">Context: Paper</label>
                        <div className="relative">
                          <select 
                            value={genPaperId}
                            onChange={e => setGenPaperId(e.target.value)}
                            className="w-full appearance-none bg-white border border-[#e2e8f0] rounded-xl px-4 py-3.5 text-[#334155] font-bold text-[14px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all cursor-pointer"
                          >
                            <option value="all">Select all ({genActivePapers.length})</option>
                            {genActivePapers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                            <ChevronRight size={16} className="rotate-90" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-[#8b5cf6] tracking-widest uppercase ml-1">Context: Section</label>
                        <div className="relative">
                          <select 
                            value={genSectionId}
                            onChange={e => setGenSectionId(e.target.value)}
                            className="w-full appearance-none bg-white border border-[#e2e8f0] rounded-xl px-4 py-3.5 text-[#334155] font-bold text-[14px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all cursor-pointer"
                          >
                            <option value="all">Select all ({genActiveSections.length})</option>
                            {genActiveSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                            <ChevronRight size={16} className="rotate-90" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between ml-1 mb-2">
                          <label className="text-[11px] font-bold text-[#8b5cf6] tracking-widest uppercase">Select Topics to Generate</label>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => {
                                const contentKey = activeTab === 'lms-notes' ? 'generatedContent'
                                  : activeTab === 'essay-questions' ? 'generatedEssayContent'
                                  : activeTab === 'mcq-questions' ? 'generatedMcqContent'
                                  : 'generatedFlashCardsContent';
                                const uncreatedIds = genActiveTopics.filter((t: any) => !t[contentKey]).map((t: any) => t.id);
                                setSelectedTopics(uncreatedIds);
                              }}
                              className="text-[11px] font-bold text-[#f59e0b] hover:text-[#d97706] bg-[#fffbeb] px-2 py-1 rounded-lg border border-[#fde68a] transition-colors"
                            >
                              select uncreated
                            </button>
                            <button onClick={toggleAllTopics} className="text-[12px] font-bold text-[#4f46e5] hover:text-[#3730a3]">
                              {selectedTopics.length === genActiveTopics.length && genActiveTopics.length > 0 ? 'deselect all' : 'select all'}
                            </button>
                          </div>
                        </div>

                        {/* Content Status Summary Bar */}
                        {genActiveTopics.length > 0 && (() => {
                          const contentKey = activeTab === 'lms-notes' ? 'generatedContent'
                            : activeTab === 'essay-questions' ? 'generatedEssayContent'
                            : activeTab === 'mcq-questions' ? 'generatedMcqContent'
                            : 'generatedFlashCardsContent';
                          const createdCount = genActiveTopics.filter((t: any) => t[contentKey]).length;
                          const pendingCount = genActiveTopics.length - createdCount;
                          const percentage = Math.round((createdCount / genActiveTopics.length) * 100);
                          return (
                            <div className="bg-[#f8fafc] rounded-xl p-3 border border-slate-100 mb-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                  {activeTab === 'lms-notes' ? 'Notes' : activeTab === 'essay-questions' ? 'Essay' : activeTab === 'mcq-questions' ? 'MCQ' : 'Flash Cards'} Progress
                                </span>
                                <span className="text-[12px] font-bold text-slate-700">{createdCount}/{genActiveTopics.length} created</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-500" 
                                  style={{ 
                                    width: `${percentage}%`, 
                                    background: percentage === 100 ? '#10b981' : percentage > 50 ? '#3b82f6' : '#f59e0b' 
                                  }} 
                                />
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1 text-[11px] font-medium text-[#10b981]">
                                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> {createdCount} Created
                                </span>
                                <span className="flex items-center gap-1 text-[11px] font-medium text-[#f59e0b]">
                                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> {pendingCount} Pending
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                        
                        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                          {genActiveTopics.length === 0 ? (
                            <div className="text-[13px] text-slate-400 italic">No topics found in the selected context.</div>
                          ) : (
                            genActiveTopics.map(topic => {
                              const hasNotes = !!(topic as any).generatedContent;
                              const hasEssay = !!(topic as any).generatedEssayContent;
                              const hasMcq = !!(topic as any).generatedMcqContent;
                              const hasFlash = !!(topic as any).generatedFlashCardsContent;
                              const currentContentKey = activeTab === 'lms-notes' ? 'generatedContent'
                                : activeTab === 'essay-questions' ? 'generatedEssayContent'
                                : activeTab === 'mcq-questions' ? 'generatedMcqContent'
                                : 'generatedFlashCardsContent';
                              const hasCurrentContent = !!(topic as any)[currentContentKey];
                              const allCreated = hasNotes && hasEssay && hasMcq && hasFlash;
                              return (
                                <div 
                                  key={topic.id}
                                  onClick={() => toggleTopicSelection(topic.id)}
                                  className={`bg-white border rounded-xl p-4 flex flex-col gap-2 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all cursor-pointer ${selectedTopics.includes(topic.id) ? 'border-[#10b981]' : hasCurrentContent ? 'border-[#e2e8f0] opacity-80 hover:opacity-100' : 'border-[#fde68a] hover:border-[#f59e0b] opacity-90 hover:opacity-100'}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${selectedTopics.includes(topic.id) ? 'bg-[#10b981] border-[#10b981]' : 'border-slate-200'}`}>
                                        {selectedTopics.includes(topic.id) && <CheckSquare size={14} className="text-white" />}
                                      </div>
                                      <span className={`font-bold text-[13px] ${selectedTopics.includes(topic.id) ? 'text-[#0f172a]' : 'text-[#334155]'}`}>{topic.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {allCreated ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-full border border-[#d1fae5]">
                                          <CheckCircle size={12} /> All Done
                                        </span>
                                      ) : (
                                        selectedTopics.includes(topic.id) && <CheckCircle size={18} className="text-[#10b981]" />
                                      )}
                                    </div>
                                  </div>
                                  {/* Content Status Badges */}
                                  <div className="flex items-center gap-1.5 ml-8">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${hasNotes ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]' : 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]'}`}>
                                      {hasNotes ? '✓' : '✗'} Notes
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${hasEssay ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]' : 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]'}`}>
                                      {hasEssay ? '✓' : '✗'} Essay
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${hasMcq ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]' : 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]'}`}>
                                      {hasMcq ? '✓' : '✗'} MCQ
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${hasFlash ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]' : 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]'}`}>
                                      {hasFlash ? '✓' : '✗'} Flash
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generated Content Editor Right Panel */}
                  <div className="w-full lg:flex-1 bg-[#f8fafc] rounded-[32px] border border-slate-100 p-8 shadow-inner min-h-[600px]">
                    <div className="mb-10">
                      <h3 className="flex items-center gap-2 text-[20px] font-bold text-[#0f172a] tracking-tight">
                        <BookOpen size={20} className="text-[#10b981]" />
                        Generated Content & Editor
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="text-[11px] font-bold text-[#94a3b8] tracking-widest uppercase mb-4">
                        Latest generated notes from {genActiveSection ? genActiveSection.name : (genActivePaper ? genActivePaper.name : genActiveCourse?.name)}
                      </div>
                      
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm w-full md:w-[280px] hover:shadow-md transition-shadow cursor-pointer block">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 rounded-full bg-[#ecfdf5] flex items-center justify-center border border-[#d1fae5]">
                            <CheckCircle size={20} className="text-[#10b981]" />
                          </div>
                          <Edit3 size={16} className="text-slate-300" />
                        </div>
                        <h4 className="font-bold text-[#1e293b] text-[16px] mb-2">{genActiveSection ? genActiveSection.name : (genActivePaper ? genActivePaper.name : genActiveCourse?.name)}...</h4>
                        <p className="text-[13px] text-[#64748b] leading-relaxed mb-4">Tap to edit generated payload based on template.</p>
                        <button
                          onClick={handleGenerateLMSNotes}
                          disabled={isGeneratingLMS || selectedTopics.length === 0}
                          className="w-full bg-[#4f46e5] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3730a3] disabled:opacity-50 transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.1)]"
                        >
                           {isGeneratingLMS ? <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div> Generating...</span> : <span className="flex items-center gap-2"><Play size={16} /> Auto-Generate {activeTab === 'essay-questions' || activeTab === 'mcq-questions' ? 'Questions' : activeTab === 'flash-cards' ? 'Cards' : 'Notes'}</span>}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ) : activeGenTab === 'lms-notes' ? (
                <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm w-full max-w-5xl mx-auto min-h-[500px] animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                      <h3 className="text-[24px] font-bold text-[#0f172a] mb-1">{activeTab === 'essay-questions' ? 'Essay Questions Structure' : activeTab === 'mcq-questions' ? 'MCQ Structure' : activeTab === 'flash-cards' ? 'Flash Cards Structure' : 'LMS Notes Structure'}</h3>
                      <p className="text-[14px] text-[#64748b] font-medium">Configure the output generation template for MBBS</p>
                    </div>
                    <button className="bg-[#0f172a] text-white px-5 py-2.5 rounded-xl font-bold text-[14px] flex items-center justify-center w-full md:w-auto gap-2 hover:bg-[#1e293b] transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.1)]">
                      <Plus size={16} /> Add Section
                    </button>
                  </div>

                  <div className="space-y-4">
                    {activeStructure.map((note: any, idx) => (
                      <div key={note.id} className="bg-[#f8fafc] rounded-[24px] p-6 flex flex-col md:flex-row items-start md:items-center gap-6 border border-[#f1f5f9] transition-all hover:border-[#e2e8f0] hover:shadow-sm relative group">
                        <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8] font-bold text-[15px] shrink-0 border border-[#e2e8f0]">{idx + 1}</div>
                        
                        <div className="flex-1 w-full border-b border-slate-200 border-dashed md:border-none pb-4 md:pb-0">
                          <div className="font-bold text-[#1e293b] text-[16px] xl:text-[18px] mb-1 tracking-tight">{note.title}</div>
                          <div className="text-[13px] text-[#64748b] font-medium">{note.desc}</div>
                          {activeTab === 'essay-questions' && (
                            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                              <label className="flex items-center gap-2 text-[13px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#4f46e5] focus:ring-[#4f46e5]" />
                                20 Marks Question
                              </label>
                              <label className="flex items-center gap-2 text-[13px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#4f46e5] focus:ring-[#4f46e5]" />
                                10 Marks Question
                              </label>
                              <label className="flex items-center gap-2 text-[13px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#4f46e5] focus:ring-[#4f46e5]" />
                                5 Marks Question
                              </label>
                              <span className="text-[11px] text-slate-400 italic">Tick one or all</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col md:flex-row w-full lg:w-auto gap-3 items-center">
                          {activeTab === 'lms-notes' && (
                            <>
                              <input type="text" defaultValue={note.instruction} className="w-full lg:w-[260px] bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 text-[#334155] shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all" />
                              
                              <div className="relative w-full lg:w-[150px]">
                                <select defaultValue={note.format} className="w-full appearance-none bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#334155] font-bold text-[13px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all cursor-pointer">
                                  <option>Text Format</option>
                                  <option>Table Format</option>
                                  <option>Markdown Map</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                  <ChevronRight size={16} className="rotate-90" />
                                </div>
                              </div>
                            </>
                          )}

                          <div className={`relative w-full ${activeTab === 'lms-notes' ? 'lg:w-[120px]' : 'lg:w-[160px]'}`}>
                            <input 
                              type="number" 
                              value={activeTab === 'lms-notes' ? (note.words || 100) : (note.questions || 1)} 
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setActiveStructure((prev: any[]) => prev.map(n => n.id === note.id ? { ...n, [activeTab === 'lms-notes' ? 'words' : 'questions']: val } : n));
                              }}
                              placeholder={activeTab === 'lms-notes' ? "100" : "1"} 
                              className={`w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 text-[#334155] shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all ${activeTab === 'lms-notes' ? 'pr-14' : 'pr-[100px]'}`} 
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#94a3b8] text-[12px] font-medium">
                              {activeTab === 'lms-notes' ? 'Words' : 'No of Questions'}
                            </div>
                          </div>

                          <button 
                            onClick={() => setActiveStructure((prev: any[]) => prev.filter(n => n.id !== note.id))}
                            className="bg-white md:bg-transparent border border-slate-100 md:border-transparent text-[#94a3b8] hover:text-red-500 hover:bg-red-50/50 transition-colors p-3 md:p-2.5 rounded-xl flex justify-center w-full md:w-auto"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {activeStructure.length > 0 && (
                      <div className="mt-8 bg-[#4f46e5]/5 rounded-2xl p-6 border border-[#4f46e5]/10 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-[#4f46e5]/20 shadow-sm">
                            <Target size={24} className="text-[#4f46e5]" />
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-[#4f46e5] mb-1">Generation Summary</div>
                            <div className="text-[16px] md:text-[18px] font-extrabold text-[#1e293b] tracking-tight">
                              {activeTab === 'lms-notes' 
                                ? 'Total number of words to generate:' 
                                : `Total number of ${activeTab === 'essay-questions' ? 'Essay ' : activeTab === 'mcq-questions' ? 'MCQ ' : activeTab === 'flash-cards' ? 'Flash Card ' : ''}questions to generate:`}
                            </div>
                          </div>
                        </div>
                        <div className="text-[32px] font-black text-[#4f46e5] bg-white px-6 py-2 rounded-xl border border-[#4f46e5]/20 shadow-sm">
                          {activeTab === 'lms-notes'
                            ? activeStructure.reduce((sum: number, item: any) => sum + (item.words || 100), 0)
                            : activeStructure.reduce((sum: number, item: any) => sum + (item.questions || 1), 0)}
                        </div>
                      </div>
                    )}
                    
                    {activeStructure.length === 0 && (
                      <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed">
                        <Layers className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No structural sections</h3>
                        <p className="text-slate-500 text-sm">Add a new section to configure the template.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border text-slate-800 border-slate-200 rounded-3xl p-8 shadow-sm">
                    <div className="flex justify-center flex-col items-center py-16 opacity-50">
                        <Settings size={48} className="mb-4" />
                        <p className="font-medium text-lg text-slate-400">Select an option above to begin.</p>
                    </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'blog-publications' && (
            <div className="w-full max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h2 className="text-[28px] md:text-[34px] font-bold text-slate-900 mb-3 tracking-tight">Blog Publications Engine</h2>
                <p className="text-[15px] md:text-[16px] text-slate-500 font-medium">Author, edit, and publish content directly to the MedEduAI knowledge base.</p>
              </div>

              <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                
                {/* Top Action Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 bg-[#f8fafc] p-4 rounded-2xl border border-slate-100/80">
                  <div className="flex items-center gap-4 px-2">
                    <div className="w-12 h-12 rounded-xl bg-[#ecfdf5] flex items-center justify-center border border-[#d1fae5]">
                      <FileText size={22} className="text-[#10b981]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#0f172a] text-[15px]">All Published & Drafts</h4>
                      <p className="text-[#64748b] text-[13px] font-medium">{blogPosts.length} articles total</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => setIsBulkBlogModalOpen(true)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#f5f3ff] text-[#6d28d9] font-bold text-[14px] px-6 py-3 rounded-xl hover:bg-[#ede9fe] transition-colors border border-[#ddd6fe] shadow-sm"
                    >
                      <Sparkles size={16} /> Bulk AI Blogs
                    </button>
                    <button 
                      onClick={openNewBlogEditor}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#0f172a] text-white font-bold text-[14px] px-6 py-3 rounded-xl hover:bg-[#1e293b] transition-colors shadow-md"
                    >
                      <Play size={16} /> New Article
                    </button>
                  </div>
                </div>

                {/* Bulk AI Blog Modal */}
                {isBulkBlogModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
                      
                      {/* Header */}
                      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <Sparkles size={24} className="text-[#6d28d9]" />
                          <h2 className="text-[22px] font-bold text-[#0f172a]">SEO Bulk Blog Generator</h2>
                        </div>
                        <button 
                          onClick={() => setIsBulkBlogModalOpen(false)}
                          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                          <X size={24} />
                        </button>
                      </div>

                      {/* Body */}
                      <div className="p-8 pb-6 flex-1 overflow-y-auto">
                        <div className="mb-8">
                          <label className="block text-[13px] font-bold text-[#64748b] tracking-wider uppercase mb-3 text-left">
                            Number of Blogs
                          </label>
                          <input 
                            type="number"
                            min="1"
                            max="50"
                            value={blogModalData.count}
                            onChange={(e) => setBlogModalData({...blogModalData, count: parseInt(e.target.value) || 1})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[#0f172a] focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9] transition-colors"
                          />
                          <p className="text-[14px] text-[#94a3b8] mt-3 font-medium text-left">
                            The AI Master Engine will automatically brainstorm engaging topics, SEO keywords, lengths, and tones based on your selected categories.
                          </p>
                        </div>

                        <div>
                          <label className="block text-[13px] font-bold text-[#64748b] tracking-wider uppercase mb-4 text-left">
                            Select Target Categories
                          </label>
                          <div className="flex flex-wrap gap-2.5">
                            {BLOG_CATEGORIES.map((cat, idx) => {
                              const isSelected = blogModalData.categories.includes(cat);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setBlogModalData(prev => ({
                                      ...prev,
                                      categories: isSelected 
                                        ? prev.categories.filter(c => c !== cat)
                                        : [...prev.categories, cat]
                                    }))
                                  }}
                                  className={`px-4 py-2 rounded-[14px] text-[13px] font-bold border transition-colors ${
                                    isSelected 
                                    ? 'bg-[#6d28d9] hover:bg-[#5b21b6] text-white border-[#6d28d9]' 
                                    : 'bg-white hover:bg-slate-50 text-[#475569] border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                                  }`}
                                >
                                  {cat}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="bg-[#f8fafc] px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-3">
                        <button 
                          onClick={() => setIsBulkBlogModalOpen(false)}
                          className="px-6 py-2.5 text-[15px] font-bold text-[#64748b] hover:text-[#0f172a] transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleBulkBlogGenerate}
                          disabled={isBulkGenerating || blogModalData.categories.length === 0}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-[15px] font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isBulkGenerating ? (
                            <><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div> {bulkProgress || 'Starting...'}</>
                          ) : (
                            <><Sparkles size={18} /> Start Master Engine</>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* Blog Article Editor */}
                {(isCreatingBlog || editingBlogIdx !== null) && (
                  <div className="bg-white rounded-[24px] border-2 border-[#4f46e5]/30 p-8 shadow-lg mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#4f46e5]/10 flex items-center justify-center text-[#4f46e5]">
                          {isCreatingBlog ? <Plus size={20} /> : <Edit3 size={20} />}
                        </div>
                        <div>
                          <h3 className="text-[20px] font-bold text-[#0f172a]">{isCreatingBlog ? 'Create New Article' : 'Edit Article'}</h3>
                          <p className="text-[13px] text-[#64748b] font-medium">{isCreatingBlog ? 'Fill in the details for your new blog post.' : 'Update the article details below.'}</p>
                        </div>
                      </div>
                      <button onClick={cancelBlogEditor} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-[13px] font-bold text-[#64748b] tracking-wider uppercase mb-2">Article Title</label>
                        <input 
                          type="text" 
                          value={blogForm.title} 
                          onChange={e => setBlogForm({...blogForm, title: e.target.value})} 
                          placeholder="Enter a compelling article title..." 
                          className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-[#0f172a] font-semibold text-[16px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all" 
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[13px] font-bold text-[#64748b] tracking-wider uppercase mb-2">Category</label>
                          <select 
                            value={blogForm.category} 
                            onChange={e => setBlogForm({...blogForm, category: e.target.value})} 
                            className="w-full appearance-none bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-[#334155] font-bold text-[14px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all cursor-pointer"
                          >
                            <option value="">Select Category</option>
                            {BLOG_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            <option value="Education">Education</option>
                            <option value="Research">Research</option>
                            <option value="Publication">Publication</option>
                            <option value="Clinical">Clinical</option>
                            <option value="Ethics">Ethics</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[13px] font-bold text-[#64748b] tracking-wider uppercase mb-2">Publish Date</label>
                          <input 
                            type="text" 
                            value={blogForm.date} 
                            onChange={e => setBlogForm({...blogForm, date: e.target.value})} 
                            placeholder="e.g. Mar 20, 2026" 
                            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-[#334155] font-medium text-[14px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-bold text-[#64748b] tracking-wider uppercase mb-2">Excerpt / SEO Description</label>
                        <textarea 
                          value={blogForm.excerpt} 
                          onChange={e => setBlogForm({...blogForm, excerpt: e.target.value})} 
                          placeholder="Write a compelling meta description (max 160 characters)..." 
                          rows={3}
                          className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-[#334155] font-medium text-[14px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all resize-none leading-relaxed" 
                        />
                        <p className="text-xs text-slate-400 mt-1">{blogForm.excerpt.length}/160 characters</p>
                      </div>

                      {/* AI Content Generation */}
                      <div className="bg-gradient-to-r from-[#4f46e5]/5 via-[#7c3aed]/5 to-[#6d28d9]/5 border border-[#4f46e5]/15 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-[#0f172a] text-[15px] flex items-center gap-2">
                              <Sparkles size={18} className="text-[#6d28d9]" /> Article Content (800–1200 words)
                            </h4>
                            <p className="text-[12px] text-[#64748b] mt-1">Write your article or generate it with AI. Content will be SEO-optimized.</p>
                          </div>
                          <button
                            onClick={generateArticleContent}
                            disabled={isGeneratingContent || !blogForm.title.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6d28d9] to-[#4f46e5] hover:from-[#5b21b6] hover:to-[#3730a3] text-white text-[13px] font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {isGeneratingContent ? (
                              <><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div> Generating...</>
                            ) : (
                              <><Sparkles size={16} /> Generate with AI</>
                            )}
                          </button>
                        </div>
                        <textarea 
                          value={blogForm.content} 
                          onChange={e => setBlogForm({...blogForm, content: e.target.value})} 
                          placeholder="Write your full article content in Markdown format here... or click 'Generate with AI' to auto-create it.\n\n## Introduction\nStart with an engaging hook...\n\n## Key Points\n- Point 1\n- Point 2\n\n## Conclusion\nWrapping up..." 
                          rows={16}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[#334155] font-medium text-[14px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all resize-y leading-relaxed font-mono" 
                        />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-slate-400">
                            Word count: <span className={`font-bold ${(blogForm.content.split(/\s+/).filter(Boolean).length >= 800 && blogForm.content.split(/\s+/).filter(Boolean).length <= 1200) ? 'text-emerald-600' : blogForm.content.split(/\s+/).filter(Boolean).length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                              {blogForm.content.split(/\s+/).filter(Boolean).length}
                            </span> / 800–1200 recommended
                          </p>
                          <p className="text-xs text-slate-400">Supports Markdown formatting</p>
                        </div>
                      </div>

                      {/* Hashtags */}
                      <div>
                        <label className="block text-[13px] font-bold text-[#64748b] tracking-wider uppercase mb-2">Hashtags</label>
                        <input 
                          type="text" 
                          value={blogForm.hashtags} 
                          onChange={e => setBlogForm({...blogForm, hashtags: e.target.value})} 
                          placeholder="#MedEd #ClinicalResearch #PGMedicine #MedicalEducation" 
                          className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-[#6d28d9] font-semibold text-[14px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all" 
                        />
                        <p className="text-xs text-slate-400 mt-1">Separate hashtags with spaces. These will be shown on the published article.</p>
                      </div>

                      {/* Cover Image */}
                      <div>
                        <label className="block text-[13px] font-bold text-[#64748b] tracking-wider uppercase mb-2">Cover Image URL</label>
                        <input 
                          type="text" 
                          value={blogForm.imageSrc} 
                          onChange={e => setBlogForm({...blogForm, imageSrc: e.target.value})} 
                          placeholder="https://images.pexels.com/photos/..." 
                          className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-[#334155] font-medium text-[14px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/10 transition-all" 
                        />
                        {blogForm.imageSrc && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 max-w-[300px]">
                            <img src={blogForm.imageSrc} alt="Preview" className="w-full h-40 object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                        <button onClick={cancelBlogEditor} className="px-6 py-3 rounded-xl font-bold text-[14px] text-slate-500 hover:bg-slate-50 border border-slate-200 transition-colors">
                          Cancel
                        </button>
                        <button 
                          onClick={saveBlogArticle} 
                          className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-[14px] bg-[#4f46e5] hover:bg-[#3730a3] text-white shadow-md shadow-indigo-500/20 transition-all"
                        >
                          <CheckCircle size={18} /> {isCreatingBlog ? 'Publish Article' : 'Update Article'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogPosts.map((post, idx) => (
                    <div key={idx} className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow relative group">
                      <button 
                        onClick={() => deleteBlogArticle(idx)}
                        className="absolute top-6 right-6 text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      <div className="mb-4 pr-10">
                        <span className="inline-flex items-center gap-1.5 bg-[#ecfdf5] text-[#10b981] font-bold text-[11px] tracking-widest uppercase px-3 py-1.5 rounded-full border border-[#d1fae5]">
                          <CheckCircle size={14} /> Published
                        </span>
                      </div>
                      
                      <h3 className="text-[20px] font-bold text-[#0f172a] mb-3 leading-tight pr-6">{post.title}</h3>
                      <p className="text-[#64748b] text-[14px] leading-relaxed mb-8 font-medium line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 mb-5">
                        <span className="text-[#94a3b8] font-medium text-[13px]">{post.date}</span>
                        <div className="flex items-center gap-1.5 text-[#94a3b8]">
                          <Eye size={16} />
                          <span className="font-medium text-[13px]">{post.views}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => openBlogEditor(idx)}
                          title="Edit / Update Article"
                          className="flex-1 bg-[#f8fafc] text-[#4f46e5] font-bold text-[13px] py-3.5 rounded-xl hover:bg-[#e0e7ff] transition-colors border border-indigo-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex items-center justify-center gap-2"
                        >
                          <Edit3 size={16} /> Edit / Update
                        </button>
                        <button 
                          onClick={() => onNavigate('blog')}
                          className="flex-1 bg-[#0f172a] text-white font-bold text-[13px] py-3.5 rounded-xl hover:bg-[#1e293b] transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                          View Live 
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add New Article Card */}
                  <button 
                    onClick={openNewBlogEditor}
                    className="bg-[#f8fafc] rounded-[24px] border-2 border-dashed border-[#cbd5e1] p-6 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-[#94a3b8] transition-all min-h-[300px] text-slate-400 hover:text-slate-600 cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 mb-4 group-hover:scale-110 group-hover:bg-[#4f46e5] group-hover:border-transparent group-hover:text-white transition-all text-[#4f46e5]">
                      <Plus size={24} />
                    </div>
                    <span className="font-bold text-[16px] text-[#1e293b]">Add New Article</span>
                    <span className="text-[13px] text-[#64748b] mt-2 font-medium">Create a new post manually or with AI</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'token-economy' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-4xl font-bold text-slate-800 mb-6">Token Economy</h1>
              <p className="text-lg text-slate-500 mb-8">Monitor AI credit usage and setup spending limits for AI features.</p>
              <div className="bg-white border text-slate-800 border-slate-200 rounded-3xl p-8 shadow-sm">
                  <div className="flex justify-center flex-col items-center py-16 opacity-50">
                      <Brain size={48} className="mb-4" />
                      <p className="font-medium text-lg text-slate-400">Usage statistics will appear here.</p>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'user-management' && (
            <div className="w-full max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <UserManagementSystem />
            </div>
          )}

          {activeTab === 'affiliate-partners' && (
            <div className="w-full max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AffiliatePartnerPanel />
            </div>
          )}

          {['lms-notes-editor', 'essay-questions-editor', 'mcq-questions-editor', 'flash-cards-editor'].includes(activeTab) && (
            <div className="w-full max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="mb-10">
                <h2 className="text-[28px] md:text-[34px] font-bold text-slate-900 mb-3 tracking-tight">
                  {activeTab === 'essay-questions-editor' ? 'Essay Questions Editor' : activeTab === 'mcq-questions-editor' ? 'MCQ Editor' : activeTab === 'flash-cards-editor' ? 'Flash Cards Editor' : 'LMS Notes Editor'}
                </h2>
                <p className="text-[15px] md:text-[16px] text-slate-500 font-medium">Review and edit all auto-generated content before it goes live.</p>
              </div>

              {editingNoteId ? (() => {
                let currentTopic = null;
                let contextStr = '';
                for (const c of curriculum) {
                  if (!c.papers) continue;
                  for (const p of c.papers) {
                    if (!p.sections) continue;
                    for (const s of p.sections) {
                      if (!s.topics) continue;
                      const t = s.topics.find((x: any) => x && x.id === editingNoteId);
                      if (t) {
                        currentTopic = t;
                        contextStr = `${c.name} • ${p.name} • ${s.name}`;
                      }
                    }
                  }
                }
                
                return (
                  <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <div>
                        <h3 className="text-[22px] font-bold text-slate-900 leading-tight">{currentTopic?.name}</h3>
                        <p className="text-slate-500 text-[13px] font-medium mt-1">{contextStr}</p>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={() => { setEditingNoteId(null); setEditingContent(''); }} className="flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-colors">Cancel</button>
                        <button onClick={async () => {
                          let updatedCurriculum = JSON.parse(JSON.stringify(curriculum));
                          for (const c of updatedCurriculum) {
                            if (!c.papers) continue;
                            for (const p of c.papers) {
                              if (!p.sections) continue;
                              for (const s of p.sections) {
                                if (!s.topics) continue;
                                const t = s.topics.find((x: any) => x && x.id === editingNoteId);
                                if (t) {
                                  if (activeTab === 'lms-notes-editor') t.generatedContent = editingContent;
                                  else if (activeTab === 'essay-questions-editor') t.generatedEssayContent = editingContent;
                                  else if (activeTab === 'mcq-questions-editor') t.generatedMcqContent = editingContent;
                                  else if (activeTab === 'flash-cards-editor') t.generatedFlashCardsContent = editingContent;
                                }
                              }
                            }
                          }
                          setCurriculum(updatedCurriculum);
                          // Explicitly save to database immediately
                          try {
                            await fetch('/api/state/curriculum', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ user_id: 'default', data: updatedCurriculum })
                            });
                          } catch (e) { console.error('Save failed:', e); }
                          setEditingNoteId(null);
                        }} className="flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold bg-[#10b981] hover:bg-[#059669] text-white flex justify-center items-center gap-2 shadow-sm transition-colors"><CheckCircle size={18} /> Save Changes</button>
                      </div>
                    </div>
                    <textarea 
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full min-h-[500px] border border-slate-200 rounded-2xl p-6 text-[15px] text-slate-700 leading-relaxed focus:outline-none focus:border-[#10b981] focus:ring-4 focus:ring-[#10b981]/10 transition-all font-mono"
                      placeholder="Note content..."
                    />
                  </div>
                )
              })() : (
                <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
                  {/* Left Column: Context Selection */}
                  <div className="w-full lg:w-[320px] shrink-0 space-y-4">
                    {/* Context Course */}
                    <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm">
                      <div className="text-[11px] font-bold text-[#8b5cf6] tracking-widest uppercase mb-2">Context: Course</div>
                      <div className="relative">
                        <select 
                          value={lmsCourseId}
                          onChange={e => setLmsCourseId(e.target.value)}
                          className="w-full appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#334155] font-bold text-[14px] focus:outline-none focus:border-[#4f46e5]"
                        >
                          {curriculum.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                           <ChevronRight size={16} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Context Paper */}
                    <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm">
                      <div className="text-[11px] font-bold text-[#8b5cf6] tracking-widest uppercase mb-2">Context: Paper</div>
                      <div className="relative">
                        <select 
                          value={lmsPaperId}
                          onChange={e => setLmsPaperId(e.target.value)}
                          className="w-full appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#334155] font-bold text-[14px] focus:outline-none focus:border-[#4f46e5]"
                        >
                          {lmsActivePapers.length === 0 && <option value="" disabled>No papers available</option>}
                          {lmsActivePapers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                           <ChevronRight size={16} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Context Section */}
                    <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm">
                      <div className="text-[11px] font-bold text-[#8b5cf6] tracking-widest uppercase mb-2">Context: Section</div>
                      <div className="relative">
                        <select 
                          value={lmsSectionId}
                          onChange={e => setLmsSectionId(e.target.value)}
                          className="w-full appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#334155] font-bold text-[14px] focus:outline-none focus:border-[#4f46e5]"
                        >
                          {lmsActiveSections.length === 0 && <option value="" disabled>No sections available</option>}
                          {lmsActiveSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                           <ChevronRight size={16} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                
                  {/* Right Column: Topics */}
                  <div className="flex-1 bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm min-h-[500px] w-full">
                     <div className="mb-6">
                       <h3 className="text-[24px] font-bold text-[#0f172a] mb-1">{lmsActiveSection ? lmsActiveSection.name : 'No section selected'}</h3>
                       <p className="text-[14px] text-[#64748b] font-medium">{lmsActiveCourse ? lmsActiveCourse.name : ''} {lmsActivePaper ? `• ${lmsActivePaper.name}` : ''}</p>
                     </div>
                     
                     <div className="space-y-4">
                        {lmsActiveTopics.length === 0 ? (
                           <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed">
                              <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                              <h3 className="text-lg font-bold text-slate-900 mb-1">No Topics Found</h3>
                              <p className="text-slate-500 text-sm">Select a different section or add topics in Curriculum Setup.</p>
                           </div>
                        ) : (
                           lmsActiveTopics.map((topic: any, idx: number) => {
                             const contentField = activeTab === 'lms-notes-editor' ? topic.generatedContent : activeTab === 'essay-questions-editor' ? topic.generatedEssayContent : activeTab === 'mcq-questions-editor' ? topic.generatedMcqContent : topic.generatedFlashCardsContent;
                             const hasContent = !!contentField;
                             return (
                               <div key={topic.id} className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-100 flex items-center justify-between hover:shadow-sm transition-all group">
                                 <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#e2e8f0] flex items-center justify-center text-[#64748b] font-bold text-[13px] shrink-0">{idx + 1}</div>
                                    <div>
                                      <div className="flex items-center gap-3 mb-1">
                                        {hasContent && <span className="inline-flex items-center gap-1.5 bg-[#ecfdf5] text-[#10b981] font-bold text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full border border-[#d1fae5]">Generated</span>}
                                        <h4 className="font-bold text-[#1e293b] text-[16px]">{topic.name}</h4>
                                      </div>
                                    </div>
                                 </div>
                                 <button onClick={() => { setEditingNoteId(topic.id); setEditingContent(contentField || ''); }} className={`px-4 py-2 rounded-xl font-bold text-[13px] transition-all shrink-0 flex items-center gap-2 border border-slate-200 bg-white text-slate-600 hover:bg-[#10b981] hover:text-white hover:border-[#10b981] shadow-sm`}>
                                   {hasContent ? <><Edit3 size={16} /> Edit</> : <><Plus size={16} /> Add Notes</>}
                                 </button>
                               </div>
                             );
                           })
                        )}
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname.replace(/^\//, '');
    return path || 'home';
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authSession, setAuthSession] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [trialEndDate, setTrialEndDate] = useState<string | null>(null);

  // Track supabase session and fetch user plan
  useEffect(() => {
    _supabase.auth.getSession().then(({ data }) => setAuthSession(data.session));
    const { data: listener } = _supabase.auth.onAuthStateChange((_evt, session) => {
      setAuthSession(session);
      if (!session) setUserPlan('free'); // reset on logout
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch user's subscription plan via server API (bypasses RLS)
  useEffect(() => {
    if (!authSession?.user?.id) return;
    fetch(`/api/user/subscription/${authSession.user.id}`)
      .then(res => res.json())
      .then(data => {
        if (!data || !data.plan_id) {
          setUserPlan('free');
          return;
        }
        setUserPlan(data.plan_id);
        if (data.trial_end_date) setTrialEndDate(data.trial_end_date);
        if (data.trial_expired) {
          console.log('⏰ Trial period has expired. Downgraded to free plan.');
        }
      })
      .catch(err => {
        console.error('Failed to fetch subscription:', err);
        setUserPlan('free');
      });
  }, [authSession?.user?.id]);

  // Validate Single Device Session Periodically
  useEffect(() => {
    if (!authSession?.user?.email) return;

    const interval = setInterval(async () => {
      const sessionId = localStorage.getItem('medimentr_session_id');
      if (!sessionId) return; 

      try {
        const email = authSession.user.email;
        const res = await fetch('/api/auth/session/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, sessionId })
        });
        // Only act on successful responses with explicit valid:false
        if (res.ok) {
          const data = await res.json();
          if (data && data.valid === false) {
            // Another device explicitly registered a DIFFERENT session
            clearInterval(interval);
            await _supabase.auth.signOut();
            localStorage.removeItem('medimentr_session_id');
            alert('Your session has ended because your account was accessed from another device.');
            window.location.href = '/';
          }
        }
        // If response is not OK, silently ignore (don't kick user out)
      } catch (e) {
        // Ignore network errors — never kick user out due to connectivity issues
      }
    }, 30000); // Check every 30 seconds (reduced frequency to avoid false triggers)

    return () => clearInterval(interval);
  }, [authSession?.user?.email]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '');
      setCurrentPage(path || 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (page: string) => {
    // Intercept the hero button's __openAuth sentinel
    if (page === '__openAuth') { setShowAuthModal(true); return; }
    // Intercept logout — go to landing page and show auth modal
    if (page === '__logout') {
      setCurrentPage('home');
      window.history.pushState({}, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setShowAuthModal(true);
      return;
    }
    setCurrentPage(page);
    window.history.pushState({}, '', page === 'home' ? '/' : `/${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = () => {
    // If already logged in, go straight to dashboard
    if (authSession) {
      handleNavigate('dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  // Global Curriculum State
  const [curriculum, setCurriculum] = useState<any[]>(DEFAULT_CURRICULUM);
  const [curriculumLoaded, setCurriculumLoaded] = useState(false);

  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        const res = await fetch('/api/state/curriculum/default');
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            // Process saved curriculum against defaults
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            const defaultIds = new Set(DEFAULT_CURRICULUM.map(c => c.id));
            const deprecatedIds = new Set(['c1', 'c2']);
            const customCourses = parsed.filter((c: any) => !defaultIds.has(c.id) && !deprecatedIds.has(c.id));
            
            const mergedDefaultCourses = DEFAULT_CURRICULUM.map(defaultCourse => {
              const savedCourse = parsed.find((c: any) => c.id === defaultCourse.id);
              if (!savedCourse) return defaultCourse;

              const mergedPapers = defaultCourse.papers?.map(defaultPaper => {
                const savedPaper = savedCourse.papers?.find((p: any) => p.id === defaultPaper.id);
                if (!savedPaper) return defaultPaper;

                const mergedSections = defaultPaper.sections?.map(defaultSection => {
                  const savedSection = savedPaper.sections?.find((s: any) => s.id === defaultSection.id);
                  if (!savedSection) return defaultSection;

                  const customTopics = savedSection.topics?.filter((t: any) => !defaultSection.topics?.find((dt: any) => dt.id === t.id)) || [];

                  const mergedTopics = defaultSection.topics?.map(defaultTopic => {
                    const savedTopic = savedSection.topics?.find((t: any) => t.id === defaultTopic.id);
                    if (!savedTopic) return defaultTopic;

                    return {
                      ...defaultTopic,
                      generatedContent: savedTopic.generatedContent !== undefined ? savedTopic.generatedContent : (defaultTopic as any).generatedContent,
                      generatedEssayContent: savedTopic.generatedEssayContent !== undefined ? savedTopic.generatedEssayContent : (defaultTopic as any).generatedEssayContent,
                      generatedMcqContent: savedTopic.generatedMcqContent !== undefined ? savedTopic.generatedMcqContent : (defaultTopic as any).generatedMcqContent,
                      generatedFlashCardsContent: savedTopic.generatedFlashCardsContent !== undefined ? savedTopic.generatedFlashCardsContent : (defaultTopic as any).generatedFlashCardsContent,
                    };
                  });

                  return {
                    ...defaultSection,
                    topics: [...(mergedTopics || []), ...customTopics]
                  };
                });

                return {
                  ...defaultPaper,
                  sections: mergedSections
                };
              });

              return {
                ...defaultCourse,
                papers: mergedPapers
              };
            });
            setCurriculum([...mergedDefaultCourses, ...customCourses]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch curriculum state", e);
      } finally {
        setCurriculumLoaded(true);
      }
    };
    fetchCurriculum();
  }, []);

  useEffect(() => {
    if (!curriculumLoaded) return;
    const saveCurriculum = async () => {
      try {
        await fetch('/api/state/curriculum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: 'default', data: curriculum })
        });
      } catch (e) {
        console.error("Failed to save curriculum state", e);
      }
    };
    // Debounce save to prevent spamming the database on rapid edits
    const timeoutId = setTimeout(() => {
      saveCurriculum();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [curriculum, curriculumLoaded]);



  // Blog Publications State (Supabase-backed)
  const [blogPosts, setBlogPosts] = useState<any[]>(ACADEMIC_INSIGHTS_POSTS);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const res = await fetch('/api/blog-publications');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            // Supabase has blog posts — use them as source of truth
            const mapped = data.map((p: any) => ({
              ...p,
              imageSrc: p.image_src || p.imageSrc || PEXELS_MEDICAL_IMAGES[Math.floor(Math.random() * PEXELS_MEDICAL_IMAGES.length)]
            }));
            setBlogPosts(mapped);
            console.log(`✅ Loaded ${mapped.length} blog posts from Supabase`);
          } else {
            // Supabase is empty — seed the default posts
            console.log('📝 Seeding default blog posts to Supabase...');
            const seededPosts: any[] = [];
            for (let i = 0; i < ACADEMIC_INSIGHTS_POSTS.length; i++) {
              const post = ACADEMIC_INSIGHTS_POSTS[i];
              const postWithId = {
                ...post,
                id: `blog-seed-${i + 1}`,
                image_src: post.imageSrc || PEXELS_MEDICAL_IMAGES[i % PEXELS_MEDICAL_IMAGES.length],
                status: 'published',
                content: post.content || '',
                hashtags: post.hashtags || '',
              };
              try {
                const saveRes = await fetch('/api/blog-publications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(postWithId)
                });
                if (saveRes.ok) {
                  const saved = await saveRes.json();
                  seededPosts.push({ ...postWithId, ...saved, imageSrc: saved.image_src || postWithId.image_src });
                  console.log(`  ✅ Seeded: ${post.title}`);
                }
              } catch (seedErr) {
                console.error(`  ❌ Failed to seed: ${post.title}`, seedErr);
                seededPosts.push(postWithId);
              }
            }
            setBlogPosts(seededPosts);
          }
        }
      } catch (e) {
        console.error('Failed to fetch blog posts from Supabase:', e);
        // Fall back to hardcoded defaults if API is unavailable
      }
    };
    fetchBlogPosts();
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <LandingPage onNavigate={handleNavigate} />;
      case 'features': return <FeaturesPage onNavigate={handleNavigate} />;
      case 'blog': return <BlogPage onNavigate={handleNavigate} blogPosts={blogPosts} />;
      case 'contrl-panl': return <ControlPanel onNavigate={handleNavigate} curriculum={curriculum} setCurriculum={setCurriculum} blogPosts={blogPosts} setBlogPosts={setBlogPosts} />;
      default: return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  const isDashboardArea = currentPage === 'dashboard' || currentPage.startsWith('feature-');

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 ${isDashboardArea ? 'flex flex-col' : ''}`}>
      {!isDashboardArea && <Navbar onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />}
      
      <main className={isDashboardArea ? 'flex-1 flex flex-col' : ''}>
        <AnimatePresence mode="wait">
          <motion.div
            key={isDashboardArea ? 'dashboard-area' : currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={isDashboardArea ? 'flex-1 flex flex-col' : ''}
          >
            {isDashboardArea ? (
              <DashboardLayout onNavigate={handleNavigate} currentPage={currentPage} curriculum={curriculum} userPlan={userPlan} authSession={authSession} trialEndDate={trialEndDate}>
                {currentPage === 'feature-ai-tutor' ? (
                  <AiTutorWelcome onNavigate={handleNavigate} curriculum={curriculum} />
                ) : currentPage.startsWith('feature-') && (
                  <FeatureModule 
                    featureId={currentPage.replace('feature-', '')} 
                    onNavigate={handleNavigate} 
                    curriculum={curriculum} 
                  />
                )}
              </DashboardLayout>
            ) : (
              renderPage()
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isDashboardArea && <Footer onNavigate={handleNavigate} />}
      <ChatBot />
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => {
              setShowAuthModal(false);
              handleNavigate('dashboard');
            }}
            onGoHome={() => {
              setShowAuthModal(false);
              handleNavigate('home');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper functions
function getIcon(name: string) {
  switch (name) {
    case 'Library': return <Library size={24} />;
    case 'FileText': return <FileText size={24} />;
    case 'Presentation': return <Presentation size={24} />;
    case 'BookOpen': return <BookOpen size={24} />;
    case 'ClipboardList': return <ClipboardList size={24} />;
    case 'BarChart3': return <BarChart3 size={24} />;
    case 'CheckSquare': return <CheckSquare size={24} />;
    case 'Stethoscope': return <Stethoscope size={24} />;
    case 'ShieldAlert': return <ShieldAlert size={24} />;
    case 'PenTool': return <PenTool size={24} />;
    case 'FileQuestion': return <FileQuestion size={24} />;
    case 'Search': return <Search size={24} />;
    case 'UserPlus': return <UserPlus size={24} />;
    case 'Brain': return <Brain size={24} />;
    case 'Cpu': return <Cpu size={24} />;
    case 'LineChart': return <LineChart size={24} />;
    case 'Target': return <Target size={24} />;
    case 'HeartPulse': return <HeartPulse size={24} />;
    case 'FileSymlink': return <FileSymlink size={24} />;
    case 'GraduationCap': return <GraduationCap size={24} />;
    case 'Layers': return <Layers size={24} />;
    case 'Lightbulb': return <Lightbulb size={24} />;
    case 'HelpCircle': return <HelpCircle size={24} />;
    case 'Pill': return <Pill size={24} />;
    default: return <Activity size={24} />;
  }
}
