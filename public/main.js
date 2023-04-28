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
  function createNewFiles(files) {
    const newFiles = []
    files.forEach((item, index) =>{
      const newName = `${index}#${item.name}`;
      const newPath = path.join(item.path.substr(0, item.path.lastIndexOf("/")), newName)
      const newItem = {
        name: newName,
        path: newPath,
        children: item.children.length > 0 ? createNewFiles(item.children) :[]
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



//get array of files/folder directly in sub directory with same parent
//files must but an array of the sub diretory only
function moveItem(newArrayToRename, oldArrayToRename, newIndex, oldIndex, droppedItem, droppedOnItem, projRootPath, openFolders) {
  console.log(openFolders)
  let newOpenFolders = openFolders
  //move dagged item to a temp folder
  fsExtra.copySync(droppedItem.path, projRootPath+'/.tmp/'+droppedItem.name)
  fsExtra.rmSync(droppedItem.path, { recursive: true })
  //rename the new location from the last item to the location the dragged item is to be dropped (unless the new location has no other items, in that case I skip this step)
  if (newArrayToRename.length > 0) {
    for (let i = newArrayToRename.length - 1; i>=newIndex; i--) {
      const baseName = newArrayToRename[i].name.split('#')[1]
      const oldPath = newArrayToRename[i].path
      const newItemIndex = i+1
      const newPath = oldPath.substr(0, oldPath.lastIndexOf('/')) + '/' + newItemIndex + '#' + baseName
      fsExtra.copySync(oldPath, newPath)
      fsExtra.rmSync(oldPath, { recursive: true })
      if (openFolders.includes(oldPath)) {
        for (let i = 0; i < newOpenFolders.length; i++) {
          newOpenFolders[i] = newOpenFolders[i].replace(oldPath, newPath);
        }
      }
    }
  }
  // Rename the dragged item and place in the now-empty slot in the new location
  const droppedItemBaseName = droppedItem.name.split('#')[1]
  const droppedItemNewPath = droppedOnItem.path.substr(0, droppedOnItem.path.lastIndexOf('/')) + '/' + newIndex + '#' + droppedItemBaseName
  fsExtra.copySync(projRootPath+'/.tmp/'+droppedItem.name, droppedItemNewPath)
  fsExtra.rmSync(projRootPath+'/.tmp', { recursive: true })
  //Check if the item was shifted 'up' in the folder structure, if so, the old location's array may have the wrong pathnames now
  const shiftedUp = droppedItem.path.substr(0, droppedItem.path.lastIndexOf('/')).includes(droppedOnItem.path.substr(0, droppedOnItem.path.lastIndexOf('/')))
  //rename items in old folder starting from the empty slot made by shifting the dragged item
  for (let i = oldIndex+1; i<= oldArrayToRename.length - 1;  i++) {
    const baseName = oldArrayToRename[i].name.split('#')[1]
    //If the item was dragged 'up' in the folder tree there's an extra step to change an index on one of the folders in the pathname
    if (shiftedUp) {
      const startOfPath = droppedOnItem.path.substr(0, droppedOnItem.path.lastIndexOf('/'))
      const folderNameToAdjust = droppedItem.path.substr(0, droppedItem.path.lastIndexOf('/')).replace(startOfPath, '')
      const isolateIndex = folderNameToAdjust.split(/#(.*)/s)
      const newFolderIndex = parseInt(isolateIndex[0].substr(1))+1
      const oldName = oldArrayToRename[i].name
      let oldPath = startOfPath + '/' + newFolderIndex + '#' + isolateIndex[1] + '/' + oldName
      const newItemIndex = i-1
      const newPath = oldPath.substr(0, oldPath.lastIndexOf('/')) + '/' + newItemIndex + '#' + baseName
      fsExtra.copySync(oldPath, newPath)
      fsExtra.rmSync(oldPath, { recursive: true })
      if (openFolders.includes(oldPath)) {
        for (let i = 0; i < newOpenFolders.length; i++) {
          newOpenFolders[i] = newOpenFolders[i].replace(oldPath, newPath);
        }
      }
    } else {
      let oldPath = oldArrayToRename[i].path
      const newItemIndex = i-1
      const newPath = oldPath.substr(0, oldPath.lastIndexOf('/')) + '/' + newItemIndex + '#' + baseName
      fsExtra.copySync(oldPath, newPath)
      fsExtra.rmSync(oldPath, { recursive: true })
      if (openFolders.includes(oldPath)) {
        for (let i = 0; i < newOpenFolders.length; i++) {
          newOpenFolders[i] = newOpenFolders[i].replace(oldPath, newPath);
        }
      }
    }
  }
  console.log('newOpenFolders = ', newOpenFolders)
  return newOpenFolders
}

function moveItemWithinFolder(newArrayToRename, oldArrayToRename, newIndex, oldIndex, droppedItem, droppedOnItem, projRootPath, openFolders) {
  console.log('openFolders= ',openFolders)
  let newOpenFolders = openFolders
  //move dagged item to a temp folder
  fsExtra.copySync(droppedItem.path, projRootPath+'/.tmp/'+droppedItem.name)
  fsExtra.rmSync(droppedItem.path, { recursive: true })
  if (newIndex > oldIndex) {
    const startIndex = oldIndex + 1 
    const endIndex = newIndex
    for (let i = startIndex; i <= endIndex; i++) {
      const baseName = newArrayToRename[i].name.split('#')[1]
      const oldPath = newArrayToRename[i].path
      const newItemIndex = i-1
      const newPath = oldPath.substr(0, oldPath.lastIndexOf('/')) + '/' + newItemIndex + '#' + baseName
      fsExtra.copySync(oldPath, newPath)
      fsExtra.rmSync(oldPath, { recursive: true })
      if (openFolders.includes(oldPath)) {
        for (let i = 0; i < newOpenFolders.length; i++) {
          newOpenFolders[i] = newOpenFolders[i].replace(oldPath, newPath);
        }
      }
    }
  } else {
    const startIndex = oldIndex - 1 
    const endIndex = newIndex
    for (let i = startIndex; i>=endIndex; i--) {
      const baseName = newArrayToRename[i].name.split('#')[1]
      const oldPath = newArrayToRename[i].path
      const newItemIndex = i+1
      const newPath = oldPath.substr(0, oldPath.lastIndexOf('/')) + '/' + newItemIndex + '#' + baseName
      fsExtra.copySync(oldPath, newPath)
      fsExtra.rmSync(oldPath, { recursive: true })
      if (openFolders.includes(oldPath)) {
        for (let i = 0; i < newOpenFolders.length; i++) {
          newOpenFolders[i] = newOpenFolders[i].replace(oldPath, newPath);
        }
      }
    }
  }
  // Rename the dragged item and place in the now-empty slot in the new location
  const droppedItemBaseName = droppedItem.name.split('#')[1]
  const droppedItemNewPath = droppedOnItem.path.substr(0, droppedOnItem.path.lastIndexOf('/')) + '/' + newIndex + '#' + droppedItemBaseName
  fsExtra.copySync(projRootPath+'/.tmp/'+droppedItem.name, droppedItemNewPath)
  fsExtra.rmSync(projRootPath+'/.tmp', { recursive: true })
  console.log('newOpenFolders = ', newOpenFolders)
  return newOpenFolders
}



ipcMain.handle('item-dropped', async (event, droppedItem, droppedOnItem, droppedUnder, projRootPath, files, openFolders) => {
  async function itemDropped( droppedItem, droppedOnItem, droppedUnder, projRootPath, files, openFolders){
    const isProject = fs.existsSync(path.join(projRootPath, '.wrplat'))
    const newFolder = droppedOnItem.path.substr(0, droppedOnItem.path.lastIndexOf('/'))
    const newFileList = fs.readdirSync(newFolder, { withFileTypes: true });
    // Create array for each folder to be renamed
    const newArrayToRename = newFileList
      .filter(s => s.isDirectory() || s.name.endsWith('.md'))
      .map((file) => {
        const filePath = path.join(newFolder, file.name).replaceAll('\\', '/');
        const isDirectory = file.isDirectory();
        return {
          name: file.name,
          path: filePath,
          directory: isDirectory,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    const oldFolder = droppedItem.path.substr(0, droppedItem.path.lastIndexOf('/'))
    const oldFileList = fs.readdirSync(oldFolder, { withFileTypes: true });
    const oldArrayToRename = oldFileList
      .filter(s => s.isDirectory() || s.name.endsWith('.md'))
      .map((file) => {
        const filePath = path.join(oldFolder, file.name).replaceAll('\\', '/');
        const isDirectory = file.isDirectory();
        return {
          name: file.name,
          path: filePath,
          directory: isDirectory,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    // handle renaming differently for projects vs normal folders
    if (isProject) {
      //set different index for if the item was drop over or under (if dropped under, the item that was dropped on doesn't get renamed)
      if (droppedUnder) {
        const newIndex = parseInt(droppedOnItem.name.split('#')[0]) + 1
        const oldIndex = parseInt(droppedItem.name.split('#')[0])
        if (droppedItem.path.substr(0, droppedItem.path.lastIndexOf('/')) === droppedOnItem.path.substr(0, droppedOnItem.path.lastIndexOf('/'))) {
          return moveItemWithinFolder(newArrayToRename, oldArrayToRename, newIndex-1, oldIndex, droppedItem, droppedOnItem, projRootPath, openFolders)
        } else {
          return moveItem(newArrayToRename, oldArrayToRename, newIndex, oldIndex, droppedItem, droppedOnItem, projRootPath, openFolders)
        }
      } else {
        const newIndex = parseInt(droppedOnItem.name.split('#')[0])
        const oldIndex = parseInt(droppedItem.name.split('#')[0])
        if (droppedItem.path.substr(0, droppedItem.path.lastIndexOf('/')) === droppedOnItem.path.substr(0, droppedOnItem.path.lastIndexOf('/'))) {
          return moveItemWithinFolder(newArrayToRename, oldArrayToRename, newIndex, oldIndex, droppedItem, droppedOnItem, projRootPath, openFolders)
        } else {
          return moveItem(newArrayToRename, oldArrayToRename, newIndex, oldIndex, droppedItem, droppedOnItem, projRootPath, openFolders)
        }
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
  }
  const result = await itemDropped(droppedItem, droppedOnItem, droppedUnder, projRootPath, files, openFolders)
  console.log('result = ', result)
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





