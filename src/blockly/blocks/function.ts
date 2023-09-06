import * as Blockly from "blockly/core";
import {Types} from "../utils/types";
import ProcedureBlock from "../utils/procedure_block";

export default <Partial<ProcedureBlock>>{
	params: [],

	init(this: ProcedureBlock) {
		this.inputsInline = true;
		this.setNextStatement(true, null);
		this.setStyle("procedure_blocks");
		this.setCommentText("Describe this function...");
		this.appendDummyInput("DUMMY")
			.appendField(new Blockly.FieldDropdown(Types.map(type => [type || "void", type] as [string, string])), "TYPE")
			.appendField("function", "label")
			.appendField(new Blockly.FieldTextInput("foo"), "NAME");
		this.setMutator(
			new Blockly.icons.MutatorIcon(
				Types.map(type => "function_param_" + type),
				this
			)
		);
	},
	saveExtraState(this: ProcedureBlock) {
		return {
			name: this.getFieldValue("NAME"),
			returnType: this.getFieldValue("TYPE"),
			params: this.params,
		};
	},
	loadExtraState(this: ProcedureBlock, state: any) {
		this.params = state.params;
		const input = this.getInput("DUMMY")!;
		this.setFieldValue(state.name, "NAME");
		if (!this.getField("TYPE")) {
			input.insertFieldAt(0, new Blockly.FieldDropdown(Types.map(type => [type || "void", type] as [string, string])), "TYPE");
		}

		this.setFieldValue("function", "label");
		this.setFieldValue(state.returnType, "TYPE");

		this.updateShape();
	},
	compose(this: ProcedureBlock, topBlock: Blockly.Block) {
		this.params = [];

		for (let block = topBlock.getNextBlock(), i = 0; block; block = block.getNextBlock(), i++) {
			const check = block.type.slice("function_param_".length);
			const name = block.getFieldValue("NAME");
			this.params.push({type: check, name});
		}

		this.updateShape();
	},
	decompose(this: ProcedureBlock, ws: Blockly.Workspace) {
		const workspace = ws as Blockly.WorkspaceSvg;
		const containerBlock = workspace.newBlock("function_header");
		containerBlock.initSvg?.();
		let connection = containerBlock.nextConnection;

		for (const {name, type} of this.params) {
			const block = workspace.newBlock("function_param_" + type);
			block.initSvg?.();
			block.setFieldValue(name, "NAME");
			connection.connect(block.previousConnection);
			connection = block.nextConnection;
		}

		return containerBlock;
	},
	updateShape(this: ProcedureBlock) {
		const input = this.getInput("DUMMY")!;

		for (let i = 0; input.removeField("PARAM_" + i, true); i++);

		for (let i = 0; i < this.params.length; i++) {
			input.appendField(
				Blockly.fieldRegistry.fromJson({
					type: "field_param",
					var: this.params[i].name,
					varType: this.params[i].type,
				})!,
				`PARAM_${i}`
			);
		}
	},
};
