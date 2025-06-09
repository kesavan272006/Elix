import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

const appMap = {
  'chrome': 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'browser': 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'firefox': 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
  'edge': 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'opera': 'C:\\Program Files\\Opera\\launcher.exe',
  'brave': 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  'safari': 'C:\\Program Files\\Safari\\Safari.exe', // If installed on Windows
  'vivaldi': 'C:\\Program Files\\Vivaldi\\Application\\vivaldi.exe',
  'http': 'http://',
  'https': 'https://',
  'whatsapp': 'whatsapp://',
  'discord': 'discord://',
  'slack': 'slack://',
  'teams': 'msteams://',
  'zoom': 'zoommtg://',
  'skype': 'skype://',
  'telegram': 'tg://',
  'signal': 'sgnl://',
  'viber': 'viber://',
  'messenger': 'fb-messenger://',
  'outlook': 'outlook://',
  'thunderbird': 'thunderbird://',
  'word': 'winword.exe',
  'excel': 'excel.exe',
  'powerpoint': 'powerpnt.exe',
  'ppt': 'powerpnt.exe',
  'access': 'msaccess.exe',
  'publisher': 'mspub.exe',
  'onenote': 'onenote.exe',
  'outlook': 'outlook.exe',
  'project': 'winproj.exe',
  'visio': 'visio.exe',
  'notepad': 'notepad.exe',
  'editor': 'notepad.exe',
  'notepad++': 'C:\\Program Files\\Notepad++\\notepad++.exe',
  'wordpad': 'write.exe',
  'calculator': 'calc.exe',
  'calc': 'calc.exe',
  'paint': 'mspaint.exe',
  'photoshop': 'photoshop.exe',
  'illustrator': 'illustrator.exe',
  'acrobat': 'acrobat.exe',
  'reader': 'AcroRd32.exe',
  'pdf': 'AcroRd32.exe',
  'vlc': 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
  'mediaplayer': 'wmplayer.exe',
  'itunes': 'iTunes.exe',
  'spotify': 'spotify.exe',
  'winamp': 'winamp.exe',
  'quicktime': 'quicktimeplayer.exe',
  'vscode': 'code.exe',
  'visualstudio': 'devenv.exe',
  'eclipse': 'eclipse.exe',
  'intellij': 'idea.exe',
  'pycharm': 'pycharm.exe',
  'webstorm': 'webstorm.exe',
  'atom': 'atom.exe',
  'sublime': 'sublime_text.exe',
  'git': 'git-bash.exe',
  'cmd': 'cmd.exe',
  'powershell': 'powershell.exe',
  'terminal': 'wt.exe', 
  'explorer': 'explorer.exe',
  '7zip': '7zFM.exe',
  'winrar': 'winrar.exe',
  'winzip': 'winzip32.exe',
  'dropbox': 'dropbox.exe',
  'googledrive': 'googledrivesync.exe',
  'onedrive': 'onedrive.exe',
  'steam': 'steam.exe',
  'epic': 'EpicGamesLauncher.exe',
  'origin': 'Origin.exe',
  'battlenet': 'Battle.net.exe',
  'ubisoft': 'upc.exe',
  'remote': 'mstsc.exe', // Remote Desktop
  'anydesk': 'anydesk.exe',
  'teamviewer': 'teamviewer.exe',
  'antivirus': 'msseces.exe', // Windows Defender
  'avast': 'avastui.exe',
  'avg': 'avgui.exe',
  'norton': 'norton.exe',
  'malwarebytes': 'mbam.exe',
  'control': 'control.exe', // Control Panel
  'taskmgr': 'taskmgr.exe', // Task Manager
  'regedit': 'regedit.exe', // Registry Editor
  'charmap': 'charmap.exe', // Character Map
  'snippingtool': 'snippingtool.exe',
  'facebook': 'facebook://',
  'twitter': 'twitter://',
  'instagram': 'instagram://',
  'linkedin': 'linkedin://',
  'reddit': 'reddit://',
  'pinterest': 'pinterest://',
  'tiktok': 'tiktok://',
  'youtube': 'youtube://',
  'adobe': 'acrobat.exe',
  'autocad': 'acad.exe',
  'blender': 'blender.exe',
  'lightroom': 'lightroom.exe',
  'premiere': 'premiere.exe',
  'aftereffects': 'afterfx.exe',
  'illustrator': 'illustrator.exe',
  'coreldraw': 'coreldraw.exe',
  'maya': 'maya.exe',
  '3dsmax': '3dsmax.exe',
  'solidworks': 'slwworks.exe',
  'virtualbox': 'virtualbox.exe',
  'vmware': 'vmware.exe',
  'defrag': 'dfrgui.exe',
  'diskcleanup': 'cleanmgr.exe',
  'dxdiag': 'dxdiag.exe',
  'msconfig': 'msconfig.exe',
  'services': 'services.msc',
  'eventviewer': 'eventvwr.exe',
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