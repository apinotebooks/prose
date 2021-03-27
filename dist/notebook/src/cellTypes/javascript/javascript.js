/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { html, render } from "lit-html";
import { BaseCellHandler } from "../base";
import { cellControlsTemplate } from "../../components/controls";
import { JavascriptEvaluator } from "./eval";
import { PlayCircleIcon, ClockIcon } from "@spectrum-web-components/icons-workflow";
import { ConsoleOutputElement } from "../../components/output/consoleOutput";
import { StarboardTextEditor } from '../../components/textEditor';
import { renderIfHtmlOutput } from "../../components/output/htmlOutput";
export const JAVASCRIPT_CELL_TYPE_DEFINITION = {
    name: "Javascript",
    cellType: ["javascript", "js"],
    createHandler: (c, r) => new JavascriptCellHandler(c, r),
};
export class JavascriptCellHandler extends BaseCellHandler {
    constructor(cell, runtime) {
        super(cell, runtime);
        this.isCurrentlyRunning = false;
        this.lastRunId = 0;
        this.jsRunner = new JavascriptEvaluator();
    }
    getControls() {
        const icon = this.isCurrentlyRunning ? ClockIcon : PlayCircleIcon;
        const tooltip = this.isCurrentlyRunning ? "Run Cell" : "Cell is running";
        const runButton = {
            icon,
            tooltip,
            callback: () => this.runtime.controls.emit({ id: this.cell.id, type: "RUN_CELL" }),
        };
        return cellControlsTemplate({ buttons: [runButton] });
    }
    attach(params) {
        this.elements = params.elements;
        const topElement = this.elements.topElement;
        render(this.getControls(), this.elements.topControlsElement);
        this.editor = new StarboardTextEditor(this.cell, this.runtime, { language: "javascript" });
        topElement.appendChild(this.editor);
    }
    async run() {
        this.lastRunId++;
        const currentRunId = this.lastRunId;
        this.isCurrentlyRunning = true;
        render(this.getControls(), this.elements.topControlsElement);
        this.outputElement = new ConsoleOutputElement();
        this.outputElement.hook(this.runtime.consoleCatcher);
        const htmlOutput = document.createElement("div");
        htmlOutput.classList.add("cell-output-html");
        render(html `${this.outputElement}${htmlOutput}`, this.elements.bottomElement);
        const outVal = await this.jsRunner.run(this.cell.textContent);
        // Not entirely sure this is necessary anymore, but we had to wait one tick with unhooking
        // as some console messages are delayed by one tick it seems.
        await this.outputElement.unhookAfterOneTick(this.runtime.consoleCatcher);
        const val = outVal.value;
        const htmlOutputRendered = renderIfHtmlOutput(val, htmlOutput);
        if (!htmlOutputRendered && val !== undefined) { // Don't show undefined output
            if (outVal.error) {
                console.error(val); // NOTE: perhaps problematic for async code, don't want to loop this!
                if (val.stack !== undefined) {
                    let stackToPrint = val.stack;
                    const errMsg = val.toString();
                    if (stackToPrint.startsWith(errMsg)) { // Prevent duplicate error msg in Chrome
                        stackToPrint = stackToPrint.substr(errMsg.length);
                    }
                    this.outputElement.addEntry({
                        method: "error",
                        data: [errMsg, stackToPrint]
                    });
                }
                else {
                    this.outputElement.addEntry({
                        method: "error",
                        data: [val]
                    });
                }
            }
            else {
                this.outputElement.addEntry({
                    method: "result",
                    data: [val]
                });
            }
        }
        if (this.lastRunId === currentRunId) {
            this.isCurrentlyRunning = false;
            render(this.getControls(), this.elements.topControlsElement);
        }
    }
    focusEditor() {
        this.editor.focus();
    }
    async dispose() {
        this.editor.remove();
    }
}
//# sourceMappingURL=javascript.js.map