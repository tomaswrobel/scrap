/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2025
 * @fileoverview Runtime library for Scrap.
 *
 * This file defines necessary runtime for TypeScript to succeed in
 * compiling the Scrap code. All the types get replaced with actual
 * values at Scrap runtime, see `src/code/lib/runtime.ts` for more info.
 */

/**
 * Reference to the current sprite (stage)
 */
declare const self: Stage;

/**
 * Sprite database
 *
 * Example:
 *
 * ```typescript
 * self.goTowards($["Scrappy"]);
 * ```
 */
declare const $: {
	[x: string]: Sprite;
} & {
	Stage: Stage;
};

declare type Backdrop = never;
