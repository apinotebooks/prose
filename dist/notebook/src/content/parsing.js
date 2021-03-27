/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import * as YAML from "yaml";
import { generateUniqueCellId } from "../components/helpers/random";
const eol = /\r\n|\r|\n/g;
// [optionally "#" or "//"], any whitespace, "%" at least twice, any amount of -
// OR legacy mode (deprecated): %% followed by optional single whitespace, and any lowercase letter
// Example: # %%
export const CellDelimiterRegex = /(^(#|\/\/)\s*%{2,}-*)|(^%%\s?[a-z])/;
// If the matched part of the `CellDelimiterRegex` above contains this it's the start of a cell metadata block
// The part within the capture group is the comment delimiter that will be removed from all subsequent lines
const CellMetadataStartDelimiterRegex = /([^%]*)%%---/;
// "#" or "//", any whitespace, at least 3 -, "%" at least twice, end of line
// Example: # ---%
const CellMetadataEndDelimiterRegex = /^(#|\/\/)\s*-{3,}%{2,}$/;
const CellTypeIdentifierRegex = /\[[a-zA-Z0-9-_]*\]/;
const NotebookMetadataDelimiterRegex = /^---$/;
export function textToNotebookContent(text) {
    const { cells: parsedCells, metadata } = parseNotebookContent(text);
    const cells = parsedCells.map((pc) => {
        const cellMetadata = {
            properties: {},
            ...pc.metadata
        };
        return {
            cellType: pc.type,
            textContent: pc.lines.join("\n"),
            metadata: cellMetadata,
            id: pc.metadata.id || generateUniqueCellId(),
        };
    });
    const nbContent = {
        metadata: metadata,
        cells,
    };
    return nbContent;
}
function parseLegacyCellDelimiter(line) {
    const flags = line.split(/[ \t]+/).filter(s => s !== "" && s.match(/^%*$/) === null);
    if (flags.length === 0) {
        console.error("Issue in parsing: invalid legacy cell header without cell type");
        return {
            type: "",
            metadata: {},
            lines: []
        };
    }
    const [type, ...properties] = flags;
    const propertiesAsObject = {};
    properties.forEach(p => {
        if (p === "runOnLoad")
            p = "run_on_load"; // For backwards compatibility.
        propertiesAsObject[p] = true;
    });
    return {
        type,
        metadata: {
            properties: propertiesAsObject
        },
        lines: []
    };
}
/**
 * Parses the given notebook file content string into the frontmatter and ParsedCell structure.
 */
export function parseNotebookContent(notebookContentString) {
    const allLines = notebookContentString.split(eol);
    if (notebookContentString.endsWith("\n") || notebookContentString.endsWith("\r"))
        allLines.pop(); // remove added last line
    // The index at which the cells start
    let cellLinesStartIndex = 0;
    let notASingleCellPresent = false;
    // The index of the first line that only contains ---
    let yamlHeaderStartIndex = undefined;
    // The index of the second line that only contains ---
    let yamlHeaderEndIndex = undefined;
    // All lines before the first cell make up the front matter.
    for (const [i, line] of allLines.entries()) {
        if (NotebookMetadataDelimiterRegex.test(line)) {
            if (yamlHeaderStartIndex === undefined) {
                yamlHeaderStartIndex = i;
            }
            else if (yamlHeaderEndIndex === undefined) {
                yamlHeaderEndIndex = i;
            }
            else {
                console.error("Multiple notebook YAML headers were found (at least three lines with only '---'), only the first will be used");
            }
        }
    }
    // ignore yaml if it's not at the front of the file
    if (yamlHeaderStartIndex !== undefined && yamlHeaderStartIndex > 1) {
        yamlHeaderStartIndex = undefined;
        yamlHeaderEndIndex = undefined;
    }
    // ignore invalid front matter
    if (yamlHeaderStartIndex !== undefined && yamlHeaderEndIndex === undefined) {
        yamlHeaderStartIndex = undefined;
    }
    let metadata = {};
    if (yamlHeaderStartIndex !== undefined && yamlHeaderEndIndex !== undefined) {
        // cell content starts after frontmatter  
        cellLinesStartIndex = yamlHeaderEndIndex + 1;
        try {
            metadata = YAML.parse(allLines.slice(yamlHeaderStartIndex + 1, yamlHeaderEndIndex).join("\n")) || {};
            if (typeof metadata !== "object") {
                throw new Error("Failed to parse notebook metadata - it should be a map at the root.");
            }
        }
        catch (e) { // The metadata is invalid, throw error - we can't recover.
            console.error("Notebook metadata failed to parse");
            throw e;
        }
    }
    const cells = [];
    if (cellLinesStartIndex === undefined) {
        return {
            cells,
            metadata
        };
    }
    let currentCell = undefined;
    let currentlyInCellMetadataBlock = false;
    let currentCellMetadataCommentPrefix = "";
    for (const line of allLines.slice(cellLinesStartIndex)) {
        var ct = "no cell";
        if (currentCell != undefined)
            ct = currentCell.type;
        console.log(ct + ": " + line);
        if (line.trimRight() === "\`\`\`") {
            if (currentCell) {
                if (currentCell.type === "markdown") {
                    currentCell.lines.push(line); // markdown can contain "naked" fenced blocks
                }
                else {
                    // current cell ends         
                    currentCell = undefined;
                }
                continue;
            }
        }
        if (line.startsWith("\`\`\`")) { // Start a new cell - here we parse the initial line that starts a new cell
            if (currentlyInCellMetadataBlock) {
                console.error("Previous cell YAML metadata block was not closed when new cell started.");
                currentlyInCellMetadataBlock = false;
            }
            let infoString = line.substring(3).trimLeft();
            console.log("infoString " + infoString);
            let cellParameters = "";
            let cellType = infoString;
            let spacePos = infoString.indexOf(" ");
            if (spacePos > 1) {
                cellParameters = infoString.substring(spacePos + 1);
                cellType = infoString.substring(0, spacePos);
            }
            console.log("infoString spacePos " + spacePos + " cellType XX" + cellType + "XX");
            currentCell = {
                type: cellType,
                metadata: {},
                lines: []
            };
            /* todo: define metadata handling ? inline json?
            const cellMetadataStartMatches = CellMetadataStartDelimiterRegex.exec(cellDelimiterMatches[0]);
            if (cellMetadataStartMatches) {
              currentlyInCellMetadataBlock = true;
              currentCellMetadataCommentPrefix = cellMetadataStartMatches[1];
            }
            */
            cells.push(currentCell);
        }
        else { // No new cell was started, add the lines to the current cell
            if (!currentCell) { // if no cell was defined fallback to markdown cell
                currentCell = {
                    type: "markdown",
                    metadata: {},
                    lines: []
                };
                cells.push(currentCell);
            }
            if (currentlyInCellMetadataBlock) {
                if (CellMetadataEndDelimiterRegex.test(line)) {
                    try {
                        // This is the end of the YAML block at the start of a cell, parse the lines as yaml.
                        currentCell.metadata = YAML.parse(currentCell.lines.join("\n")) || {};
                        if (typeof currentCell.metadata !== "object") {
                            console.error(`Cell (type: ${currentCell.type}) has invalid metadata (${JSON.stringify(currentCell.lines)}), it must be a YAML map (e.g. not a primitive value or an array).`);
                        }
                    }
                    catch (e) {
                        console.error(`Cell (type: ${currentCell.type}) metadata (${JSON.stringify(currentCell.lines)}) could not be parsed: ${e}, its metadata will be empty.`);
                    }
                    currentCell.lines = [];
                    currentlyInCellMetadataBlock = false;
                }
                else {
                    currentCell.lines.push(line.replace(currentCellMetadataCommentPrefix, ""));
                }
            }
            else {
                // Just an ordinary line in a cell
                currentCell.lines.push(line);
            }
        }
    }
    return {
        cells,
        metadata,
    };
}
//# sourceMappingURL=parsing.js.map