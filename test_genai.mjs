import { GoogleGenAI } from '@google/genai'; 
const ai = new GoogleGenAI({apiKey: 'AIzaSyDxAJfgH9A_X_IOdPMHTCHo7tkV7qnbVUk'}); 
ai.models.generateContent({model: 'gemini-2.5-flash', contents: 'Hello'})
  .then(res => console.log("SUCCESS:", res.text))
  .catch(console.error);
