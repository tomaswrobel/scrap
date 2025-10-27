/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Replace default Blockly variable category
 * @copyright Tomáš Wróbel 2025
 */
import type * as Blockly from "blockly/core";
import {app} from "@scrap/types/App.svelte.ts";
import type {Variable} from "@scrap/types/Variable.ts";
import {TypeToShadowMap} from "./TypeToShadowMap.ts";
import {ScrapTypes} from "./ScrapTypes.ts";

export function createVariableCategory(workspace: Blockly.WorkspaceSvg) {
	workspace.registerButtonCallback("createVariableButton", async () => {
		const name = await app.dialog.fire({
			type: "text",
			title: "Create Variable",
			body: entity.isStage
				? "You are creating a global variable."
				: "To create a global variable, select the stage.",
		});

		if (name === false) {
			return;
		}

		const type = await app.dialog.fire({
			type: "select",
			inputOptions: ScrapTypes.reduce(
				(acc, type) => ({...acc, [type]: type || "any"}),
				{},
			),
			title: "Create Variable",
			body: "Type:",
		});

		if (type === false) {
			return;
		}

		entity.variables.push([name, type]);
		workspace.refreshToolboxSelection();
	});

	const entity = app.current;

	const json = ["const", "let", "var"].map<Blockly.utils.toolbox.FlyoutItemInfo>(
		(kind, i) => ({
			kind: "block",
			type: "variable",
			fields: {kind},
			inputs: {
				VAR: {
					block: {
						type: "typed",
						inputs: {
							TYPE: {
								shadow: {
									type: "type",
									fields: {
										TYPE: "number",
									},
								},
							},
						},
						fields: {
							PARAM: String.fromCharCode(65 + i),
						},
					},
				},
				VALUE: {
					shadow: {
						type: "math_number",
						fields: {
							NUM: i + 1,
						},
					},
				},
			},
		}),
	);

	json.push(
		{
			kind: "sep",
			gap: 40,
		},
		{
			kind: "button",
			text: "Create Variable",
			callbackkey: "createVariableButton",
		},
	);

	function addVariable([name, type]: Variable) {
		json.push({
			kind: "block",
			type: "parameter",
			fields: {
				VAR: name,
			},
			extraState: {
				type,
				isVariable: true,
			},
		});
	}

	entity.variables.forEach(addVariable);

	if (!entity.isStage) {
		app.stage.variables.forEach(addVariable);
	}

	if (json.length > 5) {
		const [VAR, type] = entity.variables[0] ?? app.stage.variables[0] ?? [];
		const inputs: Record<string, Blockly.serialization.blocks.ConnectionState> = {};

		if (!VAR) {
			return json;
		}

		inputs.VAR = {
			shadow: {
				type: "parameter",
				fields: {
					VAR,
				},
				extraState: {
					type,
					isVariable: true,
				},
			},
		};

		const shadow =
			typeof type === "string"
				? TypeToShadowMap[type]
				: type.length === 1
					? TypeToShadowMap[type[0]]
					: TypeToShadowMap.any;
		if (shadow) {
			inputs.VALUE = {shadow: {type: shadow}};
		}

		json.splice(
			5,
			0,
			{
				kind: "block",
				type: "set",
				inputs,
			},
			{
				kind: "block",
				type: "change",
				inputs: {
					VAR: {
						shadow: {
							type: "parameter",
							fields: {
								VAR,
							},
							extraState: {
								type,
								isVariable: true,
							},
						},
					},
					VALUE: {
						shadow: {
							type: "math_number",
							fields: {
								NUM: "1",
							},
						},
					},
				},
			},
			{
				kind: "block",
				type: "showVariable",
				fields: {VAR},
			},
			{
				kind: "block",
				type: "hideVariable",
				fields: {VAR},
			},
		);
	}

	return json;
}
