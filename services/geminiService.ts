import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SignLanguage, SpokenLanguage, Drill } from "../types";

// Helper to convert blob to base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data url prefix (e.g., "data:video/mp4;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const translateSignLanguage = async (
  mediaBase64: string,
  mimeType: string,
  spokenLanguage: SpokenLanguage,
  signLanguage: SignLanguage,
  isConversationMode: boolean,
  processingSpeed: 'balanced' | 'accurate',
  accuracyThreshold: number
): Promise<AnalysisResult> => {
  
  // Initialize client here to ensure fresh API key usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview'; 

  const systemInstruction = `You are an expert Sign Language Interpreter specialized in accessibility. 
  Your task is to analyze video inputs of sign language, translate them, and provide educational feedback.
  You support ${signLanguage} specifically but can detect others.
  
  IMPORTANT: You have a confidence threshold of ${accuracyThreshold}%. 
  If your confidence in the translation is BELOW ${accuracyThreshold}, return a score below ${accuracyThreshold} and set the translation text to "[Unclear Sign - Please Repeat]".
  Output JSON only.`;

  const prompt = `Analyze this video. 
  1. Detect the sign language gestures (focus on ${signLanguage}).
  2. Translate the signs into ${spokenLanguage}.
  3. If the user is asking a question or making a statement, and conversation mode is ${isConversationMode}, generate a helpful, natural reply in ${spokenLanguage}.
  4. Provide a confidence score (0-100) based on the clarity of the hand movements.
  5. Provide brief, constructive feedback on the signing technique (e.g., "Hands were too low", "Good clear movement").`;

  // Configure thinking budget based on processing speed
  // Gemini 3 Pro REQUIRES a thinking budget > 0.
  // Balanced = 1024 tokens (Fast thinking), Accurate = 4096 tokens (Deep thinking)
  const thinkingBudget = processingSpeed === 'accurate' ? 4096 : 1024;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: mediaBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: thinkingBudget },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING },
            reply: { type: Type.STRING },
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            detectedSignLanguage: { type: Type.STRING }
          },
          required: ['translation', 'score', 'feedback', 'detectedSignLanguage']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process sign language input.");
  }
};

export const generateLearningDrill = async (
  level: 'Beginner' | 'Intermediate',
  signLanguage: SignLanguage
): Promise<Drill> => {
  // Initialize client here to ensure fresh API key usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Generate a single short sign language practice drill for ${signLanguage} at ${level} level. 
      Return JSON with 'question' (what to sign), 'expectedSign' (description of the sign), and 'difficulty'.`,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Ensure valid budget for Gemini 3 Pro
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            expectedSign: { type: Type.STRING },
            difficulty: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No drill generated");
    const drill = JSON.parse(text);
    return { ...drill, id: crypto.randomUUID() };
  } catch (error) {
    console.error("Drill Generation Error:", error);
    // Fallback if API fails, to keep UI functional
    return {
      id: 'default',
      question: 'Sign "Hello"',
      expectedSign: 'Wave hand near forehead',
      difficulty: 'Beginner'
    };
  }
};