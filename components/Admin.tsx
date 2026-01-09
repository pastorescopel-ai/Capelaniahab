
import React, { useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { CloudConfig } from '../types';
import SyncOverlay from './SyncOverlay';

const Admin: React.FC = () => {
  const [config, setConfig] = useState<CloudConfig>(storageService.getConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [sectors, setSectors] = useState((config.customSectors || []).join('\n'));
  const [pgs, setPgs] = useState((config.customPGs || []).join('\n'));
  const [collabs, setCollabs] = useState((config.customCollaborators || []).join('\n'));
  const [reportTitle, setReportTitle] = useState(config.reportTitle || '');
  const [reportSubtitle, setReportSubtitle] = useState(config.reportSubtitle || '');

  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'app' | 'pdf') => {
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

  const handleSave = async () => {
    setIsSyncing(true);
    const newConfig: CloudConfig = {
      ...config,
      customSectors: sectors.split('\n').filter(x => x.trim()),
      customPGs: pgs.split('\n').filter(x => x.trim()),
      customCollaborators: collabs.split('\n').filter(x => x.trim()),
      reportTitle,
      reportSubtitle
    };
    await storageService.saveConfig(newConfig);
    setConfig(newConfig);
    setIsSyncing(false);
    alert("Configurações Atualizadas com Sucesso!");
  };

  return (
    <div className="space-y-8 pb-32">
      <SyncOverlay isVisible={isSyncing} />
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-800 uppercase italic">Painel Admin</h2>
        <button onClick={handleSave} className="bg-primary text-white px-8 py-4 rounded-premium font-black shadow-xl">SALVAR ALTERAÇÕES</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-premium shadow-xl space-y-6">
          <h3 className="text-lg font-black text-primary border-b pb-2">🖼️ IDENTIDADE</h3>
          <div className="grid grid-cols-2 gap-4">
             <div onClick={() => fileRef.current?.click()} className="h-32 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden bg-slate-50">
                {config.appLogo ? <img src={config.appLogo} className="h-full w-full object-contain" /> : <span className="text-[10px] font-black opacity-40">LOGO APP</span>}
             </div>
             <div onClick={() => pdfRef.current?.click()} className="h-32 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden bg-slate-50">
                {config.reportLogo ? <img src={config.reportLogo} className="h-full w-full object-contain" /> : <span className="text-[10px] font-black opacity-40">LOGO PDF</span>}
             </div>
             <input type="file" ref={fileRef} hidden onChange={e => handleUpload(e, 'app')} />
             <input type="file" ref={pdfRef} hidden onChange={e => handleUpload(e, 'pdf')} />
          </div>
          <input className="w-full p-4 bg-slate-50 border rounded-xl font-bold" placeholder="Título Relatório" value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
          <input className="w-full p-4 bg-slate-50 border rounded-xl font-bold" placeholder="Subtítulo Relatório" value={reportSubtitle} onChange={e => setReportSubtitle(e.target.value)} />
        </div>

        <div className="bg-white p-8 rounded-premium shadow-xl space-y-6">
          <h3 className="text-lg font-black text-success border-b pb-2">👥 EQUIPE</h3>
          <textarea className="w-full h-44 p-4 bg-slate-50 border rounded-xl font-bold" value={collabs} onChange={e => setCollabs(e.target.value)} placeholder="Nomes (um por linha)" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-premium shadow-xl space-y-4">
          <h3 className="font-black text-primary uppercase">Setores Cadastrados</h3>
          <textarea className="w-full h-40 p-4 bg-slate-50 border rounded-xl font-bold" value={sectors} onChange={e => setSectors(e.target.value)} placeholder="Um por linha..." />
        </div>
        <div className="bg-white p-8 rounded-premium shadow-xl space-y-4">
          <h3 className="font-black text-orange-500 uppercase">Pequenos Grupos</h3>
          <textarea className="w-full h-40 p-4 bg-slate-50 border rounded-xl font-bold" value={pgs} onChange={e => setPgs(e.target.value)} placeholder="Um por linha..." />
        </div>
      </div>
    </div>
  );
};

export default Admin;
