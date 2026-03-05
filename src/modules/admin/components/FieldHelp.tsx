import React from 'react';
import { CircleHelp } from 'lucide-react';

export const FieldHelp: React.FC<{ text: string }> = ({ text }) => (
  <span className="relative inline-flex items-center group align-middle">
    <CircleHelp size={14} className="text-stone-400" />
    <span className="pointer-events-none absolute left-1/2 top-[120%] z-20 hidden w-64 -translate-x-1/2 rounded-xl border border-stone-200 bg-white p-2 text-[11px] font-semibold text-stone-600 shadow-xl group-hover:block group-focus-within:block dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
      {text}
    </span>
  </span>
);

export const FieldLabel: React.FC<{ title: string; help: string; helper: string; className?: string }> = ({ title, help, helper, className }) => (
  <div className={className || 'space-y-1'}>
    <p className="text-[11px] font-black uppercase tracking-wide text-stone-500 flex items-center gap-1.5">
      {title} <FieldHelp text={help} />
    </p>
    <p className="text-[11px] text-stone-400">{helper}</p>
  </div>
);
