import "prism-code-editor/grammars/javascript";
import "prism-code-editor/grammars/jsdoc";

import {createEditor, type PrismEditor} from "prism-code-editor";
import {matchBrackets} from "prism-code-editor/match-brackets";
import {indentGuides} from "prism-code-editor/guides";

// Importing styles
import "./invalid.scss";
import "prism-code-editor/layout.css";
import "prism-code-editor/scrollbar.css";
import "prism-code-editor/search.css";
import "prism-code-editor/themes/vs-code-light.css";

// Importing types
import type TabComponent from "../tab";

export default class Code implements TabComponent {
    editor?: PrismEditor;

    // DOM
    container = document.createElement("div");

    constructor() {
        this.container.classList.add("tab-content");
    }

    render(parent: HTMLElement) {
        parent.append(this.container);

        this.editor = createEditor(
            this.container,
            {
                language: "javascript",
                tabSize: 4,
                insertSpaces: false,
            },
            indentGuides(),
            matchBrackets(true),
        );

        import("./extensions").then(module => {
            module.addExtensions(this.editor!);
            this.update();
        });
    }

    update() {
        this.editor!.setOptions({
            value: window.app.current.code,
            onUpdate(value) {
                window.app.current.code = value;
            },
        });
    }

    dispose() {
        this.editor?.remove();
        this.container.remove();

        delete this.editor;
    }
}