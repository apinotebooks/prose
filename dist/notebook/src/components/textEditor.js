/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * NOTE: TODO:
 * This file needs a complete refactor..
 */
import { customElement, LitElement, html, query } from "lit-element";
import mdlib from "markdown-it";
import { hookMarkdownItToPrismHighlighter } from "./helpers/highlight";
import { render } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html";
import { DeviceDesktopIcon, DevicePhoneIcon, SettingsIcon } from "@spectrum-web-components/icons-workflow";
import { copyToClipboard } from "./helpers/clipboard";
import { trySetLocalStorage } from "./helpers/localStorage";
import { isATouchScreenDevice } from "./helpers/detect";
import Dropdown from "bootstrap/js/dist/dropdown";
const EDITOR_PREFERENCE_KEY = "starboard_notebook_text_editor_preference";
// Global state shared between all editors
// Note: somewhat problematic for garbage collection if no editor is ever chosen..
let notifyOnEditorChosen = [];
/**
 * This promise is used to prevent two editor instances being loaded in the same frame.
 * This helps keep things responsive when loading huge notebooks.
 */
let globalLoadEditorLockPromise = Promise.resolve();
let codeMirrorModule;
let monacoModule;
let currentEditor;
try {
    // Use ternary condition to be robust to other invalid values
    currentEditor = localStorage[EDITOR_PREFERENCE_KEY] === undefined ? undefined : (localStorage[EDITOR_PREFERENCE_KEY] === "monaco" ? "monaco" : "codemirror");
}
catch (e) {
    console.warn("Could not read editor preference (localStorage is probably not available)");
}
const md = new mdlib();
hookMarkdownItToPrismHighlighter(md);
/**
 * StarboardTextEditor abstracts over different text editors that are loaded dynamically.
 * The user can choose: monaco for desktop devices, or a more minimal editor for mobile phones.
 *
 * TODO: this file needs a big cleanup..
 */
let StarboardTextEditor = class StarboardTextEditor extends LitElement {
    constructor(cell, runtime, opts = {}) {
        super();
        this.opts = {};
        this.runtime = runtime;
        this.cell = cell;
        this.opts = opts;
    }
    createRenderRoot() {
        return this;
    }
    connectedCallback() {
        super.connectedCallback();
    }
    handleDblClick() {
        if (currentEditor === undefined) {
            this.initEditor();
        }
    }
    firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);
        [].slice.call(document.querySelectorAll('.dropdown-toggle')).map(e => new Dropdown(e));
        if (currentEditor === "codemirror" || currentEditor === "monaco" || this.runtime.config.defaultTextEditor === "smart") {
            this.initEditor();
            // While it loads, render markdown
            const mdText = md.render("```" + `${this.opts.language}\n${this.cell.textContent}\n` + "```");
            render(html `<div class="cell-popover cell-select-editor-popover">Loading CodeMirror editor..</div>${unsafeHTML(mdText)}`, this.editorMountpoint);
        }
        else {
            this.editorMountpoint.addEventListener("dblclick", () => this.handleDblClick(), { once: true, passive: true });
            const mdText = md.render("```" + `${this.opts.language}\n${this.cell.textContent}\n` + "```");
            render(html `
            <div class="cell-popover cell-select-editor-popover">
                    <div style="display: flex; align-items: center;">
                        <b style="font-size: 1em; margin-right: 4px">Please select a text editor</b>
                        <button @click=${() => this.switchToMonacoEditor()} title="Monaco Editor (advanced, desktop only)" class="cell-popover-icon-button">${DeviceDesktopIcon({ width: 12, height: 12 })} Monaco</button>
                        <button @click=${() => this.switchToCodeMirrorEditor()} title="CodeMirror Editor (simpler, touchscreen friendly)" class="cell-popover-icon-button">${DevicePhoneIcon({ width: 12, height: 12 })} CodeMirror</button>
                    </div>
                    <span style="font-size: 0.85em"><b>Monaco</b> is more powerful, but is larger (4MB) and has poor touchscreen support.</span>
                </div>
            ${unsafeHTML(mdText)}
            `, this.editorMountpoint);
            notifyOnEditorChosen.push(() => this.initEditor());
        }
    }
    async initEditor() {
        // Note: this entire class really needs a refactor..
        if (currentEditor === "codemirror") {
            this.switchToCodeMirrorEditor();
        }
        else if (currentEditor === "monaco") {
            this.switchToMonacoEditor();
        }
        else {
            let newEditor;
            if (this.runtime.config.defaultTextEditor === "smart") {
                newEditor = isATouchScreenDevice() ? "codemirror" : "monaco";
            }
            else {
                newEditor = this.runtime.config.defaultTextEditor;
            }
            newEditor === "monaco" ? this.switchToMonacoEditor() : this.switchToCodeMirrorEditor();
        }
    }
    switchToCodeMirrorEditor() {
        if (currentEditor === "monaco" && this.editorInstance) {
            this.editorInstance.dispose();
        }
        currentEditor = "codemirror";
        trySetLocalStorage(EDITOR_PREFERENCE_KEY, "codemirror");
        if (!codeMirrorModule) {
            codeMirrorModule = import(/* webpackChunkName: "codemirror" */ "./editor/codemirror");
            document.querySelectorAll(".cell-select-editor-popover").forEach((e) => e.innerHTML = "<b>Loading CodeMirror editor..</b>");
            notifyOnEditorChosen.forEach((c) => c());
            notifyOnEditorChosen = [];
        }
        codeMirrorModule.then((m) => {
            globalLoadEditorLockPromise = globalLoadEditorLockPromise.then(() => {
                return new Promise(resolve => {
                    this.editorMountpoint.innerHTML = "";
                    this.editorInstance = m.createCodeMirrorEditor(this.editorMountpoint, this.cell, this.opts, this.runtime);
                    this.performUpdate();
                    setTimeout(() => resolve(), 0);
                });
            });
        });
    }
    switchToMonacoEditor() {
        const shouldCleanUpCodeMirror = currentEditor === "codemirror" && this.editorInstance;
        currentEditor = "monaco";
        trySetLocalStorage(EDITOR_PREFERENCE_KEY, "monaco");
        if (!monacoModule) {
            monacoModule = import(/* webpackChunkName: "monaco" */ "./editor/monaco");
            document.querySelectorAll(".cell-select-editor-popover").forEach((e) => e.innerHTML = "<b>Loading Monaco editor..</b>");
            notifyOnEditorChosen.forEach((c) => c());
            notifyOnEditorChosen = [];
        }
        monacoModule.then((m) => {
            globalLoadEditorLockPromise = globalLoadEditorLockPromise.then(() => {
                return new Promise(resolve => {
                    if (shouldCleanUpCodeMirror)
                        this.editorInstance.dom.remove();
                    this.editorMountpoint.innerHTML = "";
                    this.editorInstance = m.createMonacoEditor(this.editorMountpoint, this.cell, this.opts, this.runtime);
                    this.performUpdate();
                    setTimeout(() => resolve(), 0);
                });
            });
        });
    }
    copyCellText() {
        copyToClipboard(this.cell.textContent);
        const copyButton = this.querySelector("#copy-button");
        if (copyButton) {
            copyButton.innerText = "Copied!";
            setTimeout(() => copyButton.innerText = "Copy Text", 2000);
        }
    }
    render() {
        return html `     
        <div style="position: relative; width: 100%; height: 0">
            <div class="starboard-text-editor-controls">
                <div class="dropdown">
                    <button data-bs-toggle="dropdown" class="btn btn-small transparent p-1 px-1 me-1" style="color: #00000066" title="Editor Actions">${SettingsIcon({ width: 16, height: 16 })}</button>
                    <div class="dropdown-menu">
                        <li>
                        ${currentEditor === "monaco" ?
            html `<button class="dropdown-item" @click=${() => this.switchToCodeMirrorEditor()} title="Switch to CodeMirror based editor, simpler and smartphone friendly">Switch to Simple Editor</button>`
            : html `<button class="dropdown-item" @click=${() => this.switchToMonacoEditor()} title="Switch to Monaco based editor, a few MB in size, smartphone unfriendly">Switch to Advanced Editor</button>`}
                        </li>
                        <li><button class="dropdown-item" @click=${() => this.copyCellText()} title="Copy the text in this cell to clipboard">Copy Text</button></li>
                    </div>    
                </div>
                <!-- ${currentEditor === "monaco" ?
            html `<button @click=${() => this.switchToCodeMirrorEditor()} title="Switch to CodeMirror based editor, simpler and smartphone friendly">Switch to Simple Editor</button>`
            : html `<button @click=${() => this.switchToMonacoEditor()} title="Switch to Monaco based editor, a few MB in size, smartphone unfriendly">Switch to Advanced Editor</button>`}
                <button id="copy-button" @click=${() => this.copyCellText()} title="Copy the text in this cell to clipboard">Copy Text</button> -->
            </div>
        </div>       
        <div class="starboard-text-editor"></div>
        `;
    }
    focus() {
        if (this.editorInstance) {
            this.editorInstance.focus();
        }
    }
    dispose() {
        this.remove();
    }
};
__decorate([
    query(".starboard-text-editor")
], StarboardTextEditor.prototype, "editorMountpoint", void 0);
StarboardTextEditor = __decorate([
    customElement('starboard-text-editor')
], StarboardTextEditor);
export { StarboardTextEditor };
//# sourceMappingURL=textEditor.js.map