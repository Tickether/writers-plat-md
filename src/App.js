import "./App.css";
import Editor from "./Editor";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useState } from 'react'



function App() {
  const [activeItems, setActiveItems] = useState([]);

  return (
    <div className="App">
      <div className="sidebar">
        <Sidebar activeItems={activeItems} setActiveItems={setActiveItems} />
      </div>
      <div className="editor-area">
        <Editor activeItems={activeItems} />
      </div>
      <div className="footer">
        <Footer />
      </div>
    </div>
  );
}

export default App;
