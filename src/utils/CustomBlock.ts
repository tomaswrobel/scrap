import * as Blockly from "blockly/core";
import {assert} from "@juvofy/lib/utils/assert";

export class CustomBlock<T extends object> {
	public mutatorBlocks?: string[];
	public name?: string;
	public mixin: T;
	/**
	 * Name of the category (ie the block style, matching a filename in
	 * `./data/categories/`) this block belongs to, if any. Blocks with a
	 * `category` and their own `init` get styled automatically on
	 * registration, and are merged into that category's `blocks` in
	 * `@scrap/blockly`, so consumers like the Monaco theme/tokenizer and the
	 * docs pages pick them up without listing them by hand.
	 */
	public category?: string;

	constructor(mixin: ThisType<Blockly.BlockSvg & T> & T, mutatorBlocks?: string[]) {
		this.mutatorBlocks = mutatorBlocks;
		this.mixin = mixin;

		if (
			typeof mixin === "object" &&
			"category" in mixin &&
			typeof mixin.category === "string"
		) {
			this.category = mixin.category;
		}
	}

	public register(name: string) {
		if ("init" in this.mixin) {
			const mixin = this.mixin as {init(this: Blockly.BlockSvg): void};

			if (this.category) {
				const {init} = mixin;
				const {category} = this;
				mixin.init = function () {
					init.call(this);
					this.setStyle(category);
				};
			}

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
