import { Feature } from "./types";

export const FEATURES: Feature[] = [
  { id: "search-topic", title: "Search Topic", description: "Search and discover topics across your entire curriculum instantly.", icon: "Search", path: "/features/search-topic", category: "Knowledge & Learning Resources" },
  { id: "knowledge-library", title: "Knowledge Library", description: "Evidence-based PG medical notes with clinical relevance and recent advances.", icon: "Library", path: "/features/knowledge-library", category: "Knowledge & Learning Resources" },
  { id: "essay-library", title: "Essay Library", description: "Access a wide range of pre-written medical essays.", icon: "FileText", path: "/features/essay-library", category: "Knowledge & Learning Resources" },
  { id: "mcq-library", title: "MCQ Library", description: "Practice with extensive multiple-choice questions for exam prep.", icon: "CheckSquare", path: "/features/mcq-library", category: "Knowledge & Learning Resources" },
  { id: "flash-cards", title: "Flash Cards", description: "Create and study digital flashcards for quick revision.", icon: "Layers", path: "/features/flash-cards", category: "Knowledge & Learning Resources" },

  { id: "essay-generator", title: "Essay Generator", description: "Generate structured long/short essays and short notes for medical exams.", icon: "FileText", path: "/features/essay-generator", category: "Academic & Research Writing" },
  { id: "seminar-builder", title: "Seminar Builder", description: "Create professional 20-30 slide PPT structures and detailed seminar notes.", icon: "Presentation", path: "/features/seminar-builder", category: "Academic & Research Writing" },
  { id: "journal-club", title: "Journal Club Preparator", description: "Critical appraisal of research papers with PPT structure generation.", icon: "BookOpen", path: "/features/journal-club", category: "Academic & Research Writing" },
  { id: "protocol-generator", title: "Protocol Generator", description: "Generate structured research protocols.", icon: "FilePlus", path: "/features/protocol-generator", category: "Academic & Research Writing" },
  { id: "thesis-notes", title: "Thesis Manager", description: "Systematically record, organize, and analyze thesis research notes.", icon: "ClipboardList", path: "/features/thesis-notes", category: "Thesis Manager" },
  { id: "stat-assist", title: "StatAssist", description: "AI-powered statistical assistant for research methodology and data analysis.", icon: "BarChart3", path: "/features/stat-assist", category: "Academic & Research Writing" },
  { id: "manuscript-generator", title: "Manuscript Generator", description: "Generate IMRAD structure, abstracts, and titles for your research papers.", icon: "PenTool", path: "/features/manuscript-generator", category: "Academic & Research Writing" },

  { id: "ai-exam-prep", title: "AI exam preparation system", description: "Personalized AI-driven preparation strategies for medical exams.", icon: "Target", path: "/features/ai-exam-prep", category: "Assessment & Examination System" },
  { id: "question-paper", title: "Question Paper Generator", description: "Generate mock papers based on last 10 years of exam patterns.", icon: "FileQuestion", path: "/features/question-paper", category: "Assessment & Examination System" },
  { id: "reflection-generator", title: "Reflection Generator", description: "Generate structured reflections and self-evaluations for clinical assessments.", icon: "Lightbulb", path: "/features/reflection-generator", category: "Assessment & Examination System" },
  { id: "answer-analyser", title: "Knowledge Analyser (Essay)", description: "Evaluate your answers against standard rubrics with improvement tips.", icon: "CheckSquare", path: "/features/answer-analyser", category: "Assessment & Examination System" },
  { id: "mcqs-analyser", title: "Knowledge Analyser (MCQs)", description: "Upload your filled MCQ sheets for automated evaluation and detailed performance analysis.", icon: "Cpu", path: "/features/mcqs-analyser", category: "Assessment & Examination System" },
  { id: "ai-exam-simulator", title: "AI Exam Simulator", description: "Simulate real exam scenarios with timed mock exams and automated evaluation.", icon: "Target", path: "/features/ai-exam-simulator", category: "Assessment & Examination System" },
  { id: "clinical-examination", title: "Clinical Examination System", description: "AI-powered step-by-step clinical examination protocol generator and OSCE checklist.", icon: "Activity", path: "/features/clinical-examination", category: "Assessment & Examination System" },

  { id: "prescription-analyser", title: "Prescription Analyser", description: "Clinical analysis and review of medical prescriptions.", icon: "FileSymlink", path: "/features/prescription-analyser", category: "Clinical Decision & Practice Support" },
  { id: "guidelines-generator", title: "Guidelines Generator", description: "Stay updated with the latest clinical guidelines and protocols.", icon: "ShieldAlert", path: "/features/guidelines-generator", category: "Clinical Decision & Practice Support" },
  { id: "clinical-decision-support", title: "Clinical Decision Support System (CDS)", description: "AI-based patient data analysis and evidence-based clinical recommendations.", icon: "Stethoscope", path: "/features/clinical-decision-support", category: "Clinical Decision & Practice Support" },
  { id: "doubt-solver", title: "Doubt Solving & Concept Simplification", description: "AI-powered medical concept explainer with 15 teaching styles for PG students.", icon: "HelpCircle", path: "/features/doubt-solver", category: "Clinical Decision & Practice Support" },
  { id: "drug-treatment-assistant", title: "Drug & Treatment Assistant", description: "AI-powered clinical pharmacology companion for drug info, comparisons, and treatment protocols.", icon: "Pill", path: "/features/drug-treatment-assistant", category: "Clinical Decision & Practice Support" },

  { id: "ai-tutor", title: "AI Tutor", description: "Your personal AI mentor for continuous medical learning.", icon: "Brain", path: "/features/ai-tutor", category: "Learning Management System" },

  { id: "digital-diary", title: "Digital Diary", description: "AI-powered reflective journal, productivity assistant, and learning tracker.", icon: "BookOpen", path: "/features/digital-diary", category: "Productivity & Professional Management" },
  { id: "contacts-management", title: "Contacts Management System", description: "Digital visiting cards, OCR contact scanning, and professional networking database.", icon: "UserPlus", path: "/features/contacts-management", category: "Productivity & Professional Management" },
  { id: "session-search", title: "Scientific Session Search", description: "Search for upcoming medical conferences, webinars, and scientific sessions globally.", icon: "Search", path: "/features/session-search", category: "Productivity & Professional Management" },
  { id: "resume-builder", title: "Professional Resume Builder", description: "AI-powered academic CV builder with templates, live preview, and downloadable output for medical professionals.", icon: "FileText", path: "/features/resume-builder", category: "Productivity & Professional Management" }
];
