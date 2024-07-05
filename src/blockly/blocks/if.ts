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
 * @fileoverview Defines the if mutator.
 * 
 * This mutator is taken from Blockly's built-in controls_if block.
 * The original isn't used only because of bundle size.
 */
import * as Blockly from "blockly";

export type IfExtraState = {
	elseIfCount?: number;
	hasElse?: boolean;
};

export type IfBlock = Blockly.Block & IfMixin;
export interface IfMixin extends IfMixinType {}
export type IfMixinType = typeof MIXIN;

/** Type of a controls_if_elseif or controls_if_else block. */
export interface ClauseBlock extends Blockly.Block {
	valueConnection?: Blockly.Connection | null;
	statementConnection?: Blockly.Connection | null;
}

export const MIXIN = {
	elseifCount: 0,
	elseCount: 0,

	/**
	 * Returns the state of this block as a JSON serializable object.
	 *
	 * @returns The state of this block, ie the else if count and else state.
	 */
	saveExtraState(this: IfBlock): IfExtraState | null {
		if (!this.elseifCount && !this.elseCount) {
			return null;
		}
		const state = Object.create(null);
		if (this.elseifCount) {
			state["elseIfCount"] = this.elseifCount;
		}
		if (this.elseCount) {
			state["hasElse"] = true;
		}
		return state;
	},
	/**
	 * Applies the given state to this block.
	 *
	 * @param state The state to apply to this block, ie the else if count
	 and
	 *     else state.
	 */
	loadExtraState(this: IfBlock, state: IfExtraState) {
		this.elseifCount = state["elseIfCount"] || 0;
		this.elseCount = state["hasElse"] ? 1 : 0;
		this.updateShape();
	},
	/**
	 * Populate the mutator's dialog with this block's components.
	 *
	 * @param workspace MutatorIcon's workspace.
	 * @returns Root block in mutator.
	 */
	decompose(this: IfBlock, workspace: Blockly.WorkspaceSvg) {
		const containerBlock = workspace.newBlock("controls_if_if");
		containerBlock.initSvg();
		let connection = containerBlock.nextConnection!;
		for (let i = 1; i <= this.elseifCount; i++) {
			const elseifBlock = workspace.newBlock("controls_if_elseif");
			elseifBlock.initSvg();
			connection.connect(elseifBlock.previousConnection!);
			connection = elseifBlock.nextConnection!;
		}
		if (this.elseCount) {
			const elseBlock = workspace.newBlock("controls_if_else");
			elseBlock.initSvg();
			connection.connect(elseBlock.previousConnection!);
		}
		return containerBlock;
	},
	/**
	 * Reconfigure this block based on the mutator dialog's components.
	 *
	 * @param containerBlock Root block in mutator.
	 */
	compose(this: IfBlock, containerBlock: Blockly.Block) {
		let clauseBlock = containerBlock.nextConnection!.targetBlock() as ClauseBlock | null;
		// Count number of inputs.
		this.elseifCount = 0;
		this.elseCount = 0;
		// Connections arrays are passed to .reconnectChildBlocks() which
		// takes 1-based arrays, so are initialised with a dummy value at
		// index 0 for convenience.
		const valueConnections: (Blockly.Connection | null)[] = [null];
		const statementConnections: (Blockly.Connection | null)[] = [null];
		let elseStatementConnection: Blockly.Connection | null = null;
		while (clauseBlock) {
			if (clauseBlock.isInsertionMarker()) {
				clauseBlock = clauseBlock.getNextBlock() as ClauseBlock | null;
				continue;
			}
			switch (clauseBlock.type) {
				case "controls_if_elseif":
					this.elseifCount++;
					valueConnections.push(clauseBlock.valueConnection!);
					statementConnections.push(clauseBlock.statementConnection!);
					break;
				case "controls_if_else":
					this.elseCount++;
					elseStatementConnection = clauseBlock.statementConnection!;
					break;
				default:
					throw TypeError("Unknown block type: " + clauseBlock.type);
			}
			clauseBlock = clauseBlock.getNextBlock() as ClauseBlock | null;
		}
		this.updateShape();
		// Reconnect any child blocks.
		this.reconnectChildBlocks(valueConnections, statementConnections, elseStatementConnection);
	},
	/**
	 * Store pointers to any connected child blocks.
	 *
	 * @param containerBlock Root block in mutator.
	 */
	saveConnections(this: IfBlock, containerBlock: Blockly.Block) {
		let clauseBlock = containerBlock!.nextConnection!.targetBlock() as ClauseBlock | null;
		let i = 1;
		while (clauseBlock) {
			if (clauseBlock.isInsertionMarker()) {
				clauseBlock = clauseBlock.getNextBlock() as ClauseBlock | null;
				continue;
			}
			switch (clauseBlock.type) {
				case "controls_if_elseif": {
					const inputIf = this.getInput("IF" + i);
					const inputDo = this.getInput("DO" + i);
					clauseBlock.valueConnection = inputIf && inputIf.connection!.targetConnection;
					clauseBlock.statementConnection = inputDo && inputDo.connection!.targetConnection;
					i++;
					break;
				}
				case "controls_if_else": {
					const inputDo = this.getInput("ELSE");
					clauseBlock.statementConnection = inputDo && inputDo.connection!.targetConnection;
					break;
				}
				default:
					throw TypeError("Unknown block type: " + clauseBlock.type);
			}
			clauseBlock = clauseBlock.getNextBlock() as ClauseBlock | null;
		}
	},
	/**
	 * Reconstructs the block with all child blocks attached.
	 */
	rebuildShape(this: IfBlock) {
		const valueConnections: (Blockly.Connection | null)[] = [null];
		const statementConnections: (Blockly.Connection | null)[] = [null];
		let elseStatementConnection: Blockly.Connection | null = null;

		if (this.getInput("ELSE")) {
			elseStatementConnection = this.getInput("ELSE")!.connection!.targetConnection;
		}
		for (let i = 1; this.getInput("IF" + i); i++) {
			const inputIf = this.getInput("IF" + i);
			const inputDo = this.getInput("DO" + i);
			valueConnections.push(inputIf!.connection!.targetConnection);
			statementConnections.push(inputDo!.connection!.targetConnection);
		}
		this.updateShape();
		this.reconnectChildBlocks(valueConnections, statementConnections, elseStatementConnection);
	},
	/**
	 * Modify this block to have the correct number of inputs.
	 *
	 * @internal
	 */
	updateShape(this: IfBlock) {
		// Delete everything.
		if (this.getInput("ELSE")) {
			this.removeInput("ELSE");
			this.removeInput("ELSE0");
		}
		for (let i = 1; this.getInput("IF" + i); i++) {
			this.removeInput("IF" + i);
			this.removeInput("DO" + i);
		}
		// Rebuild block.
		for (let i = 1; i <= this.elseifCount; i++) {
			this.appendValueInput("IF" + i)
				.setCheck("boolean")
				.appendField(Blockly.Msg["CONTROLS_IF_MSG_ELSEIF"]);
			this.appendStatementInput("DO" + i).setCheck("any");
		}
		if (this.elseCount) {
			this.appendDummyInput("ELSE0").appendField(Blockly.Msg["CONTROLS_IF_MSG_ELSE"]);
			this.appendStatementInput("ELSE").setCheck("any");
		}
	},
	/**
	 * Reconnects child blocks.
	 *
	 * @param valueConnections 1-based array of value connections for
	 *     'if' input.  Value at index [0] ignored.
	 * @param statementConnections 1-based array of statement
	 *     connections for 'do' input.  Value at index [0] ignored.
	 * @param elseStatementConnection Statement connection for else input.
	 */
	reconnectChildBlocks(
		this: IfBlock,
		valueConnections: (Blockly.Connection | null)[],
		statementConnections: (Blockly.Connection | null)[],
		elseStatementConnection: Blockly.Connection | null
	) {
		for (let i = 1; i <= this.elseifCount; i++) {
			valueConnections[i]?.reconnect(this, "IF" + i);
			statementConnections[i]?.reconnect(this, "DO" + i);
		}
		elseStatementConnection?.reconnect(this, "ELSE");
	},
};

export const blocks = ["controls_if_elseif", "controls_if_else"];
