
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
    // Importação em massa: quebra por linha e remove vazios
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight italic">Administração do Sistema</h2>
          <p className="text-slate-500 font-medium italic">Configuração de interface, logos e listas de apoio.</p>
        </div>
        <button onClick={handleSaveConfig} disabled={isSyncing} className="px-10 py-5 bg-primary text-white rounded-premium font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
           {isSyncing ? 'Sincronizando...' : 'Salvar Alterações Online'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Identidade Visual */}
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-8">
            <h3 className="text-xl font-black text-slate-800 border-b pb-4 flex items-center gap-2">🖼️ Identidade Visual</h3>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-400">Logo do App (Login/Sidebar)</p>
                    <div onClick={() => logoInputRef.current?.click()} className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-100 overflow-hidden relative group">
                        {config.appLogo ? <img src={config.appLogo} className="w-full h-full object-cover" /> : <span className="text-slate-300 font-black uppercase text-[10px]">Alterar Logo App</span>}
                        <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase">Trocar Imagem</div>
                    </div>
                    <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'app')} />
                </div>
                <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-400">Logo do Relatório (PDF)</p>
                    <div onClick={() => reportLogoInputRef.current?.click()} className="h-40 bg-slate-50 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-100 overflow-hidden relative group">
                        {config.reportLogo ? <img src={config.reportLogo} className="w-full h-full object-contain" /> : <span className="text-slate-300 font-black uppercase text-[10px]">Alterar Logo PDF</span>}
                        <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase">Trocar Imagem</div>
                    </div>
                    <input type="file" ref={reportLogoInputRef} hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'report')} />
                </div>
            </div>
        </div>

        {/* Informação Geral */}
        <div className="bg-slate-900 p-8 rounded-premium text-white shadow-2xl flex flex-col justify-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl italic">CLOUD</div>
            <h3 className="text-2xl font-black italic relative z-10">Conexão com a Nuvem</h3>
            <p className="text-white/60 text-sm relative z-10">Seu sistema está sincronizado com a Planilha Google. Todas as listas importadas abaixo e os logos aparecerão para todos os membros da equipe instantaneamente após salvar.</p>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2">
                <p className="text-[10px] font-black uppercase text-white/40">URL do Banco de Dados</p>
                <p className="text-xs font-mono break-all opacity-80">{config.databaseURL}</p>
            </div>
        </div>
      </div>

      {/* Importação de Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-slate-800">🏥 Importar Setores (Massa)</h3>
            <p className="text-xs text-slate-400 font-bold uppercase italic">Cole uma coluna do Excel ou Word (um por linha):</p>
            <textarea 
                className="w-full h-80 p-6 bg-slate-50 border rounded-3xl outline-none font-bold text-slate-600 focus:ring-4 focus:ring-primary/10 transition-all no-scrollbar"
                value={sectorInput}
                onChange={e => setSectorInput(e.target.value)}
                placeholder="Ex:&#10;UTI Adulto&#10;Pediatria&#10;Pronto Socorro&#10;Administrativo"
            />
        </div>
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-slate-800">👥 Importar Colaboradores (Massa)</h3>
            <p className="text-xs text-slate-400 font-bold uppercase italic">Cole uma coluna do Excel ou Word (um por linha):</p>
            <textarea 
                className="w-full h-80 p-6 bg-slate-50 border rounded-3xl outline-none font-bold text-slate-600 focus:ring-4 focus:ring-primary/10 transition-all no-scrollbar"
                value={collabInput}
                onChange={e => setCollabInput(e.target.value)}
                placeholder="Ex:&#10;Dr. Ricardo Silva&#10;Enf. Maria Oliveira&#10;José dos Santos"
            />
        </div>
      </div>
    </div>
  );
};

export default Admin;
