
import React, { useState, useEffect, useMemo } from 'react';
import { SHIFTS } from '../constants';
import { storageService } from '../services/storageService';
import { SmallGroup, User } from '../types';
import SearchableSelect from './SearchableSelect';
import SyncOverlay from './SyncOverlay';

interface SmallGroupFormProps {
  user: User;
  onSuccess: () => void;
}

const SmallGroupForm: React.FC<SmallGroupFormProps> = ({ user, onSuccess }) => {
  const [recentRecords, setRecentRecords] = useState<SmallGroup[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const config = storageService.getConfig();
  const sectors = config.customSectors || [];
  const officialPGs = config.customPGs || [];

  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: '',
    name: '',
    leader: '',
    shift: SHIFTS[0] as any,
    participantsCount: 1
  });

  const loadRecent = () => {
    const all = storageService.getGroups();
    const filtered = all.filter(s => s.chaplainId === user.id);
    setRecentRecords(filtered.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => { loadRecent(); }, []);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return recentRecords;
    return recentRecords.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.sector.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recentRecords, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sector) {
        alert("Preencha o nome do PG e o setor oficial.");
        return;
    }

    setIsSyncing(true);

    const dateObj = new Date(formData.date);
    const group: SmallGroup = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      chaplainId: user.id,
      createdAt: formData.id ? recentRecords.find(r => r.id === formData.id)?.createdAt || new Date().toISOString() : new Date().toISOString()
    } as SmallGroup;

    try {
        await storageService.saveGroup(group);
        alert("Pequeno Grupo registrado com sucesso!");
        setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: '', name: '', leader: '', shift: SHIFTS[0] as any, participantsCount: 1 });
        loadRecent();
        onSuccess();
    } finally {
        setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-12">
      <SyncOverlay isVisible={isSyncing} />
      
      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 border-b pb-4 italic flex items-center gap-3">
          <span className="text-3xl">🏠</span> Pequeno Grupo
        </h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[11px] md:text-[10px] font-black text-slate-500 md:text-slate-400 uppercase tracking-widest ml-1">Data *</label>
            <input type="date" required className="w-full px-4 py-4 md:py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          </div>

          <SearchableSelect 
            label="Selecione o PG Oficial" 
            options={officialPGs} 
            value={formData.name} 
            onChange={val => setFormData({...formData, name: val})}
            placeholder="Escolha na lista oficial..."
            required
          />

          <SearchableSelect 
            label="Setor do Hospital" 
            options={sectors} 
            value={formData.sector} 
            onChange={val => setFormData({...formData, sector: val})}
            placeholder="Onde o PG acontece?"
            required
          />

          <div className="space-y-1">
            <label className="text-[11px] md:text-[10px] font-black text-slate-500 md:text-slate-400 uppercase tracking-widest ml-1">Líder do Grupo</label>
            <input type="text" required placeholder="Nome do responsável..." className="w-full px-4 py-4 md:py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" value={formData.leader} onChange={(e) => setFormData({...formData, leader: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] md:text-[10px] font-black text-slate-500 md:text-slate-400 uppercase tracking-widest ml-1">Turno</label>
            <select className="w-full px-4 py-4 md:py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" value={formData.shift} onChange={(e) => setFormData({...formData, shift: e.target.value as any})}>
              {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] md:text-[10px] font-black text-slate-500 md:text-slate-400 uppercase tracking-widest ml-1">Nº Participantes</label>
            <input type="number" required min="1" className="w-full px-4 py-4 md:py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" value={formData.participantsCount} onChange={(e) => setFormData({...formData, participantsCount: Number(e.target.value)})} />
          </div>

          <button type="submit" disabled={isSyncing} className="md:col-span-2 py-5 bg-primary text-white rounded-premium font-black text-lg shadow-xl hover:bg-slate-800 transition-all">
             {formData.id ? 'Salvar Alteração' : 'Registrar PG'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Busca no Histórico</h3>
            <input 
                type="text" 
                placeholder="Filtrar por nome ou setor..." 
                className="bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl text-sm font-bold outline-none focus:border-primary/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHistory.map(record => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-primary/30 transition-all">
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-800 truncate">{record.name}</p>
                <p className="text-[10px] text-orange-500 font-bold uppercase">{record.sector} • {record.participantsCount} presentes</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFormData({...record}); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 bg-slate-50 text-primary rounded-xl">📝</button>
                <button onClick={async () => { if(confirm("Apagar permanentemente?")) { await storageService.deleteGroup(record.id); loadRecent(); } }} className="p-2 bg-slate-50 text-danger rounded-xl font-bold">✕</button>
              </div>
            </div>
          ))}
          {filteredHistory.length === 0 && <div className="md:col-span-2 py-10 text-center text-slate-300 italic">Nenhum registro encontrado para sua busca.</div>}
        </div>
      </div>
    </div>
  );
};

export default SmallGroupForm;
