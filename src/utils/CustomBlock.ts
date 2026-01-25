import * as Blockly from "blockly/core";
import {assert} from "@juvofy/lib/utils/assert";

export class CustomBlock<T extends object> {
	public mutatorBlocks?: string[];
	public name?: string;
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
		this.name = name;
	}

	public createIn(workspace: Blockly.Workspace, id?: string) {
		assert(this.name, "CustomBlock wasn't registered");
		return workspace.newBlock(this.name, id) as Blockly.BlockSvg & T;
	}
}

export declare namespace CustomBlock {
	export type Infer<T> =
		T extends CustomBlock<infer U> ? Blockly.BlockSvg & U : Blockly.Block;
}
