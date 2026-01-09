
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { SmallGroup, User, HospitalUnit } from '../types';
import { SHIFTS } from '../constants';
import SearchableSelect from './SearchableSelect';
import SyncOverlay from './SyncOverlay';

interface Props { user: User; onSuccess: () => void; }

const SmallGroupForm: React.FC<Props> = ({ user, onSuccess }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [unit, setUnit] = useState<HospitalUnit>('HAB');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sector: '', name: '', leader: '', shift: SHIFTS[0], participantsCount: 1
  });

  const config = storageService.getConfig();
  const sectors = unit === 'HAB' ? config.customSectorsHAB : config.customSectorsHABA;
  const allGroups = storageService.getGroups();

  const myRecent = useMemo(() => {
    return allGroups
      .filter((r: SmallGroup) => r.chaplainId === user.id)
      .sort((a: SmallGroup, b: SmallGroup) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [allGroups, user.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sector || !formData.name) return alert("Selecione setor e PG.");
    setIsSyncing(true);
    const date = new Date(formData.date);
    const group: SmallGroup = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      hospitalUnit: unit,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      chaplainId: user.id,
      createdAt: new Date().toISOString()
    } as SmallGroup;
    await storageService.saveGroup(group);
    setIsSyncing(false);
    setFormData({...formData, name: '', leader: '', participantsCount: 1});
    onSuccess();
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Excluir PG?")) return;
    setIsSyncing(true);
    await storageService.deleteGroup(id);
    setIsSyncing(false);
    onSuccess();
  };

  return (
    <div className="space-y-6">
      <SyncOverlay isVisible={isSyncing} />
      <form onSubmit={handleSave} className="bg-white p-8 rounded-premium shadow-xl space-y-6">
        <h2 className="text-2xl font-black italic">🏠 Novo Pequeno Grupo</h2>
        <div className="flex gap-4">
          {['HAB', 'HABA'].map(u => (
            <button key={u} type="button" onClick={() => setUnit(u as HospitalUnit)} className={`flex-1 py-3 rounded-xl font-black transition-all ${unit === u ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>UNIDADE {u}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="date" className="p-4 bg-slate-50 border rounded-xl font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          <SearchableSelect label="Setor" options={sectors} value={formData.sector} onChange={v => setFormData({...formData, sector: v})} />
          <SearchableSelect label="PG Oficial" options={unit === 'HAB' ? config.customPGsHAB : config.customPGsHABA} value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <input className="p-4 bg-slate-50 border rounded-xl font-bold" placeholder="Líder" value={formData.leader} onChange={e => setFormData({...formData, leader: e.target.value})} />
          <input type="number" min="1" className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={formData.participantsCount} onChange={e => setFormData({...formData, participantsCount: parseInt(e.target.value)})} />
        </div>
        <button type="submit" className="w-full py-5 bg-primary text-white rounded-premium font-black shadow-xl">SALVAR PEQUENO GRUPO</button>
      </form>

      <div className="bg-white p-6 rounded-premium shadow-lg border border-slate-100">
        <h3 className="text-[11px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full"></span> Meus PGs Recentes
        </h3>
        <div className="space-y-3">
          {myRecent.length > 0 ? myRecent.map((r: SmallGroup) => (
            <div key={r.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-black text-slate-800">{r.name}</p>
                <p className="text-[10px] font-bold text-primary uppercase">{r.sector} • {r.participantsCount} pessoas • {r.date.split('-').reverse().join('/')}</p>
              </div>
              <button onClick={() => handleDelete(r.id)} className="p-2 text-danger rounded-xl">✕</button>
            </div>
          )) : <p className="text-center py-4 text-xs font-bold text-slate-400 italic">Nenhum PG recente.</p>}
        </div>
      </div>
    </div>
  );
};

export default SmallGroupForm;
