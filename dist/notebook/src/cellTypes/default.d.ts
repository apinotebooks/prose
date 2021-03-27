import { BaseCellHandler } from "./base";
import { Cell } from "../types";
import { Runtime, CellHandlerAttachParameters } from "../runtime";
export declare const DEFAULT_CELL_TYPE_DEFINITION: {
    name: string;
    cellType: string;
    createHandler: (c: Cell, r: Runtime) => DefaultCellHandler;
};
/**
 * The cell handler that gets used when there is an unknown cell type
 */
export declare class DefaultCellHandler extends BaseCellHandler {
    constructor(cell: Cell, runtime: Runtime);
    attach(params: CellHandlerAttachParameters): void;
}
