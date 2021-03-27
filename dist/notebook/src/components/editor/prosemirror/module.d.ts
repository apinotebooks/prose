import { EditorView } from "prosemirror-view";
import { EditorState, Plugin } from "prosemirror-state";
export interface ContentContainer {
    textContent: string;
}
declare const defaultMarkdownSerializer: import("./extensions/markdown/serializer").MarkdownSerializer;
export { EditorView, EditorState, Plugin, defaultMarkdownSerializer };
export declare function createEditorState(opts: {
    content: ContentContainer;
}): EditorState<any>;
