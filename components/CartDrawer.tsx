
import React, { useEffect, useMemo, useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Minus, Plus, CreditCard, MapPin, Wallet, Apple, ChevronRight, CheckCircle2, ShieldCheck, Zap, Ticket, Tag, Percent, XCircle, MapPinned, Home, Navigation2, Briefcase, PlusCircle, Pencil, Trash, QrCode, Banknote, Landmark, Coins, Clock, ChevronUp } from 'lucide-react';
import { CartItem, Address, PaymentType, CardBrand, CheckoutDetails } from '../types';
import { fetchCouponFromFirebase, FirebaseCoupon } from '../services/firebaseService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onClear: () => void;
  onCheckout: (details: CheckoutDetails) => void;
  deliveryFee: number;
}

const CartDrawer: React.FC<Props> = ({ isOpen, onClose, cartItems, onRemove, onEdit, onClear, onCheckout, deliveryFee }) => {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  
  // Estado de Pagamento
  const [paymentType, setPaymentType] = useState<PaymentType>('credit');
  const [cardBrand, setCardBrand] = useState<CardBrand>('mastercard');
  const [changeFor, setChangeFor] = useState('');
  
  const [couponCode, setCouponCode] = useState('');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<FirebaseCoupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  
  // Gestão de Endereços
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      label: 'Minha Casa',
      type: 'home',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 42',
      neighborhood: 'Jardim Paulista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    }
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('1');
  const [isAddressListOpen, setIsAddressListOpen] = useState(false);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [formAddress, setFormAddress] = useState<Omit<Address, 'id'>>({
    label: '',
    type: 'home',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];

  useEffect(() => {
    if (!feedback) return;

    const timeoutId = setTimeout(() => {
      setFeedback(null);
    }, 2600);

    return () => clearTimeout(timeoutId);
  }, [feedback]);

  const subtotal = cartItems.reduce((acc, ci) => {
    const extrasTotal = ci.selectedExtras.reduce((a, b) => a + b.price, 0);
    return acc + (ci.item.price + extrasTotal) * ci.quantity;
  }, 0);
  
  const discountPercentage = useMemo(() => {
    if (!appliedCoupon?.active) return 0;
    return Math.max(appliedCoupon.discountPercentage, 0);
  }, [appliedCoupon]);
  const rawDiscount = subtotal * (discountPercentage / 100);
  const maxDiscountValue = appliedCoupon?.active && typeof appliedCoupon.maxDiscountValue === 'number'
    ? Math.max(appliedCoupon.maxDiscountValue, 0)
    : undefined;
  const discountWithCap = typeof maxDiscountValue === 'number' ? Math.min(rawDiscount, maxDiscountValue) : rawDiscount;
  const discount = Math.min(discountWithCap, subtotal);
  const total = subtotal + deliveryFee - discount;

  const handleApplyCoupon = async () => {
    const normalizedCode = couponCode.trim().toUpperCase();

    if (!normalizedCode) {
      setFeedback({ message: 'Digite um cupom para validar.', type: 'error' });
      return;
    }

    setIsValidatingCoupon(true);

    try {
      const coupon = await fetchCouponFromFirebase(normalizedCode);

      if (!coupon) {
        setFeedback({ message: 'Cupom não encontrado.', type: 'error' });
        return;
      }

      if (!coupon.active) {
        setFeedback({ message: 'Cupom encontrado, mas está inativo.', type: 'error' });
        return;
      }

      setAppliedCoupon(coupon);
      setCouponCode(coupon.code);
      setIsCouponModalOpen(false);
      setFeedback({ message: `Cupom ${coupon.code} aplicado com sucesso!`, type: 'success' });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleOpenForm = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormAddress({ ...address });
    } else {
      setEditingAddress(null);
      setFormAddress({
        label: '',
        type: 'home',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: ''
      });
    }
    setIsAddressFormOpen(true);
  };

  const handleSaveAddress = () => {
    if (!formAddress.street || !formAddress.number || !formAddress.label) {
      setFeedback({ message: 'Por favor, preencha os campos obrigatórios.', type: 'error' });
      return;
    }

    if (editingAddress) {
      setAddresses(prev => prev.map(a => a.id === editingAddress.id ? { ...formAddress, id: a.id } : a));
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      const newAddress = { ...formAddress, id: newId };
      setAddresses(prev => [...prev, newAddress]);
      setSelectedAddressId(newId);
    }
    setIsAddressFormOpen(false);
    setIsAddressListOpen(true);
  };

  const handleNextStep = () => {
    if (step === 'cart') setStep('checkout');
    else {
      onCheckout({
        payment: {
          type: paymentType,
          brand: (paymentType === 'credit' || paymentType === 'debit') ? cardBrand : undefined,
          changeFor: paymentType === 'cash' ? changeFor : undefined
        },
        address: selectedAddress
      });
      setTimeout(() => {
        setStep('cart');
        setAppliedCoupon(null);
        setCouponCode('');
      }, 500);
    }
  };

  const closeAndReset = () => {
    onClose();
    setTimeout(() => {
      setStep('cart');
      setIsCouponModalOpen(false);
      setIsAddressListOpen(false);
      setIsAddressFormOpen(false);
    }, 500);
  };

  const getAddressIcon = (type: Address['type']) => {
    switch (type) {
      case 'home': return <Home size={18} />;
      case 'work': return <Briefcase size={18} />;
      default: return <MapPin size={18} />;
    }
  };

  const paymentMethods = [
    { id: 'credit', label: 'Crédito', icon: <CreditCard size={20} /> },
    { id: 'debit', label: 'Débito', icon: <Landmark size={20} /> },
    { id: 'pix', label: 'Pix', icon: <QrCode size={20} /> },
    { id: 'cash', label: 'Dinheiro', icon: <Banknote size={20} /> },
  ];

  return (
    <>
      {feedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-4 w-full max-w-md">
          <div
            className={`w-full rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-300 ${feedback.type === 'error'
              ? 'bg-red-50/95 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200'
              : 'bg-emerald-50/95 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-200'
              }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              {feedback.type === 'error' ? <XCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
              <p className="text-sm font-bold tracking-tight">{feedback.message}</p>
            </div>
          </div>
        </div>
      )}

      <div 
        className={`fixed inset-0 bg-black/40 dark:bg-black/90 backdrop-blur-xl z-[105] transition-opacity duration-700 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeAndReset}
      />
      
      {/* Modal de Cupom */}
      {isCouponModalOpen && (
         <div className="fixed inset-0 flex items-center justify-center z-[130] transition-all duration-500 px-6">
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" onClick={() => setIsCouponModalOpen(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <button onClick={() => setIsCouponModalOpen(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400"><X size={20} /></button>
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/10 rounded-[2.2rem] flex items-center justify-center text-orange-500 shadow-inner"><Ticket size={40} className="rotate-[-15deg]" /></div>
                <h3 className="text-2xl font-black tracking-tighter">Aplicar Cupom</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Digite seu cupom</p>
              </div>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="DIGITE O CÓDIGO" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)} 
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-orange-500/30 rounded-2xl px-6 py-4 text-center text-xl font-black outline-none transition-all uppercase placeholder:text-zinc-300" 
                  autoFocus 
                />
                <button disabled={isValidatingCoupon} onClick={handleApplyCoupon} className="w-full py-5 orange-gradient text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed">{isValidatingCoupon ? 'Validando...' : 'Validar Cupom'}</button>
              </div>
            </div>
         </div>
      )}

      {/* Listagem de Endereços */}
      {isAddressListOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[130] transition-all duration-500 px-6">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" onClick={() => setIsAddressListOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsAddressListOpen(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400"><X size={20} /></button>
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-[1.5rem] flex items-center justify-center text-orange-500 shadow-inner"><MapPinned size={32} /></div>
              <h3 className="text-2xl font-black tracking-tighter">Meus Endereços</h3>
            </div>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto hide-scrollbar mb-6">
              {addresses.map((addr) => (
                <div 
                  key={addr.id}
                  onClick={() => { setSelectedAddressId(addr.id); setIsAddressListOpen(false); }}
                  className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedAddressId === addr.id ? 'border-orange-500 bg-orange-50/50' : 'border-zinc-50 dark:border-zinc-800'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedAddressId === addr.id ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>{getAddressIcon(addr.type)}</div>
                  <div className="flex-1 min-w-0"><p className="font-black text-sm">{addr.label}</p><p className="text-[10px] text-zinc-400 truncate">{addr.street}, {addr.number}</p></div>
                  {selectedAddressId === addr.id && <CheckCircle2 size={18} className="text-orange-500" />}
                </div>
              ))}
            </div>
            <button onClick={() => { handleOpenForm(); setIsAddressListOpen(false); }} className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-400">Novo Endereço</button>
          </div>
        </div>
      )}

      {/* Drawer Principal */}
      <div className={`fixed inset-0 w-full bg-white dark:bg-zinc-950 z-[110] shadow-2xl transition-all duration-700 ease-in-out transform
        ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        
        <div className="flex flex-col h-full max-w-4xl mx-auto overflow-hidden">
          {/* Header */}
          <div className="px-8 py-4 pt-6 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">
                {step === 'cart' ? 'Sua Sacola' : 'Pagamento'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                 <div className="flex gap-1">
                    <div className={`w-3 h-1 rounded-full transition-all duration-500 ${step === 'cart' ? 'bg-orange-500 w-6' : 'bg-orange-200 dark:bg-zinc-800'}`} />
                    <div className={`w-3 h-1 rounded-full transition-all duration-500 ${step === 'checkout' ? 'bg-orange-500 w-6' : 'bg-orange-200 dark:bg-zinc-800'}`} />
                 </div>
                 <p className="text-zinc-400 font-black text-[9px] uppercase tracking-[0.2em]">Passo {step === 'cart' ? '1' : '2'}</p>
              </div>
            </div>
            <button onClick={closeAndReset} className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center rounded-[1.5rem] text-zinc-400 hover:text-orange-500 transition-all">
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-10 hide-scrollbar pt-2">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <ShoppingBag size={48} className="text-zinc-200" />
                <p className="font-black text-2xl tracking-tighter">Sua sacola está vazia</p>
                <button onClick={onClose} className="px-8 py-4 orange-gradient text-white rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest">Explorar Cardápio</button>
              </div>
            ) : step === 'cart' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Previsão de Entrega */}
                <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-500/10 rounded-[2.5rem] p-6 flex items-center gap-5">
                   <div className="w-14 h-14 orange-gradient rounded-2xl flex items-center justify-center text-white shadow-lg"><Clock size={28} /></div>
                   <div className="flex-1">
                      <h4 className="font-black text-[10px] uppercase tracking-widest text-orange-600 mb-1">Previsão de Entrega</h4>
                      <p className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight">25 - 40 minutos</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Saindo de: Unidade Jardins</p>
                   </div>
                </div>

                {/* Itens */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Seus Itens</h3>
                     <button onClick={onClear} className="text-[10px] font-black uppercase text-red-500">Limpar</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cartItems.map((cartItem, index) => {
                      const extrasPrice = cartItem.selectedExtras.reduce((a, b) => a + b.price, 0);
                      const itemTotal = (cartItem.item.price + extrasPrice) * cartItem.quantity;
                      
                      return (
                        <div key={cartItem.cartId} className="flex gap-4 p-5 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm group">
                          <img src={cartItem.item.imageUrl} alt={cartItem.item.name} className="w-20 h-20 rounded-[1.5rem] object-cover" />
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-black text-sm truncate pr-1">{cartItem.quantity}x {cartItem.item.name}</h4>
                                <span className="font-black text-sm text-orange-600">R${itemTotal.toFixed(2)}</span>
                              </div>
                              <p className="text-[10px] text-zinc-400 font-bold truncate">
                                {cartItem.selectedExtras.length > 0 && `+ ${cartItem.selectedExtras.map(e => e.name).join(', ')}`}
                                {cartItem.removedIngredients.length > 0 && ` (sem ${cartItem.removedIngredients.join(', ')})`}
                              </p>
                            </div>
                            
                            <div className="flex gap-2 mt-3">
                              <button 
                                onClick={() => onEdit(index)} 
                                className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-orange-500 transition-all text-[10px] font-black uppercase tracking-widest"
                              >
                                <Pencil size={14} /> Editar
                              </button>
                              <button 
                                onClick={() => onRemove(index)} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cupom Passo 1 */}
                <div className="px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Vantagens</h3>
                  {appliedCoupon?.active ? (
                    <div className="bg-green-50 dark:bg-green-500/10 border-2 border-dashed border-green-500/30 rounded-[1.8rem] p-5 flex items-center justify-between animate-in slide-in-from-top-2">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg"><CheckCircle2 size={24} /></div>
                          <div>
                             <p className="text-sm font-black text-green-700 dark:text-green-400 uppercase tracking-widest">Cupom {appliedCoupon.code} ativo!</p>
                             <p className="text-[11px] font-bold text-green-600/60 uppercase">-{discountPercentage}% de Desconto aplicado{typeof maxDiscountValue === 'number' ? ` (máx. R$ ${maxDiscountValue.toFixed(2)})` : ''}</p>
                          </div>
                       </div>
                       <button onClick={() => setAppliedCoupon(null)} className="text-zinc-400 hover:text-red-500 p-2"><X size={20} /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsCouponModalOpen(true)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[1.8rem] p-5 flex items-center justify-between group hover:border-orange-500/50 transition-all active:scale-95"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-300 group-hover:text-orange-500 transition-colors shadow-sm"><Ticket size={24} /></div>
                          <div className="text-left">
                             <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Possui um Cupom?</p>
                             <p className="text-[11px] font-bold text-zinc-400 uppercase">Toque para inserir seu código</p>
                          </div>
                       </div>
                       <Plus size={24} className="text-zinc-300 group-hover:text-orange-500 transition-colors" />
                    </button>
                  )}
                </div>

                {/* Resumo Passo 1 */}
                <div className="p-8 bg-zinc-50 dark:bg-zinc-900/30 rounded-[3rem] space-y-4">
                   <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span className="text-zinc-900 dark:text-zinc-50 font-black">R$ {subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                      <span>Taxa de Entrega</span>
                      <span className="text-green-600 font-black">R$ {deliveryFee.toFixed(2)}</span>
                   </div>
                   {appliedCoupon?.active && (
                     <div className="flex justify-between items-center text-[11px] font-bold text-green-600 uppercase tracking-widest">
                        <span>Desconto Cupom</span>
                        <span className="font-black">- R$ {discount.toFixed(2)}</span>
                     </div>
                   )}
                   <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                      <span className="text-base font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Total</span>
                      <span className="text-3xl font-[900] text-orange-600 tracking-tighter">R$ {total.toFixed(2)}</span>
                   </div>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                {/* Checkout Step */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end px-2">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Entrega em</h3>
                    <button onClick={() => setIsAddressListOpen(true)} className="text-[9px] font-black uppercase text-orange-500">Gerenciar</button>
                  </div>
                  <div onClick={() => setIsAddressListOpen(true)} className="relative p-6 bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] flex gap-5 items-center group cursor-pointer active:scale-[0.98] transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 orange-gradient" />
                    <div className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-[1.5rem] flex items-center justify-center text-orange-500 shrink-0 shadow-sm">{getAddressIcon(selectedAddress.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-lg truncate">{selectedAddress.label}</p>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{selectedAddress.street}, {selectedAddress.number}</p>
                    </div>
                    <ChevronRight size={20} className="text-zinc-300" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 px-2">Método de Pagamento</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {paymentMethods.map((method) => (
                      <button 
                        key={method.id}
                        onClick={() => setPaymentType(method.id as PaymentType)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-[1.8rem] border-2 transition-all active:scale-95 ${paymentType === method.id ? 'border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/5' : 'border-zinc-50 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400'}`}
                      >
                        <div className={`w-11 h-11 rounded-[1rem] flex items-center justify-center transition-all ${paymentType === method.id ? 'bg-orange-500 text-white shadow-md' : 'bg-white dark:bg-zinc-800'}`}>
                          {method.icon}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${paymentType === method.id ? 'text-orange-500' : ''}`}>{method.label}</span>
                      </button>
                    ))}
                  </div>

                  {(paymentType === 'credit' || paymentType === 'debit') && (
                    <div className="p-5 bg-zinc-50 dark:bg-zinc-900/40 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Pague na Entrega</span>
                        <div className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded text-[8px] font-black uppercase">Leve a máquina</div>
                      </div>
                      <div className="flex gap-4">
                        {(['mastercard', 'visa', 'elo'] as CardBrand[]).map((brand) => {
                          const iconUrls = {
                            mastercard: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',
                            visa: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg',
                            elo: 'https://seeklogo.com/images/E/elo-logo-0B5C110771-seeklogo.com.png'
                          };
                          return (
                            <button 
                              key={brand}
                              onClick={() => setCardBrand(brand)}
                              className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${cardBrand === brand ? 'border-orange-500 bg-white dark:bg-zinc-800 shadow-md scale-105' : 'border-transparent text-zinc-400 opacity-50 grayscale'}`}
                            >
                               <img src={iconUrls[brand]} alt={brand} className="h-6 w-10 object-contain" />
                               <span className="text-[8px] font-black uppercase tracking-widest">{brand}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {paymentType === 'pix' && (
                    <div className="p-6 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/10 flex flex-col items-center gap-4 animate-in slide-in-from-top-2">
                      <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm"><QrCode size={32} /></div>
                      <div className="text-center">
                        <p className="font-black text-xs text-blue-600 uppercase tracking-widest mb-1">Pagamento Instantâneo</p>
                        <p className="text-[11px] font-medium text-zinc-500 max-w-[240px]">O QR Code será gerado na próxima tela.</p>
                      </div>
                    </div>
                  )}

                  {paymentType === 'cash' && (
                    <div className="p-6 bg-green-500/5 rounded-[2.5rem] border border-green-500/10 space-y-4 animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-green-600 shadow-sm"><Banknote size={24} /></div>
                        <div>
                          <p className="font-black text-xs text-green-600 uppercase tracking-widest leading-none mb-1">Dinheiro na Entrega</p>
                          <p className="text-[11px] font-medium text-zinc-500">Pague direto ao entregador.</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-green-500/10">
                        <label className="text-[10px] font-black uppercase tracking-widest text-green-600/60 block mb-2 px-1">Troco para quanto?</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm text-green-600">R$</span>
                          <input 
                            type="number" 
                            placeholder="Ex: 100.00" 
                            value={changeFor}
                            onChange={(e) => setChangeFor(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border-2 border-green-500/20 focus:border-green-500/50 rounded-2xl pl-10 pr-4 py-3 text-sm font-black outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resumo Consistente Passo 2 */}
                <div className="p-8 bg-zinc-50 dark:bg-zinc-900/30 rounded-[3rem] space-y-4 border border-zinc-100 dark:border-zinc-800">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <span>Subtotal Itens</span>
                      <span className="text-zinc-600 dark:text-zinc-300">R$ {subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <span>Taxa de Entrega</span>
                      <span className="text-green-600">R$ {deliveryFee.toFixed(2)}</span>
                   </div>
                   {appliedCoupon?.active && (
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-green-600">
                        <span>Desconto Cupom Ativo</span>
                        <span>- R$ {discount.toFixed(2)}</span>
                     </div>
                   )}
                   <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                      <span className="text-sm font-black uppercase tracking-widest">Total a Pagar</span>
                      <span className="text-2xl font-[900] text-orange-600 tracking-tighter">R$ {total.toFixed(2)}</span>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          {cartItems.length > 0 && (
            <div className="px-8 py-5 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900/50 pb-8 shrink-0">
              <div className="max-w-xl mx-auto w-full">
                <div className="flex gap-4">
                  {step === 'checkout' && (
                    <button onClick={() => setStep('cart')} className="w-16 h-16 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-[1.6rem] text-zinc-400 transition-all hover:bg-zinc-200"><ChevronRight size={28} className="rotate-180" /></button>
                  )}
                  <button 
                    onClick={handleNextStep}
                    className="flex-1 py-5 md:py-6 orange-gradient orange-glow text-white rounded-[2.2rem] font-black flex items-center justify-between px-8 active:scale-[0.98] transition-all shadow-xl shadow-orange-500/30"
                  >
                    <div className="flex items-center gap-3">
                      {step === 'cart' ? <ShoppingBag size={22} strokeWidth={3} /> : <CheckCircle2 size={22} strokeWidth={3} />}
                      <span className="uppercase tracking-[0.2em] text-[11px] md:text-[12px]">{step === 'cart' ? 'Continuar' : 'Finalizar Pedido'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="h-6 w-[1px] bg-white/20" />
                       <span className="text-sm md:text-lg">R$ {total.toFixed(2)}</span>
                       <ArrowRight size={20} strokeWidth={3} />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
