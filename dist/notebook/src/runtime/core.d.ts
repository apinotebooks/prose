import { Runtime } from ".";
/**
 * When new cell types are registered, or overwritten, the corresponding cells should update.
 * For example: if there is a my-language cell present, which is loaded dynamically in the first cell,
 * subsequent cells should update to this new definition.
 */
export declare function updateCellsWhenCellDefinitionChanges(runtime: Runtime): void;
export declare function setupCommunicationWithParentFrame(runtime: Runtime): void;
export declare function registerDefaultPlugins(_runtime: Runtime): void;
export declare function setupGlobalKeybindings(runtime: Runtime): void;
