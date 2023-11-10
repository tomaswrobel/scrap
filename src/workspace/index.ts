import {stage, sprite, theme, plugins, Types} from "../blockly";
import {Stage, Sprite} from "../entities";
import * as Blockly from "blockly/core";
import * as Parley from "parley.js";
import Component from "../tab";
import "./style.scss";
import {bind} from "../decorators";

export default class Workspace implements Component {
	container = document.createElement("div");
	workspace!: Blockly.WorkspaceSvg;

	constructor() {
		this.container.classList.add("blockly", "tab-content");
		Blockly.setParentContainer(this.container);
	}
	
	render(parent: HTMLElement) {
		parent.appendChild(this.container);

		this.workspace = Blockly.inject(this.container, {
			theme,
			renderer: "zelos",
			toolbox: {
				kind: "categoryToolbox",
				contents: window.app.current instanceof Stage ? stage : sprite,
			},
			media: "blockly-media/",
			zoom: {
				startScale: 0.65,
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
				body: window.app.current instanceof Stage
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

			window.app.current.variables.push([name, type]);
			this.workspace.refreshToolboxSelection();
		});

		this.workspace.registerToolboxCategoryCallback(
			"TYPED_VARIABLE",
			() => {
				const json: Blockly.utils.toolbox.FlyoutItemInfoArray = [
					{
						kind: "button",
						text: "Create Variable",
						callbackkey: "createVariableButton",
					}
				];

				for (const variable of window.app.current.variables) {
					json.push({
						kind: "block",
						type: "getVariable",
						fields: {
							VAR: variable[0]
						}
					});
				}

				if (window.app.current instanceof Sprite) {
					for (const variable of window.app.entities[0].variables) {
						json.push({
							kind: "block",
							type: "getVariable",
							fields: {
								VAR: variable[0]
							}
						});
					}
				}

				if (json.length > 1) {
					const VAR = window.app.current.variables[0][0];

					if (!VAR) {
						return json;
					}

					json.splice(
						1, 0,
						{
							kind: "block",
							type: "setVariable",
							fields: {VAR}
						},
						{
							kind: "block",
							type: "changeVariable",
							inputs: {
								VALUE: {
									shadow: {
										type: "math_number",
										fields: {
											NUM: "1"
										}
									}
								}
							},
							fields: {VAR}
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
		window.app.current.workspace = Blockly.serialization.workspaces.save(this.workspace);
	}

	update() {
		this.workspace.removeChangeListener(this.changed);
		const contents = window.app.current instanceof Stage ? stage : sprite;

		this.workspace.updateToolbox({
			kind: "categoryToolbox",
			contents: [
				...contents,
				{
					kind: "category",
					name: "Variables",
					categorystyle: "variable_category",
					custom: "TYPED_VARIABLE",
				},
				{
					kind: "category",
					name: "Functions",
					categorystyle: "procedure_category",
					contents: [
						{
							"kind": "block",
							"type": "function"
						},
						{
							"kind": "block",
							"type": "return"
						}
					]
				}
			],
		});

		Blockly.serialization.workspaces.load(window.app.current.workspace, this.workspace);
		this.workspace.addChangeListener(this.changed);

		this.workspace.cleanUp();
		this.workspace.refreshToolboxSelection();
	}
	dispose() {
		this.container.remove();
		this.workspace.dispose();
	}
}
