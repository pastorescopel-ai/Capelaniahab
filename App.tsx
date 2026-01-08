
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Admin from './components/Admin';
import UsersList from './components/UsersList';
import Login from './components/Login';
import Profile from './components/Profile';
import BiblicalStudyForm from './components/BiblicalStudyForm';
import BiblicalClassForm from './components/BiblicalClassForm';
import SmallGroupForm from './components/SmallGroupForm';
import StaffVisitForm from './components/StaffVisitForm';
import { storageService } from './services/storageService';
import { User, UserRole } from './types';
import { Icons } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        storageService.init();
        const currentUser = storageService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          setIsSyncing(true);
          await storageService.pullFromCloud().catch(() => {});
          setIsSyncing(false);
        }
      } catch (error) {
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, []);

  const handleLogin = async (loggedUser: User) => {
    setUser(loggedUser);
    setIsSyncing(true);
    await storageService.pullFromCloud().catch(() => {});
    setIsSyncing(false);
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setActiveTab('dashboard');
  };

  if (isInitializing) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'estudos': return <BiblicalStudyForm user={user} onSuccess={() => {}} />;
      case 'classes': return <BiblicalClassForm user={user} onSuccess={() => {}} />;
      case 'pgs': return <SmallGroupForm user={user} onSuccess={() => {}} />;
      case 'colaboradores': return <StaffVisitForm user={user} onSuccess={() => {}} />;
      case 'reports': return user.role === UserRole.ADMIN ? <Reports user={user} /> : <Dashboard user={user} />;
      case 'admin': return <Admin />;
      case 'users': return <UsersList />;
      case 'profile': return <Profile user={user} onUpdate={(u) => setUser(u)} />;
      default: return <Dashboard user={user} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-black text-slate-400 uppercase tracking-widest">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-4">
             {isSyncing && <span className="text-[10px] text-primary animate-pulse font-bold">Atualizando Nuvem...</span>}
             <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setActiveTab('profile')}>
                {user.photoUrl ? <img src={user.photoUrl} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full">👤</span>}
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 flex justify-around p-3 z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`p-2 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-500'}`}><Icons.Dashboard /></button>
        <button onClick={() => setActiveTab('estudos')} className={`p-2 ${activeTab === 'estudos' ? 'text-white' : 'text-slate-500'}`}><Icons.Study /></button>
        <button onClick={() => setActiveTab('classes')} className={`p-2 ${activeTab === 'classes' ? 'text-white' : 'text-slate-500'}`}><Icons.Class /></button>
        <button onClick={() => setActiveTab('pgs')} className={`p-2 ${activeTab === 'pgs' ? 'text-white' : 'text-slate-500'}`}><Icons.PG /></button>
        <button onClick={() => setActiveTab('colaboradores')} className={`p-2 ${activeTab === 'colaboradores' ? 'text-white' : 'text-slate-500'}`}><Icons.Staff /></button>
      </nav>
    </div>
  );
};

export default App;
