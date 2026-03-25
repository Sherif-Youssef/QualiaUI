import React, { useState } from 'react';
import { Key, Copy, Check, X, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';

interface TempPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
  userName: string;
  title?: string;
}

export const TempPasswordModal: React.FC<TempPasswordModalProps> = ({
  isOpen,
  onClose,
  password,
  userName,
  title = 'Password Regenerated',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300 mx-4">
        <div className="p-8 pb-4 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 rotate-12">
            <ShieldCheck className="w-8 h-8 -rotate-12" />
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-500 font-medium px-4 leading-relaxed">
            A new temporary password has been generated for <span className="text-gray-900 font-bold">{userName}</span>.
          </p>
        </div>

        <div className="px-8 py-6">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Key className="w-5 h-5" />
            </div>
            <input 
              readOnly 
              type="text" 
              value={password}
              className="w-full pl-12 pr-14 py-5 bg-gray-50 border border-gray-100 rounded-2xl text-lg font-black text-primary tracking-wider focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
                copied ? 'bg-success text-white' : 'hover:bg-gray-200 text-gray-500'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
            <div className="p-1 rounded-full bg-amber-200 text-amber-700 mt-0.5">
               <X className="w-3 h-3 rotate-45" strokeWidth={4} />
            </div>
            <p className="text-[11px] font-bold text-amber-800 leading-tight uppercase tracking-tight">
              Share this securely with the user. They will be required to change it upon their next login.
            </p>
          </div>
        </div>

        <div className="p-8 pt-2">
          <Button
            onClick={onClose}
            className="w-full py-7 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-base uppercase tracking-widest"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
