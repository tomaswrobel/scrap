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

export class Metrics extends Blockly.MetricsManager {
	constructor(workspace: Blockly.WorkspaceSvg) {
		super(workspace);
	}

	getViewMetrics(getWorkspaceCoordinates = undefined) {
		const scale = getWorkspaceCoordinates ? this.workspace_.scale : 1;
		const svgMetrics = this.getSvgMetrics();
		const toolboxMetrics = this.getToolboxMetrics();
		const flyoutMetrics = this.getFlyoutMetrics(false);
		const toolboxPosition = toolboxMetrics.position;

		if (this.workspace_.getToolbox()) {
			// Note: Not actually supported at this time due to ContinunousToolbox
			// only supporting a vertical flyout. But included for completeness.
			if (toolboxPosition == Blockly.TOOLBOX_AT_TOP || toolboxPosition == Blockly.TOOLBOX_AT_BOTTOM) {
				svgMetrics.height -= toolboxMetrics.height + flyoutMetrics.height;
			} else if (toolboxPosition == Blockly.TOOLBOX_AT_LEFT || toolboxPosition == Blockly.TOOLBOX_AT_RIGHT) {
				svgMetrics.width -= toolboxMetrics.width + flyoutMetrics.width;
			}
		}
		return {
			height: svgMetrics.height / scale,
			width: svgMetrics.width / scale,
			top: -this.workspace_.scrollY / scale,
			left: -this.workspace_.scrollX / scale,
		};
	}

	getAbsoluteMetrics() {
		const toolboxMetrics = this.getToolboxMetrics();
		const flyoutMetrics = this.getFlyoutMetrics(false);
		const toolboxPosition = toolboxMetrics.position;
		let absoluteLeft = 0;

		if (this.workspace_.getToolbox() && toolboxPosition == Blockly.TOOLBOX_AT_LEFT) {
			absoluteLeft = toolboxMetrics.width + flyoutMetrics.width;
		}
		let absoluteTop = 0;
		if (this.workspace_.getToolbox() && toolboxPosition == Blockly.TOOLBOX_AT_TOP) {
			absoluteTop = toolboxMetrics.height + flyoutMetrics.height;
		}
		return {
			top: absoluteTop,
			left: absoluteLeft,
		};
	}
}
