import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain, Send, Sparkles, GraduationCap, BookOpen,
  Target, TrendingUp, Award, Zap, ChevronRight,
  RotateCcw, ChevronLeft, User, Bot, Loader2
} from 'lucide-react';
import { generateMedicalContent } from './services/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Chat Message Type ───────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Learning Levels ─────────────────────────────────────────────────────────
const LEARNING_LEVELS = [
  {
    id: 'basics',
    label: 'Basics',
    desc: 'Foundational concepts, definitions, and core principles',
    icon: <BookOpen size={24} />,
    gradient: 'from-emerald-500 to-teal-500',
    ring: 'ring-emerald-500/30',
    emoji: '🟢',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    desc: 'Clinical applications, differential diagnosis, and pathophysiology',
    icon: <Target size={24} />,
    gradient: 'from-amber-500 to-orange-500',
    ring: 'ring-amber-500/30',
    emoji: '🟡',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    desc: 'Research integration, complex scenarios, and recent advances',
    icon: <Zap size={24} />,
    gradient: 'from-rose-500 to-pink-500',
    ring: 'ring-rose-500/30',
    emoji: '🔴',
  },
];

// ─── Build System Instruction ────────────────────────────────────────────────
const buildTutorSystemInstruction = (level: string, course: string, studiedTopics: string[], unstudiedTopics: string[]) => {
  const levelInstructions: Record<string, string> = {
    basics: 'Teach at a BASIC level. Use simple language, analogies, and build from absolute fundamentals. Start with definitions, then move to basic mechanisms. Avoid complex jargon.',
    intermediate: 'Teach at an INTERMEDIATE level. Cover clinical applications, pathophysiology, differential diagnosis, and clinical correlations. Assume the student knows basic definitions.',
    advanced: 'Teach at an ADVANCED level. Cover research-level detail, molecular mechanisms, recent advances, complex clinical scenarios, and evidence-based medicine. Challenge the student intellectually.',
  };

  const courseContext = course ? `\nSELECTED COURSE / DISCIPLINE: ${course}\nFocus ALL teaching, examples, and topic suggestions specifically on this course unless the student asks otherwise.` : '';

  return `You are MediMentr Guide, a warm, knowledgeable AI tutor for postgraduate medical students. You are an expert medical educator.${courseContext}

YOUR PERSONALITY:
- Warm, encouraging, and supportive
- Use emojis occasionally to make learning engaging (but not excessively)
- Address the student as "doctor" or by name if known
- Celebrate progress and motivate learning

TEACHING LEVEL: ${levelInstructions[level] || levelInstructions.intermediate}

STUDENT CONTEXT:
- Topics already studied: ${studiedTopics.length > 0 ? studiedTopics.slice(0, 20).join(', ') : 'None yet'}
- Topics needing attention: ${unstudiedTopics.length > 0 ? unstudiedTopics.slice(0, 20).join(', ') : 'All topics covered'}

YOUR GUIDELINES:
1. Always be educational and evidence-based
2. Use structured formatting (headings, bullets, tables) for clarity
3. Include clinical correlations and exam-relevant points
4. Ask follow-up questions to test understanding
5. Suggest related topics to explore next
6. Use markdown formatting for clear, readable responses
7. If the student asks about a topic they've already studied, help them go deeper
8. If they ask about a new topic, start from the appropriate level

RULES:
- Do NOT provide unsafe clinical advice
- Maintain accuracy aligned with standard medical textbooks
- Keep responses focused and well-structured
- End responses with a helpful question or suggestion to keep the conversation flowing`;
};

// ─── Utility Functions ───────────────────────────────────────────────────────
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

// ─── Component ───────────────────────────────────────────────────────────────
const AiTutorWelcome = ({
  onNavigate,
  curriculum,
}: {
  onNavigate: (page: string) => void;
  curriculum: any[];
}) => {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const studiedTopics = useMemo(() => getStudiedTopics(curriculum), [curriculum]);
  const unstudiedTopics = useMemo(() => getUnstudiedTopics(curriculum), [curriculum]);
  const totalTopics = studiedTopics.length + unstudiedTopics.length;
  const completionPercentage = totalTopics > 0 ? Math.round((studiedTopics.length / totalTopics) * 100) : 0;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (showChat) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [showChat]);

  // Start chat with welcome message when level is selected
  const handleLevelSelect = async (level: string) => {
    setSelectedLevel(level);
    setShowChat(true);
    setIsLoading(true);

    const levelLabel = LEARNING_LEVELS.find(l => l.id === level)?.label || 'Intermediate';


    try {
      const systemInstruction = buildTutorSystemInstruction(level, selectedCourse, studiedTopics, unstudiedTopics);
      const welcomePrompt = `The student has just opened the AI Tutor and selected the "${levelLabel}" learning level${selectedCourse ? ` for the course "${selectedCourse}"` : ''}. 

Generate a warm welcome message that:
1. Greets them warmly${selectedCourse ? ` and mentions they are studying ${selectedCourse}` : ''}
2. Briefly summarizes their learning progress: ${studiedTopics.length} topics studied out of ${totalTopics} total
${studiedTopics.length > 0 ? `3. Mentions some topics they've covered: ${studiedTopics.slice(0, 5).join(', ')}` : '3. Encourages them to start their learning journey'}
${unstudiedTopics.length > 0 ? `4. Suggests 2-3 topics they should focus on next: ${unstudiedTopics.slice(0, 3).join(', ')}` : '4. Congratulates them on comprehensive coverage'}
5. Asks what they'd like to learn today

Keep it concise (under 200 words), warm, and motivating.`;
      const result = await generateMedicalContent(welcomePrompt, systemInstruction);
      setChatMessages([{
        role: 'assistant',
        content: result || "Welcome! I'm your MediMentr Guide. What would you like to learn today?",
        timestamp: new Date(),
      }]);
    } catch (error) {
      setChatMessages([{
        role: 'assistant',
        content: "Welcome, Doctor! 👋 I'm your MediMentr Guide. I'm here to help you learn and grow. What medical topic would you like to explore today?",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !selectedLevel) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }]);

    setIsLoading(true);

    try {
      // Build conversation context
      const conversationHistory = chatMessages.map(m =>
        `${m.role === 'user' ? 'Student' : 'MediMentr Guide'}: ${m.content}`
      ).join('\n\n');

      const prompt = `${conversationHistory}\n\nStudent: ${userMessage}\n\nMediMentr Guide:`;
      const systemInstruction = buildTutorSystemInstruction(selectedLevel, selectedCourse, studiedTopics, unstudiedTopics);
      const result = await generateMedicalContent(prompt, systemInstruction);

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: result || "I apologize, I couldn't generate a response. Could you rephrase your question?",
        timestamp: new Date(),
      }]);
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: "I encountered an error. Please try again or rephrase your question.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to level selection
  const handleReset = () => {
    setSelectedLevel(null);
    setShowChat(false);
    setChatMessages([]);
    setInputMessage('');
    setSelectedCourse('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">AI Tutor</h1>
            <p className="text-slate-400 text-xs">Your personal MediMentr learning guide</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showChat ? (
          /* ─── Welcome & Level Selection ──────────────────────────────────── */
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Welcome Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-white/5 rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20 shrink-0">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white">
                    Welcome, Doctor! 👋
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    I'm your <span className="text-blue-400 font-semibold">MediMentr Guide</span> — a personalized AI tutor 
                    designed to help you master medical concepts at your own pace.
                  </p>

                  {/* Learning Status Summary */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
                      <Award size={16} className="text-emerald-400" />
                      <span className="text-emerald-400 text-sm font-medium">{studiedTopics.length} topics studied</span>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
                      <Target size={16} className="text-amber-400" />
                      <span className="text-amber-400 text-sm font-medium">{unstudiedTopics.length} topics remaining</span>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-400" />
                      <span className="text-blue-400 text-sm font-medium">{completionPercentage}% complete</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Selection */}
            <div className="space-y-3">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <BookOpen size={16} className="text-slate-400" />
                Select Course / Discipline
              </h3>
              <div className="relative">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full appearance-none bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">-- Select Course (optional) --</option>
                  {curriculum?.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
              {selectedCourse && (
                <p className="text-blue-400 text-xs flex items-center gap-1">
                  <Sparkles size={12} /> AI will focus on <span className="font-semibold">{selectedCourse}</span> topics
                </p>
              )}
            </div>

            {/* Level Selection */}
            <div>
              <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                <GraduationCap size={16} className="text-slate-400" />
                Choose Your Learning Level
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {LEARNING_LEVELS.map((level, i) => (
                  <motion.button
                    key={level.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLevelSelect(level.id)}
                    className={`relative bg-slate-900/60 border border-white/5 rounded-2xl p-6 text-left hover:border-white/15 transition-all group overflow-hidden`}
                  >
                    {/* Background glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${level.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${level.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                      {level.icon}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{level.emoji}</span>
                      <h4 className="text-white font-bold text-lg">{level.label}</h4>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{level.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs text-slate-500 group-hover:text-blue-400 transition-colors">
                      Start Learning <ChevronRight size={14} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Suggestions */}
            {unstudiedTopics.length > 0 && (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-400" />
                  Suggested Topics to Explore
                </h3>
                <div className="flex flex-wrap gap-2">
                  {unstudiedTopics.slice(0, 6).map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        handleLevelSelect('intermediate');
                        setTimeout(() => setInputMessage(`Teach me about ${topic}`), 2000);
                      }}
                      className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs hover:bg-blue-500/20 transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* ─── Chat Interface ────────────────────────────────────────────── */
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden flex flex-col"
            style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Brain size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">MediMentr Guide</p>
                  <p className="text-slate-400 text-xs">
                    {LEARNING_LEVELS.find(l => l.id === selectedLevel)?.emoji}{' '}
                    {LEARNING_LEVELS.find(l => l.id === selectedLevel)?.label} Level
                    {selectedCourse && <span className="ml-1 text-blue-400">• {selectedCourse}</span>}
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg transition-colors"
              >
                <RotateCcw size={12} /> Change Level
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Loading state for initial welcome */}
              {isLoading && chatMessages.length === 0 && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Brain size={14} className="text-white" />
                  </div>
                  <div className="bg-slate-800/60 border border-white/5 rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Loader2 size={14} className="animate-spin" />
                      Preparing your personalized welcome...
                    </div>
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  }`}>
                    {msg.role === 'assistant' ? <Brain size={14} className="text-white" /> : <User size={14} className="text-white" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[80%] ${
                    msg.role === 'assistant'
                      ? 'bg-slate-800/60 border border-white/5 rounded-2xl rounded-tl-md'
                      : 'bg-blue-600/15 border border-blue-500/20 rounded-2xl rounded-tr-md'
                  } px-4 py-3`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none
                        prose-headings:text-white prose-headings:font-bold
                        prose-h2:text-base prose-h2:text-blue-400 prose-h2:mt-3 prose-h2:mb-2
                        prose-h3:text-sm prose-h3:text-emerald-400 prose-h3:mt-2 prose-h3:mb-1
                        prose-p:text-slate-300 prose-p:text-sm prose-p:leading-relaxed prose-p:my-1.5
                        prose-li:text-slate-300 prose-li:text-sm
                        prose-strong:text-white
                        prose-code:text-blue-300 prose-code:bg-blue-500/10 prose-code:px-1 prose-code:rounded
                        prose-table:border-collapse
                        prose-th:bg-slate-700 prose-th:text-white prose-th:px-3 prose-th:py-1.5 prose-th:text-xs prose-th:border prose-th:border-white/10
                        prose-td:px-3 prose-td:py-1.5 prose-td:border prose-td:border-white/10 prose-td:text-slate-300 prose-td:text-xs
                      ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-blue-200 text-sm">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator for response */}
              {isLoading && chatMessages.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Brain size={14} className="text-white" />
                  </div>
                  <div className="bg-slate-800/60 border border-white/5 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-white/5 bg-slate-800/20">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask me anything about medical topics..."
                  className="flex-1 bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 transition-all"
                >
                  <Send size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiTutorWelcome;
