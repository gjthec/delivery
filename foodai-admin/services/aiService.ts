
import { GoogleGenAI, Type } from "@google/genai";
import { 
  MenuItem, 
  Order, 
  SalesInsights, 
  ComboSuggestions, 
  MenuCopy, 
  OwnerChatResponse,
  Combo
} from "../types";

const getAI = () => {
  if (!process.env.API_KEY) throw new Error("API Key não configurada.");
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getSalesInsights = async (orders: Order[]): Promise<SalesInsights> => {
  const ai = getAI();
  const prompt = `Analise detalhadamente este histórico de pedidos: ${JSON.stringify(orders)}. Calcule KPIs reais (Faturamento, Ticket Médio), identifique tendências de horário e sugira melhorias práticas para aumentar o lucro.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", // Alterado de Pro para Flash para evitar erro 429
    contents: prompt,
    config: {
      systemInstruction: "Você é um consultor sênior de inteligência de negócios para restaurantes no Brasil. Sua análise deve ser baseada nos dados reais fornecidos e TODO O CONTEÚDO deve ser estritamente em Português (PT-BR). Evite termos em inglês como 'market share' (use participação de mercado) ou 'orders' (use pedidos/vendas).",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "Resumo executivo da performance em português" },
          kpis: {
            type: Type.OBJECT,
            properties: {
              orders: { type: Type.NUMBER },
              revenue: { type: Type.NUMBER },
              avgTicket: { type: Type.NUMBER }
            },
            required: ["orders", "revenue", "avgTicket"]
          },
          topItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                qty: { type: Type.NUMBER },
                revenue: { type: Type.NUMBER },
                share: { type: Type.NUMBER }
              },
              required: ["name", "qty", "revenue", "share"]
            }
          },
          timeInsights: {
            type: Type.OBJECT,
            properties: {
              bestDays: { type: Type.ARRAY, items: { type: Type.STRING } },
              worstDays: { type: Type.ARRAY, items: { type: Type.STRING } },
              bestHours: { type: Type.ARRAY, items: { type: Type.STRING } },
              worstHours: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["bestDays", "worstDays", "bestHours", "worstHours"]
          },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                evidence: { type: Type.STRING },
                action: { type: Type.STRING },
                impact: { type: Type.STRING, description: "low, medium or high" }
              },
              required: ["title", "evidence", "action", "impact"]
            }
          }
        },
        required: ["summary", "kpis", "topItems", "timeInsights", "recommendations"]
      }
    }
  });

  const jsonStr = response.text;
  if (!jsonStr) throw new Error("A IA retornou uma resposta vazia.");
  return JSON.parse(jsonStr);
};

export const getComboSuggestions = async (menu: MenuItem[], goal: string, limit: number): Promise<ComboSuggestions> => {
  const ai = getAI();
  const menuData = menu.map(m => ({id: m.id, name: m.name, price: m.price, category: m.category}));
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", // Alterado de Pro para Flash para estabilidade de cota
    contents: `Com base estritamente nestes produtos: ${JSON.stringify(menuData)}, crie ${limit} combos inovadores focados em: ${goal}.`,
    config: {
      systemInstruction: "Você é um especialista em engenharia de cardápio focado em maximizar o lucro de restaurantes brasileiros. Crie nomes criativos em Português e garanta que os preços sugeridos ofereçam um desconto atrativo (entre 10% e 25%) em relação à soma dos itens individuais. A descrição deve ser curta e persuasiva. Use apenas os itens que aparecem na lista fornecida.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          combos: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Nome comercial do combo em português" },
                description: { type: Type.STRING, description: "Frase curta de marketing" },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      qty: { type: Type.NUMBER }
                    },
                    required: ["id", "name", "qty"]
                  }
                },
                suggestedPrice: { type: Type.NUMBER },
                suggestedDiscountPercent: { type: Type.NUMBER },
                reason: { type: Type.STRING, description: "Explicação técnica da escolha destes itens" }
              },
              required: ["name", "description", "items", "suggestedPrice", "suggestedDiscountPercent", "reason"]
            }
          }
        },
        required: ["combos"]
      }
    }
  });

  const text = response.text;
  if (!text) return { combos: [] };
  return JSON.parse(text);
};

export const improveMenuItem = async (item: MenuItem): Promise<MenuCopy> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Melhore este prato: ${JSON.stringify(item)}. Use apenas Português do Brasil.`,
    config: {
      systemInstruction: "Copywriter gastronômico brasileiro. Crie textos persuasivos e deliciosos para atrair clientes famintos. Evite termos estrangeiros.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          newName: { type: Type.STRING },
          descriptionShort: { type: Type.STRING },
          descriptionLong: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          upsellSuggestion: { type: Type.STRING }
        },
        required: ["newName", "descriptionShort", "descriptionLong", "tags", "upsellSuggestion"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const estimateCalories = async (name: string, ingredients: string[]): Promise<number> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Estime as calorias: Prato "${name}" com ingredientes [${ingredients.join(', ')}]`,
    config: {
      systemInstruction: "Retorne apenas um número inteiro representando o valor calórico total aproximado.",
    }
  });
  const text = response.text || "0";
  const match = text.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
};

export const chatWithOwner = async (message: string, context: { menu: MenuItem[], orders: Order[], combos: Combo[] }): Promise<OwnerChatResponse> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", // Alterado para Flash para evitar limites do Pro
    contents: `Pergunta do dono: "${message}". Resumo do sistema: ${context.menu.length} itens no menu e ${context.orders.length} pedidos totais. Responda em PT-BR.`,
    config: {
      systemInstruction: "Você é um consultor executivo de gestão de restaurantes no Brasil. Responda de forma estratégica, direta e em Português do Brasil. Sempre inclua um campo 'answer' (texto principal) e opcionalmente 'bullets' (detalhes) e 'actions' (botões de ação rápidos).",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["open_insights", "create_combo", "edit_menu", "open_orders"] },
                label: { type: Type.STRING }
              },
              required: ["type", "label"]
            }
          }
        },
        required: ["answer"]
      }
    }
  });

  const text = response.text;
  if (!text) return { answer: "Não consegui processar sua mensagem agora.", bullets: [], actions: [] };
  
  try {
    const data = JSON.parse(text);
    return {
      answer: data.answer || "Aqui está o que encontrei.",
      bullets: data.bullets || [],
      actions: data.actions || []
    };
  } catch (e) {
    return { answer: text, bullets: [], actions: [] };
  }
};
