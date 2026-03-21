import { GoogleGenAI } from '@google/genai'; 
const ai = new GoogleGenAI({apiKey: 'AIzaSyDxAJfgH9A_X_IOdPMHTCHo7tkV7qnbVUk'}); 
async function run() {
  try {
    const modelsResponse = await ai.models.list();
    for await (const model of modelsResponse) {
      console.log(model.name);
    }
  } catch (e) {
    console.error(e);
  }
}
run();
