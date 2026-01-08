
import { BiblicalStudy, BiblicalClass, SmallGroup, StaffVisit, User, UserRole, CloudConfig, ChangeRequest } from '../types';

// URL da sua nova implantação do Apps Script
const INTERNAL_CLOUD_URL = "function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var body = JSON.parse(e.postData.contents);
  var type = body.type;
  var data = body.data;

  // Mapeamento rigoroso para evitar abas fantasmas
  var sheetMapping = {
    'ESTUDOS_BIBLICOS': 'ESTUDOS_BIBLICOS',
    'DELETE_STUDY': 'ESTUDOS_BIBLICOS',
    'CLASSES_BIBLICAS': 'CLASSES_BIBLICAS',
    'DELETE_CLASS': 'CLASSES_BIBLICAS',
    'PEQUENOS_GRUPOS': 'PEQUENOS_GRUPOS',
    'DELETE_GROUP': 'PEQUENOS_GRUPOS',
    'VISITAS_COLABORADORES': 'VISITAS_COLABORADORES',
    'DELETE_VISIT': 'VISITAS_COLABORADORES',
    'USUARIOS': 'USUARIOS',
    'DELETE_USER': 'USUARIOS',
    'CONFIGURACAO_SISTEMA': 'CONFIGURACAO_SISTEMA'
  };

  var targetSheetName = sheetMapping[type];
  if (!targetSheetName) {
    return ContentService.createTextOutput("Tipo inválido ignorado").setMimeType(ContentService.MimeType.TEXT);
  }

  // Se for exclusão
  if (type.indexOf('DELETE_') === 0) {
    var sheet = ss.getSheetByName(targetSheetName);
    if (sheet) {
      var values = sheet.getDataRange().getValues();
      for (var i = values.length - 1; i >= 1; i--) {
        if (values[i][0] == data.id) {
          sheet.deleteRow(i + 1);
        }
      }
    }
    return ContentService.createTextOutput("Excluído").setMimeType(ContentService.MimeType.TEXT);
  }

  // Se for Gravação/Edição
  var sheet = ss.getSheetByName(targetSheetName) || ss.insertSheet(targetSheetName);
  
  // Se a aba acabou de ser criada, adiciona cabeçalho
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "TIMESTAMP", "JSON_DATA", "EXECUTADO_POR"]);
  }

  var rows = sheet.getDataRange().getValues();
  var found = false;
  var rowData = [data.id, new Date().toISOString(), JSON.stringify(data), body.executedBy || "Sistema"];

  for (var j = 1; j < rows.length; j++) {
    if (rows[j][0] == data.id) {
      sheet.getRange(j + 1, 1, 1, 4).setValues([rowData]);
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow(rowData);
  }

  return ContentService.createTextOutput("Sucesso").setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (action === "fetchAll") {
    var results = {
      studies: getSheetData(ss, "ESTUDOS_BIBLICOS"),
      classes: getSheetData(ss, "CLASSES_BIBLICAS"),
      groups: getSheetData(ss, "PEQUENOS_GRUPOS"),
      visits: getSheetData(ss, "VISITAS_COLABORADORES"),
      users: getSheetData(ss, "USUARIOS")
    };
    return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  var data = [];
  for (var i = 1; i < rows.length; i++) {
    try { data.push(JSON.parse(rows[i][2])); } catch(e) {}
  }
  return data;
}"; 

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

const MASTER_ADMIN: User = { 
  id: 'master-admin', 
  name: 'Admin Master', 
  email: 'pastorescopel@gmail.com', 
  password: 'admin', 
  role: UserRole.ADMIN 
};

let lastWriteTimestamp = 0;
const PULL_LOCK_MS = 5000;

export const storageService = {
  init() {
    // Garante que o usuário mestre sempre exista localmente
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
    if (Date.now() - lastWriteTimestamp < PULL_LOCK_MS) return true;
    try {
      const response = await fetch(`${INTERNAL_CLOUD_URL}?action=fetchAll`);
      if (!response.ok) return false;
      const cloudData = await response.json();
      if (cloudData) {
        if (cloudData.users) {
          // Mescla usuários da nuvem com o admin mestre local
          const combinedUsers = [...cloudData.users];
          if (!combinedUsers.find((u: User) => u.email === MASTER_ADMIN.email)) {
            combinedUsers.push(MASTER_ADMIN);
          }
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(combinedUsers));
        }
        if (cloudData.studies) localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(cloudData.studies));
        if (cloudData.classes) localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(cloudData.classes));
        if (cloudData.groups) localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(cloudData.groups));
        if (cloudData.visits) localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(cloudData.visits));
        return true;
      }
      return false;
    } catch (e) { return false; }
  },

  async syncToCloud(type: string, data: any) {
    lastWriteTimestamp = Date.now();
    try {
      const user = this.getCurrentUser();
      await fetch(INTERNAL_CLOUD_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          type: type,
          timestamp: new Date().toISOString(),
          executedBy: user?.name || 'Sistema',
          data: data
        })
      });
    } catch (e) { console.warn("Cloud Sync Error:", e); }
  },

  async deleteStudy(id: string) {
    const data = this.getStudies().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(data)); 
    await this.syncToCloud('DELETE_STUDY', { id });
  },

  async deleteClass(id: string) {
    const data = this.getClasses().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(data));
    await this.syncToCloud('DELETE_CLASS', { id });
  },

  async deleteGroup(id: string) {
    const data = this.getGroups().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(data));
    await this.syncToCloud('DELETE_GROUP', { id });
  },

  async deleteVisit(id: string) {
    const data = this.getVisits().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(data));
    await this.syncToCloud('DELETE_VISIT', { id });
  },

  login(email: string, password?: string): User | null {
    const users = this.getUsers();
    // Prioriza o login do Master Admin
    if (email === MASTER_ADMIN.email && password === MASTER_ADMIN.password) {
       localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(MASTER_ADMIN));
       return MASTER_ADMIN;
    }
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (u.password === password));
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout() { localStorage.removeItem(STORAGE_KEYS.CURRENT_USER); },
  getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },
  updateCurrentUser(user: User) {
    this.saveUser(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },
  getUsers(): User[] { 
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    const users = stored ? JSON.parse(stored) : [MASTER_ADMIN];
    if (!users.find((u: User) => u.email === MASTER_ADMIN.email)) users.push(MASTER_ADMIN);
    return users;
  },
  async saveUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) users[index] = user; else users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    await this.syncToCloud('USUARIOS', user);
  },
  async deleteUser(userId: string) {
    if (userId === MASTER_ADMIN.id) return; // Proteção extra
    const users = this.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    await this.syncToCloud('DELETE_USER', { id: userId });
  },
  getStudies(): BiblicalStudy[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDIES) || '[]'); },
  async saveStudy(study: BiblicalStudy) {
    const data = this.getStudies();
    const index = data.findIndex(i => i.id === study.id);
    if (index >= 0) data[index] = study; else data.push(study);
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(data));
    await this.syncToCloud('ESTUDOS_BIBLICOS', study);
  },
  getClasses(): BiblicalClass[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]'); },
  async saveClass(cls: BiblicalClass) {
    const data = this.getClasses();
    const index = data.findIndex(i => i.id === cls.id);
    if (index >= 0) data[index] = cls; else data.push(cls);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(data));
    await this.syncToCloud('CLASSES_BIBLICAS', cls);
  },
  getGroups(): SmallGroup[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]'); },
  async saveGroup(group: SmallGroup) {
    const data = this.getGroups();
    const index = data.findIndex(i => i.id === group.id);
    if (index >= 0) data[index] = group; else data.push(group);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(data));
    await this.syncToCloud('PEQUENOS_GRUPOS', group);
  },
  getVisits(): StaffVisit[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]'); },
  async saveVisit(visit: StaffVisit) {
    const data = this.getVisits();
    const index = data.findIndex(i => i.id === visit.id);
    if (index >= 0) data[index] = visit; else data.push(visit);
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(data));
    await this.syncToCloud('VISITAS_COLABORADORES', visit);
  },
  getConfig(): CloudConfig { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || `{"databaseURL":"${INTERNAL_CLOUD_URL}","spreadsheetId":"","customSectors":[],"customCollaborators":[]}`); },
  async saveConfig(config: CloudConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    await this.syncToCloud('CONFIGURACAO_SISTEMA', { ...config, appLogo: 'OMITIDO', reportLogo: 'OMITIDO' });
  },
  getRequests(): ChangeRequest[] { return JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]'); },
  async addRequest(request: ChangeRequest) {
    const reqs = this.getRequests();
    reqs.push(request);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(reqs));
    await this.syncToCloud('SOLICITACAO_ALTERACAO', request);
  },
  async updateRequestStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const reqs = this.getRequests();
    const idx = reqs.findIndex(r => r.id === id);
    if (idx >= 0) {
      reqs[idx].status = status;
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(reqs));
    }
  }
};
