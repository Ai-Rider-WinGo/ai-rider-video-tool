const http = require("http");
const path = require("path");
const { app, BrowserWindow, dialog, shell } = require("electron");

const HOST = "127.0.0.1";
const DEFAULT_PORT = Number(process.env.PORT || 3100);

let mainWindow = null;
let appUrl = "";

function canUsePort(port) {
  return new Promise((resolve) => {
    const probe = http.createServer();

    probe.once("error", () => {
      resolve(false);
    });

    probe.once("listening", () => {
      probe.close(() => {
        resolve(true);
      });
    });

    probe.listen(port, HOST);
  });
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 100; port += 1) {
    if (await canUsePort(port)) {
      return port;
    }
  }
  throw new Error(`No available local port found from ${startPort} to ${startPort + 99}`);
}

function startLocalService() {
  require(path.join(__dirname, "..", "server.js"));
}

function waitForLocalService(timeoutMs = 10000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tryRequest = () => {
      const req = http.get(appUrl, (res) => {
        res.resume();
        resolve();
      });

      req.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Local service did not start at ${appUrl}`));
          return;
        }
        setTimeout(tryRequest, 250);
      });

      req.setTimeout(1000, () => {
        req.destroy();
      });
    };

    tryRequest();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    title: "AI-Rider｜首尾帧生成视频工具",
    icon: path.join(__dirname, "icon.png"),
    backgroundColor: "#0b1120",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(appUrl);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(async () => {
  try {
    const port = await findAvailablePort(DEFAULT_PORT);
    process.env.PORT = String(port);
    appUrl = `http://${HOST}:${port}`;
    startLocalService();
    await waitForLocalService();
    createWindow();
  } catch (error) {
    dialog.showErrorBox("AI-Rider 启动失败", error.message);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
