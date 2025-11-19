import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
// Only init AI if key exists to avoid immediate errors
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const FALLBACK_ALERTS = [
    "ATTENTION: TRACK HAZARD DETECTED.",
    "WARNING: REDUCE SPEED.",
    "CAUTION: MAINTENANCE CREW AHEAD.",
    "ALERT: OBSTACLE ON LINE.",
    "SYSTEM: SPEED RESTRICTION IN EFFECT."
];

const FALLBACK_TRIVIA = [
    "The Bogotá Metro Line 1 is fully elevated.",
    "The viaduct is designed to be earthquake resistant.",
    "Metro trains will be fully automated (GoA4).",
    "The line connects with TransMilenio BRT.",
    "The depot is located in the Bosa district."
];

export const generateStationAnnouncement = async (stationName: string, prevStation: string | null): Promise<string> => {
  if (!ai) return `Arriving at ${stationName}.`;

  try {
    const prompt = `
      You are the voice of the new Bogotá Metro Line 1.
      The train has just arrived at station: "${stationName}".
      The previous station was: "${prevStation || 'None (Depot)'}".
      
      Generate a very short, punchy 1-sentence announcement.
      Include a quick reference to a nearby landmark if appropriate.
      Tone: Professional, Futuristic.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || `Arriving at ${stationName}.`;
  } catch (error: any) {
    // Gracefully handle quota limits or other API errors
    if (error?.code === 429 || error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
        console.warn("Gemini API Quota Exceeded. Using fallback.");
        return `Arriving at ${stationName}. Please stand clear of the doors.`;
    }
    console.warn("Gemini API Error:", error);
    return `Arriving at ${stationName}.`;
  }
};

export const generateChallengeAlert = async (type: 'OBSTACLE' | 'SPEED_LIMIT', details: string): Promise<string> => {
    if (!ai) return `ALERT: ${details}`;

    try {
      const prompt = `
        You are the emergency broadcast system of the Bogotá Metro.
        A hazard has been detected: ${details} (${type}).
        
        Generate an urgent, short warning message for the train operator. 
        Use uppercase words for emphasis.
      `;
  
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
  
      return response.text || `ALERT: ${details}`;
    } catch (error: any) {
      // Fallback for alerts
      const fallback = FALLBACK_ALERTS[Math.floor(Math.random() * FALLBACK_ALERTS.length)];
      return `${fallback} (${details})`;
    }
  };

export const generateTrivia = async (): Promise<string> => {
    if (!ai) return FALLBACK_TRIVIA[0];
  
    try {
      const prompt = `
        Tell me a one-sentence fun fact about the engineering challenges of building the elevated metro in Bogotá's soil.
      `;
  
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
  
      return response.text || FALLBACK_TRIVIA[0];
    } catch (error) {
      return FALLBACK_TRIVIA[Math.floor(Math.random() * FALLBACK_TRIVIA.length)];
    }
  };
