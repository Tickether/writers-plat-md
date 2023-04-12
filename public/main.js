const { app, BrowserWindow } = require('electron')

require('@electron/remote/main').initialize()

function createWindow() {
    // create window
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            enableRemoteModule: true
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