const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const server = require('./dist/index.js');

function createWindow () {
  const win = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('convert-video-to-gif', async (event, args) => {
  return await server.convertVideoToGif(args);
});

ipcMain.handle('select-video', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Videos', extensions: ['mp4', 'avi', 'mov'] }],
    properties: ['openFile']
  });
  if (canceled) return null;
  return filePaths[0];
}); 