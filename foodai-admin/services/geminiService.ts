
import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem } from '../types';

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const testAiWaiter = async (
  userMessage: string,
  systemPrompt: string,
  menu: MenuItem[]
) => {
  const ai = getAI();
  
  const menuContext = menu.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    tags: item.tags,
    description: item.description
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `User says: "${userMessage}"`,
    config: {
      systemInstruction: `${systemPrompt}\n\nCURRENT MENU CONTEXT:\n${JSON.stringify(menuContext)}`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reply: { type: Type.STRING, description: 'The text response to the user' },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                itemId: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                reason: { type: Type.STRING }
              },
              required: ['itemId', 'quantity', 'reason']
            }
          }
        },
        required: ['reply', 'suggestions']
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { reply: response.text, suggestions: [] };
  }
};
