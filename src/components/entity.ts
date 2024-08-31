/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Sprite and stage entities
 * @author Tomáš Wróbel
 */
import * as Blockly from "blockly";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import {reserved} from "../code/transformers/utils";
import {TypeScript} from "../code/transformers/typescript";
import Blocks from "../code/transformers/blocks";

const stage = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360"><rect x="0" y="0" width="480" height="360" fill="#ffffff"/></svg>';
const scrappy = fs.readFileSync(path.join(__dirname, "assets", "scrappy.svg"), "utf-8");
const click = fs.readFileSync(path.join(__dirname, "assets", "click.mp3"));

/**
 * I represent both a sprite and the stage.
 * I am able to generate code, save, and load.
 * 
 * My {@link code} could be blocks or TypeScript
 */
export class Entity {
	// Costumes & Sounds are stored as files
	costumes: File[] = [];
	/**
	 * Variables are stored as an array of
	 * `[name, type]` tuples.
	 */
	variables: app.Variable[] = [];
	sounds = [new File([click], "click.mp3", {type: "audio/mpeg"})];

	// Thumbnail of the entity
	thumbnail = new Image();

	// Costume / Backdrop shown in the paint editor
	current = 0;
	/** Helper workspace for generating code. */
	workspace = new Blockly.Workspace();
	generator = new TypeScript(this);
	typescript?: string;
	init = {};

	/**
	 * Get the code as string, or the workspace as JSON.
	 */
	get code() {
		if (this.typescript !== undefined) {
			return this.typescript;
		}
		return Blockly.serialization.workspaces.save(this.workspace);
	}

	set code(value: Record<string, any> | string) {
		if (typeof value === "string") {
			this.typescript = value;
		} else {
			delete this.typescript;
			Blockly.serialization.workspaces.load(
				value,
				this.workspace,
				{recordUndo: false}
			);
		}
	}

	isUsingBlocks() {
		return this.typescript === undefined;
	}

	isUsingCode() {
		return this.typescript !== undefined
	}

	/**
	 * @param initialCostume The first and undeletable costume
	 * @param name My name (can be changed later)
	 */
	constructor(initialCostume: File, public name: string) {
		this.costumes.push(initialCostume);
		this.thumbnail.alt = "";
		this.update();
	}

	/**
	 * Get the URLs of the files.
	 * If {@link zip} provided, the
	 * files will be added to the zip.
	 * If not, Blob URLs will be returned.
	 */
	getURLs(type: "costumes" | "sounds", zip?: JSZip) {
		if (!zip) {
			// No zip provided
			return this[type].reduce(
				(urls, file) => ({
					...urls,
					[path.parse(file.name).name]: URL.createObjectURL(file),
				}),
				{} as Record<string, string>
			);
		}

		return this[type].reduce(
			(urls, file) => {
				zip!.file(file.name, file);
				return {
					...urls,
					// Path to file in zip
					[path.parse(file.name).name]: path.join(this.name, file.name),
				};
			},
			{} as Record<string, string>
		);
	}

	async export(zip: JSZip) {
		zip = zip.folder(this.name)!;
		zip.file("script.js", await this.generator.ready(zip));
	}

	async preview() {
		return await this.generator.ready();
	}

	update() {
		this.thumbnail.src && URL.revokeObjectURL(this.thumbnail.src);
		this.thumbnail.src = URL.createObjectURL(this.costumes[this.current]);
	}

	render(parent: Element): HTMLElement {
		return parent.appendChild(this.thumbnail);
	}

	/**
	 * Called before the entity gets deselected
	 */
	async dispose() {
		if (this.typescript !== undefined) {
			this.variables = await Blocks.getVariables(this.typescript);
		}
	}

	/**
	 * Save the entity to a zip.
	 * @param zip The zip to save to
	 * @returns JSON data
	 */
	save(zip: JSZip) {
		zip = zip.folder(this.name)!;

		return {
			name: this.name,
			costumes: this.costumes.map(f => {
				zip.file(f.name, f);
				return f.name;
			}),
			sounds: this.sounds.map(f => {
				zip.file(f.name, f);
				return f.name;
			}),
			code: this.code,
			current: this.current,
			variables: this.variables
		};
	}

	/**
	 * Loads a file and returns a stage, or a sprite with that data
	 * @param zip 
	 * @param json 
	 * @returns 
	 */
	static async load(zip: JSZip, json: ReturnType<Entity["save"]>) {
		const entity = json.name === "Stage" ? new Stage() : new Sprite(json.name);
		const fn = this.loadFiles.bind(this, json.name, zip);
		entity.costumes = await Promise.all(json.costumes.map(fn));
		entity.sounds = await Promise.all(json.sounds.map(fn));
		entity.code = json.code;
		entity.current = json.current;
		entity.variables = json.variables;
		return entity;
	}

	private static loadFiles(name: string, zip: JSZip, f: string) {
		return zip
			.file(path.join(name, f))!
			.async("arraybuffer")
			.then(b => new File([b], f, {type: this.getMimeType(b)}));
	}

	private static getMimeType(arrayBuffer: ArrayBuffer) {
		const arr = new Uint8Array(arrayBuffer).subarray(0, 4);
		let header = "";
		for (let i = 0; i < arr.length; i++) {
			header += arr[i].toString(16);
		}
		switch (header) {
			case "89504e47":
				return "image/png";
			case "47494638":
				return "image/gif";
			case "ffd8ffe0":
			case "ffd8ffe1":
			case "ffd8ffe2":
				return "image/jpeg";
		}
		return "image/svg+xml";
	}

	public isStage(): this is Stage {
		return this.name === "Stage";
	}

	/**
	 * Returns the initial value of a key
	 * 
	 * @param key The key to get the initial value of
	 * @returns The value
	 */
	public getInit<T>(key: string) {
		return (this.init as Record<string, T>)[key];
	}
}

export class Sprite extends Entity {
	constructor(name: string) {
		super(new File([scrappy], "scrappy.svg", {type: "image/svg+xml"}), name);
		this.init = {
			x: 0,
			y: 0,
			direction: 90,
			size: 100,
			rotationStyle: 0,
			visible: true,
			draggable: false
		};
	}

	override render(parent: Element) {
		const sprite = document.createElement("div");
		sprite.classList.add("media-element");
		super.render(sprite);

		const input = document.createElement("input");
		input.classList.add("name");

		const span = document.createElement("span");
		span.textContent = this.name;
		span.classList.add("name");

		span.ondblclick = () => {
			input.value = span.textContent!;
			sprite.replaceChild(input, span);
			input.focus();
			input.select();
		};

		input.onkeyup = e => {
			if (e.key === "Enter") {
				input.blur();
			} else if (e.key === "Escape") {
				e.preventDefault();
				input.value = span.textContent!;
				input.blur();
			}
		};

		input.onblur = () => {
			if (reserved.indexOf(input.value) === -1) {
				span.textContent = input.value;
				this.name = input.value;
			}
			sprite.replaceChild(span, input);
		};

		sprite.appendChild(span);

		const remove = document.createElement("div");

		remove.textContent = "×";
		remove.classList.add("remove");
		remove.onclick = () => {
			parent.removeChild(sprite);
			app.removeSprite(this);
		};

		sprite.appendChild(remove);

		return parent.appendChild(sprite);
	}
}

export class Stage extends Entity {
	readonly __stage__ = true;

	constructor() {
		super(new File([stage], "stage.svg", {type: "image/svg+xml"}), "Stage");
	}

	override render(parent: Element): HTMLElement {
		const img = super.render(parent);
		img.removeAttribute("width");
		img.removeAttribute("height");
		return img;
	}
}
