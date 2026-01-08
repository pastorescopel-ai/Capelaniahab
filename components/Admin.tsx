import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { CloudConfig } from '../types';

const Admin: React.FC = () => {
  const [config, setConfig] = useState<CloudConfig>(storageService.getConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSaveConfig = () => {
    storageService.saveConfig(config);
    alert("Configurações salvas!");
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    const ok = await storageService.pullFromCloud();
    setIsSyncing(false);
    if (ok) alert("Sincronização realizada com sucesso!");
    else alert("Erro ao sincronizar com o Google Sheets.");
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Administração</h2>
        <p className="text-slate-500 font-medium">Controle de sistema e integração com a nuvem.</p>
      </div>

      <div className="bg-white p-10 rounded-premium border border-slate-100 shadow-xl space-y-8">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <h3 className="text-2xl font-black text-slate-800 italic">Conexão Google Sheets</h3>
            <div className="flex gap-4">
              <button 
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}
              >
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
              </button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2 opacity-60">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Endpoint de Nuvem (Configurado no Código)</label>
            <div className="w-full px-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-mono text-[10px] truncate">
              {config.databaseURL || 'Não configurado internamente'}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ID da Planilha Master (Opcional)</label>
            <input 
              type="text" 
              placeholder="Cole o ID da planilha para referência"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-mono text-xs"
              value={config.spreadsheetId}
              onChange={(e) => setConfig({...config, spreadsheetId: e.target.value})}
            />
          </div>
        </div>
        
        <button onClick={handleSaveConfig} className="w-full py-5 bg-success text-white rounded-2xl font-black text-xl shadow-xl shadow-success/20">
          Atualizar Preferências
        </button>
      </div>

      <div className="bg-slate-900 p-10 rounded-premium text-white flex items-center gap-8">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-4xl shrink-0">☁️</div>
          <div>
            <h3 className="text-xl font-bold mb-2">Sincronização Transparente</h3>
            <p className="text-white/60 text-sm italic">
              Este sistema está configurado para salvar todos os dados automaticamente no seu Google Sheets. 
              Os usuários não precisam configurar nada, apenas logar e usar.
            </p>
          </div>
      </div>
    </div>
  );
};

export default Admin;