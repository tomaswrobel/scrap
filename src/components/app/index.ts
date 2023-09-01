import {Entity, Sprite, Stage} from "../entities";
import * as Blockly from "blockly/core";
import Workspace from "../workspace";
import Component from "../tab";
import Paint from "../paint";
import Code from "../code";

import fs from "fs";

import "./app.scss";
import JSZip from "jszip";
import {saveAs} from "file-saver";
import Swal from "sweetalert2";
import {Generator} from "../../blockly/utils/generator";
import CodeParser from "../code/code2block";

const engineStyle = fs.readFileSync("node_modules/scrap-engine/dist/style.css", "utf-8");
const engineScript = fs.readFileSync("node_modules/scrap-engine/dist/engine.js", "utf-8");

export class App {
	container = document.getElementById("app")!;
	add = document.getElementById("add")!;

	generator = new Generator();

	output = document.querySelector("iframe")!;
	play = document.getElementById("play")!;

	load = document.querySelector<HTMLInputElement>("#load")!;
	html = document.getElementById("html")!;
	save = document.getElementById("save")!;

	paced = document.getElementById("paced")!;
	turbo = document.getElementById("turbo")!;

	tabs = new Map<string, Component>();
	buttons = new Map<string, HTMLButtonElement>();
	activeTab = "Blocks";

	workspace = new Workspace(this);
	code = new Code(this);
	paint = new Paint(this);

	tabBar = document.getElementById("tabs")!;

	entities = new Array<Entity>();
	current: Entity;

	spritePanel = document.querySelector(".sprites")!;
	stagePanel = document.querySelector(".stage")!;

	constructor() {
		this.entities.push((this.current = new Stage()));
		this.tabs.set("Blocks", this.workspace);
		this.tabs.set("Code", this.code);
		this.tabs.set("Costumes", this.paint);

		for (const [name, tab] of this.tabs) {
			const button = document.createElement("button");
			button.textContent = name;
			button.classList.toggle("selected", name === this.activeTab);

			button.addEventListener("click", async () => {
				if (this.activeTab === name) return;
				this.tabs.get(this.activeTab)!.dispose();
				this.activeTab = name;
				if (name === "Blocks" || name === "Code") {
					this.current.mode = name;

					if (name === "Blocks") {
						const parser = new CodeParser(this.current.codeWorkspace, this.entities);
						try {
							await parser.codeToBlock(this.current.code);
							this.current.code = "";
						} catch (e) {
							await Swal.fire({
								title: "Compilation Error",
								text: String(e),
								icon: "error",
							});
						}
						
					} else {
						this.current.code = this.generator.workspaceToCode(this.current.codeWorkspace);
						this.current.workspace = {};
					}
				}
				this.tabBar.querySelector(".selected")?.classList.remove("selected");
				button.classList.add("selected");

				tab.render(this.current, this.container);
			});

			this.buttons.set(name, button);
			this.tabBar.appendChild(button);
		}

		this.play.addEventListener("click", () => {
			this.output.src = this.output.src;
		});

		this.stagePanel.addEventListener("click", () => {
			this.stagePanel.classList.add("selected");
			this.spritePanel.querySelector(".selected")?.classList.remove("selected");
			this.select(this.entities[0]);
		});

		this.current.render(this.stagePanel);
		this.initDynamicMenus();

		this.workspace.render(this.current, this.container);

		this.workspace.workspace.addChangeListener(e => {
			// Check for variable changes
			if (
				e.type === Blockly.Events.VAR_CREATE ||
				e.type === Blockly.Events.VAR_DELETE ||
				e.type === Blockly.Events.VAR_RENAME
			) {
				this.updateVariables();
			}
		});

		this.output.addEventListener("load", async () => {
			const document = this.output.contentDocument!;

			const style = document.createElement("style");
			style.textContent = engineStyle;
			document.head.appendChild(style);

			const engine = document.createElement("script");
			engine.innerText = engineScript;
			document.head.appendChild(engine);

			const script = document.createElement("script");
			let code = "";

			try {
				for (const entity of this.entities) {
					code += await entity.preview();
					code += "\n\n";
				}

				script.textContent = code;
			} catch (e) {
				await Swal.fire({
					title: "Compilation Error",
					text: String(e),
					icon: "error",
				});
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
		this.current = entity;
		this.tabs.get(this.activeTab)!.dispose();
		this.tabs.get(this.activeTab)!.render(this.current, this.container);
		this.tabBar.querySelector(".selected")?.classList.remove("selected");
		this.buttons.get(this.activeTab)!.classList.add("selected");
	}

	initDynamicMenus() {
		const app = this;
		Blockly.Blocks.sprite = {
			init(this: Blockly.Block) {
				this.appendDummyInput().appendField(
					new Blockly.FieldDropdown(() => {
						const result = app.entities.map<[string, string]>(e => [e.name, e.name]);
						result[0] = ["myself", "this"];
						return result;
					}),
					"SPRITE"
				);
				this.setOutput(true, "Sprite");
				this.setStyle("variable_blocks");
				this.onchange = () => {
					const parent = this.getParent();
					if (parent) {
						this.setStyle(parent.getStyleName());
						this.onchange = null;
					}
				};
			},
		};
		Blockly.Extensions.register("costume_menu", function (this: Blockly.Block) {
			const input = this.getInput("DUMMY")!;
			const menu = new Blockly.FieldDropdown(() => {
				return app.current.costumes.map<[string, string]>(e => [e.name, e.name]);
			});
			input.appendField(menu, "NAME");
		});
	}

	updateVariables() {
		const models = this.workspace.workspace.getVariableMap().getAllVariables();

		for (const sprite of this.entities) {
			if (sprite !== this.current) {
				sprite.updateVariables(models);
			}
		}
	}

	addSprite(sprite: Sprite) {
		if (this.workspace.workspace) {
			this.updateVariables();
		}

		const element = sprite.render(this.spritePanel);

		const select = () => {
			this.stagePanel.classList.remove("selected");
			this.spritePanel.querySelector(".selected")?.classList.remove("selected");
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

	async export() {
		const zip = new JSZip();

		zip.file("engine.js", engineScript);

		let scripts = "";

		for (const e of this.entities) {
			await e.export(zip);
			scripts += `\t<script src="${e.name}.js"></script>\n`;
		}

		zip.file("style.css", engineStyle);

		zip.file(
			"index.html",
			`<!DOCTYPE html>
<html>
<head>
	<title>Scrap Project</title>
	<meta charset="utf-8">
	<link href="style.css" rel="stylesheet">
	<script src="engine.js"></script>
</head>
<body>
${scripts.trimEnd()}
</body>`
		);

		saveAs(await zip.generateAsync({type: "blob"}), "project.zip");
	}
}
