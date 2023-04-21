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
function moveUnder(files, droppedIndex, underIndex) {
  const parentDirectory = path.dirname(droppedIndex.path)
  const parentUnderDirectory = path.dirname(underIndex.path)
  const _files = fs.readdirSync(parentDirectory)
  .filter((item) => item !== '.wrplat')
  .map((file) => {
    const filePath = path.join(parentDirectory, file).replaceAll('\\', '/');
    return {
      name: file,
      path: filePath,
    };
  })
  const files_ = fs.readdirSync(parentUnderDirectory)
  .filter((item) => item !== '.wrplat')
  .map((file) => {
    const filePath = path.join(parentUnderDirectory, file).replaceAll('\\', '/');
    return {
      name: file,
      path: filePath,
    };
  })
  let newOrder = files
  let tempOrder = []
  let unIndex
  let file

  if (parentDirectory !== parentUnderDirectory) {
    for (let i = 0; i < files.length; i++) {
    
      if (files[i].name === droppedIndex.name) {
        file = newOrder[i]
        newOrder.splice(i, 1)
        console.log('new order: ', newOrder)
      }

      for (let i = 0; i < files_.length; i++) {
        if (files_[i].name === underIndex.name) {
          unIndex = i+1
          console.log(i)
        } //
      }  
    }
    files_.splice(unIndex, 0, file)
    console.log(files_)
    
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder.length === files.length) {
        const newPath = newOrder[i].path.replace(newOrder[i].name, `${i}#${newOrder[i].name.slice(2)}`); //file.path.replace(file.name, 'newFOOL') //`${parentIndex}${index}#${item.name}`
        tempOrder.push(newPath)
        console.log("newPath", newPath, ':', newOrder[i].path);
  
        fs.rename(newOrder[i].path, newPath,  (err) => {
          if (err) throw err;
        });
      }
    }
    console.log('old order1: ', tempOrder)
    tempOrder = []
    for (let i = 0; i < files_.length; i++) {
      const newPath = `${parentUnderDirectory}/${i}#${files_[i].name.slice(2)}` //files_[i].path.replace(files_[i].name, `${i}#${files_[i].name.slice(2)}`); //file.path.replace(file.name, 'newFOOL') //`${parentIndex}${index}#${item.name}`
      tempOrder.push(newPath)
      console.log("newPath", newPath, ':', files_[i].path);

      fs.rename(files_[i].path, newPath,  (err) => {
        if (err) throw err;
      });
    }
    
  
    console.log('new order2: ', newOrder)
    console.log('old order2: ', _files)
    console.log('old order2: ', tempOrder)

    //loop over new order with files names
    /*
    for (let i = 0; i < _files.length; i++) {
      if (tempOrder.length === _files.length) {
        const newPath = _files[i].path;
        console.log("newPath", newPath, ':', newOrder[i].path);
  
        fs.rename(tempOrder[i], newPath,  (err) => {
          if (err) throw err;
        });
      }
    }
    */

  } else {

    for (let i = 0; i < files.length; i++) {
    
      if (files[i].name === droppedIndex.name) {
        file = newOrder[i]
        newOrder.splice(i, 1)
        console.log('new order: ', newOrder)
      }
      if (files[i].name === underIndex.name) {
        unIndex = i+1
        console.log(i)
      } //
    }
    newOrder.splice(unIndex, 0, file)

    //loop over new order with files names
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder.length === files.length) {
        const newPath = newOrder[i].path.replace(newOrder[i].name, `${i}#${newOrder[i].name.slice(2)}`); //file.path.replace(file.name, 'newFOOL') //`${parentIndex}${index}#${item.name}`
        tempOrder.push(newPath)
        console.log("newPath", newPath, ':', newOrder[i].path);
        fs.rename(newOrder[i].path, newPath,  (err) => {
          if (err) throw err;
        }); 
      }
    }
  
    console.log('new order2: ', newOrder)
    //console.log('old order2: ', _files)
    console.log('old order2: ', tempOrder)
    
    //loop over new order with files names
    /*
    for (let i = 0; i < _files.length; i++) {
      if (tempOrder.length === _files.length) {
        const newPath = _files[i].path;
        console.log("newPath", newPath, ':', newOrder[i].path);
  
        fs.rename(tempOrder[i], newPath,  (err) => {
          if (err) throw err;
        });
      }
    }
    */
  }
  
 
  
  

}



function moveAbove(files, droppedIndex, underIndex) {
  const parentDirectory = path.dirname(droppedIndex.path)
  const parentUnderDirectory = path.dirname(underIndex.path)
  const files_ = fs.readdirSync(parentUnderDirectory)
  .filter((item) => item !== '.wrplat')
  .map((file) => {
    const filePath = path.join(parentUnderDirectory, file).replaceAll('\\', '/');
    return {
      name: file,
      path: filePath,
    };
  })
  let newOrder = files
  let topIndex = 0
  //let oldIndex
  let file

  if (parentDirectory !== parentUnderDirectory) {
    for (let i = 0; i < files.length; i++) {
    
      if (files[i].name === droppedIndex.name) {
        file = newOrder[i]
        newOrder.splice(i, 1)
        console.log('new order: ', newOrder)
      }
      /*
      for (let i = 0; i < files_.length; i++) {
        if (files_[i].name === underIndex.name) {
          unIndex = i+1
          console.log(i)
        } //
      }
      */
    }
    files_.splice((topIndex), 0, file)
    console.log(files_)
    
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder.length === files.length) {
        const newPath = newOrder[i].path.replace(newOrder[i].name, `${i}#${newOrder[i].name.slice(2)}`); //file.path.replace(file.name, 'newFOOL') //`${parentIndex}${index}#${item.name}`
        //tempOrder.push(newPath)
        console.log("newPath", newPath, ':', newOrder[i].path);
  
        fs.rename(newOrder[i].path, newPath,  (err) => {
          if (err) throw err;
        });
      }
    }
    //console.log('old order1: ', tempOrder)
    //tempOrder = []
    for (let i = 0; i < files_.length; i++) {
      const newPath = `${parentUnderDirectory}/${i}#${files_[i].name.slice(2)}` //files_[i].path.replace(files_[i].name, `${i}#${files_[i].name.slice(2)}`); //file.path.replace(file.name, 'newFOOL') //`${parentIndex}${index}#${item.name}`
      //tempOrder.push(newPath)
      console.log("newPath", newPath, ':', files_[i].path);

      fs.rename(files_[i].path, newPath,  (err) => {
        if (err) throw err;
      });
    }
    

    
  } else {
    for (let i = 0; i < files.length; i++) {
      if (files[i].name === droppedIndex.name) {
        //oldIndex = i
        file = newOrder[i]
        newOrder.splice(i, 1)
      }
    }
    newOrder.splice((topIndex), 0, file)
    //loop over new order with files names
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder.length === files.length) {
        const newPath = newOrder[i].path.replace(newOrder[i].name, `${i}#${newOrder[i].name.slice(2)}`); //file.path.replace(file.name, 'newFOOL') //`${parentIndex}${index}#${item.name}`
        console.log("newPath", newPath);
  
        fs.renameSync(newOrder[i].path, newPath, (err) => {
          if (err) throw err;
        });
      }
    }
    console.log('new order2: ', newOrder)
    //console.log('old order2: ', _files)
    //console.log('old order2: ', tempOrder)
  }

  
  
}


ipcMain.handle('item-dropped', async (event, droppedItem, droppedOnItem, droppedUnder, projRootPath, files) => {
  async function itemDropped( droppedItem, droppedOnItem, droppedUnder, projRootPath, files){
    const isProject = fs.existsSync(path.join(projRootPath, '.wrplat'))
    const destinationArray = files
    
    //get parent path
    const parentDirectory = path.dirname(droppedItem.path)
    //get Specific array of files in folders
    const _files = fs.readdirSync(parentDirectory)
    .filter((item) => item !== '.wrplat')
    .map((file) => {
      const filePath = path.join(parentDirectory, file).replaceAll('\\', '/');
      return {
        name: file,
        path: filePath,
      };
    })
    //console.log(_files)
    
    if (isProject) {
      if (droppedUnder) {
        console.log(droppedItem.name, ' dropped under', droppedOnItem.name)
        //console.log(_files)
        moveUnder(_files, droppedItem, droppedOnItem)
      } else {
        console.log(droppedItem.name, ' dropped above', droppedOnItem.name)
        moveAbove(_files, droppedItem, droppedOnItem)
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
  
  const result = await itemDropped(droppedItem, droppedOnItem, droppedUnder, projRootPath, files)
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





