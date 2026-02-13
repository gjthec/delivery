
import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem } from "../types";
<<<<<<< HEAD

/**
 * Pergunta ao garçom virtual usando o cardápio atual (estático ou do Firebase)
 */
export async function askWaiter(query: string, currentMenu: MenuItem[]) {
=======
import { MENU_ITEMS } from "../constants";

export async function askWaiter(query: string, menuItems: MenuItem[] = MENU_ITEMS) {
>>>>>>> e59bfd7026584ea2be4ab432bbf890f1b70b0b2f
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é o Garçom Virtual do restaurante "Sabor & Arte".
<<<<<<< HEAD
      Seu cardápio atualizado: ${JSON.stringify(currentMenu)}.
=======
      Seu cardápio: ${JSON.stringify(menuItems)}.
>>>>>>> e59bfd7026584ea2be4ab432bbf890f1b70b0b2f
      
      O cliente perguntou: "${query}".
      
      Sua tarefa:
      1. Identifique TODOS os itens do cardápio que ele deseja ou que combinam com o pedido.
      2. Para cada item, identifique a QUANTIDADE sugerida.
      3. Forneça uma explicação personalizada e curta para cada item sugerido, sendo muito gentil.
      
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
