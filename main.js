import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // optional
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (existsSync(indexPath)) {
      win.loadFile(indexPath);
    } else {
      console.error('Build not found. Did you run `npm run build` in renderer?');
    }
  }
}

app.whenReady().then(() => {
  createWindow();
});
