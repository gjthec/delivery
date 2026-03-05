import React, { useState, useEffect } from 'react';
import { getComboSuggestions } from '../services/aiService';
import { dbCombos, dbMenu } from '../services/dbService';
import { ComboSuggestions, Combo } from '../types';
import { 
  Package, RefreshCw, Sparkles, Trash2
} from 'lucide-react';

const ComboAI: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ComboSuggestions | null>(null);
  const [activeCombos, setActiveCombos] = useState<Combo[]>([]);

  useEffect(() => {
    loadCombos();
  }, []);

  const loadCombos = async () => {
    const data = await dbCombos.getAll();
    setActiveCombos(data);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const menu = await dbMenu.getAll();
      const result = await getComboSuggestions(menu, "Aumentar Ticket Médio", 3);
      setSuggestions(result);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCombo = async (suggestion: any) => {
    const newCombo: Combo = {
      id: '',
      name: suggestion.name,
      description: suggestion.description,
      items: suggestion.items,
      price: suggestion.suggestedPrice,
      discountPercent: suggestion.suggestedDiscountPercent,
      active: true
    };
    await dbCombos.save(newCombo);
    loadCombos();
    setSuggestions(null);
  };

  const handleDelete = async (id: string) => {
    await dbCombos.delete(id);
    loadCombos();
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 uppercase">Engenharia de Combos IA</h1>
          <p className="text-stone-500">Dados integrados com persistência híbrida.</p>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black uppercase shadow-xl hover:bg-orange-600 transition-colors cursor-pointer flex items-center">
          {loading ? <RefreshCw className="animate-spin mr-2" /> : <Sparkles className="inline mr-2" />} GERAR COMBOS
        </button>
      </div>

      {suggestions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
          {suggestions.combos.map((c, i) => (
            <div key={i} className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-lg">
              <h3 className="font-black text-xl mb-4 text-stone-800 dark:text-stone-100">{c.name}</h3>
              <p className="text-sm text-stone-500 mb-4">{c.description}</p>
              <div className="mb-4">
                <ul className="text-xs text-stone-500 list-disc list-inside">
                    {c.items.map((item, idx) => (
                      <li key={`${item.id}-${idx}`}>
                        {item.qty}x {item.name}
                      </li>
                    ))}
                </ul>
              </div>
              <p className="text-2xl font-black text-orange-500 mb-6">R$ {c.suggestedPrice.toFixed(2)}</p>
              <button onClick={() => handleAddCombo(c)} className="w-full py-3 bg-stone-900 dark:bg-stone-700 text-white rounded-xl font-black uppercase text-xs hover:bg-stone-800 transition-colors cursor-pointer">Ativar Combo</button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase text-stone-400 tracking-widest">Combos Ativos</h2>
        {activeCombos.length === 0 && (
            <p className="text-stone-400 text-sm italic">Nenhum combo ativo no momento.</p>
        )}
        {activeCombos.map(c => (
          <div key={c.id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl">
                <Package className="text-orange-500" />
              </div>
              <div>
                <span className="font-black uppercase block text-stone-800 dark:text-stone-100">{c.name}</span>
                <span className="text-xs text-stone-400 font-medium">R$ {c.price.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={() => handleDelete(c.id)} className="p-3 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all cursor-pointer"><Trash2 /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComboAI;
