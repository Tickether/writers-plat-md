import { keymap } from "@bangle.dev/pm";
import { safeInsert } from '@bangle.dev/utils';
import { domSerializationHelpers, NodeView } from "@bangle.dev/core";

export const frontMatter = {
    spec() {
      const name = 'frontMatter';
      const { toDOM, parseDOM } = domSerializationHelpers(name, {
        tag: 'div',
        content: 0
      });
      return {
        type: 'node',
        name: 'frontMatter',
        schema: {
          content: 'inline*',
          group: 'block',
          draggable: false,
          toDOM,
          parseDOM,
        }
      }
    },
    plugins() {
      return[
        keymap({
          'Mod-Shift-m': createFrontMatterNode(),
        }),
        NodeView.createPlugin({
          name: 'frontMatter',
          containerDOM: ['div', { class: 'front-matter-container' }],
          contentDOM: ['span', { class: 'front-matter-content' }]
        })
      ]
    }
  };
  
  export function createFrontMatterNode(text = ' ') {
    return (state, dispatch)=> {
      const type = state.schema.nodes.frontMatter;
      const node = type.createChecked(undefined, state.schema.text(text));
      const newTr = safeInsert(node, state.selection.from)(state.tr);
      if (dispatch) {
        dispatch(newTr);
      }
      return true;
    }
  };

  export function FrontMatter({ node, children }) {
    return (
      <div>
        ---
        {children}
        ---
      </div>
    )
  }