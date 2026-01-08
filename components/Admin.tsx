
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
        alert("Configurações salvas com sucesso!");
    });
  };

  return (
    <div className="space-y-10 pb-40 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Administração</h2>
          <p className="text-slate-500 font-medium italic">Gestão de interface, relatórios e listas.</p>
        </div>
        <button onClick={handleSaveConfig} disabled={isSyncing} className="px-10 py-5 bg-primary text-white rounded-premium font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
           {isSyncing ? 'Sincronizando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Logos */}
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-8">
            <h3 className="text-xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">🖼️ Logomarcas</h3>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-400">App Logo (Sidebar)</p>
                    <div onClick={() => logoInputRef.current?.click()} className="h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100 overflow-hidden">
                        {config.appLogo ? <img src={config.appLogo} className="w-full h-full object-contain" /> : <span className="text-slate-300 font-black uppercase text-[10px]">Upload</span>}
                    </div>
                    <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'app')} />
                </div>
                <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-400">Relatório Logo (PDF)</p>
                    <div onClick={() => reportLogoInputRef.current?.click()} className="h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100 overflow-hidden">
                        {config.reportLogo ? <img src={config.reportLogo} className="w-full h-full object-contain" /> : <span className="text-slate-300 font-black uppercase text-[10px]">Upload</span>}
                    </div>
                    <input type="file" ref={reportLogoInputRef} hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'report')} />
                </div>
            </div>
        </div>

        {/* Configurações de Texto do Relatório */}
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-6">
            <h3 className="text-xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">📄 Cabeçalho do Relatório</h3>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Título do Documento</label>
                        <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20" value={config.reportTitle} onChange={e => setConfig({...config, reportTitle: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase text-nowrap">Tam. Fonte (px)</label>
                        <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={config.reportTitleFontSize} onChange={e => setConfig({...config, reportTitleFontSize: e.target.value})} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Subtítulo do Documento</label>
                        <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20" value={config.reportSubtitle} onChange={e => setConfig({...config, reportSubtitle: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase text-nowrap">Tam. Fonte (px)</label>
                        <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={config.reportSubtitleFontSize} onChange={e => setConfig({...config, reportSubtitleFontSize: e.target.value})} />
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">🏥 Setores do Hospital</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Um setor por linha</p>
            <textarea 
                className="w-full h-60 p-6 bg-slate-50 border rounded-3xl outline-none font-bold text-slate-600 no-scrollbar focus:ring-2 focus:ring-primary/20"
                value={sectorInput}
                onChange={e => setSectorInput(e.target.value)}
                placeholder="UTI Adulto&#10;Pronto Socorro..."
            />
        </div>
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">👥 Lista de Colaboradores</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Um nome por linha</p>
            <textarea 
                className="w-full h-60 p-6 bg-slate-50 border rounded-3xl outline-none font-bold text-slate-600 no-scrollbar focus:ring-2 focus:ring-primary/20"
                value={collabInput}
                onChange={e => setCollabInput(e.target.value)}
                placeholder="João da Silva&#10;Maria Oliveira..."
            />
        </div>
      </div>
    </div>
  );
};

export default Admin;
