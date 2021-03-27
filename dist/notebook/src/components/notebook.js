/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, customElement, query, property } from 'lit-element';
import { CellElement } from './cell';
import { createCellProxy } from './helpers/cellProxy';
import { AssetsAddedIcon } from '@spectrum-web-components/icons-workflow';
import { insertHTMLChildAtIndex } from './helpers/dom';
import { setupRuntime } from '../runtime/create';
let StarboardNotebookElement = class StarboardNotebookElement extends LitElement {
    constructor() {
        super(...arguments);
        this.hasHadInitialRun = false;
    }
    createRenderRoot() {
        return this;
    }
    connectedCallback() {
        super.connectedCallback();
        this.runtime = setupRuntime(this);
        // Not to be relied upon, for debugging purposes during development.
        // This global may be deleted at any time.
        window.viewNotebookSource = () => {
            const content = this.runtime.exports.core.notebookContentToText(this.runtime.content);
            const encoded = encodeURIComponent(content);
            const a = document.createElement(`a`);
            a.target = `_blank`;
            a.href = `data:plaintext;charset=utf-8,${encoded}`;
            a.style.display = `none`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
    }
    async notebookInitialize() {
        await this.updateComplete;
        if (!this.hasHadInitialRun) {
            this.runtime.controls.runAllCells({ onlyRunOnLoad: true });
            this.hasHadInitialRun = true;
        }
    }
    firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);
        if (this.runtime.content.cells.length > 0) {
            this.notebookInitialize();
        }
    }
    performUpdate() {
        super.performUpdate();
        // We manually manage the cell elements, lit-html doesn't do a good job here
        // (or put differently: a too good job, it reuses components which is problematic)
        const content = this.runtime.content;
        const desiredCellIds = new Set(content.cells.map((c) => c.id));
        const mounted = this.cellsParentElement.children;
        for (let i = 0; i < mounted.length; i++) {
            const child = mounted[i];
            if (!desiredCellIds.has(child.cell.id)) {
                child.remove();
            }
        }
        this.runtime.dom.cells = this.runtime.dom.cells.filter((c) => desiredCellIds.has(c.cell.id) && !!this.querySelector("#" + c.cell.id));
        for (let i = 0; i < content.cells.length; i++) {
            const cell = content.cells[i];
            if (this.runtime.dom.cells.length > i && cell.id === this.runtime.dom.cells[i].cell.id) {
                // The cell is already present
                continue;
            }
            const cellProxy = createCellProxy(cell, () => {
                const changeListeners = this.runtime.internal.listeners.cellContentChanges.get(cell.id);
                if (changeListeners) {
                    changeListeners.forEach(v => v());
                }
                this.runtime.controls.contentChanged();
            });
            // We need to insert a cell here
            const newCellElement = new CellElement(cellProxy, this.runtime);
            this.runtime.dom.cells.splice(i, 0, newCellElement);
            insertHTMLChildAtIndex(this.cellsParentElement, newCellElement, i);
        }
    }
    render() {
        return html `
      <main class="cells-container"></main>
      
      <footer class="starboard-notebook-footer">
        <div></div>
        <div></div>
        <div>         
          <button @click="${() => this.runtime.controls.insertCell("end")}" class="cell-controls-button" title="Add Cell Here" style="opacity: 0.5 !important; float: right; opacity: 1; padding: 0px 3px 0px 18px;">
          ${AssetsAddedIcon({ width: 18, height: 18 })}
        </button>
        </div>
      </footer>
        `;
    }
};
__decorate([
    property({ type: Object })
], StarboardNotebookElement.prototype, "config", void 0);
__decorate([
    query(".cells-container")
], StarboardNotebookElement.prototype, "cellsParentElement", void 0);
StarboardNotebookElement = __decorate([
    customElement('starboard-notebook')
], StarboardNotebookElement);
export { StarboardNotebookElement };
//# sourceMappingURL=notebook.js.map