import {stage, sprite, theme, plugins, Types} from "../blockly";
import {Stage, type Entity} from "../entities";
import * as Blockly from "blockly/core";
import * as Parley from "parley.js";
import Component from "../tab";
import type App from "../app";
import "./style.scss";

export default class Workspace implements Component {
	container = document.createElement("div");
	workspace!: Blockly.WorkspaceSvg;
	entity!: Entity;

	constructor(readonly app: App) {
		this.container.classList.add("blockly", "tab-content");
		Blockly.setParentContainer(this.container);
	}
	render(entity: Entity, parent: HTMLElement) {
		parent.appendChild(this.container);

		this.workspace = Blockly.inject(this.container, {
			theme,
			renderer: "zelos",
			toolbox: {
				kind: "categoryToolbox",
				contents: entity instanceof Stage ? stage : sprite,
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
				inputOptions: {
					pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
					placeholder: "Valid JavaScript identifier"
				},
				title: "Create Variable",
				body: "Name:"
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

			this.workspace.createVariable(name, type);
		});

		this.workspace.registerToolboxCategoryCallback(
			"TYPED_VARIABLE",
			workspace => {
				const json: Blockly.utils.toolbox.FlyoutItemInfoArray = [
					{
						kind: "button",
						text: "Create Variable",
						callbackkey: "createVariableButton",
					}
				];

				for (const variable of workspace.getAllVariables()) {
					json.push({
						kind: "block",
						type: "getVariable",
						fields: {
							VAR: {
								id: variable.getId()
							}
						}
					});
				}

				if (json.length > 1) {
					const VAR = {
						id: workspace.getAllVariables()[0].getId()
					};
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
					)
				}

				return json;
			}
		)

		this.workspace.addChangeListener(e => {
			if (e instanceof Blockly.Events.UiBase) {
				return;
			}
			(this.entity || entity).workspace = Blockly.serialization.workspaces.save(this.workspace);
		});

		this.update(entity);
	}
	update(entity: Entity) {
		const contents = entity instanceof Stage ? stage : sprite;

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

		this.entity = entity;
		Blockly.serialization.workspaces.load(entity.workspace, this.workspace);

		this.workspace.cleanUp();
		this.workspace.refreshToolboxSelection();
	}
	dispose() {
		this.container.remove();
		this.workspace.dispose();
	}
}
