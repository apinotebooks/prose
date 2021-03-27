import { Cell, NotebookContent } from '../types';
import { Runtime } from '../runtime';
export declare function addCellToNotebookContent(runtime: Runtime, nb: NotebookContent, position: "end" | "before" | "after", adjacentCellId?: string, id?: string): void;
export declare function removeCellFromNotebookById(nb: NotebookContent, id: string): void;
export declare function changeCellType(nb: NotebookContent, id: string, newCellType: string): void;
export declare function toggleCellFlagProperty(cell: Cell, propertyName: string): void;
