/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { textToNotebookContent } from "../content/parsing";
import { ConsoleCatcher } from "../console/console";
import { registry as cellTypeRegistry } from "../cellTypes/registry";
import { registry as cellPropertiesRegistry } from "../cellProperties/registry";
import { addCellToNotebookContent, removeCellFromNotebookById, changeCellType } from "../content/notebookContent";
import { notebookContentToText } from "../content/serialization";
import { debounce } from "@github/mini-throttle";
import { registerDefaultPlugins, setupCommunicationWithParentFrame, setupGlobalKeybindings, updateCellsWhenCellDefinitionChanges } from "./core";
import { createExports } from "./exports";
function getInitialContent() {
    if (window.initialNotebookContent) {
        return textToNotebookContent(window.initialNotebookContent);
    }
    const notebookContentElement = document.querySelector('script[type="application/vnd.starboard.nb"]');
    if (notebookContentElement) {
        return textToNotebookContent(notebookContentElement.innerText);
    }
    return { cells: [], metadata: {} };
}
function getConfig() {
    let config = {
        persistCellIds: false,
        defaultTextEditor: "smart",
    };
    if (window.runtimeConfig) {
        config = {
            ...config,
            ...window.runtimeConfig
        };
    }
    return config;
}
export function setupRuntime(notebook) {
    const content = getInitialContent();
    /** Runtime without any of the functions **/
    const rt = {
        consoleCatcher: new ConsoleCatcher(window.console),
        content,
        config: getConfig(),
        dom: {
            cells: [],
            notebook,
        },
        definitions: {
            cellTypes: cellTypeRegistry,
            cellProperties: cellPropertiesRegistry,
        },
        name: "starboard-notebook",
        version: STARBOARD_NOTEBOOK_VERSION,
        // These are set below
        controls: null,
        exports: null,
        internal: {
            listeners: {
                cellContentChanges: new Map()
            }
        }
    };
    const controls = {
        insertCell(position, adjacentCellId) {
            addCellToNotebookContent(rt, rt.content, position, adjacentCellId);
            notebook.performUpdate();
            controls.contentChanged();
        },
        removeCell(id) {
            removeCellFromNotebookById(rt.content, id);
            notebook.performUpdate();
            controls.contentChanged();
        },
        changeCellType(id, newCellType) {
            changeCellType(rt.content, id, newCellType);
            rt.dom.cells.forEach(c => {
                if (c.cell.id === id) {
                    c.remove();
                }
            });
            notebook.performUpdate();
            controls.contentChanged();
        },
        resetCell(id) {
            rt.dom.cells.forEach(c => {
                if (c.id === id) {
                    c.remove();
                }
            });
            notebook.performUpdate();
        },
        runCell(id, focusNext, insertNewCell) {
            const cellElements = rt.dom.cells;
            let idxOfCell = -1;
            for (let i = 0; i < cellElements.length; i++) {
                const cellElement = cellElements[i];
                if (cellElement.cell.id === id) {
                    idxOfCell = i;
                    cellElement.run();
                    break; // IDs should be unique, so after we find it we can stop searching.
                }
            }
            const isLastCell = idxOfCell === cellElements.length - 1;
            if (insertNewCell) { // run should have no side effects || isLastCell) {
                controls.insertCell("after", id);
            }
            if (focusNext) {
                window.setTimeout(() => {
                    const next = cellElements[idxOfCell + 1];
                    if (next)
                        next.focusEditor();
                });
            }
        },
        save() {
            const couldSave = controls.sendMessage({ type: "NOTEBOOK_SAVE_REQUEST", payload: {
                    content: notebookContentToText(rt.content)
                } });
            if (!couldSave) {
                console.error("Can't save as parent frame is not listening for messages");
            }
            return couldSave;
        },
        async runAllCells(opts = {}) {
            let cellElement = rt.dom.cells[0] || null;
            while (cellElement) {
                if (opts.onlyRunOnLoad && !cellElement.cell.metadata.properties.run_on_load) {
                    // Don't run this cell..
                }
                else {
                    await cellElement.run();
                }
                cellElement = cellElement.nextSibling;
            }
        },
        sendMessage(message, targetOrigin) {
            if (window.parentIFrame) {
                window.parentIFrame.sendMessage(message, targetOrigin);
                return true;
            }
            return false;
        },
        /**
        * To be called when the notebook content text changes in any way.
        */
        contentChanged: debounce(function () {
            controls.sendMessage(({ type: "NOTEBOOK_CONTENT_UPDATE", payload: {
                    content: notebookContentToText(rt.content)
                } }));
        }, 100),
        emit(event) {
            if (event.type === "RUN_CELL") {
                controls.runCell(event.id, !!event.focusNextCell, !!event.insertNewCell);
            }
            else if (event.type === "INSERT_CELL") {
                controls.insertCell(event.position, event.id);
            }
            else if (event.type === "REMOVE_CELL") {
                controls.removeCell(event.id);
            }
            else if (event.type === "CHANGE_CELL_TYPE") {
                controls.changeCellType(event.id, event.newCellType);
            }
            else if (event.type === "RESET_CELL") {
                controls.resetCell(event.id);
            }
            else if (event.type === "SAVE") {
                controls.save();
            }
        },
        subscribeToCellChanges(id, callback) {
            const listeners = rt.internal.listeners.cellContentChanges.get(id);
            if (listeners !== undefined) {
                listeners.push(callback);
            }
            else {
                rt.internal.listeners.cellContentChanges.set(id, [callback]);
            }
        },
        unsubscribeToCellChanges(id, callback) {
            const listeners = rt.internal.listeners.cellContentChanges.get(id);
            if (!listeners)
                return;
            const idx = listeners.indexOf(callback);
            if (idx === -1)
                return;
            listeners.splice(idx, 1);
        },
    };
    rt.controls = controls;
    rt.exports = createExports();
    setupGlobalKeybindings(rt);
    /** Initialize certain functionality */
    updateCellsWhenCellDefinitionChanges(rt);
    window.runtime = rt;
    setupCommunicationWithParentFrame(rt);
    registerDefaultPlugins(rt);
    return rt;
}
//# sourceMappingURL=create.js.map