import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

type DialogVariant = 'info' | 'success' | 'error' | 'warning';

interface StandardDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  variant?: DialogVariant;
  confirmText?: string;
}

const variantStyles: Record<DialogVariant, { icon: React.ReactNode; iconClass: string; buttonClass: string }> = {
  info: {
    icon: <Info size={20} />,
    iconClass: 'bg-blue-100 dark:bg-blue-500/20 text-blue-500',
    buttonClass: 'bg-blue-500 hover:bg-blue-600'
  },
  success: {
    icon: <CheckCircle2 size={20} />,
    iconClass: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500',
    buttonClass: 'bg-emerald-500 hover:bg-emerald-600'
  },
  error: {
    icon: <XCircle size={20} />,
    iconClass: 'bg-red-100 dark:bg-red-500/20 text-red-500',
    buttonClass: 'bg-red-500 hover:bg-red-600'
  },
  warning: {
    icon: <AlertTriangle size={20} />,
    iconClass: 'bg-orange-100 dark:bg-orange-500/20 text-orange-500',
    buttonClass: 'bg-orange-500 hover:bg-orange-600'
  }
};

const StandardDialog: React.FC<StandardDialogProps> = ({
  isOpen,
  title,
  message,
  onClose,
  variant = 'info',
  confirmText = 'OK'
}) => {
  if (!isOpen) return null;

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl ${style.iconClass}`}>
            {style.icon}
          </div>
          <div>
            <h3 className="font-black text-lg text-stone-800 dark:text-white">{title}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-300 mt-1">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-white font-bold transition-colors ${style.buttonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandardDialog;
