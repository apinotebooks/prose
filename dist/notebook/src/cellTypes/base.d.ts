import { Cell } from "../types";
import { Runtime, CellHandlerAttachParameters, CellHandler } from "../runtime";
export declare abstract class BaseCellHandler implements CellHandler {
    cell: Cell;
    runtime: Runtime;
    constructor(cell: Cell, runtime: Runtime);
    abstract attach(param: CellHandlerAttachParameters): void;
    run(): Promise<any>;
    dispose(): Promise<void>;
    focusEditor(): void;
}
