/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview Code editor
 * @copyright Tomáš Wróbel 2024
 */
import fs from "fs";
import {editor, Uri} from "monaco-editor";
import path from "path";
import type {Entity} from "../components/entity";
import type TabComponent from "../components/tab";
import "../monaco-editor/typescript";
import {TypeScript} from "./transformers/typescript";

const lib = fs.readFileSync(path.join(__dirname, "lib", "runtime.ts"), "utf-8");

class CodeEditor implements TabComponent {
	public name = "Code";
	public hasError = false;
	private editor?: editor.IStandaloneCodeEditor;

	// DOM
	public container = document.createElement("div");
	private main = editor.createModel("", "typescript", Uri.file("/script.ts"));
	private types = editor.createModel("", "typescript", Uri.file("/runtime.ts"));

	constructor() {
		this.container.classList.add("tab-content");

		this.main.onDidChangeContent(() => {
			app.current.code = this.main.getValue();
		});

		this.main.onDidChangeDecorations(() => {
			const decorations = this.main.getAllDecorations(undefined, true);
			const errors = this.main.getAllDecorations(undefined, false);
			this.hasError = decorations.length !== errors.length;
		});
	}

	public render() {
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

	public async prerender() {
		if (app.current.isUsingBlocks()) {
			const generator = new TypeScript(app.current);
			app.current.code = generator.workspaceToCode(app.current.workspace);
			app.current.variables = [];
			this.update();
		}
	}

	public update() {
		this.main.setValue(app.current.code as string);
		this.updateLib();
	}

	public dispose() {
		this.editor?.dispose();
		this.container.remove();

		delete this.editor;
	}

	public updateLib() {
		this.types.setValue(lib.replace(/__(\w+)__/g, replacer));
	}
}

function replacer(_: string, key: string) {
	if (key === "SPRITE") {
		return JSON.stringify(app.current.name);
	} else if (key === "SPRITES") {
		return app.entities.reduce(reducer, "\n");
	} else if (key === "BACKDROPS") {
		return getCostumes(app.entities[0]);
	} else {
		throw new TypeError("Template not found.");
	}
}

function namer(file: File) {
	return JSON.stringify(path.parse(file.name).name);
}

function getVariables(entity: Entity) {
	if (entity === app.current) {
		return "Variables";
	}
	if (!entity.variables.length) {
		return "{}";
	}
	return `{\n${entity.variables.map(mapper).join("")}}`;
}

function getSounds(sprite: Entity) {
	if (!sprite.sounds.length) {
		return "never";
	}

	return sprite.sounds.map(namer).join(" | ");
}

function getCostumes(sprite: Entity) {
	return sprite.costumes.map(namer).join(" | ");
}

function reducer(prev: string, entity: Entity) {
	if (entity.isStage()) {
		var constructor = `Stage<${getVariables(entity)}, ${getSounds(entity)}>`;
	} else {
		var constructor = `Sprite<${getVariables(entity)}, ${getSounds(
			entity
		)}, ${getCostumes(entity)}>`;
	}

	return `${prev}\t${JSON.stringify(entity.name)}: ${constructor};\n`;
}

function mapper([name, type]: Variable) {
	return `\t${JSON.stringify(name)}: ${([] as string[]).concat(type).join(" | ")};\n`;
}

export default CodeEditor;
