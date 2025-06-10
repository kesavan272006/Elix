const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openApplication: async (appName) => {
    try {
      console.log(`Preload: Requesting to open ${appName}`);
      const result = await ipcRenderer.invoke('open-application', appName);
      console.log('Preload: Open application result:', result);
      return result;
    } catch (error) {
      console.error('IPC Error:', error);
      throw error;
    }
  },
  isElectron: true,
  getPlatform: () => process.platform,
  getVersions: () => process.versions
});