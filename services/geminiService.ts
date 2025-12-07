import { GoogleGenAI, Type } from "@google/genai";

// Safely access API Key to prevent crash if process is not defined
// In Vite, this string is typically replaced at build time, but runtime access can fail without checks
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

const ai = new GoogleGenAI({ apiKey });

export const generateQuizQuestion = async (topic: string, difficulty: string): Promise<{ question: string; options: string[] } | null> => {
  if (!apiKey) {
    console.warn("No API Key provided for Gemini.");
    return null;
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Generate a single multiple-choice quiz question about "${topic}" for a ${difficulty} level student. Return exactly 4 options.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of 4 possible answers."
            }
          },
          required: ["question", "options"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating quiz:", error);
    return null;
  }
};