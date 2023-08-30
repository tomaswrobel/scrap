import scrappy from "./scrappy.svg?raw";
import * as Blockly from "scrap-blocks";
import JSZip from "jszip";

import "./entity.scss";

/**
 * I represent both a sprite and the stage.
 * I am able to generate code, save, and load.
 */
class Entity implements Blockly.Scrap.Entity {
	// Costumes & Sounds are stored as files
	costumes: File[] = [];
	sounds: File[] = [];

	// Thumbnail of the entity
	thumbnail = new Image(60, 60);

	// Costume shown in the paint editor
	currentCostume = 0;

	/** Helper workspace for generating code. */
	codeWorkspace = new Blockly.Workspace();
	/** Generator used for preview in an iframe */
	private outputGenerator = new Blockly.Scrap.Generator(this, true);
	/** Generator used in exported HTML file */
	private exportGenerator = new Blockly.Scrap.Generator(this, false);
	
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
		this.costumes.push(initialCostume);
		this.update();
	}

	/**
	 * Copy variables into my workspace.
	 * @param models Variable models to copy
	 */
	updateVariables(models: Blockly.VariableModel[]) {
		const map = this.codeWorkspace.getVariableMap();
		map.clear();
		for (const variable of models) {
			map.createVariable(variable.name, variable.type, variable.getId());
		}
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
					[s.name]: `${this.name}/${s.name}`
				};
			}, {} as Record<string, string>),
			null,
			"\t"
		);
	}

	generate(zip?: JSZip) {
		if (zip) {
			zip = zip.folder(this.name)!;

			for (const file of this.costumes) {
				zip.file(file.name, file);
			}

			for (const file of this.sounds) {
				zip.file(file.name, file);
			}

			return this.exportGenerator.workspaceToCode(this.codeWorkspace);
		}

		return this.outputGenerator.workspaceToCode(this.codeWorkspace);
	}

	update() {
		this.thumbnail.src && URL.revokeObjectURL(this.thumbnail.src);
		this.thumbnail.src = URL.createObjectURL(this.costumes[this.currentCostume]);
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
		};
	}

	static async load(zip: JSZip, json: ReturnType<Entity["save"]>) {
		const entity = json.name === "Stage" ? new Stage() : new Sprite(json.name);
		entity.workspace = json.workspace;
		const fn = this.loadFiles.bind(this, json.name, zip);
		entity.costumes = await Promise.all(json.costumes.map(fn));
		entity.sounds = await Promise.all(json.sounds.map(fn));
		return entity;
	}

	private static loadFiles(name: string, zip: JSZip, f: string) {
		return zip
			.file(`${name}/${f}`)!
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

class Sprite extends Entity {
	constructor(name: string) {
		super(new File([scrappy], "scrappy.svg", {type: "image/svg+xml"}), name);
	}

	override render(parent: Element) {
		const sprite = document.createElement("div");
		sprite.classList.add("sprite");
		super.render(sprite);
		const name = document.createElement("span");
		name.textContent = this.name;
		name.classList.add("name");
		sprite.appendChild(name);
		return parent.appendChild(sprite);
	}
}

const stage =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360"><rect width="480" height="360" fill="#ffffff"/></svg>';

class Stage extends Entity {
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

export {Stage, Sprite, Entity};
