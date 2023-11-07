import {Entity, Sprite, Stage} from "../entities";
import * as Blockly from "blockly/core";
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

export default class App {
	container = document.getElementById("app")!;
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

	sounds = new Sound(this);
	workspace = new Workspace(this);
	code = new Code(this);
	paint = new Paint(this);

	tabBar = document.getElementById("tabs")!;

	entities = new Array<Entity>();
	current: Entity;

	spritePanel = document.querySelector(".sprites")!;
	stagePanel = document.querySelector(".stage")!;

	scratchFiles = new SB3(this);

	constructor() {
		this.entities.push((this.current = new Stage()));
		this.tabs.set("Blocks", this.workspace);
		this.tabs.set("JavaScript", this.code);
		this.tabs.set("Costumes", this.paint);
		this.tabs.set("Sounds", this.sounds);

		for (const [name, tab] of this.tabs) {
			const button = document.createElement("button");
			button.textContent = name;
			button.classList.toggle("selected", name === this.activeTab);

			button.addEventListener("click", async () => {
				if (this.activeTab === name) return;

				if (tab === this.workspace && !this.current.blocks) {
					this.current.blocks = true;
					const parser = new CodeParser(this.current.codeWorkspace, this.entities);
					try {
						await parser.codeToBlock(this.current.code);
					} catch (e) {
						window.alert(e);
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

				tab.render(this.current, this.container);
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
		this.initDynamicMenus();

		this.workspace.render(this.current, this.container);

		this.output.addEventListener("load", async () => {
			const document = this.output.contentDocument!;

			const script = document.createElement("script");
			let code = engineScript;

			try {
				for (const entity of this.entities) {
					code += await entity.preview();
					code += "\n\n";
				}

				script.textContent = code;
			} catch (e) {
				window.alert(e);
			}
			document.body.appendChild(script);
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

		this.addSprite(new Sprite("Scrappy"));
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
			this.code.render(entity, this.container);
		} else if (tab === this.code && entity.blocks) {
			tab.dispose();
			this.activeTab = "Blocks";
			this.workspace.render(entity, this.container);
		} else {
			tab.update(entity);
		}
		for (const s of this.tabBar.getElementsByClassName("selected")) {
			s.classList.remove("selected");
		}
		this.buttons.get(this.activeTab)!.classList.add("selected");
	}

	initDynamicMenus() {
		const app = this;
		Blockly.Blocks.sprite = {
			init(this: Blockly.Block) {
				this.setOutput(true, "Sprite");
				this.setStyle("variable_blocks");
				if (this.workspace instanceof Blockly.WorkspaceSvg) {
					this.appendDummyInput().appendField(
						new Blockly.FieldDropdown(() => {
							const result = app.entities.map<[string, string]>(e => [e.name, e.name]);
							result[0] = ["myself", "this"];
							return result;
						}),
						"SPRITE"
					);
					this.onchange = () => {
						const parent = this.getParent();
						if (parent) {
							this.setStyle(parent.getStyleName());
							this.onchange = null;
						}
					};
				} else {
					this.appendDummyInput().appendField(
						new Blockly.FieldTextInput(),
						"SPRITE"
					);
				}
			},
		};
		Blockly.Extensions.register("costume_menu", function (this: Blockly.Block) {
			const input = this.getInput("DUMMY")!;
			const menu = new Blockly.FieldDropdown(() => {
				return app.current.costumes.map<[string, string]>(e => [e.name, e.name]);
			});
			input.appendField(menu, "NAME");
		});
		Blockly.Extensions.register("sound_menu", function (this: Blockly.Block) {
			const input = this.getInput("DUMMY")!;
			const menu = new Blockly.FieldDropdown(() => {
				return app.current.sounds.map<[string, string]>(e => [e.name, e.name]);
			});
			input.appendField(menu, "NAME");
		});
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

		this.stagePanel.dispatchEvent(new MouseEvent("click"));
	}

	async openSB3(file?: File | null) {
		if (!file) {
			return;
		}

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
	}

	async export() {
		const zip = new JSZip();

		zip.file("engine.js", engineScript);

		let scripts = "";

		for (const e of this.entities) {
			await e.export(zip);
			scripts += `\t<script src="${e.name}/script.js"></script>\n`;
		}

		zip.file("style.css", engineStyle);

		zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
<head>
	<title>Scrap Project</title>
	<meta charset="utf-8">
	<link href="style.css" rel="stylesheet">
	<script src="engine.js"></script>
</head>
<body>
${scripts.trimEnd()}
</body>`);

		saveAs(await zip.generateAsync({type: "blob"}), "project.zip");
	}
}
