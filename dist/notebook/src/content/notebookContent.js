/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { cellToText } from './serialization';
import { textToNotebookContent } from './parsing';
import { generateUniqueCellId } from '../components/helpers/random';
function requireIndexOfCellId(cells, id) {
    if (id === undefined) {
        return cells.length - 1;
    }
    const idx = cells.findIndex((c) => (id === c.id));
    if (idx === -1) {
        throw new Error(`Cell with id ${id} doesn't exist`);
    }
    return idx;
}
export function addCellToNotebookContent(runtime, nb, position, adjacentCellId, id) {
    let idx;
    let cellType;
    if (position === "end") {
        idx = nb.cells.length;
        cellType = nb.cells.length === 0 ? "markdown" : nb.cells[nb.cells.length - 1].cellType;
    }
    else {
        idx = requireIndexOfCellId(nb.cells, adjacentCellId);
        cellType = idx === 0 && adjacentCellId === undefined ? "markdown" : nb.cells[idx].cellType;
    }
    if (position === "after") {
        idx += 1;
    }
    id = id || generateUniqueCellId();
    const cell = {
        cellType,
        textContent: "",
        metadata: { properties: {}, ...(runtime.config.persistCellIds ? { id } : {}) },
        id,
    };
    nb.cells.splice(idx, 0, cell);
}
export function removeCellFromNotebookById(nb, id) {
    const idx = requireIndexOfCellId(nb.cells, id);
    nb.cells.splice(idx, 1);
}
export function changeCellType(nb, id, newCellType) {
    const idx = requireIndexOfCellId(nb.cells, id);
    const cellAsString = cellToText(nb.cells[idx]);
    const newCell = textToNotebookContent(cellAsString).cells[0];
    newCell.cellType = newCellType;
    nb.cells.splice(idx, 1, newCell);
}
export function toggleCellFlagProperty(cell, propertyName) {
    if (cell.metadata.properties[propertyName]) {
        delete cell.metadata.properties[propertyName];
    }
    else {
        cell.metadata.properties[propertyName] = true;
    }
}
//# sourceMappingURL=notebookContent.js.map