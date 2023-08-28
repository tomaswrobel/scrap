import engineStyle from "scrap-engine/dist/style.css?raw";
import engineScript from "scrap-engine/dist/engine.js?raw";
import {Entity, Sprite, Stage} from "../entities";
import * as Blockly from "scrap-blocks";
import Workspace from "../workspace";
import Component from "../tab";
import Paint from "../paint";
import Code from "../code";

import "./app.scss";
import JSZip from "jszip";
import {saveAs} from "file-saver";

class App {
	static container = document.getElementById("app")!;
	static add = document.getElementById("add")!;

	static output = document.querySelector("iframe")!;
	static play = document.getElementById("play")!;

	static load = document.querySelector<HTMLInputElement>("#load")!;
	static html = document.querySelector<HTMLInputElement>("#html")!;
	static save = document.querySelector<HTMLInputElement>("#save")!;

	static paced = document.getElementById("paced")!;
	static turbo = document.getElementById("turbo")!;

	static tabs = new Map<string, Component>();
	static activeTab = "Blocks";

	static workspace = new Workspace();
	static code = new Code();
	static paint = new Paint();

	static tabBar = document.getElementById("tabs")!;

	static entities = new Array<Entity>();
	static current: Entity;

	static spritePanel = document.querySelector(".sprites")!;
	static stagePanel = document.querySelector(".stage")!;

	static init() {
		this.entities.push((this.current = new Stage()));
		this.tabs.set("Blocks", this.workspace);
		this.tabs.set("Code", this.code);
		this.tabs.set("Costumes", this.paint);

		for (const [name, tab] of this.tabs) {
			const button = document.createElement("button");
			button.textContent = name;
			button.classList.toggle("selected", name === this.activeTab);

			button.addEventListener("click", () => {
				if (this.activeTab === name) return;
				this.tabs.get(this.activeTab)!.dispose(this.entities);

				this.activeTab = name;

				this.tabBar.querySelector(".selected")?.classList.remove("selected");
				button.classList.add("selected");

				tab.render(this.current, this.container);
			});

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

		this.output.addEventListener("load", () => {
			const document = this.output.contentDocument!;

			const style = document.createElement("style");
			style.textContent = engineStyle;
			document.head.appendChild(style);

			const engine = document.createElement("script");
			engine.innerText = engineScript;
			document.head.appendChild(engine);

			const script = document.createElement("script");
			const code = this.entities.map(e => e.generate()).join("\n\n");
			script.textContent = code;
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

	static select(entity: Entity) {
		if (this.current === entity) {
			return;
		}
		this.current = entity;
		this.tabs.get(this.activeTab)!.update(entity);
	}

	static initDynamicMenus() {
		Blockly.Blocks.sprite = {
			init(this: Blockly.Block) {
				this.appendDummyInput().appendField(
					new Blockly.FieldDropdown(() => {
						const result = App.entities.map<[string, string]>(e => [e.name, e.name]);
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
				return App.current.costumes.map<[string, string]>(e => [e.name, e.name]);
			});
			input.appendField(menu, "NAME");
		});
	}

	static updateVariables() {
		const models = this.workspace.workspace.getVariableMap().getAllVariables();

		for (const sprite of this.entities) {
			if (sprite !== this.current) {
				sprite.updateVariables(models);
			}
		}
	}

	static addSprite(sprite: Sprite) {
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
	static async open(file?: File | null) {
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

	static async export() {
		const zip = new JSZip();

		zip.file("engine.js", engineScript);
		zip.file("script.js", this.entities.map(e => e.generate(zip)).join("\n\n"));
		zip.file("style.css", engineStyle);

		zip.file(
			"index.html",
			'<!DOCTYPE html>\n<html>\n<head>\n\t<title>Scrap Project</title>\n\t<meta charset="utf-8">\n\t<link href="style.css" rel="stylesheet">\n\t<script src="engine.js"></script>\n</head>\n<body>\n\t<script src="script.js"></script>\n</body>\n</html>'
		);

		saveAs(await zip.generateAsync({type: "blob"}), "project.zip");
	}
}

App.init();
