/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license Apache-2.0
 * @copyright Google LLC 2025
 *
 * From: @blockly/continuous-toolbox@1.0.5
 * To: TypeScript, Scrap modifications
 */
import * as Blockly from "blockly";
import type {Flyout} from "./flyout";

export class FlyoutMetrics extends Blockly.FlyoutMetricsManager {
	constructor(workspace: Blockly.WorkspaceSvg, flyout: Flyout) {
		super(workspace, flyout);
	}

	public override getScrollMetrics(
		getWorkspaceCoordinates?: boolean,
		cachedViewMetrics?: Blockly.MetricsManager.ContainerRegion,
		cachedContentMetrics?: Blockly.MetricsManager.ContainerRegion
	) {
		const scrollMetrics = super.getScrollMetrics(getWorkspaceCoordinates, cachedViewMetrics, cachedContentMetrics);
		const contentMetrics = cachedContentMetrics || this.getContentMetrics(getWorkspaceCoordinates);
		const viewMetrics = cachedViewMetrics || this.getViewMetrics(getWorkspaceCoordinates);

		if (scrollMetrics) {
			scrollMetrics.height += this.flyout_.calculateBottomPadding(contentMetrics, viewMetrics);
		}
		return scrollMetrics;
	}

	protected declare flyout_: Flyout;
}
