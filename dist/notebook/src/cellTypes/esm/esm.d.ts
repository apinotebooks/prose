import { BaseCellHandler } from "../base";
import { Cell } from "../../types";
import { Runtime, CellHandlerAttachParameters } from "../../runtime";
export declare const ES_MODULE_CELL_TYPE_DEFINITION: {
    name: string;
    cellType: string;
    createHandler: (c: Cell, r: Runtime) => ESModuleCellHandler;
};
export declare class ESModuleCellHandler extends BaseCellHandler {
    private elements;
    private editor;
    private isCurrentlyRunning;
    private lastRunId;
    private outputElement?;
    constructor(cell: Cell, runtime: Runtime);
    private getControls;
    attach(params: CellHandlerAttachParameters): void;
    run(): Promise<void>;
    focusEditor(): void;
    dispose(): Promise<void>;
}
