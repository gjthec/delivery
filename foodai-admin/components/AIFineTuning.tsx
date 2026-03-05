
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, History, Settings2, Save, Bot } from 'lucide-react';
import { testAiWaiter } from '../services/geminiService';
import { AiWaiterSuggestion } from '../types';
import { INITIAL_MENU } from '../mockData';

const DEFAULT_SYSTEM_PROMPT = `Você é um garçom virtual prestativo e profissional da "Sua Plataforma".
Seu objetivo é sugerir itens do cardápio, lidar com pedidos educadamente e fornecer descrições úteis.
Sempre retorne as respostas no formato JSON exigido.
Mantenha um tom amigável e eficiente.
Se um cliente pedir uma recomendação, considere os itens populares e as tags.`;

const AIFineTuning: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isSaving, setIsSaving] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, suggestions?: AiWaiterSuggestion[] }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!testInput.trim()) return;

    const currentInput = testInput;
    setTestInput('');
    setMessages(prev => [...prev, { role: 'user', content: currentInput }]);
    setIsLoading(true);

    try {
      const result = await testAiWaiter(currentInput, systemPrompt, INITIAL_MENU);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: result.reply || "Não consegui processar isso corretamente.",
        suggestions: result.suggestions
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Erro ao comunicar com o cérebro do garçom. Verifique sua chave de API." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrompt = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Instrução da IA atualizada com sucesso!');
    }, 800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="text-orange-500" size={24} />
            <h2 className="text-lg font-bold text-slate-800">Instrução do Sistema</h2>
          </div>
          <button 
            onClick={handleSavePrompt}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isSaving ? 'bg-slate-100 text-slate-400' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
            }`}
          >
            {isSaving ? 'Salvando...' : (
              <>
                <Save size={18} />
                Salvar Instrução
              </>
            )}
          </button>
        </div>
        <div className="p-6 flex-1 flex flex-col space-y-4 overflow-y-auto">
          <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl text-xs leading-relaxed flex items-start gap-3">
            <Sparkles size={16} className="shrink-0 mt-0.5" />
            <p>
              Este prompt define a "personalidade" do seu Garçom IA. Seja específico sobre comportamento, 
              linguagem preferida e como ele deve lidar com situações comuns como alergias ou reclamações.
            </p>
          </div>
          <div className="flex-1">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-full min-h-[300px] p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 text-slate-700 text-sm font-mono leading-relaxed"
              placeholder="Digite as instruções do sistema para a IA..."
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl shadow-xl flex flex-col overflow-hidden border border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <MessageSquare size={20} className="text-orange-500" />
            <span className="font-bold">Ambiente de Testes</span>
          </div>
          <button 
            onClick={() => setMessages([])}
            className="text-slate-400 hover:text-white transition-all p-2 rounded-lg hover:bg-slate-800"
          >
            <History size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                <Bot className="text-slate-400" size={32} />
              </div>
              <div>
                <p className="text-white font-bold">Nenhuma mensagem ainda</p>
                <p className="text-slate-400 text-sm">Envie uma mensagem para testar suas instruções.</p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-orange-500 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Itens Sugeridos</p>
                    {msg.suggestions.map((s, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                        <span className="text-xs font-medium text-orange-400">{s.itemId} x{s.quantity}</span>
                        <span className="text-[10px] text-slate-400 italic truncate max-w-[150px]">{s.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none animate-pulse flex gap-2">
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce [animation-delay:-.5s]"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="relative">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Fale com o garçom..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl pl-5 pr-14 py-4 outline-none focus:border-orange-500 transition-all placeholder:text-slate-500"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !testInput.trim()}
              className="absolute right-2 top-2 p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFineTuning;
