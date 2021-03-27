/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement, LitElement, property } from "lit-element";
import { TextSelection } from "prosemirror-state";
const prosemirrorPromise = import(/* webpackChunkName: "prosemirror", webpackPrefetch: true */ "./prosemirror/module");
let prosemirrorModule;
prosemirrorPromise.then(pm => prosemirrorModule = pm);
/**
 * The main WYSIWYM (what you see is what you mean) content editor for Markdown content in Starboard.
 */
let StarboardContentEditor = class StarboardContentEditor extends LitElement {
    constructor(content = { textContent: "" }, opts = {}) {
        super();
        this.content = content;
        prosemirrorPromise.then(pm => {
            this.view = new pm.EditorView(this, {
                state: pm.createEditorState({ content: this.content }),
            });
            if (opts.focusAfterInit) {
                // TODO: why is the timeout necessary here? Can we do without?
                setTimeout((_) => this.focus());
            }
        });
    }
    createRenderRoot() {
        return this;
    }
    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && this.view && this.view.hasFocus()) {
                if (event.ctrlKey) {
                    event.stopPropagation();
                    return true;
                }
                else if (event.shiftKey) {
                    event.stopPropagation();
                    return true;
                }
            }
        });
        prosemirrorPromise.then(pm => {
            if (this.view) {
                this.view.updateState(pm.createEditorState({ content: this.content }));
                this.querySelector(".ProseMirror").classList.add("markdown-body");
            }
            else {
                console.warn("ProseMirror plugin: view is undefined in connected callback");
            }
        });
    }
    getContentAsMarkdownString() {
        // If the prosemirror module hasn't been loaded yet we just take it from the cell's content itself as it cant' be stale
        if (prosemirrorModule && this.view) {
            return prosemirrorModule.defaultMarkdownSerializer.serialize(this.view.state.doc);
        }
        return this.content.textContent;
    }
    focus() {
        if (this.view) {
            this.view.dispatch(this.view.state.tr.setSelection(TextSelection.atStart(this.view.state.doc)));
            this.view.focus();
        }
    }
    dispose() {
        if (this.view)
            this.view.destroy();
    }
};
__decorate([
    property({ type: Object })
], StarboardContentEditor.prototype, "content", void 0);
StarboardContentEditor = __decorate([
    customElement('starboard-content-editor')
], StarboardContentEditor);
export { StarboardContentEditor };
//# sourceMappingURL=contentEditor.js.map