/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview Workspace component.
 * @copyright Tomáš Wróbel 2025
 */
import Dialog from "@scrap/utils/dialog";
import * as Blockly from "blockly/core";
import {plugins, sprite, stage, theme, ScrapTypes, TypeToShadowMap} from "@scrap/blockly";
import Blocks from "@scrap/code-transformers/codeToBlocks";
import {bind, load} from "@scrap/utils/decorators";
import {Sprite, Stage} from "@scrap/entity";
import type TabComponent from "../tab";
import "./style.scss";

/**
 * Workspace component is a tab that displays the Blockly workspace.
 */
export default class Workspace implements TabComponent {
	public container = document.createElement("div");
	public workspace!: Blockly.WorkspaceSvg;
	public name = "Blocks";

	constructor(private mediaPath?: string) {
		this.container.classList.add("blockly", "tab-content");
		Blockly.setParentContainer(this.container);
	}

	@load("Compiling code")
	public async prerender() {
		if (!app.current.isUsingBlocks()) {
			if (app.code.hasError) {
				throw new Error("Please fix all errors before switching to blocks");
			}

			app.current.workspace.clear();
			await Blocks.processEntity(app.current);
			delete app.current.typescript;
		}
	}

	public render() {
		app.container.appendChild(this.container);
		window.requestAnimationFrame(this.inject);
	}

	@bind
	public inject() {
		this.workspace = Blockly.inject(this.container, {
			theme,
			renderer: "scrap",
			toolbox: {
				kind: "categoryToolbox",
				contents: app.current instanceof Stage ? stage : sprite,
			},
			media: this.mediaPath,
			zoom: {
				startScale: 0.65,
			},
			grid: {
				spacing: 20,
				length: 1,
				colour: "#222",
			},
			move: {
				drag: false,
				wheel: true,
				scrollbars: true,
			},
			collapse: false,
			oneBasedIndex: false,
			disable: false,
			plugins,
		});

		this.workspace.registerButtonCallback("createVariableButton", async () => {
			const name = await Dialog.scrap.fire({
				input: "text",
				title: "Create Variable",
				body:
					app.current instanceof Stage
						? "You are creating global variable"
						: "To create a global variable, select the stage.",
			});

			if (name === false) {
				return;
			}

			const type = await Dialog.scrap.fire({
				input: "select",
				inputOptions: ScrapTypes.reduce((acc, type) => ({...acc, [type]: type || "any"}), {}),
				title: "Create Variable",
				body: "Type:",
			});

			if (type === false) {
				return;
			}

			app.current.variables.push([name, type]);
			this.workspace.refreshToolboxSelection();
		});

		this.workspace.registerToolboxCategoryCallback("TYPED_VARIABLE", () => {
			const json = ["const", "let", "var"].map<Blockly.utils.toolbox.FlyoutItemInfo>((kind, i) => ({
				kind: "block",
				type: "variable",
				fields: {kind},
				inputs: {
					VAR: {
						block: {
							type: "typed",
							inputs: {
								TYPE: {
									shadow: {
										type: "type",
										fields: {
											TYPE: "number",
										},
									},
								},
							},
							fields: {
								PARAM: String.fromCharCode(65 + i),
							},
						},
					},
					VALUE: {
						shadow: {
							type: "math_number",
							fields: {
								NUM: i + 1,
							},
						},
					},
				},
			}));
			json.push(
				{
					kind: "sep",
					gap: 40,
				},
				{
					kind: "button",
					text: "Create Variable",
					callbackkey: "createVariableButton",
				}
			);

			function addVariable([name, type]: Variable) {
				json.push({
					kind: "block",
					type: "parameter",
					fields: {
						VAR: name,
					},
					extraState: {
						type,
						isVariable: true,
					},
				});
			}

			app.current.variables.forEach(addVariable);

			if (app.current instanceof Sprite) {
				app.entities[0].variables.forEach(addVariable);
			}

			if (json.length > 5) {
				const [VAR, type] = app.current.variables[0] || app.entities[0].variables[0] || [];
				const inputs: Record<string, Blockly.serialization.blocks.ConnectionState> = {};

				if (!VAR) {
					return json;
				}

				inputs.VAR = {
					shadow: {
						type: "parameter",
						fields: {
							VAR,
						},
						extraState: {
							type,
							isVariable: true,
						},
					},
				};

				const shadow =
					typeof type === "string"
						? TypeToShadowMap[type]
						: type.length === 1
						? TypeToShadowMap[type[0]]
						: TypeToShadowMap.any;
				if (shadow) {
					inputs.VALUE = {shadow: {type: shadow}};
				}

				json.splice(
					5,
					0,
					{
						kind: "block",
						type: "set",
						inputs,
					},
					{
						kind: "block",
						type: "change",
						inputs: {
							VAR: {
								shadow: {
									type: "parameter",
									fields: {
										VAR,
									},
									extraState: {
										type,
										isVariable: true,
									},
								},
							},
							VALUE: {
								shadow: {
									type: "math_number",
									fields: {
										NUM: "1",
									},
								},
							},
						},
					},
					{
						kind: "block",
						type: "showVariable",
						fields: {VAR},
					},
					{
						kind: "block",
						type: "hideVariable",
						fields: {VAR},
					}
				);
			}

			return json;
		});

		this.update();
	}

	@bind
	public changed(e: Blockly.Events.Abstract) {
		if (e instanceof Blockly.Events.UiBase) {
			return;
		}
		app.current.code = Blockly.serialization.workspaces.save(this.workspace);
	}

	public update() {
		this.workspace.removeChangeListener(this.changed);
		const contents = app.current instanceof Stage ? stage : sprite;

		this.workspace.updateToolbox({
			kind: "categoryToolbox",
			contents: [
				...contents,
				{
					kind: "category",
					name: "Variables",
					categorystyle: "variables",
					custom: "TYPED_VARIABLE",
				},
				{
					kind: "category",
					name: "Functions",
					categorystyle: "functions",
					contents: [
						{
							kind: "block",
							type: "function",
							fields: {
								NAME: "foo",
							},
						},
						{
							kind: "block",
							type: "return",
						},
					],
				},
			],
		});

		Blockly.serialization.workspaces.load(app.current.code as Record<string, unknown>, this.workspace);
		this.workspace.cleanUp();
		this.workspace.refreshToolboxSelection();
		this.workspace.addChangeListener(this.changed);
	}

	public dispose() {
		this.container.remove();

		try {
			this.workspace.dispose();
		} catch {
			// Probably already disposed.
		}
	}
}
