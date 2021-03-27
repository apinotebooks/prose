import { InputRule } from "prosemirror-inputrules";
import { NodeType, Schema } from "prosemirror-model";
export declare function inlineInputRule(pattern: RegExp, nodeType: NodeType, getAttrs?: (match: string[]) => any): InputRule<any>;
export declare function blockInputRule(pattern: RegExp, nodeType: NodeType, getAttrs?: (match: string[]) => any): InputRule<any>;
export declare function buildMathInputRules(schema: Schema): import("prosemirror-state").Plugin<unknown, any>;
