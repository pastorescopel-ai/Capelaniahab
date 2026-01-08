
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
          <p className="text-slate-500 font-medium italic">Gestão de interface e listas globais.</p>
        </div>
        <button onClick={handleSaveConfig} disabled={isSyncing} className="px-10 py-5 bg-primary text-white rounded-premium font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
           {isSyncing ? 'Sincronizando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-8">
            <h3 className="text-xl font-black text-slate-800 border-b pb-4">🖼️ Logomarcas</h3>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-400">App Logo</p>
                    <div onClick={() => logoInputRef.current?.click()} className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-100 overflow-hidden relative group">
                        {config.appLogo ? <img src={config.appLogo} className="w-full h-full object-cover" /> : <span className="text-slate-300 font-black uppercase text-[10px]">Upload</span>}
                    </div>
                    <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'app')} />
                </div>
                <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-400">Relatório Logo</p>
                    <div onClick={() => reportLogoInputRef.current?.click()} className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-100 overflow-hidden relative group">
                        {config.reportLogo ? <img src={config.reportLogo} className="w-full h-full object-contain" /> : <span className="text-slate-300 font-black uppercase text-[10px]">Upload</span>}
                    </div>
                    <input type="file" ref={reportLogoInputRef} hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'report')} />
                </div>
            </div>
        </div>

        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-6">
            <h3 className="text-xl font-black text-slate-800 border-b pb-4">📄 Cabeçalho do Relatório</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 items-end">
                    <div className="col-span-3 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Título Principal</label>
                        <input className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={config.reportTitle} onChange={e => setConfig({...config, reportTitle: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Tam. Fonte</label>
                        <input type="number" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={config.reportTitleFontSize} onChange={e => setConfig({...config, reportTitleFontSize: e.target.value})} />
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-4 items-end">
                    <div className="col-span-3 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Subtítulo</label>
                        <input className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={config.reportSubtitle} onChange={e => setConfig({...config, reportSubtitle: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Tam. Fonte</label>
                        <input type="number" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={config.reportSubtitleFontSize} onChange={e => setConfig({...config, reportSubtitleFontSize: e.target.value})} />
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-slate-800">🏥 Setores (Um por linha)</h3>
            <textarea 
                className="w-full h-60 p-6 bg-slate-50 border rounded-3xl outline-none font-bold text-slate-600 no-scrollbar"
                value={sectorInput}
                onChange={e => setSectorInput(e.target.value)}
            />
        </div>
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-slate-800">👥 Colaboradores (Um por linha)</h3>
            <textarea 
                className="w-full h-60 p-6 bg-slate-50 border rounded-3xl outline-none font-bold text-slate-600 no-scrollbar"
                value={collabInput}
                onChange={e => setCollabInput(e.target.value)}
            />
        </div>
      </div>
    </div>
  );
};

export default Admin;
