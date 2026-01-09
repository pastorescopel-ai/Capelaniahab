
import React, { useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { CloudConfig } from '../types';

const Admin: React.FC = () => {
  const [config, setConfig] = useState<CloudConfig>(storageService.getConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [sectorHABInput, setSectorHABInput] = useState((config.customSectorsHAB || []).join('\n'));
  const [sectorHABAInput, setSectorHABAInput] = useState((config.customSectorsHABA || []).join('\n'));
  const [collabInput, setCollabInput] = useState((config.customCollaborators || []).join('\n'));
  const [pgHABInput, setPgHABInput] = useState((config.customPGsHAB || []).join('\n'));
  const [pgHABAInput, setPgHABAInput] = useState((config.customPGsHABA || []).join('\n'));
  
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
    const sectorsHAB = sectorHABInput.split('\n').map(s => s.trim()).filter(s => s !== '');
    const sectorsHABA = sectorHABAInput.split('\n').map(s => s.trim()).filter(s => s !== '');
    const collabs = collabInput.split('\n').map(c => c.trim()).filter(c => c !== '');
    const pgsHAB = pgHABInput.split('\n').map(p => p.trim()).filter(p => p !== '');
    const pgsHABA = pgHABAInput.split('\n').map(p => p.trim()).filter(p => p !== '');
    
    const newConfig = { 
        ...config, 
        customSectorsHAB: sectorsHAB, 
        customSectorsHABA: sectorsHABA,
        customCollaborators: collabs, 
        customPGsHAB: pgsHAB,
        customPGsHABA: pgsHABA
    };
    setIsSyncing(true);
    storageService.saveConfig(newConfig).then(() => {
        setIsSyncing(false);
        alert("Configurações atualizadas!");
    });
  };

  return (
    <div className="space-y-10 pb-40">
      <div className="flex justify-between items-end">
        <h2 className="text-4xl font-black text-slate-800 italic">Administração Master</h2>
        <button onClick={handleSaveConfig} disabled={isSyncing} className="px-10 py-5 bg-primary text-white rounded-premium font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
           {isSyncing ? 'Gravando...' : 'Salvar Configurações'}
        </button>
      </div>

      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-8">
          <h3 className="text-xl font-black text-slate-800 border-b pb-4 uppercase tracking-tighter">🖼️ Identidade Visual</h3>
          <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Logo App</p>
                  <div onClick={() => logoInputRef.current?.click()} className="h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden">
                      {config.appLogo ? <img src={config.appLogo} className="w-full h-full object-contain" /> : <span className="text-slate-300 font-black uppercase text-[10px]">Alterar</span>}
                  </div>
                  <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'app')} />
              </div>
              <div className="space-y-4 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Logo Relatório PDF</p>
                  <div onClick={() => reportLogoInputRef.current?.click()} className="h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden">
                      {config.reportLogo ? <img src={config.reportLogo} className="w-full h-full object-contain" /> : <span className="text-slate-300 font-black uppercase text-[10px]">Alterar</span>}
                  </div>
                  <input type="file" ref={reportLogoInputRef} hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'report')} />
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-primary uppercase tracking-tighter">🏥 Setores HAB</h3>
            <textarea className="w-full h-40 p-4 bg-slate-50 border rounded-3xl font-bold" value={sectorHABInput} onChange={e => setSectorHABInput(e.target.value)} placeholder="Um por linha..." />
        </div>
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-primary uppercase tracking-tighter">🏥 Setores HABA</h3>
            <textarea className="w-full h-40 p-4 bg-slate-50 border rounded-3xl font-bold" value={sectorHABAInput} onChange={e => setSectorHABAInput(e.target.value)} placeholder="Um por linha..." />
        </div>
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-orange-500 uppercase tracking-tighter">🏠 PGs HAB</h3>
            <textarea className="w-full h-40 p-4 bg-slate-50 border rounded-3xl font-bold" value={pgHABInput} onChange={e => setPgHABInput(e.target.value)} placeholder="Um por linha..." />
        </div>
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4">
            <h3 className="text-xl font-black text-orange-500 uppercase tracking-tighter">🏠 PGs HABA</h3>
            <textarea className="w-full h-40 p-4 bg-slate-50 border rounded-3xl font-bold" value={pgHABAInput} onChange={e => setPgHABAInput(e.target.value)} placeholder="Um por linha..." />
        </div>
        <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-xl space-y-4 md:col-span-2">
            <h3 className="text-xl font-black text-success uppercase tracking-tighter">👥 Equipe de Apoio</h3>
            <textarea className="w-full h-40 p-4 bg-slate-50 border rounded-3xl font-bold" value={collabInput} onChange={e => setCollabInput(e.target.value)} placeholder="Nomes dos colaboradores..." />
        </div>
      </div>
    </div>
  );
};

export default Admin;
