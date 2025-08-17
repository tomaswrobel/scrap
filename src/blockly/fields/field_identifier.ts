/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2025
 * @fileoverview Custom Blockly field for valid JS identifier.
 */
import * as Blockly from "blockly/core";
import {reservedWords} from "@scrap/code-transformers/utils";

export default class FieldIdentifier extends Blockly.FieldTextInput {
	public onFinish?: (result: string) => void;

	public static override fromJson(options: Record<string, unknown>) {
		return new FieldIdentifier(options.value as string);
	}

	protected override doClassValidation_(value: string) {
		const banned = [...reservedWords];

		if (this.sourceBlock_?.type.startsWith("function")) {
			for (const block of this.sourceBlock_.workspace.getBlocksByType(this.sourceBlock_.type)) {
				if (block !== this.sourceBlock_) {
					banned.push(block.getFieldValue("NAME"));
				}
			}
		}

		if (value) {
			const name = value.replace(/ /g, "_");
			for (var i = 0; banned.includes(`${name}${i || ""}`); i++);
			if (/[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*/u.test(`${name}${i || ""}`)) {
				return `${name}${i || ""}`;
			}
		}

		return null;
	}

	public override onFinishEditing_(value: string) {
		super.onFinishEditing_(value);
		this.onFinish?.(value);
	}

	protected override spellcheck_ = false;
}
