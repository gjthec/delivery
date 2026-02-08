
import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Minus, Plus, CreditCard, MapPin, Wallet, Apple, ChevronRight, CheckCircle2, ShieldCheck, Zap, Ticket, Tag, Percent, XCircle, MapPinned, Home, Navigation2, Briefcase, PlusCircle, Pencil, Trash, QrCode, Banknote, Landmark, Coins } from 'lucide-react';
import { MenuItem, CartItem, Address, PaymentType, CardBrand } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onClear: () => void;
  onCheckout: (details: { payment: { type: PaymentType, brand?: CardBrand, changeFor?: string }, address: Address }) => void;
}

const CartDrawer: React.FC<Props> = ({ isOpen, onClose, cartItems, onRemove, onEdit, onClear, onCheckout }) => {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  
  // Estado de Pagamento
  const [paymentType, setPaymentType] = useState<PaymentType>('credit');
  const [cardBrand, setCardBrand] = useState<CardBrand>('mastercard');
  const [changeFor, setChangeFor] = useState('');
  
  const [couponCode, setCouponCode] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  
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

  const subtotal = cartItems.reduce((acc, ci) => {
    const extrasTotal = ci.selectedExtras.reduce((a, b) => a + b.price, 0);
    return acc + (ci.item.price + extrasTotal) * ci.quantity;
  }, 0);
  
  const deliveryFee = 0; 
  const discount = isCouponApplied ? subtotal * 0.1 : 0; 
  const total = subtotal + deliveryFee - discount;

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'FOODAI10') {
      setIsCouponApplied(true);
      setIsCouponModalOpen(false);
    } else {
      alert('Cupom inválido ou expirado.');
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
      alert('Por favor, preencha os campos obrigatórios.');
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
        setIsCouponApplied(false);
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
      <div 
        className={`fixed inset-0 bg-black/40 dark:bg-black/90 backdrop-blur-xl z-[105] transition-opacity duration-700 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeAndReset}
      />
      
      {isCouponModalOpen && (
         <div className="fixed inset-0 flex items-center justify-center z-[130] transition-all duration-500 px-6">
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" onClick={() => setIsCouponModalOpen(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[3rem] p-8 shadow-2xl">
              <button onClick={() => setIsCouponModalOpen(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400"><X size={20} /></button>
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/10 rounded-[2.2rem] flex items-center justify-center text-orange-500 shadow-inner"><Ticket size={40} className="rotate-[-15deg]" /></div>
                <h3 className="text-2xl font-black tracking-tighter">Aplicar Cupom</h3>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Ex: FOODAI10" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-2 border-transparent focus:border-orange-500/30 rounded-2xl px-6 py-4 text-lg font-black outline-none transition-all uppercase" autoFocus />
                <button onClick={handleApplyCoupon} className="w-full py-5 orange-gradient text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all">Ativar Cupom</button>
              </div>
            </div>
         </div>
      )}

      {isAddressListOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[130] transition-all duration-500 px-6">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" onClick={() => setIsAddressListOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] p-8 shadow-2xl">
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

      {isAddressFormOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[140] transition-all duration-500 px-6">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={() => setIsAddressFormOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] p-8 shadow-2xl">
            <button onClick={() => { setIsAddressFormOpen(false); setIsAddressListOpen(true); }} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400"><X size={20} /></button>
            <h3 className="text-2xl font-black mb-6 text-center">Salvar Endereço</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <input type="text" placeholder="Apelido (ex: Casa)" value={formAddress.label} onChange={(e) => setFormAddress({...formAddress, label: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm font-bold border-2 border-transparent focus:border-orange-500/20 outline-none" />
              <div className="grid grid-cols-2 gap-3">
                 <input type="text" placeholder="CEP" value={formAddress.zipCode} onChange={(e) => setFormAddress({...formAddress, zipCode: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                 <input type="text" placeholder="Número" value={formAddress.number} onChange={(e) => setFormAddress({...formAddress, number: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
              </div>
              <input type="text" placeholder="Rua" value={formAddress.street} onChange={(e) => setFormAddress({...formAddress, street: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
              <input type="text" placeholder="Bairro" value={formAddress.neighborhood} onChange={(e) => setFormAddress({...formAddress, neighborhood: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
              <button onClick={handleSaveAddress} className="w-full py-4 orange-gradient text-white rounded-2xl font-black text-[11px] uppercase tracking-widest">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 w-full bg-white dark:bg-zinc-950 z-[110] shadow-2xl transition-all duration-700 ease-in-out transform
        ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        
        <div className="flex flex-col h-full max-w-4xl mx-auto overflow-hidden">
          <div className="px-8 py-4 pt-6 flex items-center justify-between">
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

          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4 hide-scrollbar pt-2">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <ShoppingBag size={48} className="text-zinc-200" />
                <p className="font-black text-2xl tracking-tighter">Sua sacola está vazia</p>
                <button onClick={onClose} className="px-8 py-4 orange-gradient text-white rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest">Explorar Cardápio</button>
              </div>
            ) : step === 'cart' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cartItems.map((cartItem, index) => {
                    const extrasPrice = cartItem.selectedExtras.reduce((a, b) => a + b.price, 0);
                    const itemTotal = (cartItem.item.price + extrasPrice) * cartItem.quantity;
                    
                    return (
                      <div key={cartItem.cartId} className="flex gap-4 p-5 bg-zinc-50 dark:bg-zinc-900/40 rounded-[2.5rem] group border border-transparent hover:border-orange-500/10 transition-all">
                        <img src={cartItem.item.imageUrl} alt={cartItem.item.name} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-sm" />
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-black text-sm truncate">{cartItem.quantity}x {cartItem.item.name}</h4>
                              <span className="font-black text-sm whitespace-nowrap">R${itemTotal.toFixed(2)}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-bold truncate">
                              {cartItem.selectedExtras.length > 0 && `+ ${cartItem.selectedExtras.map(e => e.name).join(', ')}`}
                              {cartItem.removedIngredients.length > 0 && ` (sem ${cartItem.removedIngredients.join(', ')})`}
                            </p>
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            <button 
                              onClick={() => onEdit(index)} 
                              className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-zinc-800 text-zinc-400 hover:text-orange-500 hover:border-orange-500/30 border border-transparent transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                              <Pencil size={14} /> Editar
                            </button>
                            <button 
                              onClick={() => onRemove(index)} 
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
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
            ) : (
              <div className="max-w-xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
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
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Pague na Entrega</span>
                        <div className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded text-[8px] font-black uppercase">Leve a máquina</div>
                      </div>
                      <div className="flex gap-4">
                        {(['mastercard', 'visa', 'elo'] as CardBrand[]).map((brand) => (
                          <button 
                            key={brand}
                            onClick={() => setCardBrand(brand)}
                            className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl border-2 transition-all ${cardBrand === brand ? 'border-orange-500 bg-white dark:bg-zinc-800 shadow-md scale-105' : 'border-transparent text-zinc-400 opacity-50 grayscale'}`}
                          >
                             <img src={`https://raw.githubusercontent.com/a-f-u-e-n-t-e-s/payment-icons/master/png/${brand}.png`} alt={brand} className="h-6 object-contain" />
                             <span className="text-[8px] font-black uppercase tracking-widest">{brand}</span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-4 text-center text-[10px] text-zinc-400 font-medium">Você selecionou pagar com **{paymentType === 'credit' ? 'Crédito' : 'Débito'} {cardBrand.toUpperCase()}** na hora da entrega.</p>
                    </div>
                  )}

                  {paymentType === 'pix' && (
                    <div className="p-6 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/10 flex flex-col items-center gap-4 animate-in slide-in-from-top-2">
                      <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm"><QrCode size={32} /></div>
                      <div className="text-center">
                        <p className="font-black text-xs text-blue-600 uppercase tracking-widest mb-1">Pagamento Instantâneo</p>
                        <p className="text-[11px] font-medium text-zinc-500 max-w-[240px]">O QR Code e o código Copia e Cola serão gerados na próxima tela.</p>
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
                        <label className="text-[10px] font-black uppercase tracking-widest text-green-600/60 block mb-2 px-1">Precisa de troco para quanto?</label>
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
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="px-8 py-5 bg-white dark:bg-zinc-950 border-t border-zinc-50 dark:border-zinc-900/50 pb-8">
              <div className="max-w-xl mx-auto w-full">
                <div className="space-y-1.5 mb-5">
                  <div className="flex justify-between items-center px-1">
                    <span className="font-black uppercase text-[9px] tracking-[0.2em] text-zinc-400">Total a pagar</span>
                    <span className="text-3xl font-[900] text-zinc-900 dark:text-zinc-50 tracking-tighter">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  {step === 'checkout' && (
                    <button onClick={() => setStep('cart')} className="w-16 h-16 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-[1.6rem] transition-all"><ChevronRight size={28} className="rotate-180" /></button>
                  )}
                  <button 
                    onClick={handleNextStep}
                    className="flex-1 py-5 orange-gradient orange-glow text-white rounded-[2rem] font-black flex items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-xl"
                  >
                    <span className="uppercase tracking-[0.2em] text-[12px]">{step === 'cart' ? 'Próximo Passo' : 'Finalizar Pedido'}</span>
                    <ArrowRight size={20} strokeWidth={3} />
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
