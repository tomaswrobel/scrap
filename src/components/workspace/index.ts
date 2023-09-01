import * as stage from "../../blockly/data/stage.json";
import * as sprite from "../../blockly/data/sprite.json";
import * as theme from "../../blockly/data/theme.json";
import {Stage, type Entity} from "../entities";
import * as Blockly from "blockly/core";
import Component from "../tab";
import type {App} from "../app";
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
				contents: [],
			},
			media: "blockly-media/",
			zoom: {
				startScale: 0.65,
			},
			trashcan: false,
			oneBasedIndex: false,
			disable: false,
		});

		this.workspace.registerToolboxCategoryCallback("FUNCTIONS", workspace => {
			const blockList: Blockly.utils.toolbox.FlyoutItemInfoArray = [
				{
					kind: "block",
					type: "function",
				},
				{
					kind: "block",
					type: "function",
					extraState: {
						returnType: "Iterator",
						params: [],
						name: "generator",
					},
				},
				{
					kind: "block",
					type: "return",
				},
				{
					kind: "block",
					type: "yield",
				},
			];
			for (const block of workspace.getBlocksByType("function", false)) {
				blockList.push({
					kind: "block",
					type: "call",
					extraState: block.saveExtraState!(),
				});
			}
			return blockList;
		});

		this.workspace.addChangeListener(e => {
			Blockly.Events.disableOrphans(e);
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
					name: "Functions",
					custom: "FUNCTIONS",
					categorystyle: "procedure_category",
				},
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
