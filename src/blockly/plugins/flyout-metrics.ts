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
import type {Flyout} from "./flyout";

export class FlyoutMetrics extends Blockly.FlyoutMetricsManager {
	constructor(workspace: Blockly.WorkspaceSvg, flyout: Flyout) {
		super(workspace, flyout);
	}

	getScrollMetrics(
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
}

export interface FlyoutMetrics {
	flyout_: Flyout;
}
