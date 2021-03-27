import { NotebookMessage, NotebookMessageContentData } from "./types";
export interface NotebookInitPayload {
    content: NotebookMessageContentData;
    baseUrl?: string;
}
export declare type InboundNotebookMessage = SetContentMessage | ReloadMessage;
/**
 * Sent from parent webpage to notebook to set the initial content and configuration of the notebook.
 */
export declare type SetContentMessage = NotebookMessage<"NOTEBOOK_SET_INIT_DATA", NotebookInitPayload>;
/**
 * Sent from parent webpage to notebook to trigger a page refresh of the iframe, this is somewhat equivalent to a "kernel reset" in Jupyter.
 */
export declare type ReloadMessage = NotebookMessage<"NOTEBOOK_RELOAD_PAGE", undefined>;
