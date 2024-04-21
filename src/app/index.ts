import {Entity, Sprite, Stage} from "../components/entity";
import {version} from "scrap-engine/package.json";
import Workspace from "../components/workspace";
import Paint from "../components/paint";
import CodeEditor from "../code/editor";

import fs from "fs";
import * as Parley from "parley.js";

import "./app.scss";
import JSZip from "jszip";
import {saveAs} from "file-saver";
import Sound from "../components/sounds";

import SB3 from "../code/transformers/sb3";
import Tabs from "../components/tabs";

const engineStyle = fs.readFileSync("node_modules/scrap-engine/dist/style.css", "utf-8");
const engineScript = fs.readFileSync("node_modules/scrap-engine/dist/engine.js", "utf-8");
const engineCDN = "https://unpkg.com/scrap-engine@" + version;

export class App {
	container = document.getElementById("root")!;
	add = document.getElementById("add")!;

	output = document.querySelector("iframe")!;
	inputs = document.querySelectorAll("input");

	tabs!: Tabs;
	workspace = new Workspace();
	code = new CodeEditor();

	entities = new Array<Entity>();
	current!: Entity;

	spritePanel = document.querySelector(".sprites")!;
	stagePanel = document.querySelector(".stage")!;

	scratchFiles = new SB3();

	start(version: string) {
		this.mode("paced");
		this.current = new Stage();
		this.entities.push(this.current);
		this.tabs = new Tabs(
			this.workspace,
			this.code,
			new Paint(),
			new Sound()
		);

		this.stagePanel.addEventListener("click", () => {
			this.stagePanel.classList.add("selected");
			for (const s of this.spritePanel.getElementsByClassName("selected")) {
				s.classList.remove("selected");
			}
			this.select(this.entities[0]);
		});

		this.current.render(this.stagePanel);

		this.output.addEventListener("load", async () => {
			const document = this.output.contentDocument!;

			const engine = document.createElement("script");
			engine.textContent = engineScript;

			const script = document.createElement("script");
			let code = "var $ = {};\n\n";

			try {
				for (const entity of this.entities) {
					code += await entity.preview();
					code += "\n\n";
				}

				script.textContent = code;

				Object.assign(this.output.contentWindow!, {
					alert: (message: string) => Parley.fire({
						title: "Project Alert",
						body: message,
						input: "none",
						cancelButtonHTML: "",
						confirmButtonHTML: "OK"
					}),
					prompt: (message: string) => Parley.fire({
						title: "Project prompts you...",
						body: message,
						input: "text",
						inputOptions: {
							placeholder: "Your answer here",
						},
						cancelButtonHTML: "Cancel",
						confirmButtonHTML: "OK"
					}),
					confirm: (message: string) => Parley.fire({
						title: "Project needs to confirm...",
						body: message,
						input: "none",
						cancelButtonHTML: "No",
						confirmButtonHTML: "Yes"
					}),
				});

				document.body.append(engine, script);
			} catch (e) {
				await Parley.fire({
					title: "Runtime Error",
					body: String(e),
					input: "none"
				});
			}
		});

		this.add.addEventListener("click", () => {
			let i = 0,
				name: string;

			do {
				name = "Scrappy" + (i || "");
				i++;
			} while (this.entities.some(e => e.name === name));

			this.addSprite(new Sprite(name));
		});

		this.inputs[0].addEventListener("change", () => {
			if (this.inputs[0].accept === ".scrap") {
				this.open(version, this.inputs[0].files![0]);
			}
			if (this.inputs[0].accept === ".sb3") {
				this.import(this.inputs[0].files![0]);
			}
		});

		const scrappy = new Sprite("Scrappy");
		scrappy.variables.push(["My variable", "number"]);
		this.addSprite(scrappy);

		document.title = `Scrap - Editor v${version}`;
	}

	async select(entity: Entity) {
		if (this.current === entity) {
			return;
		}

		await this.current.dispose();
		this.current = entity;
		const blocks = this.current.isUsingBlocks();

		if (blocks && this.tabs.active === this.code) {
			this.tabs.set(this.workspace);
		} else if (!blocks && this.tabs.active === this.workspace) {
			this.tabs.set(this.code);
		} else if (this.tabs.active) {
			this.tabs.active.update();
		}
	}

	addSprite(sprite: Sprite, select = true) {
		const element = sprite.render(this.spritePanel);

		const selector = () => {
			this.stagePanel.classList.remove("selected");
			for (const s of this.spritePanel.getElementsByClassName("selected")) {
				s.classList.remove("selected");
			}
			element.classList.add("selected");

			this.select(sprite);
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
	 * Select the stage and update the tabs
	 * Used only when the project is loaded
	 * by {@link open} and {@link import}
	 * For other cases, use {@link select}
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
	async open(currentVersion: string, file: File | null) {
		if (!file) {
			return;
		}

		this.showLoader("Loading project");
		const zip = await JSZip.loadAsync(file);

		const {version = "0", entities, name} = JSON.parse(
			await zip.file("project.json")!.async("string")
		);

		this.inputs[1].value = name;

		// Check if the project is compatible with the current version
		if (version.split(".")[0] !== currentVersion.split(".")[0]) {
			await Parley.fire({
				title: "Error",
				body: "This project was created with an incompatible version of Scrap",
				input: "none"
			});
			this.hideLoader();
			return;
		}

		this.entities = [];
		this.spritePanel.innerHTML = "";
		this.stagePanel.innerHTML = '<span class="name">Stage</span>';

		for (const data of entities) {
			const entity = await Entity.load(zip, data);

			if (entity instanceof Stage) {
				this.entities.push(entity);
				entity.render(this.stagePanel);
			} else {
				this.addSprite(entity, false);
			}
		}

		this.current = this.entities[0];
		this.selectStage();
		this.hideLoader();
	}

	/**
	 * Import a project from a file
	 * @param file SB3 file to import
	 */
	async import(file?: File | null) {
		if (!file) {
			return;
		}

		this.showLoader("Transforming project");
		this.entities = [];
		this.spritePanel.innerHTML = "";
		this.stagePanel.innerHTML = '<span class="name">Stage</span>';

		try {
			await this.scratchFiles.transform(file);
			this.selectStage();
		} catch (e) {
			await Parley.fire({
				title: "Error",
				body: String(e),
				input: "none"
			});
		}

		this.current = this.entities[0];
		this.hideLoader();
	}

	/**
	 * Export the project to a zip file
	 * containing all the entities and the engine
	 */
	async export() {
		const type = await Parley.fire({
			title: "Export",
			body: "How do you want to include the engine?",
			input: "select",
			inputOptions: {
				"inline": "Inline (larger file size)",
				"external": "External (requires internet connection to run)"
			}
		});

		if (type === false) {
			return;
		}

		const zip = new JSZip();

		if (type === "inline") {
			zip.file("engine.js", engineScript);
			zip.file("style.css", engineStyle);
		}

		let scripts = "\t<script>var $ = {};</script>\n";

		for (const e of this.entities) {
			await e.export(zip);
			scripts += `\t<script src="${e.name}/script.js"></script>\n`;
		}

		zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
<head>
	<title>Scrap Project</title>
	<meta charset="utf-8">
	<link href="${type === "inline" ? "style.css" : engineCDN + "/dist/style.css"}" rel="stylesheet">
	<script src="${type === "inline" ? "engine.js" : engineCDN + "/dist/engine.js"}"></script>
</head>
<body>
${scripts.trimEnd()}
</body>`);

		saveAs(await zip.generateAsync({type: "blob"}), "project.zip");
	}

	async saveAs() {
		const zip = new JSZip();
		const entities = this.entities.map(e => e.save(zip));
		zip.file("project.json", JSON.stringify({
			entities,
			version,
			name: this.inputs[1].value
		}));

		saveAs(await zip.generateAsync({type: "blob"}), this.inputs[1].value + ".scrap");
	}

	/**
	 * Hide the loading indicator
	 * @see showLoader
	 */
	hideLoader() {
		document.body.removeAttribute("data-loading");
	}

	/**
	 * Show a loading indicator
	 * @param reason Reason for showing the loader
	 * @see hideLoader
	 */
	showLoader(reason: string) {
		document.body.dataset.loading = reason;
	}

	// For index.html
	dropdowns = document.querySelectorAll<HTMLLIElement>("li.dropdown")!;
	modes = document.querySelectorAll<HTMLAnchorElement>("[data-for]");

	dropdown(i: number) {
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

	mode(mode: string) {
		this.output.dataset.mode = mode;

		for (const m of this.modes) {
			m.style.setProperty("visibility", m.dataset.for === mode ? "visible" : "hidden");
		}
	}

	pick(accept: string) {
		this.inputs[0].accept = accept;
		this.inputs[0].showPicker();
	}
}