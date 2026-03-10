import React from 'react';
import { Loader2 } from 'lucide-react';
import Header from '../../components/Header';
import MenuCard from '../../components/MenuCard';
import CartDrawer from '../../components/CartDrawer';
import PixPaymentModal from '../../components/PixPaymentModal';
import ItemDetailModal from '../../components/ItemDetailModal';
import ProfileModal from '../../components/ProfileModal';
import OrdersModal from '../../components/OrdersModal';
import { PIX_CODE } from './constants/customer.constants';
import AiSuggestionsSection from './components/AiSuggestionsSection';
import CustomerBottomNav from './components/CustomerBottomNav';
import CustomerHeroSection from './components/CustomerHeroSection';
import { useCustomerAppController } from './hooks/useCustomerAppController';

const CustomerApp: React.FC = () => {
  const {
    menuItems,
    pizzaFlavors,
    isLoadingPizzaFlavors,
    pizzaFlavorsError,
    categories,
    deliveryFee,
    isLoadingData,
    storefrontError,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    aiSuggestions,
    setAiSuggestions,
    isAiLoading,
    isSearchFocused,
    setIsSearchFocused,
    cart,
    setCart,
    isCartOpen,
    setIsCartOpen,
    isCartJiggling,
    isPixModalOpen,
    setIsPixModalOpen,
    isProfileOpen,
    setIsProfileOpen,
    isOrdersOpen,
    setIsOrdersOpen,
    currentTotal,
    selectedItem,
    isDetailModalOpen,
    setIsDetailModalOpen,
    setEditingCartIndex,
    darkMode,
    setDarkMode,
    notifications,
    searchInputRef,
    filteredItems,
    currentInitialData,
    shouldHideFooter,
    getItemCountInCart,
    saveToCart,
    openItemDetails,
    handleEditCartItem,
    handleCheckout,
    handlePixConfirmed,
    clearNotifications,
    markNotificationsAsRead,
    handleAskWaiter,
    handleExploreClick
  } = useCustomerAppController();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300 pb-44 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
      {storefrontError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[250] bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 px-4 py-2 rounded-xl text-sm font-semibold">
          Erro ao carregar dados da loja: {storefrontError}
        </div>
      )}

      {isLoadingData && (
        <div className="fixed inset-0 z-[300] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <Loader2 size={40} className="text-orange-500 animate-spin" />
          <p className="font-black text-xs uppercase tracking-[0.3em] text-orange-600">Sincronizando Cardápio...</p>
        </div>
      )}

      <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out ${isCartOpen || isPixModalOpen || isDetailModalOpen ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <Header
          isDarkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          notifications={notifications}
          onReadNotifications={markNotificationsAsRead}
          onClearNotifications={clearNotifications}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenOrders={() => setIsOrdersOpen(true)}
        />
      </div>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <OrdersModal isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemove={(idx) => setCart(prev => prev.filter((_, i) => i !== idx))}
        onEdit={handleEditCartItem}
        onClear={() => setCart([])}
        onCheckout={handleCheckout}
        deliveryFee={deliveryFee}
      />

      <PixPaymentModal
        isOpen={isPixModalOpen}
        onClose={() => setIsPixModalOpen(false)}
        onConfirm={handlePixConfirmed}
        pixCode={PIX_CODE}
        total={currentTotal}
      />

      <ItemDetailModal
        isOpen={isDetailModalOpen}
        item={selectedItem}
        initialData={currentInitialData}
        onClose={() => { setIsDetailModalOpen(false); setEditingCartIndex(null); }}
        pizzaFlavors={pizzaFlavors}
        pizzaFlavorsLoading={isLoadingPizzaFlavors}
        pizzaFlavorsError={pizzaFlavorsError}
        onAddToCart={(custom) => {
          if (selectedItem) {
            saveToCart(selectedItem, custom.quantity, custom.removedIngredients, custom.selectedExtras, custom.observations, custom.pizzaConfig);
          }
        }}
      />

      <main>
        <CustomerHeroSection
          isAiLoading={isAiLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearchFocused={isSearchFocused}
          setIsSearchFocused={setIsSearchFocused}
          onAskWaiter={handleAskWaiter}
          searchInputRef={searchInputRef}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categories={categories}
        />

        <div id="ai-suggestions-anchor" className="scroll-mt-32" />

        <AiSuggestionsSection
          aiSuggestions={aiSuggestions}
          menuItems={menuItems}
          onClear={() => setAiSuggestions([])}
          onOpenItemDetails={openItemDetails}
          onAddSuggestion={(item, quantity) => saveToCart(item, quantity, [], [], '')}
        />

        <section className="px-6 pt-4 space-y-12">
          {filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-8 text-center">
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Nenhum item encontrado para este tenant.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredItems.map((item, idx) => (
                <div key={item.id} className="animate-in fade-in slide-in-from-bottom-10 duration-700" style={{ animationDelay: `${idx * 40}ms` }} onClick={() => openItemDetails(item)}>
                  <MenuCard item={item} onAdd={(i) => saveToCart(i, 1, [], [], '')} count={getItemCountInCart(item.id)} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <CustomerBottomNav
        shouldHideFooter={shouldHideFooter}
        onExplore={handleExploreClick}
        onOpenCart={() => setIsCartOpen(true)}
        cartLength={cart.length}
        isCartJiggling={isCartJiggling}
      />
    </div>
  );
};

export default CustomerApp;
