
import React, { useState, useEffect } from 'react';
import { getSalesInsights } from '../services/aiService';
import { dbInsights, dbOrders } from '../services/dbService';
import { SalesInsightsData, SavedInsight } from '../types';
import { TrendingUp, RefreshCw, History, Calendar, Trash2, AlertCircle } from 'lucide-react';

const SalesInsights: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<SalesInsightsData | null>(null);
  const [history, setHistory] = useState<SavedInsight[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await dbInsights.getHistory();
    setHistory(data);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const orders = await dbOrders.getAll();
      const result = await getSalesInsights(orders);
      setInsights(result);
      await dbInsights.save(result);
      loadHistory();
    } catch (e: unknown) {
      console.error("Erro ao gerar insights:", e);
      if (e instanceof Error && (e.message?.includes('429') || e.message?.includes('quota'))) {
        setError("Limite de cota atingido. Por favor, aguarde um minuto e tente novamente.");
      } else {
        setError("Ocorreu um erro ao processar os dados com IA.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 uppercase">Insights IA</h1>
          <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Análise preditiva de faturamento</p>
        </div>
        <button 
          onClick={handleGenerate} 
          disabled={loading} 
          className="bg-stone-900 dark:bg-orange-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          {loading ? <RefreshCw className="animate-spin" size={16} /> : <TrendingUp size={16} />} 
          {loading ? 'PROCESSANDO...' : 'NOVA ANÁLISE'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-6 rounded-[2rem] flex items-start gap-4 animate-in slide-in-from-top-2">
          <AlertCircle className="text-red-500 shrink-0" size={24} />
          <div>
            <h4 className="text-sm font-black text-red-800 dark:text-red-200 uppercase">Falha na Inteligência</h4>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {insights ? (
            <div className="bg-white dark:bg-stone-900 p-10 rounded-[3rem] border border-stone-100 dark:border-stone-800 shadow-sm animate-in fade-in duration-500">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-orange-500 rounded-2xl text-white">
                  <TrendingUp size={24} />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-stone-800 dark:text-white uppercase">Resumo Executivo</h2>
              </div>
              
              <div className="space-y-8">
                <div className="p-8 bg-stone-50 dark:bg-stone-800/50 rounded-[2.5rem] border border-stone-100 dark:border-stone-700">
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed font-medium italic">"{insights.summary}"</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="p-6 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-3xl">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Faturamento Analisado</p>
                      <p className="text-2xl font-black text-stone-900 dark:text-white">R$ {insights.kpis.revenue.toFixed(2)}</p>
                   </div>
                   <div className="p-6 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-3xl">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Volume de Pedidos</p>
                      <p className="text-2xl font-black text-stone-900 dark:text-white">{insights.kpis.orders} vds</p>
                   </div>
                   <div className="p-6 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-3xl">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Ticket Médio</p>
                      <p className="text-2xl font-black text-orange-500">R$ {insights.kpis.avgTicket.toFixed(2)}</p>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900/50 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-6 text-stone-300">
                <Calendar size={40} />
              </div>
              <h3 className="text-lg font-black text-stone-800 dark:text-stone-200 uppercase tracking-tight">Sem análise ativa</h3>
              <p className="text-sm text-stone-400 max-w-xs mt-2 font-medium">Clique no botão acima para processar os dados reais e obter insights estratégicos.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
            <History size={14} className="text-orange-500" /> Histórico de Consultoria
          </h3>
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 dark:bg-stone-900/50 rounded-3xl border border-stone-100 dark:border-stone-800">
                <p className="text-[10px] font-black text-stone-300 uppercase">Nenhum registro</p>
              </div>
            ) : (
              history.map(h => (
                <button 
                  key={h.id} 
                  onClick={() => { setInsights(h.data); setError(null); }} 
                  className={`w-full text-left p-5 rounded-[2rem] border transition-all group ${insights?.summary === h.data.summary ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-orange-500'}`}
                >
                  <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${insights?.summary === h.data.summary ? 'text-white/70' : 'text-orange-500'}`}>{h.id}</div>
                  <div className={`font-black text-xs uppercase ${insights?.summary === h.data.summary ? 'text-white' : 'text-stone-800 dark:text-stone-200'}`}>{new Date(h.date).toLocaleDateString()}</div>
                  <div className={`text-[10px] mt-2 truncate font-medium ${insights?.summary === h.data.summary ? 'text-white/60' : 'text-stone-400'}`}>{h.data.summary}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesInsights;
