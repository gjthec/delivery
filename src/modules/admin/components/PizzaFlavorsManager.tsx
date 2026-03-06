import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { PizzaFlavor } from '../types';
import { dbPizzaFlavors } from '../services/dbService';

type FlavorTypeFilter = 'Todos' | 'Salgado' | 'Doce';

type FlavorDraft = {
  id?: string;
  name: string;
  flavorType: 'Salgado' | 'Doce';
  extraPrice: string;
  isActive: boolean;
};

const EMPTY_DRAFT: FlavorDraft = {
  name: '',
  flavorType: 'Salgado',
  extraPrice: '',
  isActive: true
};

const normalizeExtraPrice = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const PizzaFlavorsManager: React.FC = () => {
  const [flavors, setFlavors] = useState<PizzaFlavor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FlavorTypeFilter>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<FlavorDraft>(EMPTY_DRAFT);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PizzaFlavor | null>(null);

  const loadFlavors = async () => {
    setIsLoading(true);
    try {
      const data = await dbPizzaFlavors.getAll();
      setFlavors(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlavors();
  }, []);

  const openNewModal = () => {
    setDraft(EMPTY_DRAFT);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (flavor: PizzaFlavor) => {
    setDraft({
      id: flavor.id,
      name: flavor.name,
      flavorType: flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado',
      extraPrice: typeof flavor.extraPrice === 'number' ? String(flavor.extraPrice) : '',
      isActive: flavor.active !== false
    });
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setDraft(EMPTY_DRAFT);
    setError('');
  };

  const filteredFlavors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return flavors.filter((flavor) => {
      const matchesQuery = !normalizedQuery || flavor.name.toLowerCase().includes(normalizedQuery);
      const normalizedType = flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado';
      const matchesType = typeFilter === 'Todos' || normalizedType === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [flavors, query, typeFilter]);

  const validateDraft = () => {
    if (!draft.name.trim()) return 'Informe o nome do sabor.';
    if (!draft.flavorType) return 'Selecione o tipo do sabor.';

    const normalizedName = draft.name.trim().toLowerCase();
    const duplicate = flavors.find(
      (flavor) => flavor.id !== draft.id && flavor.name.trim().toLowerCase() === normalizedName
    );
    if (duplicate) return 'Já existe um sabor com esse nome.';

    if (draft.extraPrice.trim() && normalizeExtraPrice(draft.extraPrice) === null) {
      return 'Preço extra inválido.';
    }

    return '';
  };

  const handleSave = async () => {
    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const id = draft.id || `flavor-${Date.now()}`;
      const extraPrice = normalizeExtraPrice(draft.extraPrice);

      await dbPizzaFlavors.save({
        id,
        name: draft.name.trim(),
        flavorType: draft.flavorType,
        active: draft.isActive,
        extraPrice,
        tags: [],
        ingredients: [],
        priceDeltaBySize: null,
        description: null,
        imageUrl: null
      });

      await loadFlavors();
      closeModal();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (flavor: PizzaFlavor) => {
    await dbPizzaFlavors.save({
      ...flavor,
      flavorType: flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado',
      active: flavor.active === false,
      tags: flavor.tags || [],
      ingredients: flavor.ingredients || [],
      priceDeltaBySize: flavor.priceDeltaBySize || null,
      extraPrice: typeof flavor.extraPrice === 'number' ? flavor.extraPrice : null
    });
    await loadFlavors();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await dbPizzaFlavors.delete(deleteTarget.id);
    setDeleteTarget(null);
    await loadFlavors();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] p-6 lg:p-8 shadow-sm">
        <h1 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-stone-800 dark:text-white">Sabores de Pizza</h1>
        <p className="text-sm text-stone-400 font-medium mt-1">Cadastre os sabores disponíveis para montagem das pizzas.</p>

        <div className="mt-6 flex flex-col lg:flex-row gap-3 lg:items-center">
          <button
            onClick={openNewModal}
            className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-5 py-3 rounded-2xl font-black uppercase text-[11px] tracking-wide hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} /> Novo sabor
          </button>

          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome"
              className="w-full bg-stone-50 dark:bg-stone-800 pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 text-sm font-medium"
            />
          </div>

          <div className="flex bg-stone-50 dark:bg-stone-800 p-1 rounded-2xl border border-stone-200 dark:border-stone-700">
            {(['Todos', 'Salgado', 'Doce'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setTypeFilter(option)}
                className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase transition-colors ${
                  typeFilter === option
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                    : 'text-stone-500'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-stone-100 dark:border-stone-800 text-[10px] font-black uppercase tracking-widest text-stone-400">
          <span className="col-span-4">Nome do sabor</span>
          <span className="col-span-2">Tipo</span>
          <span className="col-span-2">Preço extra</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2 text-right">Ações</span>
        </div>

        {isLoading ? (
          <p className="p-6 text-sm text-stone-500">Carregando sabores...</p>
        ) : filteredFlavors.length === 0 ? (
          <p className="p-8 text-sm text-stone-400">Nenhum sabor encontrado com os filtros atuais.</p>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredFlavors.map((flavor) => {
              const normalizedType = flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado';
              const isActive = flavor.active !== false;
              const extraPrice = typeof flavor.extraPrice === 'number' ? `R$ ${flavor.extraPrice.toFixed(2)}` : '—';

              return (
                <div key={flavor.id} className="grid grid-cols-12 gap-2 items-center px-5 py-4 text-sm">
                  <p className="col-span-4 font-bold text-stone-800 dark:text-stone-100">{flavor.name}</p>
                  <p className="col-span-2 text-stone-600 dark:text-stone-300">{normalizedType}</p>
                  <p className="col-span-2 text-stone-600 dark:text-stone-300">{extraPrice}</p>
                  <div className="col-span-2">
                    <button
                      onClick={() => handleToggleStatus(flavor)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${
                        isActive ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {isActive ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(flavor)}
                      className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600"
                      title="Editar sabor"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(flavor)}
                      className="p-2 rounded-xl bg-red-50 text-red-600"
                      title="Excluir sabor"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-xl z-[210] flex items-center justify-center p-3">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
              <h2 className="text-lg font-black uppercase tracking-tight text-stone-800 dark:text-white">{draft.id ? 'Editar sabor' : 'Novo sabor'}</h2>
              <button onClick={closeModal} className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Nome do sabor</label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Frango com Catupiry"
                  className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Tipo</label>
                  <select
                    value={draft.flavorType}
                    onChange={(e) => setDraft((prev) => ({ ...prev, flavorType: e.target.value as 'Salgado' | 'Doce' }))}
                    className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700"
                  >
                    <option value="Salgado">Salgado</option>
                    <option value="Doce">Doce</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Preço extra</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft.extraPrice}
                    onChange={(e) => setDraft((prev) => ({ ...prev, extraPrice: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-200">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-stone-300"
                />
                Ativo
              </label>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="p-5 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 text-xs font-black uppercase">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase disabled:opacity-60"
              >
                {isSaving ? 'Salvando...' : 'Salvar sabor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-xl z-[220] flex items-center justify-center p-3">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-black uppercase text-stone-800 dark:text-white">Excluir sabor</h3>
            <p className="text-sm text-stone-500">Tem certeza que deseja excluir o sabor <strong>{deleteTarget.name}</strong>?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-black uppercase text-stone-500">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-black uppercase">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PizzaFlavorsManager;
