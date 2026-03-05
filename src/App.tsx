import React from 'react';
import ClientHome from './pages/ClientHome';
import AdminApp from './modules/admin/App';
import { useCompanyName } from './hooks/useCompanyName';

const App: React.FC = () => {
  const { companyName } = useCompanyName();
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  React.useEffect(() => {
    document.title = `${companyName} - Sabor em cada clique`;
  }, [companyName]);

  if (isAdminRoute) {
    return <AdminApp />;
  }

  return <ClientHome />;
};

export default App;
