const { app, BrowserWindow, ipcMain } = require("electron");
const { fork } = require("child_process");
const path = require("path");
const http = require("http");

const isDev = !app.isPackaged;
let mainWindow = null;
let nextServer = null;

function findFreePort() {
  const net = require("net");
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const p = server.address().port;
      server.close(() => resolve(p));
    });
    server.on("error", reject);
  });
}

function waitForServer(url, retries = 40, interval = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode < 500) resolve();
          else if (++attempts < retries) setTimeout(check, interval);
          else reject(new Error("Server not ready"));
        })
        .on("error", () => {
          if (++attempts < retries) setTimeout(check, interval);
          else reject(new Error("Server not reachable"));
        });
    };
    check();
  });
}

async function startNextServer() {
  if (isDev) {
    console.log("[electron] Dev mode — connecting to http://localhost:3000");
    return 3000;
  }

  const port = await findFreePort();

  console.log(`[electron] Starting Next.js server on port ${port}...`);
  nextServer = fork(
    path.join(__dirname, "run-server.js"),
    [],
    {
      cwd: path.dirname(__dirname),
      env: { ...process.env, PORT: String(port), NODE_ENV: "production" },
      silent: true,
    }
  );

  nextServer.stdout.on("data", (d) =>
    console.log(`[next] ${d.toString().trim()}`)
  );
  nextServer.stderr.on("data", (d) =>
    console.error(`[next:err] ${d.toString().trim()}`)
  );

  nextServer.on("exit", (code) => {
    if (code !== 0 && !app.isQuitting) {
      console.error(`[electron] Next.js exited with code ${code}`);
    }
  });

  await waitForServer(`http://localhost:${port}/api/config`);
  console.log(`[electron] Next.js ready on port ${port}`);
  return port;
}

async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "Mitch-Jelly",
    backgroundColor: "#0a0a0a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://localhost:${port}`);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC handlers
ipcMain.handle("get-auto-launch", () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle("set-auto-launch", (_event, enabled) => {
  app.setLoginItemSettings({ openAtLogin: enabled });
});

ipcMain.handle("get-version", () => {
  return app.getVersion();
});

// App lifecycle
app.whenReady().then(async () => {
  try {
    const port = await startNextServer();
    await createWindow(port);
  } catch (err) {
    console.error("[electron] Startup failed:", err);
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const port = isDev ? 3000 : 0;
    createWindow(port);
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
  if (nextServer && !nextServer.killed) {
    console.log("[electron] Stopping Next.js server");
    nextServer.kill("SIGTERM");
    setTimeout(() => {
      if (nextServer && !nextServer.killed) nextServer.kill("SIGKILL");
    }, 5000);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
