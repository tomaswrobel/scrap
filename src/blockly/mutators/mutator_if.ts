import * as Blockly from "blockly/core";

export type IfExtraState = {
	elseIfCount?: number;
	hasElse?: boolean;
};

export type IfBlock = Blockly.Block & IfMixin;
export interface IfMixin extends IfMixinType {}
export type IfMixinType = typeof MIXIN;

/** Type of a controls_if_elseif or controls_if_else block. */
export interface ClauseBlock extends Blockly.Block {
	valueConnection_?: Blockly.Connection | null;
	statementConnection_?: Blockly.Connection | null;
}

export const MIXIN = {
	elseifCount_: 0,
	elseCount_: 0,

	/**
	 * Returns the state of this block as a JSON serializable object.
	 *
	 * @returns The state of this block, ie the else if count and else state.
	 */
	saveExtraState(this: IfBlock): IfExtraState | null {
		if (!this.elseifCount_ && !this.elseCount_) {
			return null;
		}
		const state = Object.create(null);
		if (this.elseifCount_) {
			state["elseIfCount"] = this.elseifCount_;
		}
		if (this.elseCount_) {
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
		this.elseifCount_ = state["elseIfCount"] || 0;
		this.elseCount_ = state["hasElse"] ? 1 : 0;
		this.updateShape_();
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
		for (let i = 1; i <= this.elseifCount_; i++) {
			const elseifBlock = workspace.newBlock("controls_if_elseif");
			elseifBlock.initSvg();
			connection.connect(elseifBlock.previousConnection!);
			connection = elseifBlock.nextConnection!;
		}
		if (this.elseCount_) {
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
		this.elseifCount_ = 0;
		this.elseCount_ = 0;
		// Connections arrays are passed to .reconnectChildBlocks_() which
		// takes 1-based arrays, so are initialised with a dummy value at
		// index 0 for convenience.
		const valueConnections: Array<Blockly.Connection | null> = [null];
		const statementConnections: Array<Blockly.Connection | null> = [null];
		let elseStatementConnection: Blockly.Connection | null = null;
		while (clauseBlock) {
			if (clauseBlock.isInsertionMarker()) {
				clauseBlock = clauseBlock.getNextBlock() as ClauseBlock | null;
				continue;
			}
			switch (clauseBlock.type) {
				case "controls_if_elseif":
					this.elseifCount_++;
					valueConnections.push(clauseBlock.valueConnection_!);
					statementConnections.push(clauseBlock.statementConnection_!);
					break;
				case "controls_if_else":
					this.elseCount_++;
					elseStatementConnection = clauseBlock.statementConnection_!;
					break;
				default:
					throw TypeError("Unknown block type: " + clauseBlock.type);
			}
			clauseBlock = clauseBlock.getNextBlock() as ClauseBlock | null;
		}
		this.updateShape_();
		// Reconnect any child blocks.
		this.reconnectChildBlocks_(valueConnections, statementConnections, elseStatementConnection);
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
					clauseBlock.valueConnection_ = inputIf && inputIf.connection!.targetConnection;
					clauseBlock.statementConnection_ = inputDo && inputDo.connection!.targetConnection;
					i++;
					break;
				}
				case "controls_if_else": {
					const inputDo = this.getInput("ELSE");
					clauseBlock.statementConnection_ = inputDo && inputDo.connection!.targetConnection;
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
	rebuildShape_(this: IfBlock) {
		const valueConnections: Array<Blockly.Connection | null> = [null];
		const statementConnections: Array<Blockly.Connection | null> = [null];
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
		this.updateShape_();
		this.reconnectChildBlocks_(valueConnections, statementConnections, elseStatementConnection);
	},
	/**
	 * Modify this block to have the correct number of inputs.
	 *
	 * @internal
	 */
	updateShape_(this: IfBlock) {
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
		for (let i = 1; i <= this.elseifCount_; i++) {
			this.appendValueInput("IF" + i)
				.setCheck("Boolean")
				.appendField(Blockly.Msg["CONTROLS_IF_MSG_ELSEIF"]);
			this.appendStatementInput("DO" + i);
		}
		if (this.elseCount_) {
			this.appendDummyInput("ELSE0").appendField(Blockly.Msg["CONTROLS_IF_MSG_ELSE"]);
			this.appendStatementInput("ELSE");
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
	reconnectChildBlocks_(
		this: IfBlock,
		valueConnections: Array<Blockly.Connection | null>,
		statementConnections: Array<Blockly.Connection | null>,
		elseStatementConnection: Blockly.Connection | null
	) {
		for (let i = 1; i <= this.elseifCount_; i++) {
			valueConnections[i]?.reconnect(this, "IF" + i);
			statementConnections[i]?.reconnect(this, "DO" + i);
		}
		elseStatementConnection?.reconnect(this, "ELSE");
	},
};

export const blocks = ["controls_if_if", "controls_if_elseif"];
