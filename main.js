import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

// Enhanced application path mappings
const appMap = {
  'whatsapp': 'whatsapp://', // URI scheme
  'chrome': 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'browser': 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'notepad': 'notepad.exe',
  'editor': 'notepad.exe',
  'calculator': 'calc.exe',
  'calc': 'calc.exe',
  'word': 'winword.exe',
  'excel': 'excel.exe',
  'powerpoint': 'powerpnt.exe',
  'ppt': 'powerpnt.exe',
  // Add more mappings as needed
};

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (existsSync(indexPath)) {
      win.loadFile(indexPath);
    }
  }
}

app.whenReady().then(() => {
  // Enhanced application opening handler
  ipcMain.handle('open-application', async (event, appName) => {
    try {
      console.log(`Main: Received request to open '${appName}'`);
      
      // Normalize the app name
      const normalized = appName.replace(/^(the|my|our)\s+/i, '').trim().toLowerCase();
      console.log(`Normalized app name: ${normalized}`);
      
      // Find the best matching app key
      const appKey = Object.keys(appMap).find(key => 
        normalized === key.toLowerCase() || normalized.includes(key.toLowerCase())
      );
      
      const appPath = appKey ? appMap[appKey] : normalized;
      console.log(`Resolved path: ${appPath}`);
      
      // Handle different types of paths
      if (appPath.startsWith('http://') || appPath.startsWith('https://') || appPath.includes('://')) {
        console.log('Opening external URL');
        await shell.openExternal(appPath);
      } else {
        console.log('Opening path');
        const result = await shell.openPath(appPath);
        if (result) {
          throw new Error(`Failed to open: ${result}`);
        }
      }
      
      return { success: true, appName };
    } catch (error) {
      console.error('Error in open-application handler:', error);
      throw error;
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});