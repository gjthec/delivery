
import React, { useState, useRef, useEffect } from 'react';
import { chatWithOwner } from '../services/aiService';
import { INITIAL_MENU, INITIAL_ORDERS } from '../mockData';
import { OwnerChatResponse } from '../types';
import { 
  Send, Bot, X, Zap, ArrowRight
} from 'lucide-react';

interface OwnerChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const OwnerChat: React.FC<OwnerChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai', content?: string, data?: OwnerChatResponse }>>([
    { role: 'ai', content: 'Olá! Sou seu consultor estratégico. Como posso ajudar com a gestão do seu restaurante hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setLoading(true);

    try {
      const result = await chatWithOwner(textToSend, { 
        menu: INITIAL_MENU, 
        orders: INITIAL_ORDERS, 
        combos: [] 
      });
      setMessages(prev => [...prev, { role: 'ai', data: result }]);
    } catch (e) {
      console.error("Erro no chat:", e);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'Desculpe, tive um problema ao processar sua solicitação. Pode tentar novamente?' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:right-8 z-[500] flex flex-col pointer-events-none w-[calc(100vw-32px)] sm:w-[420px]">
      <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.4)] border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500 pointer-events-auto h-[75vh] max-h-[calc(100vh-140px)]">
        
        {/* Header - Glass Style */}
        <div className="px-6 py-5 flex items-center justify-between bg-stone-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Bot size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-tight">Consultor Estratégico</h3>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-400 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                IA Estratégica
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-stone-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensagens */}
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar bg-stone-50/20 dark:bg-stone-950/20"
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex flex-col gap-1.5 max-w-[90%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-3xl text-[13px] font-medium leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-orange-500 text-white rounded-tr-none shadow-md shadow-orange-500/10' 
                    : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 rounded-tl-none shadow-sm'
                }`}>
                  {msg.content && <p>{msg.content}</p>}
                  
                  {msg.data && (
                    <div className="space-y-4">
                      <p className="font-bold">{msg.data.answer}</p>
                      {msg.data.bullets && msg.data.bullets.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {msg.data.bullets.map((b, idx) => (
                            <div key={idx} className="flex gap-2.5 text-[11px] text-stone-600 dark:text-stone-400">
                              <Zap size={13} className="text-orange-500 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {msg.data.actions && msg.data.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-3">
                          {msg.data.actions.map((action, idx) => (
                            <button 
                              key={idx}
                              className="px-3 py-1.5 bg-stone-900 dark:bg-orange-500 text-white text-[9px] font-black uppercase rounded-lg hover:opacity-80 transition-all flex items-center gap-1.5"
                              onClick={() => handleSend(action.label)}
                            >
                              {action.label} <ArrowRight size={10} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl rounded-tl-none border border-stone-200 dark:border-stone-700 flex gap-1 shadow-sm">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte sobre vendas ou cardápio..."
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl pl-5 pr-14 py-4 outline-none focus:border-orange-500 transition-all text-sm font-bold shadow-inner dark:text-white"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 p-3 bg-orange-500 text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-30"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-center text-[8px] font-black text-stone-400 uppercase tracking-widest mt-4">
            Alimentado por Gemini 3 Pro
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerChat;
