/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/
// ProseMirror imports
import { NodeSelection } from "prosemirror-state";
// project imports
import mathSelectPlugin from "./plugins/select";
import { buildMathInputRules } from "./plugins/inputrules";
import { mathPlugin, createMathView } from "./plugin";
export function buildMathPlugins(schema) {
    return [
        mathPlugin,
        mathSelectPlugin,
        buildMathInputRules(schema),
    ];
}
export { createMathView };
export function insertMath(schema) {
    const mathType = schema.nodes.inlinemath;
    return function (state, dispatch) {
        const { $from } = state.selection, index = $from.index();
        if (!$from.parent.canReplaceWith(index, index, mathType)) {
            return false;
        }
        if (dispatch) {
            let tr = state.tr.replaceSelectionWith(mathType.create({}));
            tr = tr.setSelection(NodeSelection.create(tr.doc, $from.pos));
            dispatch(tr);
        }
        return true;
    };
}
//# sourceMappingURL=index.js.map