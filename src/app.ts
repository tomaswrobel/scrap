/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2025
 * @fileoverview Main application entry point.
 */
import {Entity, Sprite, Stage} from "@scrap/entity";
import {readFile, writeFile} from "@tauri-apps/plugin-fs";
import Workspace from "@scrap/components/workspace";
import Paint from "@scrap/components/paint";
import CodeEditor from "@scrap/components/code-editor";
import Dialog from "@scrap/utils/dialog";

import {downloadDir, join} from "@tauri-apps/api/path";
import {version, productName} from "../src-tauri/tauri.conf.json";

import JSZip from "jszip";
import Sound from "./components/sound-viewer";

import SB3 from "./code-transformers/sb3";
import Tabs from "./components/tabs";

import * as Blockly from "blockly/core";
import {bind, load} from "./utils/decorators";
import createSavedAtLabel from "./utils/create-saved-at-label";

import engineStyle from "scrap-engine/dist/style.css?raw";
import engineScript from "scrap-engine/dist/engine.js?raw";

export default class App {
	public readonly container = document.getElementById("app")!;
	private readonly output = document.querySelector("iframe")!;
	private readonly input = document.querySelector("input")!;

	private spritePanelBlock!: Blockly.BlockSvg;
	private tabs!: Tabs;

	private readonly workspace = new Workspace("/");
	public readonly code = new CodeEditor();

	public entities = new Array<Entity>();
	public current!: Entity;

	public readonly spritePanel = document.getElementById("sprites")!;
	public readonly stagePanel = document.getElementById("stage")!;

	private readonly sb3 = SB3.new();

	public start() {
		this.mode("paced");
		this.current = new Stage();
		this.entities.push(this.current);
		this.tabs = new Tabs(this.workspace, this.code, new Paint(), new Sound());

		this.stagePanel.addEventListener("click", () => {
			this.stagePanel.classList.add("selected");
			for (const s of this.spritePanel.getElementsByClassName("selected")) {
				s.classList.remove("selected");
			}
			this.selectEntity(this.entities[0]);
		});

		this.current.render(this.stagePanel);

		this.output.addEventListener("load", this.setUpOutput);

		if (this.output.contentDocument) {
			this.setUpOutput();
		}

		document.getElementById("add")!.addEventListener("click", () => {
			for (var n = 1, name = "Scrappy"; this.entities.some(e => e.name === name); name = `Scrappy ${n++}`);
			this.addSprite(new Sprite(name));
		});

		document.getElementById("handler")!.addEventListener("mousedown", this);

		// Sprite panel
		const workspace = Blockly.inject(this.spritePanel.querySelector(".sprite-info")!, {
			renderer: "scrap",
			zoom: {
				startScale: 0.65,
			},
			media: "/",
			trashcan: false,
			collapse: false,
			scrollbars: false,
			oneBasedIndex: false,
			disable: false,
		});
		workspace.showContextMenu = () => {};

		this.spritePanelBlock = workspace.newBlock("spritePanel", "root");
		this.spritePanelBlock.initSvg();
		this.setUpSpritePanelBlock();

		const scrappy = new Sprite("Scrappy");
		scrappy.variables.push(["My variable", "number"]);
		this.addSprite(scrappy);

		// Finalize
		document.title = `${productName} v${version}`;
		document.body.style.removeProperty("opacity");
	}

	@bind
	public async setUpOutput() {
		const document = this.output.contentDocument!;

		const engine = document.createElement("script");
		engine.textContent = engineScript;

		const script = document.createElement("script");
		let code = "var $ = {};\n\n";

		try {
			for (const entity of this.entities) {
				code += await entity.preview();
			}

			script.textContent = code;

			Object.assign(this.output.contentWindow || {}, {
				alert: (message: string) =>
					Dialog.scrap.fire({
						title: "Project Alert",
						body: message,
						input: "none",
						cancelButtonHTML: "",
						confirmButtonHTML: "OK",
					}),
				prompt: (message: string) =>
					Dialog.scrap.fire({
						title: "Project prompts you...",
						body: message,
						input: "text",
						inputOptions: {
							placeholder: "Your answer here",
						},
						cancelButtonHTML: "Cancel",
						confirmButtonHTML: "OK",
					}),
				confirm: (message: string) =>
					Dialog.scrap.fire({
						title: "Project needs to confirm...",
						body: message,
						input: "none",
						cancelButtonHTML: "No",
						confirmButtonHTML: "Yes",
					}),
			});

			document.body.append(engine, script);
		} catch (e) {
			await Dialog.scrap.fire({
				title: "Runtime Error",
				body: String(e),
				input: "none",
			});
		}
	}

	public async selectEntity(entity: Entity) {
		if (this.current === entity) {
			return;
		}

		await this.current.dispose();
		this.current = entity;

		// Update the tabs
		// Different sprites may use blocks or code differently
		if (entity.isUsingBlocks() && this.tabs.active === this.code) {
			this.tabs.set(this.workspace);
		} else if (entity.isUsingCode() && this.tabs.active === this.workspace) {
			this.tabs.set(this.code);
		} else if (this.tabs.active) {
			this.tabs.active.update();
		}

		// Update the sprite panel
		if (entity.isStage()) {
			this.spritePanelBlock.setEditable(false);
		} else {
			this.spritePanelBlock.setEditable(true);

			this.spritePanelBlock.getInput("x")!.connection!.targetBlock()!.setFieldValue(entity.getInit("x"), "NUM");
			this.spritePanelBlock.getInput("y")!.connection!.targetBlock()!.setFieldValue(entity.getInit("y"), "NUM");
			this.spritePanelBlock
				.getInput("size")!
				.connection!.targetBlock()!
				.setFieldValue(entity.getInit("size"), "NUM");
			this.spritePanelBlock
				.getInput("direction")!
				.connection!.targetBlock()!
				.setFieldValue(entity.getInit("direction"), "VALUE");

			this.spritePanelBlock.getField("draggable")!.setValue(entity.getInit("draggable") ? "TRUE" : "FALSE");
			this.spritePanelBlock.getField("visible")!.setValue(entity.getInit("visible") ? "TRUE" : "FALSE");
		}
	}

	/**
	 * Set up the sprite panel block
	 */
	private setUpSpritePanelBlock() {
		const x = this.spritePanelBlock.getInput("x")!;
		const y = this.spritePanelBlock.getInput("y")!;
		const size = this.spritePanelBlock.getInput("size")!;
		const direction = this.spritePanelBlock.getInput("direction")!;

		const draggable = this.spritePanelBlock.getField("draggable") as Blockly.FieldCheckbox;
		const visible = this.spritePanelBlock.getField("visible") as Blockly.FieldCheckbox;

		x.connection!.setShadowState({
			type: "math_number",
			fields: {
				NUM: 0,
			},
		});

		y.connection!.setShadowState({
			type: "math_number",
			fields: {
				NUM: 0,
			},
		});

		size.connection!.setShadowState({
			type: "math_number",
			fields: {
				NUM: 100,
			},
		});

		direction.connection!.setShadowState({
			type: "motion_angle",
			fields: {
				VALUE: 90,
			},
		});

		x.connection!.targetBlock()!
			.getField("NUM")!
			.setValidator(x => {
				if (!this.current.isStage()) {
					Object.assign(this.current.init, {x});
				} else {
					return null;
				}
			});

		y.connection!.targetBlock()!
			.getField("NUM")!
			.setValidator(y => {
				if (!this.current.isStage()) {
					Object.assign(this.current.init, {y});
				} else {
					return null;
				}
			});

		size.connection!.targetBlock()!
			.getField("NUM")!
			.setValidator(size => {
				if (!this.current.isStage()) {
					Object.assign(this.current.init, {size});
				} else {
					return null;
				}
			});

		direction
			.connection!.targetBlock()!
			.getField("VALUE")!
			.setValidator(direction => {
				if (!this.current.isStage()) {
					Object.assign(this.current.init, {direction});
				} else {
					return null;
				}
			});

		draggable.setValidator(s => {
			if (!this.current.isStage()) {
				Object.assign(this.current.init, {
					draggable: s === "TRUE",
				});
			} else {
				return null;
			}
		});

		visible.setValidator(s => {
			if (!this.current.isStage()) {
				Object.assign(this.current.init, {
					visible: s === "TRUE",
				});
			} else {
				return null;
			}
		});

		visible.setCheckCharacter("\u2714");
		draggable.setCheckCharacter("\u2714");

		this.spritePanelBlock.setDeletable(false);
		this.spritePanelBlock.setMovable(false);
		this.spritePanelBlock.initSvg();
	}

	/**
	 * Adds sprite to the panel
	 * @param sprite Sprite to add
	 * @param select whether to select the sprite immediately
	 */
	public addSprite(sprite: Sprite, select = true) {
		const element = sprite.render(this.spritePanel);

		const selector = () => {
			this.stagePanel.classList.remove("selected");
			for (const s of this.spritePanel.getElementsByClassName("selected")) {
				s.classList.remove("selected");
			}
			element.classList.add("selected");

			this.selectEntity(sprite);
		};

		this.entities.push(sprite);
		this.code.updateLib();

		if (this.workspace.workspace && select) {
			selector();
		} else {
			this.current = sprite;
			element.classList.add("selected");
		}

		element.addEventListener("click", selector);
	}

	/**
	 * Removes sprite from the database
	 *
	 * @param sprite Sprite to remove
	 */
	public removeSprite(sprite: Sprite) {
		const index = this.entities.indexOf(sprite);

		if (index === -1) {
			return;
		}

		this.entities.splice(index, 1);
		this.code.updateLib();

		if (sprite === this.current) {
			this.selectStage();
		}
	}

	/**
	 * Select the stage and update the tabs
	 * Used only when the project is loaded
	 * by {@link open} and {@link import}
	 * For other cases, use {@link selectEntity}
	 */
	private selectStage() {
		this.stagePanel.classList.add("selected");
		for (const s of this.spritePanel.getElementsByClassName("selected")) {
			s.classList.remove("selected");
		}

		this.current = this.entities[0];
		const blocks = this.current.isUsingBlocks();

		if (blocks && this.tabs.active === this.code) {
			this.tabs.set(this.workspace);
		} else if (!blocks && this.tabs.active === this.workspace) {
			this.tabs.set(this.code);
		} else if (this.tabs.active) {
			this.tabs.active.update();
		}
	}

	/**
	 * Load a project from a file
	 * @param currentVersion Version of the current editor
	 * @param file SCRAP file to open
	 */
	@load("Opening project", true)
	public async open(path: string) {
		const file = await readFile(path);
		const zip = await JSZip.loadAsync(file);

		const {entities, name, size = 380} = JSON.parse(await zip.file("project.json")!.async("string"));

		this.input.value = name;
		this.container.style.setProperty("--output", `${size}`);

		this.entities = [];
		this.cleanPanels();

		for (const data of entities) {
			const entity = await Entity.load(zip, data);

			if (entity instanceof Stage) {
				this.entities.push(entity);
				entity.render(this.stagePanel);
			} else {
				this.addSprite(entity, false);
			}
		}

		this.selectStage();
		return createSavedAtLabel(path);
	}

	/**
	 * Import a project from a file
	 * @param file SB3 file to import
	 */
	@load("Importing project", true)
	public async import(path: string) {
		const file = await readFile(path);
		this.entities = [];
		this.cleanPanels();

		try {
			await this.sb3(await JSZip.loadAsync(file));
			this.selectStage();
		} catch (e) {
			await Dialog.scrap.fire({
				title: "Error",
				body: String(e),
				input: "none",
			});
		}

		this.current = this.entities[0];
		return createSavedAtLabel(path);
	}

	/**
	 * Removes all the entities from the DOM
	 */
	private cleanPanels() {
		for (let i = 1; i < this.spritePanel.children.length; i++) {
			this.spritePanel.children[i].remove();
		}

		this.stagePanel.innerHTML = '<span class="name">Stage</span>';
	}

	/**
	 * Export the project to a zip file
	 * containing all the entities and the engine
	 */
	@load("Exporting project", true)
	public async export(path: string) {
		const zip = new JSZip();

		zip.file("engine.js", engineScript);
		zip.file("style.css", engineStyle);

		let scripts = "<script>var $ = {};</script>";

		for (const e of this.entities) {
			await e.export(zip);
			scripts += `<script src="${e.name}/script.js"></script>`;
		}

		const index = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <title>Scrap Project</title>
                <meta charset="utf-8">
                <link href="style.css" rel="stylesheet">
                <script src="engine.js"></script>
            </head>
            <body>
                ${scripts}
            </body>
        `;

		const indent = /[\r\n]| {4}/g;
		const {width, height} = this.getOutputSize();

		const sized = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <title>Scrap Project</title>
                <meta charset="utf-8">
            </head>
            <body>
                <iframe id="output" width="${width}" height="${height}" src="index.html"></iframe>
            </body>
        `;

		zip.file("index.html", index.replace(indent, ""));
		zip.file(`${width}x${height}.html`, sized.replace(indent, ""));

		await writeFile(path, await zip.generateAsync({type: "uint8array"}));
		return createSavedAtLabel(path);
	}

	/**
	 * Save the project to a file
	 *
	 * @param path Path to save the project
	 */
	@load("Saving project", true)
	public async save(path: string) {
		const zip = new JSZip();
		const entities = this.entities.map(e => e.save(zip));

		zip.file(
			"project.json",
			JSON.stringify({
				entities,
				version,
				size: +this.container.style.getPropertyValue("--output"),
				name: this.input.value,
			})
		);

		await writeFile(path, await zip.generateAsync({type: "uint8array"}));

		const italic = document.createElement("i");
		italic.textContent = path;

		const span = document.createElement("span");
		span.append("Project saved at ", italic, ".");

		return span;
	}

	/**
	 * Handle the resize of the output
	 */
	public handleEvent(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "mousedown") {
			this.output.style.setProperty("pointer-events", "none");
			document.addEventListener("mousemove", this);
			document.addEventListener("mouseup", this);
		} else if (e.type === "mousemove") {
			this.tabs.hide();

			let output = +this.container.style.getPropertyValue("--output");

			output -= e.movementX;

			if (output > 620) {
				output = 620;
			}

			if (output < 260) {
				output = 260;
			}

			if (output >= 375 && output <= 385) {
				output = 380;
			}

			this.container.style.setProperty("--output", `${output}`);
			this.workspace.workspace.resize();
		} else if (e.type === "mouseup") {
			this.tabs.show();
			this.output.style.removeProperty("pointer-events");
			document.removeEventListener("mousemove", this);
			document.removeEventListener("mouseup", this);
		}
	}

	public getOutputSize() {
		const size = this.container.style.getPropertyValue("--output");
		const width = +size + 100;
		return {
			width,
			height: Math.round(width * 0.75),
		};
	}

	// For index.html
	public readonly dropdowns = document.querySelectorAll<HTMLLIElement>("li.dropdown");
	public readonly modes = document.querySelectorAll<HTMLAnchorElement>("[data-for]");

	public dropdown(i: number) {
		if (this.dropdowns[i].classList.toggle("shown")) {
			document.addEventListener(
				"mousedown",
				e => {
					if (!this.dropdowns[i].contains(e.target as Node)) {
						e.preventDefault();
						this.dropdowns[i].classList.remove("shown");
					}
				},
				{once: true}
			);
		}
	}

	/**
	 * Set the mode of the frame (paced or turbo)
	 * @param mode mode to set
	 */
	public mode(mode: string) {
		this.output.dataset.mode = mode;

		for (const m of this.modes) {
			m.style.setProperty("visibility", m.dataset.for === mode ? "visible" : "hidden");
		}
	}

	/**
	 * Save Dialog
	 */
	public static async saveAs(this: App, type: "zip" | "scrap") {
		const filters: Dialog.native.DialogFilter[] = [
			{name: "Web app", extensions: ["zip"]},
			{name: "Scrap project", extensions: ["scrap"]},
		];

		if (type === "scrap") {
			filters.reverse();
		}

		const path = await Dialog.native.save({
			defaultPath: await join(await downloadDir(), `project.${type}`),
			title: "Save project",
			filters,
		});

		if (!path) {
			return;
		}

		if (type === "zip") {
			await this.export(path);
		} else {
			await this.save(path);
		}
	}

	/**
	 * Open Dialog
	 */
	public static async openAs(this: App, type: "scrap" | "sb3") {
		const filters: Dialog.native.DialogFilter[] = [
			{name: "Scrap project", extensions: ["scrap"]},
			{name: "Scratch 3 project", extensions: ["sb3"]},
		];

		if (type === "sb3") {
			filters.reverse();
		}

		const path = await Dialog.native.open({
			title: "Open project",
			filters,
			defaultPath: await downloadDir(),
		});

		if (!path) {
			return;
		}

		if (type === "scrap") {
			await this.open(path);
		} else {
			await this.import(path);
		}
	}

	constructor() {
		document.getElementById("save")!.onclick = App.saveAs.bind(this, "scrap");
		document.getElementById("export")!.onclick = App.saveAs.bind(this, "zip");
		document.getElementById("open")!.onclick = App.openAs.bind(this, "scrap");
		document.getElementById("import")!.onclick = App.openAs.bind(this, "sb3");
	}
}
