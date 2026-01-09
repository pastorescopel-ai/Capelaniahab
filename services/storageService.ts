
import { BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit, User, UserRole, CloudConfig } from '../types';
import { DEFAULT_APP_LOGO, DEFAULT_REPORT_LOGO } from '../constants';

const INTERNAL_CLOUD_URL = "https://script.google.com/macros/s/AKfycbyrXCpJxxbzTxz7dGXRM_uv9edvM_SgE-xYHiXaF8GUghDbxyNTR_1xpS3LhEulFXa5/exec"; 

const STORAGE_KEYS = {
  STUDIES: 'cap_studies',
  CLASSES: 'cap_classes',
  GROUPS: 'cap_groups',
  USERS: 'cap_users',
  CONFIG: 'cap_config',
  VISITS: 'cap_visits',
  CURRENT_USER: 'cap_current_user'
};

const MASTER_ADMIN: User = { 
  id: 'master-admin', 
  name: 'Admin Master', 
  email: 'pastorescopel@gmail.com', 
  password: 'admin', 
  role: UserRole.ADMIN 
};

export const storageService = {
  init() {
    const users = this.getUsers();
    if (!users.find(u => u.email === MASTER_ADMIN.email)) {
      users.push(MASTER_ADMIN);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    const currentConfig = this.getConfig();
    if (currentConfig.databaseURL !== INTERNAL_CLOUD_URL) {
      this.saveConfig({ ...currentConfig, databaseURL: INTERNAL_CLOUD_URL });
    }
  },

  async pullFromCloud(): Promise<boolean> {
    try {
      const response = await fetch(`${INTERNAL_CLOUD_URL}?action=fetchAll`);
      if (!response.ok) return false;
      const cloudData = await response.json();
      if (cloudData) {
        if (cloudData.users) {
          const cloudUsers: User[] = cloudData.users;
          if (!cloudUsers.find(u => u.email === MASTER_ADMIN.email)) cloudUsers.push(MASTER_ADMIN);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cloudUsers));
        }
        if (cloudData.studies) localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(cloudData.studies));
        if (cloudData.classes) localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(cloudData.classes));
        if (cloudData.groups) localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(cloudData.groups));
        if (cloudData.visits) localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(cloudData.visits));
        if (cloudData.config) localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ ...this.getConfig(), ...cloudData.config }));
        return true;
      }
      return false;
    } catch (e) { return false; }
  },

  async syncToCloud(type: string, data: any) {
    try {
      const user = this.getCurrentUser();
      await fetch(INTERNAL_CLOUD_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          type,
          timestamp: new Date().toISOString(),
          executedBy: user?.name || 'Sistema',
          data
        })
      });
    } catch (e) { console.warn("Sync Error", e); }
  },

  getUsers(): User[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'); },
  getCurrentUser(): User | null { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null'); },
  
  async updateCurrentUser(user: User) {
    await this.saveUser(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  async saveUser(user: User) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user; else users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    await this.syncToCloud('USUARIOS', user);
  },

  async deleteUser(id: string) {
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    await this.syncToCloud('DELETE_USER', { id });
  },

  getStudies(): BiblicalStudy[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDIES) || '[]'); },
  async saveStudy(data: BiblicalStudy) {
    const all = this.getStudies();
    const idx = all.findIndex(i => i.id === data.id);
    if (idx >= 0) all[idx] = data; else all.push(data);
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(all));
    await this.syncToCloud('ESTUDOS_BIBLICOS', data);
  },
  async deleteStudy(id: string) {
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(this.getStudies().filter(i => i.id !== id)));
    await this.syncToCloud('DELETE_STUDY', { id });
  },

  getClasses(): BiblicalClass[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]'); },
  async saveClass(data: BiblicalClass) {
    const all = this.getClasses();
    const idx = all.findIndex(i => i.id === data.id);
    if (idx >= 0) all[idx] = data; else all.push(data);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(all));
    await this.syncToCloud('CLASSES_BIBLICAS', data);
  },
  async deleteClass(id: string) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(this.getClasses().filter(i => i.id !== id)));
    await this.syncToCloud('DELETE_CLASS', { id });
  },

  getGroups(): SmallGroup[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]'); },
  async saveGroup(data: SmallGroup) {
    const all = this.getGroups();
    const idx = all.findIndex(i => i.id === data.id);
    if (idx >= 0) all[idx] = data; else all.push(data);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(all));
    await this.syncToCloud('PEQUENOS_GRUPOS', data);
  },
  async deleteGroup(id: string) {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(this.getGroups().filter(i => i.id !== id)));
    await this.syncToCloud('DELETE_GROUP', { id });
  },

  getVisits(): StaffVisit[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]'); },
  async saveVisit(data: StaffVisit) {
    const all = this.getVisits();
    const idx = all.findIndex(i => i.id === data.id);
    if (idx >= 0) all[idx] = data; else all.push(data);
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(all));
    await this.syncToCloud('VISITAS_COLABORADORES', data);
  },
  async deleteVisit(id: string) {
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(this.getVisits().filter(i => i.id !== id)));
    await this.syncToCloud('DELETE_VISIT', { id });
  },

  getConfig(): CloudConfig {
    const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const def: CloudConfig = {
      databaseURL: INTERNAL_CLOUD_URL, spreadsheetId: '',
      customSectorsHAB: [], customSectorsHABA: [], customPGsHAB: [], customPGsHABA: [], customCollaborators: [],
      reportTitle: 'RELATÓRIO MENSAL DE ATIVIDADES', reportSubtitle: 'CAPELANIA HOSPITALAR - HAB/HABA'
    };
    return stored ? JSON.parse(stored) : def;
  },
  async saveConfig(config: CloudConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    await this.syncToCloud('CONFIGURACAO_SISTEMA', config);
  },

  login(email: string, pass: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (user) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user || null;
  },
  logout() { localStorage.removeItem(STORAGE_KEYS.CURRENT_USER); }
};
