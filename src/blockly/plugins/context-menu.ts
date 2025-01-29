import * as Blockly from "blockly";
import {Menu, MenuItem} from "@tauri-apps/api/menu";
import {LogicalPosition} from "@tauri-apps/api/dpi";

Blockly.BlockSvg.prototype.showContextMenu = async function (e) {
	const menuOptions = this.generateContextMenu();
	if (!menuOptions?.length) return;

	const menu = await Menu.new();

	for (const {text, enabled, callback} of menuOptions) {
		const menuItem = await MenuItem.new({
			text: typeof text === "string" ? text : text.innerText,
			enabled,
			action: () => callback({block: this}, e),
		});

		menu.append(menuItem);
	}

	menu.popup(new LogicalPosition(e.clientX, e.clientY));
}

Blockly.WorkspaceSvg.prototype.showContextMenu = async function Workspace(e) {
	if (this.options.readOnly || this.isFlyout) {
		return;
	}

	const menuOptions = Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
		Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
		{workspace: this}
	);

	if (!menuOptions?.length) return;

	const menu = await Menu.new();

	for (const {text, enabled, callback} of menuOptions) {
		const menuItem = await MenuItem.new({
			text: typeof text === "string" ? text : text.innerText,
			enabled,
			action: () => callback({workspace: this}, e),
		});

		menu.append(menuItem);
	}
}

Blockly.comments.RenderedWorkspaceComment.prototype.showContextMenu = async function(this: Blockly.comments.RenderedWorkspaceComment, e: PointerEvent) {
	const menuOptions = Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
		Blockly.ContextMenuRegistry.ScopeType.COMMENT,
		{comment: this}
	);

	if (!menuOptions?.length) return;

	const menu = await Menu.new();

	for (const {text, enabled, callback} of menuOptions) {
		const menuItem =await MenuItem.new({
			text: typeof text === "string" ? text : text.innerText,
			enabled,
			action: () => callback({comment: this}, e),
		});

		menu.append(menuItem);
	}

	menu.popup(new LogicalPosition(e.clientX, e.clientY));
}