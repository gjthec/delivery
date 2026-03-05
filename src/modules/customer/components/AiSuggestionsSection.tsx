import React from 'react';
import { ChefHat, Plus, X } from 'lucide-react';
import { MenuItem } from '../../../types';
import { AiSuggestion } from '../types/customer-app.types';

interface Props {
  aiSuggestions: AiSuggestion[];
  menuItems: MenuItem[];
  onClear: () => void;
  onOpenItemDetails: (item: MenuItem) => void;
  onAddSuggestion: (item: MenuItem, quantity: number) => void;
}

const AiSuggestionsSection: React.FC<Props> = ({ aiSuggestions, menuItems, onClear, onOpenItemDetails, onAddSuggestion }) => {
  if (aiSuggestions.length === 0) return null;

  return (
    <section className="px-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-orange-50/50 dark:bg-orange-950/10 rounded-[3rem] p-8 border border-orange-100 dark:border-orange-500/10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 orange-gradient rounded-2xl flex items-center justify-center text-white shadow-lg"><ChefHat size={28} /></div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter">Sugestões do Garçom AI</h2>
            <p className="text-xs font-bold text-orange-600/60 uppercase tracking-widest">Baseado no seu pedido</p>
          </div>
          <button onClick={onClear} className="ml-auto w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-zinc-400"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiSuggestions.map((suggestion, idx) => {
            const item = menuItems.find(i => i.id === suggestion.itemId);
            if (!item) return null;
            return (
              <div key={idx} className="bg-white dark:bg-zinc-900 rounded-[2rem] p-5 shadow-xl border border-zinc-100 dark:border-zinc-800 flex flex-col h-full" onClick={() => onOpenItemDetails(item)}>
                <div className="flex gap-4 mb-4">
                  <img src={item.imageUrl} className="w-16 h-16 rounded-2xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm truncate">{item.name}</h4>
                    <span className="text-xs font-bold text-orange-500">R$ {item.price.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-zinc-500 mb-6 flex-1 italic leading-relaxed">"{suggestion.reason}"</p>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddSuggestion(item, suggestion.quantity); }}
                  className="w-full py-3 orange-gradient text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                >
                  <Plus size={14} /> Adicionar {suggestion.quantity}x
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AiSuggestionsSection;
