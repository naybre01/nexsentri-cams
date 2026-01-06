import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FrigateEvent } from "../types";

// Initialize securely
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeEvent = async (event: FrigateEvent): Promise<string> => {
  try {
    const model = "gemini-3-flash-preview";
    const prompt = `
      You are an advanced security AI analyzing a dashcam event.
      
      Event Details:
      - Object Detected: ${event.label}
      - Confidence Score: ${(event.score * 100).toFixed(1)}%
      - Time: ${new Date(event.startTime * 1000).toLocaleString()}
      - Camera ID: ${event.camera}

      Please provide a brief, professional security assessment of this detection. 
      Is this typically a high-priority event for a vehicle dashcam? 
      What actions should the driver or system take?
      Keep it under 50 words.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to analyze event due to an API error.";
  }
};

export const chatWithSystem = async (message: string, contextStats: string): Promise<string> => {
    try {
        const model = "gemini-3-flash-preview";
        const systemInstruction = `
            You are NexSentri AI, the intelligent voice of a Raspberry Pi 4 Dashcam system.
            You help the user understand their system status, recent events, and configuration.
            Current System Context: ${contextStats}
            
            Be concise, helpful, and tech-savvy.
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: message,
            config: {
                systemInstruction
            }
        });
        
        return response.text || "I'm listening, but I didn't have a response.";
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "I'm having trouble connecting to my neural network right now.";
    }
}