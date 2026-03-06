import React from 'react';
import { LayoutDashboard, Utensils, ClipboardList, TrendingUp, Sparkles, Package, LogOut, HeartHandshake, SmilePlus, Settings } from 'lucide-react';
import { useCompanyName } from '../../../hooks/useCompanyName';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const { companyName } = useCompanyName();
  const adminCompanyName = companyName?.trim() ? companyName : 'Cadastre sua empresa';
  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu', label: 'Cardápio', icon: Utensils },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList },
    { id: 'clientes-fieis', label: 'Clientes Fiéis', icon: HeartHandshake },
    { id: 'satisfacao', label: 'Satisfação', icon: SmilePlus },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  const aiItems = [
    { id: 'sales-insights', label: 'Insights IA', icon: TrendingUp },
    { id: 'combos-ai', label: 'Combos IA', icon: Package },
    { id: 'menu-ai', label: 'Copywriter IA', icon: Sparkles },
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-950 h-screen border-r border-slate-200 dark:border-slate-900 flex flex-col fixed left-0 top-0 z-20 transition-all duration-300">
      <div className="p-8 border-b border-slate-100 dark:border-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-orange-500/20 transform -rotate-3">
            P
          </div>
          <span className="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">
            <span className="text-orange-500">{adminCompanyName}</span>
          </span>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-10 overflow-y-auto custom-scrollbar">
        <div>
          <p className="px-4 mb-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Sistemas</p>
          <nav className="space-y-2">
            {mainItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                  activeTab === item.id
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <item.icon size={20} className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div>
          <p className="px-4 mb-4 text-[10px] font-black text-orange-500/60 dark:text-orange-500/40 uppercase tracking-[0.2em] flex items-center gap-2">
            Inteligência <Sparkles size={12} />
          </p>
          <nav className="space-y-2">
            {aiItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                  activeTab === item.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl'
                    : 'text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <item.icon size={20} className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-6">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-500 hover:bg-red-500 dark:hover:bg-red-500 hover:text-white rounded-[1.5rem] transition-all duration-300 font-bold text-sm">
          <LogOut size={18} />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
