import React from 'react';
import { History, Leaf, Loader2, Search, Sparkles, Wallet, Zap } from 'lucide-react';
import CategoryIcon from '../../../components/CategoryIcon';
import { Category } from '../../../types';
import { QUICK_PROMPTS, RANDOM_PROMPT } from '../constants/customer.constants';
import { QuickPromptIcon } from '../types/customer-app.types';

interface Props {
  isAiLoading: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (value: boolean) => void;
  onAskWaiter: (query?: string) => Promise<void>;
  searchInputRef: React.RefObject<HTMLInputElement>;
  activeCategory: string | null;
  setActiveCategory: (value: string | null) => void;
  categories: Category[];
}

function renderPromptIcon(icon: QuickPromptIcon) {
  if (icon === 'wallet') return <Wallet size={16} className="text-orange-500" />;
  if (icon === 'leaf') return <Leaf size={16} className="text-green-500" />;
  if (icon === 'zap') return <Zap size={16} className="text-yellow-500" />;
  return <History size={16} className="text-blue-500" />;
}

const CustomerHeroSection: React.FC<Props> = ({
  isAiLoading,
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  onAskWaiter,
  searchInputRef,
  activeCategory,
  setActiveCategory,
  categories
}) => {
  return (
    <section className="px-6 pt-32 pb-4 bg-gradient-to-b from-orange-50/50 dark:from-orange-950/10 to-transparent">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-orange-100/50 dark:bg-orange-500/10 px-4 py-2 rounded-full mb-4 border border-orange-200/50 dark:border-orange-500/20">
          <Sparkles size={14} className="text-orange-600" />
          <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.2em]">Inteligência Gastronômica</span>
        </div>
        <h1 className="text-[2.75rem] font-[900] tracking-tighter leading-[0.9] mb-4">
          O que você quer <br /> <span className="text-orange-500 italic text-[3rem]">sentir hoje?</span>
        </h1>
      </div>

      <div className="relative group mb-8">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-colors text-orange-500 z-10">
          {isAiLoading ? <Loader2 size={22} className="animate-spin" /> : <Sparkles size={22} />}
        </div>
        <input
          ref={searchInputRef}
          type="text"
          className="w-full pl-14 pr-20 py-5 md:py-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.2rem] shadow-xl text-sm md:text-base font-semibold outline-none transition-all placeholder:truncate"
          placeholder='Ex: "Jantar leve para dois"'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          onKeyDown={(e) => e.key === 'Enter' && onAskWaiter()}
        />
        <button
          onClick={() => onAskWaiter()}
          disabled={isAiLoading || !searchQuery}
          className="absolute right-2.5 top-2.5 bottom-2.5 aspect-square orange-gradient text-white rounded-full flex items-center justify-center shadow-xl shadow-orange-500/20 disabled:opacity-30 transition-all active:scale-90"
        >
          {isAiLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} strokeWidth={3} />}
        </button>
      </div>

      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isSearchFocused && !searchQuery ? 'max-h-24 opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'}`}>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar px-1 snap-x snap-mandatory">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onAskWaiter(prompt.action)}
              className="flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-lg shadow-black/5 whitespace-nowrap hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all active:scale-95 snap-start"
            >
              {renderPromptIcon(prompt.icon)}
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{prompt.text}</span>
            </button>
          ))}
          <button
            onClick={() => onAskWaiter(RANDOM_PROMPT)}
            className="flex items-center gap-2.5 px-6 py-4 rounded-2xl orange-gradient text-white shadow-xl shadow-orange-500/20 whitespace-nowrap active:scale-95 transition-all snap-start"
          >
            <Sparkles size={16} />
            <span className="text-sm font-black uppercase tracking-widest">Surpreenda-me</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto hide-scrollbar items-center py-4 mb-4 -mx-6 px-6">
        <CategoryIcon
          category={{ id: 'all', name: 'Todos', icon: '🍲', color: 'bg-orange-100' }}
          isActive={activeCategory === null}
          onClick={() => setActiveCategory(null)}
        />
        {categories.map((cat) => (
          <CategoryIcon
            key={cat.id}
            category={cat}
            isActive={activeCategory === cat.name}
            onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
          />
        ))}
      </div>
    </section>
  );
};

export default CustomerHeroSection;
