const { app, BrowserWindow, ipcMain, dialog } = require('electron')


require('@electron/remote/main').initialize()

function createWindow() {
    // create window
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    win.loadURL('http://localhost:3000')
}

app.on('ready', createWindow)

// quit when windows close
app.on('window-all-closed', function () {
    if(process.platform !== 'darwin'){
        app.quit()
    }
})

app.on('activate', function () {
    if(BrowserWindow.getAllWindows().length !== 0){
        createWindow()
    }
})

// Listen for the message from the renderer process
ipcMain.on('open-folder-dialog', (event) => {
    // Show the folder dialog
    dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select a folder foooo',
    })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        // Send the selected folder path back to the renderer process
        event.reply('selected-folder', result.filePaths[0]);
      }
    });
});
