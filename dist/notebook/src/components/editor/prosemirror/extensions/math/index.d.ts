import { EditorState, Transaction, Plugin } from "prosemirror-state";
import { createMathView } from "./plugin";
import { Schema } from "prosemirror-model";
export declare function buildMathPlugins(schema: Schema): Plugin<any, any>[];
export { createMathView };
export declare function insertMath(schema: Schema): (state: EditorState, dispatch: ((tr: Transaction) => void) | undefined) => boolean;
