
import React, { useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { CloudConfig } from '../types';

const Admin: React.FC = () => {
  const [config, setConfig] = useState<CloudConfig>(storageService.getConfig());
  const [newSector, setNewSector] = useState('');
  const [newCollab, setNewCollab] = useState('');
  
  const isOnline = config.databaseURL && config.spreadsheetId;

  const appLogoInput = useRef<HTMLInputElement>(null);
  const reportLogoInput = useRef<HTMLInputElement>(null);
  const importBackupInput = useRef<HTMLInputElement>(null);
  const importListInput = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'SECTOR' | 'COLLAB' | null>(null);

  const handleSaveConfig = () => {
    storageService.saveConfig(config);
    alert("Configurações do sistema salvas!");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'app' | 'report') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newConfig = { ...config };
        if (type === 'app') newConfig.appLogo = base64;
        else newConfig.reportLogo = base64;
        setConfig(newConfig);
        storageService.saveConfig(newConfig);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSector = () => {
    if (newSector.trim()) {
      const updatedSectors = [...(config.customSectors || []), newSector.trim()];
      const newConfig = { ...config, customSectors: updatedSectors };
      setConfig(newConfig);
      storageService.saveConfig(newConfig);
      setNewSector('');
    }
  };

  const handleAddCollab = () => {
    if (newCollab.trim()) {
      const updatedCollabs = [...(config.customCollaborators || []), newCollab.trim()];
      const newConfig = { ...config, customCollaborators: updatedCollabs };
      setConfig(newConfig);
      storageService.saveConfig(newConfig);
      setNewCollab('');
    }
  };

  const removeSector = (idx: number) => {
    const updated = config.customSectors.filter((_, i) => i !== idx);
    const newConfig = { ...config, customSectors: updated };
    setConfig(newConfig);
    storageService.saveConfig(newConfig);
  };

  const removeCollab = (idx: number) => {
    const updated = config.customCollaborators.filter((_, i) => i !== idx);
    const newConfig = { ...config, customCollaborators: updated };
    setConfig(newConfig);
    storageService.saveConfig(newConfig);
  };

  const handleListImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importType) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      
      const newConfig = { ...config };
      if (importType === 'SECTOR') {
        newConfig.customSectors = Array.from(new Set([...(config.customSectors || []), ...lines]));
      } else {
        newConfig.customCollaborators = Array.from(new Set([...(config.customCollaborators || []), ...lines]));
      }
      
      setConfig(newConfig);
      storageService.saveConfig(newConfig);
      alert(`Importação concluída: ${lines.length} itens adicionados.`);
      setImportType(null);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Administração</h2>
          <p className="text-slate-500 font-medium text-lg">Gerenciamento global do sistema e sincronização.</p>
        </div>
        
        <div className={`px-6 py-4 rounded-premium border flex items-center gap-3 shadow-sm ${isOnline ? 'bg-success/10 border-success/20 text-success' : 'bg-warning/10 border-warning/20 text-warning'}`}>
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-warning'}`}></div>
          <span className="font-black text-xs uppercase tracking-widest">
            {isOnline ? 'Online - Planilha Conectada' : 'Offline - Dados Locais'}
          </span>
        </div>
      </div>

      {/* Sincronização Google Sheets */}
      <div className="bg-white p-10 rounded-premium border border-slate-100 shadow-xl space-y-8">
        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <span className="w-10 h-10 bg-success/10 text-success rounded-xl flex items-center justify-center text-sm">📊</span>
          Sincronização Online
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">URL do Web App (Google Scripts)</label>
            <input 
              type="text" 
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-mono text-xs"
              value={config.databaseURL || ''}
              onChange={(e) => setConfig({...config, databaseURL: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ID da Planilha Google</label>
            <input 
              type="text" 
              placeholder="Ex: 1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-mono text-xs"
              value={config.spreadsheetId || ''}
              onChange={(e) => setConfig({...config, spreadsheetId: e.target.value})}
            />
          </div>
        </div>
        <button onClick={handleSaveConfig} className="w-full py-5 bg-success text-white rounded-2xl font-black text-xl shadow-xl shadow-success/20 hover:scale-[1.02] transition-all">Salvar Configuração de Nuvem</button>
      </div>

      {/* Gerenciamento de Listas (Setores e Colaboradores) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Setores Customizados */}
        <div className="bg-white p-10 rounded-premium border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-800">Setores Adicionais</h3>
            <button 
              onClick={() => { setImportType('SECTOR'); importListInput.current?.click(); }}
              className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all"
            >
              Importar (.csv/.txt)
            </button>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Nome do novo setor..."
              className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              value={newSector}
              onChange={(e) => setNewSector(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSector()}
            />
            <button onClick={handleAddSector} className="px-6 py-4 bg-primary text-white rounded-2xl font-bold">+</button>
          </div>

          <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
            {config.customSectors?.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <span className="font-bold text-slate-700">{s}</span>
                <button onClick={() => removeSector(idx)} className="text-danger opacity-0 group-hover:opacity-100 transition-opacity">Remover</button>
              </div>
            ))}
            {(!config.customSectors || config.customSectors.length === 0) && <p className="text-center text-slate-400 italic py-4">Nenhum setor customizado.</p>}
          </div>
        </div>

        {/* Colaboradores Customizados */}
        <div className="bg-white p-10 rounded-premium border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-800">Colaboradores</h3>
            <button 
              onClick={() => { setImportType('COLLAB'); importListInput.current?.click(); }}
              className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all"
            >
              Importar (.csv/.txt)
            </button>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Nome do colaborador..."
              className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20"
              value={newCollab}
              onChange={(e) => setNewCollab(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCollab()}
            />
            <button onClick={handleAddCollab} className="px-6 py-4 bg-primary text-white rounded-2xl font-bold">+</button>
          </div>

          <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
            {config.customCollaborators?.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <span className="font-bold text-slate-700">{c}</span>
                <button onClick={() => removeCollab(idx)} className="text-danger opacity-0 group-hover:opacity-100 transition-opacity">Remover</button>
              </div>
            ))}
            {(!config.customCollaborators || config.customCollaborators.length === 0) && <p className="text-center text-slate-400 italic py-4">Nenhuma lista importada.</p>}
          </div>
        </div>
      </div>

      <input type="file" ref={importListInput} hidden accept=".txt,.csv" onChange={handleListImport} />

      {/* Logos Identidade Visual */}
      <div className="bg-white p-10 rounded-premium border border-slate-100 shadow-xl space-y-8">
        <h3 className="text-2xl font-black text-slate-800">Identidade Visual</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Logo do Aplicativo</label>
            <div 
              onClick={() => appLogoInput.current?.click()}
              className="border-4 border-dashed border-slate-100 rounded-[3rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all min-h-[250px] bg-slate-50 group overflow-hidden"
            >
              {config.appLogo ? (
                <img src={config.appLogo} alt="Logo App" className="max-w-full max-h-40 object-contain shadow-2xl rounded-2xl" />
              ) : (
                <div className="text-center space-y-3">
                  <span className="text-5xl block">🖼️</span>
                  <span className="text-slate-400 font-bold block italic uppercase text-[10px] tracking-widest">Clique para subir logo (App)</span>
                </div>
              )}
              <input type="file" ref={appLogoInput} hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'app')} />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Logo do Relatório (PDF)</label>
            <div 
              onClick={() => reportLogoInput.current?.click()}
              className="border-4 border-dashed border-slate-100 rounded-[3rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all min-h-[250px] bg-slate-50 group overflow-hidden"
            >
              {config.reportLogo ? (
                <img src={config.reportLogo} alt="Logo Relatório" className="max-w-full max-h-40 object-contain shadow-2xl rounded-2xl" />
              ) : (
                <div className="text-center space-y-3">
                  <span className="text-5xl block">📄</span>
                  <span className="text-slate-400 font-bold block italic uppercase text-[10px] tracking-widest">Clique para subir logo (PDF)</span>
                </div>
              )}
              <input type="file" ref={reportLogoInput} hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'report')} />
            </div>
          </div>
        </div>
      </div>

      {/* Backup Total */}
      <div className="bg-slate-900 p-10 rounded-premium text-white space-y-8">
        <h3 className="text-2xl font-black flex items-center gap-3">
          <span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-sm">💾</span>
          Cópia de Segurança do Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <button 
            onClick={() => {
              const data = storageService.exportAllData();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `backup_sistema_capelania_${new Date().toISOString().split('T')[0]}.json`;
              link.click();
            }}
            className="py-5 bg-white text-slate-900 rounded-2xl font-black hover:scale-[1.02] transition-all"
          >
            Exportar Backup Completo
          </button>
          <button 
            onClick={() => importBackupInput.current?.click()}
            className="py-5 bg-white/10 border border-white/20 text-white rounded-2xl font-black hover:bg-white/20 transition-all"
          >
            Importar do Arquivo
          </button>
          <input 
            type="file" 
            ref={importBackupInput} 
            hidden 
            accept=".json" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const text = event.target?.result as string;
                  if (storageService.importAllData(text)) {
                    alert("Dados restaurados! Reiniciando sistema...");
                    window.location.reload();
                  }
                };
                reader.readAsText(file);
              }
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default Admin;
