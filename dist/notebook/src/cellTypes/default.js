/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { BaseCellHandler } from "./base";
import { render, html } from "lit-html";
import { StarboardTextEditor } from "../components/textEditor";
export const DEFAULT_CELL_TYPE_DEFINITION = {
    name: "Unknown",
    cellType: "",
    createHandler: (c, r) => new DefaultCellHandler(c, r),
};
/**
 * The cell handler that gets used when there is an unknown cell type
 */
export class DefaultCellHandler extends BaseCellHandler {
    constructor(cell, runtime) {
        super(cell, runtime);
    }
    attach(params) {
        const ed = new StarboardTextEditor(this.cell, this.runtime);
        render(html `${ed}`, params.elements.topElement);
    }
}
//# sourceMappingURL=default.js.map