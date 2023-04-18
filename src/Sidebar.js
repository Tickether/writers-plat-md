import { useMemo, useState, useCallback, useEffect } from "react";
import { FaChevronDown, FaChevronRight, FaRegFolder, FaRegFolderOpen, FaRegFile } from "react-icons/fa"

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
//changed this to an app folder so we are drilling into the user's whole documents folder
const _default = `/Users/${username}/WritersPlatMd`

//if the app folder doesn't exist, create it
if (!fs.existsSync(_default)) {
  fs.mkdirSync(_default);
}

// Template for the list of files presented in sidebar when a folder is chosen.
export function FileListMap({ data, activeItems, setActiveItems }) {
  const [openFolders, setOpenFolders] = useState([]);

  const toggleFolder = (folder,e) => {
    e.stopPropagation();
    setOpenFolders((openFolders) =>
      openFolders.includes(folder.path)
        ? openFolders.filter((f) => f !== folder.path)
        : [...openFolders, folder.path]
    );
  };

  const toggleActive = (folder,e) => {
    e.stopPropagation();
    if (e.MetaKey) {
      setActiveItems([...activeItems, folder.path]);
    } else if (e.shiftKey) {
      setActiveItems([...activeItems, folder.path]);
    } else {
      activeItems.includes(folder.path) ? setActiveItems([]) : setActiveItems([folder.path]);
    }
  };

  const renderItems = (items) =>
    items.map((item, index) => (
      <>
      <li 
        key={index}
        className={item.directory ? "folder" + (openFolders.includes(item.path) ? " open" : " closed") : "file"}
        style={{ listStyleType: "none" }}
        draggable={true}
        onDragStart={(event) => {
          // when you start dragging an item you pass data from the dragged item that will be "carried". JSON stringify is needed to send an array
          event.dataTransfer.setData("item", JSON.stringify(item)); 
          console.log("Started dragging ", item.name)
        }}
        onDragEnd={() => {
          console.log("Stopped dragging ", item.name)
        }}
      >
        <span 
        onClick={(e) => item.directory && toggleFolder(item,e)}
        className={item.directory ? "arrow" : ""}
        >
        {item.directory && (openFolders.includes(item.path) ? 
        <FaChevronDown fontSize="0.8em" /> : 
        <FaChevronRight fontSize="0.8em"/>)}
        </span>
        <span 
          className={activeItems.includes(item.path) ? "activeFile" : ""}
          onClick={(e) => {toggleActive(item, e); console.log('from Sidebar: ', activeItems)}}
        >
          {item.directory ? openFolders.includes(item.path) ? 
        <FaRegFolderOpen fontSize="0.8em"/> : 
        <FaRegFolder fontSize="0.8em"/> :
        <FaRegFile fontSize="0.8em"/>}
          <span className="ItemName">{item.name}</span>
        </span>
        {item.directory && (
          <>
          <span
            // drop area for the top level of an open folder
            className="dropArea"
            // prevent default here allows the item to have something droppe don it, otherwise nothing will happen when you drop here
            onDragOver={event => {event.preventDefault();}}
            // drag enter and leave allow the hover even to occur (normal css :hover is disabled during drag)
            onDragEnter={event => {event.currentTarget.classList.toggle('dropActive')}}
            onDragLeave={event => {event.currentTarget.classList.toggle('dropActive')}}
            // onDrop this function is called. event data transfer provides the data from the dragged item to this function. JSON parse is needed to egt JSON string back to array
            onDrop={(event) => {
              const droppedItem = JSON.parse(event.dataTransfer.getData("item")); 
              event.currentTarget.classList.toggle('dropActive')
              console.log('Dropped ', droppedItem.name, " IN ", item.name)}}
          ></span>
          <ul>
            {renderItems(item.children)}
          </ul>
          </>
        )}
      </li>
      <span
        // drop area for below each file and folder
        className="dropArea"
        // prevent default here allows the item to have something droppe don it, otherwise nothing will happen when you drop here
        onDragOver={event => {event.preventDefault();}}
        // drag enter and leave allow the hover even to occur (normal css :hover is disabled during drag)
        onDragEnter={event => {event.currentTarget.classList.toggle('dropActive')}}
        onDragLeave={event => {event.currentTarget.classList.toggle('dropActive')}}
        // onDrop this function is called. event data transfer provides the data from the dragged item to this function. JSON parse is needed to egt JSON string back to array
        onDrop={(event) => {
          const droppedItem = JSON.parse(event.dataTransfer.getData("item")); 
          event.currentTarget.classList.toggle('dropActive')
          console.log('Dropped ', droppedItem.name, " under ", item.name)}}
      ></span>
      </>
    ));
  return renderItems(data)
}


function Sidebar({ activeItems, setActiveItems }) {
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
  
  

  //Altered method to list files and folder sorted by a-z in Memo (to get children of folders too)
  const getFilesWithChildren = useCallback((path) => {
    const files = fs.readdirSync(path, { withFileTypes: true });
    return files
      .filter(s => s.isDirectory() || s.name.endsWith('.md'))
      .map((file) => {
        const filePath = pathModule.join(path, file.name).replaceAll('\\', '\/');
        const isDirectory = file.isDirectory();
        const children = isDirectory ? getFilesWithChildren(filePath) : [];
        return {
          name: file.name,
          path: filePath,
          directory: isDirectory,
          children: children,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const files = useMemo(() => getFilesWithChildren(path), [path, getFilesWithChildren]);
  
  // old function preserved for now
  //list files and folders in path sorted by a-z in Memo to save state and update only on change
  // const files = useMemo(
  //   ()=>
  //     fs
  //     .readdirSync(path)
  //     .map(file => {
  //       const stats = fs.statSync(pathModule.join(path, file))
  //       return{
  //         name:file,
  //         path: path + '/' + file,
  //         directory: stats.isDirectory()
  //       }
  //     })
  //     .sort((a, b) => {
  //       if (a.directory === b.directory) {
  //         return a.name.localeCompare(b.name)
  //       }
  //       return a.directory ? -1 : 1
  //     }),  
  //   [path]
  // )
  console.log(files)

  
  useEffect(() => {
    //filter project file from path //NB: didnt use file here cos files show .md and folder will always return zero
    // const isBinder = fs.readdirSync(path, { withFileTypes: true }).filter(s => s.name.endsWith('.wrplat'))
    const isProject = fs.existsSync(pathModule.join(path, '.wrplat'))
    console.log(isProject)
  
    //open dialog and pass path and files
    if (files.length > 0) {
      if (!isProject) {
        ipcRenderer.send('make-project-folder-dialog', path, files);
      }
    }

  }, [path, files]);

  ipcRenderer.on('make-project-folder-reply', (event, arg) => {
    setPath(path)
  });
  
  
  // const onBack= () => setPath(pathModule.dirname(path))
  // const onOpen = folder => setPath(pathModule.join(path, folder))

  // const [searchString, setSearchString] = useState('')
  // const filteredFiles = files.filter(s => s.name.startsWith(searchString))
  

  return (
    <>
    {path === _default ? <button onClick={handleOpenFolder}>open me darnit</button> : 
    <>
    <span className="pathTitle">{pathModule.basename(path)}</span>
    <ul className="fileList">
      <FileListMap data={files} activeItems={activeItems} setActiveItems={setActiveItems} />
    </ul>
    </>
    }
    </>
  )
}
  
export default Sidebar;