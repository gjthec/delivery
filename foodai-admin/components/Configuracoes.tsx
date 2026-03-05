import React, { useEffect, useState } from 'react';
import { dbSettings } from '../services/dbService';
import { StoreSettings } from '../types';

const Configuracoes: React.FC = () => {
  const [form, setForm] = useState<StoreSettings>({ deliveryFee: 0 });
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    dbSettings.get().then(setForm);
  }, []);

  const handleChange = (field: keyof StoreSettings, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setStatus('saving');
      await dbSettings.save({
        ...form,
        deliveryFee: Number(form.deliveryFee || 0),
        averageTimeMinutes: Number(form.averageTimeMinutes || 0)
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Configurações</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <input value={form.companyName || ''} onChange={(e) => handleChange('companyName', e.target.value)} placeholder="Nome da empresa" className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3" />
        <input value={form.logoUrl || ''} onChange={(e) => handleChange('logoUrl', e.target.value)} placeholder="URL da logo" className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3" />
        <input value={form.openingHours || ''} onChange={(e) => handleChange('openingHours', e.target.value)} placeholder="Horário de funcionamento" className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3" />
        <input type="number" value={form.deliveryFee || 0} onChange={(e) => handleChange('deliveryFee', Number(e.target.value))} placeholder="Taxa de entrega" className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3" />
        <input type="number" value={form.averageTimeMinutes || 0} onChange={(e) => handleChange('averageTimeMinutes', Number(e.target.value))} placeholder="Tempo médio estimado (min)" className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-3" />
      </div>

      <button onClick={handleSave} className="mt-6 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-2xl font-bold" disabled={status === 'saving'}>
        {status === 'saving' ? 'Salvando...' : 'Salvar'}
      </button>
      {status === 'success' && <p className="text-green-600 mt-3">Configurações salvas com sucesso.</p>}
      {status === 'error' && <p className="text-red-600 mt-3">Erro ao salvar configurações.</p>}
    </section>
  );
};

export default Configuracoes;
