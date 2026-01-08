
import React, { useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { CloudConfig } from '../types';

const Admin: React.FC = () => {
  const [config, setConfig] = useState<CloudConfig>(storageService.getConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  const [sectorInput, setSectorInput] = useState(config.customSectors.join('\n'));
  const [collabInput, setCollabInput] = useState(config.customCollaborators.join('\n'));
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const reportLogoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'app' | 'report') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'app') setConfig({...config, appLogo: base64});
        else setConfig({...config, reportLogo: base64});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveConfig = () => {
    const sectors = sectorInput.split('\n').map(s => s.trim()).filter(s => s !== '');
    const collabs = collabInput.split('\n').map(c => c.trim()).filter(c => c !== '');
    
    const newConfig = { ...config, customSectors: sectors, customCollaborators: collabs };
    setIsSyncing(true);
    storageService.saveConfig(newConfig).then(() => {
        setIsSyncing(false);
        alert("Configurações e Listas salvas online!");
    });
  };

  return (
    <div className="space-y-10 pb-40 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Administração do Sistema</h2>
        <p className="text-slate-500 font-medium italic">Personalização de interface, logos e listas de apoio.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Logos Section */}
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-8">
            <h3 className="text-xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">🖼️ Identidade Visual</h3>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-400">Logo do Sistema (Login/Sidebar)</p>
                    <div onClick={() => logoInputRef.current?.click()} className="h-32 bg-slate-50 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-100 overflow-hidden relative group">
                        {config.appLogo ? <img src={config.appLogo} className="max-h-full object-contain p-4" /> : <span className="text-slate-300">Sem Logo</span>}
                        <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase">Alterar</div>
                    </div>
                    <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'app')} />
                </div>
                <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-400">Logo do Relatório (PDF)</p>
                    <div onClick={() => reportLogoInputRef.current?.click()} className="h-32 bg-slate-50 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-100 overflow-hidden relative group">
                        {config.reportLogo ? <img src={config.reportLogo} className="max-h-full object-contain p-4" /> : <span className="text-slate-300">Sem Logo</span>}
                        <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase">Alterar</div>
                    </div>
                    <input type="file" ref={reportLogoInputRef} hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'report')} />
                </div>
            </div>
        </div>

        {/* Sync Section */}
        <div className="bg-primary p-8 rounded-premium text-white shadow-2xl flex flex-col justify-center text-center space-y-4">
            <h3 className="text-2xl font-black italic">Sincronização Online</h3>
            <p className="text-white/70 text-sm">Todas as alterações de logo e listas são enviadas diretamente para a sua planilha Google.</p>
            <button onClick={handleSaveConfig} disabled={isSyncing} className="bg-white text-primary py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
               {isSyncing ? 'Sincronizando...' : 'Salvar Alterações na Nuvem'}
            </button>
        </div>
      </div>

      {/* Bulk Import Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-slate-800">🏥 Importar Setores</h3>
            <p className="text-xs text-slate-400 font-bold uppercase italic">Cole a lista do Excel ou Word abaixo (um por linha):</p>
            <textarea 
                className="w-full h-64 p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-slate-600 focus:ring-4 focus:ring-primary/10"
                value={sectorInput}
                onChange={e => setSectorInput(e.target.value)}
                placeholder="Ex:&#10;UTI Adulto&#10;Pediatria&#10;Pronto Socorro"
            />
        </div>
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-slate-800">👥 Importar Colaboradores</h3>
            <p className="text-xs text-slate-400 font-bold uppercase italic">Cole a lista do Excel ou Word abaixo (um por linha):</p>
            <textarea 
                className="w-full h-64 p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-slate-600 focus:ring-4 focus:ring-primary/10"
                value={collabInput}
                onChange={e => setCollabInput(e.target.value)}
                placeholder="Ex:&#10;Carlos Silva&#10;Maria Oliveira&#10;José Santos"
            />
        </div>
      </div>
    </div>
  );
};

export default Admin;
