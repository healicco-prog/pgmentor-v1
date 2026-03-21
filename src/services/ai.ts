import { GoogleGenAI, Type } from "@google/genai";

// @ts-ignore
const apiKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '') || 'dummy_api_key_to_let_ui_load';
const ai = new GoogleGenAI({ apiKey });

export const generateMedicalContent = async (prompt: string | any[], systemInstruction: string, responseMimeType: string = "text/plain", useSearch: boolean = false) => {
  try {
    const config: any = {
      systemInstruction: systemInstruction,
      temperature: 0.7,
      responseMimeType: responseMimeType,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const medimentrMentorChat = async (message: string) => {
  const systemInstruction = `You are Medimentr AI Mentor, a helpful assistant for the Medimentr platform. 
  Medimentr is an AI-powered academic assistant for postgraduate medical students.
  Features include:
  - Knowledge Library: Evidence-based PG medical notes.
  - Essay Generator: Long/Short essays and short notes.
  - Seminar Builder: 20-30 slide PPT structure and notes.
  - Journal Club Preparator: Critical appraisal and PPT structure.
  - Thesis/Research Notes: Research protocol generation.
  - StatAssist: Statistical analysis guidance (t-test, ANOVA, etc.).
  - Answer Script Analyser: Rubric-based evaluation of answers.
  - Prescription Analyser: Clinical review of prescriptions.
  - Guidelines Generator: Latest medical guidelines summary.
  - Manuscript Structure Generator: IMRAD format for publications.
  - Question Paper Generator: Pattern-based paper generation.
  
  Explain these features to users and guide them on how to use the portal.`;

  return generateMedicalContent(message, systemInstruction);
};

export const extractContactFromImage = async (base64Image: string) => {
  const systemInstruction = `You are an OCR specialist. Extract contact information from the provided visiting card image.
  Return the information in JSON format with the following fields:
  {
    "name": "Full Name",
    "designation": "Job Title",
    "organization": "Company/Hospital Name",
    "email": "Email Address",
    "phone": "Phone Number",
    "website": "Website URL",
    "address": "Physical Address"
  }
  If a field is not found, leave it as an empty string. Only return the JSON.`;

  const prompt = {
    parts: [
      { text: "Extract contact info from this visiting card." },
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image.split(',')[1] || base64Image
        }
      }
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("OCR Error:", error);
    throw error;
  }
};

export const analyzePrescriptionImage = async (base64Image: string) => {
  const systemInstruction = `You are an expert AI healthcare systems evaluator and clinical quality specialist.
  Analyze the provided medical prescription image based on WHO Good Prescription Guidelines and Rational Drug Use indicators.
  Return a structured JSON report with the following format:
  {
    "overall_score": 0.0,
    "quality_level": "Excellent | Very Good | Good | Acceptable | Needs Improvement | Poor",
    "scores": {
      "patient_information": 0,
      "prescriber_details": 0,
      "clinical_documentation": 0,
      "drug_information": 0,
      "rational_drug_use": 0,
      "safety_compliance": 0
    },
    "strengths": ["string"],
    "deficiencies": ["string"],
    "recommendations": ["string"]
  }
  Score each category from 1 to 10. The overall_score should be the average. 
  Quality levels mapping: 
  9-10 (Excellent), 8-8.9 (Very Good), 7-7.9 (Good), 6-6.9 (Acceptable), 5-5.9 (Needs Improvement), Below 5 (Poor).
  Be educational and constructive in feedback. Ensure the output is strictly valid JSON.`;

  const prompt = {
    parts: [
      { text: "Analyze this prescription and generate the evaluation JSON report." },
      {
        inlineData: {
          mimeType: "image/jpeg", // Assuming jpeg/png handling
          data: base64Image.split(',')[1] || base64Image
        }
      }
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Prescription Analysis Error:", error);
    throw error;
  }
};

export const extractPaperTextFromImage = async (base64Image: string) => {
  const systemInstruction = `You are an expert AI extraction tool. Your task is to accurately transcribe the uploaded medical question paper. Maintain the exact formatting, structure, question numbers, and text content that you see in the document. Return the output as plain text formatted in Markdown. IMPORTANT: Do not add any extra commentary, and DO NOT add any trailing characters, asterisks (e.g. ********), or separators at the end of the output.`;
  
  const prompt = {
    parts: [
      { text: "Extract and format the question paper text exactly as shown in this image." },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image.split(',')[1] || base64Image
        }
      }
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "text/plain",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Paper Extraction Error:", error);
    throw error;
  }
};
