
import { BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit, User, UserRole, CloudConfig, ChangeRequest } from '../types';

const STORAGE_KEYS = {
  STUDIES: 'cap_studies',
  CLASSES: 'cap_classes',
  GROUPS: 'cap_groups',
  USERS: 'cap_users',
  CONFIG: 'cap_config',
  REQUESTS: 'cap_requests',
  CURRENT_USER: 'cap_current_user',
  VISITS: 'cap_visits'
};

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'Admin Master', email: 'pastorescopel@gmail.com', password: 'admin', role: UserRole.ADMIN },
  { id: '2', name: 'João Silva', email: 'joao@capelania.com', password: '123', role: UserRole.CHAPLAIN }
];

export const storageService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    ['STUDIES', 'CLASSES', 'GROUPS', 'VISITS', 'REQUESTS'].forEach(key => {
      const storageKey = STORAGE_KEYS[key as keyof typeof STORAGE_KEYS];
      if (storageKey && !localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, JSON.stringify([]));
      }
    });
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      this.saveConfig({
        databaseURL: '',
        spreadsheetId: '',
        customSectors: [],
        customCollaborators: []
      });
    }
  },

  // Nova Função de Sincronização em Nuvem
  async syncToCloud(type: string, data: any) {
    const config = this.getConfig();
    if (!config.databaseURL) return;

    try {
      const user = this.getCurrentUser();
      await fetch(config.databaseURL, {
        method: 'POST',
        mode: 'no-cors', // Necessário para Google Apps Script Web App
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          userName: user?.name || 'Sistema',
          data: data
        })
      });
    } catch (e) {
      console.warn("Sincronização falhou (provavelmente modo offline):", e);
    }
  },

  login(email: string, password?: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      (u.password === password || (!u.password && !password))
    );
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  updateCurrentUser(updatedUser: User) {
    this.saveUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
  },

  getUsers(): User[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  },

  saveUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) users[index] = user;
    else users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.syncToCloud('USUARIOS', user);
  },

  deleteUser(userId: string) {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
  },

  // Fix: Added missing deleteStudy method to handle study record deletion
  deleteStudy(id: string) {
    const data = this.getStudies();
    const filtered = data.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(filtered));
  },

  getStudies(): BiblicalStudy[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDIES) || '[]');
  },

  saveStudy(study: BiblicalStudy) {
    const data = this.getStudies();
    const index = data.findIndex(i => i.id === study.id);
    if (index >= 0) data[index] = study;
    else data.push(study);
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(data));
    this.syncToCloud('ESTUDOS_BIBLICOS', study);
  },

  // Fix: Added missing deleteClass method to handle class record deletion
  deleteClass(id: string) {
    const data = this.getClasses();
    const filtered = data.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(filtered));
  },

  getClasses(): BiblicalClass[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]');
  },

  saveClass(cls: BiblicalClass) {
    const data = this.getClasses();
    const index = data.findIndex(i => i.id === cls.id);
    if (index >= 0) data[index] = cls;
    else data.push(cls);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(data));
    this.syncToCloud('CLASSES_BIBLICAS', cls);
  },

  // Fix: Added missing deleteGroup method to handle small group record deletion
  deleteGroup(id: string) {
    const data = this.getGroups();
    const filtered = data.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(filtered));
  },

  getGroups(): SmallGroup[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]');
  },

  saveGroup(group: SmallGroup) {
    const data = this.getGroups();
    const index = data.findIndex(i => i.id === group.id);
    if (index >= 0) data[index] = group;
    else data.push(group);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(data));
    this.syncToCloud('PEQUENOS_GRUPOS', group);
  },

  // Fix: Added missing deleteVisit method to handle staff visit record deletion
  deleteVisit(id: string) {
    const data = this.getVisits();
    const filtered = data.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(filtered));
  },

  getVisits(): StaffVisit[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]');
  },

  saveVisit(visit: StaffVisit) {
    const data = this.getVisits();
    const index = data.findIndex(i => i.id === visit.id);
    if (index >= 0) data[index] = visit;
    else data.push(visit);
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(data));
    this.syncToCloud('VISITAS_COLABORADORES', visit);
  },

  getConfig(): CloudConfig {
    const defaultCfg: CloudConfig = { 
      databaseURL: '', 
      spreadsheetId: '', 
      customSectors: [], 
      customCollaborators: [] 
    };
    try {
      return { ...defaultCfg, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || '{}') };
    } catch {
      return defaultCfg;
    }
  },

  saveConfig(config: CloudConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    this.syncToCloud('CONFIGURACAO_SISTEMA', { ...config, appLogo: 'OMITIDO_BASE64', reportLogo: 'OMITIDO_BASE64' });
  },

  getRequests(): ChangeRequest[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]');
  },

  addRequest(req: ChangeRequest) {
    const reqs = this.getRequests();
    reqs.push(req);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(reqs));
    this.syncToCloud('SOLICITACOES_ALTERACAO', req);
  },

  updateRequestStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const reqs = this.getRequests();
    const idx = reqs.findIndex(r => r.id === id);
    if (idx >= 0) {
      reqs[idx].status = status;
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(reqs));
    }
  },

  exportAllData(): string {
    const fullData = {
      studies: this.getStudies(),
      classes: this.getClasses(),
      groups: this.getGroups(),
      visits: this.getVisits(),
      users: this.getUsers(),
      config: this.getConfig(),
      requests: this.getRequests()
    };
    return JSON.stringify(fullData);
  },

  importAllData(jsonData: string) {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.studies) localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(parsed.studies));
      if (parsed.classes) localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(parsed.classes));
      if (parsed.groups) localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(parsed.groups));
      if (parsed.visits) localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(parsed.visits));
      if (parsed.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed.users));
      if (parsed.config) localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(parsed.config));
      if (parsed.requests) localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(parsed.requests));
      return true;
    } catch (e) {
      console.error("Erro ao importar backup:", e);
      return false;
    }
  }
};
