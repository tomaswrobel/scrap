/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview Typings for the glob import
 * @copyright Tomáš Wróbel 2025
 */

/** The blocks modules. */
type blocks = {
	[name: string]: {
		/**
		 * The block definition
		 *
		 * If there is an `init` function,
		 * it's a dynamic block,
		 * mutator otherwise.
		 */
		MIXIN: {};

		/** The mutator's blocks. */
		blocks?: string[];

		/** There shouldn't be a default export. */
		default: never;
	};
};

export default require("../blocks/*.ts") as blocks;
