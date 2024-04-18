import {Entity, Sprite, Stage} from "../entities";
import {version} from "scrap-engine/package.json";
import Workspace from "../workspace";
import Paint from "../paint";
import CodeEditor from "../code/editor";

import fs from "fs";
import * as Parley from "parley.js";

import "./app.scss";
import JSZip from "jszip";
import {saveAs} from "file-saver";
import Sound from "../sounds";

import SB3 from "../code/transformers/sb3";
import Tabs from "../tabs";

const engineStyle = fs.readFileSync("node_modules/scrap-engine/dist/style.css", "utf-8");
const engineScript = fs.readFileSync("node_modules/scrap-engine/dist/engine.js", "utf-8");
const engineCDN = "https://unpkg.com/scrap-engine@" + version;

export class App {
	container = document.getElementById("root")!;
	add = document.getElementById("add")!;

	output = document.querySelector("iframe")!;
	play = document.getElementById("play")!;
	stop = document.getElementById("stop")!;

	load = document.querySelector<HTMLInputElement>("#load")!;
	sb3 = document.querySelector<HTMLInputElement>("#sb3")!;
	html = document.getElementById("html")!;
	save = document.getElementById("save")!;

	paced = document.getElementById("paced")!;
	turbo = document.getElementById("turbo")!;
	input = document.querySelector("input")!;

	tabs!: Tabs;
	workspace = new Workspace();
	code = new CodeEditor();

	entities = new Array<Entity>();
	current!: Entity;

	spritePanel = document.querySelector(".sprites")!;
	stagePanel = document.querySelector(".stage")!;

	scratchFiles = new SB3();

	start(version: string) {
		this.current = new Stage();

		this.entities.push(this.current);
		this.tabs = new Tabs(
			this.workspace,
			this.code,
			new Paint(),
			new Sound()
		);

		this.play.addEventListener("click", () => {
			this.output.src = this.output.src;
		});

		this.stop.addEventListener("click", () => {
			this.output.contentWindow!.postMessage("STOP", "*");
		});

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
			} catch (e) {
				window.alert(e);
			}
			document.body.append(engine, script);
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

		this.turbo.addEventListener("click", () => {
			this.output.dataset.mode = "turbo";
		});

		this.paced.addEventListener("click", () => {
			this.output.dataset.mode = "paced";
		});

		this.load.addEventListener("change", () => {
			this.open(version, this.load.files![0]);
		});

		this.sb3.addEventListener("change", () => {
			this.import(this.sb3.files![0]);
		});

		this.html.addEventListener("click", () => {
			this.export();
		});

		this.save.addEventListener("click", async () => {
			const zip = new JSZip();
			const entities = this.entities.map(e => e.save(zip));
			zip.file("project.json", JSON.stringify({
				entities,
				version,
				name: this.input.value
			}));

			saveAs(await zip.generateAsync({type: "blob"}), this.input.value + ".scrap");
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

		const blocks = await this.current.dispose();
		this.current = entity;

		if (blocks && this.tabs.active === this.code) {
			this.tabs.set(this.workspace);
		} else if (!blocks && this.tabs.active === this.workspace) {
			this.tabs.set(this.code);
		} else if (this.tabs.active) {
			this.tabs.active.update();
		}
	}

	addSprite(sprite: Sprite) {
		const element = sprite.render(this.spritePanel);

		const select = (e: MouseEvent | false) => {
			this.stagePanel.classList.remove("selected");
			for (const s of this.spritePanel.getElementsByClassName("selected")) {
				s.classList.remove("selected");
			}
			element.classList.add("selected");

			e && this.select(sprite);
		};

		this.entities.push(sprite);
		this.code.updateLib();

		if (this.workspace.workspace) {
			select(false);
		} else {
			this.current = sprite;
			element.classList.add("selected");
		}

		element.addEventListener("click", select);
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
		} else if (blocks && this.tabs.active === this.workspace) {
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

		this.input.value = name;

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
				this.addSprite(entity);
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

	dropdowns = document.querySelectorAll<HTMLLIElement>("li.dropdown")!;

	dropdown(i: number) {
		this.dropdowns[i].classList.toggle("shown");
	}
}