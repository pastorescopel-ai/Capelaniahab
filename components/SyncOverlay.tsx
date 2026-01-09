
import React from 'react';

interface SyncOverlayProps {
  isVisible: boolean;
  message?: string;
}

const SyncOverlay: React.FC<SyncOverlayProps> = ({ isVisible, message }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white p-12 rounded-[3rem] shadow-3xl text-center space-y-6 max-w-sm mx-4 border-b-8 border-primary">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-8 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-8 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Sincronizando</h3>
          <p className="text-slate-500 font-medium italic mt-2">{message || 'Enviando dados para a nuvem de forma segura...'}</p>
        </div>
      </div>
    </div>
  );
};

export default SyncOverlay;
