import { BaseCellHandler } from "./base";
import { Cell } from "../types";
import { Runtime, CellHandlerAttachParameters } from "../runtime";
export declare const LATEX_CELL_TYPE_DEFINITION: {
    name: string;
    cellType: string[];
    createHandler: (c: Cell, r: Runtime) => LatexCellHandler;
};
export declare class LatexCellHandler extends BaseCellHandler {
    private isInEditMode;
    private elements;
    private editor;
    constructor(cell: Cell, runtime: Runtime);
    private getControls;
    attach(params: CellHandlerAttachParameters): void;
    private setupEditor;
    enterEditMode(): void;
    run(): Promise<void>;
    dispose(): Promise<void>;
    focusEditor(): void;
}
