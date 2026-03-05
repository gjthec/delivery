import React from 'react';
import { useOrders } from '../hooks/useOrders';

interface UserPanelOrdersProps {
  phone: string;
  isOpen: boolean;
}

const UserPanelOrders: React.FC<UserPanelOrdersProps> = ({ phone, isOpen }) => {
  const { orders, loading, error } = useOrders(phone, isOpen);

  if (!isOpen) return null;

  return (
    <div>
      {loading && <p>Carregando pedidos...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && <p>Total de pedidos: {orders.length}</p>}
    </div>
  );
};

export default UserPanelOrders;
