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
import {Generator} from "../blockly";

export default class Code implements TabComponent {
    generator = new Generator();
    editor?: PrismEditor;
    name = "Code";

    // DOM
    container = document.createElement("div");

    constructor() {
        this.container.classList.add("tab-content");
    }

    render() {
        window.app.container.append(this.container);

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

    async prerender() {
        if (window.app.current.blocks) {
            window.app.current.blocks = false;
            window.app.current.code = this.generator.workspaceToCode(window.app.current.codeWorkspace);
            window.app.current.workspace = {};
        }
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