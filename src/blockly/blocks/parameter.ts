/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Defines the parameter mutator.
 * @copyright Tomáš Wróbel 2025
 *
 * This mutator is used to update the type of the parameter block.
 * The parameter block is:
 * - a variable getter
 * - a block created by FieldParam, see fields/field_param.ts
 */
import {app} from "@scrap/types/App.svelte";
import type {Check} from "@scrap/types/Check";
import {CustomBlock} from "@scrap/utils/CustomBlock";
import type {ContextMenuRegistry} from "blockly/core";

export default new CustomBlock({
	type_: "any" as Check | null,
	isVariable_: false,
	isConstant_: false,

	saveExtraState() {
		return {
			type: this.type_,
			isVariable: this.isVariable_,
			isConstant: this.isConstant_,
		};
	},

	loadExtraState(state: {type?: Check; isVariable?: boolean; isConstant?: boolean}) {
		this.type_ = state.type || "any";
		this.isVariable_ = state.isVariable || false;
		this.isConstant_ = state.isConstant || false;

		if (this.isConstant_) {
			this.setOutput(true, this.type_);
		} else {
			const type = this.type_;

			if (!type) {
				this.setOutput(true, ["any", "Variable"]);
			} else if (Array.isArray(type)) {
				this.setOutput(true, [...type, "Variable"]);
			} else {
				this.setOutput(true, [type, "Variable"]);
			}
		}
	},

	customContextMenu(options: ContextMenuRegistry.LegacyContextMenuOption[]) {
		if (this.isInFlyout && this.isVariable_) {
			options.push({
				text: "Delete variable",
				enabled: true,
				callback: async () => {
					if (
						await app.dialog.fire({
							title: "Delete Variable",
							body: "Are you sure you want to delete this variable?",
							cancelButton: "No",
							confirmButton: "Yes",
						})
					) {
						const index = app.current.variables.findIndex(
							([name]) => name === this.getFieldValue("VAR"),
						);

						if (index !== -1) {
							app.current.variables.splice(index, 1);
							this.workspace.refreshToolboxSelection();
						}
					}
				},
			});
		}
	},
});
