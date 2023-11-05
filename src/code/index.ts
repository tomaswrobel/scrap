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
import type App from "../app";
import type {Entity} from "../entities";

export default class Code implements TabComponent {
    editor?: PrismEditor;

    // DOM
    container = document.createElement("div");

    constructor(readonly app: App) {
        this.container.classList.add("tab-content");
    }

    render(entity: Entity, parent: HTMLElement) {
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
            this.update(entity);
        });
    }

    update(entity: Entity) {
        this.editor!.setOptions({
            value: entity.code,
            onUpdate(value) {
                entity.code = value;
            },
        });
    }

    dispose() {
        this.editor?.remove();
        this.container.remove();

        delete this.editor;
    }
}