
import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem } from "../types";
import { MENU_ITEMS } from "../constants";

export async function askWaiter(query: string, menuItems: MenuItem[] = MENU_ITEMS) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é o Garçom Virtual do restaurante "Sabor & Arte".
      Seu cardápio: ${JSON.stringify(menuItems)}.
      
      O cliente perguntou: "${query}".
      
      Sua tarefa:
      1. Identifique TODOS os itens do cardápio que ele deseja.
      2. Para cada item, identifique a QUANTIDADE.
      3. Forneça uma explicação personalizada para cada item sugerido.
      
      Responda APENAS em JSON seguindo o esquema de um array de sugestões.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemId: { type: Type.STRING, description: "ID do item no cardápio" },
                  quantity: { type: Type.INTEGER, description: "Quantidade (mínimo 1)" },
                  reason: { type: Type.STRING, description: "Por que este item foi escolhido para esta parte do pedido" }
                },
                required: ["itemId", "quantity", "reason"]
              }
            }
          },
          required: ["suggestions"]
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}
