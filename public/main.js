const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')


require('@electron/remote/main').initialize()

const fs = require('fs');
const fsExtra = require('fs-extra')
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
        // added .replaceAll here to test if renae files works on PC
        event.reply('selected-folder', result.filePaths[0].replaceAll('\\', '/'));
      }
    });
});

/*
const traverse = useCallback((files) => {
  files.forEach((item, index) => {

    console.log(item, index)
    if (item.directory) {
      const newName = `Folder ${index+1}`;
      console.log("newName", newName)

      const newPath = item.path.replace(item.name, newName);
      console.log("newPath",newPath)

      fs.rename(item.path, newPath, (err) => {
        if (err) throw err
      })
      
      if (item.children.length !== 0) {
        traverse(item.children) 
      }   
    } else {
      const newName = `File ${index+1}`;
      console.log("newName", newName)

      const newPath = item.path.replace(item.name, newName);
      console.log("newPath",newPath)

      fs.rename(item.path, newPath, (err) => {
        if (err) throw err
      })
      
    }
  })
  
}, [])
*/
// make project files and folers binding them

function traverse (files) {
  function createNewFiles(files, parentIndex = "") {
    const newFiles = []
    files.forEach((item, index) =>{
      const newName = `${parentIndex}${index}#${item.name}`;
      const newPath = path.join(item.path.substr(0, item.path.lastIndexOf("/")), newName)
      const newItem = {
        name: newName,
        path: newPath,
        children: item.children.length > 0 ? createNewFiles(item.children, parentIndex+index+'.') :[]
      }
      newFiles.push(newItem)
    })
    return newFiles
  }
  const newFiles = createNewFiles(files)
  function renameChildren(oldChildren, newChildren) {

    for (let i=0; i < oldChildren.length; i++) {
      const oldChild = oldChildren[i]
      const newChild = newChildren[i]

      if (oldChild.directory) {
        renameChildren(oldChild.children, newChild.children)
      } else {
        console.log('Not a Directory')
      }

      const oldPath = oldChild.path
      const newPath = newChild.path

      fs.renameSync(oldPath, newPath)
    }
  }
  for (let i=0; i < files.length; i++) {
    const oldPath = files[i].path
    const newPath = newFiles[i].path
    if (files[i].directory) {
      renameChildren(files[i].children, newFiles[i].children)
    }

    fs.renameSync(oldPath, newPath)
  }
  // setPath(path)
}

/*
function traverse(files) {
  files.forEach((item, index) => {
    if (item.directory === true) {
      traverse(item.children);
    }

    const newName = item.directory
      ? `Folder ${index + 1}`
      : `File ${index + 1}${path.extname(item.name)}`;
    console.log("newName", newName);

    const newPath = item.path.replace(item.name, newName);
    console.log("newPath", newPath);

    fs.renameSync(item.path, newPath, (err) => {
      if (err) throw err;
    });
  });
}
*/



//get array of files/folder directly in sub directory with same parent
//files must but an array of the sub diretory only
function moveFolder(files, droppedIndex, underIndex) {
  let newOrder = []
  let oldIndex
  let unIndex
  let file
  for (let i = 0; i < files.length; i++) {
    
    if (files[i].name === droppedIndex.name) {
      oldIndex = i
      file = files[i]
      newOrder = files.splice(i, 1)
    }
    if (files[i].name === underIndex.name) {
      unIndex = i
    }
  }
  newOrder.splice((unIndex -1), 0, file)
  //loop over new order with files names
  for (let i = 0; i < newOrder.length; i++) {
    if (newOrder.length === files.length) {
      const newPath = files[i].path;
      console.log("newPath", newPath);

      fs.renameSync(newOrder[i].path, newPath, (err) => {
        if (err) throw err;
      });
    }
    
  }
}


/*
function movetoFolder (){

}
*/

ipcMain.handle('item-dropped', async (event, droppedItem, droppedOnItem, droppedUnder, projRootPath, files) => {
  const isProject = fs.existsSync(path.join(projRootPath, '.wrplat'))
  const destinationArray = files
  if (isProject) {
    if (droppedUnder) {
      console.log(droppedItem.name, ' dropped under', droppedOnItem.name)
    } else {
      console.log(droppedItem.name, ' dropped above', droppedOnItem.name)
    }
  } else {
    const originPath = droppedItem.path
    const destinationFolder = path.dirname(droppedOnItem.path)
    let destinationPath = destinationFolder+'/'+droppedItem.name
    // make sure path doesn't already exist and, if so, construct a new one
    let i = 1
    while (fs.existsSync(destinationPath)) {
      if (droppedItem.directory) {
        destinationPath = destinationFolder+'/'+droppedItem.name+' ' + i 
      } else {
        destinationPath = destinationFolder+'/'+droppedItem.name.substr(0, droppedItem.name.lastIndexOf('.'))+' ' + i + '.'+droppedItem.name.substr(droppedItem.name.lastIndexOf('.') +1)
      }
      i++
    }
    // copy to now loaction
    fsExtra.copySync(originPath, destinationPath)
    // delete from old location
    fsExtra.rmSync(originPath, { recursive: true })
    console.log("This root folder is not a Writer's Plat project.", destinationFolder)
  }
  const result = 'Success!'
  return result
  // movetoFolder(data, droppedItem, underItem)
})


ipcMain.on('make-project-folder-dialog', (event, projRootPath, files)=>{
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
    const wrPlatFilePath = path.join(projRootPath, '.wrplat');
   
    fs.writeFileSync(wrPlatFilePath, 'Active');
    
    //rename Files & Folders
    traverse(files)
    event.sender.send('make-project-folder-reply', 'Success');
    
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





