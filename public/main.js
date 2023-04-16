const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')


require('@electron/remote/main').initialize()

const fs = require('fs');
const path = require('path')

const isDev = require("electron-is-dev")

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
    // Loads react app in local host is in dev mode, otherwise will instruct electron to load the built react app's index.html file
    win.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, "../build/index.html")}`)
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
/*
function traverse (item, index, parentIndex= '') {
  console.log(item, index)
  if (item.isDirectory) {
    const sortedChildren = [...item.files, ...item.folders].sort((a, b) => a.name.localeCompare(b.name))
    sortedChildren.forEach((child, i) => {
      const childIndex = parentIndex ? parentIndex + '.' + i : index + '.' + i
      traverse(child, childIndex)
    })
  }
  if (item.name) {
    const newName = parentIndex ? parentIndex + '#' + item.name : index + '#' + item.name
    const newPath = item.pathname.substring(0, item.pathname.lastIndexOf('/')) + '/' + newName
    fs.rename(item.pathname, newPath, (err) => {
      if (err) throw err
    })
  }
  
}
*/

ipcMain.on('make-project-folder-dialog', (event, folderPath, files)=>{
  const options = {
    type: 'question',
    buttons: ['Yes', 'No', 'Cancel'],
    defaultId: 2,
    title: 'Question',
    message: 'Do you want to continue?',
    detail: 'It will turn the existing folder in a Writer Plat Project',
    checkboxLabel: 'Remember my answer',
    checkboxChecked: true,
  };
  const result = dialog.showMessageBoxSync(options)
  
  if (result === 0) {
    console.log('User clicked Yes');
    //create file in main folders ////make Binder???
    const filePath = path.join(folderPath, '.wrplat');
   
    fs.writeFileSync(filePath, 'Active');
    console.log('created');
    console.log(files);
    
    //rename Files & Folders
    /*
    let index = 0;
    files.forEach((item) => {
      traverse(item, index)
      index++
    })
    return files
    */
  } else if (result === 1) {
    console.log('User clicked No');
  } else {
    console.log('User clicked Cancel');
  }
});

// new custom menu template
const isMac = process.platform === 'darwin'
console.log('is Mac? ', isMac)

const customMenu = [
    ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
    {
        label: 'File',
        submenu: [
            { label: 'Open Project', accelerator: 'CmdOrCtrl+O', click: (menuItem, browserWindow) =>{ 
                dialog.showOpenDialog({
                    properties: ['openDirectory'],
                    title: 'Select a folder foooo menu way',
                })
                .then((result) => {
                if (!result.canceled && result.filePaths.length > 0) {
                    // Send the selected folder path back to the renderer process
                    browserWindow.webContents.send('selected-folder', result.filePaths[0]);
                }
                });
                console.log(' Folder Opened') 
            }},
            { label: 'New File', accelerator: 'CmdOrCtrl+N', click: () => console.log('Open file') },
            { type: 'separator' },
            isMac ? { role: 'close' } : { role: 'quit' }
        ]
    },
    {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          ...(isMac ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
              ]
            }
          ] : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ])
        ]
      },
      {
        // remove the dev tools later
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          ...(isMac ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ] : [
            { role: 'close' }
          ]),
          {
            label: 'Inspect Element',
            click: () => {
                remote.getCurrentWindow().webContents.inspectElement()
              }
          }
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: async () => {
              const { shell } = require('electron')
              await shell.openExternal('https://electronjs.org')
            }
          }
        ]
      }
]

//init menu from custom template and set to application window
const menu = Menu.buildFromTemplate(customMenu)
Menu.setApplicationMenu(menu)





