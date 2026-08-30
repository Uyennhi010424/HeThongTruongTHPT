import React, { createContext, useContext, useState, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('Xác nhận');
  const resolverRef = useRef(null);

  const confirm = (messageText, titleText = 'Xác nhận') => {
    setMessage(messageText);
    setTitle(titleText);
    setIsOpen(true);

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <div 
            className="bg-white rounded-[24px] shadow-2xl p-6 w-full max-w-sm mx-4 transform transition-all animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {title}
              </h3>
              <div className="text-sm text-slate-600 mb-6 px-2">
                {message}
              </div>
              
              <div className="flex w-full gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold shadow-sm hover:bg-red-700 hover:shadow transition-all duration-200"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
