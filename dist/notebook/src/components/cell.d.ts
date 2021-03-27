import { LitElement } from 'lit-element';
import { BaseCellHandler } from '../cellTypes/base';
import { Cell } from '../types';
import { Runtime, CellTypeDefinition } from '../runtime';
export declare class CellElement extends LitElement {
    private topElement;
    private topControlsElement;
    private bottomElement;
    private bottomControlsElement;
    cellTypeDefinition: CellTypeDefinition;
    cellHandler: BaseCellHandler;
    cell: Cell;
    private isCurrentlyRunning;
    runtime: Runtime;
    constructor(cell: Cell, runtime: Runtime);
    createRenderRoot(): this;
    connectedCallback(): void;
    firstUpdated(changedProperties: any): void;
    run(): Promise<void>;
    focusEditor(): void;
    changeCellType(newCellType: string | string[]): void;
    private toggleProperty;
    render(): import("lit-element").TemplateResult;
    disconnectedCallback(): void;
}
