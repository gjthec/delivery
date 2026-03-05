import React from 'react';
import ClientHome from './pages/ClientHome';
import AdminApp from './modules/admin/App';

const App: React.FC = () => {
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <AdminApp />;
  }

  return <ClientHome />;
};

export default App;
