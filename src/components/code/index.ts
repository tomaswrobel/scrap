import Prism from "prism-code-editor/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javadoclike";
import "prismjs/components/prism-jsdoc";
import "prism-code-editor/scrollbar.css";
import "prism-code-editor/layout.css";
import "prism-code-editor/themes/vs-code-light.css";
import {createEditor, PrismEditor} from "prism-code-editor";
import type TabComponent from "../tab";
import type {App} from "../app";
import type {Entity} from "../entities";
import {Generator} from "../../blockly/utils/generator";

import "./style.css";

const generator = new Generator();

export default class Code implements TabComponent {
	container = document.createElement("div");
	editor!: PrismEditor;

	constructor(readonly app: App) {
		this.container.classList.add("code", "tab-content");
	}

	render(entity: Entity, parent: HTMLElement) {
		parent.appendChild(this.container);
		if (this.editor) {
			this.update(entity);
		} else {
			this.editor = createEditor(Prism, this.container, {
				language: "javascript",
				value: generator.workspaceToCode(entity.codeWorkspace),
				insertSpaces: false,
				tabSize: 4,
				onUpdate: (value) => {
					entity.code = value;
				},
			});
		}
	}

	update(entity: Entity) {
		this.editor.setOptions({
			value: entity.code,
			onUpdate: (value) => {
				entity.code = value;
			}
		});
	}

	dispose() {
		this.container.remove();
	}
}
