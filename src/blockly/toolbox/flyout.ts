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
import type {Toolbox} from "./toolbox";
import {FlyoutMetrics} from "./flyout-metrics";
import {bind} from "../../decorators";


export class Flyout extends Blockly.VerticalFlyout {
	scrollPositions: {name: string; position: {x: number; y: number}}[] = [];
	scrollTarget: number | null = null;
	private recyclingEnabled_ = false;
	scrollAnimationFraction = 0.3;

	constructor(workspaceOptions: Blockly.Options) {
		super(workspaceOptions);

		this.workspace_.setMetricsManager(new FlyoutMetrics(this.workspace_, this));

		this.workspace_.addChangeListener(e => {
			if (e.type === Blockly.Events.VIEWPORT_CHANGE) {
				this.selectCategoryByScrollPosition_(-this.workspace_.scrollY);
			}
		});

		this.autoClose = false;
	}

	getParentToolbox_() {
		const toolbox = this.targetWorkspace.getToolbox();
		return toolbox as Toolbox;
	}

	recordScrollPositions() {
		this.scrollPositions = [];
		const categoryLabels = this.buttons_.filter(button => button.isLabel() && this.getParentToolbox_().getCategoryByName(button.getButtonText()));
		for (const button of categoryLabels) {
			if (button.isLabel()) {
				this.scrollPositions.push({
					name: button.getButtonText(),
					position: button.getPosition(),
				});
			}
		}
	}

	getCategoryScrollPosition(name: string) {
		for (const scrollInfo of this.scrollPositions) {
			if (scrollInfo.name === name) {
				return scrollInfo.position;
			}
		}
		console.warn(`Scroll position not recorded for category ${name}`);
		return null;
	}

	selectCategoryByScrollPosition_(position: number) {
		// If we are currently auto-scrolling, due to selecting a category by
		// clicking on it, do not update the category selection.
		if (this.scrollTarget) {
			return;
		}
		const scaledPosition = Math.round(position / this.workspace_.scale);
		// Traverse the array of scroll positions in reverse, so we can select the
		// furthest category that the scroll position is beyond.
		for (let i = this.scrollPositions.length - 1; i >= 0; i--) {
			const category = this.scrollPositions[i];
			if (scaledPosition >= category.position.y) {
				this.getParentToolbox_().selectCategoryByName(category.name);
				return;
			}
		}
	}

	scrollTo(position: number) {
		// Set the scroll target to either the scaled position or the lowest
		// possible scroll point, whichever is smaller.
		const metrics = this.workspace_.getMetrics();
		this.scrollTarget = Math.min(position * this.workspace_.scale, metrics.scrollHeight - metrics.viewHeight);

		this.stepScrollAnimation();
	}

	@bind
	stepScrollAnimation() {
		if (!this.scrollTarget) {
			return;
		}

		const currentScrollPos = -this.workspace_.scrollY;
		const diff = this.scrollTarget - currentScrollPos;
		if (Math.abs(diff) < 1) {
			this.workspace_.scrollbar!.setY(this.scrollTarget);
			this.scrollTarget = null;
			return;
		}
		this.workspace_.scrollbar!.setY(currentScrollPos + diff * this.scrollAnimationFraction);

		requestAnimationFrame(this.stepScrollAnimation);
	}

	calculateBottomPadding(
		contentMetrics: {
			height: number;
			width: number;
			top: number;
			left: number;
		},
		viewMetrics: Blockly.MetricsManager.ContainerRegion
	) {
		if (this.scrollPositions.length > 0) {
			const lastCategory = this.scrollPositions[this.scrollPositions.length - 1];
			const lastPosition = lastCategory.position.y * this.workspace_.scale;
			const lastCategoryHeight = contentMetrics.height - lastPosition;
			if (lastCategoryHeight < viewMetrics.height) {
				return viewMetrics.height - lastCategoryHeight;
			}
		}
		return 0;
	}

	/** @override */
	getX() {
		if (
			this.isVisible() &&
			this.targetWorkspace.toolboxPosition === this.toolboxPosition_ &&
			this.targetWorkspace.getToolbox() &&
			this.toolboxPosition_ !== Blockly.utils.toolbox.Position.LEFT
		) {
			// This makes it so blocks cannot go under the flyout in RTL mode.
			return this.targetWorkspace.getMetricsManager().getViewMetrics().width;
		}

		return super.getX();
	}

	override show(flyoutDef: Blockly.utils.toolbox.FlyoutDefinition) {
        super.show(flyoutDef);
		this.recordScrollPositions();
		this.workspace_.resizeContents();
	}

	blockIsRecyclable_(block: Blockly.BlockSvg) {
		if (!this.recyclingEnabled_) {
			return false;
		}

		// If the block needs to parse mutations, never recycle.
		if (block.mutationToDom && block.domToMutation) {
			return false;
		}

		for (const input of block.inputList) {
			for (const field of input.fieldRow) {
				// No variables.
				if (field instanceof Blockly.FieldVariable) {
					return false;
				}
				if (field instanceof Blockly.FieldDropdown) {
					if (field.isOptionListDynamic()) {
						return false;
					}
				}
			}
			// Check children.
			if (input.connection) {
				const targetBlock = input.connection.targetBlock() as Blockly.BlockSvg;
				if (targetBlock && !this.blockIsRecyclable_(targetBlock)) {
					return false;
				}
			}
		}
		return true;
	}

	setBlockIsRecyclable(func: (block: Blockly.BlockSvg) => boolean) {
		this.blockIsRecyclable_ = func;
	}

	setRecyclingEnabled(isEnabled: boolean) {
		this.recyclingEnabled_ = isEnabled;
	}
}
