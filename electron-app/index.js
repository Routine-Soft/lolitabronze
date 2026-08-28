const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let backendProcess = null;
let mainWindow = null;

const isDev = !app.isPackaged;
const BACKEND_PORT = 8080;

function getBackendPath() {
  return isDev
    ? path.join(__dirname, '../backend')
    : path.join(process.resourcesPath, 'backend');
}

function startBackend() {
  const backendPath = getBackendPath();
  const entryFile = path.join(backendPath, 'index.js'); // <- corrigido

  backendProcess = spawn(process.execPath, [entryFile], {
    cwd: backendPath, // importante: garante que dotenv.config() ache o .env certo
    env: {
      ...process.env,
      PORT: BACKEND_PORT,
      ELECTRON_RUN_AS_NODE: '1', // <- adiciona essa linha
    },
    stdio: 'inherit',
  });

  backendProcess.on('error', (err) => {
    console.error('Erro ao iniciar o backend:', err);
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend encerrado com código ${code}`);
  });
}

function waitForBackend(callback, tentativas = 20) {
  http.get(`http://localhost:${BACKEND_PORT}/api/users`, () => {
    callback();
  }).on('error', () => {
    if (tentativas <= 0) {
      console.error('Backend não respondeu a tempo.');
      callback();
      return;
    }
    setTimeout(() => waitForBackend(callback, tentativas - 1), 500);
  });
}

function getFrontendPath() {
  return isDev
    ? path.join(__dirname, '../frontend/dist/index.html')
    : path.join(process.resourcesPath, 'frontend/dist/index.html');
}

function createWindow() {
  const iconPath = isDev
    ? path.join(__dirname, 'build/icon.ico')
    : path.join(process.resourcesPath, 'build/icon.ico'); // Ou path.join(__dirname, 'build/icon.ico') se o arquivo for incluído na build

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Lolita Bronze',
    icon: iconPath, // Garanta que o caminho aponta corretamente para o arquivo .ico
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(getFrontendPath());
}

app.whenReady().then(() => {
  startBackend();
  waitForBackend(() => {
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});