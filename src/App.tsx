import React from 'react';
import CustomerApp from './modules/customer/CustomerApp';
import AdminApp from './modules/admin/App';

const App: React.FC = () => {
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <AdminApp />;
  }

  return <CustomerApp />;
};

export default App;
