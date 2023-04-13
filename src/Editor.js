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
  paragraph,
  blockquote
} from "@bangle.dev/base-components";
import { subscript, superscript } from "@bangle.dev/text-formatting";
import { useState } from "react";

const menuKey = new PluginKey("menuKey");

export function Editor() {
  const [ editor, setEditor ] = useState();
  const editorState = useEditorState({
    initialValue: 'Hello, World!',
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
      paragraph.spec(),
      blockquote.spec(),
      subscript.spec(),
      superscript.spec(),
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
      paragraph.plugins(),
      blockquote.plugins(),
      subscript.plugins({
        keybindings: { toggleSubscript: 'Mod-Shift-d' }
      }),
      superscript.plugins({
        keybindings: { toggleSuperscript: 'Mod-Shift-s' }
      }),
      floatingMenu.plugins({
        key: menuKey,
      }),
    ],
  });

  return (
  <>
    <StaticMenu
        editor={editor}
        // We have a render prop to allow for updating
        // menu whenever editors state changes
        renderMenu={() => (
          <Menu
            style={{
              backgroundColor: 'transparent',
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
      state={editorState}
      onReady={setEditor}
      style={{ margin: "10px 20px 0 20px", backgroundColor: "white" }}
    >
      <FloatingMenu menuKey={menuKey} />
    </BangleEditor>
  </>
  );
}
