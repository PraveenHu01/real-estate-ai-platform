// Throwaway Electron shell: runs this platform as a local desktop app.
//
// It boots the three processes the repo already has (Express :5000, FastAPI
// :8000, Vite :3000) and shows the Vite server in a native window. Vite's
// existing proxy in frontend/vite.config.js already forwards /api to :5000, so
// requests stay same-origin, the HttpOnly auth cookies keep working, and no
// application code has to know it is running under Electron.
//
// ponytail: dev-only shell — unpackaged, unsigned, no auto-update, and it
// assumes frontend/backend node_modules and the ml-service Python deps are
// already installed. Upgrade path: serve frontend/dist from backend/app.js so
// there is one process to wrap, then package with electron-builder.

const { app, BrowserWindow, dialog, shell } = require('electron');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const VITE_PORT = 3000;
const VITE_URL = `http://localhost:${VITE_PORT}`;

// Spawned as direct single processes rather than `npm run …`: on Windows an
// npm.cmd shell wrapper sits between us and the real server, so killing the pid
// we hold orphans the server and leaves its port bound.
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
    // Vite's config sets open:true, which would also launch a browser tab
    // alongside the app window. Vite skips opening when BROWSER is "none".
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

// Probe both loopback families. Vite listens on "localhost", which Node 17+
// resolves to ::1 first, so a 127.0.0.1-only probe never sees it and the wait
// below times out even though the server is up. The backend binds :: and
// uvicorn binds 127.0.0.1, so the two families genuinely both get used here.
async function portOpen(port) {
  const results = await Promise.all([tryConnect(port, '127.0.0.1'), tryConnect(port, '::1')]);
  return results.some(Boolean);
}

// Poll the port instead of scraping the "ready in ___ms" banner — that wording
// is not a contract, and a version bump would silently hang startup.
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
      // /T kills the tree: vite and uvicorn spawn helpers of their own that
      // would otherwise survive and keep :3000 / :8000 bound.
      spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
  children.length = 0;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: 'Real Estate AI Platform',
    backgroundColor: '#0f172a', // avoids a white flash before the dark UI paints
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  win.setMenuBarVisibility(false);

  // External links (map tile attribution, docs) go to the real browser — this
  // window has no back button to escape them with.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadURL(VITE_URL);

  win.webContents.on('did-finish-load', () => console.log('[shell] window loaded'));
  win.webContents.on('did-fail-load', (_e, code, desc) =>
    console.error(`[shell] window failed to load: ${desc} (${code})`)
  );
  win.on('closed', () => console.log('[shell] window closed'));

  console.log('[shell] window created');
}

app.whenReady().then(async () => {
  for (const proc of PROCS) {
    // Reuse anything already listening. Without this, a dev server the user
    // started earlier keeps its port and our duplicate dies on EADDRINUSE —
    // or worse, Vite quietly falls back to :3001 and the window loads the
    // wrong server.
    if (await portOpen(proc.port)) {
      console.log(`[${proc.name}] already listening on :${proc.port} — reusing it`);
      continue;
    }
    start(proc);
  }

  if (!(await waitForPort(VITE_PORT, 90_000))) {
    dialog.showErrorBox(
      'Dev server never came up',
      `Nothing is listening on ${VITE_URL} after 90s.\n\nCheck the terminal for [vite] / [backend] errors.`
    );
    app.quit();
    return;
  }

  createWindow();
});

app.on('window-all-closed', () => {
  console.log('[shell] window-all-closed');
  app.quit();
});
app.on('will-quit', () => {
  console.log('[shell] will-quit — stopping child processes');
  killAll();
});
// Ctrl+C in the launching terminal should take the child processes with it.
process.on('SIGINT', () => {
  console.log('[shell] SIGINT');
  app.quit();
});
