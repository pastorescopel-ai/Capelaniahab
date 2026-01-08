
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { User, UserRole } from '../types';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '' });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserForm.name && newUserForm.email && newUserForm.password) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: newUserForm.name,
        email: newUserForm.email,
        password: newUserForm.password,
        role: UserRole.CHAPLAIN
      };
      storageService.saveUser(newUser);
      setUsers(storageService.getUsers());
      setShowAddModal(false);
      setNewUserForm({ name: '', email: '', password: '' });
      alert("Novo capelão cadastrado com sucesso!");
    }
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      storageService.saveUser(editingUser);
      setUsers(storageService.getUsers());
      setEditingUser(null);
      alert("Dados atualizados!");
    }
  };

  const deleteUser = () => {
    if (confirmDeleteUser) {
      storageService.deleteUser(confirmDeleteUser.id);
      setUsers(storageService.getUsers());
      setConfirmDeleteUser(null);
      alert("Usuário removido do sistema.");
    }
  };

  const toggleRole = (u: User) => {
    const newRole = u.role === UserRole.ADMIN ? UserRole.CHAPLAIN : UserRole.ADMIN;
    const updated = { ...u, role: newRole };
    storageService.saveUser(updated);
    setUsers(storageService.getUsers());
    alert(`Usuário alterado para ${newRole}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Equipe de Capelania</h2>
          <p className="text-slate-500 font-medium text-lg">Gerenciamento de acessos e permissões.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-8 py-4 bg-primary text-white rounded-premium font-black shadow-xl shadow-primary/20 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
        >
          <span>Adicionar Novo</span>
          <span className="text-2xl font-light">+</span>
        </button>
      </div>

      {/* Modal Adicionar Usuário - Garantido Funcionamento */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[500] flex items-center justify-center p-4">
          <form onSubmit={handleAddUser} className="bg-white rounded-premium p-10 max-w-md w-full space-y-8 shadow-2xl animate-in zoom-in duration-300">
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Criar Acesso</h3>
              <p className="text-slate-400 font-bold">Defina as credenciais do novo capelão.</p>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Nome Completo</label>
                <input 
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold" 
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
                  placeholder="Ex: Pastor Davi Silva"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">E-mail de Login</label>
                <input 
                  type="email"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold" 
                  value={newUserForm.email}
                  onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                  placeholder="capelao@hospital.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Senha de Entrada</label>
                <input 
                  type="password"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 font-bold" 
                  value={newUserForm.password}
                  onChange={e => setNewUserForm({...newUserForm, password: e.target.value})}
                  placeholder="Senha forte"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black">Cancelar</button>
              <button type="submit" className="flex-1 py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20">Finalizar Cadastro</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-premium p-10 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center text-4xl mx-auto">⚠️</div>
            <h3 className="text-2xl font-black text-slate-800">Remover Equipe?</h3>
            <p className="text-slate-500 font-medium italic leading-relaxed">O acesso de <strong>{confirmDeleteUser.name}</strong> será apagado permanentemente de todos os dispositivos.</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDeleteUser(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Voltar</button>
              <button onClick={deleteUser} className="flex-1 py-4 bg-danger text-white rounded-2xl font-bold shadow-lg shadow-danger/20">Sim, Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* Listagem Estilizada */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map((u) => (
          <div key={u.id} className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm space-y-6 group hover:border-primary/30 transition-all relative overflow-hidden">
             <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 ${u.role === UserRole.ADMIN ? 'bg-amber-500' : 'bg-primary'}`}></div>
             
             <div className="flex items-center gap-5">
               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl relative overflow-hidden ring-8 ring-slate-50 shrink-0">
                 {u.photoUrl ? <img src={u.photoUrl} alt="" className="w-full h-full object-cover" /> : "👤"}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="font-black text-slate-800 truncate text-xl">{u.name}</p>
                 <p className="text-xs text-slate-400 truncate font-bold uppercase tracking-wider">{u.email}</p>
                 <div className="mt-3">
                   <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${u.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                     {u.role}
                   </span>
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
               <button 
                 onClick={() => toggleRole(u)}
                 className="py-3 px-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
               >
                 Tornar {u.role === UserRole.ADMIN ? 'Capelão' : 'Admin'}
               </button>
               <button 
                 onClick={() => setConfirmDeleteUser(u)}
                 className="py-3 px-4 bg-danger/5 text-danger rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-danger hover:text-white transition-all"
               >
                 Remover
               </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;
