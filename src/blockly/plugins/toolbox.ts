/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license Apache-2.0
 * @author Google LLC
 *
 * From: @blockly/continuous-toolbox@1.0.5
 * To: TypeScript, Scrap modifications
 */
import * as Blockly from "blockly";
import type {Flyout} from "./flyout";
import type {Category} from "./category";
import type {FunctionBlock} from "../blocks/function";
import {toCheck} from "../types";

export default class Toolbox extends Blockly.Toolbox {
	public override init() {
		super.init();

		const flyout = this.getFlyout();
		flyout.show(this.getInitialFlyoutContents_());
		flyout.recordScrollPositions();

		this.workspace_.addChangeListener(e => {
			if (
				e.type === Blockly.Events.BLOCK_CREATE ||
				e.type === Blockly.Events.BLOCK_DELETE ||
				e.type === Blockly.Events.BLOCK_CHANGE
			) {
				this.refreshSelection();
			}
		});
	}

	protected getInitialFlyoutContents_() {
		const contents: Blockly.utils.toolbox.FlyoutItemInfo[] = [];
		for (const toolboxItem of this.contents_) {
			if (toolboxItem instanceof Blockly.ToolboxCategory) {
				contents.push({kind: "LABEL", text: toolboxItem.getName()});
				const itemContents = toolboxItem.getContents();

				// Handle custom categories (e.g. variables and functions)
				if (typeof itemContents === "string") {
					contents.push({
						custom: itemContents,
						kind: "CATEGORY",
					});
				} else {
					contents.push(...itemContents);
				}
			}
		}

		for (const functionBlock of this.workspace_.getBlocksByType("function", false)) {
			const block = functionBlock as FunctionBlock;
			const params = new Array(block.params.length);

			for (let i = 0; i < params.length; i++) {
				params[i] = toCheck(
					block.getInput("PARAM_" + i)!.connection!.targetBlock()
				);
			}

			contents.push({
				kind: "block",
				type: "call",
				extraState: {
					name: block.getFieldValue("NAME"),
					params,
					returnType:
						block.returns &&
						toCheck(block.getInput("RETURNS")?.connection?.targetBlock()),
				},
			});
		}
		return contents;
	}

	public override refreshSelection() {
		this.getFlyout().show(this.getInitialFlyoutContents_());
	}

	protected override updateFlyout_(
		_oldItem: Category | null,
		newItem: Category | null
	) {
		if (newItem) {
			const flyout = this.getFlyout();
			const name = newItem.getName();
			const {y} = flyout.getCategoryScrollPosition(name)!;
			this.getFlyout().scrollTo(y);
		}
	}

	protected override shouldDeselectItem_(
		oldItem: Category | null,
		newItem: Category | null
	) {
		return !!oldItem && oldItem !== newItem;
	}

	public getCategoryByName(name: string) {
		const category = this.contents_.find(
			item =>
				item instanceof Blockly.ToolboxCategory &&
				item.isSelectable() &&
				name === item.getName()
		);
		if (category) {
			return category as Category;
		}
		return null;
	}

	public selectCategoryByName(name: string) {
		const newItem = this.getCategoryByName(name);
		if (!newItem) {
			return;
		}
		const oldItem = this.selectedItem_ as Category;

		if (this.shouldDeselectItem_(oldItem, newItem)) {
			this.deselectItem_(oldItem);
		}

		if (this.shouldSelectItem_(oldItem, newItem)) {
			this.selectItem_(oldItem, newItem);
		}
	}

	public override getClientRect() {
		const flyout = this.getFlyout();
		if (flyout && !flyout.autoClose) {
			return flyout.getClientRect();
		}
		return super.getClientRect();
	}

	public declare getFlyout: () => Flyout;
}