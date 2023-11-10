import * as Blockly from "blockly/core";
import {Generator} from "../blockly";
import JSZip from "jszip";
import fs from "fs";
import "./entity.scss";
import path from "path";
import transform from "../files/javascript";

const click = fs.readFileSync(path.join(__dirname, "click.mp3"));

/**
 * I represent both a sprite and the stage.
 * I am able to generate code, save, and load.
 */
class Entity {
	// Costumes & Sounds are stored as files
	costumes: File[] = [];
	variables: [string, string][] = [];
	sounds = [new File([click], "click.mp3", {type: "audio/mpeg"})];

	// Thumbnail of the entity
	thumbnail = new Image();

	// Costume / Backdrop shown in the paint editor
	current = 0;
	/** Helper workspace for generating code. */
	codeWorkspace = new Blockly.Workspace();
	/** Generator used for preview in an iframe */
	protected outputGenerator = new Generator(true);
	/** Generator used in exported HTML file */
	protected exportGenerator = new Generator(false);

	code = "this.whenLoaded(function () {});";
	blocks = true;

	/**
	 * Get the workspace as JSON.
	 */
	get workspace() {
		return Blockly.serialization.workspaces.save(this.codeWorkspace);
	}

	/**
	 * Set the workspace from JSON.
	 * @param workspace JSON workspace
	 */
	set workspace(workspace: Record<string, any>) {
		Blockly.serialization.workspaces.load(workspace, this.codeWorkspace, {recordUndo: false});
	}

	/**
	 * @param initialCostume The first and undeletable costume
	 * @param name My name (can be changed later)
	 */
	constructor(initialCostume: File, public name: string) {
		this.codeWorkspace.newBlock("whenLoaded");
		this.costumes.push(initialCostume);
		this.outputGenerator.entity = this;
		this.exportGenerator.entity = this;
		this.outputGenerator.INDENT = "";
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
			return JSON.stringify(
				this[type].reduce(
					(urls, s) => ({
						...urls,
						[s.name]: URL.createObjectURL(s),
					}),
					{} as Record<string, string>
				),
				null,
				"\t"
			);
		}

		// Create folder to prevent name conflicts
		zip = zip.folder(this.name)!;

		return JSON.stringify(
			this[type].reduce((urls, s) => {
				zip!.file(s.name, s);
				return {
					...urls,
					// Path to file in zip
					[s.name]: path.join(this.name, s.name),
				};
			}, {} as Record<string, string>),
			null,
			"\t"
		);
	}

	async export(zip: JSZip) {
		zip = zip.folder(this.name)!;

		for (const file of this.costumes) {
			zip.file(file.name, file);
		}

		for (const file of this.sounds) {
			zip.file(file.name, file);
		}

		if (this.blocks) {
			zip.file("script.js", this.exportGenerator.workspaceToCode(this.codeWorkspace));
		} else {
			const result = await transform(this.code);
			zip.file("script.js", this.exportGenerator.finish(result?.code || ""));
		}
	}

	async preview() {
		if (this.blocks) {
			return this.outputGenerator.workspaceToCode(this.codeWorkspace);
		} else {
			const result = await transform(this.code, true);
			return this.outputGenerator.finish(result?.code || "");
		}
	}

	update() {
		this.thumbnail.src && URL.revokeObjectURL(this.thumbnail.src);
		this.thumbnail.src = URL.createObjectURL(this.costumes[this.current]);
	}

	render(parent: Element): HTMLElement {
		return parent.appendChild(this.thumbnail);
	}

	/**
	 * Save the entity to a zip.
	 * @param zip The zip to save to
	 * @returns JSON data
	 */
	save(zip: JSZip) {
		zip = zip.folder(this.name)!;

		for (const file of this.costumes) {
			zip.file(file.name, file);
		}

		for (const file of this.sounds) {
			zip.file(file.name, file);
		}

		return {
			name: this.name,
			costumes: this.costumes.map(f => f.name),
			sounds: this.sounds.map(f => f.name),
			workspace: this.workspace,
			code: this.code,
			blocks: this.blocks,
			current: this.current,
			variables: this.variables
		};
	}

	static async load(zip: JSZip, json: ReturnType<Entity["save"]>) {
		const entity = json.name === "Stage" ? new Stage() : new Sprite(json.name);
		entity.workspace = json.workspace;
		const fn = this.loadFiles.bind(this, json.name, zip);
		entity.costumes = await Promise.all(json.costumes.map(fn));
		entity.sounds = await Promise.all(json.sounds.map(fn));
		entity.code = json.code;
		entity.blocks = json.blocks;
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
}

const scrappy = fs.readFileSync(path.join(__dirname, "scrappy.svg"), "utf-8");

class Sprite extends Entity {
	readonly init = {
		x: 0,
		y: 0,
		direction: 90,
		size: 100,
		rotationStyle: 0,
		visible: true,
		draggable: true
	};

	constructor(name: string) {
		super(new File([scrappy], "scrappy.svg", {type: "image/svg+xml"}), name);
		this.variables.push(["My variable", "Number"]);
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

		input.onblur = () => {
			if (Generator.ReservedWords.indexOf(input.value) === -1) {
				span.textContent = input.value;
				this.name = input.value;
			}
			sprite.replaceChild(span, input);
		};

		sprite.appendChild(span);
		return parent.appendChild(sprite);
	}
}

const stage = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360"><rect x="0" y="0" width="480" height="360" fill="#ffffff"/></svg>';

class Stage extends Entity {
	constructor() {
		super(new File([stage], "stage.svg", {type: "image/svg+xml"}), "Stage");
		this.outputGenerator.entity = this;
		this.exportGenerator.entity = this;
	}

	override render(parent: Element): HTMLElement {
		const img = super.render(parent);
		img.removeAttribute("width");
		img.removeAttribute("height");
		return img;
	}
}

export {Stage, Sprite, Entity};
