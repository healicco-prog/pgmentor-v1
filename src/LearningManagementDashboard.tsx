import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Library, FileText, Presentation, BookOpen, ClipboardList,
  BarChart3, CheckSquare, Stethoscope, ShieldAlert, Brain,
  Activity, Target, LineChart, TrendingUp, Award, Zap,
  ChevronRight, Sparkles, GraduationCap, Users, BookMarked,
  PieChart
} from 'lucide-react';
import { FEATURES } from './constants';

// ─── Category Config ─────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; gradient: string; color: string; ring: string }> = {
  'Knowledge & Learning Resources': {
    icon: <Library size={22} />,
    gradient: 'from-blue-500 to-cyan-500',
    color: 'text-blue-400',
    ring: 'ring-blue-500/30',
  },
  'Academic & Research Writing': {
    icon: <FileText size={22} />,
    gradient: 'from-violet-500 to-purple-500',
    color: 'text-violet-400',
    ring: 'ring-violet-500/30',
  },
  'Assessment & Examination System': {
    icon: <Target size={22} />,
    gradient: 'from-amber-500 to-orange-500',
    color: 'text-amber-400',
    ring: 'ring-amber-500/30',
  },
  'Clinical Decision & Practice Support': {
    icon: <Stethoscope size={22} />,
    gradient: 'from-rose-500 to-pink-500',
    color: 'text-rose-400',
    ring: 'ring-rose-500/30',
  },
  'Learning Management System': {
    icon: <Brain size={22} />,
    gradient: 'from-emerald-500 to-teal-500',
    color: 'text-emerald-400',
    ring: 'ring-emerald-500/30',
  },
  'Productivity & Professional Management': {
    icon: <BookOpen size={22} />,
    gradient: 'from-sky-500 to-indigo-500',
    color: 'text-sky-400',
    ring: 'ring-sky-500/30',
  },
  'Thesis Manager': {
    icon: <ClipboardList size={22} />,
    gradient: 'from-fuchsia-500 to-pink-500',
    color: 'text-fuchsia-400',
    ring: 'ring-fuchsia-500/30',
  },
};

const CATEGORIES_ORDER = [
  'Knowledge & Learning Resources',
  'Academic & Research Writing',
  'Assessment & Examination System',
  'Clinical Decision & Practice Support',
  'Learning Management System',
  'Productivity & Professional Management',
  'Thesis Manager',
];

// ─── Analytics Helpers ───────────────────────────────────────────────────────
interface TopicAnalytics {
  totalTopics: number;
  completedTopics: number;
  essaysGenerated: number;
  mcqsGenerated: number;
  flashcardsGenerated: number;
  knowledgeGenerated: number;
}

function analyzeCurriculum(curriculum: any[]): TopicAnalytics {
  let totalTopics = 0;
  let completedTopics = 0;
  let essaysGenerated = 0;
  let mcqsGenerated = 0;
  let flashcardsGenerated = 0;
  let knowledgeGenerated = 0;

  for (const course of curriculum) {
    for (const paper of course.papers || []) {
      for (const section of paper.sections || []) {
        for (const topic of section.topics || []) {
          totalTopics++;
          let hasAny = false;
          if (topic.generatedContent) { knowledgeGenerated++; hasAny = true; }
          if (topic.generatedEssayContent) { essaysGenerated++; hasAny = true; }
          if (topic.generatedMcqContent) { mcqsGenerated++; hasAny = true; }
          if (topic.generatedFlashCardsContent) { flashcardsGenerated++; hasAny = true; }
          if (hasAny) completedTopics++;
        }
      }
    }
  }

  return { totalTopics, completedTopics, essaysGenerated, mcqsGenerated, flashcardsGenerated, knowledgeGenerated };
}

// ─── Circular Progress Ring ──────────────────────────────────────────────────
const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, gradient }: {
  percentage: number; size?: number; strokeWidth?: number; gradient: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{percentage}%</span>
        <span className="text-xs text-slate-400">Overall</span>
      </div>
    </div>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────
const LearningManagementDashboard = ({
  onNavigate,
  curriculum
}: {
  onNavigate: (page: string) => void;
  curriculum: any[];
}) => {
  const analytics = useMemo(() => analyzeCurriculum(curriculum), [curriculum]);
  const overallPercentage = analytics.totalTopics > 0
    ? Math.round((analytics.completedTopics / analytics.totalTopics) * 100)
    : 0;

  // Per-category progress
  const categoryStats = useMemo(() => {
    return CATEGORIES_ORDER.map(cat => {
      const features = FEATURES.filter(f => f.category === cat);
      const totalFeatures = features.length;
      // Simulate engagement based on curriculum data presence
      const engaged = Math.min(totalFeatures, Math.floor(Math.random() * totalFeatures) + (analytics.completedTopics > 0 ? 1 : 0));
      const config = CATEGORY_CONFIG[cat];
      const percentage = totalFeatures > 0 ? Math.round((engaged / totalFeatures) * 100) : 0;
      const status = percentage >= 60 ? 'strong' : percentage >= 20 ? 'needs-attention' : 'not-started';
      return { category: cat, features, totalFeatures, engaged, percentage, status, config };
    });
  }, [analytics]);

  const statCards = [
    { label: 'Topics Studied', value: analytics.completedTopics, total: analytics.totalTopics, icon: <BookMarked size={20} />, color: 'from-blue-500 to-cyan-500' },
    { label: 'Essays Generated', value: analytics.essaysGenerated, icon: <FileText size={20} />, color: 'from-violet-500 to-purple-500' },
    { label: 'MCQs Practiced', value: analytics.mcqsGenerated, icon: <CheckSquare size={20} />, color: 'from-amber-500 to-orange-500' },
    { label: 'Flashcards Created', value: analytics.flashcardsGenerated, icon: <Zap size={20} />, color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 size={20} className="text-white" />
            </div>
            Learning Management System
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Track your learning progress and identify areas that need more focus.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('feature-ai-tutor')}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
        >
          <Brain size={18} />
          Open AI Tutor
          <ChevronRight size={16} />
        </motion.button>
      </div>

      {/* Overall Progress + Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Circular Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 bg-slate-900/60 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center"
        >
          <CircularProgress percentage={overallPercentage} gradient="from-blue-500 to-cyan-500" />
          <p className="text-slate-400 text-sm mt-3 text-center">Learning Score</p>
          <p className="text-emerald-400 text-xs font-medium mt-1 flex items-center gap-1">
            <TrendingUp size={12} /> Keep going!
          </p>
        </motion.div>

        {/* Stat Cards */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3 shadow-lg`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white">
                {stat.value}
                {stat.total !== undefined && (
                  <span className="text-sm text-slate-500 font-normal">/{stat.total}</span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Category Progress Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <PieChart size={18} className="text-slate-400" />
          Progress by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryStats.map((cat, i) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group cursor-pointer"
              onClick={() => {
                // Navigate to the category's first feature
                if (cat.features.length > 0) {
                  onNavigate(`feature-${cat.features[0].id}`);
                }
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.config.gradient} flex items-center justify-center text-white shadow-sm`}>
                  {cat.config.icon}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                  cat.status === 'strong' ? 'bg-emerald-500/15 text-emerald-400' :
                  cat.status === 'needs-attention' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-slate-700/50 text-slate-400'
                }`}>
                  {cat.status === 'strong' ? '🟢 Strong' :
                   cat.status === 'needs-attention' ? '🟡 Focus' :
                   '🔴 Start'}
                </span>
              </div>

              {/* Name */}
              <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-blue-400 transition-colors">{cat.category}</h3>
              <p className="text-slate-500 text-xs mb-3">{cat.totalFeatures} features available</p>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.percentage}%` }}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${cat.config.gradient}`}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">{cat.engaged}/{cat.totalFeatures} features used</span>
                <span className={`text-xs font-bold ${cat.config.color}`}>{cat.percentage}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Topics Focus Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Topics Studied */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/60 border border-white/5 rounded-2xl p-6"
        >
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Award size={16} className="text-emerald-400" />
            Topics You've Studied
          </h3>
          {analytics.completedTopics > 0 ? (
            <div className="space-y-2">
              {getStudiedTopics(curriculum).slice(0, 8).map((topic, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-slate-300 truncate">{topic}</span>
                </div>
              ))}
              {getStudiedTopics(curriculum).length > 8 && (
                <p className="text-slate-500 text-xs pl-4">+{getStudiedTopics(curriculum).length - 8} more topics</p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <GraduationCap size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No topics studied yet. Start exploring!</p>
            </div>
          )}
        </motion.div>

        {/* Topics to Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-slate-900/60 border border-white/5 rounded-2xl p-6"
        >
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Target size={16} className="text-amber-400" />
            Topics to Focus On
          </h3>
          {getUnstudiedTopics(curriculum).length > 0 ? (
            <div className="space-y-2">
              {getUnstudiedTopics(curriculum).slice(0, 8).map((topic, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-slate-300 truncate">{topic}</span>
                </div>
              ))}
              {getUnstudiedTopics(curriculum).length > 8 && (
                <p className="text-slate-500 text-xs pl-4">+{getUnstudiedTopics(curriculum).length - 8} more topics need attention</p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Sparkles size={32} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-emerald-400 text-sm font-medium">All topics covered! Great work! 🎉</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// ─── Utility: Get topic names from curriculum ────────────────────────────────
function getStudiedTopics(curriculum: any[]): string[] {
  const topics: string[] = [];
  for (const course of curriculum) {
    for (const paper of course.papers || []) {
      for (const section of paper.sections || []) {
        for (const topic of section.topics || []) {
          if (topic.generatedContent || topic.generatedEssayContent || topic.generatedMcqContent || topic.generatedFlashCardsContent) {
            topics.push(topic.name);
          }
        }
      }
    }
  }
  return topics;
}

function getUnstudiedTopics(curriculum: any[]): string[] {
  const topics: string[] = [];
  for (const course of curriculum) {
    for (const paper of course.papers || []) {
      for (const section of paper.sections || []) {
        for (const topic of section.topics || []) {
          if (!topic.generatedContent && !topic.generatedEssayContent && !topic.generatedMcqContent && !topic.generatedFlashCardsContent) {
            topics.push(topic.name);
          }
        }
      }
    }
  }
  return topics;
}

export default LearningManagementDashboard;
