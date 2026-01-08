
import React, { useState, useEffect } from 'react';
import { SECTORS, SHIFTS } from '../constants';
import { storageService } from '../services/storageService';
import { SmallGroup, User } from '../types';

interface SmallGroupFormProps {
  user: User;
  onSuccess: () => void;
}

const SmallGroupForm: React.FC<SmallGroupFormProps> = ({ user, onSuccess }) => {
  const [recentRecords, setRecentRecords] = useState<SmallGroup[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: SECTORS[0],
    name: '',
    leader: '',
    shift: SHIFTS[0],
    participantsCount: 1
  });

  const loadRecent = () => {
    const now = new Date();
    const all = storageService.getGroups();
    const filtered = all.filter(s => s.month === (now.getMonth() + 1) && s.year === now.getFullYear() && s.chaplainId === user.id);
    setRecentRecords(filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => { loadRecent(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(formData.date);
    const group: SmallGroup = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      chaplainId: user.id,
      createdAt: formData.id ? recentRecords.find(r => r.id === formData.id)?.createdAt || new Date().toISOString() : new Date().toISOString()
    } as SmallGroup;
    storageService.saveGroup(group).then(() => {
      alert("PG Salvo!");
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: SECTORS[0], name: '', leader: '', shift: SHIFTS[0], participantsCount: 1 });
      loadRecent();
      onSuccess();
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apagar permanentemente?")) {
      await storageService.deleteGroup(id);
      loadRecent();
    }
  };

  return (
    <div className="space-y-12">
      <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><span>🏠</span> Pequeno Grupo</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="date" required className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          <select required className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.sector} onChange={(e) => setFormData({...formData, sector: e.target.value})}>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" required placeholder="Nome do Grupo" className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <input type="text" required placeholder="Líder" className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.leader} onChange={(e) => setFormData({...formData, leader: e.target.value})} />
          <input type="number" required min="1" className="px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.participantsCount} onChange={(e) => setFormData({...formData, participantsCount: Number(e.target.value)})} />
          <button type="submit" className="md:col-span-2 py-5 bg-primary text-white rounded-premium font-black">Salvar PG</button>
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recentRecords.map(record => (
          <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-black text-slate-800">{record.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{record.sector} • {record.participantsCount} pessoas</p>
            </div>
            <button onClick={() => handleDelete(record.id)} className="p-2 bg-slate-50 text-danger rounded-xl">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmallGroupForm;
