/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { html, render } from "lit-html";
import { BaseCellHandler } from "./base";
import { cellControlsTemplate } from "../components/controls";
import { unsafeHTML } from "lit-html/directives/unsafe-html";
import { PlayCircleIcon } from "@spectrum-web-components/icons-workflow";
import { StarboardTextEditor } from "../components/textEditor";
export const HTML_CELL_TYPE_DEFINITION = {
    name: "HTML",
    cellType: "html",
    createHandler: (c, r) => new HTMLCellHandler(c, r),
};
export class HTMLCellHandler extends BaseCellHandler {
    constructor(cell, runtime) {
        super(cell, runtime);
    }
    getControls() {
        const icon = PlayCircleIcon;
        const tooltip = "Run Cell";
        const runButton = {
            icon,
            tooltip,
            callback: () => this.runtime.controls.emit({ id: this.cell.id, type: "RUN_CELL" }),
        };
        return cellControlsTemplate({ buttons: [runButton] });
    }
    attach(params) {
        this.elements = params.elements;
        render(this.getControls(), this.elements.topControlsElement);
        this.editor = new StarboardTextEditor(this.cell, this.runtime, { language: "html" });
        this.elements.topElement.appendChild(this.editor);
    }
    async run() {
        const htmlContent = this.cell.textContent;
        render(html `${unsafeHTML(htmlContent)}`, this.elements.bottomElement);
    }
    focusEditor() {
        if (this.editor) {
            this.editor.focus();
        }
    }
    async dispose() {
        if (this.editor) {
            this.editor.dispose();
        }
    }
}
//# sourceMappingURL=html.js.map