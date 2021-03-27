/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, property, customElement, query } from 'lit-element';
import { toggleCellFlagProperty } from '../content/notebookContent';
import { getCellTypeDefinitionForCellType, getAvailableCellTypes } from '../cellTypes/registry';
import { AssetsAddedIcon, DeleteIcon, BooleanIcon, ClockIcon, PlayCircleIcon } from "@spectrum-web-components/icons-workflow";
import { getPropertiesIcons, getPropertiesPopoverIcons } from './controls';
import Dropdown from "bootstrap/js/dist/dropdown";
let CellElement = class CellElement extends LitElement {
    constructor(cell, runtime) {
        super();
        this.isCurrentlyRunning = false;
        this.cell = cell;
        this.id = this.cell.id;
        this.runtime = runtime;
        this.setAttribute("tabindex", "0");
    }
    createRenderRoot() {
        return this;
    }
    connectedCallback() {
        super.connectedCallback();
        this.cellTypeDefinition = getCellTypeDefinitionForCellType(this.cell.cellType);
        this.cellHandler = this.cellTypeDefinition.createHandler(this.cell, this.runtime);
    }
    firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);
        this.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                if (event.ctrlKey) {
                    this.runtime.controls.emit({ id: this.cell.id, type: "RUN_CELL", focusNextCell: false, insertNewCell: false });
                }
                else if (event.shiftKey) {
                    this.runtime.controls.emit({ id: this.cell.id, type: "RUN_CELL", focusNextCell: true, insertNewCell: false });
                }
                else if (event.altKey) {
                    this.runtime.controls.emit({ id: this.cell.id, type: "RUN_CELL", focusNextCell: true, insertNewCell: true });
                }
            }
        });
        [].slice.call(document.querySelectorAll('.dropdown-toggle')).map(e => new Dropdown(e));
        this.cellHandler.attach({
            elements: {
                topElement: this.topElement,
                topControlsElement: this.topControlsElement,
                bottomElement: this.bottomElement,
                bottomControlsElement: this.bottomControlsElement
            },
        });
    }
    async run() {
        this.isCurrentlyRunning = true;
        this.performUpdate();
        await this.cellHandler.run();
        this.isCurrentlyRunning = false;
        this.performUpdate();
    }
    focusEditor() {
        this.focus();
        this.cellHandler.focusEditor();
    }
    changeCellType(newCellType) {
        // If these are multiple cell types, take the first one
        const newCellTypeIdentifier = typeof newCellType === "string" ? newCellType : newCellType[0];
        this.runtime.controls.emit({
            id: this.cell.id, type: "CHANGE_CELL_TYPE", newCellType: newCellTypeIdentifier,
        });
    }
    toggleProperty(name) {
        toggleCellFlagProperty(this.cell, name);
        this.performUpdate();
    }
    render() {
        const id = this.cell.id;
        const emit = this.runtime.controls.emit;
        return html `
        <section class="cell-container celltype-${this.cell.cellType}${this.cell.metadata.properties.collapsed ? " collapsed" : ""}">

            <!-- Gutter (left side outside the document) -->
            <div class="cell-gutter cell-gutter-left-above">
                <button @click=${() => this.toggleProperty("collapsed")} class="cell-gutter-button" title=${this.cell.metadata.properties.collapsed ? "Maximize cell" : "Minimize cell"}></button>
            </div>
            <div class="cell-gutter cell-gutter-left-top">
                <button class="cell-gutter-button" title="This gutter button doesn't do anything yet.."></button>
            </div>
            <div class="cell-gutter cell-gutter-left-bottom">
                <button class="cell-gutter-button" title="This gutter button doesn't do anything yet.."></button>
            </div>


            <!-- Top left corner, used to display a run button if cell is collapsed -->
            <div class="cell-controls cell-controls-left-above">
                ${this.isCurrentlyRunning
            ? html `
                    <button @mousedown=${() => emit({ id, type: "RUN_CELL" })}  class="cell-controls-button display-when-collapsed" title="Cell is running">
                        ${ClockIcon({ width: 20, height: 20 })}
                </button>`
            : html `
                    <button @mousedown=${() => emit({ id, type: "RUN_CELL" })} class="cell-controls-button display-when-collapsed" title="Run cell">
                        ${PlayCircleIcon({ width: 20, height: 20 })}
                </button>`}
            </div>

            <!-- Top bar of the cell -->
            <div class="cell-controls cell-controls-above">

                <!-- Properties section -->
                ${getPropertiesIcons(this.cell, (propertyName) => this.toggleProperty(propertyName))}
                <div style="margin-right: auto"></div>

                <div class="collapsed-cell-line" title="Click to reveal collapsed cell temporarily"></div>
                
                <div class="dropdown">
                    <button data-bs-toggle="dropdown" title="Change Cell Type" class="cell-controls-button cell-controls-button-language auto-hide" @click=${ /*(evt: Event) => this.togglePopover(evt.target as HTMLElement, this.typePickerElement)*/() => 0}>${this.cellTypeDefinition.name}</button>
                    <div class="dropdown-menu" style="min-width: 244px">
                        <li><h6 class="dropdown-header">Change Cell Type</h6></li>
                        ${getAvailableCellTypes().map((ct) => {
            const ctString = typeof ct.cellType === "string" ? ct.cellType : ct.cellType[0];
            return html `
                            <li>
                                <button title=${ctString} class="dropdown-item${ctString === this.cell.cellType ? " active" : ""}" @click=${() => this.changeCellType(ct.cellType)}>
                                    ${ct.name}<span style="opacity: 0.6; float: right; font-size: 11px; font-family: var(--font-mono)">${ctString}</span>
                                </button>
                            </li>
                        `;
        })}
                    </div>
                </div>

                <!-- Properties change button -->
                <div class="dropdown">
                    <button data-bs-toggle="dropdown" class="cell-controls-button auto-hide" title="Change Cell Properties">
                        ${BooleanIcon({ width: 18, height: 18 })}
                    </button>

                    <div class="dropdown-menu" style="min-width: 244px">
                        <li><h6 class="dropdown-header">Toggle Cell properties</h6></li>
                        ${getPropertiesPopoverIcons(this.cell, (propertyName) => this.toggleProperty(propertyName))}
                    </div>
                </div>

                <button @click="${() => emit({ id, type: "REMOVE_CELL" })}" class="cell-controls-button auto-hide" title="Remove Cell">
                    ${DeleteIcon({ width: 18, height: 18 })}
                </button>
                <button @click="${() => emit({ id, type: "INSERT_CELL", position: "before" })}" class="cell-controls-button auto-hide" title="Add Cell Above">
                    ${AssetsAddedIcon({ width: 18, height: 18 })}
                </button>

            </div>

            <div class="cell-controls cell-controls-left cell-controls-left-top"></div>
            <div class="cell-top"></div>
            <div class="cell-controls cell-controls-left cell-controls-left-bottom"></div>
            <div class="cell-bottom"></div>
        </section>
    `;
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.cellHandler.dispose();
    }
};
__decorate([
    query('.cell-top')
], CellElement.prototype, "topElement", void 0);
__decorate([
    query('.cell-controls-left-top')
], CellElement.prototype, "topControlsElement", void 0);
__decorate([
    query('.cell-bottom')
], CellElement.prototype, "bottomElement", void 0);
__decorate([
    query('.cell-controls-left-bottom')
], CellElement.prototype, "bottomControlsElement", void 0);
__decorate([
    property({ type: Object })
], CellElement.prototype, "cell", void 0);
__decorate([
    property({ attribute: false })
], CellElement.prototype, "runtime", void 0);
CellElement = __decorate([
    customElement('starboard-cell')
], CellElement);
export { CellElement };
//# sourceMappingURL=cell.js.map