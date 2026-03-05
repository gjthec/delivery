import React, { useEffect, useState } from 'react';
import { dbLoyalCustomers, LoyalCustomer } from '../services/dbService';

const ClientesFieis: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<LoyalCustomer[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setCustomers(await dbLoyalCustomers.getAll());
      } catch {
        setError('Não foi possível carregar os clientes fiéis.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <section>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Clientes Fiéis</h2>
      {loading && <p>Carregando clientes...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && customers.length === 0 && <p>Nenhum cliente fiel encontrado.</p>}
      {!loading && customers.length > 0 && (
        <div className="space-y-3">
          {customers.map((customer) => (
            <div key={customer.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="font-bold">{customer.name}</p>
              <p className="text-sm text-slate-500">Pedidos: {customer.totalOrders}</p>
              <p className="text-sm text-slate-500">Ticket médio: R$ {customer.averageTicket.toFixed(2)}</p>
              <p className="text-sm text-slate-500">Última compra: {new Date(customer.lastPurchase).toLocaleDateString('pt-BR')}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ClientesFieis;
