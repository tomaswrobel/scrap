import {editor, Uri} from "monaco-editor";
import "../monaco-editor/typescript";
// Importing types
import type TabComponent from "../components/tab";
import {TypeScript} from "./transformers/typescript";

import path from "path";
import fs from "fs";
import type {Entity} from "../components/entity";

const lib = fs.readFileSync(path.join(__dirname, "lib", "runtime.ts"), "utf-8");

class CodeEditor implements TabComponent {
	name = "Code";
	editor?: editor.IStandaloneCodeEditor;

	// DOM
	container = document.createElement("div");
	main = editor.createModel("", "typescript", Uri.file("/script.ts"));
	types = editor.createModel("", "typescript", Uri.file("/runtime.ts"));

	constructor() {
		this.container.classList.add("tab-content");
		this.main.onDidChangeContent(() => {
			app.current.code = this.main.getValue();
		});
	}

	render() {
		app.container.append(this.container);

		this.editor = editor.create(this.container, {
			automaticLayout: true,
			minimap: {
				enabled: false,
			},
			model: this.main,
			colorDecorators: true,
		});
	}

	async prerender() {
		if (app.current.isUsingBlocks()) {
			const generator = new TypeScript(app.current);
			app.current.code = generator.workspaceToCode(
				app.current.workspace
			);
			app.current.variables = [];
			this.update();
		}
	}

	update() {
		this.main.setValue(app.current.code as string);
		this.updateLib();
	}

	dispose() {
		this.editor?.dispose();
		this.container.remove();

		delete this.editor;
	}

	updateLib() {
		this.types.setValue(lib.replace(/__(\w+)__/g, this.replacer));
	}

	private replacer(_: string, key: string) {
		if (key === "SPRITE") {
			return JSON.stringify(app.current.name);
		} else if (key === "SPRITES") {
			return app.entities.reduce(reducer, "\n");
		} else {
			throw new TypeError("Template not found.");
		}
	}
}

function getVariables(entity: Entity) {
	if (entity === app.current) {
		return "<Variables>";
	}
	if (!entity.variables.length) {
		return "";
	}
	return `<{\n${entity.variables.map(mapper).join("")}}>`;
}

function reducer(prev: string, entity: Entity) {
	return `${prev}\t${JSON.stringify(entity.name)}: ${entity.name === "Stage" ? "Stage" : "Sprite"}${getVariables(entity)};\n`;
}

function mapper([name, type]: app.Variable) {
	return `\t${JSON.stringify(name)}: ${([] as string[]).concat(type).join(" | ")};\n`;
}

export default CodeEditor;