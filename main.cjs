const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { convertVideoToGif } = require('./dist/index.js');
const { execFile } = require('child_process');

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
  return await convertVideoToGif(args);
});

ipcMain.handle('select-video', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Videos', extensions: ['mp4', 'avi', 'mov'] }],
    properties: ['openFile']
  });
  if (canceled) return null;
  return filePaths[0];
});

ipcMain.handle('select-save-path', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '选择保存位置',
    defaultPath: 'video.mp4',
    filters: [{ name: 'Video', extensions: ['mp4', 'mkv', 'flv', 'mov'] }]
  });
  if (canceled) return null;
  return filePath;
});

ipcMain.handle('download-video', async (event, { url, savePath }) => {
  return new Promise((resolve, reject) => {
    // yt-dlp -o "savePath" url
    execFile('yt-dlp', ['-o', savePath, url], { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(savePath);
      }
    });
  });
}); 