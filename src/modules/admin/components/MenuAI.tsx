
import React, { useState, useEffect } from 'react';
import { improveMenuItem } from '../services/aiService';
import { INITIAL_MENU } from '../mockData';
import { MenuItem, MenuCopy } from '../types';
import { 
  Sparkles, RefreshCw, Check, Star, Tag, 
  ArrowRight, AlertCircle, ShoppingCart, 
  ChevronRight, Wand2, CheckCircle2, Zap 
} from 'lucide-react';

const MenuAI: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ id: string, copy: MenuCopy } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Carregar menu sincronizado
  useEffect(() => {
    const saved = localStorage.getItem('platform_dynamic_menu');
    if (saved) {
      setMenu(JSON.parse(saved));
    } else {
      setMenu(INITIAL_MENU);
      localStorage.setItem('platform_dynamic_menu', JSON.stringify(INITIAL_MENU));
    }
  }, []);

  const handleImprove = async (item: MenuItem) => {
    setLoadingId(item.id);
    setPreview(null);
    try {
      const result = await improveMenuItem(item);
      setPreview({ id: item.id, copy: result });
    } catch (e) {
      console.error(e);
      alert("Erro ao conectar com a IA de Redação. Verifique sua conexão.");
    } finally {
      setLoadingId(null);
    }
  };

  const applyChanges = () => {
    if (!preview) return;
    
    const updatedMenu = menu.map(item => item.id === preview.id ? {
      ...item,
      name: preview.copy.newName,
      description: preview.copy.descriptionLong,
      tags: preview.copy.tags
    } : item);

    setMenu(updatedMenu);
    localStorage.setItem('platform_dynamic_menu', JSON.stringify(updatedMenu));
    
    const itemName = preview.copy.newName;
    setPreview(null);
    setSuccessMsg(`Prato "${itemName}" atualizado com sucesso no cardápio!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 uppercase tracking-tight">Copywriter Estratégico IA</h1>
          <p className="text-stone-500 dark:text-stone-400 font-medium">Use nossa inteligência para criar descrições que dão água na boca.</p>
        </div>
        {successMsg && (
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg">
            <CheckCircle2 size={18} />
            <span className="text-xs font-black uppercase tracking-tight">{successMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        {/* Lista de Seleção */}
        <div className="xl:col-span-2 bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-6 border-b border-stone-50 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/20">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShoppingCart size={14} /> Selecione para Otimizar
            </h3>
          </div>
          <div className="divide-y divide-stone-50 dark:divide-stone-800 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {menu.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleImprove(item)}
                disabled={loadingId === item.id}
                className={`w-full text-left p-6 flex items-center justify-between group transition-all hover:bg-stone-50 dark:hover:bg-stone-800/50 ${preview?.id === item.id ? 'bg-orange-50/50 dark:bg-orange-500/5 border-l-4 border-orange-500' : ''}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <img src={item.imageUrl} className="w-14 h-14 rounded-2xl object-cover border border-stone-200 dark:border-stone-700 shadow-sm" />
                    {loadingId === item.id && (
                      <div className="absolute inset-0 bg-stone-900/60 rounded-2xl flex items-center justify-center">
                        <RefreshCw className="animate-spin text-white" size={20} />
                      </div>
                    )}
                  </div>
                  <div className="truncate">
                    <div className="font-black text-stone-800 dark:text-stone-100 text-sm uppercase truncate group-hover:text-orange-500 transition-colors">{item.name}</div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase mt-0.5">{item.category}</div>
                  </div>
                </div>
                <div className={`p-3 rounded-xl transition-all ${loadingId === item.id ? 'bg-stone-100 dark:bg-stone-800 text-stone-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110'}`}>
                  <Sparkles size={18} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Panel - Luxury Design */}
        <div className="xl:col-span-3 bg-stone-900 dark:bg-stone-950 rounded-[3rem] p-10 text-white min-h-[600px] flex flex-col shadow-2xl relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full -translate-y-40 translate-x-40 blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full translate-y-40 -translate-x-40 blur-[100px] pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Wand2 className="text-orange-500" size={28} />
              Engenharia de Texto IA
            </h2>
            {preview && (
              <div className="px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse">
                Sugestão Pronta
              </div>
            )}
          </div>

          {!preview && !loadingId && (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 relative z-10">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Sparkles size={48} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-black uppercase">Pronto para impressionar?</h3>
              <p className="max-w-xs mt-2 text-sm font-medium">Selecione um item do cardápio à esquerda para que nossa IA reescreva sua apresentação com foco em vendas.</p>
            </div>
          )}

          {loadingId && !preview && (
            <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
              <RefreshCw className="animate-spin text-orange-500 mb-6" size={56} />
              <p className="text-sm font-black uppercase tracking-[0.2em] text-stone-400">Analisando Ingredientes e Perfil de Sabor...</p>
            </div>
          )}

          {preview && (
            <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500 relative z-10">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <ChevronRight size={14} className="text-orange-500" /> Título Comercial Sugerido
                </p>
                <h3 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tighter italic">{preview.copy.newName}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">Slogan de Venda</p>
                  <div className="p-5 bg-white/5 rounded-[2rem] border-l-4 border-orange-500 italic font-medium text-lg text-orange-100">
                    "{preview.copy.descriptionShort}"
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">Selos de Atração</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.copy.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-orange-500/10">
                        <Tag size={10} /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">Descrição Detalhada do Menu</p>
                <p className="text-base text-stone-300 leading-relaxed font-medium bg-white/5 p-6 rounded-[2.5rem] border border-white/10">
                  {preview.copy.descriptionLong}
                </p>
              </div>

              <div className="bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/20 flex items-start gap-4">
                <div className="p-2 bg-emerald-500 rounded-xl text-white shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Dica IA de Upsell (Venda Casada)</p>
                  <p className="text-sm text-stone-200 font-bold italic">{preview.copy.upsellSuggestion}</p>
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <button 
                  onClick={() => setPreview(null)}
                  className="flex-1 py-5 px-6 rounded-[1.5rem] border border-stone-700 font-black text-xs uppercase tracking-widest hover:bg-stone-800 transition-all text-stone-400"
                >
                  Descartar
                </button>
                <button 
                  onClick={applyChanges}
                  className="flex-[2] py-5 px-6 rounded-[1.5rem] bg-orange-500 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-orange-500/20 hover:bg-orange-600 hover:scale-[1.02] transition-all"
                >
                  <Check size={20} /> Aplicar no Cardápio Agora
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuAI;
