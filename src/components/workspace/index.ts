import {Stage, type Entity} from "../entities";
import * as Blockly from "scrap-blocks";
import Component from "../tab";
import "./style.scss";
import type {App} from "../app";

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

		const contents = entity instanceof Stage ? Blockly.Scrap.stage : Blockly.Scrap.contents;

		this.workspace = Blockly.inject(this.container, {
			theme: Blockly.Scrap.theme,
			renderer: "zelos",
			toolbox: {
				kind: "categoryToolbox",
				contents,
			},
			media: "blockly/media/",
			zoom: {
				startScale: 0.65,
			},
			trashcan: false,
			oneBasedIndex: false,
		});

		this.workspace.registerToolboxCategoryCallback("FUNCTIONS", workspace => {
			const blockList: Blockly.utils.toolbox.FlyoutItemInfoArray = [
				{
					kind: "block",
					type: "function",
				},
				{
					kind: "block",
					type: "return",
				},
			];
			for (const block of workspace.getBlocksByType("function", false)) {
				blockList.push({
					kind: "block",
					type: "call",
					extraState: {
						name: block.getFieldValue("NAME"),
						returnType: block.getFieldValue("TYPE"),
						params: "params" in block ? block.params : [],
					},
				});
			}
			return blockList;
		});

		this.workspace.addChangeListener(e => {
			if (e instanceof Blockly.Events.UiBase) {
				return;
			}
			(this.entity || entity).workspace = Blockly.serialization.workspaces.save(this.workspace);
		});

		this.update(entity);
	}
	update(entity: Entity) {
		const contents = entity instanceof Stage ? Blockly.Scrap.stage : Blockly.Scrap.contents;

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

		this.workspace.refreshToolboxSelection();
	}
	dispose() {
		this.container.remove();
		this.workspace.dispose();
	}
}
