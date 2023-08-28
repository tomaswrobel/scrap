import {Stage, type Entity} from "../entities";
import * as Blockly from "scrap-blocks";
import Component from "../tab";
import "./style.scss";

export default class Workspace implements Component {
	container = document.createElement("div");
	workspace!: Blockly.WorkspaceSvg;
	entity!: Entity;

	constructor() {
		this.container.classList.add("blockly", "tab-content");
		Blockly.setParentContainer(this.container);
	}
	render(entity: Entity, parent: HTMLElement) {
		this.entity = entity;
		parent.appendChild(this.container);

		this.workspace = Blockly.inject(this.container, {
			theme: Blockly.Scrap.theme,
			renderer: "zelos",
			toolbox: {
				kind: "categoryToolbox",
				contents: entity instanceof Stage ? Blockly.Scrap.stage : Blockly.Scrap.contents,
			},
			plugins: {
				toolbox: Blockly.ContinuousToolbox,
				flyoutsVerticalToolbox: Blockly.ContinuousFlyout,
				metricsManager: Blockly.ContinuousMetrics,
			},
			media: "blockly/media/",
			zoom: {
				startScale: 0.65,
			},
			trashcan: false,
			oneBasedIndex: false,
		});
		Blockly.serialization.workspaces.load(entity.workspace, this.workspace);

		this.workspace.addChangeListener(() => {
			this.entity.workspace = Blockly.serialization.workspaces.save(this.workspace);
		});

	}
	update(entity: Entity) {
		if (this.entity instanceof Stage) {
			this.workspace.updateToolbox({kind: "categoryToolbox", contents: Blockly.Scrap.contents});
		} else if (entity instanceof Stage) {
			this.workspace.updateToolbox({kind: "categoryToolbox", contents: Blockly.Scrap.stage});
		}

		this.entity = entity;
		Blockly.serialization.workspaces.load(entity.workspace, this.workspace);

		this.workspace.refreshToolboxSelection();
	}
	dispose() {
		this.container.remove();
		this.workspace.dispose();
	}
}
