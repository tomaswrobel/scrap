import {stage, sprite, theme, plugins} from "../../blockly";
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
				contents:  entity instanceof Stage ? stage : sprite,
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

		this.workspace.addChangeListener(e => {
			Blockly.Events.disableOrphans(e);
			if (e instanceof Blockly.Events.UiBase) {
				return;
			}
			(this.entity || entity).workspace = Blockly.serialization.workspaces.save(this.workspace);
		});

		this.entity = entity;
		Blockly.serialization.workspaces.load(entity.workspace, this.workspace);
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
