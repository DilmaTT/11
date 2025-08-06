import { supabase } from './supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

// --- Data Structure ---
interface AppData {
  version: number;
  folders: any[];
  actionButtons: any[];
  trainings: any[];
  statistics: any[];
  charts: any[];
  timestamp: string;
}

const APP_DATA_VERSION = 1;

// --- Helper Functions ---
const isTauri = (): boolean => '__TAURI__' in window;
const isCapacitor = (): boolean => !!(window as any).Capacitor?.isNativePlatform();

/**
 * Gathers all relevant data from localStorage into a single object.
 */
const gatherData = (): AppData => {
  console.log("[DM] Gathering data from localStorage...");
  const folders = JSON.parse(localStorage.getItem('poker-ranges-folders') || '[]');
  const actionButtons = JSON.parse(localStorage.getItem('poker-ranges-actions') || '[]');
  const trainings = JSON.parse(localStorage.getItem('training-sessions') || '[]');
  const statistics = JSON.parse(localStorage.getItem('training-statistics') || '[]');
  const charts = JSON.parse(localStorage.getItem('userCharts') || '[]');

  const data = {
    version: APP_DATA_VERSION,
    folders,
    actionButtons,
    trainings,
    statistics,
    charts,
    timestamp: new Date().toISOString(),
  };
  console.log("[DM] Gathered data:", data);
  return data;
};

/**
 * Applies imported data to the application.
 */
const applyData = (data: AppData, reload: boolean = true) => {
  console.log("[DM] Attempting to apply data:", data);
  if (!data || data.version > APP_DATA_VERSION) {
    console.error("[DM] Invalid or newer data format.");
    alert("Ошибка: Неверный или более новый формат файла настроек, который не поддерживается этой версией приложения.");
    return;
  }

  try {
    localStorage.setItem('poker-ranges-folders', JSON.stringify(data.folders || []));
    localStorage.setItem('poker-ranges-actions', JSON.stringify(data.actionButtons || []));
    localStorage.setItem('training-sessions', JSON.stringify(data.trainings || []));
    localStorage.setItem('training-statistics', JSON.stringify(data.statistics || []));
    localStorage.setItem('userCharts', JSON.stringify(data.charts || []));
    localStorage.setItem('poker-data-timestamp', data.timestamp);

    console.log("[DM] Data successfully written to localStorage.");

    if (reload) {
      alert("Настройки успешно импортированы! Приложение будет перезагружено.");
      setTimeout(() => {
        console.log("[DM] Reloading window...");
        window.location.reload();
      }, 250);
    }
  } catch (e) {
    console.error("[DM] Error applying data to localStorage:", e);
    alert("Ошибка при сохранении данных локально.");
  }
};

// --- Supabase Data Management ---

export const syncDataToSupabase = async (showAlert = true) => {
  console.log("[DM] Attempting to sync data to Supabase...");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (showAlert) alert("Вы должны войти в систему для синхронизации данных.");
    console.log("[DM] No user logged in for sync.");
    return;
  }

  const appData = gatherData();
  const { version, timestamp, ...userData } = appData;

  console.log("[DM] Data to upsert to Supabase:", userData);
  const { error } = await supabase
    .from('user_data')
    .upsert({
      user_id: user.id,
      folders: userData.folders,
      action_buttons: userData.actionButtons,
      trainings: userData.trainings,
      statistics: userData.statistics,
      charts: userData.charts,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error("[DM] Error syncing data to Supabase:", error);
    if (showAlert) alert("Ошибка синхронизации данных с облаком.");
  } else {
    console.log("[DM] Data successfully synced to Supabase.");
    if (showAlert) alert("Данные успешно сохранены в облаке!");
  }
};

export const loadDataFromSupabase = async (user: SupabaseUser | null) => {
  console.log("[DM] loadDataFromSupabase called.");
  
  if (!user) {
    console.log("[DM] No user provided, cannot load data. Returning.");
    return;
  }
  console.log(`[DM] User session found, proceeding to fetch user_data for user_id: ${user.id}`);

  try {
    console.log(`[DM] PRE-AWAIT: Fetching user_data from Supabase at ${new Date().toLocaleTimeString()}`);
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', user.id);

    console.log(`[DM] POST-AWAIT: Supabase query finished at ${new Date().toLocaleTimeString()}`);
    console.log("[DM] Query Error object:", error);
    console.log("[DM] Query Data object:", data);

    if (error) {
      console.error("[DM] Error loading data from Supabase:", error);
      return;
    }

    const userData = data && data.length > 0 ? data[0] : null;

    if (userData) {
      console.log("[DM] Data received from Supabase:", userData);
      const localTimestamp = localStorage.getItem('poker-data-timestamp');
      const cloudTimestamp = userData.updated_at;

      console.log(`[DM] Local timestamp: ${localTimestamp}, Cloud timestamp: ${cloudTimestamp}`);

      if (!localTimestamp || new Date(cloudTimestamp) > new Date(localTimestamp)) {
          console.log("[DM] Cloud data is newer or local data is missing. Prompting user.");
          if (confirm("Найдены более новые данные в облаке. Загрузить их? Это перезапишет ваши текущие локальные несохраненные данные.")) {
              const appData: AppData = {
                version: APP_DATA_VERSION,
                folders: userData.folders || [],
                actionButtons: userData.action_buttons || [],
                trainings: userData.trainings || [],
                statistics: userData.statistics || [],
                charts: userData.charts || [],
                timestamp: userData.updated_at || new Date().toISOString(),
              };
              console.log("[DM] Applying cloud data to local storage and reloading:", appData);
              applyData(appData);
          } else {
              console.log("[DM] User chose not to load newer cloud data.");
          }
      } else {
          console.log("[DM] Local data is up-to-date.");
      }
    } else {
      console.log("[DM] No data found in Supabase for this user. Prompting to sync local data.");
      if (confirm("В облаке нет данных. Хотите сохранить текущие локальные данные в облако?")) {
          console.log("[DM] User confirmed to sync local data to Supabase.");
          await syncDataToSupabase();
      }
    }
  } catch (e) {
    console.error("[DM] Unhandled error in loadDataFromSupabase:", e);
  } finally {
    console.log("[DM] loadDataFromSupabase function finished execution.");
  }
};

export const clearLocalData = () => {
  console.log("[DM] Clearing local data...");
  localStorage.removeItem('poker-ranges-folders');
  localStorage.removeItem('poker-ranges-actions');
  localStorage.removeItem('training-sessions');
  localStorage.removeItem('training-statistics');
  localStorage.removeItem('userCharts');
  localStorage.removeItem('poker-data-timestamp');
  console.log("[DM] Local data cleared. Reloading window...");
  window.location.reload();
};


// --- Platform-Specific File Export Implementations ---

const exportForWeb = (appData: AppData) => {
  console.log("[DM] Exporting data for web:", appData);
  const dataStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `poker-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log("[DM] Web export initiated.");
};

const exportForTauri = async (appData: AppData) => {
  console.log("[DM] Exporting data for Tauri:", appData);
  try {
    const { save } = await import('@tauri-apps/api/dialog');
    const { writeTextFile } = await import('@tauri-apps/api/fs');
    
    const filePath = await save({
      defaultPath: `poker-settings-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (filePath) {
      const dataStr = JSON.stringify(appData, null, 2);
      await writeTextFile(filePath, dataStr);
      alert('Настройки успешно экспортированы!');
      console.log("[DM] Tauri export successful to:", filePath);
    } else {
      console.log("[DM] Tauri export cancelled.");
    }
  } catch (error) {
    console.error('[DM] Failed to export settings via Tauri:', error);
    alert('Ошибка экспорта настроек.');
  }
};

const exportForCapacitor = async (appData: AppData) => {
  console.log("[DM] Exporting data for Capacitor:", appData);
  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const permissionStatus = await Filesystem.requestPermissions();
    if (permissionStatus.publicStorage !== 'granted') {
      alert('Для экспорта настроек необходимо разрешение на доступ к хранилищу.');
      console.warn("[DM] Capacitor export: Public storage permission not granted.");
      return;
    }
    const dataStr = JSON.stringify(appData, null, 2);
    const fileName = `poker-settings-backup-${new Date().toISOString()}.json`;
    await Filesystem.writeFile({
      path: fileName,
      data: dataStr,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    alert(`Настройки сохранены в папку "Документы" под именем: ${fileName}`);
    console.log("[DM] Capacitor export successful to:", fileName);
  } catch (error) {
    console.error('[DM] Failed to export settings via Capacitor:', error);
    alert('Ошибка экспорта настроек. Проверьте разрешения приложения.');
  }
};

// --- Platform-Specific File Import Implementations ---

const importForWeb = () => {
  console.log("[DM] Initiating web import...");
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          console.log("[DM] Web import: File parsed, applying data:", data);
          applyData(data);
        } catch (err) {
          console.error("[DM] Error parsing JSON file.", err);
          alert("Ошибка: Не удалось прочитать файл.");
        }
      };
      reader.readAsText(file);
    } else {
      console.log("[DM] Web import: No file selected.");
    }
  };
  input.click();
};

const importForTauri = async () => {
  console.log("[DM] Initiating Tauri import...");
  try {
    const { open } = await import('@tauri-apps/api/dialog');
    const { readTextFile } = await import('@tauri-apps/api/fs');
    const selected = await open({
      multiple: false,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (typeof selected === 'string' && selected) {
      const contents = await readTextFile(selected);
      const data = JSON.parse(contents);
      console.log("[DM] Tauri import: File read and parsed, applying data:", data);
      applyData(data);
    } else {
      console.log("[DM] Tauri import cancelled or no file selected.");
    }
  } catch (error) {
    console.error('[DM] Failed to import settings via Tauri:', error);
    alert('Ошибка импорта настроек.');
  }
};

const importForCapacitor = () => {
  console.log("[DM] Initiating Capacitor import (using web fallback)...");
  importForWeb();
};

// --- Public API for File I/O ---

export const exportDataToFile = () => {
  console.log("[DM] Exporting data to file...");
  const appData = gatherData();
  if (isTauri()) {
    exportForTauri(appData);
  } else if (isCapacitor()) {
    exportForCapacitor(appData);
  } else {
    exportForWeb(appData);
  }
};

export const importDataFromFile = () => {
  console.log("[DM] Importing data from file...");
  if (isTauri()) {
    importForTauri();
  } else if (isCapacitor()) {
    importForCapacitor();
  } else {
    importForWeb();
  }
};

export const downloadCloudBackup = async () => {
  console.log("[DM] Attempting to download cloud backup...");
  const { data: { user } = { user: null } } = await supabase.auth.getUser();
  if (!user) {
    alert("Вы должны войти в систему, чтобы скачать бэкап из облака.");
    console.log("[DM] No user logged in for cloud backup download.");
    return;
  }

  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      console.log("[DM] Cloud backup data received:", data);
      const appData: AppData = {
        version: APP_DATA_VERSION,
        folders: data.folders || [],
        actionButtons: data.action_buttons || [],
        trainings: data.trainings || [],
        statistics: data.statistics || [],
        charts: data.charts || [],
        timestamp: data.updated_at || new Date().toISOString(),
      };
      exportForWeb(appData);
      console.log("[DM] Cloud backup exported via web.");
    } else {
      alert("В облаке нет данных для скачивания.");
      console.log("[DM] No cloud backup data found.");
    }
  } catch (error) {
    console.error("[DM] Error downloading cloud backup:", error);
    alert("Ошибка загрузки бэкапа из облака.");
  }
};
