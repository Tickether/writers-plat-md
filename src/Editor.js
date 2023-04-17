import "@bangle.dev/core/style.css";
import "@bangle.dev/tooltip/style.css";
import "@bangle.dev/react-menu/style.css";

import { useEditorState, BangleEditor } from "@bangle.dev/react";
import { PluginKey } from "@bangle.dev/core";
import {
  StaticMenu,
  UndoButton,
  RedoButton,
  ParagraphButton,
  OrderedListButton,
  TodoListButton,
  floatingMenu,
  FloatingMenu,
  Menu,
  MenuGroup,
  BoldButton,
  HeadingButton,
  BulletListButton,
  ItalicButton,
} from "@bangle.dev/react-menu";
import {
  bold,
  listItem,
  bulletList,
  orderedList,
  italic,
  heading,
  hardBreak,
  horizontalRule,
  link,
  strike,
  underline,
  blockquote
} from "@bangle.dev/base-components";
import { subscript, superscript } from "@bangle.dev/text-formatting";
// import { frontMatter, FrontMatter,  } from './customNodes/frontMatter';
import { useEffect, useState, useRef } from "react";

const fs = window.require('fs')


const menuKey = new PluginKey("menuKey");

export function Editor({ activeItems }) {
  const [ editor, setEditor ] = useState();
  const editorRef = useRef()
  const editorState = useEditorState({
    initialValue: "Hello, World!",
    specs: [
      bold.spec(),
      bulletList.spec(),
      orderedList.spec(),
      listItem.spec(),
      italic.spec(),
      heading.spec({
        levels: [1,2,3,4,5,6]
      }),
      hardBreak.spec(),
      horizontalRule.spec(),
      link.spec(),
      strike.spec(),
      underline.spec(),
      blockquote.spec(),
      subscript.spec(),
      superscript.spec(),
      // frontMatter.spec()
    ],
    plugins: () => [
      bold.plugins(),
      bulletList.plugins(),
      orderedList.plugins(),
      listItem.plugins(),
      italic.plugins(),
      heading.plugins(),
      hardBreak.plugins(),
      horizontalRule.plugins(),
      link.plugins(),
      strike.plugins(),
      underline.plugins(),
      blockquote.plugins(),
      subscript.plugins({
        keybindings: { toggleSubscript: 'Mod-Shift-d' }
      }),
      superscript.plugins({
        keybindings: { toggleSuperscript: 'Mod-Shift-s' }
      }),
      // frontMatter.plugins(),
      floatingMenu.plugins({
        key: menuKey,
      }),
    ],
  });

  useEffect(() => {
    function getTextFromFile() {
      const activeItemsSorted = activeItems.sort((a,b) => a.localeCompare(b))
      const promises = activeItemsSorted.map(path => {
        return new Promise((resolve, reject) => {
          fs.readFile(path, 'utf8', (err, data) => {
            if (err) reject(err);
            else resolve({ path: path, contents: data });
          });
        });
      });
    
      return Promise.all(promises).then(fileContents => {
        const text = fileContents.map(fc => fc.contents).join('\n--##--\n');
        console.log(typeof(text))
        return text;
      });
    }

    getTextFromFile().then(text => {
      if (editorRef.current) {
        const view = editorRef.current.view;
        view.dispatch(view.state.tr.replaceWith(0, view.state.doc.content.size, 
        view.state.schema.text(text + " ")));
      }
    }).catch(error => {
      console.error(error);
    });
  }, [activeItems]);

  return (
  <>
    <StaticMenu
        editor={editor}
        // We have a render prop to allow for updating
        // menu whenever editors state changes
        renderMenu={() => (
          <Menu
            style={{
              backgroundColor: 'lightgrey',
              color:
                document.documentElement.getAttribute('data-theme') === 'dark'
                  ? 'white'
                  : 'black',
            }}
          >
            <MenuGroup>
              <UndoButton />
              <RedoButton />
            </MenuGroup>
            <MenuGroup>
              <BoldButton />
              <ItalicButton />
            </MenuGroup>
            <MenuGroup>
              <ParagraphButton />
              <HeadingButton level={1} />
              <HeadingButton level={2} />
            </MenuGroup>
            <BulletListButton />
            <OrderedListButton />
            <TodoListButton />
          </Menu>
        )}
    />
      <BangleEditor
        ref={editorRef}
        state={editorState}
        onReady={setEditor}
        style={{ margin: "10px 20px 0 20px", backgroundColor: "white" }}
        // renderNodeViews={({ node, updateAttrs, children }) => {
        //   if (node.type.name === 'frontMatter') {
        //     return (
        //       <FrontMatter node={node} updateAttrs={updateAttrs}>
        //         {children}
        //       </FrontMatter>
        //     );
        //   }
        // }}
      >
        <FloatingMenu menuKey={menuKey} />
      </BangleEditor>
  </>
  );
}


export default Editor;
