import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function getAIInsights(data: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following retail business data and provide 3-4 concise, actionable strategic insights. 
      Focus on revenue trends, inventory risks, and customer behavior.
      
      Data: ${JSON.stringify(data)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              insight: { type: Type.STRING },
              impact: { type: Type.STRING, description: "High, Medium, or Low" },
              icon: { type: Type.STRING, description: "A single emoji representing the insight" }
            },
            required: ["title", "insight", "impact", "icon"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [
      {
        title: "AI Analysis Unavailable",
        insight: "We couldn't reach the AI engine. Please check your connection or API key.",
        impact: "Low",
        icon: "⚠️"
      }
    ];
  }
}
