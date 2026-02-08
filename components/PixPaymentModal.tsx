
import React, { useState } from 'react';
import { X, Copy, CheckCircle2, QrCode, Smartphone, Zap, ShieldCheck, MessageCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pixCode: string;
  total: number;
}

const PixPaymentModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, pixCode, total }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[3.5rem] p-8 shadow-2xl shadow-blue-500/10 border border-zinc-100 dark:border-zinc-800 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-all">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-blue-500/10 rounded-[2.2rem] flex items-center justify-center text-blue-500 shadow-inner">
            <QrCode size={40} />
          </div>

          <div>
            <h3 className="text-2xl font-[900] tracking-tighter text-zinc-900 dark:text-zinc-50">Pagamento Pix</h3>
            <p className="text-sm text-zinc-400 font-medium">Escaneie o QR Code ou copie o código</p>
          </div>

          <div className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-black text-xl shadow-lg shadow-blue-500/20 animate-pulse-glow">
            R$ {total.toFixed(2)}
          </div>

          <div className="p-4 bg-white rounded-3xl border-4 border-zinc-50 dark:border-zinc-800 shadow-inner group relative">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`} 
              alt="QR Code Pix"
              className="w-48 h-48 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </div>

          <div className="w-full space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block text-left px-2">Código Copia e Cola</label>
            <div className="relative group">
              <input 
                type="text" 
                readOnly 
                value={pixCode} 
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-blue-500/30 rounded-2xl px-5 py-4 text-xs font-mono font-bold text-zinc-400 pr-16 truncate"
              />
              <button 
                onClick={handleCopy}
                className={`absolute right-2 top-2 bottom-2 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/20'}`}
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
             <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Pagamento 100% Seguro</span>
             </div>
             <button 
               onClick={onConfirm}
               className="w-full py-5 bg-green-500 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-500/20"
             >
               <MessageCircle size={20} />
               Confirmar e enviar WhatsApp
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixPaymentModal;
