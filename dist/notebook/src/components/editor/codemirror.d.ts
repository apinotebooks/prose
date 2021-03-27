import { EditorView } from "@codemirror/next/view";
import { Cell } from "../../types";
import { Runtime } from "../../runtime";
export declare function createCodeMirrorEditor(element: HTMLElement, cell: Cell, opts: {
    language?: string;
    wordWrap?: "off" | "on" | "wordWrapColumn" | "bounded";
}, _runtime: Runtime): EditorView;
