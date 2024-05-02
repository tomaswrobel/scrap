import {stage, sprite, theme, plugins, Types, TypeToShadow} from "../blockly";
import Blocks from "../code/transformers/blocks";
import {Stage, Sprite} from "./entity";
import * as Blockly from "blockly";
import * as Parley from "parley.js";
import Component from "./tab";
import {bind} from "../decorators";
import "./workspace.scss";

export default class Workspace implements Component {
	container = document.createElement("div");
	workspace!: Blockly.WorkspaceSvg;
	name = "Blocks";

	constructor() {
		this.container.classList.add("blockly", "tab-content");
		Blockly.setParentContainer(this.container);
	}

	async prerender() {
		if (!app.current.isUsingBlocks()) {
			app.showLoader("Compiling code");
			app.current.workspace.clear();
			await Blocks.processEntity(app.current);
			delete app.current.typescript;
			app.hideLoader();
		}
	}

	render() {
		app.container.appendChild(this.container);
		window.requestAnimationFrame(this.inject);
	}

	@bind
	inject() {
		this.workspace = Blockly.inject(this.container, {
			theme,
			renderer: "scrap",
			toolbox: {
				kind: "categoryToolbox",
				contents: app.current instanceof Stage ? stage : sprite,
			},
			media: "blockly-media/",
			sounds: false,
			zoom: {
				startScale: 0.65,
			},
			move: {
				drag: false,
				wheel: true,
				scrollbars: true
			},
			trashcan: false,
			oneBasedIndex: false,
			disable: false,
			plugins
		});

		this.workspace.registerButtonCallback("createVariableButton", async () => {
			const name = await Parley.fire({
				input: "text",
				title: "Create Variable",
				body: app.current instanceof Stage
					? "You are creating global variable"
					: "To create a global variable, select the stage."
			});

			if (name === false) {
				return;
			}

			const type = await Parley.fire({
				input: "select",
				inputOptions: Types.reduce((acc, type) => ({...acc, [type]: type || "any"}), {}),
				title: "Create Variable",
				body: "Type:"
			});

			if (type === false) {
				return;
			}

			app.current.variables.push([name, type]);
			this.workspace.refreshToolboxSelection();
		});

		this.workspace.registerToolboxCategoryCallback(
			"TYPED_VARIABLE",
			() => {
				const json = ["const", "let", "var"].map<Blockly.utils.toolbox.FlyoutItemInfo>(
					(kind, i) => ({
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
													TYPE: "number"
												}
											}
										}
									},
									fields: {
										PARAM: String.fromCharCode(65 + i)
									}
								}
							},
							VALUE: {
								shadow: {
									type: "math_number",
									fields: {
										NUM: i + 1
									}
								}
							}
						},
					})
				);
				json.push(
					{
						kind: "sep",
						gap: 40
					},
					{
						kind: "button",
						text: "Create Variable",
						callbackkey: "createVariableButton",
					}
				);

				function addVariable([name, type]: app.Variable) {
					json.push({
						kind: "block",
						type: "parameter",
						fields: {
							VAR: name
						},
						extraState: {
							type,
							isVariable: true
						}
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
								VAR
							},
							extraState: {
								type,
								isVariable: true
							}
						}
					};

					const shadow = typeof type === "string"
						? TypeToShadow[type] 
						: type.length === 1 
							? TypeToShadow[type[0]] 
							: TypeToShadow.any
					;

					if (shadow) {
						inputs.VALUE = {shadow: {type: shadow}};
					}

					json.splice(
						5, 0,
						{
							kind: "block",
							type: "set",
							inputs
						},
						{
							kind: "block",
							type: "change",
							inputs: {
								VAR: {
									shadow: {
										type: "parameter",
										fields: {
											VAR
										},
										extraState: {
											type,
											isVariable: true
										}
									}
								},
								VALUE: {
									shadow: {
										type: "math_number",
										fields: {
											NUM: "1"
										}
									}
								}
							}
						},
						{
							kind: "block",
							type: "showVariable",
							fields: {VAR}
						},
						{
							kind: "block",
							type: "hideVariable",
							fields: {VAR}
						}
					);
				}

				return json;
			}
		);

		this.update();
	}

	@bind
	changed(e: Blockly.Events.Abstract) {
		if (e instanceof Blockly.Events.UiBase) {
			return;
		}
		app.current.code = Blockly.serialization.workspaces.save(this.workspace);
	}

	update() {
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
								NAME: "foo"
							}
						},
						{
							kind: "block",
							type: "return"
						}
					]
				}
			],
		});

		Blockly.serialization.workspaces.load(
			app.current.code as Record<string, any>,
			this.workspace
		);
		this.workspace.cleanUp();
		this.workspace.refreshToolboxSelection();
		this.workspace.addChangeListener(this.changed);
	}

	dispose() {
		this.container.remove();
		this.workspace.dispose();
	}
}
