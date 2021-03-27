/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { Plugin as ProsePlugin } from "prosemirror-state";
import { DecorationSet, Decoration } from "prosemirror-view";
/**
 * Uses the selection to determine which math_select decorations
 * should be applied to the given document.
 * @param arg Should be either a Transaction or an EditorState,
 *     although any object with `selection` and `doc` will work.
 */
const checkSelection = (arg) => {
    const { from, } = arg.selection;
    const content = arg.selection.content().content;
    const result = [];
    content.descendants((node, pos, _parent) => {
        if (node.type.name == "text") {
            return false;
        }
        if (node.type.name.startsWith("math_")) {
            result.push({
                start: Math.max(from + pos - 1, 0),
                end: from + pos + node.nodeSize - 1
            });
            return false;
        }
        return true;
    });
    return DecorationSet.create(arg.doc, result.map(({ start, end }) => Decoration.node(start, end, { class: "math-select" })));
};
/**
 * Due to the internals of KaTeX, by default, selecting rendered
 * math will put a box around each individual character of a
 * math expression.  This plugin attempts to make math selections
 * slightly prettier by instead setting a background color on the node.
 *
 * (remember to use the included math.css!)
 *
 * @todo (6/13/20) math selection rectangles are not quite even with text
 */
const mathSelectPlugin = new ProsePlugin({
    state: {
        init(config, partialState) {
            return checkSelection(partialState);
        },
        apply(tr, oldState) {
            if (!tr.selection || !tr.selectionSet) {
                return oldState;
            }
            const sel = checkSelection(tr);
            return sel;
        }
    },
    props: {
        decorations: (state) => { return mathSelectPlugin.getState(state); },
    }
});
export default mathSelectPlugin;
//# sourceMappingURL=select.js.map