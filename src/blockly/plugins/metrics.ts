/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license Apache-2.0
 * @author Google LLC
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * 
 * From: @blockly/continuous-toolbox@1.0.5
 * To: TypeScript, Scrap modifications
 */
import * as Blockly from "blockly";

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
