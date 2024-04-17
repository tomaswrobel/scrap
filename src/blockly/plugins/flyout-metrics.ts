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
