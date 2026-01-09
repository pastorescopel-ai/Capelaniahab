
import React from 'react';
import { Icons } from '../constants';
import { UserRole, User } from '../types';
import { storageService } from '../services/storageService';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, onLogout }) => {
  const config = storageService.getConfig();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard, roles: [UserRole.ADMIN, UserRole.CHAPLAIN, UserRole.ASSISTANT] },
    { id: 'estudos', label: 'Estudos Bíblicos', icon: Icons.Study, roles: [UserRole.ADMIN, UserRole.CHAPLAIN] },
    { id: 'classes', label: 'Classe Bíblica', icon: Icons.Class, roles: [UserRole.ADMIN, UserRole.CHAPLAIN] },
    { id: 'pgs', label: 'Pequenos Grupos', icon: Icons.PG, roles: [UserRole.ADMIN, UserRole.CHAPLAIN] },
    { id: 'colaboradores', label: 'Colaboradores', icon: Icons.Staff, roles: [UserRole.ADMIN, UserRole.CHAPLAIN] },
    { id: 'reports', label: 'Relatórios', icon: Icons.Reports, roles: [UserRole.ADMIN] },
    { id: 'admin', label: 'Administração', icon: Icons.Admin, roles: [UserRole.ADMIN] },
    { id: 'users', label: 'Usuários', icon: Icons.Users, roles: [UserRole.ADMIN] },
    { id: 'profile', label: 'Meu Perfil', icon: () => <span className="text-xl">⚙️</span>, roles: [UserRole.ADMIN, UserRole.CHAPLAIN, UserRole.ASSISTANT] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="hidden md:flex flex-col w-72 bg-primary h-screen border-r border-white/10 p-6 shadow-2xl text-white">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-14 h-14 shrink-0 overflow-hidden flex items-center justify-center">
          {config.appLogo ? (
            <img src={config.appLogo} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-primary font-black text-2xl">C</span>
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-tight uppercase italic">CAPELANIA HAB</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-1">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-premium transition-all duration-300 ${
              activeTab === item.id 
                ? 'bg-white text-primary shadow-xl shadow-black/10 scale-[1.02]' 
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon />
            <span className="font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-4 pt-4 border-t border-white/10">
        <div 
          onClick={() => setActiveTab('profile')}
          className="p-4 bg-white/10 backdrop-blur-sm rounded-premium flex items-center gap-3 border border-white/10 cursor-pointer hover:bg-white/20 transition-all"
        >
          <div className="w-10 h-10 bg-white/20 rounded-full overflow-hidden flex items-center justify-center border border-white/20 shadow-inner shrink-0">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">👤</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold">{user.role}</p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/50 hover:text-white transition-all font-medium text-sm group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair da Conta
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
