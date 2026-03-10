
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, Users, Star, TrendingUp, ArrowUpRight, Clock, ChevronRight, Package, ChevronUp } from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

const data = [
  { name: 'Seg', vendas: 4000, pedidos: 240 },
  { name: 'Ter', vendas: 3000, pedidos: 198 },
  { name: 'Qua', vendas: 5000, pedidos: 305 },
  { name: 'Qui', vendas: 2780, pedidos: 170 },
  { name: 'Sex', vendas: 6890, pedidos: 420 },
  { name: 'Sáb', vendas: 8390, pedidos: 510 },
  { name: 'Dom', vendas: 7490, pedidos: 480 },
];

const categorySales = [
  { name: 'Hambúrgueres', value: 450, color: '#FB923C', percent: '45%', lucro: 2450.00, quantidade: 450, receita: 11205.00 },
  { name: 'Pizzas', value: 300, color: '#F87171', percent: '25%', lucro: 1800.00, quantidade: 300, receita: 8900.50 },
  { name: 'Saudáveis', value: 200, color: '#4ADE80', percent: '18%', lucro: 950.00, quantidade: 200, receita: 4500.00 },
  { name: 'Bebidas', value: 150, color: '#60A5FA', percent: '12%', lucro: 600.00, quantidade: 150, receita: 2100.00 },
];

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 pointer-events-none min-w-[240px] z-50">
        <div className="flex items-center gap-3 mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
          <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: data.color }}></div>
          <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{data.name}</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5"><Package size={12}/> Vendas</span>
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">{data.quantidade} un.</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5"><TrendingUp size={12}/> Receita</span>
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">R$ {data.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-1.5"><DollarSign size={12}/> Lucro Líquido</span>
            <span className="text-base font-black text-orange-600 dark:text-orange-400">R$ {data.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const kpiNavigationMap: Record<string, string> = {
    'Receita Líquida': 'sales-insights',
    'Pedidos Totais': 'orders',
    'Clientes Fiéis': 'clientes-fieis',
    'Satisfação': 'satisfacao'
  };

  const handleKpiNavigation = (label: string) => {
    const targetTab = kpiNavigationMap[label];
    if (targetTab) setActiveTab(targetTab);
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Hub de Operações
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Seu restaurante está com performance <span className="text-green-500 font-bold">12% acima</span> da média hoje.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            {['7D', '30D', '1Y'].map(f => (
              <button key={f} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${f === '7D' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Receita Líquida', value: 'R$ 12.8k', change: '+12%', icon: DollarSign, color: 'orange' },
          { label: 'Pedidos Totais', value: '1.240', change: '+18%', icon: ShoppingBag, color: 'blue' },
          { label: 'Clientes Fiéis', value: '842', change: '+5%', icon: Users, color: 'green' },
          { label: 'Satisfação', value: '4.9', change: '+0.1', icon: Star, color: 'yellow' },
        ].map((stat, i) => (
          <div key={i} className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => handleKpiNavigation(stat.label)}>
            <div className={`absolute top-0 right-0 p-4 opacity-10 text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
              <stat.icon size={64} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                  <stat.icon size={20} />
                </div>
                <div className="flex items-center text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-full uppercase">
                  <ArrowUpRight size={10} className="mr-0.5" /> {stat.change}
                </div>
              </div>
              <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</h3>
              <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Fluxo Financeiro</h3>
              <p className="text-sm text-slate-400 font-medium">Volume de vendas nos últimos 7 dias</p>
            </div>
            <TrendingUp className="text-orange-500" size={24} />
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
                  }}
                  itemStyle={{ color: '#f97316', fontWeight: 800 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#f97316" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#f97316' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendas por Categoria - Estável e Bunitinho */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="mb-2">
              <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Vendas por Categoria</h3>
              <p className="text-xs text-slate-400 font-medium">Passe o mouse no gráfico para detalhes</p>
            </div>
            
            <div className="h-48 relative mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                  >
                    {categorySales.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        cornerRadius={12} 
                        className="outline-none cursor-pointer hover:opacity-80 transition-all duration-300"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} wrapperStyle={{ outline: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Texto central que desaparece no hover para não poluir visualmente */}
              <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300 ${activeIndex !== null ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                <span className="text-2xl font-black text-slate-800 dark:text-white">1.1k</span>
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Total</span>
              </div>
            </div>

            <div className="space-y-2 mt-6 overflow-y-auto custom-scrollbar max-h-60 pr-1">
              {categorySales.map((cat, i) => (
                <div key={i} className="flex flex-col p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 group transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: cat.color}}></div>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{cat.name}</span>
                    </div>
                    <span className="text-[11px] font-black text-slate-800 dark:text-white">{cat.percent}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{backgroundColor: cat.color, width: cat.percent}}></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-orange-500">R$ {cat.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                      <ChevronUp size={10} className="text-green-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-orange-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group cursor-pointer" onClick={() => setActiveTab('sales-insights')}>
            <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform duration-700">
               <TrendingUp size={160} />
            </div>
            <h3 className="text-xl font-black mb-2 relative z-10">Meta Diária</h3>
            <p className="text-orange-100 text-sm mb-6 relative z-10">Faltam apenas <b>R$ 1.200</b> hoje!</p>
            <div className="w-full h-3 bg-white/20 rounded-full mb-2 overflow-hidden relative z-10">
              <div className="h-full bg-white rounded-full w-[85%] shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest relative z-10">
              <span>R$ 10.8k / 12k</span>
              <span>85%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Hub */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Atividade Recente</h3>
            <p className="text-sm text-slate-400 font-medium">Últimos pedidos realizados na plataforma</p>
          </div>
          <button 
            onClick={() => setActiveTab('orders')}
            className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
          >
            Ver Todos <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'PED-902', name: 'Marcos Silva', price: 'R$ 84,90', status: 'Preparo', color: 'blue' },
            { id: 'PED-901', name: 'Ana Oliveira', price: 'R$ 42,00', status: 'Entrega', color: 'purple' },
            { id: 'PED-900', name: 'Breno Rocha', price: 'R$ 126,30', status: 'Novo', color: 'orange' },
          ].map((order, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:border-orange-500/30 transition-all cursor-pointer group" onClick={() => setActiveTab('orders')}>
              <div className={`w-12 h-12 rounded-2xl bg-${order.color}-500/10 text-${order.color}-500 flex items-center justify-center shrink-0`}>
                <Clock size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-0.5">{order.id}</p>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{order.name}</h4>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-800 dark:text-white">{order.price}</p>
                <span className={`text-[10px] font-black uppercase text-${order.color}-500`}>{order.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
