import { LitElement } from "lit-element";
import type { EditorView } from "prosemirror-view";
/**
 * Note: Cell implements this interface.
 */
export interface ContentContainer {
    textContent: string;
}
/**
 * The main WYSIWYM (what you see is what you mean) content editor for Markdown content in Starboard.
 */
export declare class StarboardContentEditor extends LitElement {
    view?: EditorView<any>;
    content: ContentContainer;
    createRenderRoot(): this;
    constructor(content?: ContentContainer, opts?: {
        focusAfterInit?: boolean;
    });
    connectedCallback(): void;
    getContentAsMarkdownString(): any;
    focus(): void;
    dispose(): void;
}
