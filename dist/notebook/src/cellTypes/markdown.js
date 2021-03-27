/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { render } from "lit-html";
import mdlib from "markdown-it";
import { BaseCellHandler } from "./base";
import { cellControlsTemplate } from "../components/controls";
import { TextEditIcon, CodeIcon } from "@spectrum-web-components/icons-workflow";
import { StarboardTextEditor } from "../components/textEditor";
import { promiseState } from "./javascript/util";
import { hookMarkdownItToPrismHighlighter } from "../components/helpers/highlight";
import { hookMarkdownItToEmojiPlugin } from "../components/helpers/emoji";
import { hookMarkdownItToKaTeX } from "../components/helpers/katex";
import { StarboardContentEditor } from "../components/editor/contentEditor";
import { hasParentWithId } from "../components/helpers/dom";
const md = new mdlib({ html: true });
hookMarkdownItToPrismHighlighter(md);
hookMarkdownItToEmojiPlugin(md);
const katexHookPromise = hookMarkdownItToKaTeX(md);
async function isKatexAlreadyLoaded() {
    return (await promiseState(katexHookPromise)) === "fulfilled";
}
const DEFAULT_EDIT_MODE = "wysiwyg";
export const MARKDOWN_CELL_TYPE_DEFINITION = {
    name: "Markdown",
    cellType: ["markdown", "md"],
    createHandler: (c, r) => new MarkdownCellHandler(c, r),
};
export class MarkdownCellHandler extends BaseCellHandler {
    constructor(cell, runtime) {
        super(cell, runtime);
        this.editMode = "display";
    }
    getControls() {
        let editOrRunButton;
        // Alternative to exit edit mode.. Do we need this?
        // const doneButton = {
        //     icon: PlayCircleIcon,
        //     tooltip: "Stop Editing",
        //     callback: () => this.runtime.controls.emit({id: this.cell.id, type: "RUN_CELL"}),
        // };
        if (this.editMode === "code") {
            editOrRunButton = {
                icon: TextEditIcon,
                tooltip: "Edit as rich text",
                callback: () => this.enterEditMode("wysiwyg"),
            };
        }
        else if (this.editMode === "wysiwyg") {
            editOrRunButton = {
                icon: CodeIcon,
                tooltip: "Edit markdown source directly",
                callback: () => this.enterEditMode("code"),
            };
        }
        else {
            editOrRunButton = {
                icon: TextEditIcon,
                tooltip: "Edit Markdown",
                callback: () => this.enterEditMode("wysiwyg"),
            };
        }
        return cellControlsTemplate({ buttons: [editOrRunButton] });
    }
    attach(params) {
        this.elements = params.elements;
        // Initial render
        this.run();
        const topElement = this.elements.topElement;
        topElement.addEventListener("dblclick", (_event) => {
            if (this.editMode === "display") {
                this.enterEditMode(DEFAULT_EDIT_MODE);
            }
        });
        // The cell itself loses focus to somewhere outside of the cell, in that case we just render Markdown itself again.
        topElement.parentElement.addEventListener("focusout", (event) => {
            if (this.editMode !== "display" && (!event.relatedTarget || !hasParentWithId(event.relatedTarget, this.cell.id))) {
                console.log("Exiting edit mode");
                this.run();
            }
        });
        if (this.cell.textContent === "") {
            this.enterEditMode(DEFAULT_EDIT_MODE);
        }
    }
    setupEditor() {
        const topElement = this.elements.topElement;
        topElement.innerHTML = "";
        if (this.editMode === "code") {
            this.editor = new StarboardTextEditor(this.cell, this.runtime, { language: "markdown", wordWrap: "on" });
        }
        else {
            this.editor = new StarboardContentEditor(this.cell, { focusAfterInit: true });
        }
        topElement.appendChild(this.editor);
    }
    enterEditMode(mode) {
        if (this.editor) {
            this.editor.dispose();
        }
        this.editMode = mode;
        this.setupEditor();
        render(this.getControls(), this.elements.topControlsElement);
    }
    async run() {
        this.editMode = "display";
        const topElement = this.elements.topElement;
        if (this.editor !== undefined) {
            this.editor.dispose();
            delete this.editor;
        }
        topElement.innerHTML = "";
        const outDiv = document.createElement("div");
        outDiv.classList.add("markdown-body");
        outDiv.innerHTML = md.render(this.cell.textContent);
        // Re-render when katex becomes available
        if (!await isKatexAlreadyLoaded()) {
            // Possible improvement: we could detect if any latex is present before we load katex
            katexHookPromise.then(() => outDiv.innerHTML = md.render(this.cell.textContent));
        }
        topElement.appendChild(outDiv);
        render(this.getControls(), this.elements.topControlsElement);
    }
    async dispose() {
        if (this.editor) {
            this.editor.dispose();
        }
    }
    focusEditor() {
        this.enterEditMode(DEFAULT_EDIT_MODE);
        if (this.editor) {
            this.editor.focus();
        }
    }
}
//# sourceMappingURL=markdown.js.map