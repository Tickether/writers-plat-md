import { useMemo, useState } from "react";

//alternate imports contextIsolation: ture,
//const fs = require('fs')
//const pathModule = require('path')

// internal node imports 
const fs = window.require('fs') //file system
const pathModule = window.require('path') //file path
const os = window.require("os");

const { ipcRenderer  } = window.require('electron');

// invoke userInfo() method
const userInfo = os.userInfo();
// get username property
// from the userInfo object
const username = userInfo.username;

//default path for app
const _default = `/Users/${username}/Documents`

// Template for the list of files presented in sidebar when a folder is chosen.
export function FileListMap({ data }) {
  return (
    <ul className="fileList">
      {data.map((item, index) => (
        <li key={index}>{item.name}</li>
      ))}
    </ul>
  )
}


function Sidebar() {
  const [
    path, 
    setPath
  ] = useState(_default)

  function handleOpenFolder() {
    ipcRenderer.send('open-folder-dialog');
  }
  
  ipcRenderer.on('selected-folder', (event, folderPath) => {
    console.log(`Selected folder: ${folderPath}`);
    setPath(folderPath)
  });
  
  //list files and folders in path sorted by a-z in Memo to save state and update only on change
  const files = useMemo(
    ()=>
      fs
      .readdirSync(path)
      .map(file => {
        const stats = fs.statSync(pathModule.join(path, file))
        return{
          name:file,
          directory: stats.isDirectory()
        }
      })
      .sort((a, b) => {
        if (a.directory === b.directory) {
          return a.name.localeCompare(b.name)
        }
        return a.directory ? -1 : 1
      }),  
    [path]
  )
  console.log(files)
  
  // const onBack= () => setPath(pathModule.dirname(path))
  // const onOpen = folder => setPath(pathModule.join(path, folder))

  // const [searchString, setSearchString] = useState('')
  // const filteredFiles = files.filter(s => s.name.startsWith(searchString))
  

  return (
    <>
    {path === _default ? <button onClick={handleOpenFolder}>open me darnit</button> : 
    <FileListMap data={files} />
    }
    </>
  )
}
  
export default Sidebar;