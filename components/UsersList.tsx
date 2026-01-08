import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { User, UserRole } from '../types';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: UserRole.CHAPLAIN });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      alert("Todos os campos são obrigatórios.");
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      ...newUserForm
    };

    storageService.saveUser(newUser).then(() => {
      setUsers(storageService.getUsers());
      setShowAddModal(false);
      setNewUserForm({ name: '', email: '', password: '', role: UserRole.CHAPLAIN });
      alert("Usuário cadastrado com sucesso e sincronizado!");
    }).catch(() => {
      alert("Erro ao salvar usuário.");
    });
  };

  const toggleAdmin = (u: User) => {
    const newRole = u.role === UserRole.ADMIN ? UserRole.CHAPLAIN : UserRole.ADMIN;
    storageService.saveUser({ ...u, role: newRole }).then(() => {
      setUsers(storageService.getUsers());
    });
  };

  const handleRoleChange = (u: User, newRole: UserRole) => {
    storageService.saveUser({ ...u, role: newRole }).then(() => {
      setUsers(storageService.getUsers());
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Gestão da Equipe de Capelania</h2>
          <p className="text-slate-500 font-medium">Controle total de acessos, senhas e cargos ministeriais.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-8 py-4 bg-primary text-white rounded-premium font-black shadow-xl hover:scale-105 active:scale-95 transition-all">
          Cadastrar Novo Acesso
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[500] flex items-center justify-center p-4">
          <form onSubmit={handleAddUser} className="bg-white rounded-premium p-10 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <div>
              <h3 className="text-2xl font-black text-slate-800">Criar Novo Acesso</h3>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Defina as credenciais da equipe</p>
            </div>
            
            <div className="space-y-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                 <input className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary/20" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} placeholder="Ex: João da Silva" required />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail (Login)</label>
                 <input type="email" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary/20" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} placeholder="login@sistema.com" required />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Senha Provisória</label>
                 <input type="password" minLength={4} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold focus:ring-2 focus:ring-primary/20" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} placeholder="Mínimo 4 dígitos" required />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cargo / Função</label>
                 <select className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold" value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value as any})}>
                    <option value={UserRole.CHAPLAIN}>Capelão</option>
                    <option value={UserRole.ASSISTANT}>Assistente</option>
                    <option value={UserRole.ADMIN}>Administrador (Master)</option>
                 </select>
               </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20">Finalizar Cadastro</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map(u => (
          <div key={u.id} className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm space-y-6 hover:shadow-lg transition-all relative group overflow-hidden">
             <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl shrink-0 border-2 border-slate-50 shadow-inner">
                  {u.photoUrl ? <img src={u.photoUrl} className="w-full h-full object-cover rounded-full" /> : "👤"}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-lg truncate" title={u.name}>{u.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.role === UserRole.ADMIN ? 'Administrador' : u.role === UserRole.CHAPLAIN ? 'Capelão' : 'Assistente'}</p>
               </div>
             </div>
             
             <div className="space-y-1 px-1">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">E-mail de Acesso</p>
                <p className="text-sm font-bold text-slate-600 truncate">{u.email}</p>
             </div>

             <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                <div className="flex-1 min-w-[120px]">
                   <select 
                      className="w-full p-2 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-tight text-slate-500 outline-none"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                   >
                      <option value={UserRole.CHAPLAIN}>Capelão</option>
                      <option value={UserRole.ASSISTANT}>Assistente</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                   </select>
                </div>
                <button onClick={async () => { if(confirm(`Deseja realmente remover o acesso de ${u.name}?`)) { await storageService.deleteUser(u.id); setUsers(storageService.getUsers()); } }} className="p-2 bg-danger/5 text-danger rounded-xl text-[10px] font-black uppercase hover:bg-danger hover:text-white transition-all">✕</button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;