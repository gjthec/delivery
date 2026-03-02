import React, { useEffect, useState } from 'react';
import { Loader2, User, X } from 'lucide-react';
import { fetchOrdersByPhone } from '../services/firebaseService';
import { Address } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [phone, setPhone] = useState(() => localStorage.getItem('foodai-customer-phone') || '');
  const [name, setName] = useState(() => localStorage.getItem('foodai-customer-name') || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && phone) {
      handleSearch();
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!phone.trim()) return;

    setIsLoading(true);
    localStorage.setItem('foodai-customer-phone', phone);

    const fetchedOrders = await fetchOrdersByPhone(phone);

    if (fetchedOrders && fetchedOrders.length > 0) {
      const latestOrder = fetchedOrders[0];
      if (!name && latestOrder.customer?.name) {
        setName(latestOrder.customer.name);
        localStorage.setItem('foodai-customer-name', latestOrder.customer.name);
      }

      const savedAddressesStr = localStorage.getItem('foodai-addresses');
      const savedAddresses: Address[] = savedAddressesStr ? JSON.parse(savedAddressesStr) : [];
      let addressesUpdated = false;

      fetchedOrders.forEach((order) => {
        if (!order.customer?.address) return;

        const addr = order.customer.address;
        const exists = savedAddresses.some((existing) => (
          existing.street === addr.street
          && existing.number === addr.number
          && existing.zipCode === addr.zipCode
        ));

        if (!exists) {
          savedAddresses.push({ ...addr, id: Math.random().toString(36).substring(2, 11) });
          addressesUpdated = true;
        }
      });

      if (addressesUpdated) {
        localStorage.setItem('foodai-addresses', JSON.stringify(savedAddresses));
      }
    }

    setIsLoading(false);
  };

  const handleSaveProfile = () => {
    localStorage.setItem('foodai-customer-name', name);
    localStorage.setItem('foodai-customer-phone', phone);
    alert('Perfil salvo com sucesso!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-end sm:items-center justify-center sm:px-6">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 sm:rounded-[3rem] rounded-t-[2.5rem] h-[85vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500">
        <div className="px-8 py-6 flex items-center justify-between shrink-0 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter">Meu Perfil</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Dados Pessoais</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900 text-zinc-400 hover:text-orange-500 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 hide-scrollbar">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 px-2">Identificação</h3>
            <div className="p-5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2 px-1">Telefone / WhatsApp</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="Ex: (11) 99999-9999"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 focus:border-orange-500/50 rounded-2xl px-4 py-3 text-sm font-black outline-none transition-all"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || !phone.trim()}
                    className="px-6 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
                  </button>
                </div>
                <p className="text-[9px] text-zinc-400 mt-2 px-1">Use seu telefone para buscar seu histórico de pedidos.</p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2 px-1">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 focus:border-orange-500/50 rounded-2xl px-4 py-3 text-sm font-black outline-none transition-all"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
              >
                Salvar Dados
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
