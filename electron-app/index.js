const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let backendProcess = null;
let mainWindow = null;
let splashWindow = null;

const isDev = !app.isPackaged;
const BACKEND_PORT = 8080;

const RETRY_INTERVAL_MS = 500;
const SLOW_APOS_TENTATIVAS = 30; // ~15s — avisa que está demorando, mas continua tentando
const ERRO_APOS_TENTATIVAS = 120; // ~60s — avisa que algo está errado, mas continua tentando

function getBackendPath() {
  return isDev
    ? path.join(__dirname, '../backend')
    : path.join(process.resourcesPath, 'backend');
}

function startBackend() {
  const backendPath = getBackendPath();
  const entryFile = path.join(backendPath, 'index.js');

  backendProcess = spawn(process.execPath, [entryFile], {
    cwd: backendPath,
    env: {
      ...process.env,
      PORT: BACKEND_PORT,
      ELECTRON_RUN_AS_NODE: '1',
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

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 380,
    height: 260,
    frame: false,
    resizable: false,
    icon: path.join(__dirname, 'build/icon.ico'),
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function updateSplashStatus(status) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.loadFile(path.join(__dirname, 'splash.html'), { search: `status=${status}` });
  }
}

function checkBackend(callback) {
  const req = http.get(`http://localhost:${BACKEND_PORT}/api/users`, (res) => {
    // Qualquer resposta HTTP (mesmo 401 sem token) já indica que o servidor está de pé
    res.resume();
    callback(true);
  });
  req.on('error', () => callback(false));
  req.end();
}

function waitForBackend(callback, tentativas = 0) {
  checkBackend((ok) => {
    if (ok) {
      callback();
      return;
    }
    const proxima = tentativas + 1;
    if (proxima === SLOW_APOS_TENTATIVAS) updateSplashStatus('slow');
    if (proxima === ERRO_APOS_TENTATIVAS) updateSplashStatus('error');
    setTimeout(() => waitForBackend(callback, proxima), RETRY_INTERVAL_MS);
  });
}

function getFrontendPath() {
  return isDev
    ? path.join(__dirname, '../frontend/dist/index.html')
    : path.join(process.resourcesPath, 'frontend/dist/index.html');
}

function createWindow() {
  const iconPath = path.join(__dirname, 'build/icon.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Lolita Bronze',
    icon: iconPath,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(getFrontendPath());

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  createSplashWindow();
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