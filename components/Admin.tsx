
import React, { useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { CloudConfig } from '../types';
import SyncOverlay from './SyncOverlay';

const Admin: React.FC = () => {
  const [config, setConfig] = useState<CloudConfig>(storageService.getConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [sectorsHAB, setSectorsHAB] = useState((config.customSectorsHAB || []).join('\n'));
  const [sectorsHABA, setSectorsHABA] = useState((config.customSectorsHABA || []).join('\n'));
  const [pgsHAB, setPgsHAB] = useState((config.customPGsHAB || []).join('\n'));
  const [pgsHABA, setPgsHABA] = useState((config.customPGsHABA || []).join('\n'));
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
      customSectorsHAB: sectorsHAB.split('\n').filter(x => x.trim()),
      customSectorsHABA: sectorsHABA.split('\n').filter(x => x.trim()),
      customPGsHAB: pgsHAB.split('\n').filter(x => x.trim()),
      customPGsHABA: pgsHABA.split('\n').filter(x => x.trim()),
      customCollaborators: collabs.split('\n').filter(x => x.trim()),
      reportTitle,
      reportSubtitle
    };
    await storageService.saveConfig(newConfig);
    setConfig(newConfig);
    setIsSyncing(false);
    alert("Configurações Globais Atualizadas!");
  };

  return (
    <div className="space-y-8 pb-32">
      <SyncOverlay isVisible={isSyncing} />
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-800 uppercase italic">Configurações do Sistema</h2>
        <button onClick={handleSave} className="bg-primary text-white px-8 py-4 rounded-premium font-black shadow-xl hover:scale-105 transition-all">SALVAR TUDO NA NUVEM</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-premium shadow-xl space-y-6">
          <h3 className="text-lg font-black text-primary border-b pb-2">🖼️ IDENTIDADE E RELATÓRIO</h3>
          <div className="grid grid-cols-2 gap-4">
             <div onClick={() => fileRef.current?.click()} className="h-32 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                {config.appLogo ? <img src={config.appLogo} className="h-full w-full object-contain" /> : <span className="text-[10px] font-black opacity-40">LOGO APP</span>}
             </div>
             <div onClick={() => pdfRef.current?.click()} className="h-32 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                {config.reportLogo ? <img src={config.reportLogo} className="h-full w-full object-contain" /> : <span className="text-[10px] font-black opacity-40">LOGO PDF</span>}
             </div>
             <input type="file" ref={fileRef} hidden onChange={e => handleUpload(e, 'app')} />
             <input type="file" ref={pdfRef} hidden onChange={e => handleUpload(e, 'pdf')} />
          </div>
          <input className="w-full p-4 bg-slate-50 border rounded-xl font-bold" placeholder="Título do Relatório" value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
          <input className="w-full p-4 bg-slate-50 border rounded-xl font-bold" placeholder="Subtítulo do Relatório" value={reportSubtitle} onChange={e => setReportSubtitle(e.target.value)} />
        </div>

        <div className="bg-white p-8 rounded-premium shadow-xl space-y-6">
          <h3 className="text-lg font-black text-success border-b pb-2">👥 EQUIPE DE APOIO</h3>
          <textarea className="w-full h-44 p-4 bg-slate-50 border rounded-xl font-bold" value={collabs} onChange={e => setCollabs(e.target.value)} placeholder="Nomes (um por linha)" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-premium shadow-xl space-y-4">
          <h3 className="font-black text-primary uppercase">Setores HAB</h3>
          <textarea className="w-full h-40 p-4 bg-slate-50 border rounded-xl font-bold" value={sectorsHAB} onChange={e => setSectorsHAB(e.target.value)} />
        </div>
        <div className="bg-white p-8 rounded-premium shadow-xl space-y-4">
          <h3 className="font-black text-primary uppercase">Setores HABA</h3>
          <textarea className="w-full h-40 p-4 bg-slate-50 border rounded-xl font-bold" value={sectorsHABA} onChange={e => setSectorsHABA(e.target.value)} />
        </div>
        <div className="bg-white p-8 rounded-premium shadow-xl space-y-4">
          <h3 className="font-black text-orange-500 uppercase">PGs HAB</h3>
          <textarea className="w-full h-40 p-4 bg-slate-50 border rounded-xl font-bold" value={pgsHAB} onChange={e => setPgsHAB(e.target.value)} />
        </div>
        <div className="bg-white p-8 rounded-premium shadow-xl space-y-4">
          <h3 className="font-black text-orange-500 uppercase">PGs HABA</h3>
          <textarea className="w-full h-40 p-4 bg-slate-50 border rounded-xl font-bold" value={pgsHABA} onChange={e => setPgsHABA(e.target.value)} />
        </div>
      </div>
    </div>
  );
};

export default Admin;
