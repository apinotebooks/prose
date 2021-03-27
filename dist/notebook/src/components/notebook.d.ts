import { LitElement } from 'lit-element';
import { IFramePage } from 'iframe-resizer';
import { RuntimeConfig } from '../runtime';
declare global {
    interface Window {
        parentIFrame: IFramePage;
        iFrameResizer: {
            onReady: () => void;
            onMessage: (msg: any) => void;
        };
        starboardEditUrl?: string;
    }
}
export declare class StarboardNotebookElement extends LitElement {
    private runtime;
    config?: RuntimeConfig;
    private cellsParentElement;
    createRenderRoot(): this;
    hasHadInitialRun: boolean;
    connectedCallback(): void;
    notebookInitialize(): Promise<void>;
    firstUpdated(changedProperties: any): void;
    performUpdate(): void;
    render(): import("lit-element").TemplateResult;
}
