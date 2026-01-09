
import React, { useState, useEffect, useMemo } from 'react';
import { SECTORS, VISIT_REASONS, MONTHS } from '../constants';
import { storageService } from '../services/storageService';
import { StaffVisit, User } from '../types';

interface StaffVisitFormProps {
  user: User;
  onSuccess: () => void;
}

const StaffVisitForm: React.FC<StaffVisitFormProps> = ({ user, onSuccess }) => {
  const [allVisits, setAllVisits] = useState<StaffVisit[]>([]);
  const [viewDate, setViewDate] = useState(new Date()); // Data para controlar o calendário
  
  const config = storageService.getConfig();
  const sectors = config.customSectors.length > 0 ? config.customSectors : SECTORS;
  const collaborators = config.customCollaborators || [];

  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    sector: sectors[0],
    staffName: '',
    reason: VISIT_REASONS[0],
    needsFollowUp: false,
    observations: ''
  });

  const loadAll = () => {
    const all = storageService.getVisits();
    // Filtramos apenas as visitas deste capelão (ou todas se for Admin)
    const filtered = all.filter(v => user.role === 'ADMIN' || v.chaplainId === user.id);
    setAllVisits(filtered);
  };

  useEffect(() => { loadAll(); }, []);

  // Filtra registros para a lista baseada no mês visualizado no calendário
  const currentMonthRecords = useMemo(() => {
    return allVisits.filter(v => 
      v.month === (viewDate.getMonth() + 1) && 
      v.year === viewDate.getFullYear()
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allVisits, viewDate]);

  // Lógica de Geração dos Dias do Calendário
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Espaços vazios antes do dia 1
    for (let i = 0; i < firstDay; i++) days.push(null);
    // Dias reais do mês
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    
    return days;
  }, [viewDate]);

  // Verifica se existe visita registrada no dia (para o ponto verde)
  const hasVisitOnDay = (day: number) => {
    return allVisits.some(v => {
      const d = new Date(v.date);
      // Ajuste de fuso comum em inputs date
      const visitDay = d.getDate() + 1 === 32 ? 1 : d.getDate() + 1; 
      
      // Validação mais precisa de data
      const dateParts = v.date.split('-');
      const vDay = parseInt(dateParts[2]);
      const vMonth = parseInt(dateParts[1]);
      const vYear = parseInt(dateParts[0]);

      return vDay === day && 
             vMonth === (viewDate.getMonth() + 1) && 
             vYear === viewDate.getFullYear();
    });
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + offset);
    setViewDate(newDate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffName || !formData.date) {
      alert("Preencha o nome do colaborador e a data.");
      return;
    }

    const dateObj = new Date(formData.date);
    const visit: StaffVisit = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
      chaplainId: user.id,
      createdAt: formData.id ? allVisits.find(r => r.id === formData.id)?.createdAt || new Date().toISOString() : new Date().toISOString()
    } as StaffVisit;
    
    storageService.saveVisit(visit).then(() => {
      alert("Atendimento registrado!");
      setFormData({ id: '', date: new Date().toISOString().split('T')[0], sector: sectors[0], staffName: '', reason: VISIT_REASONS[0], needsFollowUp: false, observations: '' });
      loadAll();
      onSuccess();
    });
  };

  const handleToggleFollowUp = async (record: StaffVisit) => {
    const updatedRecord = { ...record, needsFollowUp: !record.needsFollowUp };
    await storageService.saveVisit(updatedRecord);
    loadAll();
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário de Registro (2/3 da largura) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-premium border border-slate-100 shadow-xl">
          <h2 className="text-2xl font-black text-slate-800 mb-8 border-b pb-4 italic">🤝 Apoio a Colaborador</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data do Atendimento *</label>
              <input type="date" required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Setor de Atuação *</label>
              <select required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.sector} onChange={(e) => setFormData({...formData, sector: e.target.value})}>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Colaborador *</label>
              <input type="text" list="collab-list" required placeholder="Digite ou escolha..." className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.staffName} onChange={(e) => setFormData({...formData, staffName: e.target.value})} />
              <datalist id="collab-list">
                {collaborators.map((c, i) => <option key={i} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo Principal *</label>
              <select required className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}>
                {VISIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group cursor-pointer hover:bg-amber-50 transition-colors md:col-span-2">
              <input type="checkbox" id="needs-followup-check" className="w-6 h-6 accent-primary rounded-lg cursor-pointer" checked={formData.needsFollowUp} onChange={e => setFormData({...formData, needsFollowUp: e.target.checked})} />
              <label htmlFor="needs-followup-check" className="text-sm font-black text-slate-700 cursor-pointer select-none">
                  MARCAR PARA RETORNO PASTORAL?
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Sinalizará uma bandeira vermelha no histórico.</p>
              </label>
            </div>
            <textarea rows={3} className="md:col-span-2 w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-medium" placeholder="Relato breve do atendimento..." value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})} />
            <button type="submit" className="md:col-span-2 py-5 bg-primary text-white rounded-premium font-black shadow-xl hover:scale-[1.01] active:scale-95 transition-all">
              {formData.id ? 'Salvar Alterações' : 'Finalizar Atendimento'}
            </button>
          </form>
        </div>

        {/* Calendário Visual (1/3 da largura) */}
        <div className="bg-white p-6 rounded-premium border border-slate-100 shadow-xl flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">❮</button>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">{viewDate.getFullYear()}</p>
                    <p className="text-lg font-black text-slate-800 uppercase">{MONTHS[viewDate.getMonth()]}</p>
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">❯</button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['D','S','T','Q','Q','S','S'].map(d => (
                    <div key={d} className="text-[9px] font-black text-slate-300 text-center uppercase">{d}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2 flex-1">
                {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`}></div>;
                    const active = hasVisitOnDay(day);
                    const isToday = day === new Date().getDate() && viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();
                    
                    return (
                        <div 
                          key={day} 
                          className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all relative
                            ${active ? 'bg-success/10 text-success ring-1 ring-success/30' : 'text-slate-400 hover:bg-slate-50'}
                            ${isToday ? 'border-2 border-primary/20' : ''}
                          `}
                        >
                            {day}
                            {active && <div className="w-1.5 h-1.5 bg-success rounded-full absolute bottom-1 shadow-sm"></div>}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success/20 rounded-md border border-success/30"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Atendimentos Realizados</span>
                </div>
                <button onClick={() => setViewDate(new Date())} className="text-[9px] font-black text-primary uppercase text-center mt-2 hover:underline">Ir para hoje</button>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Histórico de {MONTHS[viewDate.getMonth()]} ({currentMonthRecords.length})</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentMonthRecords.map(record => (
            <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md flex items-center justify-between group relative overflow-hidden">
              <div className="flex items-center gap-4 flex-1">
                {/* Bandeira de Retorno */}
                <button 
                  onClick={() => handleToggleFollowUp(record)}
                  className={`p-2 rounded-xl transition-all hover:scale-110 ${record.needsFollowUp ? 'bg-danger/10 text-danger animate-pulse' : 'bg-success/10 text-success'}`}
                  title={record.needsFollowUp ? "Pendente de Retorno (Clique para finalizar)" : "Retorno Realizado (Clique para reabrir)"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.221 21.0001C4.84715 21.0001 4.54419 20.6971 4.54419 20.3233V4.07326C4.54419 3.69941 4.84715 3.39645 5.221 3.39645C5.36709 3.39645 5.51036 3.44391 5.62886 3.5317L18.1544 11.2317C18.4601 11.4198 18.5524 11.8239 18.3644 12.1296C18.3103 12.2176 18.2384 12.2895 18.1504 12.3436L5.62483 20.8682C5.50854 20.9542 5.36653 21.0001 5.221 21.0001Z" />
                  </svg>
                </button>

                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 truncate uppercase text-sm tracking-tight">{record.staffName}</p>
                  <p className="text-[10px] text-green-600 font-bold uppercase">{record.sector} • {record.reason} • {new Date(record.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</p>
                </div>
              </div>

              <div className="flex gap-2">
                 <button onClick={() => { setFormData({...record}); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 bg-slate-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">📝</button>
                 <button onClick={async () => { if(confirm("Apagar permanentemente?")) { await storageService.deleteVisit(record.id); loadAll(); } }} className="p-2 bg-slate-50 text-danger rounded-xl hover:bg-danger hover:text-white transition-all">✕</button>
              </div>
            </div>
          ))}
          {currentMonthRecords.length === 0 && (
            <div className="md:col-span-2 py-10 text-center text-slate-300 italic text-sm">Nenhuma visita registrada neste mês selecionado.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffVisitForm;
