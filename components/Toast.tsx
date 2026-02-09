import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div 
            key={t.id} 
            className={`
                pointer-events-auto
                min-w-[300px] max-w-[400px] border-4 border-black p-4 shadow-neo flex items-start justify-between 
                animate-in slide-in-from-right fade-in duration-300
                ${t.type === 'success' ? 'bg-[#00F0FF]' : t.type === 'error' ? 'bg-[#FF66C4]' : 'bg-white'}
            `}
        >
            <div className="flex items-center gap-3">
                {t.type === 'success' && <CheckCircle className="w-6 h-6"/>}
                {t.type === 'error' && <AlertCircle className="w-6 h-6"/>}
                {t.type === 'info' && <Info className="w-6 h-6"/>}
                <span className="font-bold font-mono text-sm leading-tight">{t.message}</span>
            </div>
            <button 
                onClick={() => removeToast(t.id)} 
                className="ml-4 hover:scale-110 transition-transform p-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black rounded-none"
            >
                <X className="w-4 h-4"/>
            </button>
        </div>
      ))}
    </div>
  );
};