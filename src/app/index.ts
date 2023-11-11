import {Entity, Sprite, Stage} from "../entities";
import {version} from "scrap-engine/package.json";
import Workspace from "../workspace";
import Component from "../tab";
import Paint from "../paint";
import Code from "../code";

import fs from "fs";
import * as Parley from "parley.js";

import "./app.scss";
import JSZip from "jszip";
import {saveAs} from "file-saver";
import {Generator} from "../blockly";
import CodeParser from "../files/blocks";
import Sound from "../sounds";

import SB3 from "../files/sb3";

const engineStyle = fs.readFileSync("node_modules/scrap-engine/dist/style.css", "utf-8");
const engineScript = fs.readFileSync("node_modules/scrap-engine/dist/engine.js", "utf-8");
const engineCDN = "https://unpkg.com/scrap-engine@" + version;

export default class App {
	container = document.getElementById("root")!;
	add = document.getElementById("add")!;

	generator = new Generator();

	output = document.querySelector("iframe")!;
	play = document.getElementById("play")!;
	stop = document.getElementById("stop")!;

	load = document.querySelector<HTMLInputElement>("#load")!;
	sb3 = document.querySelector<HTMLInputElement>("#sb3")!;
	html = document.getElementById("html")!;
	save = document.getElementById("save")!;

	paced = document.getElementById("paced")!;
	turbo = document.getElementById("turbo")!;

	tabs = new Map<string, Component>();
	buttons = new Map<string, HTMLButtonElement>();
	activeTab = "Blocks";

	workspace = new Workspace();
	code = new Code();

	tabBar = document.getElementById("tabs")!;

	entities = new Array<Entity>();
	current!: Entity;

	spritePanel = document.querySelector(".sprites")!;
	stagePanel = document.querySelector(".stage")!;

	scratchFiles = new SB3();

	start() {
		this.entities.push((this.current = new Stage()));
		this.tabs.set("Blocks", this.workspace);
		this.tabs.set("JavaScript", this.code);
		this.tabs.set("Costumes", new Paint());
		this.tabs.set("Sounds", new Sound());

		for (const [name, tab] of this.tabs) {
			const button = document.createElement("button");
			button.textContent = name;
			button.classList.toggle("selected", name === this.activeTab);

			button.addEventListener("click", async () => {
				if (this.activeTab === name) return;

				if (tab === this.workspace && !this.current.blocks) {
					this.current.blocks = true;
					const parser = new CodeParser(this.current.codeWorkspace);
					try {
						await parser.codeToBlock(this.current.code);
					} catch (e) {
						await Parley.fire({
							title: "Error",
							body: String(e),
							input: "none"
						});
						return;
					}
					this.current.code = "";
				} else if (tab === this.code && this.current.blocks) {
					this.current.blocks = false;
					this.current.code = this.generator.workspaceToCode(this.current.codeWorkspace);
					this.current.workspace = {};
				}

				this.tabs.get(this.activeTab)!.dispose();
				this.activeTab = name;

				for (const s of this.tabBar.getElementsByClassName("selected")) {
					s.classList.remove("selected");
				}

				button.classList.add("selected");

				tab.render(this.container);
			});

			this.buttons.set(name, button);
			this.tabBar.appendChild(button);
		}

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
		this.workspace.render(this.container);

		this.output.addEventListener("load", async () => {
			const document = this.output.contentDocument!;

			const engine = document.createElement("script");
			engine.textContent = engineScript;

			const script = document.createElement("script");
			let code = "";

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
			this.open(this.load.files![0]);
		});

		this.sb3.addEventListener("change", () => {
			this.openSB3(this.sb3.files![0]);
		});

		this.html.addEventListener("click", () => {
			this.export();
		});

		this.save.addEventListener("click", async () => {
			const zip = new JSZip();
			const json = this.entities.map(e => e.save(zip));
			zip.file("project.json", JSON.stringify(json));

			saveAs(await zip.generateAsync({type: "blob"}), "project.scrap");
		});

		const scrappy = new Sprite("Scrappy");
		scrappy.variables.push(["My variable", "Number"]);
		this.addSprite(scrappy);
	}

	select(entity: Entity) {
		if (this.current === entity) {
			return;
		}
		const tab = this.tabs.get(this.activeTab)!;
		this.current = entity;
		if (tab === this.workspace && !entity.blocks) {
			tab.dispose();
			this.activeTab = "JavaScript";
			this.code.render(this.container);
		} else if (tab === this.code && entity.blocks) {
			tab.dispose();
			this.activeTab = "Blocks";
			this.workspace.render(this.container);
		} else {
			tab.update();
		}
		if (entity instanceof Sprite) {
			this.setGlobalVariables().then(() => {
				if (entity.blocks) {
					this.workspace.workspace.refreshToolboxSelection();
				}
			});
		}
		for (const s of this.tabBar.getElementsByClassName("selected")) {
			s.classList.remove("selected");
		}
		this.buttons.get(this.activeTab)!.classList.add("selected");
	}

	addSprite(sprite: Sprite) {
		const element = sprite.render(this.spritePanel);

		const select = () => {
			this.stagePanel.classList.remove("selected");
			for (const s of this.spritePanel.getElementsByClassName("selected")) {
				s.classList.remove("selected");
			}
			element.classList.add("selected");

			this.select(sprite);
		};

		this.entities.push(sprite);

		if (this.workspace.workspace) {
			select();
		} else {
			this.current = sprite;
			element.classList.add("selected");
		}

		element.addEventListener("click", select);
	}

	async open(file?: File | null) {
		if (!file) {
			return;
		}

		this.showLoader("Loading project");
		const zip = await JSZip.loadAsync(file);
		const json = JSON.parse(await zip.file("project.json")!.async("string"));

		this.entities = [];
		this.spritePanel.innerHTML = "";
		this.stagePanel.innerHTML = '<span class="name">Stage</span>';

		for (const data of json) {
			const entity = await Entity.load(zip, data);

			if (entity instanceof Stage) {
				this.entities.push(entity);
				entity.render(this.stagePanel);
			} else {
				this.addSprite(entity);
			}
		}

		this.current = this.entities[0];
		await this.setGlobalVariables();
		this.stagePanel.dispatchEvent(new MouseEvent("click"));
		this.hideLoader();
	}

	async openSB3(file?: File | null) {
		if (!file) {
			return;
		}

		this.showLoader("Transforming project");
		this.entities = [];
		this.spritePanel.innerHTML = "";
		this.stagePanel.innerHTML = '<span class="name">Stage</span>';

		try {
			await this.scratchFiles.transform(file);
			this.stagePanel.dispatchEvent(new MouseEvent("click"));
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

	globalVariables = new Array<string>();

	private async getGlobalVariables() {
		const [stage] = this.entities;

		if (stage.blocks) {
			return stage.variables.map(v => v[0]);
		}

		const babel = await import("@babel/core");
		const tree = await babel.parseAsync(stage.code);

		if (!tree) {
			return [];
		}

		const variables = new Array<string>();

		for (const statement of tree.program.body) {
			if (statement.type !== "VariableDeclaration") {
				continue;
			}

			if (statement.kind !== "let") {
				continue;
			}

			for (const declaration of statement.declarations) {
				if (declaration.id.type !== "Identifier") {
					continue;
				}
				variables.push(Generator.unescape(declaration.id.name));
			}
		}

		return variables;
	}

	async setGlobalVariables() {
		this.globalVariables = await this.getGlobalVariables();
	}

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

		let scripts = "";

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

	hideLoader() {
		document.body.removeAttribute("data-loading");
	}

	showLoader(reason: string) {
		document.body.dataset.loading = reason;
	}
}
