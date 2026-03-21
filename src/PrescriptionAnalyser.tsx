import React, { useState, useRef } from 'react';
import { UploadCloud, FileType, CheckCircle, AlertTriangle, AlertCircle, X, Download, Loader2, Save } from 'lucide-react';
import { analyzePrescriptionImage } from './services/ai';

interface AnalysisResult {
  overall_score: number;
  quality_level: string;
  scores: {
    patient_information: number;
    prescriber_details: number;
    clinical_documentation: number;
    drug_information: number;
    rational_drug_use: number;
    safety_compliance: number;
  };
  strengths: string[];
  deficiencies: string[];
  recommendations: string[];
}

export default function PrescriptionAnalyser({ onSave }: { onSave?: (data: any) => void }) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPG, PNG). PDF is not fully supported for direct analysis yet.');
        return;
      }
      setImageFile(file);
      setError(null);
      setResult(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        setError(null);
        setResult(null);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please upload an image file (JPG, PNG).');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // The AI service function expects base64 data string 
      const analysisData = await analyzePrescriptionImage(imagePreview);
      setResult(analysisData);
    } catch (err: any) {
      setError('Failed to analyze the prescription. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setIsSaving(false);
    setIsSaved(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!result || !onSave) return;
    setIsSaving(true);
    try {
      await onSave(result);
      setIsSaved(true);
    } catch (err) {
      console.error('Failed to save prescription analysis:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-emerald-400';
    if (score >= 7) return 'text-blue-400';
    if (score >= 5) return 'text-amber-400';
    return 'text-red-400';
  };

  const getQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'excellent': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'very good': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'good': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'acceptable': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'needs improvement': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'poor': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const formatCategoryName = (key: string) => {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Prescription Analyser</h2>
          <p className="text-slate-400">Automated evaluation based on WHO Good Prescription Guidelines.</p>
        </div>
      </div>

      {!result ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div 
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all ${
              imagePreview ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
            style={{ cursor: imagePreview ? 'default' : 'pointer' }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            
            {imagePreview ? (
              <div className="w-full">
                <div className="relative mx-auto max-w-lg mb-6 group">
                  <img 
                    src={imagePreview} 
                    alt="Prescription Preview" 
                    className="w-full h-auto rounded-lg shadow-lg border border-slate-700 max-h-[400px] object-contain bg-slate-950"
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                    className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg backdrop-blur-sm transition-all shadow-lg"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="flex flex-col items-center">
                  <p className="text-slate-300 mb-6 font-medium">Image loaded successfully and ready for analysis.</p>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
                    disabled={isAnalyzing}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Analyzing with WHO Guidelines...</span>
                      </>
                    ) : (
                      <>
                        <FileType size={18} />
                        <span>Analyze Prescription</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-inner">
                  <UploadCloud size={28} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Upload Prescription</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                  Drag and drop an image of the prescription, or click to browse files.
                  Supported formats: JPG, PNG.
                </p>
                <button className="px-6 py-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors font-medium">
                  Browse Files
                </button>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div id="prescription-report" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Evaluation Report</h3>
            <div className="flex space-x-3">
              <button 
                onClick={clearSelection}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Analyze Another
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 text-sm font-medium"
              >
                <Download size={16} />
                <span>Save PDF</span>
              </button>
              {onSave && (
                <button 
                  onClick={handleSave}
                  disabled={isSaving || isSaved}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isSaved 
                      ? 'bg-emerald-600 text-white cursor-default' 
                      : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/20'
                  } disabled:opacity-70`}
                >
                  {isSaving ? (
                    <><Loader2 size={16} className="animate-spin" /><span>Saving...</span></>
                  ) : isSaved ? (
                    <><CheckCircle size={16} /><span>Saved!</span></>
                  ) : (
                    <><Save size={16} /><span>Save to Library</span></>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Top Level Score */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 flex items-center justify-between">
            <div>
              <h4 className="text-slate-400 font-medium mb-1 uppercase tracking-wider text-sm">Overall Score</h4>
              <div className="flex items-baseline space-x-2">
                <span className={`text-5xl font-black ${getScoreColor(result.overall_score)}`}>
                  {result.overall_score.toFixed(1)}
                </span>
                <span className="text-xl text-slate-500 font-medium">/ 10</span>
              </div>
            </div>
            
            <div className="text-right">
              <h4 className="text-slate-400 font-medium mb-2 uppercase tracking-wider text-sm">Quality Level</h4>
              <div className={`px-4 py-2 rounded-lg border inline-block font-bold text-lg ${getQualityColor(result.quality_level)}`}>
                {result.quality_level}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Category Scores</h4>
              <div className="space-y-5">
                {Object.entries(result.scores).map(([key, score]) => {
                  const numScore = score as number;
                  return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300 font-medium">{formatCategoryName(key)}</span>
                      <span className={`font-bold ${getScoreColor(numScore)}`}>{numScore} / 10</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all" 
                        style={{ width: `${(numScore / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )})}
              </div>
            </div>

            {/* AI Feedback */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center text-emerald-400">
                  <CheckCircle size={20} className="mr-2" /> Strengths
                </h4>
                {result.strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {result.strengths.map((item, idx) => (
                      <li key={idx} className="flex items-start text-slate-300 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 mr-3 shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-sm italic">No significant strengths identified.</p>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center text-red-400">
                  <AlertTriangle size={20} className="mr-2" /> Deficiencies
                </h4>
                {result.deficiencies.length > 0 ? (
                  <ul className="space-y-2">
                    {result.deficiencies.map((item, idx) => (
                      <li key={idx} className="flex items-start text-slate-300 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 mr-3 shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-sm italic">No significant deficiencies identified.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
              <AlertCircle size={20} className="mr-2 text-blue-400" /> Recommendations for Improvement
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.recommendations.map((item, idx) => (
                <li key={idx} className="flex items-start bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-slate-300 text-sm">
                  <span className="text-blue-500 font-bold mr-3 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
