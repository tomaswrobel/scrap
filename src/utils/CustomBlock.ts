import * as Blockly from "blockly/core";

export class CustomBlock<T extends object> {
	public mutatorBlocks?: string[];
	public mixin: T;

	constructor(mixin: ThisType<Blockly.BlockSvg & T> & T, mutatorBlocks?: string[]) {
		this.mutatorBlocks = mutatorBlocks;
		this.mixin = mixin;
	}

	public register(name: string) {
		if ("init" in this.mixin) {
			Blockly.Blocks[name] = this.mixin;
		} else {
			Blockly.Extensions.registerMutator(name, this.mixin, undefined, this.mutatorBlocks);
		}
	}
}

export declare namespace CustomBlock {
	type Infer<T> = T extends CustomBlock<infer U> ? Blockly.BlockSvg & U : Blockly.Block;
}
