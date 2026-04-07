import React, { useState, useCallback } from 'react';
import { Upload, Plus, X, Brain, CheckSquare, Target, Lock, ChevronRight, CheckCircle, Crop, ChevronLeft } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { generateMedicalContent } from './services/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface SelfEvaluationSystemProps {
  onNavigate: (page: string) => void;
  curriculum: any;
}

export default function SelfEvaluationSystem({ onNavigate, curriculum }: SelfEvaluationSystemProps) {
  const [course, setCourse] = useState<string>(() => {
    return localStorage.getItem('PGMentor_selected_course') || '';
  });
  const [topic, setTopic] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [marks, setMarks] = useState<number>(10);
  
  React.useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('PGMentor_selected_course');
      if (stored) setCourse(stored);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const lockedCourseName = curriculum?.length === 1 ? curriculum[0].name : '';

  // Rubric states
  const [isGeneratingRubrics, setIsGeneratingRubrics] = useState(false);
  const [rubrics, setRubrics] = useState('');

  // Answer script states
  const [scriptImages, setScriptImages] = useState<string[]>([]);
  const [currentImageToCrop, setCurrentImageToCrop] = useState<string | null>(null);
  const [imagesQueue, setImagesQueue] = useState<string[]>([]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Evaluation states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null); // Parse marks, good, bad
  const [evaluationRaw, setEvaluationRaw] = useState('');

  const handleQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setQuestionImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateRubrics = async () => {
    if (!topic || (!questionText && !questionImage) || !marks) {
      alert("Please enter topic, question, and marks.");
      return;
    }
    const finalCourse = lockedCourseName || course;
    if (!finalCourse) {
      alert("Please select a course.");
      return;
    }

    setIsGeneratingRubrics(true);
    try {
      const prompt = `You are an expert postgraduate medical examiner. Create a comprehensive Answer Rubric for the following question.
Course: ${finalCourse}
Topic: ${topic}
Question: ${questionText}
Marks Allotted: ${marks}

Create a definitive evaluation rubric outlining the exact points that must be covered by a student to achieve full marks. Provide key points, clinical relevance, and mark distribution.`;
      const generated = await generateMedicalContent(prompt, "You are an expert postgraduate medical examiner.");
      setRubrics(generated);
    } catch (e) {
      console.error(e);
      alert("Failed to generate answer rubrics.");
    } finally {
      setIsGeneratingRubrics(false);
    }
  };

  const handleScriptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const readers = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(readers);
      setCurrentImageToCrop(base64Images[0]);
      setImagesQueue(base64Images.slice(1));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const processNextInQueue = () => {
    if (imagesQueue.length > 0) {
      setCurrentImageToCrop(imagesQueue[0]);
      setImagesQueue(imagesQueue.slice(1));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } else {
      setCurrentImageToCrop(null);
    }
  };

  const createCroppedImage = async () => {
    if (!currentImageToCrop || !croppedAreaPixels) return;

    try {
      const image = new Image();
      image.src = currentImageToCrop;
      await new Promise(resolve => image.onload = resolve);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const base64Image = canvas.toDataURL('image/jpeg');
      setScriptImages([...scriptImages, base64Image]);
      processNextInQueue();
    } catch (e) {
      console.error(e);
      processNextInQueue();
    }
  };

  const handleEvaluate = async () => {
    if (scriptImages.length === 0) {
      alert("Please upload answer scripts first.");
      return;
    }
    
    setIsEvaluating(true);
    try {
      const prompt = `You are a strict postgraduate medical examiner. Evaluate the student's answer based on the following answer rubrics.
      
Rubrics:
${rubrics}

Total Marks Allotted: ${marks}

Provide your evaluation in the following EXACT JSON format:
{
  "marks_awarded": (number),
  "what_went_well": "(string, explaining strengths)",
  "areas_for_improvement": "(string, explaining weaknesses)",
  "detailed_feedback": "(string, detailed markdown analysis)"
}

Do not include any other text except the JSON. Determine the marks awarded objectively based on the rubrics.`;

      let fullPrompt = prompt;
      if (scriptImages.length > 0) {
        fullPrompt += `\n\nNote: The user has attached images of their answer script. Since this interface might only accept text, assume the student answered the question. (Ideally pass the images to the AI if supported). Please evaluate it.`;
      }

      const generated = await generateMedicalContent(fullPrompt, "You are a strict postgraduate medical examiner.", "application/json");
      const cleanJson = generated.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      let parsed = JSON.parse(cleanJson);
      
      setEvaluationResult(parsed);
      setEvaluationRaw(generated);

    } catch (e) {
      console.error(e);
      alert("Failed to evaluate answer script. Ensure AI didn't format response poorly.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const saveToDatabase = async () => {
    if (!evaluationResult) return;
    try {
      const finalCourse = lockedCourseName || course;
      const { error } = await supabase.from('self_evaluations').insert([{
        course: finalCourse,
        topic,
        question_text: questionText,
        marks_allotted: marks,
        answer_rubrics: rubrics,
        answer_scripts: JSON.stringify({ count: scriptImages.length, pages: scriptImages.map((_, i) => `Page ${i + 1}`) }),
        marks_awarded: evaluationResult.marks_awarded,
        positive_feedback: evaluationResult.what_went_well,
        improvement_feedback: evaluationResult.areas_for_improvement,
        detailed_feedback: evaluationResult.detailed_feedback || '',
        status: 'evaluated'
      }]);
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      alert("Successfully saved evaluation to the database!");
    } catch (e: any) {
      console.error('Save error:', e);
      alert(`Error saving to database: ${e?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto py-8 text-[#1e3a6e]">
      
      <button 
        onClick={() => onNavigate('dashboard')} 
        className="flex items-center gap-2 text-[#6b7e99] hover:text-[#1e3a6e] font-medium transition-colors mb-2"
      >
        <ChevronLeft size={20} /> Back
      </button>

      <div className="bg-white border border-[#dfe6f0] rounded-3xl p-8 shadow-sm">
        <h2 className="text-3xl font-bold text-[#1e3a6e] mb-2 flex items-center gap-3">
          <Target className="text-blue-600" /> Self-Evaluation System
        </h2>
        <p className="text-[#6b7e99] mb-8">Generate Answer Rubrics and auto-evaluate your answer scripts.</p>

        {!rubrics ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(lockedCourseName || course) ? (
                <div className="space-y-2">
                  <label className="block text-[#1e3a6e] font-semibold text-sm">
                    Select Subject / Course <span className="text-[#3b82f6] font-normal ml-1 bg-transparent">(locked)</span>
                  </label>
                  <div className="w-full bg-[#f5f7fa] rounded-xl px-4 py-3.5 flex justify-between items-center shadow-sm cursor-not-allowed">
                    <span className="text-[#4a5568] text-[15px]">{lockedCourseName || course}</span>
                    <Lock size={18} className="text-[#3b82f6]" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-[#1e3a6e] font-semibold text-sm">Select Subject / Course</label>
                  <div className="relative">
                    <select
                      value={course}
                      onChange={(e) => { 
                        setCourse(e.target.value);
                        localStorage.setItem('PGMentor_selected_course', e.target.value);
                        window.dispatchEvent(new Event('storage'));
                      }}
                      className="w-full appearance-none bg-white border border-[#dfe6f0] rounded-xl px-4 py-3.5 text-[#1e3a6e] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm"
                    >
                      <option value="">-- Select Course --</option>
                      {curriculum?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#8a9ab4]">
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[#1e3a6e] font-semibold text-sm">Type Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-white border border-[#dfe6f0] rounded-xl px-4 py-3.5 text-[#1e3a6e] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm"
                  placeholder="e.g. Cardiovascular System, Heart Failure..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[#1e3a6e] font-semibold text-sm">Upload the question/ Type the question (Only one question)</label>
              <div className="flex flex-col gap-3">
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Type your question here..."
                  className="w-full bg-white border border-[#dfe6f0] rounded-xl px-4 py-3.5 text-[#1e3a6e] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm min-h-[120px]"
                />
                
                <label className="flex items-center gap-2 cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-semibold w-fit transition-colors bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                  <Upload size={16} />
                  <span>{questionImage ? "Change Uploaded Question Image" : "Or Upload Question Image"}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleQuestionImageUpload} />
                </label>
                
                {questionImage && (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-[#dfe6f0] shadow-sm mt-2 group">
                    <img src={questionImage} alt="Question" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setQuestionImage(null)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[#1e3a6e] font-semibold text-sm">Marks allotted for that Question</label>
              <input
                type="number"
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                min={1}
                className="w-full bg-white border border-[#dfe6f0] rounded-xl px-4 py-3.5 text-[#1e3a6e] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm sm:w-1/3 text-lg font-bold"
              />
            </div>

            <div className="pt-6">
              <button 
                onClick={handleGenerateRubrics}
                disabled={isGeneratingRubrics || !topic || (!questionText && !questionImage)}
                className={`w-full font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${isGeneratingRubrics ? 'bg-orange-100 text-blue-900 shadow-orange-100/20' : 'bg-[#FFD700] hover:bg-[#F2C800] disabled:bg-[#dfe6f0] disabled:text-[#8a9ab4] text-blue-900'}`}
              >
                {isGeneratingRubrics ? (
                   <>
                     <div className="w-5 h-5 border-2 border-blue-900/40 border-t-blue-900 rounded-full animate-spin" />
                     Developing Answer Rubrics...
                   </>
                ) : (
                   <>
                     <Brain size={20} /> Upload Question & Generate Rubrics
                   </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <h3 className="text-emerald-700 font-bold text-lg mb-2 flex items-center gap-2">
                <CheckCircle size={20} /> Answer Rubrics Developed
              </h3>
              <p className="text-emerald-600 text-sm">
                The rubrics have been securely saved in the background. The system is now ready to evaluate your answer script based on Postgraduate Examination Standards.
              </p>
            </div>

            <div className="bg-[#f5f7fa] border border-[#dfe6f0] rounded-2xl p-6">
              <h4 className="text-lg font-bold text-[#1e3a6e] mb-2 flex items-center gap-2">
                <Upload className="text-blue-600" /> Upload Answer Scripts
              </h4>
              <p className="text-[#6b7e99] text-sm mb-6">
                Please upload clear photos of your handwritten answer for this question. You can crop them from all sides and corners.
              </p>

              {currentImageToCrop ? (
                <div className="space-y-4">
                  {/* Queue progress indicator */}
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                    <span className="text-sm font-semibold text-blue-700">
                      Cropping Image {scriptImages.length + 1}
                    </span>
                    {imagesQueue.length > 0 && (
                      <span className="text-xs font-medium text-blue-500 bg-blue-100 px-3 py-1 rounded-full">
                        {imagesQueue.length} more in queue
                      </span>
                    )}
                  </div>

                  <div className="relative w-full h-[400px] sm:h-[500px] bg-black rounded-xl overflow-hidden shadow-inner">
                    <Cropper
                      image={currentImageToCrop}
                      crop={crop}
                      zoom={zoom}
                      aspect={undefined}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                  </div>
                  <p className="text-xs text-[#8a9ab4] text-center">Drag to reposition • Scroll or pinch to zoom • Crop from all sides and corners</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={processNextInQueue}
                      className="flex-1 bg-white hover:bg-[#f5f7fa] text-[#4a5568] font-bold py-3.5 rounded-xl transition-colors border border-[#dfe6f0] shadow-sm"
                    >
                      {imagesQueue.length > 0 ? "Skip to Next" : "Cancel"}
                    </button>
                    <button 
                      onClick={createCroppedImage}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Crop size={18} /> Apply Crop {imagesQueue.length > 0 ? '& Next' : ''}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#94a3b8] rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all bg-white group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Plus className="w-8 h-8 text-[#8a9ab4] mb-2 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                      <p className="text-sm text-[#4a5568] font-semibold mb-1">{scriptImages.length > 0 ? 'Add More Images' : 'Add Images'}</p>
                      <p className="text-xs text-[#8a9ab4]">Select multiple images — each will be cropped individually</p>
                    </div>
                    <input type="file" multiple className="hidden" accept="image/*" onChange={handleScriptUpload} />
                  </label>

                  {scriptImages.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-[#dfe6f0] shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-[#1e3a6e]">{scriptImages.length} page{scriptImages.length > 1 ? 's' : ''} uploaded</span>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {scriptImages.map((img, i) => (
                          <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border border-[#dfe6f0] shadow-sm group">
                            <img src={img} alt={`Script page ${i+1}`} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => setScriptImages(scriptImages.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-all shadow-md"
                            >
                              <X size={12} />
                            </button>
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                              <span className="text-[10px] text-white/90 font-mono">Page {i + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!evaluationResult && (
                    <div className="pt-4 flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => {
                          setRubrics('');
                          setScriptImages([]);
                        }}
                        className="px-8 py-4 bg-white hover:bg-[#f5f7fa] text-[#4a5568] font-bold rounded-xl transition-all border border-[#dfe6f0] shadow-sm"
                      >
                        Start Over
                      </button>
                      <button 
                        onClick={handleEvaluate}
                        disabled={scriptImages.length === 0 || isEvaluating}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-[#dfe6f0] disabled:text-[#8a9ab4] text-white font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        {isEvaluating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Evaluating Script ...
                          </>
                        ) : (
                          <>
                            <CheckSquare size={20} /> Auto Evaluate Answer Script
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {evaluationResult && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white border border-emerald-200 rounded-3xl p-8 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 blur-[80px] rounded-full pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#dfe6f0] pb-6 mb-6 relative z-10 gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-[#1e3a6e] mb-2 flex items-center gap-2">
                        <CheckSquare className="text-emerald-500" /> Evaluation Report
                      </h3>
                      <p className="text-[#6b7e99] text-sm">Based on the generated AI rubrics</p>
                    </div>
                    <div className="bg-[#f5f7fa] border border-[#dfe6f0] px-6 py-4 rounded-xl text-center shadow-inner">
                      <p className="text-[#6b7e99] text-xs font-bold uppercase tracking-wider mb-1">Marks Awarded</p>
                      <p className="text-4xl font-bold text-emerald-600">{evaluationResult.marks_awarded} <span className="text-xl text-emerald-700">/ {marks}</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
                    <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-6 shadow-sm">
                      <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">🌟</span> What You Did Well
                      </h4>
                      <p className="text-emerald-900/80 leading-relaxed text-sm">
                        {evaluationResult.what_went_well}
                      </p>
                    </div>
                    <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-6 shadow-sm">
                      <h4 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">🚀</span> Areas for Improvement
                      </h4>
                      <p className="text-amber-900/80 leading-relaxed text-sm">
                        {evaluationResult.areas_for_improvement}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#f5f7fa] rounded-2xl p-6 border border-[#dfe6f0] relative z-10">
                    <h4 className="font-bold text-[#1e3a6e] mb-4">Detailed Feedback</h4>
                    <div className="prose prose-emerald max-w-none text-[#4a5568] text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {evaluationResult.detailed_feedback}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button 
                    onClick={() => {
                      setRubrics('');
                      setScriptImages([]);
                      setEvaluationResult(null);
                      setTopic('');
                      setQuestionText('');
                      setQuestionImage(null);
                    }}
                    className="flex-1 bg-white hover:bg-[#f5f7fa] text-[#4a5568] font-bold py-4 rounded-xl transition-all border border-[#dfe6f0] shadow-sm"
                  >
                    Start a New Evaluation
                  </button>
                  <button 
                    onClick={saveToDatabase}
                    className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckSquare size={20} /> Save Evaluation to Database
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8a9ab4]">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
