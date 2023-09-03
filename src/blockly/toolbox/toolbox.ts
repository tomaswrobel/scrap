/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/*
 * Transformed into TypeScript from:
 * @blockly/continuous-toolbox
 * Slighly modified to Scrap's needs
 */
import * as Blockly from "blockly/core";
import type {Flyout} from "./flyout";
import Category from "./category";

export class Toolbox extends Blockly.Toolbox {
	override init() {
		super.init();

		const flyout = this.getFlyout();
		flyout.show(this.getInitialFlyoutContents_());
		flyout.recordScrollPositions();

		this.workspace_.addChangeListener(e => {
			if (e.type === Blockly.Events.BLOCK_CREATE || e.type === Blockly.Events.BLOCK_DELETE) {
				this.refreshSelection();
			}
			if (e.type === "procedure") {
				setTimeout(() => {
					this.getFlyout().hide();
					this.refreshSelection();
				});
			}
		});
	}

	override getFlyout() {
		return super.getFlyout() as Flyout;
	}

	getInitialFlyoutContents_() {
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
		for (const block of this.workspace_.getBlocksByType("function", false)) {
			contents.push({
				kind: "block",
				type: "call",
				extraState: block.saveExtraState!(),
			});
		}
		return contents;
	}

	refreshSelection() {
		this.getFlyout().show(this.getInitialFlyoutContents_());
	}

	updateFlyout_(_oldItem: Category | null, newItem: Category | null) {
		if (newItem) {
			const flyout = this.getFlyout();
			const name = newItem.getName();
			const {y} = flyout.getCategoryScrollPosition(name)!;
			this.getFlyout().scrollTo(y);
		}
	}

	shouldDeselectItem_(oldItem: Category | null, newItem: Category | null) {
		return !!oldItem && oldItem !== newItem;
	}

	getCategoryByName(name: string) {
		const category = this.contents_.find(item => item instanceof Blockly.ToolboxCategory && item.isSelectable() && name === item.getName());
		if (category) {
			return category as Category;
		}
		return null;
	}

	selectCategoryByName(name: string) {
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

	getClientRect() {
		const flyout = this.getFlyout();
		if (flyout && !flyout.autoClose) {
			return flyout.getClientRect();
		}
		return super.getClientRect();
	}
}
