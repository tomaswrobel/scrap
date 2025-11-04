/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license Apache-2.0
 * @copyright Google LLC 2025
 * @fileoverview Defines the if mutator.
 *
 * This mutator is taken from Blockly's built-in controls_if block.
 * The original isn't used only because of bundle size.
 */
import {assert} from "@scrap/utils/assert";
import {CustomBlock} from "@scrap/utils/CustomBlock.ts";
import * as Blockly from "blockly/core";

export interface IfExtraState {
	elseIfCount?: number;
	hasElse?: boolean;
}

export default new CustomBlock(
	{
		elseIfCount: 0,
		hasElse: false,
		valueConnections: {} as Record<string, Blockly.Connection | undefined>,
		statementConnections: {} as Record<string, Blockly.Connection | undefined>,

		/**
		 * Returns the state of this block as a JSON serializable object.
		 *
		 * @returns The state of this block, ie the else if count and else state.
		 */
		saveExtraState(): IfExtraState | null {
			if (!this.elseIfCount && !this.hasElse) {
				return null;
			}
			const state = Object.create(null);
			if (this.elseIfCount) {
				state.elseIfCount = this.elseIfCount;
			}
			if (this.hasElse) {
				state.hasElse = true;
			}
			return state;
		},
		/**
		 * Applies the given state to this block.
		 *
		 * @param state The state to apply to this block, ie the else if count and else state.
		 */
		loadExtraState(state: IfExtraState) {
			this.elseIfCount = state.elseIfCount ?? 0;
			this.hasElse = state.hasElse ?? false;
			this.updateShape();
		},
		/**
		 * Populate the mutator's dialog with this block's components.
		 *
		 * @param workspace MutatorIcon's workspace.
		 * @returns Root block in mutator.
		 */
		decompose(workspace: Blockly.WorkspaceSvg) {
			const containerBlock = workspace.newBlock("controls_if_if");
			containerBlock.initSvg();
			let connection = containerBlock.nextConnection;
			for (let i = 1; i <= this.elseIfCount; i++) {
				const elseifBlock = workspace.newBlock("controls_if_elseif");
				elseifBlock.initSvg();
				connection.connect(elseifBlock.previousConnection);
				connection = elseifBlock.nextConnection;
			}
			if (this.hasElse) {
				const elseBlock = workspace.newBlock("controls_if_else");
				elseBlock.initSvg();
				connection.connect(elseBlock.previousConnection);
			}
			return containerBlock;
		},
		/**
		 * Reconfigure this block based on the mutator dialog's components.
		 *
		 * @param containerBlock Root block in mutator.
		 */
		compose(containerBlock: Blockly.Block) {
			let clauseBlock = containerBlock.nextConnection?.targetBlock();
			// Count number of inputs.
			this.elseIfCount = 0;
			this.hasElse = false;

			const valueConnections: (Blockly.Connection | undefined)[] = [];
			const statementConnections: (Blockly.Connection | undefined)[] = [];
			let elseStatementConnection: Blockly.Connection | undefined;

			while (clauseBlock) {
				if (clauseBlock.isInsertionMarker()) {
					clauseBlock = clauseBlock.getNextBlock();
					continue;
				}
				switch (clauseBlock.type) {
					case "controls_if_elseif":
						this.elseIfCount++;
						valueConnections.push(this.valueConnections[clauseBlock.id]);
						statementConnections.push(this.valueConnections[clauseBlock.id]);
						break;
					case "controls_if_else":
						assert(!this.hasElse, "Duplicate else block");
						this.hasElse = true;
						elseStatementConnection = this.statementConnections[clauseBlock.id];
						break;
					default:
						throw TypeError(`Unknown block type: ${clauseBlock.type}`);
				}
				clauseBlock = clauseBlock.getNextBlock();
			}
			this.updateShape();
			// Reconnect any child blocks.
			this.reconnectChildBlocks(
				valueConnections,
				statementConnections,
				elseStatementConnection,
			);
		},
		/**
		 * Store pointers to any connected child blocks.
		 *
		 * @param containerBlock Root block in mutator.
		 */
		saveConnections({nextConnection}: Blockly.Block) {
			for (
				let i = 1, block = nextConnection?.targetBlock();
				block;
				block = block.getNextBlock()
			) {
				if (block.isInsertionMarker()) {
					continue;
				}
				switch (block.type) {
					case "controls_if_elseif": {
						const inputIf = this.getInput(`IF${i}`);
						const inputDo = this.getInput(`DO${i}`);
						assert(inputIf?.connection && inputDo?.connection, "Invalid if block");
						this.valueConnections[block.id] =
							inputIf.connection.targetConnection ?? undefined;
						this.statementConnections[block.id] =
							inputDo.connection.targetConnection ?? undefined;
						i++;
						break;
					}
					case "controls_if_else": {
						const inputDo = this.getInput("ELSE");
						assert(inputDo?.connection, "Invalid if block");
						this.statementConnections[block.id] =
							inputDo.connection.targetConnection ?? undefined;
						break;
					}
					default:
						throw TypeError(`Unknown block type: ${block.type}`);
				}
			}
		},
		/**
		 * Reconstructs the block with all child blocks attached.
		 */
		rebuildShape() {
			const valueConnections: (Blockly.Connection | undefined)[] = [undefined];
			const statementConnections: (Blockly.Connection | undefined)[] = [undefined];
			let elseStatementConnection =
				this.getInput("ELSE")?.connection?.targetConnection ?? undefined;

			for (let i = 1; this.getInput(`IF${i}`); i++) {
				const inputIf = this.getInput(`IF${i}`);
				const inputDo = this.getInput(`DO${i}`);
				assert(inputIf?.connection && inputDo?.connection, "Invalid if block");
				valueConnections.push(inputIf.connection.targetConnection ?? undefined);
				statementConnections.push(inputDo.connection.targetConnection ?? undefined);
			}
			this.updateShape();
			this.reconnectChildBlocks(
				valueConnections,
				statementConnections,
				elseStatementConnection,
			);
		},
		/**
		 * Modify this block to have the correct number of inputs.)
		 */
		updateShape() {
			// Delete everything.
			if (this.getInput("ELSE")) {
				this.removeInput("ELSE");
				this.removeInput("ELSE0");
			}
			for (let i = 1; this.getInput(`IF${i}`); i++) {
				this.removeInput(`IF${i}`);
				this.removeInput(`DO${i}`);
			}
			// Rebuild block.
			for (let i = 1; i <= this.elseIfCount; i++) {
				this.appendValueInput(`IF${i}`)
					.setCheck("boolean")
					.appendField(Blockly.Msg.CONTROLS_IF_MSG_ELSEIF);
				this.appendStatementInput(`DO${i}`).setCheck("any");
			}
			if (this.hasElse) {
				this.appendDummyInput("ELSE0").appendField(Blockly.Msg.CONTROLS_IF_MSG_ELSE);
				this.appendStatementInput("ELSE").setCheck("any");
			}
		},
		/**
		 * Reconnects child blocks.
		 */
		reconnectChildBlocks(
			valueConnections: (Blockly.Connection | undefined)[],
			statementConnections: (Blockly.Connection | undefined)[],
			elseStatementConnection?: Blockly.Connection,
		) {
			for (let i = 0; i <= this.elseIfCount; i++) {
				valueConnections[i]?.reconnect(this, `IF${i + 1}`);
				statementConnections[i]?.reconnect(this, `DO${i + 1}`);
			}
			elseStatementConnection?.reconnect(this, "ELSE");
		},
	},
	["controls_if_elseif", "controls_if_else"],
);
