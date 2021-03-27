import { Cell, ControlsDefinition } from "../types";
export declare function cellControlsTemplate(controls: ControlsDefinition): import("lit-html").TemplateResult;
export declare function getPropertiesIcons(cell: Cell, togglePropertyFunction: (name: string) => void): import("lit-html").TemplateResult;
export declare function getPropertiesPopoverIcons(cell: Cell, togglePropertyFunction: (name: string) => void): import("lit-html").TemplateResult;
