// Electron Desktop Shell: runs InvestAI Real Estate Platform as a native desktop application.
//
// It boots the local services (Express backend :5000, Python ML :8000, Vite frontend :3000)
// and displays the complete responsive UI inside a native Electron frame.
// Vite's proxy in frontend/vite.config.js forwards /api to :5000, keeping auth cookies
// and real-time features seamless.

const { app, BrowserWindow, dialog, shell, Menu } = require('electron');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const VITE_PORT = 3000;
const VITE_URL = `http://localhost:${VITE_PORT}`;

const PROCS = [
  {
    name: 'backend',
    port: 5000,
    cmd: 'node',
    args: ['server.js'],
    cwd: 'backend',
  },
  {
    name: 'ml',
    port: 8000,
    cmd: 'python',
    args: ['-m', 'uvicorn', 'app:app', '--port', '8000'],
    cwd: 'ml-service',
  },
  {
    name: 'vite',
    port: VITE_PORT,
    cmd: 'node',
    args: [path.join(ROOT, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js')],
    cwd: 'frontend',
    env: { BROWSER: 'none' },
  },
];

const children = [];

function tryConnect(port, host) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.setTimeout(1000, () => done(false));
  });
}

async function portOpen(port) {
  const results = await Promise.all([tryConnect(port, '127.0.0.1'), tryConnect(port, '::1')]);
  return results.some(Boolean);
}

async function waitForPort(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await portOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

function start({ name, cmd, args, cwd, env }) {
  const child = spawn(cmd, args, {
    cwd: path.join(ROOT, cwd),
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const relay = (buf) => {
    for (const line of String(buf).trimEnd().split('\n')) console.log(`[${name}] ${line}`);
  };
  child.stdout.on('data', relay);
  child.stderr.on('data', relay);
  child.on('error', (err) => console.error(`[${name}] could not start: ${err.message}`));
  child.on('exit', (code) => console.log(`[${name}] exited (${code})`));

  children.push(child);
}

function killAll() {
  for (const child of children) {
    if (child.exitCode !== null || child.signalCode !== null) continue;
    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
  children.length = 0;
}

function createMenu(win) {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => win.reload() },
        { label: 'Toggle Full Screen', accelerator: 'F11', click: () => win.setFullScreen(!win.isFullScreen()) },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Toggle Developer Tools', accelerator: 'CmdOrCtrl+Shift+I', click: () => win.webContents.toggleDevTools() },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    title: 'InvestAI Real Estate Platform',
    center: true,
    show: false,
    backgroundColor: '#0b0f19',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  createMenu(win);

  // External links open in user's default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadURL(VITE_URL);

  win.once('ready-to-show', () => {
    win.show();
    console.log('[desktop] Window ready and shown');
  });

  win.webContents.on('did-finish-load', () => console.log('[desktop] Window content loaded'));
  win.webContents.on('did-fail-load', (_e, code, desc) =>
    console.error(`[desktop] Window failed to load: ${desc} (${code})`)
  );
  win.on('closed', () => console.log('[desktop] Window closed'));
}

app.whenReady().then(async () => {
  for (const proc of PROCS) {
    if (await portOpen(proc.port)) {
      console.log(`[${proc.name}] already listening on :${proc.port} — reusing it`);
      continue;
    }
    start(proc);
  }

  if (!(await waitForPort(VITE_PORT, 90_000))) {
    dialog.showErrorBox(
      'Startup Failed',
      `Could not connect to Vite server on ${VITE_URL} after 90s.\n\nCheck terminal logs for details.`
    );
    app.quit();
    return;
  }

  createWindow();
});

app.on('window-all-closed', () => {
  console.log('[desktop] All windows closed');
  app.quit();
});

app.on('will-quit', () => {
  console.log('[desktop] Application quitting — terminating child processes');
  killAll();
});

process.on('SIGINT', () => {
  console.log('[desktop] SIGINT received');
  app.quit();
});
