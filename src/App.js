import "./App.css";
import { Editor } from "./Editor";
import Sidebar from "./Sidebar";
import Footer from "./Footer"


function App() {
  return (
    <div className="App">
      <div className="sidebar">
        <Sidebar />
      </div>
      <div className="editor-area">
        <Editor />
      </div>
      <div className="footer">
        <Footer />
      </div>
    </div>
  );
}

export default App;
